import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Share2, X } from "lucide-react";
import { ShareCard, type ShareTestType } from "./ShareCard";

type Props = {
  testType: ShareTestType;
  compositeScore: number;
  olqScores: Record<string, number>;
  onClose: () => void;
};

function formatDate(): string {
  return new Date()
    .toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

const CARD_SIZE = 1080;
const PREVIEW_SIZE = 324; // exactly 30% of 1080

export function ShareModal({ testType, compositeScore, olqScores, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const date = formatDate();
  const scale = PREVIEW_SIZE / CARD_SIZE;
  const filename = `forgessb-${testType.replace("_", "-")}-score.png`;

  async function generatePng(): Promise<string> {
    await document.fonts.ready;
    if (!cardRef.current) throw new Error("Card not ready");
    return toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
  }

  async function handleDownload() {
    setGenerating(true);
    setGenError(null);
    try {
      const dataUrl = await generatePng();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      a.click();
    } catch {
      setGenError("Could not generate image. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleShare() {
    setGenerating(true);
    setGenError(null);
    try {
      const dataUrl = await generatePng();
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "image/png" });
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ files: [file], title: "My ForgeSSB Score" });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename;
        a.click();
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setGenError("Share failed. Try downloading instead.");
      }
    } finally {
      setGenerating(false);
    }
  }

  const supportsShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md border border-border bg-surface-1"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
              Share Your Score
            </p>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Preview */}
          <div className="flex items-center justify-center bg-background py-8">
            <div
              style={{
                width: PREVIEW_SIZE,
                height: PREVIEW_SIZE,
                position: "relative",
                overflow: "hidden",
                flexShrink: 0,
                outline: "1px solid rgba(201,168,76,0.2)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  transformOrigin: "top left",
                  transform: `scale(${scale})`,
                  width: CARD_SIZE,
                  height: CARD_SIZE,
                  pointerEvents: "none",
                }}
              >
                <ShareCard
                  testType={testType}
                  compositeScore={compositeScore}
                  olqScores={olqScores}
                  date={date}
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {genError && (
            <p className="px-6 pb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-destructive">
              {genError}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 border-t border-border px-6 py-5 sm:flex-row">
            <button
              type="button"
              onClick={handleDownload}
              disabled={generating}
              className="inline-flex flex-1 items-center justify-center gap-2 border border-gold bg-gold/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-gold transition-all hover:bg-gold hover:text-primary-foreground disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {generating ? "Generating…" : "Download PNG"}
            </button>
            {supportsShare && (
              <button
                type="button"
                onClick={handleShare}
                disabled={generating}
                className="inline-flex flex-1 items-center justify-center gap-2 border border-border px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/80 transition-all hover:border-foreground/40 hover:text-foreground disabled:opacity-50"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden rasterization target — off-screen, not opacity:0 to avoid rendering quirks */}
      <div
        style={{
          position: "fixed",
          left: -9999,
          top: 0,
          width: CARD_SIZE,
          height: CARD_SIZE,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <ShareCard
          ref={cardRef}
          testType={testType}
          compositeScore={compositeScore}
          olqScores={olqScores}
          date={date}
        />
      </div>
    </>
  );
}
