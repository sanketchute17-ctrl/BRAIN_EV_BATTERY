import React from 'react';
import type { NormalizedBatteryState } from '../../types/telemetry';
import { ArrowLeft, Stethoscope, Activity, ShieldCheck } from 'lucide-react';

interface DoctorDrawerProps {
  batteryState: NormalizedBatteryState;
  onBack: () => void;
}

export const DoctorDrawer: React.FC<DoctorDrawerProps> = ({ batteryState, onBack }) => {
  const cells = batteryState.cells;
  const maxTemp = batteryState.maxTemperature || batteryState.temperature;
  const isHighRisk = batteryState.risk > 50 || maxTemp > 45;

  const voltages = cells.map((c) => c.voltage);
  const minV = Math.min(...voltages, batteryState.voltage / 96);
  const maxV = Math.max(...voltages, batteryState.voltage / 96);
  const imbalanceV = +(maxV - minV).toFixed(3);

  const thermalRisk = Math.min(100, Math.max(5, Math.round((maxTemp / 55) * 100)));
  const imbalanceRisk = Math.min(100, Math.max(2, Math.round(imbalanceV * 500)));
  const overallRiskScore = Math.min(100, Math.max(batteryState.risk, Math.round((thermalRisk + imbalanceRisk) / 2)));
  const healthScore = Math.max(0, Math.min(100, Math.round(batteryState.soh - overallRiskScore * 0.15)));

  return (
    <div className="space-y-5 animate-fadeIn text-slate-900">
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
              <Stethoscope className="w-5 h-5 text-emerald-600" />
              AI BATTERY DOCTOR
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              Live Cell Diagnostics &amp; Future Risk Prediction
            </p>
          </div>
        </div>
        <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
          isHighRisk
            ? 'bg-red-50 text-red-700 border-red-300'
            : 'bg-emerald-50 text-emerald-700 border-emerald-300'
        }`}>
          {isHighRisk ? 'ATTENTION REQUIRED' : 'SYSTEM HEALTHY'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-center flex flex-col justify-between">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">DIAGNOSTIC HEALTH SCORE</div>
          <div className={`text-4xl font-black ${healthScore > 85 ? 'text-emerald-600' : healthScore > 70 ? 'text-amber-500' : 'text-red-500'}`}>
            {healthScore} / 100
          </div>
          <div className="text-[10px] font-mono text-slate-500">Based on SOH &amp; Live Imbalance</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>FUTURE THERMAL RISK</span>
            <span className="font-mono text-red-500 font-bold">{thermalRisk}%</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${thermalRisk}%` }} />
          </div>
          <div className="text-[10px] text-slate-500">Max Temp: {maxTemp}°C (Threshold: 55°C)</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>CELL IMBALANCE RISK</span>
            <span className="font-mono text-amber-500 font-bold">{imbalanceRisk}%</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${imbalanceRisk}%` }} />
          </div>
          <div className="text-[10px] text-slate-500">Voltage Delta: {imbalanceV}V across cells</div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-sm font-black text-slate-900 uppercase heading-tech tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            SIMULATED BATTERY CELL BREAKDOWN ({cells.length} CELLS)
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Live 1-Hz Ticker</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {cells.map((cell) => (
            <div
              key={cell.id}
              className={`p-3 rounded-xl border flex flex-col justify-between ${
                cell.status === 'CRITICAL' || cell.temperature > 44
                  ? 'bg-red-50 border-red-300 text-red-900'
                  : cell.status === 'WARNING'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-extrabold">CELL 0{cell.id}</span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  cell.status === 'HEALTHY' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {cell.status}
                </span>
              </div>
              <div className="mt-2 space-y-0.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Voltage:</span>
                  <span className="font-bold">{cell.voltage} V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Temp:</span>
                  <span className="font-bold">{cell.temperature} °C</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <h3 className="text-xs font-black text-slate-900 uppercase heading-tech tracking-wide flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          AI DOCTOR RECOMMENDATION &amp; ACTIONS
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
          {isHighRisk
            ? '⚠️ High thermal gradient or cell voltage imbalance detected on simulated battery. Active BMS cell balancing override recommended.'
            : '✅ All battery cells are operating within optimal electrochemical safety thresholds. No immediate thermal or capacity degradation risks detected.'}
        </p>
      </div>
    </div>
  );
};
