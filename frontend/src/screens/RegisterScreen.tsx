import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, Mail, Lock, Phone, Car, ShieldCheck } from 'lucide-react';
import { apiService } from '../services/api';

interface RegisterScreenProps {
  onRegisterComplete: () => void;
  onNavigateLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterComplete,
  onNavigateLogin,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    evModel: 'Ather 450X / Ola S1',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your password entry.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.register({
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
      });
      onRegisterComplete();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 selection:bg-emerald-500/20 relative overflow-hidden">
      
      {/* MOBILE CONTAINER FRAME */}
      <div className="w-full sm:max-w-[400px] min-h-screen sm:min-h-[850px] sm:max-h-[920px] sm:rounded-[46px] relative overflow-hidden shadow-2xl border-0 sm:border-[10px] sm:border-slate-900 bg-slate-900 text-slate-900 flex flex-col justify-between p-4 sm:p-5 z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between pt-1 pb-2 relative z-10">
          <button
            type="button"
            onClick={onNavigateLogin}
            className="p-2 bg-slate-800/90 rounded-xl text-slate-300 hover:text-white transition border border-slate-700 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h2 className="text-sm font-black text-white tracking-wider uppercase">CREATE OPERATOR ACCOUNT</h2>
            <p className="text-[10px] font-semibold text-emerald-400">BRAIN EV Intelligence Network</p>
          </div>
          <div className="w-8" />
        </div>

        {/* Form Card */}
        <div className="relative z-10 my-auto bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-slate-200 shadow-2xl space-y-3.5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* FULL NAME */}
            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Dr. Alex Mercer"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="alex.mercer@ev-research.org"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* MOBILE */}
            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* EV VEHICLE SELECTION */}
            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                Primary EV Scooter / Vehicle
              </label>
              <div className="relative">
                <Car className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={formData.evModel}
                  onChange={(e) => handleChange('evModel', e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <option value="Ather 450X / Ola S1">Ather 450X / Ola S1 Pro</option>
                  <option value="Tesla Model Y / 3">Tesla Model Y / Model 3</option>
                  <option value="TVS iQube / Bajaj Chetak">TVS iQube / Bajaj Chetak</option>
                  <option value="NIO / BYD EV">NIO / BYD / MG ZS EV</option>
                  <option value="Custom EV BMS Prototype">Custom EV / Smart BMS Prototype</option>
                </select>
              </div>
            </div>

            {/* PASSWORD & CONFIRM */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-2.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Confirm
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-2.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-lg uppercase tracking-wider cursor-pointer active:scale-[0.99]"
            >
              <span>{isSubmitting ? 'CREATING ACCOUNT...' : 'REGISTER ACCOUNT'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-center text-xs font-semibold text-slate-400 py-2">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateLogin}
            className="text-emerald-400 hover:underline font-extrabold cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;
