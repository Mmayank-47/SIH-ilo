import React, { useState } from 'react';
import { ASSETS } from '../constants/assets';
import { CamouflageMode } from '../types';
import { speakDialectSample, soundEngine } from '../utils/audioSynth';

interface ProfileScreenProps {
  onTriggerCamouflage: (mode: CamouflageMode) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onTriggerCamouflage }) => {
  const [selectedLang, setSelectedLang] = useState('en');
  const [vaultMode, setVaultMode] = useState(true);
  const [appDisguise, setAppDisguise] = useState<'calc' | 'notes'>('calc');
  const [shakeEnabled, setShakeEnabled] = useState(true);
  const [pingSent, setPingSent] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [facialConsent, setFacialConsent] = useState(() => {
    try {
      return localStorage.getItem('ilo_facial_wellbeing_consent_v1') === 'true';
    } catch {
      return false;
    }
  });

  const languages = [
    { code: 'en', native: 'English', sub: 'Primary Interface', sample: 'You are safe and held here in your sanctuary.' },
    { code: 'hi', native: 'हिंदी', sub: 'Hindi', sample: 'आप यहाँ पूरी तरह सुरक्षित हैं। गहरी सांस लें।' },
    { code: 'bn', native: 'বাংলা', sub: 'Bengali', sample: 'আপনি এখানে সম্পূর্ণ নিরাপদ। নিজের যত্ন নিন।' },
    { code: 'ta', native: 'தமிழ்', sub: 'Tamil', sample: 'நீங்கள் இங்கு பாதுகாப்பாக உள்ளீர்கள்.' },
    { code: 'te', native: 'తెలుగు', sub: 'Telugu', sample: 'మీరు ఇక్కడ సురక్షితంగా ఉన్నారు.' },
    { code: 'mr', native: 'मराठी', sub: 'Marathi', sample: 'तुम्ही येथे पूर्णपणे सुरक्षित आहात.' },
  ];

  const handleSendPing = () => {
    soundEngine.playChime();
    setPingSent(true);
    setTimeout(() => setPingSent(false), 3000);
  };

  const handleClearData = () => {
    try {
      localStorage.clear();
      soundEngine.playChime();
      setShowClearConfirm(false);
      alert('Local session data has been completely and discreetly wiped.');
    } catch {}
  };

  return (
    <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto px-4 pt-20 pb-28 bg-[#F8F4EC]">
      <div className="flex flex-col w-full gap-4 pb-6">
        {/* Discreet Emergency Disguise Banner */}
        <aside
          aria-label="Discreet safety tool"
          className="w-full bg-white rounded-2xl p-3.5 flex items-center justify-between border border-[#C47A5C]/20 shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F2EDE2] border border-[#C47A5C]/20 flex items-center justify-center text-[#C47A5C]">
              <span className="material-symbols-outlined text-[20px]">visibility_off</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-[#2C2824]">Discreet Quick-Exit</span>
              <span className="text-[11px] text-[#7A7067]">Press anytime to camouflage screen</span>
            </div>
          </div>
          <button
            onClick={() => onTriggerCamouflage('weather')}
            className="h-10 px-3.5 rounded-full bg-[#F2EDE2] text-[#C47A5C] hover:bg-[#C47A5C] hover:text-white text-[12px] font-semibold flex items-center gap-1.5 border border-[#C47A5C]/30 shadow-2xs active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">wb_sunny</span>
            <span>Daily Weather</span>
          </button>
        </aside>

        {/* Profile Identity & Sanctuary Status */}
        <section className="w-full bg-white rounded-3xl p-6 shadow-xs border border-[#C47A5C]/15 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#E7B9B2]/25 blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[#A7B59C]/25 blur-2xl pointer-events-none"></div>

          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#C47A5C]/40 via-[#E7B9B2]/50 to-[#F2EDE2] flex items-center justify-center shadow-sm">
              <img
                src={ASSETS.priyaProfile}
                alt="Priya portrait"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#C47A5C] text-white flex items-center justify-center shadow-sm border-2 border-white"
              title="Protected and Encrypted"
            >
              <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock
              </span>
            </div>
          </div>

          <h1 className="font-serif text-[24px] text-[#2C2824] font-medium">
            Priya <span className="font-sans text-[14px] text-[#C47A5C] block sm:inline font-normal">(You are safe)</span>
          </h1>

          <div className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F2EDE2] border border-[#C47A5C]/20 text-[#6E775C] text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#A7B59C] animate-pulse"></span>
            <span>Protected Session • Vault Locked to Device</span>
          </div>

          <p className="mt-3 text-[13px] text-[#7A7067] max-w-xs leading-relaxed">
            Everything here belongs solely to you. No tracking, no external logs, no judgment. Take your time.
          </p>
        </section>

        {/* Language & Accessibility Section */}
        <section className="w-full bg-[#F2EDE2] rounded-3xl p-5 flex flex-col gap-3.5 border border-[#C47A5C]/15">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#C47A5C] text-[22px]">translate</span>
              <h2 className="font-serif text-[19px] text-[#C47A5C] font-semibold">Language & Voice</h2>
            </div>
            <span className="text-[11px] text-[#6E775C] bg-white border border-[#C47A5C]/20 px-2.5 py-0.5 rounded-full font-semibold">
              6 Dialects
            </span>
          </div>

          <p className="text-[12px] text-[#7A7067]">
            Choose your comforting tongue. Tap the speaker to hear a peaceful reading if you prefer listening.
          </p>

          <div className="grid grid-cols-1 gap-2 mt-1" role="radiogroup">
            {languages.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <div
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang.code);
                    soundEngine.playChime();
                  }}
                  className={`w-full rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white ring-1 ring-[#C47A5C] shadow-xs border border-[#C47A5C]/30'
                      : 'bg-white/80 hover:bg-white border border-[#C47A5C]/15'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? 'bg-[#C47A5C] text-white shadow-2xs' : 'bg-[#F2EDE2]'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[15px] ${isSelected ? 'text-white' : 'text-transparent'}`}>
                        check
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-semibold text-[#2C2824]">{lang.native}</span>
                      <span className={`text-[11px] ${isSelected ? 'text-[#C47A5C] font-medium' : 'text-[#7A7067]'}`}>
                        {lang.sub}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakDialectSample(lang.code, lang.sample);
                    }}
                    className="w-9 h-9 rounded-full bg-[#F8F4EC] flex items-center justify-center text-[#6E775C] hover:bg-[#C47A5C] hover:text-white transition-colors"
                    aria-label={`Listen to ${lang.native} voice sample`}
                  >
                    <span className="material-symbols-outlined text-[18px]">volume_up</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Privacy & Data Sovereignty Section */}
        <section className="w-full bg-white rounded-3xl p-5 flex flex-col gap-4 shadow-xs border border-[#C47A5C]/15">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#C47A5C] text-[24px]">shield_lock</span>
              <h2 className="font-serif text-[19px] text-[#C47A5C] font-semibold">Privacy & Data Sovereignty</h2>
            </div>
            <p className="text-[12px] text-[#7A7067]">
              Your safety is sovereign. Nothing leaves this device without your conscious consent.
            </p>
          </div>

          {/* Zero-Knowledge Verification card */}
          <div className="w-full rounded-2xl bg-[#A7B59C]/15 border border-[#6E775C]/25 p-3.5 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#6E775C] text-[22px] mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified_user
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] text-[#363B2C] font-semibold">Zero-Knowledge Verification</span>
              <span className="text-[11px] text-[#555C45] leading-relaxed">
                No telemetry, no central database, and no logs accessible to employers, family, or government authorities. Data is encrypted using AES-256 on local flash storage.
              </span>
            </div>
          </div>

          {/* Local-Only Vault Mode toggle */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#F2EDE2] border border-[#C47A5C]/20 flex items-center justify-center text-[#C47A5C] shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">lock_reset</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-semibold text-[#2C2824]">Local-Only Vault Mode</span>
                <span className="text-[11px] text-[#7A7067]">
                  All reflections, notes, and legal timelines reside exclusively on this physical phone.
                </span>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={vaultMode}
              onClick={() => {
                setVaultMode(!vaultMode);
                soundEngine.playChime();
              }}
              className={`w-12 h-7 rounded-full transition-colors p-0.5 flex items-center shrink-0 focus:outline-none ${
                vaultMode ? 'bg-[#C47A5C] justify-end' : 'bg-[#DCD9DB] justify-start'
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-white shadow-xs transition-transform"></span>
            </button>
          </div>

          {/* Facial Wellbeing Signals (Periodic 20-30s capture toggle) */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#F2EDE2] border border-[#C47A5C]/20 flex items-center justify-center text-[#C47A5C] shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">videocam</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-semibold text-[#2C2824]">Facial Wellbeing Analysis</span>
                <span className="text-[11px] text-[#7A7067]">
                  Analyze periodic still frames (every 20–30s) during conversations. Zero raw photos stored.
                </span>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={facialConsent}
              onClick={() => {
                const newVal = !facialConsent;
                setFacialConsent(newVal);
                try {
                  localStorage.setItem('ilo_facial_wellbeing_consent_v1', newVal ? 'true' : 'false');
                } catch {}
                soundEngine.playChime();
              }}
              className={`w-12 h-7 rounded-full transition-colors p-0.5 flex items-center shrink-0 focus:outline-none ${
                facialConsent ? 'bg-[#C47A5C] justify-end' : 'bg-[#DCD9DB] justify-start'
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-white shadow-xs transition-transform"></span>
            </button>
          </div>

          {/* Discreet App Disguise switcher */}
          <div className="flex flex-col gap-2.5 pt-1">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F2EDE2] border border-[#C47A5C]/20 flex items-center justify-center text-[#C47A5C] shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">masks</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-[#2C2824]">Discreet App Disguise</span>
                <span className="text-[11px] text-[#7A7067]">
                  Mask the icon on your phone home screen to look like an everyday utility.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pl-12">
              <button
                type="button"
                onClick={() => setAppDisguise('calc')}
                className={`p-3 rounded-2xl text-left flex flex-col gap-1.5 transition-all shadow-2xs ${
                  appDisguise === 'calc'
                    ? 'bg-[#F2EDE2] ring-1 ring-[#C47A5C] border border-[#C47A5C]/30'
                    : 'bg-[#F8F4EC] hover:bg-[#F2EDE2] border border-[#C47A5C]/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#C47A5C]/20 flex items-center justify-center text-[#C47A5C]">
                    <span className="material-symbols-outlined text-[18px]">calculate</span>
                  </div>
                  <span className="material-symbols-outlined text-[#C47A5C] text-[18px]">
                    {appDisguise === 'calc' ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </div>
                <span className="text-[13px] text-[#2C2824] font-semibold">Calc Simple</span>
                <span className="text-[10px] text-[#7A7067]">Appears as basic calculator</span>
              </button>

              <button
                type="button"
                onClick={() => setAppDisguise('notes')}
                className={`p-3 rounded-2xl text-left flex flex-col gap-1.5 transition-all shadow-2xs ${
                  appDisguise === 'notes'
                    ? 'bg-[#F2EDE2] ring-1 ring-[#C47A5C] border border-[#C47A5C]/30'
                    : 'bg-[#F8F4EC] hover:bg-[#F2EDE2] border border-[#C47A5C]/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#7A7067]">
                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-[#C47A5C]">
                    {appDisguise === 'notes' ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </div>
                <span className="text-[13px] text-[#2C2824] font-semibold">Quick Recipes</span>
                <span className="text-[10px] text-[#7A7067]">Appears as shopping notes</span>
              </button>
            </div>
          </div>

          {/* Shake to Quick Camouflage toggle */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#F2EDE2] border border-[#C47A5C]/20 flex items-center justify-center text-[#C47A5C] shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">vibration</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-semibold text-[#2C2824]">Shake to Quick Camouflage</span>
                <span className="text-[11px] text-[#7A7067]">
                  Gently shake your device to instantly swap the screen to a benign utility page.
                </span>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={shakeEnabled}
              onClick={() => {
                setShakeEnabled(!shakeEnabled);
                soundEngine.playChime();
              }}
              className={`w-12 h-7 rounded-full transition-colors p-0.5 flex items-center shrink-0 focus:outline-none ${
                shakeEnabled ? 'bg-[#C47A5C] justify-end' : 'bg-[#DCD9DB] justify-start'
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-white shadow-xs transition-transform"></span>
            </button>
          </div>
        </section>

        {/* Guardian & Designated Safe Ally Mode */}
        <section className="w-full bg-[#F2EDE2] rounded-3xl p-5 flex flex-col gap-3.5 border border-[#C47A5C]/15">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#C47A5C] text-[22px]">favorite</span>
              <h2 className="font-serif text-[19px] text-[#C47A5C] font-semibold">Designated Safe Ally</h2>
            </div>
            <span className="text-[11px] text-[#6E775C] bg-white border border-[#C47A5C]/20 px-2.5 py-0.5 rounded-full font-semibold">
              Opt-in Only
            </span>
          </div>

          <p className="text-[12px] text-[#7A7067]">
            A gentle check-in feature. Your ally receives a calm notification <span className="italic font-semibold text-[#C47A5C]">only</span> if you choose to request it, never automatically.
          </p>

          <div className="w-full bg-white rounded-2xl p-4 flex flex-col gap-3 shadow-2xs border border-[#C47A5C]/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-[#C47A5C]/30">
                  <img
                    src={ASSETS.ananyaAlly}
                    alt="Ananya Sen portrait"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[15px] font-semibold text-[#2C2824]">Ananya Sen</span>
                  <span className="text-[11px] text-[#7A7067]">+91 98302 ••••• (Kolkata)</span>
                </div>
              </div>
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-[#F2EDE2] flex items-center justify-center text-[#C47A5C] hover:bg-[#C47A5C] hover:text-white transition-colors"
                title="Edit ally"
              >
                <span className="material-symbols-outlined text-[17px]">edit</span>
              </button>
            </div>

            <div className="px-3 py-2 rounded-xl bg-[#F8F4EC] flex items-center justify-between border border-[#C47A5C]/15">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6E775C] text-[17px]">spa</span>
                <span className="text-[12px] text-[#2C2824] font-medium">Ally Check-In Mode</span>
              </div>
              <span className="text-[11px] text-[#6E775C] font-semibold">Active & Ready</span>
            </div>

            <button
              type="button"
              onClick={handleSendPing}
              className={`w-full h-12 rounded-full font-semibold text-[13px] flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] ${
                pingSent
                  ? 'bg-[#A7B59C] text-[#1D2B1B]'
                  : 'bg-[#C47A5C] text-white hover:bg-[#B3694D]'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">
                {pingSent ? 'done' : 'send'}
              </span>
              <span>
                {pingSent ? 'Silent Ping Sent to Ananya' : 'Send Silent "Thinking of You" Ping'}
              </span>
            </button>
          </div>

          {/* NCW Women Helpline India card */}
          <div className="w-full p-3.5 rounded-2xl bg-white border border-[#C47A5C]/15 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#F2EDE2] text-[#6E775C] flex items-center justify-center border border-[#C47A5C]/20">
                <span className="material-symbols-outlined text-[18px]">support_agent</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-[#2C2824]">NCW Women Helpline (India)</span>
                <span className="text-[11px] text-[#7A7067]">Dial 7827170170 • 24/7 Support</span>
              </div>
            </div>
            <a
              href="tel:7827170170"
              aria-label="Call National Commission for Women India"
              className="w-9 h-9 rounded-full bg-[#6E775C] text-white hover:bg-[#5C644C] flex items-center justify-center transition-all shadow-2xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">call</span>
            </a>
          </div>
        </section>

        {/* Clear History / Data Wipe Trigger */}
        <section className="w-full p-3 flex flex-col items-center text-center gap-1.5">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-[13px] text-[#C47A5C] hover:text-[#9A563D] underline decoration-dotted transition-colors flex items-center gap-1.5 font-medium"
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">delete_sweep</span>
            <span>Instantly Clear Local Session Data</span>
          </button>
          <span className="text-[11px] text-[#7A7067]">
            Leaves zero residual footprint in your browser storage.
          </span>
        </section>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-[#1d1c15]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F0] p-6 shadow-2xl border border-[#E3D8CC] flex flex-col gap-4 text-left">
            <div className="flex items-center gap-2 text-red-700">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <h3 className="font-serif text-[18px] font-bold text-[#1d1c15]">Wipe Local Data?</h3>
            </div>
            <p className="text-xs text-[#53433d] leading-relaxed">
              This will immediately delete all local reflections and chat sessions on this device for your total discretion.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleClearData}
                className="flex-1 py-2 rounded-full bg-red-700 text-white text-xs font-semibold hover:bg-red-800"
              >
                Confirm Wipe
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 rounded-full bg-[#F2EDE2] text-[#53433d] text-xs font-semibold"
              >
                Keep Safe
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
