import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Heart,
  Wind,
  ShieldAlert,
  Volume2,
  VolumeX,
  Globe,
  RotateCcw,
  Languages,
  Send,
  MessageSquare,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';

export type MascotState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'empathetic_concerned'
  | 'encouraging'
  | 'grounding';

export interface MascotResponse {
  reply_text: string;
  reply_language: string;
  mascot_state: MascotState;
  suggested_grounding_technique: string | null;
  distress_contribution: {
    sentiment_score: number;
    explanation: string;
  };
  isCrisisAlert?: boolean;
}

export interface MascotLanguage {
  code: string;
  name: string;
  native: string;
  flag: string;
  speechLang: string;
  samplePrompt: string;
}

export interface MascotConvoMessage {
  id: string;
  sender: 'user' | 'ilo';
  text: string;
  timestamp: string;
  language?: string;
  mascotState?: MascotState;
  groundingTechnique?: string | null;
}

export const SUPPORTED_LANGUAGES: MascotLanguage[] = [
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳', speechLang: 'mr-IN', samplePrompt: 'मला आज खूप ताण जाणवतोय आणि मन अस्वस्थ आहे.' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', speechLang: 'hi-IN', samplePrompt: 'मुझे बहुत घबराहट और बेचैनी हो रही है।' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', speechLang: 'te-IN', samplePrompt: 'ఈరోజు నాకు చాలా ఆందోళనగా ఉంది, భయంగా అనిపిస్తోంది.' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', speechLang: 'ta-IN', samplePrompt: 'எனக்கு இப்போது மன அழுத்தம் அதிகமாக உள்ளது.' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳', speechLang: 'bn-IN', samplePrompt: 'আমার মন খুব খারাপ লাগছে, কী করব?' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳', speechLang: 'kn-IN', samplePrompt: 'ನನಗೆ ತುಂಬಾ ಆತಂಕ ಮತ್ತು ಒತ್ತಡವೆನಿಸುತ್ತಿದೆ.' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳', speechLang: 'gu-IN', samplePrompt: 'મને આજે ખૂબ ચિંતા અને થાક લાગે છે.' },
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸', speechLang: 'en-US', samplePrompt: 'I feel a bit overwhelmed today.' },
  { code: 'auto', name: 'Auto Detect', native: 'Auto', flag: '🌐', speechLang: 'en-US', samplePrompt: 'How are you feeling today?' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', speechLang: 'es-ES', samplePrompt: 'Tengo un poco de estrés y cansancio hoy.' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵', speechLang: 'ja-JP', samplePrompt: '少し心が疲れていて、ほっとしたいです。' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', speechLang: 'fr-FR', samplePrompt: 'Je ressens un peu de fatigue et d’anxiété.' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪', speechLang: 'de-DE', samplePrompt: 'Ich brauche einen ruhigen Moment zum Durchatmen.' },
];

export const LANGUAGE_QUICK_PROMPTS: Record<string, Array<{ text: string; label: string }>> = {
  mr: [
    { text: 'मला खूप ताण येतोय आणि मन अस्वस्थ आहे.', label: '😌 ताण येतोय' },
    { text: 'मन शांत करण्यासाठी काय करू शकतोस?', label: '🌸 मन शांत करायला' },
    { text: 'आजचा दिवस खूप थकवणारा होता.', label: '🌿 दिवस थकवणारा' },
    { text: 'माझ्यासोबत एक शांत आणि हळूवार श्वास घेशील का?', label: '🌬️ एकत्र श्वास' },
  ],
  te: [
    { text: 'ఈరోజు నాకు చాలా ఆందోళనగా ఉంది, భయంగా అనిపిస్తోంది.', label: '😌 ఆందోళనగా ఉంది' },
    { text: 'నా మనసు ప్రశాంతంగా ఉండటానికి మార్గం చెప్పు.', label: '🌸 ప్రశాంతత కోసం' },
    { text: 'ఈ రోజు పనిలో చాలా ఒత్తిడి వచ్చింది, అలసిపోయాను.', label: '🌿 అలసటగా ఉంది' },
    { text: 'నాతో పాటు ఒక లోతైన ప్రశాంత శ్వాస తీసుకోగలవా?', label: '🌬️ నెమ్మదిగా శ్వాస' },
  ],
  hi: [
    { text: 'मुझे बहुत घबराहट और बेचैनी हो रही है।', label: '😌 घबराहट हो रही है' },
    { text: 'मन शांत करने के लिए कोई प्यारा उपाय बताओ।', label: '🌸 मन शांत करें' },
    { text: 'आज का दिन बहुत थका देने वाला और भारी था।', label: '🌿 दिन भारी था' },
    { text: 'क्या हम साथ मिलकर गहरी और शांत सांस ले सकते हैं?', label: '🌬️ गहरी सांस' },
  ],
  en: [
    { text: 'I feel a bit overwhelmed and tense right now.', label: '😌 Overwhelmed' },
    { text: 'Can you guide me through a calming thought?', label: '🌸 Calming thought' },
    { text: 'Today felt emotionally heavy and exhausting.', label: '🌿 Heavy day' },
    { text: "Let's take a slow deep breath together.", label: '🌬️ Deep breath' },
  ],
};

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  type: 'heart' | 'star';
  color: string;
}

interface ReactiveMascotProps {
  distressLevel?: number;
  onDistressChange?: (level: number) => void;
  onOpenGrounding?: (technique: string) => void;
  onCrisisTriggered?: () => void;
  className?: string;
}

