import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, Mail, Lock, Phone, Car, ShieldCheck, Cpu, Edit3 } from 'lucide-react';
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

  // Form State tailored for BRAIN proposed system
  const [role, setRole] = useState<'EV Rider / Owner' | 'Fleet Operations Manager' | 'Battery Researcher / Engineer'>('EV Rider / Owner');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // EV Vehicle Select & Custom Manual Edit
  const [evSelect, setEvSelect] = useState('Ather 450X / Ola S1 Pro');
  const [customEvModel, setCustomEvModel] = useState('');
  const [isCustomEv, setIsCustomEv] = useState(false);

  // Battery Chemistry Select & Custom Manual Edit
  const [chemistrySelect, setChemistrySelect] = useState('NMC (Nickel Manganese Cobalt)');
  const [customChemistry, setCustomChemistry] = useState('');
  const [isCustomChemistry, setIsCustomChemistry] = useState(false);

  const handleEvSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'CUSTOM_MANUAL') {
      setIsCustomEv(true);
    } else {
      setIsCustomEv(false);
      setEvSelect(val);
    }
  };

  const handleChemistrySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'CUSTOM_MANUAL') {
      setIsCustomChemistry(true);
    } else {
      setIsCustomChemistry(false);
      setChemistrySelect(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your password entry.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    const finalEvModel = isCustomEv ? customEvModel.trim() || 'Custom EV Scooter' : evSelect;
    const finalChemistry = isCustomChemistry ? customChemistry.trim() || 'Custom Lithium Cell' : chemistrySelect;

    setIsSubmitting(true);
    try {
      await apiService.register({
        fullName,
        email,
        mobile,
        password,
        role,
        evModel: finalEvModel,
        batteryChemistry: finalChemistry,
      });
      onRegisterComplete();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 selection:bg-emerald-500/20 relative overflow-hidden">
      
      {/* MOBILE CONTAINER FRAME */}
      <div className="w-full sm:max-w-[420px] min-h-screen sm:min-h-[850px] sm:max-h-[920px] sm:rounded-[46px] relative overflow-hidden shadow-2xl border-0 sm:border-[10px] sm:border-slate-900 bg-slate-900 text-slate-900 flex flex-col justify-between p-4 sm:p-5 z-10 overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pt-1 pb-2 relative z-10 shrink-0">
          <button
            type="button"
            onClick={onNavigateLogin}
            className="p-2 bg-slate-800/90 rounded-xl text-slate-300 hover:text-white transition border border-slate-700 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h2 className="text-sm font-black text-white tracking-wider uppercase">OPERATOR REGISTRATION</h2>
            <p className="text-[10px] font-semibold text-emerald-400">BRAIN EV Risk & Analytics Network</p>
          </div>
          <div className="w-8" />
        </div>

        {/* Form Card */}
        <div className="relative z-10 my-auto bg-white/95 backdrop-blur-md rounded-3xl p-4.5 sm:p-5 border border-slate-200 shadow-2xl space-y-3">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* 1. ROLE SELECTION */}
            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                Account Type / System Role
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'EV Rider / Owner', label: 'EV Rider', sub: 'Personal Pack' },
                  { id: 'Fleet Operations Manager', label: 'Fleet Ops', sub: 'Multi EV Fleet' },
                  { id: 'Battery Researcher / Engineer', label: 'Researcher', sub: 'PINN AI & PKL' },
                ].map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setRole(r.id as any)}
                    className={`py-2 px-1.5 rounded-xl border text-center transition cursor-pointer ${
                      role === r.id
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <div className="text-[10px] font-black leading-tight">{r.label}</div>
                    <div className={`text-[8px] mt-0.5 ${role === r.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {r.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. FULL NAME */}
            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Alex Mercer"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* 3. EMAIL & MOBILE */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@brain-ev.org"
                    className="w-full pl-9 pr-2 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Mobile (SMS Alerts)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+1 555-0192"
                    className="w-full pl-9 pr-2 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* 4. EV VEHICLE MODEL (PRESET DROPDOWN + CUSTOM MANUAL EDIT) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                  EV Scooter / Vehicle Model
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomEv(!isCustomEv)}
                  className="text-[9px] font-extrabold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  {isCustomEv ? 'Choose Preset' : 'Type Custom'}
                </button>
              </div>

              {isCustomEv ? (
                <div className="relative">
                  <Edit3 className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customEvModel}
                    onChange={(e) => setCustomEvModel(e.target.value)}
                    placeholder="Enter custom EV name (e.g. Ather 450 Apex, Ola S1 Air)"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-emerald-400 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              ) : (
                <div className="relative">
                  <Car className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={evSelect}
                    onChange={handleEvSelectChange}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="Ather 450X / Ola S1 Pro">Ather 450X / Ola S1 Pro (EV Scooter)</option>
                    <option value="Tesla Model Y / Model 3">Tesla Model Y / Model 3</option>
                    <option value="TVS iQube / Bajaj Chetak">TVS iQube / Bajaj Chetak</option>
                    <option value="BYD Atto 3 / MG ZS EV">BYD Atto 3 / MG ZS EV</option>
                    <option value="Smart BMS Hardware Rig">Smart BMS Hardware Rig / Prototype</option>
                    <option value="CUSTOM_MANUAL">✏️ Type Custom EV Name Manually...</option>
                  </select>
                </div>
              )}
            </div>

            {/* 5. BATTERY CHEMISTRY (PRESET DROPDOWN + CUSTOM MANUAL EDIT) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                  Battery Cell Chemistry
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomChemistry(!isCustomChemistry)}
                  className="text-[9px] font-extrabold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  {isCustomChemistry ? 'Choose Preset' : 'Type Custom'}
                </button>
              </div>

              {isCustomChemistry ? (
                <div className="relative">
                  <Edit3 className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customChemistry}
                    onChange={(e) => setCustomChemistry(e.target.value)}
                    placeholder="Enter chemistry (e.g. LTO, Sodium-Ion, Solid State)"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-emerald-400 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              ) : (
                <div className="relative">
                  <Cpu className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={chemistrySelect}
                    onChange={handleChemistrySelectChange}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="NMC (Nickel Manganese Cobalt)">NMC (Nickel Manganese Cobalt - High Energy Density)</option>
                    <option value="LFP (Lithium Iron Phosphate)">LFP (Lithium Iron Phosphate - High Thermal Safety)</option>
                    <option value="NCA (Nickel Cobalt Aluminum)">NCA (Nickel Cobalt Aluminum - Tesla Architecture)</option>
                    <option value="Solid State Lithium">Solid State Lithium (Next-Gen Safety Matrix)</option>
                    <option value="CUSTOM_MANUAL">✏️ Type Custom Chemistry Manually...</option>
                  </select>
                </div>
              )}
            </div>

            {/* 6. PASSWORD & CONFIRM */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-2 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Confirm
                </label>
                <div className="relative">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-2 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-lg uppercase tracking-wider cursor-pointer active:scale-[0.99]"
            >
              <span>{isSubmitting ? 'CREATING ACCOUNT...' : 'REGISTER OPERATOR ACCOUNT'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-center text-xs font-semibold text-slate-400 py-2 shrink-0">
          Already registered?{' '}
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
