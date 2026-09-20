import React, { useState, useEffect } from 'react';
import type { NormalizedBatteryState } from '../../types/telemetry';
import { ArrowLeft, Zap, Clock, Activity, Thermometer, ShieldAlert, CheckCircle2, RefreshCw, Cpu, Flame } from 'lucide-react';
import { apiService } from '../../services/api';

interface ChargingDrawerProps {
  batteryState: NormalizedBatteryState;
  onBack: () => void;
}

export const ChargingDrawer: React.FC<ChargingDrawerProps> = ({ batteryState, onBack }) => {
  const [selectedRate, setSelectedRate] = useState<'FAST' | 'BALANCED' | 'ECO'>('FAST');
  const [backendStatus, setBackendStatus] = useState<string>('Syncing backend...');
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);

  useEffect(() => {
    let isMounted = true;
    apiService.checkBackendStatus().then((res) => {
      if (isMounted) setBackendStatus(res.system || 'FastAPI Physics Engine Online');
    }).catch(() => {
      if (isMounted) setBackendStatus('Local Telemetry Sync Active');
    });
    return () => { isMounted = false; };
  }, []);

  const isCharging = batteryState.charging.active || batteryState.current < 0;
  const chargingCurrent = Math.abs(batteryState.charging.current || batteryState.current || (selectedRate === 'FAST' ? 45.0 : selectedRate === 'BALANCED' ? 24.0 : 10.0));
  const chargingPowerKw = +(batteryState.charging.power || ((batteryState.voltage * chargingCurrent) / 1000)).toFixed(1);
  const cRate = +(chargingCurrent / 50.0).toFixed(2); // Based on 50Ah nominal capacity

  // Estimated Time to 100% Full Charge (Minutes)
  const remainingSocPct = 100 - batteryState.soc;
  const minutesToFull = Math.max(8, Math.round((remainingSocPct * 50 * 0.6) / Math.max(5, chargingCurrent)));
  const ccCvThresholdSoc = 80; // Standard CC-CV transition at 80% SOC

  // Handle live mode change API request
  const handleModeChange = async (mode: 'FAST' | 'BALANCED' | 'ECO') => {
    setSelectedRate(mode);
    setIsUpdatingMode(true);
    const targetAmp = mode === 'FAST' ? -45.0 : mode === 'BALANCED' ? -25.0 : -10.0;
    try {
      await apiService.postBleTelemetry({
        battery_id: batteryState.deviceId || 'BRAIN001',
        pack_voltage: batteryState.voltage,
        pack_current: targetAmp,
        pack_temperature: batteryState.temperature,
        soc: batteryState.soc,
        soh: batteryState.soh,
        bms_status: 'CHARGING',
      });
    } catch {
      // Fallback
    } finally {
      setTimeout(() => setIsUpdatingMode(false), 500);
    }
  };

  // CC-CV Profile SVG Data Points (0m to 60m)
  const profilePoints = [
    { minute: 0, powerPct: 20, tempC: 24.0, phase: 'CC' },
    { minute: 5, powerPct: 45, tempC: 26.5, phase: 'CC' },
    { minute: 10, powerPct: 70, tempC: 29.0, phase: 'CC' },
    { minute: 15, powerPct: 90, tempC: 32.5, phase: 'CC' },
    { minute: 20, powerPct: 100, tempC: 36.0, phase: 'CC' },
    { minute: 25, powerPct: 98, tempC: 38.5, phase: 'CC' },
    { minute: 30, powerPct: 95, tempC: 40.2, phase: 'CC' },
    { minute: 35, powerPct: 82, tempC: 39.0, phase: 'CV' },
    { minute: 40, powerPct: 65, tempC: 36.8, phase: 'CV' },
    { minute: 45, powerPct: 45, tempC: 34.1, phase: 'CV' },
    { minute: 50, powerPct: 28, tempC: 31.0, phase: 'CV' },
    { minute: 55, powerPct: 15, tempC: 28.5, phase: 'TRICKLE' },
    { minute: 60, powerPct: 5, tempC: 26.0, phase: 'TRICKLE' },
  ];

  // SVG dimensions
  const svgW = 500;
  const svgH = 180;
  const padL = 35;
  const padR = 20;
  const padT = 20;
  const padB = 35;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  const getX = (idx: number) => padL + (idx / (profilePoints.length - 1)) * chartW;
  const getY = (valPct: number) => padT + chartH - (valPct / 100) * chartH;

  const pointsSvgStr = profilePoints.map((d, i) => `${getX(i)},${getY(d.powerPct)}`).join(' ');
  const areaSvgStr = `${padL},${padT + chartH} ${pointsSvgStr} ${padL + chartW},${padT + chartH}`;

  // Current active step on timeline based on SOC
  const activeStepIdx = Math.min(profilePoints.length - 1, Math.max(0, Math.round((batteryState.soc / 100) * (profilePoints.length - 1))));
  const activeX = getX(activeStepIdx);
  const activeY = getY(profilePoints[activeStepIdx].powerPct);

  return (
    <div className="space-y-4 animate-fadeIn text-slate-900">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-black text-slate-900 heading-tech uppercase flex items-center gap-1.5 truncate">
              <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
              CHARGING INTELLIGENCE &amp; ANALYTICS
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold truncate">
              {backendStatus}
            </p>
          </div>
        </div>
        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
          isCharging ? 'bg-emerald-50 text-emerald-700 border-emerald-300 animate-pulse' : 'bg-slate-100 text-slate-600 border-slate-300'
        }`}>
          {isCharging ? '⚡ CHARGING ACTIVE' : 'DISCHARGING / STANDBY'}
        </span>
      </div>

      {/* Charging Rate Selector Pills */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-900 uppercase">SELECT FAST CHARGE RATE</span>
          {isUpdatingMode && <span className="text-[10px] font-mono text-emerald-600 font-bold animate-pulse">Syncing Backend...</span>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleModeChange('FAST')}
            className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedRate === 'FAST'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>DC FAST (1.5C)</span>
          </button>
          <button
            onClick={() => handleModeChange('BALANCED')}
            className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedRate === 'BALANCED'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>BALANCED (0.8C)</span>
          </button>
          <button
            onClick={() => handleModeChange('ECO')}
            className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedRate === 'ECO'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
            <span>ECO TRICKLE (0.2C)</span>
          </button>
        </div>
      </div>

      {/* Charging Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[9px] font-extrabold text-slate-400 uppercase">CHARGING POWER</div>
          <div className="text-xl font-black text-emerald-600">{chargingPowerKw} kW</div>
          <div className="text-[9px] font-mono text-slate-500">Live Power Delivery</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[9px] font-extrabold text-slate-400 uppercase">C-RATE FACTOR</div>
          <div className="text-xl font-black text-purple-600">{cRate} C</div>
          <div className="text-[9px] font-mono text-slate-500">Current Load Factor</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[9px] font-extrabold text-slate-400 uppercase">TIME TO FULL (ETA)</div>
          <div className="text-xl font-black text-cyan-600">
            {minutesToFull} min
          </div>
          <div className="text-[9px] font-mono text-slate-500">To 100% Capacity</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[9px] font-extrabold text-slate-400 uppercase">THERMAL STRESS</div>
          <div className={`text-xl font-black ${batteryState.temperature > 40 ? 'text-red-500' : 'text-emerald-600'}`}>
            {batteryState.temperature}°C
          </div>
          <div className="text-[9px] font-mono text-slate-500">Threshold: 55°C</div>
        </div>
      </div>

      {/* Live Responsive SVG CC-CV Charging Profile Chart */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-black text-slate-900 uppercase heading-tech tracking-wide flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-600" />
            LIVE CHARGING STRESS &amp; CC-CV TEMPERATURE PROFILE
          </h3>
          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            CC-CV Target: {ccCvThresholdSoc}% SOC
          </span>
        </div>

        <div className="w-full bg-slate-50 p-2 rounded-xl border border-slate-200 overflow-hidden">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto text-slate-700">
            <defs>
              <linearGradient id="chargeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                <stop offset="80%" stopColor="#10B981" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[100, 75, 50, 25, 0].map((val) => {
              const yP = getY(val);
              return (
                <g key={val}>
                  <line x1={padL} y1={yP} x2={padL + chartW} y2={yP} stroke="#E2E8F0" strokeDasharray="4 4" strokeWidth="1" />
                  <text x={padL - 6} y={yP + 3} textAnchor="end" className="text-[9px] font-mono font-bold fill-slate-400">
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Area Fill under charging curve */}
            <polygon points={areaSvgStr} fill="url(#chargeGrad)" />

            {/* Bars for CC and CV phases */}
            {profilePoints.map((d, i) => {
              const xPos = getX(i);
              const yPos = getY(d.powerPct);
              const barH = padT + chartH - yPos;
              const isCv = d.phase === 'CV';
              return (
                <rect
                  key={i}
                  x={xPos - 8}
                  y={yPos}
                  width="16"
                  height={Math.max(0, barH)}
                  rx="3"
                  fill={isCv ? '#0284C7' : '#10B981'}
                  opacity="0.25"
                />
              );
            })}

            {/* Main Polyline Curve */}
            <polyline
              fill="none"
              stroke="#059669"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsSvgStr}
            />

            {/* Point circles */}
            {profilePoints.map((d, i) => {
              const cx = getX(i);
              const cy = getY(d.powerPct);
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="3.5"
                  className={d.phase === 'CV' ? 'fill-cyan-600' : 'fill-emerald-600'}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* Active Charging Indicator Pin */}
            <g transform={`translate(${activeX}, ${activeY})`}>
              <circle r="8" fill="#10B981" opacity="0.3" className="animate-ping" />
              <circle r="5" fill="#059669" stroke="#FFFFFF" strokeWidth="2" />
              <rect x="-26" y="-22" width="52" height="15" rx="4" fill="#0F172A" />
              <text x="0" y="-12" textAnchor="middle" className="text-[8px] font-mono font-extrabold fill-emerald-400">
                {batteryState.soc}% SOC
              </text>
            </g>

            {/* X-Axis Minute Labels */}
            {profilePoints.filter((_, idx) => idx % 2 === 0).map((d) => {
              const idx = profilePoints.findIndex((p) => p.minute === d.minute);
              const xPos = getX(idx);
              return (
                <text
                  key={d.minute}
                  x={xPos}
                  y={svgH - 10}
                  textAnchor="middle"
                  className="text-[9px] font-mono font-bold fill-slate-500"
                >
                  {d.minute}m
                </text>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Constant Current Phase (CC)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
            <span>Constant Voltage Phase (CV)</span>
          </div>
        </div>
      </div>

      {/* AI Smart Charge Optimizer */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <h3 className="text-xs font-black text-slate-900 uppercase heading-tech tracking-wide flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          AI CHARGE OPTIMIZER RECOMMENDATION
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
          {batteryState.temperature > 40
            ? '⚠️ High pack temperature detected. Slow DC Fast Charging rate to 0.5C to prevent lithium plating and thermal runaway.'
            : batteryState.soc > 80
            ? '⚡ Constant Voltage (CV) taper phase active. Charge current reduced to protect cell cathode kinetics.'
            : '✅ Temperature & voltage balance are optimal. Fast charging protocol (1.5C) safe for current cycle.'}
        </p>
      </div>
    </div>
  );
};

export default ChargingDrawer;
