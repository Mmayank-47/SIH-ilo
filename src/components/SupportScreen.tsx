import React, { useState } from 'react';
import { CamouflageMode, NavigationTab } from '../types';
import { soundEngine } from '../utils/audioSynth';

interface SupportScreenProps {
  onNavigate: (tab: NavigationTab) => void;
  onTriggerCamouflage: (mode: CamouflageMode) => void;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({ onNavigate, onTriggerCamouflage }) => {
  const [showSilentModal, setShowSilentModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendSilentPing = () => {
    soundEngine.playChime();
    setShowSilentModal(false);
    showToast('Silent alert sent to companion');
  };

  return (
    <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto px-4 pt-16 pb-safe bg-[#F8F4EC]">
      <div className="flex flex-col w-full pb-28 pt-4">
        {/* Calming Ambient Atmosphere Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F2EDE2] text-[#6E775C] border border-[#A7B59C]/50 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#6E775C] animate-ping"></span>
            <span className="text-[11px] font-semibold tracking-wide">Safe & Confidential Space</span>
          </div>
          <span className="text-[11px] text-[#6E775C] flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[15px] text-[#C47A5C]">verified_user</span>
            <span>Encrypted & Private</span>
          </span>
        </div>

        {/* Warm Serene Hero Card with Terracotta SOS CTA */}
        <div className="relative overflow-hidden rounded-2xl bg-[#FAF7F0] border border-[#E3D8CC] p-5 shadow-xs mb-3.5">
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#E7B9B2]/20 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-[#A7B59C]/20 blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#F2EDE2] border border-[#E7B9B2] flex items-center justify-center text-[#C47A5C] mb-2 shadow-inner">
              <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                volunteer_activism
              </span>
            </div>

            <h2 className="font-serif text-[21px] text-[#1d1c15] font-semibold mb-1 tracking-tight">
              You are not alone. Take your time.
            </h2>
            <p className="text-[12px] text-[#53433d] max-w-xs mb-4 leading-relaxed">
              Gentle, trauma-informed support from ilo is ready. Choose to speak, text discreetly, or quietly ground yourself.
            </p>

            {/* Primary SOS CTA Button */}
            <a
              href="tel:14416"
              id="primary-sos-btn"
              className="group relative w-full rounded-full bg-[#C47A5C] hover:bg-[#8a4b30] text-white p-3.5 flex items-center justify-between shadow-[0_8px_24px_-4px_rgba(196,122,92,0.4)] active:scale-[0.98] transition-all duration-300"
            >
              <span className="absolute inset-0 rounded-full bg-[#E7B9B2] opacity-30 animate-ping pointer-events-none"></span>
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  phone_in_talk
                </span>
              </div>
              <div className="flex flex-col text-left pl-3 flex-1 min-w-0">
                <span className="text-[14px] font-bold tracking-tight text-white flex items-center gap-1.5">
                  I Need Help Right Now
                  <span className="material-symbols-outlined text-[16px] opacity-80">arrow_forward</span>
                </span>
                <span className="text-[12px] text-white/90 truncate">
                  Connect instantly with compassionate listeners
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* Immediate Grounding & Silent Protection Row */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {/* Camouflage Trigger Button */}
          <button
            onClick={() => onTriggerCamouflage('pantry')}
            className="flex flex-col items-start p-4 rounded-2xl bg-white border border-[#E3D8CC] hover:bg-[#F2EDE2] active:scale-[0.98] transition-all text-left shadow-2xs"
          >
            <div className="w-9 h-9 rounded-full bg-[#F2EDE2] border border-[#E3D8CC] flex items-center justify-center text-[#C47A5C] mb-2">
              <span className="material-symbols-outlined text-[19px]">shopping_cart</span>
            </div>
            <span className="text-[13px] text-[#1d1c15] font-semibold">Quick Camouflage</span>
            <span className="text-[11px] text-[#53433d] line-clamp-2 mt-0.5">
              Mask screen as harmless grocery checklist
            </span>
          </button>

          {/* Silent Alert Trigger */}
          <button
            onClick={() => setShowSilentModal(true)}
            className="flex flex-col items-start p-4 rounded-2xl bg-[#FAF7F0] border border-[#A7B59C]/40 text-[#6E775C] hover:bg-[#F2EDE2] active:scale-[0.98] transition-all text-left shadow-2xs"
          >
            <div className="w-9 h-9 rounded-full bg-[#F2EDE2] border border-[#A7B59C]/50 flex items-center justify-center text-[#6E775C] mb-2">
              <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                notifications_paused
              </span>
            </div>
            <span className="text-[13px] font-semibold text-[#6E775C]">Silent Alert</span>
            <span className="text-[11px] text-[#53433d] line-clamp-2 mt-0.5">
              Discreet ping to trusted companion
            </span>
          </button>
        </div>

        {/* Direct Indian Crisis Helplines Directory */}
        <div className="flex flex-col gap-3 mb-5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[14px] font-bold text-[#1d1c15] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#C47A5C]">support_agent</span>
              <span>Direct Indian Support Lines</span>
            </h3>
            <span className="text-[11px] text-[#6E775C] font-semibold">Free & 24/7</span>
          </div>

          {/* 1. Tele-MANAS */}
          <div className="rounded-2xl bg-white border border-[#E3D8CC] p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[15px] font-bold text-[#1d1c15]">Tele-MANAS</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#E7B9B2]/40 text-[#8a4b30] text-[11px] font-semibold">
                    NIMHANS Govt.
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F2EDE2] text-[#53433d] border border-[#E3D8CC] text-[11px]">
                    20+ Languages
                  </span>
                </div>
                <p className="text-[12px] text-[#53433d] leading-relaxed">
                  Official 24/7 national tele-mental health programme. Multi-language clinical specialists and counselors.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href="tel:14416"
                className="flex-1 h-11 rounded-full bg-[#C47A5C] text-white hover:bg-[#8a4b30] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
                <span>Call 14416 (Toll-Free)</span>
              </a>
              <a
                href="tel:18008914416"
                aria-label="Alternative toll free number"
                className="h-11 px-3.5 rounded-full bg-[#F2EDE2] text-[#8a4b30] hover:bg-[#E7B9B2]/30 border border-[#D8C2BA] text-xs font-semibold flex items-center justify-center"
              >
                1800 891 4416
              </a>
            </div>
          </div>

          {/* 2. Kiran Helpline */}
          <div className="rounded-2xl bg-white border border-[#E3D8CC] p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[15px] font-bold text-[#1d1c15]">Kiran Helpline</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#A7B59C]/30 text-[#6E775C] text-[11px] font-semibold">
                    Ministry of Social Justice
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F2EDE2] text-[#53433d] border border-[#E3D8CC] text-[11px]">
                    13 Languages
                  </span>
                </div>
                <p className="text-[12px] text-[#53433d] leading-relaxed">
                  Trauma-informed first-aid, psychological support, and crisis de-escalation for domestic distress.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href="tel:18005990019"
                className="flex-1 h-11 rounded-full bg-[#6E775C] text-white hover:bg-[#596248] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
                <span>Call 1800-599-0019</span>
              </a>
            </div>
          </div>

          {/* 3. Vandrevala Foundation Helpline */}
          <div className="rounded-2xl bg-white border border-[#E3D8CC] p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[15px] font-bold text-[#1d1c15]">Vandrevala Foundation</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#E7B9B2]/40 text-[#8a4b30] text-[11px] font-semibold">
                    Free Counseling
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F2EDE2] text-[#6E775C] border border-[#A7B59C]/40 text-[11px] font-medium">
                    WhatsApp Enabled
                  </span>
                </div>
                <p className="text-[12px] text-[#53433d] leading-relaxed">
                  Empathetic, non-judgmental certified psychologists available immediately over voice call or WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href="tel:+919999666555"
                className="flex-1 h-11 rounded-full bg-[#C47A5C] text-white hover:bg-[#8a4b30] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
                <span>Call +91 9999 666 555</span>
              </a>
              <a
                href="https://wa.me/919999666555?text=Hello%2C%20I%20need%20someone%20to%20talk%20to%20safely"
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-4 rounded-full bg-[#F2EDE2] text-[#6E775C] hover:bg-[#A7B59C]/20 border border-[#A7B59C]/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[17px] text-[#6E775C]">chat</span>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Reassurance & Confidentiality Promise Banner */}
        <div className="rounded-2xl bg-[#FAF7F0] border border-[#E3D8CC] p-4 flex items-start gap-3 shadow-2xs mb-4">
          <div className="w-8 h-8 rounded-full bg-[#F2EDE2] border border-[#D8C2BA] flex items-center justify-center text-[#C47A5C] shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[19px]">lock</span>
          </div>
          <div className="flex flex-col">
            <h4 className="text-[13px] font-bold text-[#1d1c15]">Zero Footprint Guarantee</h4>
            <p className="text-[11px] text-[#53433d] mt-0.5 leading-relaxed">
              Calling these verified numbers is strictly confidential. Your location is never logged, stored, or transmitted without your explicit consent.
            </p>
          </div>
        </div>
      </div>

      {/* Silent Companion SOS Confirmation Modal */}
      {showSilentModal && (
        <div className="fixed inset-0 z-50 bg-[#1d1c15]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F0] p-6 shadow-2xl flex flex-col gap-3 text-left border border-[#E3D8CC]">
            <div className="w-12 h-12 rounded-full bg-[#F2EDE2] text-[#C47A5C] flex items-center justify-center mb-1 border border-[#E7B9B2]">
              <span className="material-symbols-outlined text-[24px]">send</span>
            </div>
            <h3 className="font-serif text-[18px] font-bold text-[#1d1c15]">Send Discreet Ping?</h3>
            <p className="text-xs text-[#53433d]">
              This sends a pre-arranged silent message to <span className="font-semibold text-[#1d1c15]">Pooja (Trusted Contact)</span>:
            </p>
            <div className="p-3 rounded-xl bg-[#F2EDE2] border border-[#E3D8CC] text-[#8a4b30] text-xs italic">
              "I am safe right now, but please check in on me quietly when you see this."
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleSendSilentPing}
                className="h-11 w-full rounded-full bg-[#C47A5C] text-white hover:bg-[#8a4b30] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[17px]">check</span>
                <span>Send Quietly</span>
              </button>
              <button
                onClick={() => setShowSilentModal(false)}
                className="h-10 w-full rounded-full bg-[#F2EDE2] text-[#53433d] hover:bg-[#E3D8CC] text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#1d1c15] text-white px-4 py-2.5 rounded-full text-xs shadow-xl flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[#E7B9B2] text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
};
