import React, { useState } from 'react';
import { BrainLogo } from '../components/BrainLogo';
import { Lock, Mail, ArrowRight, PlayCircle, Eye, EyeOff, UserPlus } from 'lucide-react';
import { apiService } from '../services/api';
import scooterBg from '../assets/scooter_bg.jpg';

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 selection:bg-emerald-500/20">
      {/* MOBILE APP CONTAINER FRAME (Background Scooter Image Clipped INSIDE Phone Frame) */}
      <div 
        className="w-full sm:max-w-md min-h-screen sm:min-h-[840px] sm:max-h-[920px] sm:rounded-[40px] relative overflow-hidden shadow-2xl border-0 sm:border-[8px] sm:border-slate-800 flex flex-col justify-between p-4 sm:p-6 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${scooterBg})` }}
      >
        {/* Subtle Dark Vignette Overlay for Crisp Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/45 pointer-events-none z-0" />

        {/* Top Green Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[300px] bg-gradient-to-b from-emerald-500/25 via-transparent to-transparent rounded-full blur-2xl pointer-events-none z-0" />

        {/* DECORATIVE SUB-HEADER */}
        <div className="relative z-10 text-center text-[10px] font-extrabold tracking-widest text-slate-800 uppercase pt-2 pb-1">
          <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/60 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>INTELLIGENCE FOR CLEANER MOBILITY</span>
          </div>
        </div>

        {/* 1. BRANDING HEADER */}
        <div className="relative z-10 text-center pt-2 pb-2 flex flex-col items-center">
          <div className="bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/70 shadow-md">
            <BrainLogo size="md" showText={true} fullTagline={true} className="my-0.5" />
          </div>
        </div>

        {/* 2. STATUS PILLS BAR */}
        <div className="flex items-center justify-center gap-1.5 z-10 my-2 flex-wrap">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/85 text-emerald-800 border border-emerald-400 shadow-sm flex items-center gap-1 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> HEALTHY
          </span>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/85 text-amber-800 border border-amber-400 shadow-sm flex items-center gap-1 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> WATCH
          </span>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/85 text-orange-800 border border-orange-400 shadow-sm flex items-center gap-1 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> WARNING
          </span>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/85 text-red-800 border border-red-400 shadow-sm flex items-center gap-1 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> CRITICAL
          </span>
        </div>

        {/* 3. 100% TRANSPARENT LOGIN CARD */}
        <div className="bg-transparent rounded-3xl p-4 sm:p-5 max-w-sm w-full mx-auto z-10 my-1 space-y-3">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3">
            {/* EMAIL INPUT */}
            <div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-3 bg-white/90 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 transition shadow-md"
                  placeholder="researcher@brain-ev.org"
                />
              </div>
            </div>

            {/* PASSWORD INPUT WITH EYE TOGGLE */}
            <div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-3 bg-white/90 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 transition shadow-md"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => alert('Forgot password instructions sent to your email.')}
                className="text-[11px] font-extrabold text-white bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-md shadow-xs hover:bg-slate-900/80 transition"
              >
                Forgot Password?
              </button>
            </div>

            {/* PRIMARY VIBRANT GREEN CTA BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-xs sm:text-sm rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition flex items-center justify-center gap-2 shadow-emerald uppercase tracking-wider heading-tech cursor-pointer active:scale-[0.99]"
            >
              <span>{isSubmitting ? 'AUTHENTICATING...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* DIVIDER */}
          <div className="relative my-2 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/40" />
            </div>
            <span className="relative bg-slate-900/70 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-extrabold text-white uppercase tracking-widest">
              OR
            </span>
          </div>

          {/* SECONDARY BUTTONS */}
          <div className="grid grid-cols-2 gap-2.5 pt-0.5">
            <button
              type="button"
              onClick={handleDemoClick}
              className="py-2.5 px-2 bg-white/90 backdrop-blur-md text-emerald-900 border-2 border-emerald-500 rounded-xl text-[11px] font-black hover:bg-white transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Demo Mode</span>
            </button>
            <button
              type="button"
              onClick={onNavigateRegister}
              className="py-2.5 px-2 bg-white/90 backdrop-blur-md text-slate-900 border-2 border-slate-300 rounded-xl text-[11px] font-black hover:bg-white transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-700" />
              <span>Register</span>
            </button>
          </div>
        </div>

        {/* 4. FOOTER INFORMATION */}
        <div className="relative z-10 pt-1 pb-1">
          <div className="text-center text-[10px] font-extrabold text-slate-900 bg-white/75 backdrop-blur-md py-1 px-3 rounded-full max-w-xs mx-auto border border-white/60 shadow-xs">
            BRAIN Mobile App v1.0.0 • EV Risk Analytics
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