export const ReactiveMascot: React.FC<ReactiveMascotProps> = ({
  distressLevel = 28,
  onDistressChange,
  onOpenGrounding,
  onCrisisTriggered,
  className = '',
}) => {
  // Core Mascot States
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micAmplitude, setMicAmplitude] = useState(0);
  const [speechText, setSpeechText] = useState<string | null>(null);
  const [lastReplyLanguage, setLastReplyLanguage] = useState<string>('mr');
  const [suggestedGrounding, setSuggestedGrounding] = useState<string | null>(null);
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false);

  // Multilingual Configuration
  const [selectedLang, setSelectedLang] = useState<MascotLanguage>(SUPPORTED_LANGUAGES[0]); // Default to Marathi
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // Ongoing Conversation History with ilo
  const [convoHistory, setConvoHistory] = useState<MascotConvoMessage[]>([
    {
      id: 'init-1',
      sender: 'ilo',
      text: "मी इथे तुझ्या सोबत आहे. एक शांत आणि हळूवार श्वास घे... तू इथे सुरक्षित आहेस. (नमस्कार! मी 'इलो' आहे — तुम्ही मराठी, हिन्दी किंवा తెలుగు मध्ये माझ्याशी संवाद साधू शकता)",
      timestamp: 'Just now',
      language: 'mr',
      mascotState: 'idle',
    },
  ]);
  const [typedMessage, setTypedMessage] = useState('');
  const [showConvoDrawer, setShowConvoDrawer] = useState(false);
  const convoEndRef = useRef<HTMLDivElement>(null);

  // Visual Wholesome States
  const [calmMode, setCalmMode] = useState(false); // Reduced motion toggle
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [touchHolding, setTouchHolding] = useState(false);
  const [isHopping, setIsHopping] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [groundingBreathPhase, setGroundingBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  // Interactive Eye Gaze Tracking
  const [gazeOffset, setGazeOffset] = useState({ x: 0, y: 0 });
  const mascotContainerRef = useRef<HTMLDivElement>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const synthVoiceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sync elevated distress with empathetic caring posture
  useEffect(() => {
    if (distressLevel > 60 && mascotState === 'idle') {
      setMascotState('empathetic_concerned');
    }
  }, [distressLevel, mascotState]);

  // Auto-scroll conversation transcript to latest message
  useEffect(() => {
    if (showConvoDrawer) {
      convoEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [convoHistory, showConvoDrawer]);

  // Natural Smooth Blinking Loop (every 3.2s - 4.5s)
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const scheduleNextBlink = () => {
      const delay = Math.random() * 1500 + 3200;
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 160);
      }, delay);
    };

    scheduleNextBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Guided breathing loop when in grounding mode (3.8s cycles)
  useEffect(() => {
    if (mascotState !== 'grounding') return;

    let phaseIndex = 0;
    const phases: Array<'Inhale' | 'Hold' | 'Exhale'> = ['Inhale', 'Hold', 'Exhale'];
    const timer = setInterval(() => {
      phaseIndex = (phaseIndex + 1) % phases.length;
      const nextPhase = phases[phaseIndex];
      setGroundingBreathPhase(nextPhase);

      if (soundEnabled && nextPhase === 'Inhale') {
        soundEngine.playCutePurr();
      }
    }, 3800);

    return () => clearInterval(timer);
  }, [mascotState, soundEnabled]);

  // Spawn floating wholesome heart / star particles
  const spawnWholesomeParticle = useCallback(() => {
    const newP: FloatingParticle = {
      id: Date.now() + Math.random(),
      x: (Math.random() - 0.5) * 80,
      y: -10 - Math.random() * 25,
      type: Math.random() > 0.4 ? 'heart' : 'star',
      color: Math.random() > 0.5 ? '#E78E7D' : '#6E775C',
    };
    setParticles((prev) => [...prev.slice(-5), newP]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newP.id));
    }, 1200);
  }, []);

  // Pointer tracking for physical gaze
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (calmMode || !mascotContainerRef.current) return;
    const rect = mascotContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);

    setGazeOffset({
      x: Math.max(-5, Math.min(5, deltaX * 5)),
      y: Math.max(-4, Math.min(4, deltaY * 4)),
    });
  };

  const handlePointerLeave = () => {
    setGazeOffset({ x: 0, y: 0 });
  };

  // Tap & Petting Touch Micro-Interactions (<200ms)
  const handlePointerDown = () => {
    // Quick micro-reaction hop & cheerful chirp
    setIsHopping(true);
    spawnWholesomeParticle();

    if (soundEnabled) {
      soundEngine.playCuteChirp(true);
    }

    if (mascotState === 'idle' || mascotState === 'empathetic_concerned') {
      setMascotState('encouraging');
      setTimeout(() => {
        setMascotState((prev) => (prev === 'encouraging' ? 'idle' : prev));
        setIsHopping(false);
      }, 500);
    } else {
      setTimeout(() => setIsHopping(false), 500);
    }

    // Holding for >450ms activates somatic grounding breathing loop
    holdTimerRef.current = setTimeout(() => {
      setTouchHolding(true);
      setMascotState('grounding');
      if (soundEnabled) soundEngine.playCutePurr();
      setSpeechText(
        selectedLang.code === 'hi'
          ? 'साथ में शांत होकर सांस लें... आप बिल्कुल सुरक्षित हैं।'
          : selectedLang.code === 'es'
          ? 'Respiremos juntos con calma... Aquí estás en un espacio seguro.'
          : selectedLang.code === 'ja'
          ? '一緒にゆっくり呼吸しようね... ここは安心できる場所だよ。'
          : 'Holding quiet space with you... take a gentle breath in.'
      );
    }, 450);
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (touchHolding) {
      setTouchHolding(false);
      setTimeout(() => {
        setMascotState('idle');
        setSpeechText(null);
      }, 1400);
    }
  };

  // Live microphone audio metering
  const startLiveMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAmplitude = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normAmp = Math.min(100, Math.round((average / 128) * 100));
        setMicAmplitude(normAmp);
        animFrameRef.current = requestAnimationFrame(updateAmplitude);
      };
      updateAmplitude();
    } catch (err) {
      console.warn('[Mascot] Mic stream not accessible, using fallback simulation:', err);
      const interval = setInterval(() => {
        setMicAmplitude(Math.floor(Math.random() * 55 + 15));
      }, 110);
      return () => clearInterval(interval);
    }
  };

  const stopLiveMicrophone = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setMicAmplitude(0);
  };

  // Multilingual Voice Interaction (STT -> Gemini -> TTS)
  const toggleListening = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopLiveMicrophone();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setMascotState('listening');

    // Prompt in active language
    const promptMsg =
      selectedLang.code === 'hi'
        ? 'मैं सुन रहा हूँ... दिल से अपनी बात कहिए।'
        : selectedLang.code === 'es'
        ? 'Te escucho con cariño... habla con calma.'
        : selectedLang.code === 'ja'
        ? 'あなたの声を聞いているよ... ゆっくり話してみてね。'
        : 'Listening gently to your words and breath...';
    setSpeechText(promptMsg);
    await startLiveMicrophone();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;
        // Bind recognition to the selected language
        recognition.lang = selectedLang.speechLang;

        recognition.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          stopLiveMicrophone();
          setIsListening(false);
          await dispatchMascotTurn(transcript, 'voice');
        };

        recognition.onerror = async (event: any) => {
          console.warn('[Mascot] Speech recognition error:', event.error);
          stopLiveMicrophone();
          setIsListening(false);
          await dispatchMascotTurn(selectedLang.samplePrompt, 'voice');
        };

        recognition.onend = () => {
          stopLiveMicrophone();
          setIsListening(false);
        };

        recognition.start();
      } catch (err) {
        console.warn('[Mascot] SpeechRecognition failed to initialize:', err);
        fallbackVoiceCycle();
      }
    } else {
      fallbackVoiceCycle();
    }
  };

  const fallbackVoiceCycle = () => {
    setTimeout(async () => {
      stopLiveMicrophone();
      setIsListening(false);
      await dispatchMascotTurn(selectedLang.samplePrompt, 'voice');
    }, 2800);
  };

  // Dispatch turn to backend structured endpoint with preferredLanguage and record conversation history
  const dispatchMascotTurn = async (userPrompt: string, modality: 'voice' | 'text' | 'touch') => {
    setMascotState('thinking');

    // Record user message in conversation transcript
    const userMsg: MascotConvoMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: selectedLang.code,
    };
    setConvoHistory((prev) => [...prev, userMsg]);

    // Cute reflecting phrase per language
    setSpeechText(
      selectedLang.code === 'mr'
        ? 'गहरे विचार करत आहे... मी तुझ्या सोबत आहे...'
        : selectedLang.code === 'te'
        ? 'ప్రేమతో ఆలోచిస్తున్నాను... నీ తోడుగానే ఉన్నాను...'
        : selectedLang.code === 'hi'
        ? 'गहरे प्यार और ध्यान से सोच रहा हूँ...'
        : selectedLang.code === 'es'
        ? 'Reflexionando con ternura...'
        : selectedLang.code === 'ja'
        ? '優しく思いを巡らせています...'
        : 'Reflecting warmly...'
    );

    try {
      const res = await fetch('/api/chat/mascot-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'sanctuary-user-session',
          message: userPrompt,
          distressLevel,
          currentMascotState: mascotState,
          inputModality: modality,
          preferredLanguage: selectedLang.code,
        }),
      });

      if (!res.ok) throw new Error('Mascot turn request failed');
      const data: MascotResponse = await res.json();

      if (data.isCrisisAlert) {
        setIsCrisisModalOpen(true);
        if (onCrisisTriggered) onCrisisTriggered();
      }

      if (data.suggested_grounding_technique) {
        setSuggestedGrounding(data.suggested_grounding_technique);
      }

      const replyLanguage = data.reply_language || selectedLang.code;
      setLastReplyLanguage(replyLanguage);

      // Record ilo's response in conversation transcript
      const iloMsg: MascotConvoMessage = {
        id: `ilo-${Date.now()}`,
        sender: 'ilo',
        text: data.reply_text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: replyLanguage,
        mascotState: data.mascot_state,
        groundingTechnique: data.suggested_grounding_technique,
      };
      setConvoHistory((prev) => [...prev, iloMsg]);

      speakReply(data.reply_text, data.mascot_state, replyLanguage);
    } catch (err) {
      console.error('[Mascot] Dispatch error:', err);
      const fallback =
        selectedLang.code === 'mr'
          ? 'मी इथे तुझ्या जवळच बसून हळूवार श्वास घेत आहे. तुला हवं तितका वेळ घे, तू सुरक्षित आहेस.'
          : selectedLang.code === 'te'
          ? 'నేను ఇక్కడే నీ దగ్గరే ఉన్నాను. నెమ్మదిగా శ్వాస తీసుకో, నువ్వు సురక్షితంగా ఉన్నావు.'
          : selectedLang.code === 'hi'
          ? 'मैं यहीं आपके पास शांत उपस्थिति में बैठा हूँ। जब तक चाहें सांस लें, आप सुरक्षित हैं।'
          : selectedLang.code === 'es'
          ? 'Estoy aquí a tu ladito en serena compañía. Tómate todo el tiempo que necesites.'
          : selectedLang.code === 'ja'
          ? 'ずっとここにいるよ。ゆっくり深呼吸して心を休めてね。'
          : 'I am right here with you in gentle quietude. Take all the time you need.';

      const fallbackMsg: MascotConvoMessage = {
        id: `ilo-err-${Date.now()}`,
        sender: 'ilo',
        text: fallback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: selectedLang.code,
        mascotState: 'empathetic_concerned',
      };
      setConvoHistory((prev) => [...prev, fallbackMsg]);

      speakReply(fallback, 'empathetic_concerned', selectedLang.code);
    }
  };

  // Handle user sending text message
  const handleSendMessage = () => {
    if (!typedMessage.trim() || isSpeaking) return;
    const msg = typedMessage.trim();
    setTypedMessage('');
    dispatchMascotTurn(msg, 'text');
  };

  // Adorable Cute Voice TTS Engine with Multilingual Matching
  const speakReply = (text: string, nextState: MascotState, replyLang = 'mr') => {
    setSpeechText(text);
    setIsSpeaking(true);
    setMascotState('speaking');

    // Sweet character greeting chirp
    if (soundEnabled) {
      soundEngine.playCuteChirp(nextState === 'encouraging');
    }

    if ('speechSynthesis' in window && soundEnabled) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      synthVoiceRef.current = utterance;

      // Cute Voice Tuning: sweet higher pitch + cozy gentle tempo
      utterance.pitch = calmMode ? 1.25 : 1.34; // Sweet, wholesome, cute mascot pitch
      utterance.rate = calmMode ? 0.88 : 0.94; // Unhurried, comforting pace
      utterance.volume = 0.95;

      // Select voice suited for the target language
      const langPrefix =
        replyLang && replyLang !== 'auto'
          ? replyLang.toLowerCase()
          : selectedLang.code !== 'auto'
          ? selectedLang.code
          : 'mr';

      const targetLangDef =
        SUPPORTED_LANGUAGES.find((l) => l.code === langPrefix) || SUPPORTED_LANGUAGES[0];
      utterance.lang = targetLangDef.speechLang;

      const voices = window.speechSynthesis.getVoices();
      let matchingVoices = voices.filter(
        (v) =>
          v.lang.toLowerCase().startsWith(langPrefix) ||
          v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix)
      );

      // Smart Indian language voice fallbacks
      if (
        matchingVoices.length === 0 &&
        (langPrefix === 'mr' || langPrefix === 'te' || langPrefix === 'ta' || langPrefix === 'kn' || langPrefix === 'bn' || langPrefix === 'gu')
      ) {
        // Look for Hindi or Indian English voice that pronounces Indic phonemes warmly
        matchingVoices = voices.filter(
          (v) =>
            v.lang.toLowerCase().startsWith('hi') ||
            v.lang.toLowerCase().includes('in') ||
            v.name.includes('India') ||
            v.name.includes('Hindi') ||
            v.name.includes('Google हिन्दी')
        );
      }

      // Prioritize cute, pleasant, feminine, or natural voices for that anime/pet mascot warmth
      const cuteVoice =
        matchingVoices.find(
          (v) =>
            v.name.includes('Natural') ||
            v.name.includes('Samantha') ||
            v.name.includes('Victoria') ||
            v.name.includes('Zira') ||
            v.name.includes('Kyoko') ||
            v.name.includes('Amelie') ||
            v.name.includes('Flo') ||
            v.name.includes('Google') ||
            v.name.includes('Female') ||
            v.name.includes('Kalpana') ||
            v.name.includes('Swara') ||
            v.name.includes('Madhur') ||
            v.name.includes('Lekha') ||
            v.name.includes('Hemant')
        ) ||
        matchingVoices[0] ||
        voices.find((v) => v.name.includes('Natural') || v.name.includes('Samantha')) ||
        voices[0];

      if (cuteVoice) {
        utterance.voice = cuteVoice;
      }

      // Smooth mouth viseme modulation synced with speech
      const mouthInterval = setInterval(() => {
        setMicAmplitude(Math.floor(Math.random() * 55 + 22));
      }, 100);

      utterance.onend = () => {
        clearInterval(mouthInterval);
        setMicAmplitude(0);
        setIsSpeaking(false);
        setMascotState(nextState);

        // Soft purr on finish
        if (soundEnabled && nextState === 'encouraging') {
          soundEngine.playCutePurr();
        }
      };

      utterance.onerror = () => {
        clearInterval(mouthInterval);
        setMicAmplitude(0);
        setIsSpeaking(false);
        setMascotState(nextState);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Silent mouth simulation for environments without speech synthesis
      const durationMs = Math.min(6500, Math.max(3000, text.length * 50));
      const mouthInterval = setInterval(() => {
        setMicAmplitude(Math.floor(Math.random() * 50 + 18));
      }, 110);

      setTimeout(() => {
        clearInterval(mouthInterval);
        setMicAmplitude(0);
        setIsSpeaking(false);
        setMascotState(nextState);
      }, durationMs);
    }
  };

  // Replay speech with cute voice
  const handleReplayVoice = () => {
    if (speechText) {
      speakReply(speechText, mascotState === 'speaking' ? 'idle' : mascotState, lastReplyLanguage);
    }
  };

  return (
    <div
      id="reactive-mascot-container"
      ref={mascotContainerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative flex flex-col items-center select-none w-full max-w-sm mx-auto ${className}`}
    >
      {/* Wholesome Background Glow */}
      <div
        className={`absolute -top-6 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${
          mascotState === 'grounding'
            ? 'bg-emerald-300/30 scale-125'
            : mascotState === 'empathetic_concerned'
            ? 'bg-[#E7B9B2]/40 scale-110'
            : mascotState === 'listening'
            ? 'bg-indigo-300/35 scale-115'
            : mascotState === 'encouraging'
            ? 'bg-amber-200/40 scale-120'
            : 'bg-[#C47A5C]/20 scale-100'
        }`}
      />
      <div className="absolute top-12 -right-6 w-44 h-44 rounded-full bg-[#A7B59C]/25 blur-2xl pointer-events-none" />

      {/* Floating Wholesome Particles (Hearts and Stars) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-out animate-in fade-in"
            style={{
              transform: `translate(${p.x}px, ${p.y - 45}px)`,
              opacity: 0.9,
            }}
          >
            {p.type === 'heart' ? (
              <Heart className="w-4 h-4 fill-current animate-bounce" style={{ color: p.color }} />
            ) : (
              <Sparkles className="w-4 h-4 animate-spin" style={{ color: p.color }} />
            )}
          </div>
        ))}
      </div>

      {/* Top Status & Controls Bar */}
      <div className="w-full flex items-center justify-between px-2 mb-2.5 z-30">
        {/* Mascot State Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#D8C2BA]/60 shadow-xs">
          <span
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              mascotState === 'grounding'
                ? 'bg-emerald-500 animate-pulse'
                : mascotState === 'listening'
                ? 'bg-indigo-500 animate-ping'
                : mascotState === 'thinking'
                ? 'bg-amber-500'
                : mascotState === 'empathetic_concerned'
                ? 'bg-[#C47A5C]'
                : mascotState === 'encouraging'
                ? 'bg-rose-400'
                : 'bg-emerald-600'
            }`}
          />
          <span className="text-[11px] font-semibold text-[#595048] tracking-wider uppercase">
            {mascotState === 'empathetic_concerned'
              ? 'Empathetic'
              : mascotState === 'grounding'
              ? `Grounding (${groundingBreathPhase})`
              : mascotState === 'encouraging'
              ? 'Wholesome & Happy'
              : mascotState}
          </span>
        </div>

        {/* Right Controls: Multilingual selector, Audio, Calm mode */}
        <div className="flex items-center gap-1.5">
          {/* Language Selector Dropdown Button */}
          <div className="relative">
            <button
              id="mascot-lang-menu-button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#D8C2BA]/60 text-[#595048] hover:bg-white text-[11px] font-medium shadow-xs transition-colors"
              title="Change mascot language"
            >
              <span>{selectedLang.flag}</span>
              <span className="max-w-[55px] truncate">{selectedLang.native}</span>
            </button>

            {/* Language Popover Menu */}
            {isLangMenuOpen && (
              <div className="absolute right-0 top-8 w-44 bg-white/98 backdrop-blur-md rounded-2xl border border-[#D8C2BA]/70 shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                  Select Mascot Language
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLang(lang);
                        setIsLangMenuOpen(false);
                        if (soundEnabled) soundEngine.playCuteChirp(true);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs transition-colors ${
                        selectedLang.code === lang.code
                          ? 'bg-[#E7B9B2]/20 font-semibold text-[#C47A5C]'
                          : 'text-[#595048] hover:bg-stone-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.native}</span>
                      </span>
                      {selectedLang.code === lang.code && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C47A5C]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Audio toggle button */}
          <button
            id="mascot-sound-toggle"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) soundEngine.playCuteChirp(true);
            }}
            className="p-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#D8C2BA]/60 text-[#595048] hover:bg-white text-xs shadow-xs transition-colors"
            title={soundEnabled ? 'Mute cute voice' : 'Enable cute voice'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-[#C47A5C]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-stone-400" />
            )}
          </button>

          {/* Calm Mode / Reduced Motion */}
          <button
            id="mascot-calm-mode-toggle"
            onClick={() => setCalmMode(!calmMode)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium shadow-xs transition-all ${
              calmMode
                ? 'bg-[#6E775C] text-white'
                : 'bg-white/90 backdrop-blur-md text-[#595048] border border-[#D8C2BA]/60 hover:bg-white'
            }`}
            title="Toggle reduced motion / calm mode"
          >
            {calmMode ? 'Calm' : 'Calm'}
          </button>
        </div>
      </div>

      {/* Interactive Mascot Character Stage */}
      <div
        id="mascot-stage"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="relative w-56 h-56 flex items-center justify-center cursor-pointer touch-none"
        title="Tap to play • Hold for gentle somatic breathing"
      >
        {/* Somatic Grounding Radiant Rings */}
        {mascotState === 'grounding' && (
          <div
            className={`absolute rounded-full border-2 border-emerald-400/50 transition-all duration-[3800ms] ease-in-out ${
              groundingBreathPhase === 'Inhale'
                ? 'w-52 h-52 opacity-80 border-emerald-500 scale-120'
                : groundingBreathPhase === 'Hold'
                ? 'w-48 h-48 opacity-60 border-teal-400 scale-110'
                : 'w-40 h-40 opacity-25 border-emerald-300 scale-95'
            }`}
          />
        )}

        {/* Listening Ambient Waves */}
        {isListening && (
          <div
            className="absolute rounded-full border border-indigo-400/40 bg-indigo-50/20 transition-all duration-100 ease-out"
            style={{
              width: `${175 + micAmplitude * 0.75}px`,
              height: `${175 + micAmplitude * 0.75}px`,
            }}
          />
        )}

        {/* The Wholesome SVG Character: ilo */}
        <div
          className={`relative z-10 transition-all ${
            calmMode ? 'duration-500' : 'duration-300'
          } ${
            isHopping
              ? '-translate-y-3 scale-105'
              : mascotState === 'thinking'
              ? 'rotate-3 -translate-y-1'
              : mascotState === 'empathetic_concerned'
              ? 'scale-105 translate-y-1'
              : mascotState === 'listening'
              ? '-translate-y-1.5'
              : 'translate-y-0'
          }`}
          style={{
            transform: calmMode
              ? undefined
              : isHopping
              ? 'translateY(-14px) scale(1.05)'
              : `rotate(${gazeOffset.x * 0.7}deg) translateY(${
                  mascotState === 'idle' ? '0px' : '-2px'
                })`,
          }}
        >
          <svg
            width="186"
            height="186"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-[0_14px_28px_rgba(110,119,92,0.22)]"
          >
            <defs>
              {/* Ultra-soft pearly warm mochi gradient */}
              <linearGradient id="iloBodyGrad" x1="40" y1="20" x2="160" y2="185" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFF9F5" />
                <stop offset="0.35" stopColor="#F9DDD6" />
                <stop offset="0.75" stopColor="#EEABA0" />
                <stop offset="1" stopColor="#C47A5C" />
              </linearGradient>

              {/* Rosy glowing blush */}
              <radialGradient id="iloBlush" cx="50%" cy="50%" r="50%">
                <stop stopColor="#E77866" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#E77866" stopOpacity="0" />
              </radialGradient>

              {/* Gentle belly patch */}
              <linearGradient id="iloBelly" x1="100" y1="95" x2="100" y2="170" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#FBEAE4" stopOpacity="0.45" />
              </linearGradient>

              {/* Ear inner warmth */}
              <linearGradient id="iloEarInner" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#F19B8D" stopOpacity="0.8" />
                <stop offset="1" stopColor="#D87867" stopOpacity="0.5" />
              </linearGradient>

              {/* Soft Heart Gem */}
              <radialGradient id="iloHeartGlow" cx="50%" cy="50%" r="50%">
                <stop stopColor="#FF7676" />
                <stop offset="100%" stopColor="#E74C3C" />
              </radialGradient>
            </defs>

            {/* Left Cute Ear (Perks and wiggles on interaction) */}
            <g
              className={`origin-[68px_52px] transition-transform ${
                isListening
                  ? '-rotate-12 scale-110 duration-200'
                  : mascotState === 'encouraging' || isHopping
                  ? '-rotate-8 scale-105 duration-200'
                  : 'rotate-0 duration-700'
              }`}
            >
              <path
                d="M 58 68 C 40 28, 68 16, 80 44 Z"
                fill="#EEABA0"
              />
              <path
                d="M 64 62 C 52 34, 70 26, 76 46 Z"
                fill="url(#iloEarInner)"
              />
            </g>

            {/* Right Cute Ear */}
            <g
              className={`origin-[132px_52px] transition-transform ${
                isListening
                  ? 'rotate-12 scale-110 duration-200'
                  : mascotState === 'encouraging' || isHopping
                  ? 'rotate-8 scale-105 duration-200'
                  : 'rotate-0 duration-700'
              }`}
            >
              <path
                d="M 142 68 C 160 28, 132 16, 120 44 Z"
                fill="#EEABA0"
              />
              <path
                d="M 136 62 C 148 34, 130 26, 124 46 Z"
                fill="url(#iloEarInner)"
              />
            </g>

            {/* Main Rounded Mochi Body */}
            <path
              d="M 100 36 C 158 36, 174 74, 174 122 C 174 167, 144 180, 100 180 C 56 180, 26 167, 26 122 C 26 74, 42 36, 100 36 Z"
              fill="url(#iloBodyGrad)"
              className={`transition-all ${
                mascotState === 'grounding'
                  ? groundingBreathPhase === 'Inhale'
                    ? 'scale-105 duration-[3800ms]'
                    : 'scale-98 duration-[3800ms]'
                  : 'duration-700'
              }`}
            />

            {/* Soft Inner Belly */}
            <ellipse cx="100" cy="132" rx="44" ry="35" fill="url(#iloBelly)" />

            {/* Rosy Cheeks with gentle glowing pulse */}
            <circle
              cx="56"
              cy="116"
              r="15"
              fill="url(#iloBlush)"
              className={`transition-opacity ${
                mascotState === 'encouraging' || isHopping ? 'opacity-90' : 'opacity-65'
              }`}
            />
            <circle
              cx="144"
              cy="116"
              r="15"
              fill="url(#iloBlush)"
              className={`transition-opacity ${
                mascotState === 'encouraging' || isHopping ? 'opacity-90' : 'opacity-65'
              }`}
            />

            {/* Left Eye */}
            <g transform={`translate(${gazeOffset.x}, ${gazeOffset.y})`}>
              {isBlinking ? (
                // Natural closed blink line
                <path
                  d="M 64 100 C 68 102, 78 102, 82 100"
                  stroke="#3A2922"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : mascotState === 'encouraging' || isHopping ? (
                // Wholesome happy crescent eyes ( ^ ‿ ^ )
                <path
                  d="M 64 102 C 68 94, 78 94, 82 102"
                  stroke="#3A2922"
                  strokeWidth="3.6"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : mascotState === 'empathetic_concerned' ? (
                // Soft caring drooping eye with tender eyebrow
                <>
                  <path
                    d="M 65 91 C 71 89, 79 92, 82 95"
                    stroke="#5A3E36"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <ellipse cx="73" cy="101" rx="7" ry="8" fill="#32231D" />
                  <circle cx="70.5" cy="98.5" r="2.6" fill="#FFFFFF" />
                  <circle cx="75" cy="104" r="1.3" fill="#FFFFFF" />
                </>
              ) : (
                // Large sparkly anime-style eye
                <>
                  <ellipse cx="73" cy="100" rx="7.5" ry="8.5" fill="#32231D" />
                  <ellipse cx="73" cy="102" rx="5.5" ry="5.5" fill="#4D352B" opacity="0.6" />
                  {/* Primary & secondary catchlights */}
                  <circle cx="70" cy="97" r="2.8" fill="#FFFFFF" />
                  <circle cx="75.5" cy="103" r="1.4" fill="#FFFFFF" />
                </>
              )}
            </g>

            {/* Right Eye */}
            <g transform={`translate(${gazeOffset.x}, ${gazeOffset.y})`}>
              {isBlinking ? (
                <path
                  d="M 118 100 C 122 102, 132 102, 136 100"
                  stroke="#3A2922"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : mascotState === 'encouraging' || isHopping ? (
                <path
                  d="M 118 102 C 122 94, 132 94, 136 102"
                  stroke="#3A2922"
                  strokeWidth="3.6"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : mascotState === 'empathetic_concerned' ? (
                <>
                  <path
                    d="M 135 91 C 129 89, 121 92, 118 95"
                    stroke="#5A3E36"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <ellipse cx="127" cy="101" rx="7" ry="8" fill="#32231D" />
                  <circle cx="124.5" cy="98.5" r="2.6" fill="#FFFFFF" />
                  <circle cx="129" cy="104" r="1.3" fill="#FFFFFF" />
                </>
              ) : (
                <>
                  <ellipse cx="127" cy="100" rx="7.5" ry="8.5" fill="#32231D" />
                  <ellipse cx="127" cy="102" rx="5.5" ry="5.5" fill="#4D352B" opacity="0.6" />
                  <circle cx="124" cy="97" r="2.8" fill="#FFFFFF" />
                  <circle cx="129.5" cy="103" r="1.4" fill="#FFFFFF" />
                </>
              )}
            </g>

            {/* Little Soft Nose */}
            <ellipse cx="100" cy="107" rx="2.5" ry="1.8" fill="#7D4E43" />

            {/* Wholesome Mouth (Dynamic Visemes during speech, omega smile at rest) */}
            {isSpeaking ? (
              <g>
                <ellipse
                  cx="100"
                  cy="119"
                  rx={Math.max(5, micAmplitude * 0.15)}
                  ry={Math.max(4, micAmplitude * 0.22)}
                  fill="#3A2922"
                  className="transition-all duration-75"
                />
                {/* Cute little rosy tongue inside open mouth */}
                <ellipse
                  cx="100"
                  cy={119 + Math.max(1, micAmplitude * 0.08)}
                  rx={Math.max(3, micAmplitude * 0.09)}
                  ry={Math.max(2, micAmplitude * 0.1)}
                  fill="#F08A7C"
                />
              </g>
            ) : mascotState === 'encouraging' || isHopping ? (
              // Sweet open happy cat-lip smile
              <path
                d="M 92 116 Q 96 122 100 118 Q 104 122 108 116"
                stroke="#3A2922"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
            ) : mascotState === 'empathetic_concerned' ? (
              // Tender caring small mouth
              <path
                d="M 95 118 C 98 119.5, 102 119.5, 105 118"
                stroke="#3A2922"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              // Cute kitten omega resting mouth ( ω )
              <path
                d="M 94 117 Q 97 121 100 118 Q 103 121 106 117"
                stroke="#3A2922"
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />
            )}

            {/* Cute Paws (Move to chest in somatic hand-on-heart during grounding/holding) */}
            {mascotState === 'grounding' || touchHolding ? (
              // Paws resting tenderly over the heart
              <g className="transition-transform duration-500">
                <ellipse cx="88" cy="132" rx="9" ry="7" fill="#F8CFCA" stroke="#E39D90" strokeWidth="1.2" />
                <ellipse cx="112" cy="132" rx="9" ry="7" fill="#F8CFCA" stroke="#E39D90" strokeWidth="1.2" />
                {/* Glowing heart between paws */}
                <path
                  d="M 100 131 C 98 127, 93 127, 93 131 C 93 135, 100 138, 100 138 C 100 138, 107 135, 107 131 C 107 127, 102 127, 100 131 Z"
                  fill="url(#iloHeartGlow)"
                  className="animate-pulse"
                />
              </g>
            ) : (
              // Relaxed little paws resting on belly
              <g className="transition-transform duration-500">
                <ellipse cx="80" cy="148" rx="8.5" ry="6.5" fill="#F8CFCA" stroke="#E39D90" strokeWidth="1" />
                <ellipse cx="120" cy="148" rx="8.5" ry="6.5" fill="#F8CFCA" stroke="#E39D90" strokeWidth="1" />
              </g>
            )}

            {/* Mindful Sprout on Head (Sways in natural breeze) */}
            <g
              className={`origin-[100px_36px] transition-transform ${
                isHopping ? 'rotate-12 duration-200' : 'rotate-0 duration-1000'
              }`}
            >
              <path
                d="M 100 36 C 100 23, 106 14, 114 16 C 122 18, 112 30, 100 36 Z"
                fill="#7BAA6F"
              />
              <path
                d="M 100 36 C 100 24, 94 17, 88 20 C 82 23, 90 31, 100 36 Z"
                fill="#96C289"
              />
            </g>
          </svg>
        </div>
      </div>

      {/* Tactile Interaction Hint */}
      <div className="text-[12px] text-[#595048]/80 font-medium text-center -mt-1 mb-2">
        {touchHolding ? (
          <span className="text-emerald-700 font-semibold flex items-center justify-center gap-1.5">
            <Wind className="w-3.5 h-3.5 animate-spin" /> Inhale slowly... feeling safe and held
          </span>
        ) : isListening ? (
          <span className="text-indigo-600 font-semibold flex items-center justify-center gap-1.5">
            <Mic className="w-3.5 h-3.5 animate-pulse" /> Listening in {selectedLang.native}...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1">
            <span>Tap to connect</span>
            <span className="text-stone-300">•</span>
            <span>Hold to breathe</span>
          </span>
        )}
      </div>

      {/* Mindful Spoken Speech Bubble (LLM / Cute Voice Output) */}
      {speechText && (
        <div
          id="mascot-speech-bubble"
          className="relative w-full max-w-xs mt-1 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#D8C2BA]/70 shadow-sm text-left animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#C47A5C] shrink-0 mt-0.5" />
              <p className="text-[13px] text-[#3D2E28] font-normal leading-relaxed">
                {speechText}
              </p>
            </div>

            {/* Replay voice button */}
            <button
              onClick={handleReplayVoice}
              className="p-1 rounded-full text-[#C47A5C] hover:bg-[#E7B9B2]/20 transition-colors shrink-0"
              title="Hear cute voice again"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Language tag in bubble */}
          <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span>Voice: {lastReplyLanguage.toUpperCase()}</span>
            </span>
            <span className="text-[10px] text-[#C47A5C] font-medium">ilo cute companion</span>
          </div>
        </div>
      )}

      {/* Suggested Grounding Technique Action Chip */}
      {suggestedGrounding && (
        <button
          id="mascot-suggested-grounding-button"
          onClick={() => {
            if (onOpenGrounding) onOpenGrounding(suggestedGrounding);
            setMascotState('grounding');
          }}
          className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[12px] font-medium shadow-xs hover:bg-emerald-100 transition-colors"
        >
          <Wind className="w-3.5 h-3.5 text-emerald-600" />
          <span>Anchor: {suggestedGrounding}</span>
        </button>
      )}

      {/* Quick Indian & Multilingual Language Switcher Bar */}
      <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap w-full max-w-sm px-1">
        {[
          { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
          { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
          { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
          { code: 'en', label: 'English', flag: '🇺🇸' },
        ].map((item) => {
          const isSelected = selectedLang.code === item.code;
          return (
            <button
              key={item.code}
              id={`lang-pill-${item.code}`}
              onClick={() => {
                const target = SUPPORTED_LANGUAGES.find((l) => l.code === item.code);
                if (target) {
                  setSelectedLang(target);
                  soundEngine.playCuteChirp(true);
                }
              }}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all duration-200 flex items-center gap-1 shadow-2xs ${
                isSelected
                  ? 'bg-[#C47A5C] text-white border-[#B3694D] shadow-xs'
                  : 'bg-white/80 text-[#595048] border-[#D8C2BA]/60 hover:bg-[#E7B9B2]/20'
              }`}
            >
              <span>{item.flag}</span>
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* More languages selector dropdown */}
        <div className="relative">
          <button
            id="more-languages-menu-btn"
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="text-[11px] font-medium px-2 py-1 rounded-full border bg-white/80 border-[#D8C2BA]/60 text-[#595048] hover:bg-[#E7B9B2]/20 transition-colors flex items-center gap-1"
            title="More languages"
          >
            <Languages className="w-3 h-3" />
            <span>More</span>
            {isLangMenuOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {isLangMenuOpen && (
            <div className="absolute right-0 bottom-full mb-1 z-50 w-44 max-h-52 overflow-y-auto bg-white rounded-2xl p-1.5 border border-[#D8C2BA]/80 shadow-xl space-y-0.5 animate-in fade-in">
              <div className="px-2 py-1 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                Indian & Global Languages
              </div>
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setSelectedLang(l);
                    setIsLangMenuOpen(false);
                    soundEngine.playCuteChirp(true);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    selectedLang.code === l.code
                      ? 'bg-[#C47A5C]/15 text-[#C47A5C] font-semibold'
                      : 'text-[#595048] hover:bg-stone-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{l.flag}</span>
                    <span>{l.native}</span>
                  </span>
                  <span className="text-[10px] text-stone-400">{l.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Conversation Input & Controls Bar */}
      <div className="mt-2.5 w-full max-w-sm px-1 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-[#D8C2BA]/70 shadow-xs">
          {/* Text Input for Typing in Marathi / Hindi / Telugu / English */}
          <input
            id="mascot-convo-input"
            type="text"
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder={
              selectedLang.code === 'mr'
                ? 'मराठीत बोला किंवा टाईप करा...'
                : selectedLang.code === 'te'
                ? 'తెలుగులో మాట్లాడండి లేదా రాయండి...'
                : selectedLang.code === 'hi'
                ? 'हिन्दी में बात करें या लिखें...'
                : `Converse in ${selectedLang.native}...`
            }
            className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-[#3D2E28] placeholder:text-stone-400 focus:outline-hidden"
          />

          {/* Send text button */}
          <button
            id="mascot-send-text-btn"
            onClick={handleSendMessage}
            disabled={!typedMessage.trim() || isSpeaking}
            className={`p-2 rounded-xl transition-colors shrink-0 ${
              typedMessage.trim() && !isSpeaking
                ? 'bg-[#C47A5C] text-white hover:bg-[#B3694D] active:scale-95'
                : 'text-stone-300 bg-stone-100 cursor-not-allowed'
            }`}
            title="Send to ilo"
          >
            <Send className="w-3.5 h-3.5" />
          </button>

          {/* Voice Microphone Toggle */}
          <button
            id="mascot-voice-button"
            onClick={toggleListening}
            disabled={isSpeaking}
            className={`p-2 rounded-xl transition-all duration-200 shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white shadow-rose-200 animate-pulse'
                : 'bg-stone-100 text-[#595048] hover:bg-[#E7B9B2]/30 active:scale-95'
            }`}
            title={`Speak with ilo in ${selectedLang.native}`}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          {/* Quick Box Breathing Trigger */}
          <button
            id="mascot-quick-grounding-button"
            onClick={() => {
              setMascotState('grounding');
              const breathPrompt =
                selectedLang.code === 'mr'
                  ? 'चल, आपण दोघे मिळून एक शांत आणि हळूवार श्वास घेऊया. तू सुरक्षित आहेस.'
                  : selectedLang.code === 'te'
                  ? 'మనమిద్దరం కలిసి ఒక నెమ్మదైన ప్రశాంతమైన శ्वాస తీసుకుందాం.'
                  : selectedLang.code === 'hi'
                  ? 'चलिए साथ मिलकर चार धीमी और शांत सांसें लेते हैं।'
                  : selectedLang.code === 'es'
                  ? 'Hagamos una pausa de cuatro respiraciones suaves juntos.'
                  : selectedLang.code === 'ja'
                  ? '一緒に4回、ゆっくり深呼吸しましょう。'
                  : "Let's pause the world for a moment and take four quiet breaths together.";
              speakReply(breathPrompt, 'grounding', selectedLang.code);
            }}
            className="p-2 rounded-xl bg-stone-100 text-[#595048] hover:bg-emerald-100 hover:text-emerald-800 transition-colors shrink-0"
            title="Start Box Breathing with ilo"
          >
            <Wind className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Conversation drawer toggle and prompt chips */}
        <div className="flex items-center justify-between gap-1 px-1">
          <button
            id="toggle-convo-drawer-btn"
            onClick={() => setShowConvoDrawer(!showConvoDrawer)}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#C47A5C] hover:text-[#B3694D] transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>
              {showConvoDrawer ? 'Hide Convo' : 'View Full Convo'} ({convoHistory.length})
            </span>
            {showConvoDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {convoHistory.length > 1 && (
            <button
              onClick={() => {
                setConvoHistory([convoHistory[0]]);
                soundEngine.playCuteChirp(true);
              }}
              className="text-[10px] text-stone-400 hover:text-rose-500 transition-colors flex items-center gap-1"
              title="Clear conversation"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Multilingual Quick Conversational Prompt Chips */}
      <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap w-full max-w-sm px-1">
        {(LANGUAGE_QUICK_PROMPTS[selectedLang.code] || LANGUAGE_QUICK_PROMPTS.en).map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => dispatchMascotTurn(prompt.text, 'text')}
            className="text-[11px] px-2.5 py-1 rounded-full bg-white/85 border border-[#D8C2BA]/60 text-[#595048] hover:bg-[#E7B9B2]/20 hover:border-[#C47A5C]/40 transition-colors shadow-2xs"
          >
            {prompt.label}
          </button>
        ))}
      </div>

      {/* Full Conversation History Transcript Panel */}
      {showConvoDrawer && (
        <div
          id="mascot-full-convo-panel"
          className="mt-3 w-full max-w-sm bg-white/95 backdrop-blur-md rounded-2xl border border-[#D8C2BA]/80 shadow-md p-3.5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#C47A5C]" />
              <h4 className="text-xs font-semibold text-[#3D2E28]">
                Convo with ilo • {selectedLang.native}
              </h4>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
              Trauma-Informed Attuned
            </span>
          </div>

          {/* Scrollable Message List */}
          <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 text-left text-xs">
            {convoHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-2.5 rounded-2xl leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#C47A5C] text-white rounded-br-xs shadow-2xs'
                      : 'bg-[#F4ECE4] text-[#3D2E28] rounded-bl-xs border border-[#E7D6CC]/70 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    {msg.sender === 'ilo' && (
                      <button
                        onClick={() => speakReply(msg.text, msg.mascotState || 'speaking', msg.language || selectedLang.code)}
                        className="text-[#C47A5C] hover:text-[#9F5A40] shrink-0 mt-0.5 p-0.5 rounded-full hover:bg-white/50"
                        title="Listen to cute voice"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Grounding anchor badge if suggested */}
                  {msg.groundingTechnique && (
                    <button
                      onClick={() => {
                        if (onOpenGrounding) onOpenGrounding(msg.groundingTechnique!);
                        setMascotState('grounding');
                      }}
                      className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-medium hover:bg-emerald-200 transition-colors"
                    >
                      <Wind className="w-2.5 h-2.5 text-emerald-700" />
                      <span>{msg.groundingTechnique}</span>
                    </button>
                  )}
                </div>

                <span className="text-[9px] text-stone-400 mt-0.5 px-1">
                  {msg.sender === 'user' ? 'You' : 'ilo'} • {msg.timestamp}
                </span>
              </div>
            ))}
            <div ref={convoEndRef} />
          </div>
        </div>
      )}

      {/* Crisis Support Pathway Overlay Modal */}
      {isCrisisModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-rose-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-900">You Are Not Alone</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                I am holding this space with you right now. You deserve gentle, caring human support in this moment.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href="tel:988"
                className="block w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-sm text-center"
              >
                Call or Text 988 (Crisis Lifeline)
              </a>
              <a
                href="sms:741741?body=HOME"
                className="block w-full py-2 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs text-center"
              >
                Text HOME to 741741
              </a>
            </div>

            <button
              onClick={() => setIsCrisisModalOpen(false)}
              className="text-xs text-stone-400 hover:text-stone-600 pt-1"
            >
              Return to safe sanctuary space
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReactiveMascot;
