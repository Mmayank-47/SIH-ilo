import React, { useState, useEffect } from 'react';
import { soundEngine } from '../utils/audioSynth';
import { ASSETS } from '../constants/assets';

interface ComfortModalProps {
  type: 'sounds' | 'story' | 'checklist' | null;
  onClose: () => void;
}

export const ComfortModals: React.FC<ComfortModalProps> = ({ type, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundChoice, setSoundChoice] = useState<'bowl' | 'tanpura' | 'flute'>('bowl');
  const [checklist, setChecklist] = useState([
    { id: 'c1', label: 'My feet are resting firmly on solid ground', checked: true },
    { id: 'c2', label: 'I can breathe in unhurried, gentle air', checked: true },
    { id: 'c3', label: 'I am safe in this immediate physical second', checked: false },
    { id: 'c4', label: 'I have permission to pause and do nothing', checked: false },
    { id: 'c5', label: 'My thoughts are clouds passing; I am the sky', checked: false },
  ]);

  useEffect(() => {
    if (type === 'sounds') {
      soundEngine.playDrone(soundChoice);
      setIsPlaying(true);
    }
    return () => {
      soundEngine.stop();
      setIsPlaying(false);
    };
  }, [type, soundChoice]);

  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#1d1c15]/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F0] p-6 shadow-xl flex flex-col gap-4 text-left border border-[#E3D8CC] max-h-[85vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E3D8CC]/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E7B9B2]/30 flex items-center justify-center text-[#C47A5C]">
              <span className="material-symbols-outlined text-[18px]">
                {type === 'sounds' ? 'graphic_eq' : type === 'story' ? 'auto_stories' : 'task_alt'}
              </span>
            </div>
            <h3 className="font-serif text-[17px] font-semibold text-[#1d1c15]">
              {type === 'sounds' && 'Grounding Soundscapes'}
              {type === 'story' && 'A Quiet Moment with ilo'}
              {type === 'checklist' && 'Safe Anchor Checklist'}
            </h3>
          </div>
          <button
            onClick={() => {
              soundEngine.stop();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#F2EDE2] text-[#6E775C] hover:text-[#1d1c15] flex items-center justify-center"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body: Grounding Sounds */}
        {type === 'sounds' && (
          <div className="flex flex-col gap-4">
            <div className="w-full h-32 rounded-2xl bg-gradient-to-tr from-[#EAE4D7] via-[#FAF7F0] to-[#E7B9B2]/20 border border-[#E3D8CC] flex flex-col items-center justify-center text-center p-4">
              <div
                className={`w-14 h-14 rounded-full bg-[#C47A5C] text-white flex items-center justify-center shadow-md ${
                  isPlaying ? 'animate-pulse' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[28px]">
                  {isPlaying ? 'volume_up' : 'volume_off'}
                </span>
              </div>
              <span className="text-xs text-[#6E775C] font-semibold mt-2">
                {isPlaying ? 'Soundscape Resonance Playing Softly' : 'Paused'}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-[#53433d] font-semibold">Choose Soothing Frequency:</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bowl', name: 'Singing Bowl', freq: '432 Hz' },
                  { id: 'tanpura', name: 'Tanpura Drone', freq: 'D Minor' },
                  { id: 'flute', name: 'Bansuri Air', freq: 'Raga Yaman' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSoundChoice(s.id as 'bowl' | 'tanpura' | 'flute')}
                    className={`p-2 rounded-xl text-center flex flex-col items-center border transition-all text-xs ${
                      soundChoice === s.id
                        ? 'bg-[#C47A5C] text-white border-[#C47A5C] shadow-xs'
                        : 'bg-white border-[#E3D8CC] text-[#1d1c15] hover:bg-[#F2EDE2]'
                    }`}
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="text-[10px] opacity-80">{s.freq}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  if (isPlaying) {
                    soundEngine.stop();
                    setIsPlaying(false);
                  } else {
                    soundEngine.playDrone(soundChoice);
                    setIsPlaying(true);
                  }
                }}
                className="w-full h-11 rounded-full bg-[#C47A5C] text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#8a4b30] shadow-xs transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
                <span>{isPlaying ? 'Pause Sound' : 'Resume Sound'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body: A Quiet Moment Story */}
        {type === 'story' && (
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F2EDE2] border border-[#E3D8CC]">
              <img
                src={ASSETS.iloCompanion}
                alt="ilo"
                className="w-12 h-12 rounded-full object-contain bg-white p-1 border border-[#A7B59C]/40"
              />
              <div className="flex flex-col">
                <span className="font-serif text-[14px] font-semibold text-[#1d1c15]">The Gentle Banyan Tree</span>
                <span className="text-[11px] text-[#6E775C]">2 min somatic story by ilo</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E3D8CC] text-[#53433d] text-xs leading-relaxed flex flex-col gap-2.5">
              <p>
                Imagine a quiet courtyard at sunrise. Deep beneath the warm terracotta courtyard tiles, ancient roots drink in cool, still water.
              </p>
              <p>
                The branches ask nothing of the wind. They simply sway. When storms pass over, the tree does not argue with the thunder; it drops its shoulders into the earth.
              </p>
              <p className="italic text-[#C47A5C] font-serif text-[13px]">
                "You do not need to solve the rest of today right now. Just rest here in this single, protected second with me."
              </p>
            </div>

            <button
              onClick={() => {
                soundEngine.playChime();
                onClose();
              }}
              className="w-full h-11 rounded-full bg-[#6E775C] text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#596248] shadow-xs transition-all"
            >
              <span className="material-symbols-outlined text-[17px]">spa</span>
              <span>I Feel A Little Calmer</span>
            </button>
          </div>
        )}

        {/* Modal Body: Safe Anchor Checklist */}
        {type === 'checklist' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-[#53433d]">
              Check off any truth you can physically connect with right now. There is no requirement to check all:
            </p>

            <div className="flex flex-col gap-2">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  onClick={() => {
                    setChecklist((prev) =>
                      prev.map((c) => (c.id === item.id ? { ...c, checked: !c.checked } : c))
                    );
                    soundEngine.playChime();
                  }}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    item.checked
                      ? 'bg-white border-[#C47A5C]/40 text-[#1d1c15] shadow-2xs'
                      : 'bg-[#F2EDE2]/60 border-[#E3D8CC] text-[#7A7067]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      item.checked ? 'bg-[#C47A5C] text-white' : 'border border-[#D8C2BA] bg-white'
                    }`}
                  >
                    {item.checked && <span className="material-symbols-outlined text-[14px]">check</span>}
                  </div>
                  <span className="text-xs font-medium leading-tight">{item.label}</span>
                </label>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full h-11 rounded-full bg-[#C47A5C] text-white font-semibold text-xs hover:bg-[#8a4b30] shadow-xs transition-all"
              >
                Anchor Saved Softly
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
