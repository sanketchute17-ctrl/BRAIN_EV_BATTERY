import React from 'react';
import { Home, BatteryCharging, ShieldAlert, Cpu, LineChart, Menu } from 'lucide-react';

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
    { id: 'simulator', label: 'Simulator', icon: Cpu },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-4 shadow-[0_-5px_25px_rgba(15,23,42,0.08)]">
      <div className="max-w-4xl mx-auto flex items-center justify-around">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTab(t.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-500/80 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 stroke-[2.5]' : 'stroke-[2]'}`} />
              <span className="text-xs font-bold tracking-tight">{t.label}</span>
            </button>
          );
        })}
        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-slate-700 hover:text-emerald-700 rounded-xl transition-all border border-slate-200 bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300"
        >
          <Menu className="w-5 h-5 stroke-[2.5]" />
          <span className="text-xs font-bold tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
};
