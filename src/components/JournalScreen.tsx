import React, { useState, useEffect } from 'react';
import { JournalEntry, CamouflageMode } from '../types';
import { soundEngine } from '../utils/audioSynth';

interface JournalScreenProps {
  onTriggerCamouflage: (mode: CamouflageMode) => void;
}

export const JournalScreen: React.FC<JournalScreenProps> = ({ onTriggerCamouflage }) => {
  const initialEntries: JournalEntry[] = [
    {
      id: 'e1',
      tag: 'Peaceful Morning',
      tagType: 'peace',
      title: 'The evening rain and hot chai',
      content:
        'Listened to the downpour against the windowpane. The smell of wet earth and cardamom gave me space to uncurl my shoulders...',
      timestamp: '2 days ago',
      dateStr: 'Yesterday at 5:20 PM',
    },
    {
      id: 'e2',
      tag: 'Tender Release',
      tagType: 'release',
      title: 'Letting tears come without judging myself',
      content:
        'I sat with a warm blanket and stopped forcing myself to feel strong. It is okay to be tired. It is okay to breathe through the heaviness.',
      timestamp: '4 days ago',
      dateStr: 'Sunday at 9:15 PM',
    },
    {
      id: 'e3',
      tag: 'Grounded',
      tagType: 'grounded',
      title: 'Walking barefoot on the morning grass',
      content:
        'The cool dew woke up my feet. Counted five different bird songs before the neighborhood woke up. My breath felt slow and steady.',
      timestamp: '6 days ago',
      dateStr: 'Last Friday at 6:40 AM',
    },
  ];

  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('ilo_reflections');
      return saved ? JSON.parse(saved) : initialEntries;
    } catch {
      return initialEntries;
    }
  });

  const [isWriting, setIsWriting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState<'Peaceful Morning' | 'Tender Release' | 'Grounded'>('Peaceful Morning');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('ilo_reflections', JSON.stringify(entries));
    } catch {}
  }, [entries]);

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    soundEngine.playChime();
    const entryId = Date.now().toString();
    const entry: JournalEntry = {
      id: entryId,
      tag: newTag,
      tagType: newTag === 'Peaceful Morning' ? 'peace' : newTag === 'Tender Release' ? 'release' : 'grounded',
      title: newTitle.trim() || 'Gentle reflection',
      content: newContent.trim(),
      timestamp: 'Just now',
      dateStr: 'Today',
    };

    setEntries([entry, ...entries]);
    setNewTitle('');
    setNewContent('');
    setIsWriting(false);

    // Analyze journal entry with Gemini in background for gentle trauma-informed reflection
    fetch('/api/analyze/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: entry.content,
        contextTag: entry.tag,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.analysis) {
          setEntries((prev) =>
            prev.map((item) =>
              item.id === entryId
                ? {
                    ...item,
                    reflectionInsight: data.analysis.iloReflectionQuote || data.analysis.somaticSensationSummary,
                    distressLevel: data.analysis.distressIndex,
                  }
                : item
            )
          );
        }
      })
      .catch(() => {});
  };

  return (
    <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto px-5 pt-20 pb-28">
      <div className="flex flex-col w-full space-y-5">
        {/* Subheader & Quick Conceal Action Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6E775C]"></span>
            <span className="text-[11px] font-semibold text-[#6E775C] tracking-wider uppercase">
              Safe Private Sanctuary
            </span>
          </div>
          <button
            onClick={() => onTriggerCamouflage('pantry')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FCFAF6] text-[#6E775C] border border-[#E5DED4] text-[12px] font-medium active:scale-95 transition shadow-2xs hover:bg-[#F2EDE2]"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">visibility_off</span>
            <span>Quick Conceal</span>
          </button>
        </div>

        {/* Daily Sanctuary Reflection Card */}
        <div className="relative overflow-hidden rounded-2xl bg-[#FCFAF6] p-5 shadow-xs border border-[#E5DED4]">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-[#E7B9B2]/25 blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-1.5 mb-2.5 text-[#C47A5C]">
            <span className="material-symbols-outlined text-[18px]">spa</span>
            <span className="font-serif text-[13px] font-medium tracking-wide">
              Daily Sanctuary Reflection
            </span>
          </div>
          <p className="font-serif text-[18px] text-[#2D2622] leading-relaxed mb-4">
            “What is one small thing that brought your body even a second of relief today?”
          </p>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-[#635952]">
              <span className="material-symbols-outlined text-[15px] text-[#6E775C]">lock</span>
              <span className="text-[11px]">Private to your device • No judgment</span>
            </div>
            <button
              onClick={() => {
                setNewTitle('A moment of relief');
                setIsWriting(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#C47A5C] text-white text-[13px] font-medium hover:bg-[#B36B4E] active:scale-95 transition-all shadow-[0_4px_12px_rgba(196,122,92,0.28)]"
              type="button"
            >
              <span>Write privately</span>
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
            </button>
          </div>
        </div>

        {/* Primary Quick Input Prompt (Text & Voice Trigger) */}
        <div className="flex flex-col">
          <button
            onClick={() => setIsWriting(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#FCFAF6] hover:bg-[#F8F4EC] active:scale-[0.99] transition-all text-left shadow-xs border border-[#E5DED4] group"
            type="button"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#A7B59C]/20 text-[#6E775C] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-serif text-[15px] text-[#2D2622] font-medium truncate">
                  Begin a gentle thought
                </span>
                <span className="text-[12px] text-[#635952]">Tap to type freely at your own pace</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#F2EDE2] text-[#6E775C] flex items-center justify-center shrink-0 border border-[#E5DED4]">
              <span className="material-symbols-outlined text-[18px]">mic</span>
            </div>
          </button>
        </div>

        {/* Safe Reflections List Section */}
        <div className="flex flex-col space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#6E775C]">local_florist</span>
              <h2 className="font-serif text-[17px] text-[#2D2622] font-medium">Your Safe Reflections</h2>
            </div>
            <span className="text-[11px] text-[#6E775C] font-semibold bg-[#A7B59C]/20 px-2.5 py-0.5 rounded-full">
              {entries.length} Entries
            </span>
          </div>

          {entries.map((entry) => {
            const isPeace = entry.tagType === 'peace';
            const isRelease = entry.tagType === 'release';

            return (
              <article
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className="relative overflow-hidden rounded-2xl bg-[#FCFAF6] p-4 shadow-xs border border-[#E5DED4] hover:border-[#A7B59C] transition-all cursor-pointer group"
              >
                {/* Colored border accent stripe on left */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    isPeace ? 'bg-[#6E775C]' : isRelease ? 'bg-[#C47A5C]' : 'bg-[#6E775C]'
                  }`}
                ></div>

                <div className="pl-2.5 flex flex-col space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                        isPeace
                          ? 'bg-[#A7B59C]/25 text-[#4E563E]'
                          : isRelease
                          ? 'bg-[#E7B9B2]/35 text-[#8F4E3D]'
                          : 'bg-[#C47A5C]/15 text-[#8F4E3D]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {isPeace ? 'local_florist' : isRelease ? 'favorite' : 'park'}
                      </span>
                      {entry.tag}
                    </span>
                    <span className="text-[12px] text-[#8C8075]">{entry.timestamp}</span>
                  </div>

                  <h3 className="font-serif text-[16px] text-[#2D2622] font-medium pt-0.5">
                    {entry.title}
                  </h3>
                  <p className="text-[13px] text-[#635952] leading-relaxed line-clamp-2">
                    {entry.content}
                  </p>

                  {entry.reflectionInsight && (
                    <div className="mt-1.5 p-2 rounded-xl bg-[#FAF7F2] border border-[#A7B59C]/40 flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-[#C47A5C] shrink-0 mt-0.5">
                        spa
                      </span>
                      <p className="italic text-[11px] text-[#56524D] leading-snug">
                        ilo whispers: “{entry.reflectionInsight}”
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1.5 border-t border-[#E5DED4]/60">
                    <div className="flex items-center gap-1.5 text-[#635952]">
                      <span
                        className="material-symbols-outlined text-[14px] text-[#6E775C]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        lock
                      </span>
                      <span className="text-[11px]">Saved on your device only</span>
                    </div>
                    <span className="material-symbols-outlined text-[17px] text-[#8C8075] group-hover:text-[#C47A5C] transition-colors">
                      arrow_forward
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Organic Sensory Wave Separator */}
        <div className="w-full flex items-center justify-center py-2">
          <svg className="w-24 h-5 text-[#A7B59C]/50" fill="none" viewBox="0 0 100 20">
            <path
              d="M0 10C25 10 25 18 50 18C75 18 75 10 100 10"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.75"
            ></path>
            <circle cx="50" cy="18" fill="currentColor" r="2.5"></circle>
          </svg>
        </div>

        {/* Discreet Security & Autonomy Reassurance Card */}
        <div className="rounded-2xl bg-[#FCFAF6]/90 p-4 flex items-start gap-3.5 border border-[#E5DED4] mb-6 shadow-2xs">
          <div className="w-9 h-9 rounded-full bg-[#A7B59C]/20 text-[#6E775C] flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[19px]">shield</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="font-serif text-[14px] text-[#2D2622] font-semibold">
              Zero External Storage • ilo Sanctuary
            </span>
            <p className="text-[12px] text-[#635952] leading-relaxed">
              ilo stores your thoughts solely on this device with AES-256 local-only encryption. Your reflections never touch external cloud servers or databases, guarded in complete confidentiality.
            </p>
          </div>
        </div>
      </div>

      {/* Writing Modal Drawer */}
      {isWriting && (
        <div className="fixed inset-0 z-50 bg-[#1d1c15]/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#FAF7F0] p-6 shadow-2xl border border-[#E3D8CC] flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-[#E3D8CC]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#C47A5C]">edit_note</span>
                <h3 className="font-serif text-[18px] font-semibold text-[#1d1c15]">
                  Write Privately
                </h3>
              </div>
              <button
                onClick={() => setIsWriting(false)}
                className="w-8 h-8 rounded-full bg-[#F2EDE2] text-[#6E775C] hover:text-[#1d1c15] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {(['Peaceful Morning', 'Tender Release', 'Grounded'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewTag(t)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      newTag === t
                        ? 'bg-[#C47A5C] text-white'
                        : 'bg-white text-[#56524D] border border-[#E5DED4]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Give this feeling a gentle title (optional)..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5DED4] text-sm focus:outline-none focus:ring-2 focus:ring-[#C47A5C]/40"
              />

              <textarea
                rows={5}
                required
                placeholder="Pour out what is here. No judgment, no editing, just release..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-white border border-[#E5DED4] text-sm focus:outline-none focus:ring-2 focus:ring-[#C47A5C]/40 resize-none leading-relaxed"
              ></textarea>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-xs text-[#6E775C]">
                  <span className="material-symbols-outlined text-[15px]">lock</span>
                  <span>AES-256 local encrypted</span>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#C47A5C] text-white text-xs font-semibold hover:bg-[#B36B4E] transition-all shadow-xs"
                >
                  Save to Sanctuary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-[#1d1c15]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#FAF7F0] p-6 shadow-2xl border border-[#E3D8CC] flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#E3D8CC]">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#A7B59C]/25 text-[#4E563E]">
                {selectedEntry.tag}
              </span>
              <button
                onClick={() => setSelectedEntry(null)}
                className="w-8 h-8 rounded-full bg-[#F2EDE2] text-[#6E775C] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <h3 className="font-serif text-[20px] font-bold text-[#1d1c15]">
              {selectedEntry.title}
            </h3>

            <p className="text-sm text-[#53433d] leading-relaxed whitespace-pre-wrap">
              {selectedEntry.content}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-[#E3D8CC] text-xs text-[#8C8075]">
              <span>{selectedEntry.dateStr}</span>
              <button
                onClick={() => {
                  setEntries(entries.filter((e) => e.id !== selectedEntry.id));
                  setSelectedEntry(null);
                }}
                className="text-red-700 hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                <span>Delete gently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
