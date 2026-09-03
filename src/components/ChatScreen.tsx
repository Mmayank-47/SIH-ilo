import React, { useState, useRef, useEffect } from 'react';
import { ASSETS } from '../constants/assets';
import { ChatMessage, NavigationTab, CamouflageMode } from '../types';
import { soundEngine } from '../utils/audioSynth';

interface ChatScreenProps {
  onNavigate: (tab: NavigationTab) => void;
  onTriggerCamouflage: (mode: CamouflageMode) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ onNavigate, onTriggerCamouflage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ilo',
      text: "I’m right here with you. There’s no rush to explain anything. Would you like to sit together quietly, or tell me what’s on your mind today?",
      timestamp: '10:42 AM • Soft warmth',
    },
    {
      id: 'm2',
      sender: 'user',
      text: 'I felt overwhelmed by loud sounds on the road today. My chest felt tight.',
      timestamp: '10:44 AM',
    },
    {
      id: 'm3',
      sender: 'ilo',
      text: 'Thank you for trusting me with that. Loud noises can make our body feel unsafe even when we’ve reached a quiet room.',
      subPrompt: 'Let’s place one hand on our chest together. Can you feel your heartbeat slowing down?',
      timestamp: 'Just now • ilo',
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputVal.trim();
    if (!text) return;

    soundEngine.playChime();
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInputVal('');
    setIsTyping(true);

    // Compassionate empathetic responses from ilo
    setTimeout(() => {
      let replyText = "I hear you softly. Let’s take three calm breaths together. Breathe in peace, exhale tension.";
      let subPrompt: string | undefined;

      const lower = text.toLowerCase();
      if (lower.includes('breathing')) {
        replyText = "Inhale slowly for 4 counts... 1, 2, 3, 4. Hold gently... and let it float away. You are safe here.";
        subPrompt = "Notice how the chest softens on each exhale. You are doing wonderfully.";
      } else if (lower.includes('listen') || lower.includes('quiet')) {
        replyText = "I'm sitting quietly right beside you. You don't have to carry any expectations here.";
        subPrompt = "No words needed. Just stillness and warm presence.";
      } else if (lower.includes('better') || lower.includes('calm')) {
        replyText = "That brings so much calm to my heart. Honor every tiny moment of relief you feel today.";
      } else if (lower.includes('scared') || lower.includes('fear') || lower.includes('tight')) {
        replyText = "It is completely understandable to feel shaken. Look around the room: notice 3 safe objects that are solid and still.";
        subPrompt = "Feel your feet grounded on the floor. The ground is holding you.";
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ilo',
        text: replyText,
        subPrompt,
        timestamp: 'Just now • ilo',
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1300);
  };

  const handleClearDiscreetly = () => {
    setIsCleared(true);
    setMessages([]);
  };

  return (
    <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto px-4 pt-18 pb-28 bg-[#F2EDE2]">
      <div className="flex flex-col w-full pb-2">
        {/* Top Companion Presence & Safety Bar */}
        <div className="flex items-center justify-between py-2 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="relative w-12 h-12 rounded-full p-1 shadow-xs bg-white border border-[#A7B59C]/50 flex items-center justify-center">
              <img
                src={ASSETS.iloCompanion}
                alt="ilo Logo Avatar"
                className="w-full h-full object-contain"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#6E775C] ring-2 ring-[#F2EDE2] shadow-2xs"></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-[18px] text-[#2C2824] font-bold">ilo</span>
                <span className="material-symbols-outlined text-[16px] text-[#C47A5C]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  favorite
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#6E775C] animate-pulse"></span>
                <span className="text-[11px] text-[#6E775C] font-medium">Listening gently</span>
              </div>
            </div>
          </div>

          {/* Quick Discretion / Clear Privacy Button */}
          <button
            onClick={handleClearDiscreetly}
            aria-label="Quick privacy wipe"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-[#6E775C] hover:bg-[#F8F4EC] active:scale-95 transition-all shadow-2xs border border-[#D5CEBF]"
          >
            <span className="material-symbols-outlined text-[16px]">visibility_off</span>
            <span className="text-[11px] font-semibold">Clear discreetly</span>
          </button>
        </div>

        {/* Ambient Grounding Micro-Card */}
        <div className="w-full p-3.5 rounded-2xl bg-white border border-[#D5CEBF]/70 shadow-xs mb-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#A7B59C]/35 text-[#546045] flex items-center justify-center shrink-0 shadow-2xs border border-[#A7B59C]/40">
            <span className="material-symbols-outlined text-[19px]">spa</span>
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-[13px] text-[#2C2824] font-semibold truncate">
              Safe, private & non-recorded space
            </p>
            <p className="text-[12px] text-[#7A7067]">
              Take all the time you need. Your rhythm is sacred.
            </p>
          </div>
        </div>

        {/* Conversational Flow Area */}
        <div className="flex flex-col gap-3.5 mb-4 min-h-[300px]">
          {isCleared ? (
            <div className="p-5 rounded-2xl bg-white border border-[#A7B59C]/40 text-[#56524D] shadow-xs text-center my-6">
              <span className="material-symbols-outlined text-[28px] text-[#6E775C] mb-1">lock_reset</span>
              <p className="text-[14px] font-medium">Your chat space was wiped clean for your privacy.</p>
              <p className="text-[12px] text-[#6E775C] mt-1">ilo is still right here whenever you're ready.</p>
              <button
                onClick={() => {
                  setIsCleared(false);
                  setMessages([
                    {
                      id: Date.now().toString(),
                      sender: 'ilo',
                      text: "Welcome back to your safe sanctuary. How does your breath feel right now?",
                      timestamp: 'Just now • ilo',
                    },
                  ]);
                }}
                className="mt-3 px-4 py-1.5 rounded-full bg-[#F2EDE2] text-[#C47A5C] text-xs font-semibold hover:bg-[#EAE4D7]"
              >
                Start Anew
              </button>
            </div>
          ) : (
            messages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <div key={msg.id} className="flex items-end justify-end max-w-[88%] self-end">
                    <div className="flex flex-col items-end gap-1">
                      <div className="p-3.5 rounded-2xl rounded-br-xs bg-[#E7B9B2] text-[#422B26] shadow-2xs leading-relaxed border border-[#E7B9B2]/80">
                        <p className="text-[14px] font-medium">{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-[#8D887E] px-2">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex items-end gap-2 max-w-[92%] self-start">
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-white border border-[#A7B59C]/40 p-0.5 mb-1 shadow-2xs flex items-center justify-center">
                    <img
                      src={ASSETS.iloCompanion}
                      alt="ilo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="p-3.5 rounded-2xl rounded-bl-xs bg-white border border-[#A7B59C]/35 text-[#2C2824] shadow-2xs leading-relaxed">
                      <p className="text-[14px] leading-relaxed">{msg.text}</p>
                      {msg.subPrompt && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-[#F2EDE2] border border-[#A7B59C]/30 flex items-center gap-2">
                          <span
                            className="material-symbols-outlined text-[19px] text-[#C47A5C] shrink-0"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            self_improvement
                          </span>
                          <p className="text-[12px] text-[#56524D] italic">
                            {msg.subPrompt}
                          </p>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-[#8D887E] px-2">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 self-start max-w-[70%]">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-white border border-[#A7B59C]/40 p-0.5 opacity-80 shadow-2xs flex items-center justify-center">
                <img
                  src={ASSETS.iloCompanion}
                  alt="ilo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="px-4 py-2.5 rounded-full bg-white border border-[#A7B59C]/35 text-[#7A7067] shadow-2xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#6E775C] animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-[#6E775C] animate-bounce" style={{ animationDelay: '180ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-[#6E775C] animate-bounce" style={{ animationDelay: '360ms' }}></span>
                <span className="text-[11px] text-[#6E775C] font-medium ml-1">holding space</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Comforting Quick-Reply Chips */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5 px-1">
            <span className="material-symbols-outlined text-[15px] text-[#6E775C]">flare</span>
            <span className="text-[11px] text-[#7A7067] font-semibold uppercase tracking-wider">
              Tap a gentle response
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => handleSendMessage('Guide my breathing')}
              className="whitespace-nowrap px-4 py-2.5 rounded-full bg-white border border-[#A7B59C]/60 text-[#2C2824] text-[13px] hover:bg-[#A7B59C]/20 hover:text-[#28301B] active:scale-95 transition-all shadow-2xs flex items-center gap-1.5 shrink-0 font-medium"
            >
              <span className="material-symbols-outlined text-[17px] text-[#6E775C]">air</span>
              <span>Guide my breathing</span>
            </button>
            <button
              onClick={() => handleSendMessage('Just listen for now')}
              className="whitespace-nowrap px-4 py-2.5 rounded-full bg-white border border-[#B7C6D6] text-[#2C2824] text-[13px] hover:bg-[#B7C6D6]/25 active:scale-95 transition-all shadow-2xs flex items-center gap-1.5 shrink-0 font-medium"
            >
              <span className="material-symbols-outlined text-[17px] text-[#55708C]">hearing</span>
              <span>Just listen for now</span>
            </button>
            <button
              onClick={() => handleSendMessage('I feel a bit better')}
              className="whitespace-nowrap px-4 py-2.5 rounded-full bg-white border border-[#E7B9B2] text-[#2C2824] text-[13px] hover:bg-[#E7B9B2]/30 active:scale-95 transition-all shadow-2xs flex items-center gap-1.5 shrink-0 font-medium"
            >
              <span className="material-symbols-outlined text-[17px] text-[#C47A5C]">sentiment_calm</span>
              <span>I feel a bit better</span>
            </button>
          </div>
        </div>

        {/* Interactive Input Console */}
        <div className="w-full bg-white p-2 rounded-2xl shadow-sm border border-[#D5CEBF]/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Voice Note Button */}
            <button
              type="button"
              onClick={() => {
                setIsRecording(!isRecording);
                if (!isRecording) {
                  soundEngine.playChime();
                }
              }}
              aria-label="Speak thoughts or whisper"
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all shadow-2xs active:scale-95 ${
                isRecording ? 'bg-[#C47A5C] text-white animate-pulse' : 'bg-[#6E775C] text-white hover:bg-[#5C644D]'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">mic</span>
            </button>

            {/* Text Capsule Input */}
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={isRecording ? 'Listening to your gentle voice...' : 'Speak or whisper to ilo...'}
                className="w-full h-12 pl-4 pr-3 rounded-full bg-[#FAF7F2] text-[#2C2824] placeholder:text-[#8D887E] text-[14px] border border-[#D5CEBF] focus:outline-none focus:ring-2 focus:ring-[#C47A5C]/40 transition-all"
              />
            </div>

            {/* Gentle Send Button */}
            <button
              type="submit"
              disabled={!inputVal.trim()}
              aria-label="Send gentle message"
              className="w-12 h-12 rounded-full bg-[#C47A5C] disabled:opacity-50 text-white hover:bg-[#B36C4F] flex items-center justify-center shrink-0 transition-all shadow-2xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>
        </div>

        {/* Discreet Quick Hide & Safety Anchor */}
        <div className="flex items-center justify-between mt-2.5 px-2">
          <div className="flex items-center gap-1 text-[#7A7067]">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            <span className="text-[11px]">Completely ephemeral chat</span>
          </div>
          <button
            type="button"
            onClick={() => onTriggerCamouflage('pantry')}
            className="flex items-center gap-1 text-[#6E775C] hover:text-[#C47A5C] transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">emergency_home</span>
            <span className="text-[11px] font-semibold">Quick exit to Notes</span>
          </button>
        </div>
      </div>
    </main>
  );
};
