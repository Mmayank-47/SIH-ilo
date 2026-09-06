import React from 'react';
import { NavigationTab } from '../types';

interface BottomNavProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  onOpenClinicalMonitor?: () => void;
  isClinicalMonitorOpen?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onNavigate,
  onOpenClinicalMonitor,
  isClinicalMonitorOpen = false,
}) => {
  if (currentTab === 'support') {
    return null; // Support screen has dedicated full view
  }

  const navItems: { id: NavigationTab; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: 'cottage' },
    { id: 'journal', label: 'Journal', icon: 'menu_book' },
    { id: 'chat', label: 'Chat', icon: 'forum' },
    { id: 'activities', label: 'Activities', icon: 'spa' },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <div className="fixed bottom-0 w-full z-50 pb-safe pointer-events-none">
      <div className="max-w-md mx-auto px-4 pb-3">
        <nav
          className="pointer-events-auto rounded-full bg-[#FAF7F2]/95 backdrop-blur-xl shadow-[0_12px_32px_-4px_rgba(89,98,72,0.16),0_4px_12px_-2px_rgba(89,98,72,0.08)] px-2.5 py-1.5 flex items-center justify-between border border-[#D5CEBF]/80 gap-1"
          aria-label="Main Navigation"
        >
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-[#C47A5C] text-white shadow-sm scale-105'
                    : 'text-[#6E775C] hover:text-[#C47A5C] hover:bg-[#F2EDE2]/60 active:scale-95'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[21px] sm:text-[22px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
              </button>
            );
          })}

          {onOpenClinicalMonitor && (
            <>
              <div className="h-5 w-[1px] bg-[#D5CEBF]/80 mx-0.5 shrink-0" aria-hidden="true" />
              <button
                onClick={onOpenClinicalMonitor}
                aria-label="Clinical Distress Monitor & AI Diagnostics"
                title="Clinical Distress Monitor & AI Diagnostics"
                className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition-all duration-200 relative group ${
                  isClinicalMonitorOpen
                    ? 'bg-[#6E775C] text-white shadow-sm scale-105'
                    : 'text-[#6E775C] hover:text-[#2C2824] hover:bg-[#A7B59C]/20 active:scale-95'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[21px] sm:text-[22px]"
                  style={isClinicalMonitorOpen ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  health_and_safety
                </span>
                <span
                  className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-[#FAF7F2] ${
                    isClinicalMonitorOpen ? 'bg-white' : 'bg-[#6E775C]'
                  }`}
                  aria-hidden="true"
                />
              </button>
            </>
          )}
        </nav>
      </div>
    </div>
  );
};
