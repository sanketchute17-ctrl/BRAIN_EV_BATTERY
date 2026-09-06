import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, Car, Battery } from 'lucide-react';
import { apiService } from '../services/api';

interface RegisterScreenProps {
  onRegisterComplete: () => void;
  onNavigateLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterComplete,
  onNavigateLogin,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    make: 'Tesla',
    model: 'Model Y',
    variant: 'Long Range',
    modelYear: '2024',
    vin: '',
    odometer: '12500',
    chemistry: 'NMC',
    capacityKwh: '75',
    serialNumber: 'BAT-2024-8849',
    bmsModel: 'BRAIN Smart BMS v2',
    cellCount: '96',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep((prev) => (prev + 1) as 2 | 3);
    } else {
      setIsSubmitting(true);
      try {
        await apiService.register({
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password,
        });
      } catch (err) {
        console.warn('Registration fallback:', err);
      } finally {
        setIsSubmitting(false);
        onRegisterComplete();
      }
    }
  };

  return (
    <div className="min-h-screen bg-brain-black text-slate-100 flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 pb-3">
        <button
          onClick={step === 1 ? onNavigateLogin : () => setStep((prev) => (prev - 1) as 1 | 2)}
          className="p-2.5 glass-panel-premium rounded-xl text-electric-green hover:bg-electric-green/20 transition border border-brain-border"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold text-electric-green tracking-wide heading-tech uppercase">OPERATOR ONBOARDING</h2>
          <p className="text-xs font-semibold text-slate-400">STEP {step} OF 3</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Stepper Progress Bar */}
      <div className="flex items-center justify-between my-3 px-2">
        {[
          { num: 1, label: 'User', icon: User },
          { num: 2, label: 'Vehicle', icon: Car },
          { num: 3, label: 'Battery', icon: Battery },
        ].map((s) => {
          const Icon = s.icon;
          const active = step >= s.num;
          return (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border transition ${
                  active
                    ? 'bg-electric-green text-brain-black border-emerald-200 shadow-neon-green'
                    : 'bg-brain-navy border-brain-border text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              {s.num < 3 && (
                <div
                  className={`w-16 h-1 transition ${
                    step > s.num ? 'bg-electric-green' : 'bg-brain-border'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Form Card */}
      <div className="glass-panel-premium rounded-2xl p-5 border border-brain-border shadow-2xl my-2">
        <form onSubmit={handleNext} className="space-y-4">
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <h3 className="text-base text-electric-green font-bold flex items-center gap-2 mb-3 heading-tech">
                <User className="w-5 h-5 text-electric-green" />
                <span>Operator Profile Information</span>
              </h3>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">FULL NAME</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Dr. Alex Mercer"
                  className="input-high-contrast"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="alex.mercer@ev-research.org"
                  className="input-high-contrast"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">MOBILE NUMBER</label>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="input-high-contrast"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">PASSWORD</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="••••••••"
                    className="input-high-contrast"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">CONFIRM</label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    className="input-high-contrast"
                  />
                </div>
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <h3 className="text-base text-electric-green font-bold flex items-center gap-2 mb-3 heading-tech">
                <Car className="w-5 h-5 text-electric-green" />
                <span>Vehicle Specifications</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">MAKE</label>
                  <input
                    type="text"
                    required
                    value={formData.make}
                    onChange={(e) => handleChange('make', e.target.value)}
                    className="input-high-contrast"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">MODEL</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    className="input-high-contrast"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">VARIANT</label>
                  <input
                    type="text"
                    value={formData.variant}
                    onChange={(e) => handleChange('variant', e.target.value)}
                    className="input-high-contrast"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">YEAR</label>
                  <input
                    type="text"
                    value={formData.modelYear}
                    onChange={(e) => handleChange('modelYear', e.target.value)}
                    className="input-high-contrast"
                  />
                </div>
              </div>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <h3 className="text-base text-electric-green font-bold flex items-center gap-2 mb-3 heading-tech">
                <Battery className="w-5 h-5 text-electric-green" />
                <span>Battery & BMS Details</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">CHEMISTRY</label>
                  <select
                    value={formData.chemistry}
                    onChange={(e) => handleChange('chemistry', e.target.value)}
                    className="input-high-contrast text-white bg-brain-navy"
                  >
                    <option value="NMC">NMC (Nickel Manganese)</option>
                    <option value="LFP">LFP (Lithium Iron)</option>
                    <option value="NCA">NCA (Nickel Cobalt)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">CAPACITY (KWH)</label>
                  <input
                    type="number"
                    value={formData.capacityKwh}
                    onChange={(e) => handleChange('capacityKwh', e.target.value)}
                    className="input-high-contrast"
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-3 flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev - 1) as 1 | 2)}
                className="py-3 px-5 bg-brain-navy border border-brain-border text-slate-200 rounded-xl text-sm font-bold hover:bg-brain-border"
              >
                BACK
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3.5 bg-electric-green text-brain-black font-extrabold text-sm rounded-xl hover:bg-emerald-300 transition flex items-center justify-center gap-2 shadow-neon-green border border-emerald-200 heading-tech uppercase"
            >
              <span>{step === 3 ? (isSubmitting ? 'REGISTERING...' : 'COMPLETE REGISTRATION') : 'NEXT STEP'}</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>

      <div className="text-center text-xs font-semibold text-slate-400 pb-2">
        Already registered?{' '}
        <button onClick={onNavigateLogin} className="text-electric-green hover:underline font-bold">
          Sign In
        </button>
      </div>
    </div>
  );
};
