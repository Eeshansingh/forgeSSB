interface StarMarkProps {
  size?: number;
  className?: string;
}

export function StarMark({ size = 48, className = "" }: StarMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="0.6" opacity="0.35" />
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="0.4" opacity="0.2" />
      {/* Five-point star */}
      <path
        d="M32 8 L37.6 25.2 L55.6 25.2 L41 35.8 L46.6 53 L32 42.4 L17.4 53 L23 35.8 L8.4 25.2 L26.4 25.2 Z"
        fill="currentColor"
        fillOpacity="0.92"
      />
      {/* Inner accent */}
      <circle cx="32" cy="32" r="2.2" fill="var(--background)" />
    </svg>
  );
}
