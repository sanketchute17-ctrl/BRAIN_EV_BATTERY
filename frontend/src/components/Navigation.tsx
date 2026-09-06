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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F1420]/98 backdrop-blur-md border-t-2 border-[#00FF87]/40 py-2.5 px-4 shadow-[0_-10px_30px_rgba(0,0,0,0.9)]">
      <div className="max-w-4xl mx-auto flex items-center justify-around">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTab(t.id)}
              className={`flex flex-col items-center gap-1 px-3.5 py-1.5 rounded-xl transition-all ${
                isActive
                  ? 'text-[#00FF87] font-black bg-[#00FF87]/25 border-2 border-[#00FF87] shadow-[0_0_15px_rgba(0,255,135,0.6)]'
                  : 'text-slate-200 hover:text-white hover:bg-[#182238]'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-[#00FF87] stroke-[2.5]' : 'stroke-[2]'}`} />
              <span className="text-xs font-bold tracking-tight">{t.label}</span>
            </button>
          );
        })}
        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center gap-1 px-3.5 py-1.5 text-[#FF2A55] hover:text-white rounded-xl transition-all border-2 border-[#FF2A55]/40 bg-[#FF2A55]/15 hover:bg-[#FF2A55]/30 shadow-[0_0_15px_rgba(255,42,85,0.3)]"
        >
          <Menu className="w-6 h-6 stroke-[2.5]" />
          <span className="text-xs font-black tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
};
