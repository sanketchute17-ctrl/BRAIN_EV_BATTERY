import React from 'react';
import { Home, BatteryCharging, ShieldAlert, Box, LineChart, Menu } from 'lucide-react';

export type TabType = 'home' | 'battery' | 'guardian' | 'simulator' | 'analytics';
export type DrawerType = 'doctor' | 'assistant' | 'twin' | 'charging' | 'alerts' | 'bms' | 'research' | 'reports' | 'settings';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenDrawer: () => void;
  bmsConnected?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenDrawer,
}) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'battery', label: 'Battery', icon: BatteryCharging },
    { id: 'guardian', label: 'AI Guardian', icon: ShieldAlert },
    { id: 'simulator', label: 'Simulator', icon: Box },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
  ] as const;

  return (
    <div className="sticky bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/80 pt-1 pb-1.5 px-2 shrink-0">
      <div className="w-full flex items-center justify-around">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTab(t.id)}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1 transition-all cursor-pointer ${
                isActive ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-6 h-0.5 bg-emerald-500 rounded-full" />
              )}
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] font-bold tracking-tight">{t.label}</span>
            </button>
          );
        })}
        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center gap-0.5 px-2 py-1 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] font-bold tracking-tight">Menu</span>
        </button>
      </div>

      {/* iOS Home Indicator Bar */}
      <div className="w-28 h-1 bg-slate-300 rounded-full mx-auto mt-1.5" />
    </div>
  );
};
