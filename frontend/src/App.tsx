import React, { useState, useEffect } from 'react';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { Navigation } from './components/Navigation';
import type { TabType, DrawerType } from './components/Navigation';
import { MenuDrawer } from './components/MenuDrawer';
import { Battery3DView } from './components/Battery3DView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BrainLogo } from './components/BrainLogo';
import { BleDiagnosticsModal } from './components/BleDiagnosticsModal';
import { apiService } from './services/api';
import { bluetoothService } from './services/bluetoothService';
import { batteryStateService } from './services/batteryStateService';
import type { NormalizedBatteryState } from './types/telemetry';
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
  BatteryCharging,
  LogOut,
  User,
  SlidersHorizontal
} from 'lucide-react';

export function App() {
  const [authState, setAuthState] = useState<'LOGIN' | 'REGISTER' | 'AUTHENTICATED'>('LOGIN');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeDrawerItem, setActiveDrawerItem] = useState<DrawerType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  // Global Normalized Battery State (Driven by Live BLE, Virtual GATT, or Demo)
  const [batteryState, setBatteryState] = useState<NormalizedBatteryState>(
    batteryStateService.getSnapshot()
  );

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

  const [bleConnecting, setBleConnecting] = useState(false);
  const [bleError, setBleError] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      const token = apiService.getStoredToken();
      if (token) {
        const user = await apiService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setAuthState('AUTHENTICATED');
          setIsDemoMode(false);
        }
      }
    };
    initAuth();

    const checkBackend = async () => {
      const res = await apiService.checkBackendStatus();
      setBackendOnline(res.online);
    };
    checkBackend();
    const interval = setInterval(checkBackend, 15000);

    // Subscribe to normalized global battery state updates
    const unsubscribeBattery = batteryStateService.subscribe((newState) => {
      setBatteryState(newState);
    });

    return () => {
      clearInterval(interval);
      unsubscribeBattery();
    };
  }, []);

  const handleLogout = () => {
    apiService.clearStoredToken();
    setCurrentUser(null);
    setIsDemoMode(false);
    setAuthState('LOGIN');
  };

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

  const [registeredEmail, setRegisteredEmail] = useState('');

  if (authState === 'LOGIN') {
    return (
      <LoginScreen
        initialEmail={registeredEmail}
        onLoginSuccess={(isDemo) => {
          if (isDemo) {
            setIsDemoMode(true);
            batteryStateService.setDemoMode(true);
          } else {
            setIsDemoMode(false);
            batteryStateService.setDemoMode(false);
          }
          setAuthState('AUTHENTICATED');
        }}
        onNavigateRegister={() => setAuthState('REGISTER')}
      />
    );
  }

  if (authState === 'REGISTER') {
    return (
      <RegisterScreen
        onRegisterComplete={(email) => {
          if (email) setRegisteredEmail(email);
          setAuthState('LOGIN');
        }}
        onNavigateLogin={() => setAuthState('LOGIN')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 selection:bg-emerald-500/20 relative overflow-hidden">
      
      {/* MOBILE APP CONTAINER FRAME */}
      <div className="w-full sm:max-w-[420px] min-h-screen sm:min-h-[850px] sm:max-h-[920px] sm:rounded-[46px] relative overflow-hidden shadow-2xl border-0 sm:border-[10px] sm:border-slate-900 bg-slate-100 text-slate-900 flex flex-col justify-between z-10">
        
        {/* HEADER BAR */}
        <div className="bg-slate-900 text-white p-3.5 pt-4 flex items-center justify-between shrink-0 shadow-md relative z-20">
          <div className="flex items-center gap-2">
            <BrainLogo size="sm" layout="horizontal" showFullForm={false} />
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-tight leading-none text-white">BRAIN EV</span>
              <span className="text-[9px] font-mono text-emerald-400 leading-none mt-0.5">
                {batteryState.source === 'LIVE_BLE' ? '● LIVE BLE GATT' : batteryState.source === 'LAST_KNOWN' ? '▲ LAST KNOWN' : 'DEMO MODE'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* BLE Diagnostics Trigger Button */}
            <button
              onClick={() => setIsDiagnosticsOpen(true)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 transition cursor-pointer flex items-center gap-1 text-[10px] font-mono font-bold"
              title="Open BLE GATT Diagnostics"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>DIAG</span>
            </button>

            {/* Profile Screen Button */}
            <button
              onClick={() => setActiveTab('profile')}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Menu Drawer Toggle */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MAIN SCROLLABLE CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 relative z-10">
          
          {/* DRAWER SUB-MODULE SCREEN OVERLAY */}
          {activeDrawerItem ? (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  {activeDrawerItem} MODULE
                </h2>
                <button
                  onClick={() => setActiveDrawerItem(null)}
                  className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  ← Back to Home
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
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        LIVE TELEMETRY
                      </button>
                      <button
                        onClick={() => setTwinMode('PREDICTED')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg ${
                          twinMode === 'PREDICTED'
                            ? 'bg-red-500 text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        PREDICTED STATE
                      </button>
                    </div>
                  </div>

                  <div className="h-80 rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-900">
                    <ErrorBoundary>
                      <Battery3DView
                        status={batteryState.safetyState}
                        voltage={batteryState.voltage}
                        temperature={batteryState.temperature}
                        risk={batteryState.risk}
                        expanded={true}
                        interactive={true}
                        cellData={batteryState.cells}
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              ) : activeDrawerItem === 'bms' ? (
                <div className="space-y-4 animate-fadeIn">
                  {/* CONNECTED BLE BMS CARD */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-white border border-slate-200 text-emerald-600 shadow-sm">
                          <Bluetooth className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">BLUETOOTH LOW ENERGY (BLE) BMS</h3>
                          <p className="text-[10px] font-semibold text-slate-500">Real GATT Peripheral Telemetry Stream</p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-full border ${
                          batteryState.connectionState === 'CONNECTED'
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                            : batteryState.connectionState === 'RECONNECTING'
                            ? 'bg-amber-50 border-amber-300 text-amber-700'
                            : 'bg-slate-100 border-slate-300 text-slate-500'
                        }`}
                      >
                        ● {batteryState.connectionState}
                      </span>
                    </div>

                    {bleError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                        <span>{bleError}</span>
                      </div>
                    )}

                    {/* Device Info & RSSI */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">DEVICE NAME</div>
                        <div className="text-xs font-black text-slate-900 mt-0.5 truncate">
                          {batteryState.deviceName || 'BRAIN-VIRTUAL-BMS'}
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">RSSI SIGNAL</div>
                        <div className="text-xs font-mono font-bold text-emerald-600 mt-0.5">
                          {batteryState.rssi ? `${batteryState.rssi} dBm (Strong)` : '-55 dBm'}
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={async () => {
                          setBleConnecting(true);
                          setBleError('');
                          try {
                            await bluetoothService.scanAndConnectDevice();
                          } catch (err: any) {
                            setBleError(err.message || 'BLE scan failed.');
                          } finally {
                            setBleConnecting(false);
                          }
                        }}
                        disabled={bleConnecting}
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md uppercase cursor-pointer"
                      >
                        <Bluetooth className="w-4 h-4" />
                        <span>{bleConnecting ? 'SCANNING FOR BRAIN-VIRTUAL-BMS...' : 'SCAN & PAIR BLE BMS'}</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setBleError('');
                            bluetoothService.startVirtualGattPeripheral();
                          }}
                          className="py-2.5 px-3 bg-purple-50 text-purple-700 border border-purple-300 font-black text-[11px] rounded-xl hover:bg-purple-100 transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Wifi className="w-3.5 h-3.5 text-purple-600" />
                          <span>START VIRTUAL GATT</span>
                        </button>

                        <button
                          onClick={() => bluetoothService.disconnect()}
                          disabled={batteryState.connectionState !== 'CONNECTED'}
                          className="py-2.5 px-3 bg-slate-100 text-slate-700 border border-slate-300 font-black text-[11px] rounded-xl hover:bg-slate-200 disabled:opacity-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>DISCONNECT</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
                  <span className="text-xs font-mono font-bold text-slate-500 tracking-widest uppercase">
                    [ {activeDrawerItem.toUpperCase()} MODULE ACTIVE ]
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* TAB 1: HOME DASHBOARD */}
              {activeTab === 'home' && (
                <div className="space-y-3.5">
                  
                  {/* LIVE BLE STATUS BANNER */}
                  <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-2">
                      {batteryState.source === 'LIVE_BLE' ? (
                        <span className="inline-flex items-center gap-1.5 bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 rounded-full text-[10px] font-black text-[#047857]">
                          <span className="w-2 h-2 rounded-full bg-[#059669] animate-ping" />
                          BMS CONNECTED ● LIVE BLE
                        </span>
                      ) : batteryState.source === 'LAST_KNOWN' ? (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full text-[10px] font-black text-amber-700">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          BMS CONNECTION LOST - LAST KNOWN DATA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-full text-[10px] font-black text-slate-700">
                          <span className="w-2 h-2 rounded-full bg-slate-500" />
                          DEMO MODE
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setIsDiagnosticsOpen(true)}
                      className="text-[10px] font-extrabold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Diagnostics</span>
                      <Radio className="w-3 h-3" />
                    </button>
                  </div>

                  {/* 3D DIGITAL TWIN HERO CARD */}
                  <div className="bg-white rounded-3xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-full text-[9px] font-extrabold text-[#047857]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" /> Live Twin
                        </span>
                        <div>
                          <h3 className="text-xs font-black text-slate-900 tracking-tight">3D Digital Twin</h3>
                          <p className="text-[9px] font-semibold text-slate-400">Interactive Battery Pack</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveDrawerItem('twin')}
                        className="inline-flex items-center gap-1 bg-white border border-[#059669] px-2.5 py-1 rounded-full text-[10px] font-extrabold text-[#059669] hover:bg-emerald-50 transition cursor-pointer"
                      >
                        <span>Fullscreen 3D</span>
                        <Maximize2 className="w-3 h-3 text-[#059669]" />
                      </button>
                    </div>

                    {/* Interactive 3D WebGL Battery View */}
                    <div className="relative flex flex-col items-center justify-center">
                      <div className="w-full h-40 sm:h-44 relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-900">
                        <ErrorBoundary>
                          <Battery3DView
                            status={batteryState.safetyState}
                            voltage={batteryState.voltage}
                            temperature={batteryState.temperature}
                            risk={batteryState.risk}
                            interactive={true}
                            hideControls={true}
                            cellData={batteryState.cells}
                          />
                        </ErrorBoundary>
                      </div>

                      <div className="text-[10px] font-extrabold text-slate-700 tracking-wide mt-1.5 bg-slate-100/90 px-3 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                        1-Finger <span className="text-[#059669]">rotate</span> • Pinch <span className="text-[#059669]">zoom</span> • Tap <span className="text-[#059669]">cell telemetry</span>
                      </div>
                    </div>

                    {/* 4 KEY METRICS HORIZONTAL ROW */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <div className="bg-[#F8FAFC] p-2 rounded-2xl border border-slate-200/60 text-center">
                        <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold text-slate-400 uppercase">
                          <BatteryCharging className="w-3 h-3 text-[#059669]" /> SOC
                        </div>
                        <div className="text-xs sm:text-sm font-black text-[#059669] mt-0.5">{batteryState.soc}%</div>
                      </div>

                      <div className="bg-[#F8FAFC] p-2 rounded-2xl border border-slate-200/60 text-center">
                        <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold text-slate-400 uppercase">
                          <Heart className="w-3 h-3 text-[#2563EB]" /> SOH
                        </div>
                        <div className="text-xs sm:text-sm font-black text-[#2563EB] mt-0.5">{batteryState.soh}%</div>
                      </div>

                      <div className="bg-[#F8FAFC] p-2 rounded-2xl border border-slate-200/60 text-center">
                        <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold text-slate-400 uppercase">
                          <Thermometer className="w-3 h-3 text-[#EA580C]" /> Temp
                        </div>
                        <div className="text-xs sm:text-sm font-black text-[#EA580C] mt-0.5">{batteryState.temperature}°C</div>
                      </div>

                      <div className="bg-[#F8FAFC] p-2 rounded-2xl border border-slate-200/60 text-center">
                        <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold text-slate-400 uppercase">
                          <NavigationIcon className="w-3 h-3 text-[#059669]" /> Range
                        </div>
                        <div className="text-xs sm:text-sm font-black text-[#059669] mt-0.5">{batteryState.estimatedRange} km</div>
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
                          <h4 className="text-xs font-black text-slate-900">Battery Health Condition</h4>
                          <p className="text-[9px] font-semibold text-slate-400">
                            {batteryState.safetyState === 'HEALTHY' ? 'Normal optimal operating state' : 'Thermal warning alert active'}
                          </p>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        batteryState.safetyState === 'HEALTHY'
                          ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]'
                          : 'bg-amber-50 border-amber-300 text-amber-800'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> {batteryState.safetyState}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full bg-[#059669] rounded-full transition-all duration-500"
                          style={{ width: `${batteryState.soh}%` }}
                        />
                      </div>
                      <div className="text-right text-xs font-black text-slate-900">{batteryState.soh}%</div>
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
                        <div className="text-xs font-black text-[#059669]">{batteryState.voltage} V</div>
                      </div>

                      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                        <Activity className="w-4 h-4 text-[#2563EB]" />
                        <div className="text-[8px] font-extrabold text-slate-400 uppercase">Current</div>
                        <div className="text-xs font-black text-[#2563EB]">{batteryState.current} A</div>
                      </div>

                      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                        <Cpu className="w-4 h-4 text-[#9333EA]" />
                        <div className="text-[8px] font-extrabold text-slate-400 uppercase">Power</div>
                        <div className="text-xs font-black text-[#9333EA]">{batteryState.power} kW</div>
                      </div>

                      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                        <Thermometer className="w-4 h-4 text-[#EA580C]" />
                        <div className="text-[8px] font-extrabold text-slate-400 uppercase">Temp</div>
                        <div className="text-xs font-black text-[#EA580C]">{batteryState.temperature} °C</div>
                      </div>
                    </div>
                  </div>

                  {/* AI GUARDIAN & RISK STATUS CARDS */}
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
                          <div className="text-[8px] font-semibold text-slate-400 leading-tight">PINN AI Inference</div>
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
                          <div className="text-xs font-black text-slate-900">Risk Score</div>
                          <div className="text-[9px] font-extrabold text-[#059669]">{batteryState.risk}% Risk</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: BATTERY INTELLIGENCE & CELL MONITORING */}
              {activeTab === 'battery' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <h2 className="text-sm font-black text-slate-900 uppercase">INDIVIDUAL CELL BALANCING GRID</h2>
                        <p className="text-[10px] text-slate-500">Live Individual Cell Voltage &amp; Thermal Sensor Array</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                        {batteryState.cells.length} CELLS ACTIVE
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {batteryState.cells.map((cell) => (
                        <div
                          key={cell.id}
                          className={`p-2.5 rounded-xl border text-center transition ${
                            cell.status === 'WARNING' || cell.status === 'CRITICAL'
                              ? 'bg-red-50 border-red-300 text-red-900 shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="text-[9px] font-mono font-extrabold uppercase text-slate-500">
                            CELL C0{cell.id}
                          </div>
                          <div className="text-xs font-black mt-0.5">{cell.voltage} V</div>
                          <div className={`text-[9px] font-extrabold mt-0.5 ${
                            cell.status === 'WARNING' || cell.status === 'CRITICAL' ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                            {cell.temperature} °C
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: GUARDIAN AI */}
              {activeTab === 'guardian' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-sm font-black text-slate-900 uppercase">PINN AI GUARDIAN SAFETY MODEL</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Physics-Informed Neural Network (PINN) analyzing real-time thermal diffusion, internal impedance, and cell voltage deviation.
                    </p>

                    <div className="p-3 rounded-xl bg-slate-900 text-white font-mono text-xs space-y-1">
                      <div>● CURRENT THERMAL RISK: {batteryState.risk}%</div>
                      <div>● MODEL PREDICTED TEMP: {batteryState.temperature}°C</div>
                      <div>● PREDICTED SAFE OPERATING WINDOW: &gt; 35 MIN</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PROFILE */}
              {activeTab === 'profile' && (
                <ProfileScreen
                  user={currentUser}
                  onLogout={handleLogout}
                  onNavigateBack={() => setActiveTab('home')}
                />
              )}
            </>
          )}

        </div>

        {/* BOTTOM NAVIGATION TABS */}
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* MENU DRAWER OVERLAY */}
      <MenuDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectDrawerItem={(item) => setActiveDrawerItem(item)}
        onLogout={handleLogout}
      />

      {/* DEVELOPER BLE DIAGNOSTICS MODAL */}
      <BleDiagnosticsModal
        batteryState={batteryState}
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />
    </div>
  );
}

export default App;
