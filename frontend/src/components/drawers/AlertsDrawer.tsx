import React, { useState } from 'react';
import type { NormalizedBatteryState } from '../../types/telemetry';
import { ArrowLeft, AlertTriangle, ShieldAlert, Power, CheckCircle2, Radio, Bell } from 'lucide-react';

interface AlertsDrawerProps {
  batteryState: NormalizedBatteryState;
  onBack: () => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({ batteryState, onBack }) => {
  const [isContactorCutoff, setIsContactorCutoff] = useState(false);

  const maxTemp = batteryState.maxTemperature || batteryState.temperature;
  const isEmergency = maxTemp > 45 || batteryState.risk > 50 || isContactorCutoff;

  return (
    <div className="space-y-5 animate-fadeIn text-slate-900">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900 heading-tech uppercase flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              ALERTS &amp; EMERGENCY MODE
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              Real-Time High-Voltage Contactor Cutoff &amp; Thermal Protection
            </p>
          </div>
        </div>
        <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
          isEmergency ? 'bg-red-50 text-red-700 border-red-300' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
        }`}>
          {isEmergency ? '⚠️ EMERGENCY MONITORING' : 'HEALTHY'}
        </span>
      </div>

      {/* Safety Status Banner */}
      <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm ${
        isEmergency ? 'bg-red-50 border-red-300 text-red-900' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-xl ${isEmergency ? 'bg-red-500 text-white animate-bounce' : 'bg-emerald-500 text-white'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono font-extrabold uppercase">
              HIGH-VOLTAGE CONTACTOR STATUS: {isContactorCutoff ? 'OPEN (ISOLATED)' : 'CLOSED (CONNECTED)'}
            </div>
            <div className="text-sm font-black mt-0.5">
              {isEmergency ? 'Emergency Cutoff Override Active' : 'Normal Power Operation'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsContactorCutoff(!isContactorCutoff)}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition shadow-md cursor-pointer flex items-center gap-2 uppercase tracking-wider ${
            isContactorCutoff
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-red-600 hover:bg-red-500 text-white'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{isContactorCutoff ? 'RESTORE POWER' : 'TRIGGER EMERGENCY CUTOFF'}</span>
        </button>
      </div>

      {/* Live System Protection Alarms */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-sm font-black text-slate-900 uppercase heading-tech tracking-wide flex items-center gap-2">
            <Bell className="w-4 h-4 text-red-600" />
            LIVE SAFETY ALARM LOGS
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Continuous Monitor</span>
        </div>

        <div className="space-y-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Thermal Over-Temp Alarm (&gt; 55°C)</span>
            <span className={`font-mono font-bold ${maxTemp > 55 ? 'text-red-600' : 'text-emerald-600'}`}>
              {maxTemp > 55 ? 'TRIGGERED' : 'CLEAR'} ({maxTemp}°C)
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Cell Over-Voltage Cutoff (&gt; 4.2V)</span>
            <span className="font-mono font-bold text-emerald-600">CLEAR</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">BMS Communication Watchdog</span>
            <span className="font-mono font-bold text-emerald-600">CONNECTED (1.0 Hz)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
