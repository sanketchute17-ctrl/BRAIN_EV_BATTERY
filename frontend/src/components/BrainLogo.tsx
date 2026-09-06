import React from 'react';

export const BrainLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg
    viewBox="0 0 100 120"
    className={`${className} drop-shadow-[0_0_12px_rgba(0,230,118,0.6)]`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Battery Top Positive Terminal Cap */}
    <rect x="38" y="5" width="24" height="10" rx="4" fill="#00E676" />

    {/* Outer Battery Casing with Glowing Rounded Corners */}
    <rect
      x="14"
      y="17"
      width="72"
      height="96"
      rx="20"
      stroke="#00E676"
      strokeWidth="7"
      fill="#022C22"
      fillOpacity="0.4"
    />

    {/* Central Vertical Stem */}
    <line x1="50" y1="27" x2="50" y2="103" stroke="#00E676" strokeWidth="4.5" strokeLinecap="round" />

    {/* LEFT HALF: ORGANIC BRAIN LOBE FOLDS */}
    <path
      d="M 50 27 C 34 27, 24 37, 24 53 C 24 63, 30 69, 24 79 C 24 91, 34 103, 50 103"
      fill="none"
      stroke="#00E676"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    <path
      d="M 46 37 C 34 39, 32 49, 42 55 C 32 61, 32 73, 44 77"
      fill="none"
      stroke="#00E676"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <path
      d="M 48 57 C 36 63, 34 81, 46 87"
      fill="none"
      stroke="#00E676"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <path
      d="M 38 45 C 30 47, 28 53, 34 59"
      fill="none"
      stroke="#00E676"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M 36 69 C 30 73, 28 79, 36 83"
      fill="none"
      stroke="#00E676"
      strokeWidth="3"
      strokeLinecap="round"
    />

    {/* RIGHT HALF: NEURAL CIRCUIT TELEMETRY & NODES */}
    <path d="M 50 37 H 68 L 76 31" fill="none" stroke="#00E676" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="76" cy="31" r="5" fill="#00E676" />

    <path d="M 50 51 H 72" fill="none" stroke="#00E676" strokeWidth="4" strokeLinecap="round" />
    <circle cx="72" cy="51" r="5" fill="#00E676" />

    <path d="M 50 67 H 66 L 76 73" fill="none" stroke="#00E676" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="76" cy="73" r="5" fill="#00E676" />

    <path d="M 50 83 H 64" fill="none" stroke="#00E676" strokeWidth="4" strokeLinecap="round" />
    <circle cx="64" cy="83" r="4.5" fill="#00E676" />
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
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl',
  }[size];

  // BR in Electric Light Red (#FF3366), AIN EV in Electric Light Green (#00E676)
  const brainTitle = (
    <div className={`font-black tracking-tight leading-none ${titleSizes} select-none`}>
      <span className="text-[#FF3366] drop-shadow-[0_0_8px_rgba(255,51,102,0.6)]">BR</span>
      <span className="text-[#00E676] drop-shadow-[0_0_8px_rgba(0,230,118,0.6)]">AIN</span>
      <span className="text-[#00E676] drop-shadow-[0_0_8px_rgba(0,230,118,0.6)] ml-1.5">EV</span>
    </div>
  );

  const fullFormText = showFullForm && (
    <div className="text-[11px] sm:text-xs font-extrabold tracking-wide mt-1.5 text-center leading-tight">
      <span className="text-[#FF3366] drop-shadow-[0_0_4px_rgba(255,51,102,0.5)]">Battery Risk &amp; </span>
      <span className="text-[#00E676] drop-shadow-[0_0_4px_rgba(0,230,118,0.5)]">Analytics Intelligence Network</span>
    </div>
  );

  const quoteText = showQuote && (
    <div className="text-[10px] sm:text-[11px] font-extrabold italic text-[#00E676] mt-1 tracking-tight text-center drop-shadow-[0_0_4px_rgba(0,230,118,0.4)]">
      “Think Ahead. Protect Every Battery.”
    </div>
  );

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="p-2 rounded-2xl bg-slate-900/60 border border-[#00E676]/40 backdrop-blur-md shadow-lg mb-2">
          <BrainLogoIcon className={iconSizes} />
        </div>
        {brainTitle}
        {fullFormText}
        {quoteText}
      </div>
    );
  }

  // Horizontal Layout (for Dashboard Header)
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="shrink-0 p-1 rounded-xl bg-slate-900/60 border border-[#00E676]/30 backdrop-blur-xs">
        <BrainLogoIcon className={iconSizes} />
      </div>
      <div className="flex flex-col text-left">
        {brainTitle}
        {quoteText}
      </div>
    </div>
  );
};

export default BrainLogo;
