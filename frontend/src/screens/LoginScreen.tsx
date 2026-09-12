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

        {/* 1. BRANDING LOGO */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-1 pt-2 my-1 w-full mx-auto">
          <BrainLogo size="xl" layout="vertical" showFullForm={true} showQuote={false} />
        </div>

        {/* 2. REAL 3D INTERACTIVE BATTERY VISUAL */}
        <div className="relative z-10 my-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-[280px] h-36 sm:h-40 relative flex items-center justify-center mx-auto overflow-visible bg-transparent border-0 shadow-none">
            <ErrorBoundary>
              <Battery3DView status="HEALTHY" interactive={true} hideControls={true} />
            </ErrorBoundary>
          </div>

          <div className="text-[10px] font-extrabold text-slate-200 tracking-wide mt-1.5 bg-slate-900/80 px-3.5 py-1 rounded-full border border-white/20 backdrop-blur-md shadow-md">
            Drag to <span className="text-emerald-400">rotate</span> • Pinch to <span className="text-emerald-400">zoom</span>
          </div>
        </div>

        {/* 3. TRANSPARENT GLASSMORPHIC LOGIN FORM CARD */}
        <div className="relative z-10 space-y-3 my-auto bg-slate-900/40 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-white/20 shadow-2xl">
          {registeredNotice && (
            <div className="p-3 rounded-2xl bg-emerald-600/90 backdrop-blur-md text-white text-xs font-bold shadow-lg flex items-center gap-2 animate-fadeIn border border-emerald-400/40">
              <ShieldCheck className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{registeredNotice}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-600/90 backdrop-blur-md text-white text-xs font-bold shadow-lg border border-red-400/40">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3">
            {/* EMAIL INPUT */}
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/70 backdrop-blur-md border border-white/20 rounded-2xl text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 transition shadow-inner"
                placeholder="Enter your registered email"
              />
            </div>

            {/* PASSWORD INPUT */}
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-11 py-3.5 bg-slate-900/70 backdrop-blur-md border border-white/20 rounded-2xl text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 transition shadow-inner"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => alert('Forgot password instructions sent to your email.')}
                className="text-[11px] font-black text-emerald-400 hover:underline cursor-pointer bg-slate-900/60 px-2.5 py-1 rounded-lg border border-white/10 backdrop-blur-md"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-lg uppercase tracking-wider cursor-pointer active:scale-[0.99] border border-emerald-400/30"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* DIVIDER */}
          <div className="relative my-2 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <span className="relative bg-slate-900/90 px-3 text-[9px] font-black text-slate-300 uppercase tracking-widest rounded-full border border-white/10 backdrop-blur-md">
              OR
            </span>
          </div>

          {/* SECONDARY BUTTONS */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDemoClick}
              className="py-3 px-2 bg-slate-900/60 text-emerald-400 border border-emerald-500/40 rounded-2xl text-[11px] font-extrabold hover:bg-slate-900/80 transition flex items-center justify-center gap-1.5 shadow-md backdrop-blur-md cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Demo Mode</span>
            </button>
            <button
              type="button"
              onClick={onNavigateRegister}
              className="py-3 px-2 bg-slate-900/60 text-white border border-white/20 rounded-2xl text-[11px] font-extrabold hover:bg-slate-900/80 transition flex items-center justify-center gap-1.5 shadow-md backdrop-blur-md cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-300" />
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
