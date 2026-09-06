import React, { useState } from 'react';
import { Battery3DView } from '../components/Battery3DView';
import { BrainLogo } from '../components/BrainLogo';
import { Lock, Mail, ArrowRight, PlayCircle, ShieldCheck } from 'lucide-react';
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
  const [demoStatus, setDemoStatus] = useState<'HEALTHY' | 'WATCH' | 'WARNING' | 'CRITICAL'>('HEALTHY');
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
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto relative overflow-hidden">
      {/* Background ambient neon glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00FF87]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-80 h-80 bg-[#FF2A55]/20 rounded-full blur-3xl pointer-events-none" />

      {/* 1. BRAIN BRANDING */}
      <div className="text-center pt-3 pb-2 z-10 flex flex-col items-center">
        <BrainLogo size="xl" showText={true} fullTagline={true} className="my-2" />
      </div>

      {/* 2. 3D INTERACTIVE BATTERY PACK & CONTROLS */}
      <div className="my-2 bg-[#0F1420] rounded-2xl p-3 border-2 border-[#00FF87] shadow-[0_0_25px_rgba(0,255,135,0.3)] relative z-10">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-[#00FF87]" />
            <span className="text-sm font-black tracking-wider text-white uppercase heading-tech">3D TWIN STATUS</span>
          </div>

          {/* Status Controls */}
          <div className="flex items-center gap-1">
            {(['HEALTHY', 'WATCH', 'WARNING', 'CRITICAL'] as const).map((st) => {
              const active = demoStatus === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setDemoStatus(st)}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg transition ${
                    active
                      ? st === 'CRITICAL' || st === 'WARNING'
                        ? 'bg-[#FF2A55] text-white shadow-[0_0_15px_rgba(255,42,85,0.8)] border border-red-300'
                        : 'bg-[#00FF87] text-slate-950 shadow-[0_0_15px_rgba(0,255,135,0.8)] border border-emerald-200'
                      : 'bg-[#182238] text-slate-300 hover:text-white border border-[#2A3854]'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="h-60 w-full rounded-xl overflow-hidden border-2 border-[#2A3854]">
          <Battery3DView status={demoStatus} interactive={true} />
        </div>
      </div>

      {/* 3. HIGH VISIBILITY LOGIN FORM */}
      <div className="bg-[#0F1420] rounded-2xl p-5 border-2 border-[#00FF87]/60 shadow-[0_0_30px_rgba(0,0,0,0.9)] z-10 my-2">
        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-[#FF2A55]/20 border-2 border-[#FF2A55] text-white text-xs font-black">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black tracking-wider text-[#00FF87] mb-1.5 uppercase">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-[#00FF87] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 bg-[#131A2B] border-2 border-[#2A3854] rounded-xl text-base font-bold text-white placeholder-slate-400 focus:outline-none focus:border-[#00FF87] focus:ring-2 focus:ring-[#00FF87]/50 transition-all shadow-inner"
                placeholder="researcher@brain-ev.org"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black tracking-wider text-[#00FF87] mb-1.5 uppercase">
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-[#00FF87] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 bg-[#131A2B] border-2 border-[#2A3854] rounded-xl text-base font-bold text-white placeholder-slate-400 focus:outline-none focus:border-[#00FF87] focus:ring-2 focus:ring-[#00FF87]/50 transition-all shadow-inner"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs font-extrabold text-[#FF2A55] hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* HIGH CONTRAST PRIMARY BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#00FF87] text-slate-950 font-black text-base rounded-xl hover:bg-[#33FF9E] transition flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(0,255,135,0.75)] border-2 border-emerald-200 uppercase tracking-wider heading-tech cursor-pointer"
          >
            <span className="text-slate-950 font-black tracking-wider">
              {isSubmitting ? 'AUTHENTICATING...' : 'AUTHENTICATE & ENTER'}
            </span>
            <ArrowRight className="w-6 h-6 stroke-[3] text-slate-950" />
          </button>
        </form>

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-[#2A3854]" /></div>
          <span className="relative bg-[#0F1420] px-3 text-xs font-black text-slate-300 uppercase tracking-wider">
            DEMO & RESEARCH ACCESS
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDemoClick}
            className="py-3.5 px-3 bg-[#00FF87]/20 text-[#00FF87] border-2 border-[#00FF87] rounded-xl text-xs font-black hover:bg-[#00FF87]/35 transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,135,0.4)]"
          >
            <PlayCircle className="w-5 h-5 text-[#00FF87]" />
            <span className="font-black text-[#00FF87]">DEMO MODE</span>
          </button>
          <button
            onClick={onNavigateRegister}
            className="py-3.5 px-3 bg-[#FF2A55]/20 text-[#FF2A55] border-2 border-[#FF2A55] rounded-xl text-xs font-black hover:bg-[#FF2A55]/35 transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,42,85,0.4)]"
          >
            <span className="font-black text-[#FF2A55]">REGISTER</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center pt-2 pb-1 z-10 text-xs font-bold text-slate-300">
        BRAIN v1.0.0 • EV Battery Risk & Analytics Intelligence Network
      </div>
    </div>
  );
};
