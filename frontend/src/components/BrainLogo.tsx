import React from 'react';

export const BrainLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-10' }) => (
  <svg
    viewBox="0 0 100 120"
    className={`${className} drop-shadow-[0_0_10px_rgba(0,230,118,0.6)]`}
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
      fill="#022C22"
      fillOpacity="0.35"
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
    <path d="M 50 36 H 68 L 76 30" fill="none" stroke="#00E676" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="76" cy="30" r="4.5" fill="#00E676" />

    <path d="M 50 50 H 73" fill="none" stroke="#00E676" strokeWidth="3.8" strokeLinecap="round" />
    <circle cx="73" cy="50" r="4.5" fill="#00E676" />

    <path d="M 50 66 H 66 L 76 72" fill="none" stroke="#00E676" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="76" cy="72" r="4.5" fill="#00E676" />

    <path d="M 50 82 H 64" fill="none" stroke="#00E676" strokeWidth="3.8" strokeLinecap="round" />
    <circle cx="64" cy="82" r="4" fill="#00E676" />
  </svg>
);

interface BrainLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  layout?: 'horizontal' | 'vertical';
  showFullForm?: boolean;
  showQuote?: boolean;
  className?: string;
}

export const BrainLogo: React.FC<BrainLogoProps> = ({
  size = 'md',
  layout = 'horizontal',
  showFullForm = false,
  showQuote = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-8',
    md: 'w-9 h-10',
    lg: 'w-12 h-14',
    xl: 'w-16 h-20',
  }[size];

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl',
  }[size];

  const isVertical = layout === 'vertical';

  // BRAI: Dark White (#FFFFFF / #F8FAFC) on Login Screen, Crisp Dark Slate (#0F172A) on Dashboard Header
  // N: Electric Green (#00E676)
  const brainTitle = (
    <div className={`font-black tracking-tight leading-none ${titleSizes} select-none flex items-center`}>
      <span className={isVertical ? 'text-white drop-shadow-sm' : 'text-slate-900'}>BRAI</span>
      <span className="text-[#00E676] drop-shadow-[0_0_8px_rgba(0,230,118,0.6)]">N</span>
    </div>
  );

  // Full form (Login Page): BRAI part in Dark White, Network in Electric Green
  const fullFormText = showFullForm && (
    <div className="text-[11px] sm:text-xs font-extrabold tracking-wide mt-1.5 text-center leading-tight">
      <span className="text-slate-100">Battery Risk &amp; Analytics Intelligence </span>
      <span className="text-[#00E676] drop-shadow-[0_0_4px_rgba(0,230,118,0.5)]">Network</span>
    </div>
  );

  // Quote (Login Page): Dark White
  const quoteText = showQuote && (
    <div className="text-[10px] sm:text-[11px] font-extrabold italic text-slate-200 mt-1 tracking-tight text-center">
      “Think Ahead. Protect Every Battery.”
    </div>
  );

  if (isVertical) {
    return (
      <div className={`flex flex-col items-center justify-center text-center w-full ${className}`}>
        <div className="p-2 rounded-2xl bg-slate-900/60 border border-[#00E676]/40 backdrop-blur-md shadow-lg mb-2 flex items-center justify-center">
          <BrainLogoIcon className={iconSizes} />
        </div>
        {brainTitle}
        {fullFormText}
        {quoteText}
      </div>
    );
  }

  // Horizontal Layout (for Dashboard Header) - Perfect 1-line alignment between logo icon and title
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="shrink-0 p-1 rounded-xl bg-slate-900/80 border border-[#00E676]/40 backdrop-blur-xs flex items-center justify-center">
        <BrainLogoIcon className={iconSizes} />
      </div>
      <div className="flex items-center justify-center">
        {brainTitle}
      </div>
    </div>
  );
};

export default BrainLogo;
