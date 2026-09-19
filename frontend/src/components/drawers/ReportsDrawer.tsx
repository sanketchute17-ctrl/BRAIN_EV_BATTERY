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

  const activeSoh = batteryState.soh || 96.4;
  const activeSoc = batteryState.soc || 84;
  const activeVolt = batteryState.voltage || 25.60;
  const activeCurr = batteryState.current || 0.00;
  const activeTemp = batteryState.maxTemperature || batteryState.temperature || 22.5;

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
              <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
              RESEARCH PDF REPORTS &amp; TELEMETRY EXPORT
            </h2>
            <p className="text-[11px] text-slate-500 font-semibold truncate">
              Generate Printable Battery Health Certificates &amp; Export Telemetry Logs
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 shrink-0">
          REPORT READY
        </span>
      </div>

      {/* PDF Report Preview Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">BRAIN EV BATTERY CERTIFICATE REPORT</span>
          </div>
          <span className="text-slate-400 text-[10px] shrink-0">ID: RPT-{Date.now().toString().slice(-6)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 text-xs">
          <div><span className="text-slate-400">PACK ID:</span> {batteryState.deviceId || 'ROHIT-MORE-96S'}</div>
          <div><span className="text-slate-400">STATE OF HEALTH:</span> <span className="font-bold text-emerald-600">{activeSoh}%</span></div>
          <div><span className="text-slate-400">STATE OF CHARGE:</span> <span className="font-bold text-emerald-600">{activeSoc}%</span></div>
          <div><span className="text-slate-400">PACK VOLTAGE:</span> <span className="font-bold text-slate-900">{activeVolt} V</span></div>
          <div><span className="text-slate-400">LOAD CURRENT:</span> <span className="font-bold text-slate-900">{activeCurr} A</span></div>
          <div><span className="text-slate-400">MAX TEMPERATURE:</span> <span className="font-bold text-slate-900">{activeTemp} °C</span></div>
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
