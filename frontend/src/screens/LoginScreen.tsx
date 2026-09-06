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
    <div className="min-h-screen bg-[#F4F8F6] text-slate-900 flex flex-col justify-between p-4 sm:p-6 max-w-4xl mx-auto relative overflow-x-hidden selection:bg-emerald-500/20">
      {/* Delicate Top Green Radial Highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-emerald-400/15 via-emerald-300/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Top Left & Right Captions (From Image 1) */}
      <div className="hidden sm:flex items-center justify-between z-10 text-[11px] font-bold tracking-widest text-slate-400 uppercase pt-2 px-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          INTELLIGENCE FOR CLEANER MOBILITY
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <span>A Safer Greener Tomorrow</span>
        </div>
      </div>

      {/* 1. BRANDING HEADER */}
      <div className="text-center pt-4 pb-2 z-10 flex flex-col items-center">
        <BrainLogo size="xl" showText={true} fullTagline={true} className="my-1" />
      </div>

      {/* 2. HERO 3D BATTERY MODEL (IMAGE 1 MINIMAL HERO VIEW) */}
      <div className="relative z-10 my-2 flex flex-col items-center">
        {/* Subtle Radial Pedestal Glow under Battery */}
        <div className="absolute inset-0 bg-radial from-emerald-500/15 via-emerald-500/5 to-transparent blur-2xl pointer-events-none" />

        {/* 3D WebGL Canvas Container */}
        <div className="w-full max-w-xl h-64 sm:h-80 relative cursor-grab active:cursor-grabbing">
          <Battery3DView status="HEALTHY" interactive={true} hideControls={true} />
        </div>

        {/* Minimal Gesture Instruction Line (Image 1 Requirement) */}
        <div className="text-xs font-semibold text-slate-500 tracking-wide mt-1 bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-200/80 shadow-sm pointer-events-none">
          Drag to rotate &nbsp;•&nbsp; Pinch to zoom &nbsp;•&nbsp; Tap to explore
        </div>
      </div>

      {/* 3. STATUS PILLS BAR (IMAGE 1 REQUIREMENT) */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 z-10 my-2 flex-wrap">
        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> HEALTHY
        </span>
        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> WATCH
        </span>
        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-300 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500" /> WARNING
        </span>
        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-300 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" /> CRITICAL
        </span>
      </div>

      {/* 4. PREMIUM LOGIN CARD (IMAGE 1 SPECIFICATION) */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl max-w-md w-full mx-auto z-10 my-2 space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {/* EMAIL INPUT */}
          <div>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 transition shadow-inner"
                placeholder="researcher@brain-ev.org"
              />
            </div>
          </div>

          {/* PASSWORD INPUT WITH EYE TOGGLE */}
          <div>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 transition shadow-inner"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => alert('Forgot password instructions sent to your email.')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* PRIMARY VIBRANT GREEN CTA BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold text-base rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition flex items-center justify-center gap-2.5 shadow-emerald uppercase tracking-wider heading-tech cursor-pointer active:scale-[0.99]"
          >
            <span>{isSubmitting ? 'AUTHENTICATING...' : 'Sign In'}</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </form>

        {/* DIVIDER */}
        <div className="relative my-3 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
            OR
          </span>
        </div>

        {/* SECONDARY BUTTONS */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleDemoClick}
            className="py-3.5 px-3 bg-emerald-50/70 text-emerald-700 border-2 border-emerald-500 rounded-2xl text-xs font-extrabold hover:bg-emerald-100 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <PlayCircle className="w-4 h-4 text-emerald-600" />
            <span>Demo Mode</span>
          </button>
          <button
            type="button"
            onClick={onNavigateRegister}
            className="py-3.5 px-3 bg-slate-50 text-slate-800 border-2 border-slate-200 rounded-2xl text-xs font-extrabold hover:bg-slate-100 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-slate-600" />
            <span>Register</span>
          </button>
        </div>
      </div>

      {/* 5. FOOTER FEATURE BADGES & INFORMATION (FROM IMAGE 1) */}
      <div className="z-10 pt-4 pb-2 space-y-3">
        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto text-center">
          <div className="flex flex-col items-center gap-1 p-2">
            <div className="p-2 rounded-full bg-white border border-slate-200 shadow-sm text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-600">Safer Batteries</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2">
            <div className="p-2 rounded-full bg-white border border-slate-200 shadow-sm text-emerald-600">
              <Leaf className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-600">Smarter Mobility</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2">
            <div className="p-2 rounded-full bg-white border border-slate-200 shadow-sm text-emerald-600">
              <LineChart className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-600">Cleaner Tomorrow</span>
          </div>
        </div>

        <div className="text-center text-[11px] font-semibold text-slate-400">
          BRAIN v1.0.0 • EV Battery Risk & Analytics Intelligence Network
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
