// Brand monogram. Square frame in currentColor with an accent bar and a
// bold "f" glyph (for focusroom). Reads at 16px (favicon) and scales to
// 256px (apple touch icon, OG card). Uses currentColor so it themes.

export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <rect x="1" y="1" width="30" height="30" rx="3" stroke="currentColor" strokeWidth="2" />
      <rect x="1" y="1" width="4" height="30" fill="var(--accent, currentColor)" />
      {/* lowercase f glyph: vertical stem with a hook + crossbar */}
      <path
        d="M 22 9 Q 19 9 17 11 L 17 26 M 13 16 L 22 16"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
    </svg>
  );
}
