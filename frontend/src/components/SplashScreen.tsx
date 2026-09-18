import React, { useEffect, useState } from 'react';
import { BrainLogo, BrainLogoIcon } from './BrainLogo';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface SplashScreenProps {
  onFinish?: () => void;
  autoDismissMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  autoDismissMs = 2800,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / autoDismissMs) * 100));
      setProgress(pct);

      if (elapsed >= autoDismissMs) {
        clearInterval(interval);
        if (onFinish) onFinish();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [autoDismissMs, onFinish]);

  return (
    <div
      onClick={() => onFinish && onFinish()}
      className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-between p-6 sm:p-10 select-none cursor-pointer animate-fadeIn overflow-hidden"
    >
      {/* Background Subtle Gradient & Glow Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(0,230,118,0.12)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.06)_0%,transparent_50%)] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
          <span className="text-[10px] font-extrabold text-emerald-800 tracking-wider uppercase">
            System Launching
          </span>
        </div>

        {onFinish && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFinish();
            }}
            className="text-xs font-black text-slate-500 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-full border border-slate-200 transition flex items-center gap-1 cursor-pointer"
          >
            <span>Skip</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Centered Logo Section (White Background Full Screen) */}
      <div className="my-auto flex flex-col items-center justify-center text-center space-y-6 relative z-10 max-w-md mx-auto">
        {/* Animated Brain Logo Icon Container */}
        <div className="relative group">
          <div className="absolute -inset-4 rounded-full bg-emerald-100/60 blur-xl animate-pulse" />
          <div className="relative p-5 rounded-3xl bg-white border-2 border-emerald-300 shadow-[0_15px_40px_-10px_rgba(0,230,118,0.25)] flex items-center justify-center transition-transform duration-500 transform group-hover:scale-105">
            <BrainLogoIcon className="w-24 h-28 sm:w-32 sm:h-36" theme="light" />
          </div>
        </div>

        {/* Progressive Font Weight Title (B thin -> R normal -> A semibold -> I bold with green dot -> N ultra black) */}
        <div className="space-y-3">
          <BrainLogo size="splash" layout="vertical" showFullForm={false} showQuote={false} theme="light" />

          {/* Subtitle */}
          <div className="text-xs sm:text-sm font-extrabold text-slate-700 tracking-wide max-w-xs mx-auto leading-relaxed">
            Battery Risk &amp; Analytics Intelligence <span className="text-[#00E676] font-black drop-shadow-xs">Network</span>
          </div>

          <p className="text-xs font-semibold text-slate-500 italic">
            “Think Ahead. Protect Every Battery.”
          </p>
        </div>
      </div>

      {/* Bottom Loading Progress & Footer */}
      <div className="w-full max-w-xs mx-auto space-y-3 relative z-10 text-center">
        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200 p-0.5 shadow-2xs">
          <div
            className="bg-[#00E676] h-full rounded-full transition-all duration-75 shadow-[0_0_8px_#00E676]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400">
          <span>INITIALIZING TELEMETRY...</span>
          <span className="text-emerald-700">{progress}%</span>
        </div>

        <div className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase pt-1">
          TAP ANYWHERE TO ENTER APP
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
