import React, { useState, useEffect } from 'react';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { Navigation } from './components/Navigation';
import type { TabType, DrawerType } from './components/Navigation';
import { MenuDrawer } from './components/MenuDrawer';
import { Battery3DView } from './components/Battery3DView';
import { BrainLogo } from './components/BrainLogo';
import { apiService } from './services/api';
import {
  ArrowLeft,
  Zap,
  ShieldAlert,
  Cpu,
  Activity,
  Gauge,
  Thermometer,
  ZapOff,
  Sliders,
  Radio,
  RefreshCw,
  X,
  Info
} from 'lucide-react';

export function App() {
  const [authState, setAuthState] = useState<'LOGIN' | 'REGISTER' | 'AUTHENTICATED'>('LOGIN');
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeDrawerItem, setActiveDrawerItem] = useState<DrawerType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Status Switcher: HEALTHY, WATCH, WARNING, CRITICAL
  const [demoStatus, setDemoStatus] = useState<'HEALTHY' | 'WATCH' | 'WARNING' | 'CRITICAL'>('HEALTHY');

  // Selected Cell Modal State
  const [selectedCell, setSelectedCell] = useState<{
    id: number;
    voltage: number;
    temp: number;
    deviation: number;
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    riskScore: number;
  } | null>(null);

  // Digital Twin Mode
  const [twinMode, setTwinMode] = useState<'LIVE' | 'PREDICTED'>('LIVE');

  // Simulator Controls & Output State
  const [simSpeed, setSimSpeed] = useState(85);
  const [simTemp, setSimTemp] = useState(38);
  const [simAux, setSimAux] = useState(2.5);
  const [simMode, setSimMode] = useState('FAST_CHARGE');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResults, setSimResults] = useState<{
    predictedTemp: number;
    predictedSoc: number;
    thermalStress: string;
    riskScore: number;
    safeWindow: string;
  } | null>(null);

  useEffect(() => {
    const checkBackend = async () => {
      const res = await apiService.checkBackendStatus();
      setBackendOnline(res.online);
    };
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  const runWhatIfSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const calcTemp = Math.round(simTemp + (simSpeed * 0.12) + (simAux * 1.5));
      const calcSoc = Math.max(12, Math.round(84 - (simSpeed * 0.25)));
      const calcRisk = Math.min(88, Math.round(15 + (calcTemp * 0.8)));

      setSimResults({
        predictedTemp: calcTemp,
        predictedSoc: calcSoc,
        thermalStress: calcTemp > 45 ? 'HIGH THERMAL LOAD' : 'MODERATE STRESS',
        riskScore: calcRisk,
        safeWindow: calcTemp > 48 ? '8 – 14 MIN' : '18 – 25 MIN',
      });
      setIsSimulating(false);
    }, 600);
  };

  if (authState === 'LOGIN') {
    return (
      <LoginScreen
        onLoginSuccess={(demo) => {
          setIsDemoMode(!!demo);
          setAuthState('AUTHENTICATED');
        }}
        onNavigateRegister={() => setAuthState('REGISTER')}
      />
    );
  }

  if (authState === 'REGISTER') {
    return (
      <RegisterScreen
        onRegisterComplete={() => setAuthState('AUTHENTICATED')}
        onNavigateLogin={() => setAuthState('LOGIN')}
      />
    );
  }

  // Status Light Indicator Style (Electric Light Green / Electric Light Red)
  const getStatusLightClass = (st: typeof demoStatus) => {
    switch (st) {
      case 'HEALTHY':
      case 'WATCH':
        return 'bg-electric-green status-pulse-green shadow-neon-green';
      case 'WARNING':
      case 'CRITICAL':
        return 'bg-electric-red status-pulse-red shadow-neon-red';
    }
  };

  return (
    <div className="min-h-screen bg-brain-black text-slate-100 pb-24 max-w-6xl mx-auto relative overflow-x-hidden">
      {/* 1. HEADER WITH ELECTRIC LIGHT GREEN / RED BRANDING */}
      <header className="sticky top-0 z-30 bg-brain-charcoal/95 backdrop-blur-md border-b border-brain-border px-4 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          {activeDrawerItem ? (
            <button
              onClick={() => setActiveDrawerItem(null)}
              className="p-2 glass-panel-premium rounded-xl text-electric-green hover:bg-electric-green/15 border border-brain-border"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <BrainLogo size="sm" showText={true} fullTagline={false} />
          )}

          {/* Connection Status Badge */}
          <div className="hidden sm:flex items-center gap-2">
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                backendOnline
                  ? 'bg-electric-green/15 border-electric-green/40 text-electric-green'
                  : 'bg-electric-red/15 border-electric-red/40 text-electric-red'
              }`}
            >
              ● {backendOnline ? 'BACKEND ONLINE' : 'OFFLINE'}
            </span>
            {isDemoMode && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-electric-green/15 border border-electric-green/50 text-electric-green tracking-wider">
                SIMULATED DATA
              </span>
            )}
          </div>
        </div>

        {/* Status Light & Scenario Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-brain-navy/90 border border-brain-border rounded-xl px-3 py-1.5 shadow-inner">
            <span className={`w-3 h-3 rounded-full ${getStatusLightClass(demoStatus)}`} />
            <span className="text-xs font-mono font-extrabold tracking-wider text-slate-200">
              {demoStatus}
            </span>
          </div>

          <select
            value={demoStatus}
            onChange={(e) => setDemoStatus(e.target.value as any)}
            className="text-xs font-bold bg-brain-navy border border-brain-border rounded-xl px-2.5 py-1.5 text-electric-green focus:outline-none focus:border-electric-green cursor-pointer hidden md:block"
          >
            <option value="HEALTHY">🟢 HEALTHY</option>
            <option value="WATCH">🟢 WATCH</option>
            <option value="WARNING">🔴 WARNING</option>
            <option value="CRITICAL">🔴 CRITICAL</option>
          </select>
        </div>
      </header>

      {/* 2. MAIN CONTENT BODY */}
      <main className="p-4 sm:p-6 space-y-6">
        {activeDrawerItem ? (
          <div className="glass-panel-premium rounded-2xl p-6 border border-brain-border space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-brain-border pb-3">
              <h2 className="text-xl font-bold text-electric-green heading-tech uppercase tracking-wide">
                {activeDrawerItem} MODULE
              </h2>
              <button
                onClick={() => setActiveDrawerItem(null)}
                className="text-xs font-mono font-bold text-electric-red hover:underline"
              >
                Back to Dashboard
              </button>
            </div>

            {activeDrawerItem === 'twin' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-brain-navy p-3 rounded-xl border border-brain-border">
                  <span className="text-xs font-mono font-bold text-slate-300">TWIN MODEL STATE:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTwinMode('LIVE')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg ${
                        twinMode === 'LIVE'
                          ? 'bg-electric-green text-brain-black shadow-neon-green'
                          : 'bg-brain-card text-slate-400'
                      }`}
                    >
                      LIVE TELEMETRY
                    </button>
                    <button
                      onClick={() => setTwinMode('PREDICTED')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg ${
                        twinMode === 'PREDICTED'
                          ? 'bg-electric-red text-white shadow-neon-red'
                          : 'bg-brain-card text-slate-400'
                      }`}
                    >
                      PREDICTED PINN STATE
                    </button>
                  </div>
                </div>

                <div className="h-80 rounded-xl overflow-hidden border border-brain-border relative">
                  <Battery3DView status={demoStatus} expanded={true} interactive={true} />
                </div>
              </div>
            ) : (
              <div className="h-64 bg-brain-navy rounded-xl flex items-center justify-center border border-brain-border">
                <span className="text-xs font-mono font-bold text-slate-400 tracking-widest uppercase">
                  [ {activeDrawerItem.toUpperCase()} INTELLIGENCE ENGINE ONLINE ]
                </span>
              </div>
            )}
          </div>
        ) : (
          <>
            {!backendOnline && !isDemoMode && (
              <div className="p-4 rounded-2xl bg-electric-red/15 border border-electric-red/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <ZapOff className="w-6 h-6 text-electric-red" />
                  <div>
                    <div className="text-sm font-bold text-electric-red uppercase heading-tech">NO LIVE BMS CONNECTION</div>
                    <div className="text-xs text-slate-300">Connect a compatible hardware BMS or activate Demo Mode.</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsDemoMode(true)}
                    className="px-4 py-2 bg-electric-green text-brain-black text-xs font-bold rounded-xl shadow-neon-green"
                  >
                    START DEMO
                  </button>
                </div>
              </div>
            )}

            {/* TAB 1: HOME DASHBOARD */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                {/* HERO CARD */}
                <div className="glass-card-premium rounded-2xl p-4 sm:p-5 border border-electric-green/40 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3 border-b border-brain-border pb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-electric-green" />
                      <span className="text-sm font-extrabold text-white tracking-wider heading-tech uppercase">
                        3D DIGITAL TWIN PACK (96S LFP)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-electric-green/15 text-electric-green border border-electric-green/40">
                      ESTIMATED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                    <div className="lg:col-span-2 h-64 rounded-xl overflow-hidden border border-brain-border">
                      <Battery3DView status={demoStatus} interactive={true} />
                    </div>

                    <div className="space-y-3">
                      <div className="glass-panel-premium p-3.5 rounded-xl border border-brain-border">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">STATE OF CHARGE</div>
                        <div className="text-4xl font-black text-electric-green mt-1 drop-shadow-[0_0_15px_rgba(0,255,135,0.6)]">
                          84%
                        </div>
                        <div className="text-[10px] font-mono text-electric-green mt-1">350.4 V • 120.5 A</div>
                      </div>

                      <div className="glass-panel-premium p-3.5 rounded-xl border border-brain-border">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">STATE OF HEALTH</div>
                        <div className="text-4xl font-black text-electric-red mt-1 drop-shadow-[0_0_15px_rgba(255,42,85,0.6)]">
                          96.4%
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">INTERNAL RES: 1.2 mΩ</div>
                      </div>

                      <div className="glass-panel-premium p-3.5 rounded-xl border border-brain-border flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">ESTIMATED RANGE</div>
                          <div className="text-xl font-extrabold text-electric-green mt-0.5">342 KM</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">PACK TEMP</div>
                          <div className="text-xl font-extrabold text-electric-red mt-0.5">34.2 °C</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TELEMETRY WIDGETS GRID */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'PACK VOLTAGE', val: '350.4 V', icon: Zap, color: 'text-electric-green', badge: 'REAL' },
                    { label: 'PACK CURRENT', val: '120.5 A', icon: Activity, color: 'text-electric-green', badge: 'REAL' },
                    { label: 'PACK POWER', val: '42.2 kW', icon: Gauge, color: 'text-electric-green', badge: 'REAL' },
                    { label: 'PACK TEMP', val: '34.2 °C', icon: Thermometer, color: 'text-electric-red', badge: 'REAL' },
                    { label: 'CELL BALANCING', val: '12 mV', icon: Sliders, color: 'text-electric-green', badge: 'ESTIMATED' },
                    { label: 'CYCLE COUNT', val: '428', icon: RefreshCw, color: 'text-slate-300', badge: 'ESTIMATED' },
                  ].map((w, idx) => {
                    const Icon = w.icon;
                    return (
                      <div key={idx} className="glass-panel-premium p-3.5 rounded-xl border border-brain-border glass-card-hover space-y-1">
                        <div className="flex items-center justify-between">
                          <Icon className={`w-4 h-4 ${w.color}`} />
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-brain-navy border border-brain-border text-slate-400">
                            {w.badge}
                          </span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{w.label}</div>
                        <div className={`text-xl font-extrabold ${w.color} heading-tech`}>{w.val}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: BATTERY INTELLIGENCE & CELL MONITORING */}
            {activeTab === 'battery' && (
              <div className="space-y-6">
                <div className="glass-panel-premium p-5 rounded-2xl border border-brain-border space-y-4">
                  <div className="flex items-center justify-between border-b border-brain-border pb-3">
                    <div>
                      <h2 className="text-lg font-bold text-electric-green heading-tech uppercase">BATTERY PACK OVERVIEW</h2>
                      <p className="text-xs text-slate-400">96 Series High-Voltage LFP Architecture</p>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-electric-green/15 text-electric-green border border-electric-green/40">
                      OPTIMAL OPERATING MATRIX
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-brain-navy p-3 rounded-xl border border-brain-border">
                      <div className="text-[10px] font-bold text-slate-400">SOC / SOH</div>
                      <div className="text-lg font-extrabold text-electric-green mt-0.5">84% / 96.4%</div>
                    </div>
                    <div className="bg-brain-navy p-3 rounded-xl border border-brain-border">
                      <div className="text-[10px] font-bold text-slate-400">VOLTAGE / CURRENT</div>
                      <div className="text-lg font-extrabold text-electric-green mt-0.5">350.4 V / 120.5 A</div>
                    </div>
                    <div className="bg-brain-navy p-3 rounded-xl border border-brain-border">
                      <div className="text-[10px] font-bold text-slate-400">POWER / TEMP</div>
                      <div className="text-lg font-extrabold text-electric-green mt-0.5">42.2 kW / 34.2 °C</div>
                    </div>
                    <div className="bg-brain-navy p-3 rounded-xl border border-brain-border">
                      <div className="text-[10px] font-bold text-slate-400">INTERNAL RESISTANCE</div>
                      <div className="text-lg font-extrabold text-electric-red mt-0.5">1.25 mΩ / cell</div>
                    </div>
                  </div>
                </div>

                {/* 96 Cell Visual Matrix Grid */}
                <div className="glass-panel-premium p-5 rounded-2xl border border-brain-border space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-200 uppercase heading-tech tracking-wide">
                      CELL MONITORING MATRIX (TAP CELL FOR DIAGNOSTICS)
                    </h3>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-electric-green" /> Healthy</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-electric-red" /> Critical</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-2">
                    {Array.from({ length: 36 }).map((_, i) => {
                      const cellId = i + 1;
                      const isCritical = (demoStatus === 'CRITICAL' || demoStatus === 'WARNING') && (cellId === 14 || cellId === 28);

                      const statusColor = isCritical
                        ? 'bg-electric-red/20 border-electric-red text-electric-red animate-pulse shadow-neon-red'
                        : 'bg-electric-green/10 border-electric-green/50 text-electric-green hover:bg-electric-green/20';

                      return (
                        <button
                          key={cellId}
                          onClick={() =>
                            setSelectedCell({
                              id: cellId,
                              voltage: isCritical ? 2.92 : 3.65,
                              temp: isCritical ? 52.4 : 33.5,
                              deviation: isCritical ? 140 : 8,
                              status: isCritical ? 'CRITICAL' : 'HEALTHY',
                              riskScore: isCritical ? 88 : 12,
                            })
                          }
                          className={`h-10 rounded-lg border flex flex-col items-center justify-center font-mono text-xs font-bold transition-all ${statusColor}`}
                        >
                          C{cellId < 10 ? `0${cellId}` : cellId}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Cell Modal */}
                {selectedCell && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
                    <div className="bg-brain-charcoal border border-brain-border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-brain-border pb-3">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-electric-green" />
                          <h3 className="text-lg font-bold text-white heading-tech">CELL C{selectedCell.id < 10 ? `0${selectedCell.id}` : selectedCell.id} DIAGNOSTICS</h3>
                        </div>
                        <button onClick={() => setSelectedCell(null)} className="p-1 text-slate-400 hover:text-white">
                          <X className="w-5 h-5 text-electric-red" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-brain-navy p-3 rounded-xl border border-brain-border">
                          <div className="text-[10px] font-bold text-slate-400">VOLTAGE</div>
                          <div className="text-xl font-extrabold text-electric-green">{selectedCell.voltage} V</div>
                        </div>
                        <div className="bg-brain-navy p-3 rounded-xl border border-brain-border">
                          <div className="text-[10px] font-bold text-slate-400">TEMPERATURE</div>
                          <div className="text-xl font-extrabold text-electric-red">{selectedCell.temp} °C</div>
                        </div>
                        <div className="bg-brain-navy p-3 rounded-xl border border-brain-border">
                          <div className="text-[10px] font-bold text-slate-400">DEVIATION</div>
                          <div className="text-xl font-extrabold text-electric-green">{selectedCell.deviation} mV</div>
                        </div>
                        <div className="bg-brain-navy p-3 rounded-xl border border-brain-border">
                          <div className="text-[10px] font-bold text-slate-400">RISK SCORE</div>
                          <div className="text-xl font-extrabold text-electric-red">{selectedCell.riskScore}%</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-brain-navy border border-brain-border">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">AI CELL DIAGNOSIS</div>
                        <div className="text-xs font-semibold text-slate-200 mt-1">
                          {selectedCell.status === 'CRITICAL'
                            ? 'Severe voltage drop and elevated thermal gradient detected. Cell balancing override active.'
                            : 'Normal impedance and healthy electrochemical activity.'}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedCell(null)}
                        className="w-full py-2.5 bg-electric-green text-brain-black font-bold text-xs rounded-xl shadow-neon-green uppercase"
                      >
                        CLOSE DIAGNOSTICS
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: AI GUARDIAN & EXPLAINABLE AI */}
            {activeTab === 'guardian' && (
              <div className="space-y-6">
                <div className="glass-card-premium p-6 rounded-2xl border border-electric-green/40 space-y-5 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-brain-border pb-3">
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert className="w-6 h-6 text-electric-green" />
                      <div>
                        <h2 className="text-xl font-extrabold text-electric-green heading-tech tracking-wider uppercase">
                          AI GUARDIAN SAFETY CENTER
                        </h2>
                        <p className="text-xs text-slate-400">Physics-Informed Neural Network (PINN) Safety Engine</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-electric-green/15 text-electric-green border border-electric-green/40">
                      STATUS: NORMAL
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-brain-navy p-4 rounded-xl border border-brain-border text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase">OVERALL RISK SCORE</div>
                      <div className="text-5xl font-black text-electric-green mt-1 drop-shadow-[0_0_15px_rgba(0,255,135,0.6)]">
                        23%
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">LOW RISK OPERATING REGIME</div>
                    </div>

                    <div className="bg-brain-navy p-4 rounded-xl border border-brain-border text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase">PREDICTION CONFIDENCE</div>
                      <div className="text-5xl font-black text-electric-green mt-1 drop-shadow-[0_0_15px_rgba(0,255,135,0.6)]">
                        91%
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">VALIDATED BY PINN MODEL</div>
                    </div>

                    <div className="bg-brain-navy p-4 rounded-xl border border-brain-border flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase">ESTIMATED SAFE OPERATING WINDOW</div>
                        <div className="text-2xl font-extrabold text-electric-red mt-1">18 – 25 MIN</div>
                      </div>
                      <p className="text-[11px] font-serif italic text-slate-400 mt-2">
                        * Model-based estimate, not a guaranteed countdown.
                      </p>
                    </div>
                  </div>
                </div>

                {/* EXPLAINABLE AI CONTRIBUTION BARS */}
                <div className="glass-panel-premium p-6 rounded-2xl border border-brain-border space-y-4">
                  <div className="flex items-center justify-between border-b border-brain-border pb-3">
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-electric-green" />
                      <h3 className="text-lg font-bold text-white heading-tech tracking-wide uppercase">
                        WHY DID RISK CHANGE? (EXPLAINABLE AI)
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">PINN FEATURE ATTRIBUTION</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {[
                      { factor: 'Temperature Rise', pct: 35, color: 'bg-electric-red', val: '+35%' },
                      { factor: 'Cell Imbalance', pct: 25, color: 'bg-electric-green', val: '+25%' },
                      { factor: 'High Current Discharge', pct: 20, color: 'bg-electric-green', val: '+20%' },
                      { factor: 'SOH Degradation', pct: 12, color: 'bg-electric-red', val: '+12%' },
                      { factor: 'Other Factors', pct: 8, color: 'bg-slate-500', val: '+8%' },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-200">
                          <span>{item.factor}</span>
                          <span className="font-mono text-electric-green">{item.val}</span>
                        </div>
                        <div className="h-3 w-full bg-brain-navy rounded-full overflow-hidden border border-brain-border">
                          <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: WHAT-IF SIMULATOR */}
            {activeTab === 'simulator' && (
              <div className="space-y-6">
                <div className="glass-card-premium p-6 rounded-2xl border border-electric-green/40 space-y-5 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-brain-border pb-3">
                    <div className="flex items-center gap-2.5">
                      <Cpu className="w-6 h-6 text-electric-green" />
                      <div>
                        <h2 className="text-xl font-extrabold text-electric-green heading-tech uppercase">WHAT-IF BATTERY SIMULATOR</h2>
                        <p className="text-xs text-slate-400">Simulate Driving Loads, Thermal Stress & Fast Charging</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-electric-green/15 text-electric-green border border-electric-green/40">
                      SIMULATED DATA
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase">VEHICLE SPEED: {simSpeed} KM/H</label>
                      <input
                        type="range"
                        min="0"
                        max="160"
                        value={simSpeed}
                        onChange={(e) => setSimSpeed(Number(e.target.value))}
                        className="w-full accent-electric-green cursor-pointer mt-2"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase">AMBIENT TEMP: {simTemp} °C</label>
                      <input
                        type="range"
                        min="-10"
                        max="55"
                        value={simTemp}
                        onChange={(e) => setSimTemp(Number(e.target.value))}
                        className="w-full accent-electric-red cursor-pointer mt-2"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase">AUXILIARY LOAD: {simAux} KW</label>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        step="0.5"
                        value={simAux}
                        onChange={(e) => setSimAux(Number(e.target.value))}
                        className="w-full accent-electric-green cursor-pointer mt-2"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase">CHARGING MODE</label>
                      <select
                        value={simMode}
                        onChange={(e) => setSimMode(e.target.value)}
                        className="input-high-contrast mt-1 text-white bg-brain-navy"
                      >
                        <option value="FAST_CHARGE">DC Fast Charge (150 kW)</option>
                        <option value="NORMAL">AC Level 2 (11 kW)</option>
                        <option value="ECO_DRIVE">Regen Driving Mode</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={runWhatIfSimulation}
                    disabled={isSimulating}
                    className="w-full py-3.5 bg-electric-green text-brain-black font-extrabold text-sm rounded-xl hover:bg-emerald-300 transition uppercase tracking-wider shadow-neon-green heading-tech"
                  >
                    {isSimulating ? 'RUNNING PHYSICAL SIMULATION...' : 'RUN SIMULATION'}
                  </button>
                </div>

                {simResults && (
                  <div className="glass-panel-premium p-6 rounded-2xl border border-brain-border space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-brain-border pb-3">
                      <h3 className="text-lg font-bold text-white heading-tech uppercase">CURRENT VS SIMULATED COMPARISON</h3>
                      <span className="text-xs font-mono font-bold text-electric-green">SIMULATED DATA</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-brain-navy p-3.5 rounded-xl border border-brain-border">
                        <div className="text-[10px] font-bold text-slate-400">PREDICTED TEMP</div>
                        <div className="text-2xl font-extrabold text-electric-red mt-1">{simResults.predictedTemp} °C</div>
                        <div className="text-[10px] text-slate-400">Current: 34.2 °C</div>
                      </div>

                      <div className="bg-brain-navy p-3.5 rounded-xl border border-brain-border">
                        <div className="text-[10px] font-bold text-slate-400">PREDICTED SOC</div>
                        <div className="text-2xl font-extrabold text-electric-green mt-1">{simResults.predictedSoc}%</div>
                        <div className="text-[10px] text-slate-400">Current: 84%</div>
                      </div>

                      <div className="bg-brain-navy p-3.5 rounded-xl border border-brain-border">
                        <div className="text-[10px] font-bold text-slate-400">RISK SCORE</div>
                        <div className="text-2xl font-extrabold text-electric-red mt-1">{simResults.riskScore}%</div>
                        <div className="text-[10px] text-slate-400">Current: 23%</div>
                      </div>

                      <div className="bg-brain-navy p-3.5 rounded-xl border border-brain-border">
                        <div className="text-[10px] font-bold text-slate-400">SAFE WINDOW</div>
                        <div className="text-lg font-extrabold text-electric-green mt-1">{simResults.safeWindow}</div>
                        <div className="text-[10px] text-slate-400">Model-based estimate</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="glass-panel-premium p-6 rounded-2xl border border-brain-border space-y-4">
                  <div className="flex items-center justify-between border-b border-brain-border pb-3">
                    <div>
                      <h2 className="text-lg font-bold text-electric-green heading-tech uppercase">BATTERY TELEMETRY & RIDE ANALYTICS</h2>
                      <p className="text-xs text-slate-400">Historical Temperature, SOC, SOH & Imbalance Metrics</p>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-electric-green/15 text-electric-green border border-electric-green/40">
                      RESEARCH DATA
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-brain-navy p-4 rounded-xl border border-brain-border space-y-2">
                      <div className="text-xs font-bold text-slate-300 uppercase">TEMPERATURE VS TIME (°C)</div>
                      <div className="h-40 flex items-end gap-1.5 pt-4">
                        {[28, 30, 31, 33, 34, 34.2, 35, 36, 38, 40, 39, 37].map((v, idx) => (
                          <div key={idx} className="flex-1 bg-electric-red/80 hover:bg-electric-red rounded-t transition-all" style={{ height: `${(v / 50) * 100}%` }} />
                        ))}
                      </div>
                    </div>

                    <div className="bg-brain-navy p-4 rounded-xl border border-brain-border space-y-2">
                      <div className="text-xs font-bold text-slate-300 uppercase">SOC VS TIME (%)</div>
                      <div className="h-40 flex items-end gap-1.5 pt-4">
                        {[100, 98, 94, 91, 88, 85, 84, 82, 79, 75, 72, 68].map((v, idx) => (
                          <div key={idx} className="flex-1 bg-electric-green/80 hover:bg-electric-green rounded-t transition-all" style={{ height: `${v}%` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 3. BOTTOM NAVIGATION */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveDrawerItem(null);
          setActiveTab(tab);
        }}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* 4. DRAWER OVERLAY */}
      <MenuDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectDrawerItem={(item) => {
          setActiveDrawerItem(item);
        }}
        onLogout={() => setAuthState('LOGIN')}
      />
    </div>
  );
}

export default App;
