import React, { useState, useRef, useEffect } from 'react';
import { ASSETS } from '../constants/assets';
import { ChatMessage, NavigationTab, CamouflageMode } from '../types';
import { soundEngine } from '../utils/audioSynth';
import { FacialCaptureController, StructuredFacialOutput } from './FacialCaptureController';

interface ChatScreenProps {
  onNavigate: (tab: NavigationTab) => void;
  onTriggerCamouflage: (mode: CamouflageMode) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  onNavigate,
  onTriggerCamouflage,
}) => {
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
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [isAnalyzingMedia, setIsAnalyzingMedia] = useState(false);
  const [sentimentShiftCounter, setSentimentShiftCounter] = useState(0);
  const [latestFacialOutput, setLatestFacialOutput] = useState<StructuredFacialOutput | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
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

    // Opportunistically trigger facial frame capture on notable sentiment shift in user text
    const distressKeywords = /overwhelm|chest tight|panic|anxious|scared|crying|sad|hurts|hopeless|heavy|depressed|afraid|trembl/i;
    if (distressKeywords.test(text)) {
      setSentimentShiftCounter((c) => c + 1);
    }

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: text,
        }),
      });
      const data = await res.json();

      if (data.isCrisisAlert) {
        setSentimentShiftCounter((c) => c + 1);
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ilo',
        text: data.reply || "I am resting right here with you in quiet support.",
        timestamp: 'Just now • ilo',
        actionsTriggered: data.actionsTriggered,
        isCrisisAlert: data.isCrisisAlert,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      // Fallback
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ilo',
        text: "I am holding space right here with you. Take a slow, gentle breath and know you are protected.",
        timestamp: 'Just now • ilo',
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      if (!base64) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        text: `Shared an expressive artwork / mood sketch: ${file.name}`,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      try {
        const res = await fetch('/api/analyze/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type || 'image/jpeg',
            contextText: 'Expressive mood sketch from user chat sanctuary',
          }),
        });
        const data = await res.json();
        const analysis = data.analysis;

        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ilo',
          text: `I see the gentle expression in what you shared. ${analysis?.expressiveInterpretation || 'Thank you for expressing your inner world safely.'}`,
          subPrompt: `Dominant tone: ${analysis?.dominantColorTone || 'soft'} • Somatic sense: ${analysis?.somaticObservations || 'quiet stillness'}`,
          timestamp: 'Just now • ilo',
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch {
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ilo',
          text: "Thank you for sharing your artwork with me. I hold space for every color and line you create.",
          timestamp: 'Just now • ilo',
        };
        setMessages((prev) => [...prev, botMsg]);
      } finally {
        setIsTyping(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate sending voice note to voice signal analyzer
      setIsTyping(true);
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        text: '🎙️ Voice note shared (gentle whisper)',
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const res = await fetch('/api/analyze/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcriptText: 'User spoke with soft, slow breathing and intermittent thoughtful pauses.',
            sampleType: 'hesitant_trauma',
          }),
        });
        const data = await res.json();
        const v = data.analysis;

        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ilo',
          text: `I heard your voice softly. ${v?.summary || 'Your rhythm is so steady and gentle.'}`,
          subPrompt: `Acoustic presence: ${v?.speechRate || 'slow'} rhythm • ${v?.recommendedSupport || 'Gentle soothing presence'}`,
          timestamp: 'Just now • ilo',
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch {
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ilo',
          text: "I felt the gentle cadence of your voice. Thank you for resting your breath here.",
          timestamp: 'Just now • ilo',
        };
        setMessages((prev) => [...prev, botMsg]);
      } finally {
        setIsTyping(false);
      }
    } else {
      setIsRecording(true);
      soundEngine.playChime();
    }
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
            <div className="relative w-12 h-12 rounded-full p-1 shadow-xs bg-[#FCFAF6] border border-[#E5DED4] flex items-center justify-center">
              <img
                src={ASSETS.iloLogo}
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

          {/* Quick Discretion Button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearDiscreetly}
              aria-label="Quick privacy wipe"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-[#6E775C] hover:bg-[#F8F4EC] active:scale-95 transition-all shadow-2xs border border-[#D5CEBF]"
            >
              <span className="material-symbols-outlined text-[16px]">visibility_off</span>
              <span className="text-[11px] font-semibold">Clear</span>
            </button>
          </div>
        </div>

        {/* Facial Wellbeing Signals & Consent Capture Controller */}
        <FacialCaptureController
          sessionId={sessionId}
          isActiveConversation={!isCleared}
          sentimentShiftCounter={sentimentShiftCounter}
          onAnalysisReceived={(analysis) => {
            setLatestFacialOutput(analysis);
          }}
        />

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

                      {/* Autonomous Action Triggers from Gemini */}
                      {msg.actionsTriggered && msg.actionsTriggered.length > 0 && (
                        <div className="mt-2.5 space-y-1.5">
                          {msg.actionsTriggered.map((action, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#C47A5C]/30 flex flex-col gap-1 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-[#C47A5C] flex items-center gap-1 text-[11px]">
                                  <span className="material-symbols-outlined text-[15px]">spa</span>
                                  ilo Gentle Suggestion
                                </span>
                                <span className="text-[10px] text-[#7A7067] capitalize font-mono">
                                  {action.tool.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <p className="text-[12px] text-[#2C2824]">
                                {action.record?.summary || 'Suggested calming somatic support'}
                              </p>
                              {action.tool === 'recommend_activity' && (
                                <button
                                  type="button"
                                  onClick={() => onNavigate('activities')}
                                  className="self-start mt-1 px-3 py-1 rounded-full bg-[#C47A5C] text-white text-[11px] font-medium hover:bg-[#B36C4F] active:scale-95 transition shadow-2xs"
                                >
                                  Open Guided Practice
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Crisis Safety Resource Anchor */}
                      {msg.isCrisisAlert && (
                        <div className="mt-2.5 p-3 rounded-xl bg-[#FFF5F5] border border-[#C44D4D]/35 flex flex-col gap-1.5 text-xs text-[#2C2824]">
                          <div className="flex items-center gap-1.5 text-[#C44D4D] font-bold">
                            <span className="material-symbols-outlined text-[17px]">favorite</span>
                            <span>Gentle Human Support Is Ready</span>
                          </div>
                          <p className="text-[11px] text-[#56524D] leading-relaxed">
                            You are safe here and you are never alone. Confidential support workers and counselors are ready to be by your side whenever you feel ready.
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => onNavigate('support')}
                              className="px-3 py-1 rounded-full bg-[#C44D4D] text-white text-[11px] font-semibold hover:bg-[#B33E3E]"
                            >
                              View Sanctuary Helplines (988)
                            </button>
                          </div>
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
            {/* Expressive Artwork / Mood Sketch Upload */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload expressive mood sketch or drawing"
              title="Share an expressive drawing or mood image"
              className="w-12 h-12 rounded-full bg-white text-[#6E775C] hover:bg-[#FAF7F2] hover:text-[#C47A5C] border border-[#D5CEBF] flex items-center justify-center shrink-0 transition-all shadow-2xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">palette</span>
            </button>

            {/* Voice Note Button */}
            <button
              type="button"
              onClick={handleVoiceToggle}
              aria-label={isRecording ? 'Stop recording voice note' : 'Record voice note or whisper'}
              title={isRecording ? 'Tap to complete voice note' : 'Whisper or speak thoughts to ilo'}
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all shadow-2xs active:scale-95 ${
                isRecording ? 'bg-[#C47A5C] text-white animate-pulse' : 'bg-[#6E775C] text-white hover:bg-[#5C644D]'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {isRecording ? 'stop' : 'mic'}
              </span>
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
