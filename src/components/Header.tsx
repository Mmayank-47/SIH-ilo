import React from 'react';
import { ASSETS } from '../constants/assets';
import { NavigationTab, CamouflageMode } from '../types';

interface HeaderProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  onTriggerCamouflage: (mode: CamouflageMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  onTriggerCamouflage,
}) => {
  if (currentTab === 'support') {
    return (
      <header className="fixed top-0 w-full z-50 pt-safe bg-[#FAF7F0]/95 backdrop-blur-xl border-b border-[#E3D8CC] shadow-xs">
        <div className="h-16 max-w-md mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className="w-10 h-10 flex items-center justify-center rounded-full text-[#1d1c15] hover:bg-[#F2EDE2] transition-all"
              aria-label="Go back gently"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <div className="h-8 w-8 flex items-center justify-center overflow-hidden rounded-full bg-[#E7B9B2]/30 text-[#C47A5C]">
              <span className="material-symbols-outlined text-[20px]">spa</span>
            </div>
            <h1 className="font-serif text-[19px] text-[#8a4b30] font-semibold ml-1">Support & Care</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTriggerCamouflage('weather')}
              className="h-9 px-3 flex items-center justify-center rounded-full bg-[#F2EDE2] text-[#8a4b30] hover:bg-[#E7B9B2]/40 transition-all text-[11px] font-semibold border border-[#D8C2BA]"
              aria-label="Quick Discreet Close"
            >
              <span className="material-symbols-outlined text-[17px] mr-1">visibility_off</span>
              Hide
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="w-8 h-8 rounded-full overflow-hidden border border-[#D8C2BA] ring-1 ring-[#D8C2BA]/60"
            >
              <img
                src={ASSETS.userHeaderProfile}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-[#F2EDE2]/90 backdrop-blur-xl border-b border-[#E3DCCF]/60">
      <div className="h-16 max-w-md mx-auto px-5 flex items-center justify-between">
        {/* Left: Brand logo & safety tag */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-xs border border-[#A7B59C]/40 p-0.5 shrink-0">
            <img
              src={ASSETS.iloCompanion}
              alt="ilo Logo"
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-[18px] text-[#C47A5C] font-semibold leading-tight tracking-tight">ilo</span>
            <span className="text-[11px] text-[#6E775C] font-medium leading-none">Safe & Protected</span>
          </div>
        </button>

        {/* Right action controls */}
        <div className="flex items-center gap-2">
          {currentTab === 'profile' ? (
            <button
              onClick={() => onTriggerCamouflage('weather')}
              className="h-9 px-3 rounded-full bg-[#FAF7F0] text-[#C47A5C] hover:bg-[#EAE2D5] border border-[#C47A5C]/20 flex items-center gap-1.5 transition-all text-[12px] font-medium shadow-xs active:scale-95"
              aria-label="Quick Camouflage"
            >
              <span className="material-symbols-outlined text-[16px]">wb_sunny</span>
              <span>Quick Camouflage</span>
            </button>
          ) : currentTab === 'activities' || currentTab === 'journal' ? (
            <button
              onClick={() => onTriggerCamouflage('pantry')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF7F0] text-[#6E775C] hover:text-[#2C2824] text-xs font-medium transition-all active:scale-95 border border-[#E3DCCF]"
              aria-label="Quick Conceal"
            >
              <span className="material-symbols-outlined text-[15px]">visibility_off</span>
              <span>Quick Conceal</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('support')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#FAF7F2] text-[#6E775C] hover:bg-[#A7B59C]/20 hover:text-[#2C2824] transition-all shadow-[0_2px_8px_rgba(110,119,92,0.1)] border border-[#D5CEBF]/70"
              aria-label="Support & Crisis Care"
              title="Support & Crisis Care"
            >
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('profile')}
            className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-[#A7B59C]/40 bg-white ring-1 ring-[#C47A5C]/20 shadow-xs active:scale-95 transition-transform"
            aria-label="View Sanctuary Profile"
          >
            <img
              src={ASSETS.userHeaderProfile}
              alt="Priya Profile"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
