interface Props {
  /** 'full' = icon + text, 'icon' = icon only */
  variant?: 'full' | 'icon';
  size?: number;
}

/** Cobrix logo — coin + checkmark, debt collection brand */
export function CobrixLogo({ variant = 'full', size = 32 }: Props) {
  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Cobrix logo"
    >
      <defs>
        <linearGradient id="cx-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#267EF0" />
          <stop offset="100%" stopColor="#0D0DF0" />
        </linearGradient>
        <linearGradient id="cx-coin" x1="8" y1="8" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Background */}
      <circle cx="20" cy="20" r="20" fill="url(#cx-grad)" />

      {/* Coin circle */}
      <circle cx="20" cy="20" r="11" fill="url(#cx-coin)" />
      <circle cx="20" cy="20" r="9" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />

      {/* $ sign */}
      <text
        x="20"
        y="25"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        fill="white"
        fillOpacity="0.95"
      >
        $
      </text>

      {/* Top-right checkmark badge */}
      <circle cx="30" cy="10" r="6" fill="#10B981" />
      <path
        d="M27 10 L29.5 12.5 L33 8"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  if (variant === 'icon') return icon;

  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <div>
        <p className="text-white font-extrabold text-sm leading-none tracking-wide">COBRIX</p>
        <p className="text-blue-300/60 text-[9px] font-medium tracking-widest uppercase leading-none mt-0.5">
          Cobranza Pro
        </p>
      </div>
    </div>
  );
}
