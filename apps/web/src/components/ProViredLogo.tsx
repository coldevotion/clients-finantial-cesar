interface Props {
  /** 'full' = icono + texto, 'icon' = solo icono */
  variant?: 'full' | 'icon';
  size?: number;
}

/** Logo de ProVired — burbuja de mensaje + señal WiFi, paleta de marca */
export function ProViredLogo({ variant = 'full', size = 32 }: Props) {
  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ProVired logo"
    >
      {/* Fondo circular */}
      <circle cx="20" cy="20" r="20" fill="url(#pv-grad)" />

      <defs>
        <linearGradient id="pv-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#267EF0" />
          <stop offset="100%" stopColor="#0D0DF0" />
        </linearGradient>
      </defs>

      {/* Burbuja principal (grande, izquierda-arriba) */}
      <rect x="7" y="10" width="22" height="15" rx="4" fill="white" fillOpacity="0.95" />
      {/* Cola de burbuja */}
      <path d="M11 25 L9 30 L17 25 Z" fill="white" fillOpacity="0.95" />

      {/* Señal WiFi dentro de la burbuja */}
      <circle cx="18" cy="18" r="2" fill="#267EF0" />
      <path d="M13.5 14.5 Q18 11 22.5 14.5" stroke="#267EF0" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M11 12 Q18 7.5 25 12" stroke="#0D0DF0" strokeWidth="1.4" strokeLinecap="round" fill="none" strokeOpacity="0.6" />

      {/* Burbuja secundaria (pequeña, derecha-abajo) */}
      <rect x="19" y="20" width="14" height="10" rx="3" fill="white" fillOpacity="0.4" />
      {/* Cola burbuja secundaria */}
      <path d="M30 30 L32 33 L26 30 Z" fill="white" fillOpacity="0.4" />

      {/* Tres puntos en burbuja secundaria */}
      <circle cx="23" cy="25" r="1.2" fill="white" />
      <circle cx="26" cy="25" r="1.2" fill="white" />
      <circle cx="29" cy="25" r="1.2" fill="white" />
    </svg>
  );

  if (variant === 'icon') return icon;

  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <div>
        <p className="text-white font-extrabold text-sm leading-none tracking-wide">PROVIRED</p>
        <p className="text-blue-300/60 text-[9px] font-medium tracking-widest uppercase leading-none mt-0.5">
          Mensajería Pro
        </p>
      </div>
    </div>
  );
}
