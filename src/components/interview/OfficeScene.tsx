export const ROOM = {
  wall: "#ECE7DA",
  paper: "#F6F3EA",
  paperLight: "#FFFDF8",
  ink: "#1E1D1A",
  inkSoft: "#4A4740",
  inkMuted: "#5E5A51",
  rule: "#D9D2C1",
  ruleStrong: "#CFC7B4",
  baize: "#2B4637",
  khaki: "#C8B48A",
  tape: "#A8392D",
  wood: "#6A4A31",
  steel: "#9DA2A7",
  sans: "'Atkinson Hyperlegible', system-ui, sans-serif",
  typed: "'Courier Prime', ui-monospace, monospace",
} as const;

export type OfficerPose = "listening" | "writing";

function Officer({ pose }: { pose: OfficerPose }) {
  if (pose === "writing") {
    return (
      <svg viewBox="0 0 440 390" aria-hidden="true" className="h-auto w-full">
        <path d="M110 390 L110 120 Q110 96 134 96 L306 96 Q330 96 330 120 L330 390 Z" fill="#3A332B" />
        <path d="M58 390 C62 300 112 262 172 252 L274 252 C334 262 380 300 382 390 Z" fill="#2F312C" />
        <path d="M62 330 C68 292 98 268 138 258" stroke="#55574F" strokeWidth="2" fill="none" />
        <path d="M378 330 C372 292 342 268 302 258" stroke="#55574F" strokeWidth="2" fill="none" />
        <rect x="200" y="214" width="44" height="44" rx="12" fill="#2A2B27" />
        <path d="M226 110 C258 112 280 140 278 178 C276 220 252 244 222 242 C192 240 170 214 172 176 C174 138 196 108 226 110 Z" fill="#2A2B27" />
        <path d="M226 110 C258 112 280 140 278 178" stroke="#5B5D55" strokeWidth="2.5" fill="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 440 390" aria-hidden="true" className="h-auto w-full">
      <path d="M110 390 L110 120 Q110 96 134 96 L306 96 Q330 96 330 120 L330 390 Z" fill="#3A332B" />
      <path d="M62 390 C64 296 110 252 170 240 L270 240 C330 252 376 296 378 390 Z" fill="#2F312C" />
      <path d="M170 240 C182 236 196 234 220 234 C244 234 258 236 270 240" stroke="#55574F" strokeWidth="3" fill="none" />
      <path d="M64 330 C70 288 98 262 136 248" stroke="#55574F" strokeWidth="2" fill="none" />
      <path d="M376 330 C370 288 342 262 304 248" stroke="#55574F" strokeWidth="2" fill="none" />
      <rect x="198" y="186" width="44" height="56" rx="12" fill="#2A2B27" />
      <path d="M220 74 C254 74 276 104 276 144 C276 188 252 214 220 214 C188 214 164 188 164 144 C164 104 186 74 220 74 Z" fill="#2A2B27" />
      <path d="M220 74 C254 74 276 104 276 144" stroke="#5B5D55" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

function Arms({ pose }: { pose: OfficerPose }) {
  if (pose === "writing") {
    return (
      <svg viewBox="0 0 520 70" aria-hidden="true" className="h-auto w-full">
        <path d="M40 54 C80 40 130 40 170 54 L170 70 L40 70 Z" fill="#2F312C" />
        <ellipse cx="172" cy="60" rx="24" ry="10" fill="#3B3A35" />
        <path d="M290 46 C330 40 352 52 368 66 L330 70 L290 70 Z" fill="#2A2C27" />
        <ellipse cx="362" cy="64" rx="20" ry="9" fill="#3B3A35" />
        <line x1="352" y1="70" x2="378" y2="40" stroke="#151513" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 520 70" aria-hidden="true" className="h-auto w-full">
      <path d="M130 54 C170 40 220 40 256 54 L256 70 L130 70 Z" fill="#2F312C" />
      <path d="M390 54 C350 40 300 40 264 54 L264 70 L390 70 Z" fill="#2A2C27" />
      <ellipse cx="260" cy="60" rx="30" ry="12" fill="#3B3A35" />
    </svg>
  );
}

export function OfficeScene({
  pose,
  subtitle,
  subtitleItalic = false,
  officerName,
}: {
  pose: OfficerPose;
  subtitle?: string | null;
  subtitleItalic?: boolean;
  officerName: string;
}) {
  return (
    <section
      aria-label="The interview room"
      className="relative h-[340px] shrink-0 overflow-hidden md:h-[560px]"
      style={{ background: ROOM.wall }}
    >
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-[8px] w-[200px] -translate-x-1/2 md:w-[360px]"
        style={{ background: "#D3D6D8", borderBottom: "3px solid #FBFBF7" }}
      />

      <div
        aria-hidden="true"
        className="absolute left-[6%] top-[86px] hidden w-[130px] p-[10px] md:block"
        style={{ background: "#FBF9F3", border: "1px solid #CFC7B4" }}
      >
        <p className="m-0 mb-2 text-center text-[13px]" style={{ fontFamily: ROOM.typed }}>
          {new Date().toLocaleString("en-IN", { month: "long" })}
        </p>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 28 }, (_, i) => (
            <span key={i} className="h-[7px]" style={{ background: i % 7 === 6 ? ROOM.tape : "#D9D2C1" }} />
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute right-0 top-[70px] hidden h-[360px] w-[150px] md:flex md:justify-center"
        style={{ background: ROOM.steel, borderLeft: "2px solid #8A8F94" }}
      >
        <div className="h-full w-[2px]" style={{ background: "#868B90" }} />
      </div>

      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[28px] h-[190px] w-[300px] -translate-x-1/2 p-2 md:top-[48px] md:h-[350px] md:w-[540px] md:p-3"
        style={{ background: "#5E5A4F" }}
      >
        <div className="relative h-full w-full overflow-hidden" style={{ background: "#F3F1E8" }}>
          <div className="absolute inset-0 grid grid-cols-6 md:grid-cols-9">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className={i >= 6 ? "hidden md:block" : ""} style={{ borderRight: "3px solid #5E5A4F" }} />
            ))}
          </div>
          <div
            className="absolute left-0 top-0 h-full w-[34%] md:w-[30%]"
            style={{ background: "#E3D9C2", borderRight: "1px solid #CDBF9F" }}
          />
          <div className="absolute left-0 right-0 top-1/2 h-[3px]" style={{ background: "#5E5A4F" }} />
        </div>
      </div>

      <div className="absolute bottom-[80px] left-1/2 w-[260px] -translate-x-1/2 md:bottom-[124px] md:w-[440px]">
        <Officer pose={pose} />
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-[100px] pt-[7px] md:h-[150px] md:pt-[10px]"
        style={{ background: ROOM.wood }}
      >
        <div className="relative h-full" style={{ background: ROOM.baize, borderTop: "2px solid #8FA79A" }}>
          <div className="absolute left-1/2 top-[-26px] w-[300px] -translate-x-1/2 md:top-[-40px] md:w-[520px]">
            <Arms pose={pose} />
          </div>

          <div
            aria-hidden="true"
            className="absolute right-[14px] top-[10px] h-[54px] w-[120px] md:left-[calc(50%+70px)] md:right-auto md:top-[18px] md:h-[96px] md:w-[230px]"
            style={{ background: ROOM.khaki, transform: "rotate(4deg)", boxShadow: "0 2px 0 #A8956C" }}
          >
            <div className="absolute left-0 right-0 top-[44%] h-[5px] md:h-[6px]" style={{ background: ROOM.tape }} />
          </div>

          <div
            aria-hidden="true"
            className="absolute left-[calc(50%-330px)] top-[24px] hidden h-[66px] w-[46px] md:block"
            style={{ background: "#C9CDD0", border: "2px solid #A9AEB2", borderRadius: "3px 3px 8px 8px" }}
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 56 44"
            className="absolute left-[calc(50%-250px)] top-[46px] hidden w-[56px] md:block"
          >
            <ellipse cx="28" cy="38" rx="26" ry="5" fill="#3F3A2B" />
            <path d="M8 36 C8 16 48 16 48 36 Z" fill="#B08D3E" />
            <rect x="25" y="6" width="6" height="12" rx="2" fill="#B08D3E" />
          </svg>

          <div
            className="absolute bottom-[12px] left-1/2 -translate-x-1/2 px-4 pb-[5px] pt-[6px] text-center md:bottom-[18px] md:px-6 md:pb-2 md:pt-[10px]"
            style={{ background: "#151513", borderBottom: "5px solid #0A0A09" }}
          >
            <p className="m-0 whitespace-nowrap text-[14px] font-bold md:text-[18px]" style={{ color: "#F4F1E8" }}>
              {officerName}
            </p>
            <p className="m-0 mt-[2px] hidden text-[12px] md:block" style={{ color: "#C9C4B8" }}>
              Interviewing Officer
            </p>
          </div>
        </div>
      </div>

      {subtitle && (
        <div
          aria-live="polite"
          className="absolute bottom-[112px] left-1/2 w-[92%] max-w-[900px] -translate-x-1/2 text-center md:bottom-[172px]"
        >
          <p
            className="m-0 inline px-[10px] py-1 text-[17px] leading-[1.6] md:text-[26px]"
            style={{
              background: "rgba(18,18,16,0.8)",
              color: "#FFFFFF",
              fontStyle: subtitleItalic ? "italic" : "normal",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}
          >
            {subtitle}
          </p>
        </div>
      )}
    </section>
  );
}
