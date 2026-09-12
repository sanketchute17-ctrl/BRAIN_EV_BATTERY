import React, { useState } from 'react';
import { Battery3DView } from '../components/Battery3DView';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { BrainLogo } from '../components/BrainLogo';
import { Lock, Mail, ArrowRight, PlayCircle, Eye, EyeOff, UserPlus, ShieldCheck } from 'lucide-react';
import { apiService } from '../services/api';
import scooterBg from '../assets/scooter_bg.jpg';

interface LoginScreenProps {
  onLoginSuccess: (isDemo?: boolean) => void;
  onNavigateRegister: () => void;
  initialEmail?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  initialEmail,
}) => {
  const [email, setEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [registeredNotice] = useState(initialEmail ? 'Account created successfully in database! Please sign in with your password.' : '');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await apiService.login({ email, password });
      onLoginSuccess(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = () => {
    onLoginSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 selection:bg-emerald-500/20 relative overflow-hidden">
      
      {/* MOBILE APP CONTAINER FRAME */}
      <div className="w-full sm:max-w-[400px] min-h-screen sm:min-h-[850px] sm:max-h-[920px] sm:rounded-[46px] relative overflow-hidden shadow-2xl border-0 sm:border-[10px] sm:border-slate-900 bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-6 z-10">
        
        {/* SCOOTER BACKGROUND OVERLAY */}
        <div 
          className="absolute inset-0 z-0 bg-[size:100%_100%] bg-center bg-no-repeat pointer-events-none opacity-50"
          style={{ backgroundImage: `url(${scooterBg})` }}
        />

        {/* 1. BRANDING LOGO WITH 'THINK AHEAD' QUOTE */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-1 pt-2 my-1 w-full mx-auto">
          <BrainLogo size="xl" layout="vertical" showFullForm={true} showQuote={true} />
        </div>

        {/* 2. REAL 3D INTERACTIVE BATTERY VISUAL */}
        <div className="relative z-10 my-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-[340px] h-40 sm:h-44 relative flex items-center justify-center mx-auto overflow-visible bg-transparent border-0 shadow-none">
            <ErrorBoundary>
              <Battery3DView status="HEALTHY" interactive={true} hideControls={true} />
            </ErrorBoundary>
          </div>
        </div>

        {/* 3. FLOATING TRANSPARENT INPUT FORM AND BUTTONS */}
        <div className="relative z-10 space-y-3.5 my-auto w-full max-w-[340px] mx-auto px-1">
          {registeredNotice && (
            <div className="p-3.5 rounded-full bg-emerald-600/90 backdrop-blur-xl text-white text-xs font-black shadow-[0_8px_20px_rgba(5,150,105,0.4)] flex items-center justify-center gap-2 animate-fadeIn border border-emerald-300/50 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{registeredNotice}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-full bg-red-600/90 backdrop-blur-xl text-white text-xs sm:text-sm font-black shadow-[0_8px_20px_rgba(220,38,38,0.5)] border border-red-400/60 text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            {/* EMAIL INPUT (HIGH-CONTRAST WATER GLASS PILL) */}
            <div className="relative group">
              <Mail className="w-4.5 h-4.5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] absolute left-4 top-1/2 -translate-y-1/2 z-10" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-900/35 hover:bg-slate-900/45 focus:bg-slate-900/55 backdrop-blur-2xl border border-white/35 border-t-white/60 border-b-black/40 rounded-full text-xs sm:text-sm font-extrabold text-white placeholder-slate-200 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.3)]"
                placeholder="Enter your registered email"
              />
            </div>

            {/* PASSWORD INPUT (HIGH-CONTRAST WATER GLASS PILL) */}
            <div className="relative group">
              <Lock className="w-4.5 h-4.5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] absolute left-4 top-1/2 -translate-y-1/2 z-10" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-3.5 bg-slate-900/35 hover:bg-slate-900/45 focus:bg-slate-900/55 backdrop-blur-2xl border border-white/35 border-t-white/60 border-b-black/40 rounded-full text-xs sm:text-sm font-extrabold text-white placeholder-slate-200 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.3)]"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-white transition cursor-pointer z-10"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>

            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => alert('Forgot password instructions sent to your email.')}
                className="text-[11px] font-black text-emerald-300 hover:text-emerald-200 cursor-pointer bg-emerald-950/40 hover:bg-emerald-900/60 px-3.5 py-1.5 rounded-full border border-emerald-400/40 border-t-emerald-300/60 backdrop-blur-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all active:scale-95"
              >
                Forgot Password?
              </button>
            </div>

            {/* VIVID 3D EMBOSSED SIGN IN BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm sm:text-base rounded-full transition-all duration-300 flex items-center justify-center gap-2.5 shadow-[0_10px_25px_rgba(16,185,129,0.5),inset_0_1px_2px_rgba(255,255,255,0.5)] border border-emerald-300/60 uppercase tracking-widest cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'SIGN IN'}</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>
          </form>

          {/* DIVIDER WITH GLASS PILL */}
          <div className="relative my-3 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/30" />
            </div>
            <span className="relative bg-slate-900/60 px-4 py-0.5 text-[10px] font-black text-emerald-300 uppercase tracking-widest rounded-full border border-emerald-400/40 border-t-emerald-300/60 backdrop-blur-xl shadow-[0_2px_6px_rgba(0,0,0,0.2)]">
              OR
            </span>
          </div>

          {/* SECONDARY COLORFUL TRANSPARENT PILL BUTTONS */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDemoClick}
              className="py-3.5 px-3 bg-emerald-950/40 text-emerald-300 border border-emerald-400/50 border-t-emerald-300/70 rounded-full text-xs font-black hover:bg-emerald-900/60 transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(16,185,129,0.25)] backdrop-blur-xl cursor-pointer active:scale-95"
            >
              <PlayCircle className="w-4 h-4 text-emerald-400" />
              <span>Demo Mode</span>
            </button>
            <button
              type="button"
              onClick={onNavigateRegister}
              className="py-3.5 px-3 bg-sky-950/40 text-sky-300 border border-sky-400/50 border-t-sky-300/70 rounded-full text-xs font-black hover:bg-sky-900/60 transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(56,189,248,0.25)] backdrop-blur-xl cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-sky-400" />
              <span>Register</span>
            </button>
          </div>
        </div>

        {/* Footer padding */}
        <div className="pb-1" />
      </div>
    </div>
  );
};

export default LoginScreen;
