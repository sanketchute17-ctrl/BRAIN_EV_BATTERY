import React, { useState, useEffect } from 'react';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { Navigation } from './components/Navigation';
import type { TabType, DrawerType } from './components/Navigation';
import { MenuDrawer } from './components/MenuDrawer';
import { Battery3DView } from './components/Battery3DView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BrainLogo } from './components/BrainLogo';
import { apiService } from './services/api';
import { bluetoothService } from './services/bluetoothService';
import type { BLEDeviceState } from './services/bluetoothService';
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
  Info,
  Bluetooth,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Heart,
  Navigation as NavigationIcon,
  BarChart2,
  ShieldCheck,
  Clock,
  BatteryCharging
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

  // Bluetooth BLE BMS State
  const [bleState, setBleState] = useState<BLEDeviceState>(bluetoothService.getState());
  const [bleConnecting, setBleConnecting] = useState(false);
  const [bleError, setBleError] = useState('');

  useEffect(() => {
    const checkBackend = async () => {
      const res = await apiService.checkBackendStatus();
      setBackendOnline(res.online);
    };
    checkBackend();
    const interval = setInterval(checkBackend, 15000);

    // Subscribe to live BLE telemetry updates
    const unsubscribeBle = bluetoothService.subscribe(() => {
      setBleState(bluetoothService.getState());
    });

    return () => {
      clearInterval(interval);
      unsubscribeBle();
    };
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

  // Status Light Indicator Style (Emerald Green / Electric Red)
  const getStatusLightClass = (st: typeof demoStatus) => {
    switch (st) {
      case 'HEALTHY':
      case 'WATCH':
        return 'bg-emerald-500 status-pulse-green shadow-emerald';
      case 'WARNING':
      case 'CRITICAL':
        return 'bg-red-500 status-pulse-red shadow-red';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 selection:bg-emerald-500/20">
      {/* MOBILE APP CONTAINER FRAME (Full Viewport on Mobile, Phone Shell on Desktop) */}
      <div className="w-full sm:max-w-md min-h-screen sm:min-h-[840px] sm:max-h-[920px] sm:rounded-[40px] relative overflow-hidden shadow-2xl border-0 sm:border-[8px] sm:border-slate-800 bg-slate-50 text-slate-900 flex flex-col justify-between">
        {/* 1. HEADER WITH OLA/ATHER BRANDING */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 py-2.5 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            {activeDrawerItem ? (
              <button
                onClick={() => setActiveDrawerItem(null)}
                className="p-1.5 bg-white rounded-xl text-emerald-600 hover:bg-emerald-50 border border-slate-200 shadow-sm cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <BrainLogo size="sm" showText={true} fullTagline={false} />
            )}

            {/* Connection Status Badge */}
            <span
              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                backendOnline
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-red-50 border-red-300 text-red-700'
              }`}
            >
              ● {backendOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          {/* Status Light & Scenario Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1 shadow-sm">
              <span className={`w-2.5 h-2.5 rounded-full ${getStatusLightClass(demoStatus)}`} />
              <span className="text-[10px] sm:text-xs font-mono font-extrabold tracking-wider text-slate-800">
                {demoStatus}
              </span>
            </div>

            <select
              value={demoStatus}
              onChange={(e) => setDemoStatus(e.target.value as any)}
              className="text-[10px] font-bold bg-white border border-slate-300 rounded-xl px-2 py-1 text-emerald-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
            >
              <option value="HEALTHY">🟢 HEALTHY</option>
              <option value="WATCH">🟢 WATCH</option>
              <option value="WARNING">🔴 WARNING</option>
              <option value="CRITICAL">🔴 CRITICAL</option>
            </select>
          </div>
        </header>

        {/* 2. MAIN CONTENT BODY */}
        <main className="p-3 sm:p-4 space-y-4 flex-1 overflow-y-auto">
          <ErrorBoundary>
        {activeDrawerItem ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black text-slate-900 heading-tech uppercase tracking-wide">
                {activeDrawerItem} MODULE
              </h2>
              <button
                onClick={() => setActiveDrawerItem(null)}
                className="text-xs font-bold text-red-500 hover:underline"
              >
                Back to Dashboard
              </button>
            </div>

            {activeDrawerItem === 'twin' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs font-mono font-bold text-slate-700">TWIN MODEL STATE:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTwinMode('LIVE')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg ${
                        twinMode === 'LIVE'
                          ? 'bg-emerald-500 text-white shadow-emerald'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      LIVE TELEMETRY
                    </button>
                    <button
                      onClick={() => setTwinMode('PREDICTED')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg ${
                        twinMode === 'PREDICTED'
                          ? 'bg-red-500 text-white shadow-red'
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      PREDICTED PINN STATE
                    </button>
                  </div>
                </div>

                <div className="h-80 rounded-xl overflow-hidden border border-slate-200 relative">
                  <ErrorBoundary>
                    <Battery3DView status={demoStatus} expanded={true} interactive={true} />
                  </ErrorBoundary>
                </div>
              </div>
            ) : activeDrawerItem === 'bms' ? (
              <div className="space-y-5 animate-fadeIn">
                {/* BLE BMS STATUS CARD */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-emerald-600 shadow-sm">
                        <Bluetooth className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 heading-tech">BLUETOOTH LOW ENERGY (BLE) BMS</h3>
                        <p className="text-xs font-semibold text-slate-500">Physical Hardware & Cloud Database Sync</p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-mono font-extrabold px-3 py-1 rounded-full border ${
                        bleState.connected
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                          : 'bg-slate-100 border-slate-300 text-slate-500'
                      }`}
                    >
                      ● {bleState.connected ? bleState.mode : 'DISCONNECTED'}
                    </span>
                  </div>

                  {bleError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{bleError}</span>
                    </div>
                  )}

                  {/* Device Info & RSSI */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">DEVICE NAME</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {bleState.deviceName || 'No BLE Device Paired'}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">DEVICE MAC / ID</div>
                      <div className="text-sm font-mono font-bold text-emerald-600 mt-0.5">
                        {bleState.deviceId || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">SIGNAL STRENGTH (RSSI)</div>
                      <div className="text-sm font-mono font-bold text-slate-700 mt-0.5">
                        {bleState.rssi ? `${bleState.rssi} dBm (Strong)` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Realtime BLE Telemetry Frame */}
                  {bleState.lastTelemetry && (
                    <div className="bg-white p-4 rounded-xl border border-emerald-300 shadow-sm space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold border-b border-slate-100 pb-2">
                        <span className="flex items-center gap-1.5 text-emerald-600 font-extrabold">
                          <CheckCircle2 className="w-4 h-4" /> LIVE BLE TELEMETRY STREAMING
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {bleState.lastTelemetry.timestamp.split('T')[1]?.slice(0, 8)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">VOLTAGE</span>
                          <span className="text-lg font-black text-emerald-600">{bleState.lastTelemetry.voltage} V</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">CURRENT</span>
                          <span className="text-lg font-black text-emerald-600">{bleState.lastTelemetry.current} A</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">TEMPERATURE</span>
                          <span className="text-lg font-black text-red-500">{bleState.lastTelemetry.temp} °C</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">SOC / SOH</span>
                          <span className="text-lg font-black text-slate-900">{bleState.lastTelemetry.soc}% / {bleState.lastTelemetry.soh}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bluetooth Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <button
                      onClick={async () => {
                        setBleConnecting(true);
                        setBleError('');
                        try {
                          await bluetoothService.requestAndConnectDevice();
                          setBleState(bluetoothService.getState());
                        } catch (err: any) {
                          setBleError(err.message || 'BLE scan failed');
                        } finally {
                          setBleConnecting(false);
                        }
                      }}
                      disabled={bleConnecting}
                      className="py-3 px-4 bg-emerald-500 text-white font-extrabold text-xs rounded-xl hover:bg-emerald-600 transition flex items-center justify-center gap-2 shadow-emerald uppercase"
                    >
                      <Bluetooth className="w-4 h-4" />
                      <span>{bleConnecting ? 'SCANNING...' : 'SCAN & PAIR BLE BMS'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setBleError('');
                        bluetoothService.startSimulatedBleConnection();
                        setBleState(bluetoothService.getState());
                      }}
                      className="py-3 px-4 bg-emerald-50 text-emerald-700 border-2 border-emerald-500 font-extrabold text-xs rounded-xl hover:bg-emerald-100 transition flex items-center justify-center gap-2 shadow-sm uppercase"
                    >
                      <Wifi className="w-4 h-4 text-emerald-600" />
                      <span>CONNECT SIMULATED BLE</span>
                    </button>

                    <button
                      onClick={() => {
                        bluetoothService.disconnect();
                        setBleState(bluetoothService.getState());
                      }}
                      disabled={!bleState.connected}
                      className="py-3 px-4 bg-slate-100 text-slate-700 border border-slate-300 font-extrabold text-xs rounded-xl hover:bg-slate-200 disabled:opacity-50 transition flex items-center justify-center gap-2 uppercase"
                    >
                      <span>DISCONNECT BLE</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
                <span className="text-xs font-mono font-bold text-slate-500 tracking-widest uppercase">
                  [ {activeDrawerItem.toUpperCase()} ENGINE ONLINE ]
                </span>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* TAB 1: HOME DASHBOARD */}
            {activeTab === 'home' && (
              <div className="space-y-3.5">
                
                {/* 3D DIGITAL TWIN HERO CARD */}
                <div className="bg-white rounded-3xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-full text-[9px] font-extrabold text-[#047857]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" /> Live
                      </span>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 tracking-tight">3D Digital Twin</h3>
                        <p className="text-[9px] font-semibold text-slate-400">Real-time battery visualization</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveDrawerItem('twin')}
                      className="inline-flex items-center gap-1 bg-white border border-[#059669] px-2.5 py-1 rounded-full text-[10px] font-extrabold text-[#059669] hover:bg-emerald-50 transition cursor-pointer"
                    >
                      <span>View 3D</span>
                      <Maximize2 className="w-3 h-3 text-[#059669]" />
                    </button>
                  </div>

                  {/* Interactive 3D WebGL Battery View Canvas with Left/Right Arrows */}
                  <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-100 bg-[#F8FAFC]">
                    <ErrorBoundary>
                      <Battery3DView status={demoStatus} interactive={true} hideControls={true} />
                    </ErrorBoundary>

                    <button className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white transition cursor-pointer z-10">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white transition cursor-pointer z-10">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 4 KEY METRICS HORIZONTAL ROW */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <div className="bg-[#F8FAFC] p-2 rounded-2xl border border-slate-200/60 text-center">
                      <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold text-slate-400 uppercase">
                        <BatteryCharging className="w-3 h-3 text-[#059669]" /> SOC
                      </div>
                      <div className="text-sm font-black text-[#059669] mt-0.5">84%</div>
                    </div>

                    <div className="bg-[#F8FAFC] p-2 rounded-2xl border border-slate-200/60 text-center">
                      <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold text-slate-400 uppercase">
                        <Heart className="w-3 h-3 text-[#2563EB]" /> SOH
                      </div>
                      <div className="text-sm font-black text-[#2563EB] mt-0.5">96.4%</div>
                    </div>

                    <div className="bg-[#F8FAFC] p-2 rounded-2xl border border-slate-200/60 text-center">
                      <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold text-slate-400 uppercase">
                        <Thermometer className="w-3 h-3 text-[#EA580C]" /> Temp
                      </div>
                      <div className="text-sm font-black text-[#EA580C] mt-0.5">34.2°C</div>
                    </div>

                    <div className="bg-[#F8FAFC] p-2 rounded-2xl border border-slate-200/60 text-center">
                      <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold text-slate-400 uppercase">
                        <NavigationIcon className="w-3 h-3 text-[#059669]" /> Range
                      </div>
                      <div className="text-sm font-black text-[#059669] mt-0.5">342 km</div>
                    </div>
                  </div>
                </div>

                {/* BATTERY HEALTH PROGRESS BAR CARD */}
                <div className="bg-white rounded-3xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-[#ECFDF5] text-[#059669]">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Battery Health</h4>
                        <p className="text-[9px] font-semibold text-slate-400">Overall battery condition is healthy</p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full text-[9px] font-extrabold text-[#047857]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> Healthy ▾
                    </span>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div className="h-full bg-[#059669] rounded-full transition-all duration-500" style={{ width: '96.4%' }} />
                    </div>
                    <div className="text-right text-xs font-black text-slate-900">96.4%</div>
                  </div>
                </div>

                {/* LIVE PARAMETERS 4 GRID */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-[#059669]" />
                      <h4 className="text-xs font-black text-slate-900">Live Parameters</h4>
                    </div>
                    <button className="text-[10px] font-extrabold text-[#059669] hover:underline cursor-pointer">View All</button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                      <Zap className="w-4 h-4 text-[#059669]" />
                      <div className="text-[8px] font-extrabold text-slate-400 uppercase">Voltage</div>
                      <div className="text-xs font-black text-[#059669]">350.4 V</div>
                    </div>

                    <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                      <Activity className="w-4 h-4 text-[#2563EB]" />
                      <div className="text-[8px] font-extrabold text-slate-400 uppercase">Current</div>
                      <div className="text-xs font-black text-[#2563EB]">120.5 A</div>
                    </div>

                    <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                      <Cpu className="w-4 h-4 text-[#9333EA]" />
                      <div className="text-[8px] font-extrabold text-slate-400 uppercase">Power</div>
                      <div className="text-xs font-black text-[#9333EA]">42.2 kW</div>
                    </div>

                    <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                      <Thermometer className="w-4 h-4 text-[#EA580C]" />
                      <div className="text-[8px] font-extrabold text-slate-400 uppercase">Temperature</div>
                      <div className="text-xs font-black text-[#EA580C]">34.2 °C</div>
                    </div>
                  </div>
                </div>

                {/* AI GUARDIAN & RISK STATUS 2 CARDS */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div 
                    onClick={() => setActiveTab('guardian')}
                    className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between cursor-pointer hover:border-emerald-300 transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-[#ECFDF5] text-[#059669]">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">AI Guardian</div>
                        <div className="text-[8px] font-semibold text-slate-400 leading-tight">No critical issues detected</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>

                  <div 
                    onClick={() => setActiveTab('guardian')}
                    className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between cursor-pointer hover:border-emerald-300 transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-[#ECFDF5] text-[#059669]">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">Risk Status</div>
                        <div className="text-[9px] font-extrabold text-[#059669]">Low Risk</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                </div>

                {/* RECENT ALERTS CARD */}
                <div className="bg-white rounded-3xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-red-50 text-red-500">
                        <Bell className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-black text-slate-900">Recent Alerts</h4>
                    </div>
                    <button className="text-[10px] font-extrabold text-[#059669] hover:underline cursor-pointer">View All</button>
                  </div>

                  <div className="flex items-center gap-2.5 p-2 bg-[#F8FAFC] rounded-2xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">No active alerts</div>
                      <div className="text-[9px] font-semibold text-slate-400">Your battery is operating normally.</div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: BATTERY INTELLIGENCE & CELL MONITORING */}
            {activeTab === 'battery' && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 heading-tech uppercase">BATTERY PACK OVERVIEW</h2>
                      <p className="text-xs text-slate-500">96 Series High-Voltage LFP Architecture</p>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                      OPTIMAL OPERATING MATRIX
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-500">SOC / SOH</div>
                      <div className="text-lg font-extrabold text-emerald-600 mt-0.5">84% / 96.4%</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-500">VOLTAGE / CURRENT</div>
                      <div className="text-lg font-extrabold text-emerald-600 mt-0.5">350.4 V / 120.5 A</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-500">POWER / TEMP</div>
                      <div className="text-lg font-extrabold text-emerald-600 mt-0.5">42.2 kW / 34.2 °C</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-500">INTERNAL RESISTANCE</div>
                      <div className="text-lg font-extrabold text-red-500 mt-0.5">1.25 mΩ / cell</div>
                    </div>
                  </div>
                </div>

                {/* 96 Cell Visual Matrix Grid */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase heading-tech tracking-wide">
                      CELL MONITORING MATRIX (TAP CELL FOR DIAGNOSTICS)
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] font-bold">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Healthy</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-2">
                    {Array.from({ length: 36 }).map((_, i) => {
                      const cellId = i + 1;
                      const isCritical = (demoStatus === 'CRITICAL' || demoStatus === 'WARNING') && (cellId === 14 || cellId === 28);

                      const statusColor = isCritical
                        ? 'bg-red-100 border-red-500 text-red-700 animate-pulse shadow-red'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100';

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
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-emerald-600" />
                          <h3 className="text-lg font-black text-slate-900 heading-tech">CELL C{selectedCell.id < 10 ? `0${selectedCell.id}` : selectedCell.id} DIAGNOSTICS</h3>
                        </div>
                        <button onClick={() => setSelectedCell(null)} className="p-1 text-slate-400 hover:text-slate-800">
                          <X className="w-5 h-5 text-red-500" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-500">VOLTAGE</div>
                          <div className="text-xl font-extrabold text-emerald-600">{selectedCell.voltage} V</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-500">TEMPERATURE</div>
                          <div className="text-xl font-extrabold text-red-500">{selectedCell.temp} °C</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-500">DEVIATION</div>
                          <div className="text-xl font-extrabold text-emerald-600">{selectedCell.deviation} mV</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-500">RISK SCORE</div>
                          <div className="text-xl font-extrabold text-red-500">{selectedCell.riskScore}%</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">AI CELL DIAGNOSIS</div>
                        <div className="text-xs font-semibold text-slate-800 mt-1">
                          {selectedCell.status === 'CRITICAL'
                            ? 'Severe voltage drop and elevated thermal gradient detected. Cell balancing override active.'
                            : 'Normal impedance and healthy electrochemical activity.'}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedCell(null)}
                        className="w-full py-2.5 bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-emerald uppercase"
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
                <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500/80 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert className="w-6 h-6 text-emerald-600" />
                      <div>
                        <h2 className="text-xl font-black text-slate-900 heading-tech tracking-tight uppercase">
                          AI GUARDIAN SAFETY CENTER
                        </h2>
                        <p className="text-xs text-slate-500">Physics-Informed Neural Network (PINN) Safety Engine</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                      STATUS: NORMAL
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                      <div className="text-xs font-bold text-slate-500 uppercase">OVERALL RISK SCORE</div>
                      <div className="text-5xl font-black text-emerald-600 mt-1">
                        23%
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-1">LOW RISK OPERATING REGIME</div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                      <div className="text-xs font-bold text-slate-500 uppercase">PREDICTION CONFIDENCE</div>
                      <div className="text-5xl font-black text-emerald-600 mt-1">
                        91%
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-1">VALIDATED BY PINN MODEL</div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase">ESTIMATED SAFE OPERATING WINDOW</div>
                        <div className="text-2xl font-extrabold text-red-500 mt-1">18 – 25 MIN</div>
                      </div>
                      <p className="text-[11px] font-serif italic text-slate-500 mt-2">
                        * Model-based estimate, not a guaranteed countdown.
                      </p>
                    </div>
                  </div>
                </div>

                {/* EXPLAINABLE AI CONTRIBUTION BARS */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-lg font-black text-slate-900 heading-tech tracking-tight uppercase">
                        WHY DID RISK CHANGE? (EXPLAINABLE AI)
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">PINN FEATURE ATTRIBUTION</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {[
                      { factor: 'Temperature Rise', pct: 35, color: 'bg-red-500', val: '+35%' },
                      { factor: 'Cell Imbalance', pct: 25, color: 'bg-emerald-500', val: '+25%' },
                      { factor: 'High Current Discharge', pct: 20, color: 'bg-emerald-500', val: '+20%' },
                      { factor: 'SOH Degradation', pct: 12, color: 'bg-red-500', val: '+12%' },
                      { factor: 'Other Factors', pct: 8, color: 'bg-slate-400', val: '+8%' },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>{item.factor}</span>
                          <span className="font-mono text-emerald-600">{item.val}</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
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
                <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500/80 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Cpu className="w-6 h-6 text-emerald-600" />
                      <div>
                        <h2 className="text-xl font-black text-slate-900 heading-tech uppercase">WHAT-IF BATTERY SIMULATOR</h2>
                        <p className="text-xs text-slate-500">Simulate Driving Loads, Thermal Stress & Fast Charging</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                      SIMULATED DATA
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase">VEHICLE SPEED: {simSpeed} KM/H</label>
                      <input
                        type="range"
                        min="0"
                        max="160"
                        value={simSpeed}
                        onChange={(e) => setSimSpeed(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer mt-2"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase">AMBIENT TEMP: {simTemp} °C</label>
                      <input
                        type="range"
                        min="-10"
                        max="55"
                        value={simTemp}
                        onChange={(e) => setSimTemp(Number(e.target.value))}
                        className="w-full accent-red-500 cursor-pointer mt-2"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase">AUXILIARY LOAD: {simAux} KW</label>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        step="0.5"
                        value={simAux}
                        onChange={(e) => setSimAux(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer mt-2"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase">CHARGING MODE</label>
                      <select
                        value={simMode}
                        onChange={(e) => setSimMode(e.target.value)}
                        className="input-high-contrast mt-1 text-slate-900 bg-white"
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
                    className="w-full py-3.5 bg-emerald-500 text-white font-extrabold text-sm rounded-xl hover:bg-emerald-600 transition uppercase tracking-wider shadow-emerald heading-tech"
                  >
                    {isSimulating ? 'RUNNING PHYSICAL SIMULATION...' : 'RUN SIMULATION'}
                  </button>
                </div>

                {simResults && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 animate-fadeIn shadow-md">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <h3 className="text-lg font-black text-slate-900 heading-tech uppercase">CURRENT VS SIMULATED COMPARISON</h3>
                      <span className="text-xs font-mono font-bold text-emerald-600">SIMULATED DATA</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-500">PREDICTED TEMP</div>
                        <div className="text-2xl font-extrabold text-red-500 mt-1">{simResults.predictedTemp} °C</div>
                        <div className="text-[10px] text-slate-500">Current: 34.2 °C</div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-500">PREDICTED SOC</div>
                        <div className="text-2xl font-extrabold text-emerald-600 mt-1">{simResults.predictedSoc}%</div>
                        <div className="text-[10px] text-slate-500">Current: 84%</div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-500">RISK SCORE</div>
                        <div className="text-2xl font-extrabold text-red-500 mt-1">{simResults.riskScore}%</div>
                        <div className="text-[10px] text-slate-500">Current: 23%</div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-500">SAFE WINDOW</div>
                        <div className="text-lg font-extrabold text-emerald-600 mt-1">{simResults.safeWindow}</div>
                        <div className="text-[10px] text-slate-500">Model-based estimate</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 heading-tech uppercase">BATTERY TELEMETRY & RIDE ANALYTICS</h2>
                      <p className="text-xs text-slate-500">Historical Temperature, SOC, SOH & Imbalance Metrics</p>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                      RESEARCH DATA
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="text-xs font-bold text-slate-700 uppercase">TEMPERATURE VS TIME (°C)</div>
                      <div className="h-40 flex items-end gap-1.5 pt-4">
                        {[28, 30, 31, 33, 34, 34.2, 35, 36, 38, 40, 39, 37].map((v, idx) => (
                          <div key={idx} className="flex-1 bg-red-500 hover:bg-red-600 rounded-t transition-all" style={{ height: `${(v / 50) * 100}%` }} />
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="text-xs font-bold text-slate-700 uppercase">SOC VS TIME (%)</div>
                      <div className="h-40 flex items-end gap-1.5 pt-4">
                        {[100, 98, 94, 91, 88, 85, 84, 82, 79, 75, 72, 68].map((v, idx) => (
                          <div key={idx} className="flex-1 bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all" style={{ height: `${v}%` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
          </ErrorBoundary>
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
    </div>
  );
}

export default App;
