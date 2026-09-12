import React from 'react';
import type { NormalizedBatteryState } from '../types/telemetry';
import { BLE_CONFIG } from '../services/bleConfig';
import { bluetoothService } from '../services/bluetoothService';
import { Activity, Radio, Wifi, RefreshCw, X, ShieldAlert, Cpu, CheckCircle2, Zap } from 'lucide-react';

interface BleDiagnosticsModalProps {
  batteryState: NormalizedBatteryState;
  isOpen: boolean;
  onClose: () => void;
}

export const BleDiagnosticsModal: React.FC<BleDiagnosticsModalProps> = ({
  batteryState,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const diag = batteryState.diagnostics;
  const isConnected = batteryState.connectionState === 'CONNECTED';
  const packetLossRate = diag.packetsReceived > 0
    ? ((diag.packetsLost / (diag.packetsReceived + diag.packetsLost)) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-5 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                <span>BLE GATT RESEARCH DIAGNOSTICS</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">
                  v{BLE_CONFIG.PROTOCOL_VERSION}.0 GATT
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Real-Time Telemetry & Hardware Connection Metrics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Summary Banner */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isConnected
            ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
            : batteryState.connectionState === 'RECONNECTING'
            ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
            : 'bg-slate-800/80 border-slate-700 text-slate-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider">
                STATUS: {batteryState.connectionState} ({batteryState.source})
              </div>
              <div className="text-sm font-black text-white">
                {batteryState.deviceName || 'No BLE Peripheral Connected'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isConnected ? (
              <button
                onClick={() => {
                  bluetoothService.scanAndConnectDevice().catch(() => {});
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Radio className="w-4 h-4" />
                <span>SCAN &amp; CONNECT</span>
              </button>
            ) : (
              <button
                onClick={() => bluetoothService.disconnect()}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl transition shadow-md cursor-pointer"
              >
                DISCONNECT
              </button>
            )}
          </div>
        </div>

        {/* Diagnostic Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-800/90 p-3 rounded-2xl border border-slate-700">
            <div className="text-[10px] text-slate-400 uppercase">DEVICE ID</div>
            <div className="text-xs font-bold text-emerald-400 mt-1 truncate">
              {batteryState.deviceId || 'N/A'}
            </div>
          </div>

          <div className="bg-slate-800/90 p-3 rounded-2xl border border-slate-700">
            <div className="text-[10px] text-slate-400 uppercase">RSSI SIGNAL</div>
            <div className="text-xs font-bold text-cyan-400 mt-1">
              {batteryState.rssi ? `${batteryState.rssi} dBm` : 'N/A'}
            </div>
          </div>

          <div className="bg-slate-800/90 p-3 rounded-2xl border border-slate-700">
            <div className="text-[10px] text-slate-400 uppercase">PACKETS RECV</div>
            <div className="text-xs font-bold text-white mt-1">
              {diag.packetsReceived}
            </div>
          </div>

          <div className="bg-slate-800/90 p-3 rounded-2xl border border-slate-700">
            <div className="text-[10px] text-slate-400 uppercase">PACKET LOSS</div>
            <div className="text-xs font-bold text-amber-400 mt-1">
              {diag.packetsLost} ({packetLossRate}%)
            </div>
          </div>

          <div className="bg-slate-800/90 p-3 rounded-2xl border border-slate-700">
            <div className="text-[10px] text-slate-400 uppercase">SEQUENCE NO</div>
            <div className="text-xs font-bold text-purple-400 mt-1">
              #{diag.lastSequenceNumber ?? '---'}
            </div>
          </div>

          <div className="bg-slate-800/90 p-3 rounded-2xl border border-slate-700">
            <div className="text-[10px] text-slate-400 uppercase">BLE LATENCY</div>
            <div className="text-xs font-bold text-emerald-400 mt-1">
              {diag.approxLatencyMs} ms
            </div>
          </div>

          <div className="bg-slate-800/90 p-3 rounded-2xl border border-slate-700">
            <div className="text-[10px] text-slate-400 uppercase">FREQUENCY</div>
            <div className="text-xs font-bold text-white mt-1">
              1.0 Hz (1 pkt/s)
            </div>
          </div>

          <div className="bg-slate-800/90 p-3 rounded-2xl border border-slate-700">
            <div className="text-[10px] text-slate-400 uppercase">DURATION</div>
            <div className="text-xs font-bold text-cyan-400 mt-1">
              {diag.connectionDurationSec} sec
            </div>
          </div>
        </div>

        {/* GATT Service UUID Details */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            GATT SERVICE CONTRACT UUIDS
          </div>

          <div className="flex items-center justify-between text-slate-300 bg-slate-900 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400">SERVICE UUID:</span>
            <span className="text-emerald-300 font-bold select-all">{BLE_CONFIG.SERVICE_UUID}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300 bg-slate-900 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400">TELEMETRY CHAR:</span>
            <span className="text-cyan-300 font-bold select-all">{BLE_CONFIG.TELEMETRY_CHAR_UUID}</span>
          </div>
        </div>

        {/* Raw Ingested Telemetry Preview */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              RAW LIVE TELEMETRY PAYLOAD SNAPSHOT
            </span>
            <span className="text-[10px] text-slate-500">
              Last Update: {new Date(batteryState.lastUpdated).toLocaleTimeString()}
            </span>
          </div>

          <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-emerald-400 max-h-40 overflow-y-auto leading-relaxed">
            {JSON.stringify(
              {
                protocolVersion: BLE_CONFIG.PROTOCOL_VERSION,
                source: batteryState.source,
                pack: {
                  soc: batteryState.soc,
                  soh: batteryState.soh,
                  voltage: batteryState.voltage,
                  current: batteryState.current,
                  power: batteryState.power,
                  temperature: batteryState.temperature,
                  risk: batteryState.risk,
                  safetyState: batteryState.safetyState,
                },
                cells: batteryState.cells.map((c) => ({
                  id: c.id,
                  voltage: c.voltage,
                  temp: c.temperature,
                  status: c.status,
                })),
              },
              null,
              2
            )}
          </pre>
        </div>

        {/* 1-Click Virtual GATT Peripheral Simulator Option for Offline Testing */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
          <div>
            <div className="text-xs font-bold text-white">VIRTUAL PERIPHERAL SIMULATOR</div>
            <div className="text-[10px] text-slate-400">
              Generates real GATT Telemetry JSON notifications locally for testing.
            </div>
          </div>

          <button
            onClick={() => {
              bluetoothService.startVirtualGattPeripheral();
            }}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl transition cursor-pointer"
          >
            START VIRTUAL GATT
          </button>
        </div>
      </div>
    </div>
  );
};

export default BleDiagnosticsModal;
