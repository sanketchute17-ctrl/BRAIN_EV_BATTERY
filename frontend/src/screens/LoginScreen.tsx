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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto relative overflow-hidden">
      {/* Background ambient light glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. BRAIN BRANDING */}
      <div className="text-center pt-3 pb-2 z-10 flex flex-col items-center">
        <BrainLogo size="xl" showText={true} fullTagline={true} className="my-2" />
      </div>

      {/* 2. 3D INTERACTIVE BATTERY PACK & CONTROLS */}
      <div className="my-2 bg-white rounded-2xl p-3.5 border border-slate-200 shadow-md relative z-10">
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-extrabold tracking-tight text-slate-800 uppercase heading-tech">3D TWIN STATUS</span>
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
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    active
                      ? st === 'CRITICAL' || st === 'WARNING'
                        ? 'bg-red-500 text-white shadow-sm border border-red-400'
                        : 'bg-emerald-500 text-white shadow-sm border border-emerald-400'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="h-56 w-full rounded-xl overflow-hidden border border-slate-200">
          <Battery3DView status={demoStatus} interactive={true} />
        </div>
      </div>

      {/* 3. HIGH VISIBILITY LOGIN FORM */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-lg z-10 my-2 space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold tracking-wider text-slate-700 mb-1.5 uppercase">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-base font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-sm"
                placeholder="researcher@brain-ev.org"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold tracking-wider text-slate-700 mb-1.5 uppercase">
              PASSWORD
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-base font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-sm"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs font-bold text-red-500 hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* PRIMARY BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-emerald-500 text-white font-extrabold text-base rounded-xl hover:bg-emerald-600 transition flex items-center justify-center gap-2.5 shadow-emerald border border-emerald-400 uppercase tracking-wider heading-tech cursor-pointer"
          >
            <span>
              {isSubmitting ? 'AUTHENTICATING...' : 'AUTHENTICATE & ENTER'}
            </span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </form>

        <div className="relative my-3 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
          <span className="relative bg-white px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
            DEMO & RESEARCH ACCESS
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDemoClick}
            className="py-3 px-3 bg-emerald-50 text-emerald-700 border-2 border-emerald-500 rounded-xl text-xs font-bold hover:bg-emerald-100 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <PlayCircle className="w-4 h-4 text-emerald-600" />
            <span>DEMO MODE</span>
          </button>
          <button
            onClick={onNavigateRegister}
            className="py-3 px-3 bg-slate-100 text-slate-800 border-2 border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <span>REGISTER</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center pt-2 pb-1 z-10 text-xs font-semibold text-slate-400">
        BRAIN v1.0.0 • EV Battery Risk & Analytics Intelligence Network
      </div>
    </div>
  );
};
