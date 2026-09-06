import React from 'react';
import { X, Stethoscope, MessageSquare, Flame, Zap, AlertTriangle, Radio, BookOpen, FileText, Settings, ChevronRight } from 'lucide-react';
import type { DrawerType } from './Navigation';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDrawerItem: (item: DrawerType) => void;
  onLogout: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  onSelectDrawerItem,
  onLogout,
}) => {
  if (!isOpen) return null;

  const menuItems = [
    { id: 'doctor', label: 'AI Battery Doctor', icon: Stethoscope, tag: 'DIAGNOSTICS' },
    { id: 'assistant', label: 'BRAIN Assistant', icon: MessageSquare, tag: 'CONVERSATIONAL' },
    { id: 'twin', label: 'Digital Twin Visualizer', icon: Flame, tag: '3D TWIN' },
    { id: 'charging', label: 'Charging Intelligence', icon: Zap, tag: 'ANALYTICS' },
    { id: 'alerts', label: 'Alerts & Emergency Mode', icon: AlertTriangle, tag: 'SAFETY' },
    { id: 'bms', label: 'Connected BMS (BLE)', icon: Radio, tag: 'HARDWARE' },
    { id: 'research', label: 'Research Dashboard', icon: BookOpen, tag: 'PINN METRICS' },
    { id: 'reports', label: 'Research PDF Reports', icon: FileText, tag: 'EXPORT' },
    { id: 'settings', label: 'System Settings', icon: Settings, tag: 'PREFERENCES' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-4/5 max-w-sm bg-brain-charcoal border-l border-brain-border h-full flex flex-col justify-between p-5 shadow-2xl">
        {/* Drawer Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-brain-border">
            <div>
              <h3 className="text-xl font-extrabold text-electric-green heading-tech tracking-wider uppercase">BRAIN MODULES</h3>
              <p className="text-xs font-semibold text-slate-400">Research & Intelligence System</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl glass-panel-premium text-slate-400 hover:text-white border border-brain-border"
            >
              <X className="w-5 h-5 text-electric-red" />
            </button>
          </div>

          {/* Menu Items List */}
          <div className="mt-4 space-y-2 overflow-y-auto max-h-[70vh] pr-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectDrawerItem(item.id as DrawerType);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-brain-navy/60 hover:bg-electric-green/15 border border-brain-border hover:border-electric-green/40 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-brain-card text-electric-green group-hover:text-electric-red transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-mono font-bold text-white group-hover:text-electric-green transition">
                        {item.label}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">{item.tag}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-electric-green transition" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Logout Footer */}
        <div className="pt-4 border-t border-brain-border">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full py-3 bg-electric-red/15 text-electric-red border border-electric-red/40 rounded-xl text-xs font-mono font-bold hover:bg-electric-red/30 transition uppercase tracking-wider shadow-neon-red"
          >
            SIGN OUT OPERATOR
          </button>
        </div>
      </div>
    </div>
  );
};
