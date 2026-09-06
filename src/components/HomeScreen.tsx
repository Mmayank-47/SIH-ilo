import React, { useState, useEffect } from 'react';
import { ASSETS } from '../constants/assets';
import { HeartFeeling, NavigationTab } from '../types';
import { soundEngine } from '../utils/audioSynth';
import { ReactiveMascot } from './ReactiveMascot';

interface HomeScreenProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenComfort: (type: 'sounds' | 'story' | 'checklist') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, onOpenComfort }) => {
  const [selectedFeeling, setSelectedFeeling] = useState<HeartFeeling | null>('Tender & Softly Heavy');
  const [isBreathing, setIsBreathing] = useState(true);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Exhale');
  const [breathSubtitle, setBreathSubtitle] = useState('Slowly softening shoulders... letting tension dissolve.');

  // Heart feelings list matching Image 1
  const feelings: {
    title: HeartFeeling;
    sub: string;
    icon: string;
    color: string;
    affirmation: string;
  }[] = [
    {
      title: 'Calm & Peaceful',
      sub: 'Restful',
      icon: 'spa',
      color: '#A7B59C',
      affirmation: 'Bask in this stillness. Your body is resting and recharging.',
    },
    {
      title: 'Tender & Softly Heavy',
      sub: 'Holding space',
      icon: 'water_drop',
      color: '#E7B9B2',
      affirmation: 'It is okay to be tender today. ilo is holding space without questions.',
    },
    {
      title: 'Anxious & Restless',
      sub: 'Slow down',
      icon: 'air',
      color: '#B7C6D6',
      affirmation: 'You are safe right now. Let your shoulders drop half an inch.',
    },
    {
      title: 'Full & Overwhelmed',
      sub: 'Gently release',
      icon: 'cloud',
      color: '#C47A5C',
      affirmation: 'You do not have to carry everything right now. Let one breath go.',
    },
    {
      title: 'Grounded & Rooted',
      sub: 'Anchored',
      icon: 'filter_vintage',
      color: '#6E775C',
      affirmation: 'Feel the earth beneath you. You are centered, strong, and whole.',
    },
  ];

  // Paced breathing interval cycle
  useEffect(() => {
    if (!isBreathing) return;

    const phases: { phase: 'Inhale' | 'Hold' | 'Exhale' | 'Rest'; text: string; dur: number }[] = [
      { phase: 'Inhale', text: 'Drawing in calm, cool restorative air...', dur: 4000 },
      { phase: 'Hold', text: 'Resting gently in the quiet space within...', dur: 4000 },
      { phase: 'Exhale', text: 'Slowly softening shoulders... letting tension dissolve.', dur: 4000 },
      { phase: 'Rest', text: 'Stillness and safety surround you completely.', dur: 4000 },
    ];

    let currentIdx = 2; // Start with Exhale like in Image 1
    const interval = setInterval(() => {
      currentIdx = (currentIdx + 1) % phases.length;
      setBreathPhase(phases[currentIdx].phase);
      setBreathSubtitle(phases[currentIdx].text);
    }, 4000);

    return () => clearInterval(interval);
  }, [isBreathing]);

