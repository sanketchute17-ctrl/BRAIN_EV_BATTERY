import React from 'react';

export const BrainLogoIcon: React.FC<{ className?: string; theme?: 'dark' | 'light' }> = ({
  className = 'w-9 h-10',
  theme = 'dark',
}) => (
  <svg
    viewBox="0 0 100 120"
    className={`${className} ${
      theme === 'light'
        ? 'drop-shadow-[0_2px_8px_rgba(5,150,105,0.25)]'
        : 'drop-shadow-[0_0_12px_rgba(0,230,118,0.6)]'
    }`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Battery Top Positive Terminal Nub */}
    <rect x="38" y="5" width="24" height="9" rx="4" fill="#00E676" />

    {/* Outer Battery Casing with Glowing Rounded Edge */}
    <rect
      x="14"
      y="16"
      width="72"
      height="98"
      rx="18"
      stroke="#00E676"
      strokeWidth="6.5"
      fill={theme === 'light' ? '#ECFDF5' : '#022C22'}
      fillOpacity={theme === 'light' ? '0.85' : '0.35'}
    />

    {/* Central Vertical Stem Axis */}
    <line x1="50" y1="26" x2="50" y2="104" stroke="#00E676" strokeWidth="4" strokeLinecap="round" />

    {/* LEFT HALF: ORGANIC BRAIN LOBES (HIGH ACCURACY CONVOLUTIONS) */}
    <path
      d="M 50 26 C 34 26, 24 36, 24 52 C 24 62, 30 68, 24 78 C 24 90, 34 104, 50 104"
      fill="none"
      stroke="#00E676"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    <path
      d="M 46 36 C 34 38, 32 48, 42 54 C 32 60, 32 72, 44 76"
      fill="none"
      stroke="#00E676"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <path
      d="M 48 56 C 36 62, 34 80, 46 86"
      fill="none"
      stroke="#00E676"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <path
      d="M 38 44 C 30 46, 28 52, 34 58"
      fill="none"
      stroke="#00E676"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M 36 68 C 30 72, 28 78, 36 82"
      fill="none"
      stroke="#00E676"
      strokeWidth="3"
      strokeLinecap="round"
    />

    {/* RIGHT HALF: NEURAL CIRCUIT TELEMETRY TRACES & NODES */}
    <path
      d="M 50 36 H 68 L 76 30"
      fill="none"
      stroke="#00E676"
      strokeWidth="3.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="76" cy="30" r="4.5" fill="#00E676" />

    <path d="M 50 50 H 73" fill="none" stroke="#00E676" strokeWidth="3.8" strokeLinecap="round" />
    <circle cx="73" cy="50" r="4.5" fill="#00E676" />

    <path
      d="M 50 66 H 66 L 76 72"
      fill="none"
      stroke="#00E676"
      strokeWidth="3.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="76" cy="72" r="4.5" fill="#00E676" />

    <path d="M 50 82 H 64" fill="none" stroke="#00E676" strokeWidth="3.8" strokeLinecap="round" />
    <circle cx="64" cy="82" r="4" fill="#00E676" />
  </svg>
);

interface BrainLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'splash';
  layout?: 'horizontal' | 'vertical';
  showFullForm?: boolean;
  showQuote?: boolean;
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
}

