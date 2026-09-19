import React, { useState } from 'react';
import type { NormalizedBatteryState } from '../../types/telemetry';
import { ArrowLeft, AlertTriangle, ShieldAlert, Power, CheckCircle2, Radio, Bell, Info, Activity, AlertCircle } from 'lucide-react';
import { PinnEngine } from '../../services/pinnEngine';

interface AlertsDrawerProps {
  batteryState: NormalizedBatteryState;
  onBack: () => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({ batteryState, onBack }) => {
  const [isContactorCutoff, setIsContactorCutoff] = useState(false);

  const maxTemp = batteryState.maxTemperature || batteryState.temperature;
  const pinn = PinnEngine.evaluatePhysicsModel(batteryState);

  // Compute Minor & Major Battery Problems
  const minorProblems: { title: string; desc: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }[] = [];

  if (pinn.cellImbalanceIndex > 0.025) {
    minorProblems.push({
      title: 'Cell Voltage Imbalance Warning',
      desc: `Cell variance is ${(pinn.cellImbalanceIndex * 1000).toFixed(0)}mV. Passive balancing recommended.`,
      severity: 'MEDIUM',
    });
  }

  if (maxTemp > 42) {
    minorProblems.push({
      title: 'Elevated Operating Temperature',
      desc: `Battery max temp reached ${maxTemp}°C (Normal: 25-38°C). Avoid prolonged fast charging.`,
      severity: maxTemp > 50 ? 'HIGH' : 'MEDIUM',
    });
  }

  if (batteryState.internalResistance > 1.5) {
    minorProblems.push({
      title: 'Increased Internal Resistance (Esr)',
      desc: `Resistance at ${batteryState.internalResistance} mΩ/cell. Slight ohmic heating expected.`,
      severity: 'LOW',
    });
  }

  if (batteryState.soc > 0 && batteryState.soc < 20) {
    minorProblems.push({
      title: 'Low State of Charge (SOC < 20%)',
      desc: `Battery level is at ${Math.round(batteryState.soc)}%. Connect charger to prevent cell deep discharge.`,
      severity: 'LOW',
    });
  }

  const isEmergency = maxTemp > 50 || batteryState.risk > 50 || isContactorCutoff;

  return (
    <div className="space-y-4 animate-fadeIn text-slate-900">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black text-slate-900 heading-tech uppercase flex items-center gap-1.5 truncate">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              ALERTS &amp; BATTERY ISSUES MODE
            </h2>
            <p className="text-[11px] text-slate-500 font-semibold truncate">
              Real-Time Safety Protection &amp; Minor Problem Monitoring
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border shrink-0 ${
            isEmergency ? 'bg-red-50 text-red-700 border-red-300' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
          }`}
        >
          {isEmergency ? '⚠️ EMERGENCY CUTOFF' : 'HEALTHY'}
        </span>
      </div>

      {/* High Voltage Contactor Safety Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${
          isEmergency ? 'bg-red-50 border-red-300 text-red-900' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-xl ${isEmergency ? 'bg-red-500 text-white animate-bounce' : 'bg-emerald-500 text-white'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-extrabold uppercase">
              HIGH-VOLTAGE CONTACTOR: {isContactorCutoff ? 'OPEN (ISOLATED)' : 'CLOSED (CONNECTED)'}
            </div>
            <div className="text-xs font-black mt-0.5">
              {isEmergency ? 'Emergency Isolation Override Active' : 'Normal Power Contactors Engaged'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsContactorCutoff(!isContactorCutoff)}
          className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5 uppercase tracking-wider ${
            isContactorCutoff ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isContactorCutoff ? 'RESTORE POWER' : 'TRIGGER CUTOFF'}</span>
        </button>
      </div>

      {/* MINOR BATTERY ISSUES SECTION */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            CHHOTI-MOTI BATTERY PROBLEMS &amp; WARNINGS ({minorProblems.length})
          </h3>
          <span className="text-[10px] font-mono text-slate-400">PINN Diagnostic Engine</span>
        </div>

        {minorProblems.length > 0 ? (
          <div className="space-y-2">
            {minorProblems.map((prob, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border flex items-start gap-3 ${
                  prob.severity === 'HIGH'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : prob.severity === 'MEDIUM'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-black">{prob.title}</div>
                  <div className="text-[11px] font-semibold mt-0.5 opacity-90">{prob.desc}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Koi chhoti-moti problem nahi hai. Sabhi cells aur parameters 100% optimal range mein hain.</span>
          </div>
        )}
      </div>

      {/* Live System Safety Alarms */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-red-600" />
            CRITICAL HARDWARE ALARM LOGS
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Continuous Monitor</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Thermal Runaway Limit (&gt; 55°C)</span>
            <span className={`font-mono font-bold ${maxTemp > 55 ? 'text-red-600' : 'text-emerald-600'}`}>
              {maxTemp > 55 ? 'TRIGGERED' : 'CLEAR'} ({maxTemp}°C)
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Cell Over-Voltage Cutoff (&gt; 4.2V)</span>
            <span className="font-mono font-bold text-emerald-600">CLEAR</span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="font-semibold text-slate-700">PINN Thermal Risk Score</span>
            <span className={`font-mono font-bold ${pinn.thermalRunawayRiskPct > 35 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {pinn.thermalRunawayRiskPct}% ({pinn.overallRiskLevel})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsDrawer;
