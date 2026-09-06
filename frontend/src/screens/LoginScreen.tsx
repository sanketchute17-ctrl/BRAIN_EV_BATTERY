import React, { useState } from 'react';
import { Battery3DView } from '../components/Battery3DView';
import { BrainLogo } from '../components/BrainLogo';
import { Lock, Mail, ArrowRight, PlayCircle, Eye, EyeOff, ShieldCheck, Leaf, LineChart, UserPlus } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 selection:bg-emerald-500/20">
      {/* MOBILE APP CONTAINER FRAME (On Desktop: Mobile Frame, On Mobile: Full Viewport) */}
      <div 
        className="w-full sm:max-w-md min-h-screen sm:min-h-[840px] sm:max-h-[920px] sm:rounded-[40px] relative overflow-hidden shadow-2xl border-0 sm:border-[8px] sm:border-slate-800 flex flex-col justify-between p-4 sm:p-5 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/scooter_bg.jpg')` }}
      >
        {/* Subtle Dark Vignette Top & Bottom Only (Leaves Central Scooter Image Vivid & Fully Visible) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/40 pointer-events-none z-0" />

        {/* Delicate Top Green Pedestal Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[300px] bg-gradient-to-b from-emerald-500/25 via-transparent to-transparent rounded-full blur-2xl pointer-events-none z-0" />

        {/* DECORATIVE SUB-HEADER (FROM IMAGE 1) */}
        <div className="relative z-10 text-center text-[10px] font-extrabold tracking-widest text-slate-800 uppercase pt-2 pb-1">
          <div className="inline-flex items-center gap-1.5 bg-white/75 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/60 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>INTELLIGENCE FOR CLEANER MOBILITY</span>
          </div>
        </div>

        {/* 1. BRANDING HEADER */}
        <div className="relative z-10 text-center pt-1 pb-1 flex flex-col items-center">
          <div className="bg-white/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/60 shadow-md">
            <BrainLogo size="md" showText={true} fullTagline={true} className="my-0.5" />
          </div>
        </div>

        {/* 2. HERO 3D BATTERY MODEL (IMAGE 1 MINIMAL HERO VIEW) */}
        <div className="relative z-10 my-1 flex flex-col items-center">
          {/* Subtle Pedestal Glow under Battery */}
          <div className="absolute inset-0 bg-radial from-emerald-500/20 via-emerald-500/5 to-transparent blur-xl pointer-events-none" />

          {/* 3D WebGL Canvas Container */}
          <div className="w-full h-52 sm:h-60 relative cursor-grab active:cursor-grabbing">
            <Battery3DView status="HEALTHY" interactive={true} hideControls={true} />
          </div>

          {/* Minimal Gesture Instruction Line */}
          <div className="text-[11px] font-bold text-slate-800 tracking-wide mt-0.5 bg-white/80 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/60 shadow-sm pointer-events-none">
            Drag to rotate &nbsp;•&nbsp; Pinch to zoom &nbsp;•&nbsp; Tap to explore
          </div>
        </div>

        {/* 3. STATUS PILLS BAR (IMAGE 1 REQUIREMENT) */}
        <div className="flex items-center justify-center gap-1.5 z-10 my-1 flex-wrap">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/85 text-emerald-800 border border-emerald-400 shadow-sm flex items-center gap-1 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> HEALTHY
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/85 text-amber-800 border border-amber-400 shadow-sm flex items-center gap-1 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> WATCH
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/85 text-orange-800 border border-orange-400 shadow-sm flex items-center gap-1 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> WARNING
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/85 text-red-800 border border-red-400 shadow-sm flex items-center gap-1 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> CRITICAL
          </span>
        </div>

        {/* 4. TRANSPARENT GLASSMORPHIC LOGIN CARD */}
        <div className="bg-white/35 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-white/60 shadow-2xl max-w-sm w-full mx-auto z-10 my-1 space-y-3">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-500/90 text-white text-xs font-bold shadow-md">
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
                  className="w-full pl-10 pr-3 py-2.5 bg-white/85 border border-white/80 rounded-xl text-xs font-extrabold text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 transition shadow-sm"
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
                  className="w-full pl-10 pr-10 py-2.5 bg-white/85 border border-white/80 rounded-xl text-xs font-extrabold text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 transition shadow-sm"
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
                className="text-[11px] font-extrabold text-emerald-950 hover:underline bg-white/50 backdrop-blur-md px-2 py-0.5 rounded-md"
              >
                Forgot Password?
              </button>
            </div>

            {/* PRIMARY VIBRANT GREEN CTA BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-xs sm:text-sm rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition flex items-center justify-center gap-2 shadow-emerald uppercase tracking-wider heading-tech cursor-pointer active:scale-[0.99]"
            >
              <span>{isSubmitting ? 'AUTHENTICATING...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* DIVIDER */}
          <div className="relative my-2 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800/20" />
            </div>
            <span className="relative bg-white/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-extrabold text-slate-800 uppercase tracking-widest">
              OR
            </span>
          </div>

          {/* SECONDARY BUTTONS */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleDemoClick}
              className="py-2.5 px-2 bg-white/80 backdrop-blur-md text-emerald-900 border-2 border-emerald-500 rounded-xl text-[11px] font-black hover:bg-white transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Demo Mode</span>
            </button>
            <button
              type="button"
              onClick={onNavigateRegister}
              className="py-2.5 px-2 bg-white/80 backdrop-blur-md text-slate-900 border-2 border-slate-300 rounded-xl text-[11px] font-black hover:bg-white transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-700" />
              <span>Register</span>
            </button>
          </div>
        </div>

        {/* 5. FOOTER FEATURE BADGES & INFORMATION */}
        <div className="relative z-10 pt-1 pb-1 space-y-2">
          <div className="grid grid-cols-3 gap-1.5 max-w-xs mx-auto text-center">
            <div className="flex flex-col items-center gap-0.5 p-1 bg-white/60 backdrop-blur-md rounded-xl border border-white/50 shadow-xs">
              <div className="p-1 rounded-full bg-emerald-500 text-white">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-extrabold text-slate-900">Safer Batteries</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 p-1 bg-white/60 backdrop-blur-md rounded-xl border border-white/50 shadow-xs">
              <div className="p-1 rounded-full bg-emerald-500 text-white">
                <Leaf className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-extrabold text-slate-900">Smarter Mobility</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 p-1 bg-white/60 backdrop-blur-md rounded-xl border border-white/50 shadow-xs">
              <div className="p-1 rounded-full bg-emerald-500 text-white">
                <LineChart className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-extrabold text-slate-900">Cleaner Tomorrow</span>
            </div>
          </div>

          <div className="text-center text-[10px] font-extrabold text-slate-900 bg-white/60 backdrop-blur-md py-1 px-3 rounded-full max-w-xs mx-auto border border-white/50">
            BRAIN Mobile App v1.0.0 • EV Risk Analytics
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