export const BrainLogo: React.FC<BrainLogoProps> = ({
  size = 'md',
  layout = 'horizontal',
  showFullForm = false,
  showQuote = true,
  theme = 'auto',
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-8',
    md: 'w-9 h-10',
    lg: 'w-12 h-14',
    xl: 'w-16 h-20',
    '2xl': 'w-20 h-24',
    splash: 'w-24 h-28 sm:w-28 sm:h-32',
  }[size];

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl',
    '2xl': 'text-4xl sm:text-5xl',
    splash: 'text-4xl sm:text-6xl tracking-normal',
  }[size];

  const dotSize = {
    sm: '-top-1 w-1 h-1',
    md: '-top-1.5 w-1.2 h-1.2',
    lg: '-top-2 w-2 h-2',
    xl: '-top-2.5 w-2.5 h-2.5',
    '2xl': '-top-3 w-3 h-3',
    splash: '-top-3.5 sm:-top-4 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5',
  }[size];

  const isVertical = layout === 'vertical';
  const effectiveTheme = theme === 'auto' ? (isVertical ? 'dark' : 'light') : theme;
  const isDark = effectiveTheme === 'dark';

  // Base text color classes based on theme
  const textBase = isDark ? 'text-white' : 'text-slate-900';
  const textSubtle = isDark ? 'text-slate-300' : 'text-slate-500';

  // PROGRESSIVE FONT WEIGHT LOGO TEXT ("BRAIN") - RailOne Inspired:
  // Same font size, progressive thickness from Thin 'B' -> Light 'R' -> Semibold 'A' -> Bold 'I' (with Green Accent Dot) -> Ultra Heavy Black 'N'
  const brainTitle = (
    <div
      className={`select-none flex items-center justify-center font-sans ${titleSizes} leading-none tracking-tight`}
    >
      {/* B: Thin stroke (Weight 200) */}
      <span className={`${textSubtle} opacity-75`} style={{ fontWeight: 200 }}>
        B
      </span>

      {/* R: Light / Regular stroke (Weight 400) */}
      <span className={`${textBase} opacity-90`} style={{ fontWeight: 400 }}>
        R
      </span>

      {/* A: Medium / Semibold stroke (Weight 600) */}
      <span className={`${textBase}`} style={{ fontWeight: 600 }}>
        A
      </span>

      {/* I: Bold / Extrabold stroke (Weight 800) with iconic RailOne inspired Electric Green dot on top */}
      <span className="relative inline-flex items-center justify-center px-[1px]">
        <span
          className={`absolute rounded-full bg-[#00E676] animate-pulse shadow-[0_0_8px_#00E676] ${dotSize}`}
        />
        <span className={`${textBase}`} style={{ fontWeight: 800 }}>
          I
        </span>
      </span>

      {/* N: Black / Ultra-heavy stroke (Weight 900) in vivid Electric Green */}
      <span
        className="text-[#00E676] drop-shadow-[0_0_10px_rgba(0,230,118,0.7)]"
        style={{ fontWeight: 900 }}
      >
        N
      </span>
    </div>
  );

  // Full form text
  const fullFormText = showFullForm && (
    <div className="text-[11px] sm:text-xs font-extrabold tracking-wide mt-2 text-center leading-tight">
      <span className={isDark ? 'text-slate-100' : 'text-slate-700'}>
        Battery Risk &amp; Analytics Intelligence{' '}
      </span>
      <span className="text-[#00E676] drop-shadow-[0_0_4px_rgba(0,230,118,0.5)]">Network</span>
    </div>
  );

  // Quote text
  const quoteText = showQuote && (
    <div
      className={`text-[10px] sm:text-[11px] font-extrabold italic mt-1 tracking-tight text-center ${
        isDark ? 'text-slate-200' : 'text-slate-600'
      }`}
    >
      “Think Ahead. Protect Every Battery.”
    </div>
  );

  if (isVertical) {
    return (
      <div className={`flex flex-col items-center justify-center text-center w-full ${className}`}>
        <div
          className={`p-2.5 rounded-2xl mb-2 flex items-center justify-center ${
            isDark
              ? 'bg-slate-900/60 border border-[#00E676]/40 backdrop-blur-md shadow-lg'
              : 'bg-emerald-50/80 border border-emerald-300/60 shadow-sm'
          }`}
        >
          <BrainLogoIcon className={iconSizes} theme={effectiveTheme} />
        </div>
        {brainTitle}
        {fullFormText}
        {quoteText}
      </div>
    );
  }

  // Horizontal Layout (for Header/Nav)
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`shrink-0 p-1.5 rounded-xl flex items-center justify-center ${
          isDark
            ? 'bg-slate-900/80 border border-[#00E676]/40 backdrop-blur-xs'
            : 'bg-emerald-50/80 border border-emerald-300/80'
        }`}
      >
        <BrainLogoIcon className={iconSizes} theme={effectiveTheme} />
      </div>
      <div className="flex items-center justify-center">{brainTitle}</div>
    </div>
  );
};

export default BrainLogo;