  return (
    <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto px-5 pt-20 pb-28 bg-[#F2EDE2]">
      <div className="flex flex-col w-full gap-5">
        {/* Reactive AI Mascot Hero Section (Virtual Pet Attuned Presence) */}
        <section className="relative flex flex-col items-center text-center pt-1 pb-4 overflow-hidden">
          <ReactiveMascot
            distressLevel={30}
            onOpenGrounding={(technique) => {
              onOpenComfort('sounds');
            }}
          />

          <div className="max-w-xs space-y-1 z-10 mt-3">
            <h1 className="font-serif text-[24px] text-[#C47A5C] font-bold tracking-tight">
              Namaste, friend.
            </h1>
            <p className="text-[13px] text-[#595048] font-medium leading-relaxed">
              Take your time. You are safe and held here with ilo.
            </p>
          </div>

          {/* Gentle Rhythm Pill */}
          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D8C2BA]/40 shadow-xs">
            <span className="material-symbols-outlined text-[17px] text-[#6E775C]">spa</span>
            <span className="text-[12px] text-[#595048] font-medium">Gentle Rhythm • Rooted in Peace</span>
          </div>
        </section>

        {/* Gentle Presence Streak Card */}
        <section className="w-full mb-1">
          <div className="bg-white rounded-2xl p-5 shadow-[0_8px_24px_rgba(110,119,92,0.06)] border border-[#D8C2BA]/40 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C47A5C]"></span>
                <span className="text-[15px] text-[#23201B] font-semibold">Gentle Presence</span>
              </div>
              <span className="text-[12px] text-[#C47A5C] font-bold">4 days of peace</span>
            </div>

            <p className="text-[13px] text-[#595048] mb-4 leading-relaxed">
              Every breath you take in stillness is a soft seed planted. No scores, just gentle steps.
            </p>

            <div className="flex items-center justify-between bg-[#F8F3E8] rounded-full px-4 py-2.5 border border-[#D8C2BA]/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6E775C] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_florist</span>
                <span className="material-symbols-outlined text-[#6E775C] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_florist</span>
                <span className="material-symbols-outlined text-[#A7B59C] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_florist</span>
                <span className="material-symbols-outlined text-[#E7B9B2] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_florist</span>
                <span className="material-symbols-outlined text-[#D8C2BA] text-[18px]">nature</span>
              </div>
              <span className="text-[12px] text-[#595048] font-medium">Olive & sage leaves sprouting</span>
            </div>
          </div>
        </section>

        {/* How is your heart feeling right now? Interactive Check-in */}
        <section className="w-full rounded-3xl bg-white p-5 border border-[#D5CEBF]/70 shadow-xs flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-[20px] font-bold text-[#C47A5C] leading-snug">
              How is your heart feeling right now?
            </h2>
            <p className="text-[13px] text-[#56524D] leading-relaxed">
              Honoring whatever is here. There is no right or wrong feeling.
            </p>
          </div>

          {/* 5 Heart Feeling Pills */}
          <div className="flex flex-col gap-2.5 mt-1">
            {feelings.map((item) => {
              const isSelected = selectedFeeling === item.title;
              return (
                <button
                  key={item.title}
                  onClick={() => {
                    setSelectedFeeling(item.title);
                    soundEngine.playChime();
                  }}
                  className={`w-full p-3 rounded-full flex items-center justify-between transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#FAF7F2] ring-2 ring-[#C47A5C] shadow-xs border border-[#C47A5C]/40 scale-[1.01]'
                      : 'bg-[#F8F4EC]/90 hover:bg-[#F2EDE2] border border-[#D5CEBF]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${item.color}25`, color: item.color }}
                    >
                      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    </div>
                    <span className="text-[14px] font-semibold text-[#2C2824] text-left">
                      {item.title}
                    </span>
                  </div>
                  <span
                    className={`text-[12px] font-medium ${
                      isSelected ? 'text-[#C47A5C] font-semibold' : 'text-[#7A7067]'
                    }`}
                  >
                    {item.sub}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Heart Affirmation Message */}
          {selectedFeeling && (
            <div className="p-3 rounded-2xl bg-[#F2EDE2]/70 border border-[#D5CEBF]/60 text-xs text-[#56524D] flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-[17px] text-[#C47A5C]">volunteer_activism</span>
              <span>
                {feelings.find((f) => f.title === selectedFeeling)?.affirmation}
              </span>
            </div>
          )}
        </section>

        {/* Breathe with ilo (PACED BREATHING) Interactive Card */}
        <section className="w-full rounded-3xl bg-white p-6 border border-[#D5CEBF]/70 shadow-xs flex flex-col items-center text-center gap-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-[#6E775C] uppercase">
            <span className="material-symbols-outlined text-[16px]">air</span>
            <span>Paced Breathing</span>
          </div>

          <h2 className="font-serif text-[24px] font-bold text-[#C47A5C]">
            Breathe with ilo
          </h2>

          {/* Concentric Breathing Circles */}
          <div className="relative w-36 h-36 flex items-center justify-center my-2">
            {/* Outer sage aura */}
            <div
              className={`absolute inset-0 rounded-full bg-[#A7B59C]/30 transition-all duration-1000 ${
                breathPhase === 'Inhale' || breathPhase === 'Hold' ? 'scale-110 opacity-80' : 'scale-90 opacity-40'
              }`}
            ></div>

            {/* Inner Terracotta Orb */}
            <div
              className={`w-24 h-24 rounded-full bg-[#C47A5C] text-white flex items-center justify-center font-serif text-[17px] font-semibold shadow-md transition-transform duration-1000 ${
                breathPhase === 'Inhale'
                  ? 'scale-115'
                  : breathPhase === 'Hold'
                  ? 'scale-115 animate-pulse'
                  : breathPhase === 'Exhale'
                  ? 'scale-95'
                  : 'scale-100'
              }`}
            >
              {breathPhase}
            </div>
          </div>

          <p className="text-[13px] text-[#56524D] max-w-xs leading-relaxed min-h-[36px]">
            {breathSubtitle}
          </p>

          <button
            onClick={() => setIsBreathing(!isBreathing)}
            className="px-5 py-2 rounded-full bg-white border border-[#D5CEBF] text-[#2C2824] hover:bg-[#F2EDE2] text-[12px] font-semibold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px] text-[#C47A5C]">
              {isBreathing ? 'pause_circle' : 'play_circle'}
            </span>
            <span>{isBreathing ? 'Pause Rhythm' : 'Sync Rhythm'}</span>
          </button>
        </section>

        {/* Gentle Comforts Section */}
        <section className="flex flex-col gap-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-serif text-[18px] font-bold text-[#C47A5C]">Gentle Comforts</h2>
            <span className="text-[12px] text-[#6E775C] font-medium">Whenever you wish</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Item 1: Grounding Sounds */}
            <button
              onClick={() => onOpenComfort('sounds')}
              className="w-full p-4 rounded-2xl bg-white border border-[#D5CEBF]/70 shadow-xs flex items-center justify-between hover:border-[#C47A5C]/40 text-left transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[#EAE4D7] flex items-center justify-center text-[#2C2824] shrink-0">
                  <span className="material-symbols-outlined text-[22px]">graphic_eq</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-serif text-[15px] font-bold text-[#2C2824]">
                    Listen to grounding sounds
                  </span>
                  <span className="text-[12px] text-[#56524D] truncate">
                    Earthy rustling leaves & Tibetan singing bowl...
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#F2EDE2] flex items-center justify-center text-[#7A7067] shrink-0">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </div>
            </button>

            {/* Item 2: Quiet Moment with ilo */}
            <button
              onClick={() => onOpenComfort('story')}
              className="w-full p-4 rounded-2xl bg-white border border-[#D5CEBF]/70 shadow-xs flex items-center justify-between hover:border-[#C47A5C]/40 text-left transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[#A7B59C]/25 flex items-center justify-center text-[#6E775C] shrink-0">
                  <span className="material-symbols-outlined text-[22px]">menu_book</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-serif text-[15px] font-bold text-[#2C2824]">
                    A quiet moment with ilo
                  </span>
                  <span className="text-[12px] text-[#56524D] truncate">
                    A warm story to quieten buzzing thoughts...
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#F2EDE2] flex items-center justify-center text-[#7A7067] shrink-0">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </div>
            </button>

            {/* Item 3: Safe Anchor Checklist */}
            <button
              onClick={() => onOpenComfort('checklist')}
              className="w-full p-4 rounded-2xl bg-white border border-[#D5CEBF]/70 shadow-xs flex items-center justify-between hover:border-[#C47A5C]/40 text-left transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[#E7B9B2]/35 flex items-center justify-center text-[#C47A5C] shrink-0">
                  <span className="material-symbols-outlined text-[22px]">favorite</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-serif text-[15px] font-bold text-[#2C2824]">
                    Safe anchor checklist
                  </span>
                  <span className="text-[12px] text-[#56524D] truncate">
                    Discreet support & warm verification...
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#F2EDE2] flex items-center justify-center text-[#7A7067] shrink-0">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </div>
            </button>
          </div>
        </section>

        {/* Private Unmonitored Footer Reassurance */}
        <footer className="flex items-center justify-center gap-1.5 text-center text-[#7A7067] text-[11px] py-3">
          <span className="material-symbols-outlined text-[15px]">lock</span>
          <span>Private, unmonitored space. You are always in control.</span>
        </footer>
      </div>
    </main>
  );
};
