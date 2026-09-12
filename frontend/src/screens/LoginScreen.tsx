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
          <div className="w-full max-w-[280px] h-36 sm:h-40 relative flex items-center justify-center mx-auto overflow-visible bg-transparent border-0 shadow-none">
            <ErrorBoundary>
              <Battery3DView status="HEALTHY" interactive={true} hideControls={true} />
            </ErrorBoundary>
          </div>
        </div>

        {/* 3. WATER-TRANSPARENT GLASSMORPHIC LOGIN FORM CARD */}
        <div className="relative z-10 space-y-3.5 my-auto bg-white/[0.04] backdrop-blur-2xl p-5 sm:p-6 rounded-[28px] border border-white/30 border-t-white/50 border-b-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.4)] transition-all duration-300 hover:border-white/40">
          {registeredNotice && (
            <div className="p-3 rounded-2xl bg-emerald-600/70 backdrop-blur-xl text-white text-xs font-bold shadow-[0_8px_20px_rgba(5,150,105,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] flex items-center gap-2 animate-fadeIn border border-emerald-400/50 border-t-white/40">
              <ShieldCheck className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{registeredNotice}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-600/70 backdrop-blur-xl text-white text-xs font-bold shadow-[0_8px_20px_rgba(220,38,38,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-red-400/50 border-t-white/40">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            {/* EMAIL INPUT (WATER GLASS BAR) */}
            <div className="relative group">
              <Mail className="w-4 h-4 text-slate-200 group-focus-within:text-emerald-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.06] backdrop-blur-xl border border-white/25 border-t-white/40 border-b-white/10 rounded-2xl text-xs font-bold text-white placeholder-slate-300 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition-all duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_4px_15px_rgba(0,0,0,0.3)] hover:bg-white/[0.12]"
                placeholder="Enter your registered email"
              />
            </div>

            {/* PASSWORD INPUT (WATER GLASS BAR) */}
            <div className="relative group">
              <Lock className="w-4 h-4 text-slate-200 group-focus-within:text-emerald-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-11 py-3.5 bg-white/[0.06] backdrop-blur-xl border border-white/25 border-t-white/40 border-b-white/10 rounded-2xl text-xs font-bold text-white placeholder-slate-300 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition-all duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_4px_15px_rgba(0,0,0,0.3)] hover:bg-white/[0.12]"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 hover:text-white transition cursor-pointer z-10"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => alert('Forgot password instructions sent to your email.')}
                className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 cursor-pointer bg-white/[0.08] hover:bg-white/[0.18] px-3 py-1 rounded-xl border border-white/25 border-t-white/40 backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all active:scale-95"
              >
                Forgot Password?
              </button>
            </div>

            {/* WATER GLASS EMBOSSED SIGN IN BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-600/80 hover:bg-emerald-500/90 backdrop-blur-xl text-white font-black text-xs sm:text-sm rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(16,185,129,0.4),inset_0_1px_2px_rgba(255,255,255,0.5)] border border-emerald-400/60 border-t-white/50 uppercase tracking-wider cursor-pointer active:translate-y-[1px] active:shadow-[0_4px_10px_rgba(16,185,129,0.3)] disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* DIVIDER WITH WATER GLASS PILL */}
          <div className="relative my-2.5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <span className="relative bg-white/[0.1] px-3 py-0.5 text-[9px] font-black text-slate-200 uppercase tracking-widest rounded-full border border-white/30 border-t-white/50 backdrop-blur-xl shadow-[0_2px_6px_rgba(0,0,0,0.3)]">
              OR
            </span>
          </div>

          {/* SECONDARY WATER GLASS BUTTONS */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDemoClick}
              className="py-3 px-2 bg-white/[0.06] text-emerald-400 border border-emerald-400/40 border-t-white/40 rounded-2xl text-[11px] font-extrabold hover:bg-white/[0.15] transition-all duration-200 flex items-center justify-center gap-1.5 shadow-[0_6px_16px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-xl cursor-pointer active:scale-95"
            >
              <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Demo Mode</span>
            </button>
            <button
              type="button"
              onClick={onNavigateRegister}
              className="py-3 px-2 bg-white/[0.06] text-white border border-white/25 border-t-white/40 rounded-2xl text-[11px] font-extrabold hover:bg-white/[0.15] transition-all duration-200 flex items-center justify-center gap-1.5 shadow-[0_6px_16px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-xl cursor-pointer active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-200" />
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
