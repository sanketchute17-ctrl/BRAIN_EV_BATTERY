import React, { useState } from 'react';
import { Battery3DView } from '../components/Battery3DView';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { BrainLogo } from '../components/BrainLogo';
import { Lock, Mail, ArrowRight, PlayCircle, Eye, EyeOff, UserPlus, Leaf, ShieldCheck, BarChart2 } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 selection:bg-emerald-500/20 relative overflow-hidden">
      
      {/* MOBILE APP CONTAINER FRAME */}
      <div className="w-full sm:max-w-[400px] min-h-screen sm:min-h-[850px] sm:max-h-[920px] sm:rounded-[46px] relative overflow-hidden shadow-2xl border-0 sm:border-[10px] sm:border-slate-900 bg-slate-900 text-slate-900 flex flex-col justify-between p-4 sm:p-5 z-10">
        
        {/* 40% VISIBILITY SCOOTER BACKGROUND OVERLAY (INSIDE MOBILE VIEW) */}
        <div 
          className="absolute inset-0 z-0 bg-[size:100%_100%] bg-center bg-no-repeat pointer-events-none opacity-40"
          style={{ backgroundImage: `url(${scooterBg})` }}
        />

        {/* TOP SUB-TAGLINE */}
        <div className="relative z-10 flex items-center justify-end text-[10px] font-bold text-slate-800 gap-1.5 pt-1">
          <Leaf className="w-3.5 h-3.5 text-[#059669]" />
          <div className="text-right leading-tight text-[9px] font-black">
            A Cleaner<br />Greener Tomorrow
          </div>
        </div>

        {/* 1. BRANDING LOGO & TAGLINE */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-1 my-1 w-full mx-auto">
          <BrainLogo size="xl" layout="vertical" showFullForm={true} showQuote={true} />
        </div>

        {/* 2. REAL 3D INTERACTIVE BATTERY VISUAL */}
        <div className="relative z-10 my-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-[280px] h-36 sm:h-40 relative flex items-center justify-center mx-auto overflow-visible bg-transparent border-0 shadow-none">
            <ErrorBoundary>
              <Battery3DView status="HEALTHY" interactive={true} hideControls={true} />
            </ErrorBoundary>
          </div>

          <div className="text-[10px] font-extrabold text-slate-100 tracking-wide mt-1.5 bg-slate-900/75 px-3 py-0.5 rounded-full border border-slate-700/70 backdrop-blur-xs shadow-sm">
            Drag to <span className="text-[#00E676]">rotate</span> • Pinch to <span className="text-[#00E676]">zoom</span>
          </div>
        </div>

        {/* 3. INPUT FORM CARD - 100% TRANSPARENT LOGIN BOX WITHOUT BORDER LINES */}
        <div className="relative z-10 space-y-2.5 my-1 bg-transparent p-2 border-0 shadow-none">
          {errorMsg && (
            <div className="p-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-2.5">
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-white/90 border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 transition shadow-xs focus:bg-white"
                placeholder="researcher@brain-ev.org"
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-11 py-3 bg-white/90 border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 transition shadow-xs focus:bg-white"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => alert('Forgot password instructions sent to your email.')}
                className="text-[11px] font-black text-[#047857] hover:underline cursor-pointer bg-white/80 px-2 py-0.5 rounded-md backdrop-blur-xs"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#059669] hover:bg-[#047857] text-white font-black text-xs sm:text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-lg uppercase tracking-wider cursor-pointer active:scale-[0.99]"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* DIVIDER */}
          <div className="relative my-2 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300/80" />
            </div>
            <span className="relative bg-white/80 px-3 text-[9px] font-black text-slate-700 uppercase tracking-widest rounded-full backdrop-blur-xs">
              OR
            </span>
          </div>

          {/* SECONDARY BUTTONS */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDemoClick}
              className="py-2.5 px-2 bg-white/90 text-[#059669] border border-slate-300 rounded-2xl text-[11px] font-extrabold hover:bg-white transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 text-[#059669]" />
              <span>Demo Mode</span>
            </button>
            <button
              type="button"
              onClick={onNavigateRegister}
              className="py-2.5 px-2 bg-white/90 text-slate-800 border border-slate-300 rounded-2xl text-[11px] font-extrabold hover:bg-white transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-600" />
              <span>Register</span>
            </button>
          </div>
        </div>

        {/* 4. THREE BOTTOM FEATURE BADGES */}
        <div className="relative z-10 grid grid-cols-3 gap-2 pt-2 text-center bg-white/50 backdrop-blur-xs rounded-2xl p-1.5">
          <div className="flex flex-col items-center gap-0.5">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span className="text-[9px] font-extrabold text-slate-900 leading-tight">Safer<br />Batteries</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Leaf className="w-4 h-4 text-[#059669]" />
            <span className="text-[9px] font-extrabold text-slate-900 leading-tight">Smarter<br />Mobility</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <BarChart2 className="w-4 h-4 text-[#059669]" />
            <span className="text-[9px] font-extrabold text-slate-900 leading-tight">Brighter<br />Tomorrow</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
