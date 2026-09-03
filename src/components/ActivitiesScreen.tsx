import React, { useState, useEffect } from 'react';
import { ASSETS } from '../constants/assets';
import { soundEngine } from '../utils/audioSynth';

export const ActivitiesScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'body' | 'raga' | 'rest'>('all');
  const [isBreathingSync, setIsBreathingSync] = useState(false);
  const [breathPrompt, setBreathPrompt] = useState('Inhale gently through your nose...');
  const [breathScale, setBreathScale] = useState(1);
  const [activeActivityModal, setActiveActivityModal] = useState<string | null>(null);

  // 5-4-3-2-1 Grounding state
  const [groundingStep, setGroundingStep] = useState(5);

  // Walking timer state
  const [walkActive, setWalkActive] = useState(false);
  const [walkSeconds, setWalkSeconds] = useState(0);

  // Breath sync effect
  useEffect(() => {
    if (!isBreathingSync) {
      setBreathScale(1);
      setBreathPrompt('Inhale gently through your nose...');
      return;
    }

    let step = 0;
    const interval = setInterval(() => {
      if (step === 0) {
        setBreathScale(1.25);
        setBreathPrompt('Inhale peace deeply... (4s)');
        soundEngine.playChime();
        step = 1;
      } else if (step === 1) {
        setBreathPrompt('Hold gently in safety... (4s)');
        step = 2;
      } else if (step === 2) {
        setBreathScale(0.95);
        setBreathPrompt('Exhale tension slowly... (4s)');
        step = 3;
      } else {
        setBreathPrompt('Rest softly in this still moment...');
        step = 0;
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isBreathingSync]);

  // Walking timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (walkActive) {
      timer = setInterval(() => setWalkSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [walkActive]);

  const activities = [
    {
      id: 'bansuri',
      cat: 'raga body',
      title: 'Box Breathing with Bansuri Flute',
      subtitle: 'Indian Classical Bansuri • Raga Yaman',
      duration: '4 min gentle flute',
      badge: 'No effort required',
      badgeColor: 'text-[#6E775C] bg-[#F2EDE2]',
      description:
        'Subtle, unhurried flute frequencies tuned to ease nervous system tightening. Let the rhythmic breeze carry away urgency.',
      imageUrl: ASSETS.bambooForest,
      footerIcon: 'check_circle',
      footerNote: 'You can stop anytime',
      btnText: 'Listen',
      btnIcon: 'play_arrow',
      btnColor: 'bg-[#C47A5C]',
    },
    {
      id: 'grounding',
      cat: 'body rest',
      title: '5-4-3-2-1 Sensory Grounding',
      subtitle: 'Somatic Anchoring',
      duration: '3-5 mins',
      badge: 'Panic Relief',
      badgeColor: 'text-[#2C2824] bg-[#E7B9B2]',
      description:
        'Reclaim physical safety through tangible textures in your immediate environment. A quiet refuge when thoughts race.',
      imageUrl: ASSETS.potteryGrounding,
      footerIcon: 'lock_clock',
      footerNote: 'Gentle step-by-step',
      btnText: 'Begin',
      btnIcon: 'self_improvement',
      btnColor: 'bg-[#6E775C]',
    },
    {
      id: 'ahir-bhairav',
      cat: 'raga rest',
      title: 'Evening Ahir Bhairav Raga',
      subtitle: 'Evening Healing Tones',
      duration: '12 min immersion',
      badge: 'Nervous Ease',
      badgeColor: 'text-[#C47A5C] bg-[#F2EDE2]',
      description:
        'Deep resonant notes designed to quieten hypervigilance. Dim your lights, lean back, and let the tones hold you.',
      imageUrl: ASSETS.sitarTwilight,
      footerIcon: 'favorite',
      footerNote: 'Zero goals, just rest',
      btnText: 'Listen',
      btnIcon: 'play_arrow',
      btnColor: 'bg-[#C47A5C]',
    },
    {
      id: 'clay-paper',
      cat: 'rest body',
      title: 'Clay & Paper Emotional Release',
      subtitle: 'Tactile Expression',
      duration: 'Self-paced',
      badge: 'No grading',
      badgeColor: 'text-[#56524D] bg-[#F2EDE2]',
      description:
        'Express complex emotions through physical tactile movement without words, judgment, or expectations of creating art.',
      imageUrl: ASSETS.clayPaperRelease,
      footerIcon: 'sentiment_satisfied',
      footerNote: 'Safe creative outlet',
      btnText: 'Explore',
      btnIcon: 'brush',
      btnColor: 'bg-[#6E775C]',
    },
    {
      id: 'walking',
      cat: 'body',
      title: 'Walking in Sacred Silence',
      subtitle: 'Mindful Pacing',
      duration: '5-10 mins',
      badge: 'Gentle steps',
      badgeColor: 'text-[#6E775C] bg-[#F2EDE2]',
      description:
        'Notice the earth supporting each sole. Move gently across your room, balcony, or veranda with zero destination.',
      imageUrl: ASSETS.walkingGarden,
      footerIcon: 'energy_savings_leaf',
      footerNote: 'At your own cadence',
      btnText: 'Walk',
      btnIcon: 'footprint',
      btnColor: 'bg-[#C47A5C]',
    },
  ];

  const filteredActivities = activities.filter((act) => {
    if (activeCategory === 'all') return true;
    return act.cat.includes(activeCategory);
  });

  const handleActionClick = (id: string) => {
    if (id === 'bansuri' || id === 'ahir-bhairav') {
      soundEngine.playDrone(id === 'bansuri' ? 'flute' : 'tanpura');
      setActiveActivityModal(id);
    } else {
      setActiveActivityModal(id);
    }
  };

  return (
    <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto px-5 pt-20 pb-32">
      <div className="flex flex-col w-full gap-5">
        {/* Top Status Pill */}
        <div className="flex items-center justify-between pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A7B59C]/25 text-[#6E775C] text-xs font-semibold">
            <span
              className="material-symbols-outlined text-[15px] text-[#6E775C]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              spa
            </span>
            <span>Self-Paced Sanctuary</span>
          </div>
          <div className="inline-flex items-center gap-1 text-[11px] text-[#56524D] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A7B59C]"></span>
            <span>Unmonitored & private</span>
          </div>
        </div>

        {/* Hero Header Section */}
        <section className="flex flex-col gap-1.5">
          <h1 className="font-serif text-[28px] leading-[34px] text-[#2A2724] font-medium">
            Nourish Your Spirit
          </h1>
          <p className="text-[14px] leading-relaxed text-[#56524D]">
            Gentle somatic practices and soothing Indian soundscapes designed for recovery.
          </p>
        </section>

        {/* Category Filter Pills */}
        <section aria-label="Filter activities" className="overflow-x-auto pb-1 -mx-5 px-5 flex items-center gap-2 no-scrollbar">
          {[
            { id: 'all', label: 'All Gentle Paths' },
            { id: 'body', label: 'Body Grounding' },
            { id: 'raga', label: 'Raga Tones' },
            { id: 'rest', label: 'Sensory Rest' },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as typeof activeCategory)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-2xs ${
                  isActive
                    ? 'bg-[#C47A5C] text-white'
                    : 'bg-[#FCFAF6] text-[#2A2724] border border-[#E3DCCF] hover:bg-[#EAE4D7]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </section>

        {/* Restorative Pause / Breath Guidance Card */}
        <section className="w-full rounded-2xl bg-[#FCFAF6] p-5 border border-[#E3DCCF] shadow-xs flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAE4D7] text-[#C47A5C] text-[11px] font-semibold">
              Whisper-light pace
            </span>
            <span className="text-xs text-[#56524D] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C47A5C] animate-pulse"></span>
              <span>Live breath guidance</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Expanding breathing visualizer orb */}
            <div
              className="w-14 h-14 rounded-full bg-[#E7B9B2]/40 border border-[#E7B9B2] flex items-center justify-center text-[#C47A5C] transition-transform duration-1000 ease-in-out shrink-0"
              style={{ transform: `scale(${breathScale})` }}
            >
              <span className="material-symbols-outlined text-[26px]">air</span>
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="font-serif text-[17px] text-[#2A2724] font-medium truncate">
                Take a restorative pause
              </h2>
              <p className="text-xs text-[#56524D] mt-0.5">{breathPrompt}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#EAE4D7]/80">
            <span className="text-xs text-[#6E775C] font-medium">Take all the time you need</span>
            <button
              onClick={() => setIsBreathingSync(!isBreathingSync)}
              className={`px-4 py-1.5 rounded-full text-white text-xs font-semibold shadow-xs transition-all active:scale-95 ${
                isBreathingSync ? 'bg-[#6E775C] hover:bg-[#5a624a]' : 'bg-[#C47A5C] hover:bg-[#a86044]'
              }`}
            >
              {isBreathingSync ? 'Pause' : 'Sync Breath'}
            </button>
          </div>
        </section>

        {/* Activity Cards List */}
        <section className="flex flex-col gap-4">
          {filteredActivities.map((act) => (
            <article
              key={act.id}
              className="w-full rounded-2xl bg-[#FCFAF6] overflow-hidden border border-[#E3DCCF] shadow-xs flex flex-col transition-all hover:border-[#C47A5C]/50"
            >
              <div className="relative h-44 w-full overflow-hidden">
                <img
                  src={act.imageUrl}
                  alt={act.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#FCFAF6] via-transparent to-black/20"></div>
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full bg-[#FCFAF6]/95 backdrop-blur-sm text-[#C47A5C] text-xs font-semibold shadow-2xs">
                    {act.duration}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 rounded-full backdrop-blur-sm text-[11px] font-medium border border-[#E3DCCF] ${act.badgeColor}`}>
                    {act.badge}
                  </span>
                </div>
              </div>

              <div className="p-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[#6E775C] text-xs font-medium">
                    <span className="material-symbols-outlined text-[15px]">music_note</span>
                    <span>{act.subtitle}</span>
                  </div>
                  <h3 className="font-serif text-[18px] text-[#2A2724] font-medium leading-snug">
                    {act.title}
                  </h3>
                  <p className="text-[13px] text-[#56524D] leading-relaxed">
                    {act.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#EAE4D7]/70 mt-auto">
                  <div className="inline-flex items-center gap-1.5 text-[#56524D] text-xs">
                    <span className="material-symbols-outlined text-[16px] text-[#A7B59C]">
                      {act.footerIcon}
                    </span>
                    <span>{act.footerNote}</span>
                  </div>
                  <button
                    onClick={() => handleActionClick(act.id)}
                    className={`px-4 py-1.5 rounded-full text-white text-xs font-semibold transition-all flex items-center gap-1 shadow-xs active:scale-95 ${act.btnColor}`}
                  >
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {act.btnIcon}
                    </span>
                    <span>{act.btnText}</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Reassurance Footer Card */}
        <footer className="w-full p-5 rounded-2xl bg-[#FCFAF6] text-center flex flex-col items-center gap-2 mt-2 border border-[#E3DCCF]">
          <div className="w-8 h-8 rounded-full bg-[#E7B9B2]/30 flex items-center justify-center text-[#C47A5C]">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              favorite
            </span>
          </div>
          <p className="font-serif text-[17px] text-[#2A2724] font-medium">No tasks. No expectations.</p>
          <p className="text-[13px] text-[#56524D] max-w-xs leading-relaxed">
            Healing does not happen on a timer. You are safe here, exactly as you are.
          </p>
        </footer>
      </div>

      {/* Interactive Modal for activities */}
      {activeActivityModal && (
        <div className="fixed inset-0 z-50 bg-[#1d1c15]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#FAF7F0] p-6 shadow-2xl border border-[#E3D8CC] flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E3D8CC]">
              <h3 className="font-serif text-[18px] font-semibold text-[#1d1c15]">
                {activeActivityModal === 'bansuri' && 'Bansuri Raga Yaman Flute'}
                {activeActivityModal === 'grounding' && '5-4-3-2-1 Somatic Grounding'}
                {activeActivityModal === 'ahir-bhairav' && 'Ahir Bhairav Evening Tones'}
                {activeActivityModal === 'clay-paper' && 'Clay & Paper Tactile Space'}
                {activeActivityModal === 'walking' && 'Mindful Walking Pacer'}
              </h3>
              <button
                onClick={() => {
                  soundEngine.stop();
                  setActiveActivityModal(null);
                  setWalkActive(false);
                }}
                className="w-8 h-8 rounded-full bg-[#F2EDE2] text-[#6E775C] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Bansuri / Raga player */}
            {(activeActivityModal === 'bansuri' || activeActivityModal === 'ahir-bhairav') && (
              <div className="flex flex-col items-center text-center gap-4 py-2">
                <div className="w-20 h-20 rounded-full bg-[#E7B9B2]/30 border-2 border-[#C47A5C] flex items-center justify-center text-[#C47A5C] animate-pulse">
                  <span className="material-symbols-outlined text-[36px]">graphic_eq</span>
                </div>
                <div>
                  <h4 className="font-serif text-lg font-bold text-[#1d1c15]">
                    {activeActivityModal === 'bansuri' ? 'Harmonic Flute Meditation' : 'Deep Tanpura Drone Resonance'}
                  </h4>
                  <p className="text-xs text-[#53433d] mt-1 max-w-xs">
                    Synthesized acoustic overtones holding you in steady calm.
                  </p>
                </div>
                <button
                  onClick={() => {
                    soundEngine.stop();
                    setActiveActivityModal(null);
                  }}
                  className="px-6 py-2 rounded-full bg-[#C47A5C] text-white text-xs font-semibold hover:bg-[#a86044]"
                >
                  Rest Softly & Close
                </button>
              </div>
            )}

            {/* 5-4-3-2-1 Grounding Interactive */}
            {activeActivityModal === 'grounding' && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-[#53433d]">
                  Follow each sense step at your own unhurried pace:
                </p>

                <div className="flex items-center justify-between gap-1.5">
                  {[5, 4, 3, 2, 1].map((s) => (
                    <button
                      key={s}
                      onClick={() => setGroundingStep(s)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        groundingStep === s
                          ? 'bg-[#6E775C] text-white shadow-xs'
                          : 'bg-white border border-[#E3D8CC] text-[#7A7067]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E3D8CC] flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[#6E775C] uppercase tracking-wider">
                    {groundingStep === 5 && 'Step 5: Sight'}
                    {groundingStep === 4 && 'Step 4: Touch'}
                    {groundingStep === 3 && 'Step 3: Hearing'}
                    {groundingStep === 2 && 'Step 2: Scent'}
                    {groundingStep === 1 && 'Step 1: Taste / Sensation'}
                  </span>
                  <p className="text-sm font-medium text-[#1d1c15]">
                    {groundingStep === 5 && 'Look around slowly. Name 5 distinct things you can see (the wall color, a gentle shadow, a cup, light on the floor).'}
                    {groundingStep === 4 && 'Name 4 physical textures you can touch right now (your fabric sleeve, the cool phone screen, the chair back, the soles of your feet).'}
                    {groundingStep === 3 && 'Close your eyes for a moment. Name 3 sounds you can hear (a distant breeze, your breathing, a clock ticking).'}
                    {groundingStep === 2 && 'Name 2 subtle scents you can notice (air in the room, warm tea, clean fabric).'}
                    {groundingStep === 1 && 'Notice 1 taste or physical feeling inside your body (the relaxation in your jaw, the tongue resting peacefully on the roof of your mouth).'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (groundingStep > 1) {
                      setGroundingStep(groundingStep - 1);
                      soundEngine.playChime();
                    } else {
                      setActiveActivityModal(null);
                    }
                  }}
                  className="w-full py-2.5 rounded-full bg-[#6E775C] text-white text-xs font-semibold hover:bg-[#5a624a]"
                >
                  {groundingStep > 1 ? 'Next Grounding Step' : 'Complete Somatic Anchor'}
                </button>
              </div>
            )}

            {/* Clay & Paper tactile interactive */}
            {activeActivityModal === 'clay-paper' && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-[#53433d]">
                  Gently smooth your finger across the warm clay canvas to release stored tension:
                </p>
                <div
                  className="w-full h-44 rounded-2xl bg-gradient-to-br from-[#E7B9B2]/50 via-[#EAE4D7] to-[#C47A5C]/40 border border-[#E3DCCF] flex items-center justify-center text-center p-4 cursor-crosshair select-none active:scale-[0.99] transition-transform"
                  onClick={() => soundEngine.playChime()}
                >
                  <div className="flex flex-col items-center text-[#53433d]">
                    <span className="material-symbols-outlined text-[32px] text-[#C47A5C] mb-1">touch_app</span>
                    <span className="text-xs font-semibold">Tap or smooth to knead clay</span>
                    <span className="text-[11px] opacity-75">No marks, no judgment, pure sensation</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveActivityModal(null)}
                  className="w-full py-2 rounded-full bg-[#6E775C] text-white text-xs font-semibold"
                >
                  Finished Kneading
                </button>
              </div>
            )}

            {/* Walking in Sacred Silence */}
            {activeActivityModal === 'walking' && (
              <div className="flex flex-col items-center text-center gap-3">
                <p className="text-xs text-[#53433d]">
                  Step slowly. Feel heel-to-toe contact with each gentle stride.
                </p>
                <div className="text-4xl font-mono text-[#C47A5C] my-2">
                  {Math.floor(walkSeconds / 60)}:
                  {String(walkSeconds % 60).padStart(2, '0')}
                </div>
                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={() => {
                      setWalkActive(!walkActive);
                      soundEngine.playChime();
                    }}
                    className="flex-1 py-2 rounded-full bg-[#C47A5C] text-white text-xs font-semibold"
                  >
                    {walkActive ? 'Pause Cadence' : 'Begin Cadence'}
                  </button>
                  <button
                    onClick={() => {
                      setWalkActive(false);
                      setWalkSeconds(0);
                      setActiveActivityModal(null);
                    }}
                    className="px-4 py-2 rounded-full bg-[#F2EDE2] text-[#53433d] text-xs font-semibold"
                  >
                    End Walk
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
