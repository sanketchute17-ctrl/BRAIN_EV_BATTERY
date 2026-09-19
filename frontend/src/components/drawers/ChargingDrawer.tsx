import React from 'react';
import type { NormalizedBatteryState } from '../../types/telemetry';
import { ArrowLeft, Zap, Clock, Activity, Thermometer, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ChargingDrawerProps {
  batteryState: NormalizedBatteryState;
  onBack: () => void;
}

export const ChargingDrawer: React.FC<ChargingDrawerProps> = ({ batteryState, onBack }) => {
  const isCharging = batteryState.charging.active || batteryState.current < 0;
  const chargingCurrent = Math.abs(batteryState.charging.current || batteryState.current);
  const chargingPowerKw = +(batteryState.charging.power || ((batteryState.voltage * chargingCurrent) / 1000)).toFixed(1);
  const cRate = +(chargingCurrent / 50.0).toFixed(2); // Based on 50Ah nominal capacity

  // Estimated Time to 100% Full Charge (Minutes)
  const remainingSocPct = 100 - batteryState.soc;
  const minutesToFull = chargingCurrent > 2 ? Math.round((remainingSocPct * 50 * 0.6) / chargingCurrent) : 0;

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
              <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
              CHARGING INTELLIGENCE &amp; ANALYTICS
            </h2>
            <p className="text-[11px] text-slate-500 font-semibold truncate">
              Real-Time C-Rate, Thermal Stress &amp; Charge Window Optimizer
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border shrink-0 ${
          isCharging ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300'
        }`}>
          {isCharging ? '⚡ CHARGING ACTIVE' : 'DISCHARGING / STANDBY'}
        </span>
      </div>

      {/* Charging Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase">CHARGING POWER</div>
          <div className="text-2xl font-black text-emerald-600">{chargingPowerKw} kW</div>
          <div className="text-[9px] font-mono text-slate-500">Live Power Delivery</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase">C-RATE FACTOR</div>
          <div className="text-2xl font-black text-purple-600">{cRate} C</div>
          <div className="text-[9px] font-mono text-slate-500">Current Load Factor</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase">TIME TO FULL (ETA)</div>
          <div className="text-2xl font-black text-cyan-600">
            {isCharging ? `${minutesToFull} min` : 'N/A'}
          </div>
          <div className="text-[9px] font-mono text-slate-500">To 100% Capacity</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase">THERMAL STRESS</div>
          <div className={`text-2xl font-black ${batteryState.temperature > 40 ? 'text-red-500' : 'text-emerald-600'}`}>
            {batteryState.temperature}°C
          </div>
          <div className="text-[9px] font-mono text-slate-500">Max Temp Limit: 55°C</div>
        </div>
      </div>

      {/* Simulated Live Charging Curve */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-sm font-black text-slate-900 uppercase heading-tech tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            LIVE CHARGING STRESS &amp; TEMPERATURE PROFILE
          </h3>
          <span className="text-[10px] font-mono text-slate-400">CC-CV Protocol</span>
        </div>

        <div className="h-36 flex items-end gap-2 pt-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
          {[20, 35, 50, 65, 80, 95, 100, 92, 80, 60, 40, 20].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t transition-all ${
                  h > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ height: `${h}%` }}
              />
              <span className="text-[8px] font-mono text-slate-400">{i * 5}m</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Smart Charge Optimizer */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <h3 className="text-xs font-black text-slate-900 uppercase heading-tech tracking-wide flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          AI CHARGE OPTIMIZER RECOMMENDATION
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
          {batteryState.temperature > 40
            ? '⚠️ High pack temperature detected. Slow DC Fast Charging rate to 0.5C to prevent lithium plating and thermal runaway.'
            : '✅ Temperature & voltage balance are optimal. Fast charging protocol (1.5C) safe for current cycle.'}
        </p>
      </div>
    </div>
  );
};
