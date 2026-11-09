// Browser-native speech. Speech-to-text uses the browser's SpeechRecognition
// (in Chrome this is processed by Google); text-to-speech uses speechSynthesis.
// Kept behind small functions so a hosted provider can replace either later.

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => Recognition) | null;
}

export function voiceInputSupported(): boolean {
  return recognitionCtor() !== null;
}

export function voiceOutputSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export type Listener = { stop: () => void };

export function startListening(opts: {
  onText: (finalText: string, interimText: string) => void;
  onError: (code: string) => void;
  onEnd: () => void;
}): Listener | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "en-IN";
  rec.continuous = true;
  rec.interimResults = true;

  let finalText = "";
  let stopped = false;
  let fatal = false;

  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript + " ";
      else interim += r[0].transcript;
    }
    opts.onText(finalText, interim);
  };
  rec.onerror = (e) => {
    if (e.error === "aborted") return;
    if (e.error !== "no-speech") fatal = true;
    opts.onError(e.error);
  };
  rec.onend = () => {
    // Browsers end recognition after a pause even in continuous mode; restart until the user stops.
    if (!stopped && !fatal) {
      try {
        rec.start();
        return;
      } catch {
        // fall through to end
      }
    }
    opts.onEnd();
  };

  try {
    rec.start();
  } catch {
    return null;
  }
  return {
    stop: () => {
      stopped = true;
      try {
        rec.stop();
      } catch {
        // already stopped
      }
    },
  };
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "en-IN") ??
    voices.find((v) => v.lang === "en-GB") ??
    voices.find((v) => v.lang.startsWith("en"))
  );
}

export function speak(text: string, onDone: () => void): () => void {
  if (!voiceOutputSupported()) {
    onDone();
    return () => {};
  }
  try {
    window.speechSynthesis.cancel();
  } catch {
    onDone();
    return () => {};
  }
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? "en-IN";
  u.rate = 0.95;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onDone();
  };
  u.onend = finish;
  u.onerror = finish;
  // Some browsers never fire onend for blocked or interrupted speech.
  const timeout = window.setTimeout(finish, Math.max(6000, text.length * 120));
  u.onend = () => {
    window.clearTimeout(timeout);
    finish();
  };
  try {
    window.speechSynthesis.speak(u);
  } catch {
    window.clearTimeout(timeout);
    finish();
  }
  return () => {
    done = true;
    window.clearTimeout(timeout);
    cancelSpeech();
  };
}

export function cancelSpeech() {
  try {
    if (voiceOutputSupported()) window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}
