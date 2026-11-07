export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  // Stable enough for a single mark in the shell; avoid colliding if multiple marks mount.
  const gradId = "fm-brand-grad";
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
      <defs>
        <linearGradient id={gradId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f58529" />
          <stop offset="0.45" stopColor="#dd2a7b" />
          <stop offset="0.75" stopColor="#8134af" />
          <stop offset="1" stopColor="#515bd4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradId})`} />
      <circle cx="16" cy="12" r="4" stroke="white" strokeWidth="1.75" />
      <path
        d="M8.5 24c1.2-3.4 3.9-5 7.5-5s6.3 1.6 7.5 5"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="24.5" cy="10.5" r="2.25" fill="white" fillOpacity="0.95" />
    </svg>
  );
}
