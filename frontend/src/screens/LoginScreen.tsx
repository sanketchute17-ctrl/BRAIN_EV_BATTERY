import React, { useState } from 'react';
import { Battery3DView } from '../components/Battery3DView';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Lock, Mail, ArrowRight, PlayCircle, Eye, EyeOff, UserPlus, Leaf, ShieldCheck, BarChart2 } from 'lucide-react';
import { apiService } from '../services/api';

interface LoginScreenProps {
  onLoginSuccess: (isDemo?: boolean) => void;
  onNavigateRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateRegister,
}) => {
  const [email, setEmail] = useState('researcher@brain-ev.org');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await apiService.login({ email, password });
      onLoginSuccess(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
      onLoginSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = () => {
    onLoginSuccess(true);
  };

  return (
    <div className="min-h-screen bg-[#EAF7EF] flex items-center justify-center p-0 sm:p-4 selection:bg-emerald-500/20">
      {/* MOBILE APP CONTAINER FRAME */}
      <div className="w-full sm:max-w-[400px] min-h-screen sm:min-h-[850px] sm:max-h-[920px] sm:rounded-[46px] relative overflow-hidden shadow-2xl border-0 sm:border-[10px] sm:border-slate-900 bg-[#F2FBF5] text-slate-900 flex flex-col justify-between p-4 sm:p-5">
        
        {/* 60% VISIBILITY BACKGROUND IMAGE OVERLAY */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none opacity-60 mix-blend-overlay"
          style={{ backgroundImage: "url('/ev_scooter_hero.png')" }}
        />
        
        {/* LIGHT BLUR BACKDROP COVER FOR CONTENT LEGIBILITY */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/70 via-white/50 to-emerald-50/70 backdrop-blur-[1px] pointer-events-none" />

        {/* iOS TOP STATUS BAR */}
        <div className="relative z-10 flex items-center justify-between text-xs font-black text-slate-900 select-none pt-1 pb-1">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-slate-900 text-[10px]">
            <span className="font-mono">5G</span>
            <span className="w-2.5 h-2.5 rounded-full border border-slate-900 inline-block" />
          </div>
        </div>

        {/* TOP SUB-TAGLINE */}
        <div className="relative z-10 flex items-center justify-end text-[10px] font-bold text-slate-700 gap-1.5 pt-1">
          <Leaf className="w-3.5 h-3.5 text-[#059669]" />
          <div className="text-right leading-tight text-[9px] font-black">
            A Cleaner<br />Greener Tomorrow
          </div>
        </div>

        {/* 1. BRANDING LOGO & TAGLINE */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-1 my-1">
          <div className="w-16 h-16 rounded-2xl bg-white/95 border-2 border-[#059669] shadow-md flex items-center justify-center p-2 backdrop-blur-md">
            <svg viewBox="0 0 100 100" className="w-full h-full text-[#059669] fill-current">
              <path d="M35 15 h30 v10 h-30 z M25 25 h50 v60 a10 10 0 0 1 -10 10 h-30 a10 10 0 0 1 -10 -10 z" fill="none" stroke="currentColor" strokeWidth="6" />
              <path d="M42 45 l16 -12 l-6 18 l16 -4 l-20 22 l4 -16 z" fill="currentColor" />
            </svg>
          </div>

          <div className="flex items-center gap-1 mt-1">
            <span className="text-2xl font-black tracking-tight text-slate-900">BRAIN</span>
            <span className="text-2xl font-black tracking-tight text-[#059669]">EV</span>
          </div>
          <p className="text-xs font-bold text-slate-700">Battery Intelligence</p>
          <p className="text-[11px] font-extrabold italic text-[#047857] drop-shadow-xs">“Think Ahead. Protect Every Battery.”</p>
        </div>

        {/* 2. REAL 3D INTERACTIVE BATTERY VISUAL */}
        <div className="relative z-10 my-1 flex flex-col items-center">
          <div className="w-full h-44 sm:h-48 relative rounded-2xl overflow-hidden bg-white/40 border border-white/60 shadow-sm backdrop-blur-xs">
            <ErrorBoundary>
              <Battery3DView status="HEALTHY" interactive={true} hideControls={true} />
            </ErrorBoundary>
          </div>
          
          <div className="text-[10px] font-extrabold text-slate-700 tracking-wide mt-1 bg-white/70 px-2.5 py-0.5 rounded-full border border-slate-200/80 backdrop-blur-xs">
            Drag to <span className="text-[#059669]">rotate</span> • Pinch to <span className="text-[#059669]">zoom</span>
          </div>
          
          {/* Carousel dots */}
          <div className="flex items-center gap-1 mt-1">
            <span className="w-3 h-1 bg-[#059669] rounded-full" />
            <span className="w-1 h-1 bg-slate-400 rounded-full" />
            <span className="w-1 h-1 bg-slate-400 rounded-full" />
          </div>
        </div>

        {/* 3. INPUT FORM CARD */}
        <div className="relative z-10 space-y-2.5 my-1 bg-white/80 backdrop-blur-md p-3.5 rounded-3xl border border-white/90 shadow-md">
          {errorMsg && (
            <div className="p-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-2.5">
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-white/90 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 transition shadow-2xs"
                placeholder="researcher@brain-ev.org"
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-11 py-3 bg-white/90 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 transition shadow-2xs"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => alert('Forgot password instructions sent to your email.')}
                className="text-[11px] font-extrabold text-[#059669] hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs sm:text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-md uppercase tracking-wider cursor-pointer active:scale-[0.99]"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* DIVIDER */}
          <div className="relative my-2 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white/90 px-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest rounded-full">
              OR
            </span>
          </div>

          {/* SECONDARY BUTTONS */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDemoClick}
              className="py-2.5 px-2 bg-white/90 text-[#059669] border border-slate-200 rounded-2xl text-[11px] font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 text-[#059669]" />
              <span>Demo Mode</span>
            </button>
            <button
              type="button"
              onClick={onNavigateRegister}
              className="py-2.5 px-2 bg-white/90 text-slate-700 border border-slate-200 rounded-2xl text-[11px] font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-500" />
              <span>Register</span>
            </button>
          </div>
        </div>

        {/* 4. THREE BOTTOM FEATURE BADGES */}
        <div className="relative z-10 grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center bg-white/60 backdrop-blur-xs rounded-2xl p-1.5">
          <div className="flex flex-col items-center gap-0.5">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span className="text-[9px] font-extrabold text-slate-800 leading-tight">Safer<br />Batteries</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Leaf className="w-4 h-4 text-[#059669]" />
            <span className="text-[9px] font-extrabold text-slate-800 leading-tight">Smarter<br />Mobility</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <BarChart2 className="w-4 h-4 text-[#059669]" />
            <span className="text-[9px] font-extrabold text-slate-800 leading-tight">Brighter<br />Tomorrow</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
