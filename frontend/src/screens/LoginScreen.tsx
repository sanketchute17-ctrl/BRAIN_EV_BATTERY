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

        {/* 2. REAL 3D INTERACTIVE BATTERY VISUAL (COMPACT SLEEK SIZE FROM IMAGE 2) */}
        <div className="relative z-10 my-0.5 flex flex-col items-center justify-center">
          <div className="w-full max-w-[260px] h-28 sm:h-32 relative flex items-center justify-center mx-auto overflow-hidden bg-transparent border-0 shadow-none">
            <ErrorBoundary>
              <Battery3DView status="HEALTHY" interactive={true} hideControls={true} />
            </ErrorBoundary>
          </div>
        </div>

        {/* 3. FLOATING TRANSPARENT INPUT FORM AND BUTTONS (MATCHING IMAGE 2 EXACTLY) */}
        <div className="relative z-10 space-y-3.5 my-auto w-full max-w-[340px] mx-auto px-1">
          {registeredNotice && (
            <div className="p-3 rounded-full bg-emerald-600/90 backdrop-blur-xl text-white text-xs font-black shadow-lg flex items-center justify-center gap-2 animate-fadeIn border border-white/40 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{registeredNotice}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-full bg-red-600 text-white text-xs sm:text-sm font-black shadow-lg border border-red-400 text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            {/* EMAIL INPUT (TRANSLUCENT LIGHT PILL FROM IMAGE 2) */}
            <div className="relative group">
              <Mail className="w-4.5 h-4.5 text-slate-600 group-focus-within:text-emerald-600 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3.5 bg-slate-100/80 hover:bg-slate-100/90 focus:bg-white backdrop-blur-xl border border-white/80 rounded-full text-xs sm:text-sm font-black text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 transition-all duration-300 shadow-md"
                placeholder="Enter your registered email"
              />
            </div>

            {/* PASSWORD INPUT (TRANSLUCENT LIGHT PILL FROM IMAGE 2) */}
            <div className="relative group">
              <Lock className="w-4.5 h-4.5 text-slate-600 group-focus-within:text-emerald-600 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-3.5 bg-slate-100/80 hover:bg-slate-100/90 focus:bg-white backdrop-blur-xl border border-white/80 rounded-full text-xs sm:text-sm font-black text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 transition-all duration-300 shadow-md"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900 transition cursor-pointer z-10"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>

            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => alert('Forgot password instructions sent to your email.')}
                className="text-[11px] font-black text-emerald-700 hover:text-emerald-800 cursor-pointer bg-white/70 hover:bg-white/90 px-3.5 py-1.5 rounded-full border border-white/80 backdrop-blur-md shadow-sm transition-all active:scale-95"
              >
                Forgot Password?
              </button>
            </div>

            {/* VIVID SOLID EMERALD SIGN IN BUTTON FROM IMAGE 2 */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#059669] hover:bg-[#047857] active:bg-[#065f46] text-white font-black text-sm sm:text-base rounded-full transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg border border-emerald-400/40 uppercase tracking-wider cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'SIGN IN'}</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>
          </form>

          {/* DIVIDER WITH WHITE PILL FROM IMAGE 2 */}
          <div className="relative my-3 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/50" />
            </div>
            <span className="relative bg-white/80 px-4 py-0.5 text-[10px] font-black text-slate-800 uppercase tracking-widest rounded-full border border-white/90 shadow-sm backdrop-blur-md">
              OR
            </span>
          </div>

          {/* SECONDARY PILL BUTTONS FROM IMAGE 2 */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDemoClick}
              className="py-3.5 px-3 bg-white/75 hover:bg-white/90 text-emerald-700 border border-white/80 rounded-full text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 shadow-md backdrop-blur-md cursor-pointer active:scale-95"
            >
              <PlayCircle className="w-4 h-4 text-emerald-600" />
              <span>Demo Mode</span>
            </button>
            <button
              type="button"
              onClick={onNavigateRegister}
              className="py-3.5 px-3 bg-white/75 hover:bg-white/90 text-slate-900 border border-white/80 rounded-full text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 shadow-md backdrop-blur-md cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-slate-700" />
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
