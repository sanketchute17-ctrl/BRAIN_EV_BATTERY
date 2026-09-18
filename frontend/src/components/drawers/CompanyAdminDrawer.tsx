import React, { useEffect, useState } from 'react';
import {
  Building2,
  Database,
  Radio,
  ShieldAlert,
  Zap,
  Activity,
  Cpu,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Search,
  Filter,
  Flame,
  ArrowLeft,
} from 'lucide-react';
import { firebaseSyncService, type SyncedBatteryRecord } from '../../services/firebaseSyncService';
import type { NormalizedBatteryState } from '../../types/telemetry';

interface CompanyAdminDrawerProps {
  batteryState: NormalizedBatteryState;
  onBack: () => void;
}

export const CompanyAdminDrawer: React.FC<CompanyAdminDrawerProps> = ({
  batteryState,
  onBack,
}) => {
  const [fleetRecords, setFleetRecords] = useState<SyncedBatteryRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<SyncedBatteryRecord | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  // Auto-sync current battery telemetry to Firebase DB when drawer opens
  useEffect(() => {
    const doSync = async () => {
      setIsSyncing(true);
      await firebaseSyncService.syncTelemetryToFirebase(batteryState);
      setLastSyncTime(new Date().toLocaleTimeString());
      setIsSyncing(false);
    };
    doSync();

    // Subscribe to Firebase DB fleet stream for Company Admin App
    const unsubscribe = firebaseSyncService.subscribeToCompanyFleet((records) => {
      setFleetRecords(records);
    });

    return () => unsubscribe();
  }, [batteryState]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await firebaseSyncService.syncTelemetryToFirebase(batteryState);
    setLastSyncTime(new Date().toLocaleTimeString());
    setIsSyncing(false);
  };

  const filteredFleet = fleetRecords.filter(
    (r) =>
      r.batteryId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.deviceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const criticalCount = fleetRecords.filter(
    (r) => r.pinnAnalysis?.overallRiskLevel === 'CRITICAL' || r.pinnAnalysis?.overallRiskLevel === 'ELEVATED'
  ).length;

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. TOP HEADER & BACK NAVIGATION */}
      <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-black uppercase tracking-wide">
                COMPANY ADMINISTRATIVE APP
              </h2>
            </div>
            <p className="text-[10px] font-semibold text-slate-400">
              Firebase Database Live Telemetry &amp; PINN Central Fleet Intelligence
            </p>
          </div>
        </div>

        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Firebase'}</span>
        </button>
      </div>

      {/* 2. FIREBASE DB CONNECTION STATUS & SUMMARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-slate-400 uppercase">
            <Database className="w-3.5 h-3.5 text-emerald-600" /> FIREBASE STATUS
          </div>
          <div className="text-xs font-black text-emerald-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> ONLINE DB
          </div>
          <div className="text-[9px] font-mono text-slate-400">Synced at {lastSyncTime}</div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-slate-400 uppercase">
            <Activity className="w-3.5 h-3.5 text-blue-600" /> ACTIVE FLEET PACKS
          </div>
          <div className="text-sm font-black text-slate-900">{fleetRecords.length} Connected Units</div>
          <div className="text-[9px] font-semibold text-slate-500">Live BLE + Firebase</div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-slate-400 uppercase">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> PINN RISK ALERTS
          </div>
          <div className={`text-sm font-black ${criticalCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {criticalCount} Elevated Risk
          </div>
          <div className="text-[9px] font-semibold text-slate-500">PINN Thermal Monitor</div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-slate-400 uppercase">
            <Cpu className="w-3.5 h-3.5 text-purple-600" /> PINN AI ENGINE
          </div>
          <div className="text-sm font-black text-purple-600">Physics Neural Loss</div>
          <div className="text-[9px] font-semibold text-slate-500">Differential Heat Balance</div>
        </div>
      </div>

      {/* 3. SEARCH & FLEET LIST */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            COMPANY STORED BATTERIES IN FIREBASE ({filteredFleet.length})
          </h3>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Battery ID..."
              className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Fleet Cards */}
        <div className="space-y-3">
          {filteredFleet.map((record) => {
            const pinn = record.pinnAnalysis;
            const isCritical = pinn?.overallRiskLevel === 'CRITICAL' || pinn?.overallRiskLevel === 'ELEVATED';

            return (
              <div
                key={record.batteryId}
                className={`p-3.5 rounded-2xl border transition space-y-3 ${
                  isCritical
                    ? 'bg-red-50/70 border-red-300 shadow-red-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${isCritical ? 'bg-red-500 text-white border-red-400' : 'bg-white text-emerald-600 border-slate-200'}`}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">{record.deviceName}</div>
                      <div className="text-[10px] font-mono font-extrabold text-emerald-700">
                        ID: {record.batteryId} • {record.source}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border ${
                      isCritical
                        ? 'bg-red-600 text-white border-red-500 animate-pulse'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {pinn?.overallRiskLevel || 'SAFE'} ({pinn?.thermalRunawayRiskPct || 2}% RISK)
                  </span>
                </div>

                {/* Key Electrical Telemetry Grid */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[8px] font-extrabold text-slate-400 block uppercase">Voltage</span>
                    <span className="text-emerald-700 font-black">{record.telemetry?.voltage || 350} V</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-extrabold text-slate-400 block uppercase">Current</span>
                    <span className="text-blue-700 font-black">{record.telemetry?.current || 45} A</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-extrabold text-slate-400 block uppercase">Temp</span>
                    <span className="text-orange-600 font-black">{record.telemetry?.temperature || 34}°C</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-extrabold text-slate-400 block uppercase">SOC / SOH</span>
                    <span className="text-slate-900 font-black">{record.telemetry?.soc || 80}% / {record.telemetry?.soh || 96}%</span>
                  </div>
                </div>

                {/* PINN Physics Analysis Box */}
                {pinn && (
                  <div className="bg-slate-900 text-slate-100 p-3 rounded-xl space-y-2 border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] font-mono font-extrabold border-b border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Flame className="w-3.5 h-3.5 text-emerald-400" /> PINN PHYSICS PREDICTION METRICS
                      </span>
                      <span className="text-slate-400">Model Conf: {pinn.modelConfidencePct}%</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="text-slate-400 block">Q_GEN (Joules):</span>
                        <span className="text-emerald-300 font-black">{pinn.heatGenerationRateW} W</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Pred Temp +5M:</span>
                        <span className="text-amber-300 font-black">{pinn.predictedTemp5Min}°C</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Pred Temp +15M:</span>
                        <span className="text-red-400 font-black">{pinn.predictedTemp15Min}°C</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Est RUL Life:</span>
                        <span className="text-blue-300 font-black">{pinn.remainingUsefulLifeCycles} cycles ({pinn.remainingUsefulLifeDays} days)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Cell Imbalance:</span>
                        <span className="text-purple-300 font-black">{(pinn.cellImbalanceIndex * 1000).toFixed(0)} mV</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Physics Residual:</span>
                        <span className="text-emerald-400 font-black">{pinn.physicsResidualError}</span>
                      </div>
                    </div>

                    {pinn.recommendations && pinn.recommendations.length > 0 && (
                      <div className="text-[9px] font-bold text-amber-200 bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                        📌 {pinn.recommendations[0]}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CompanyAdminDrawer;
