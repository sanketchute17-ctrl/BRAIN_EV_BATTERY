import React from 'react';

interface BrainLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  fullTagline?: boolean;
  className?: string;
}

export const BrainLogo: React.FC<BrainLogoProps> = ({
  size = 'md',
  showText = true,
  fullTagline = false,
  className = '',
}) => {
  const dimensions = {
    sm: { icon: 'w-7 h-7', title: 'text-lg', subtitle: 'text-[11px]' },
    md: { icon: 'w-9 h-9', title: 'text-2xl', subtitle: 'text-xs' },
    lg: { icon: 'w-14 h-14', title: 'text-4xl', subtitle: 'text-sm' },
    xl: { icon: 'w-20 h-20', title: 'text-6xl', subtitle: 'text-base' },
  }[size];

  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      {/* Bright Electric Light Green & Electric Light Red Emblem */}
      <div className={`relative flex items-center justify-center shrink-0 ${dimensions.icon}`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_0_18px_rgba(0,255,135,0.8)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Hexagonal Outer Frame */}
          <polygon
            points="50,4 92,25 92,75 50,96 8,75 8,25"
            stroke="#00FF87"
            strokeWidth="5"
            fill="url(#brainLogoGrad)"
          />

          {/* Battery Casing Outline */}
          <rect
            x="30"
            y="20"
            width="40"
            height="60"
            rx="6"
            stroke="#FF2A55"
            strokeWidth="4"
            fill="#0D121D"
          />
          {/* Positive Cap */}
          <rect x="40" y="13" width="20" height="7" rx="3" fill="#00FF87" />

          {/* Core Lightning */}
          <path
            d="M 50 28 L 38 48 L 54 48 L 42 72"
            stroke="#00FF87"
            fill="none"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_15px_rgba(0,255,135,1)]"
          />

          {/* Glowing Nodes */}
          <circle cx="18" cy="50" r="4" fill="#00FF87" className="animate-pulse" />
          <circle cx="82" cy="50" r="4" fill="#FF2A55" className="animate-pulse" />
          <line x1="18" y1="50" x2="30" y2="50" stroke="#00FF87" strokeWidth="2.5" />
          <line x1="70" y1="50" x2="82" y2="50" stroke="#FF2A55" strokeWidth="2.5" />

          <defs>
            <linearGradient id="brainLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#182238" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#07090E" stopOpacity="0.95" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className={`font-black tracking-widest leading-none flex items-center gap-2 ${dimensions.title}`}>
            <span className="text-[#00FF87] font-black tracking-widest drop-shadow-[0_0_20px_rgba(0,255,135,0.9)] uppercase heading-tech">
              BRAIN
            </span>
          </div>

          {fullTagline ? (
            <div className="mt-1.5 space-y-0.5">
              <span className="block text-sm font-extrabold text-white tracking-wide">
                Battery Risk & Analytics Intelligence Network
              </span>
              <span className="block text-xs font-serif italic text-[#FF2A55] font-bold">
                “Think Ahead. Protect Every Battery.”
              </span>
            </div>
          ) : (
            <span className={`font-extrabold tracking-widest text-[#FF2A55] uppercase leading-tight ${dimensions.subtitle}`}>
              EV BATTERY INTELLIGENCE
            </span>
          )}
        </div>
      )}
    </div>
  );
};
