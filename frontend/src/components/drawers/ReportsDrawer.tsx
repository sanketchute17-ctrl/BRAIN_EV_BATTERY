import React from 'react';
import type { NormalizedBatteryState } from '../../types/telemetry';
import { ArrowLeft, FileText, Download, Share2, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ReportsDrawerProps {
  batteryState: NormalizedBatteryState;
  onBack: () => void;
}

export const ReportsDrawer: React.FC<ReportsDrawerProps> = ({ batteryState, onBack }) => {
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(batteryState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `BRAIN_Battery_Telemetry_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

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
              <FileText className="w-5 h-5 text-emerald-600" />
              RESEARCH PDF REPORTS &amp; TELEMETRY EXPORT
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              Generate Printable Battery Health Certificates &amp; Export Telemetry Logs
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
          REPORT READY
        </span>
      </div>

      {/* PDF Report Preview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="font-extrabold text-slate-900 text-sm">BRAIN EV BATTERY CERTIFICATE REPORT</span>
          </div>
          <span className="text-slate-400 text-[10px]">ID: RPT-{Date.now().toString().slice(-6)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700">
          <div><span className="text-slate-400">PACK ID:</span> {batteryState.deviceId || 'BRAIN001'}</div>
          <div><span className="text-slate-400">STATE OF HEALTH:</span> {batteryState.soh}%</div>
          <div><span className="text-slate-400">STATE OF CHARGE:</span> {batteryState.soc}%</div>
          <div><span className="text-slate-400">PACK VOLTAGE:</span> {batteryState.voltage} V</div>
          <div><span className="text-slate-400">LOAD CURRENT:</span> {batteryState.current} A</div>
          <div><span className="text-slate-400">MAX TEMPERATURE:</span> {batteryState.maxTemperature || batteryState.temperature} °C</div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>PRINT / SAVE AS PDF</span>
          </button>
          <button
            onClick={handleExportJson}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>EXPORT JSON TELEMETRY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
