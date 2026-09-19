import React, { useState } from 'react';
import type { NormalizedBatteryState } from '../../types/telemetry';
import { ArrowLeft, Settings, Save, CheckCircle2, Sliders } from 'lucide-react';

interface SettingsDrawerProps {
  batteryState: NormalizedBatteryState;
  onBack: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ batteryState, onBack }) => {
  const [maxTempLimit, setMaxTempLimit] = useState(() => {
    return Number(localStorage.getItem('brain_setting_max_temp')) || 55;
  });
  const [minVoltageLimit, setMinVoltageLimit] = useState(() => {
    return Number(localStorage.getItem('brain_setting_min_v')) || 2.8;
  });
  const [maxCurrentLimit, setMaxCurrentLimit] = useState(() => {
    return Number(localStorage.getItem('brain_setting_max_curr')) || 200;
  });
  const [autoReconnect, setAutoReconnect] = useState(() => {
    return localStorage.getItem('brain_setting_auto_reconnect') !== 'false';
  });
  const [firebaseSync, setFirebaseSync] = useState(() => {
    return localStorage.getItem('brain_setting_firebase_sync') !== 'false';
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    try {
      localStorage.setItem('brain_setting_max_temp', String(maxTempLimit));
      localStorage.setItem('brain_setting_min_v', String(minVoltageLimit));
      localStorage.setItem('brain_setting_max_curr', String(maxCurrentLimit));
      localStorage.setItem('brain_setting_auto_reconnect', String(autoReconnect));
      localStorage.setItem('brain_setting_firebase_sync', String(firebaseSync));
    } catch (e) {}

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

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
              <Settings className="w-4 h-4 text-emerald-600 shrink-0" />
              SYSTEM SETTINGS &amp; THRESHOLDS
            </h2>
            <p className="text-[11px] text-slate-500 font-semibold truncate">
              BMS Protection Limits, Alarms &amp; Firebase Sync Config
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 shrink-0">
          CONFIG PREFERENCES
        </span>
      </div>

      {/* BMS Protection Settings Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase heading-tech tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
          <Sliders className="w-4 h-4 text-emerald-600" />
          BMS SAFETY &amp; ALARM THRESHOLDS
        </h3>

        <div className="space-y-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="flex justify-between">
              <span>MAX PACK TEMPERATURE LIMIT (°C)</span>
              <span className="font-mono text-emerald-600 font-bold">{maxTempLimit}°C</span>
            </label>
            <input
              type="range"
              min="40"
              max="70"
              value={maxTempLimit}
              onChange={(e) => setMaxTempLimit(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer mt-1"
            />
          </div>

          <div>
            <label className="flex justify-between">
              <span>MINIMUM CELL CUTOFF VOLTAGE (V)</span>
              <span className="font-mono text-emerald-600 font-bold">{minVoltageLimit}V</span>
            </label>
            <input
              type="range"
              min="2.5"
              max="3.2"
              step="0.1"
              value={minVoltageLimit}
              onChange={(e) => setMinVoltageLimit(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer mt-1"
            />
          </div>

          <div>
            <label className="flex justify-between">
              <span>MAX DISCHARGE CURRENT LIMIT (A)</span>
              <span className="font-mono text-emerald-600 font-bold">{maxCurrentLimit}A</span>
            </label>
            <input
              type="range"
              min="100"
              max="350"
              step="10"
              value={maxCurrentLimit}
              onChange={(e) => setMaxCurrentLimit(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer mt-1"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span>REALTIME FIREBASE DB SYNC STREAM</span>
            <input
              type="checkbox"
              checked={firebaseSync}
              onChange={(e) => setFirebaseSync(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span>AUTOMATIC BLE RECONNECT BACKOFF</span>
            <input
              type="checkbox"
              checked={autoReconnect}
              onChange={(e) => setAutoReconnect(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer active:scale-98"
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>SETTINGS SAVED TO BACKEND!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>SAVE BMS PREFERENCES</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
