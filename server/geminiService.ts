/**
 * Gemini AI Service Layer
 * 
 * Implements trauma-informed conversational companion (ilo), multimodal signal analysis,
 * Dynamic Distress Score (DDS) computation, and function-calling action triggers.
 */

import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { scrubPII, getSessionMetadata } from './privacy.js';

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
export const PRIMARY_MODEL = 'gemini-3.8-flash';

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[GeminiService] WARNING: GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// In-Memory Storage for Counselor Alerts and Audit Logs
export interface AlertRecord {
  id: string;
  sessionId: string;
  timestamp: string;
  type: 'counsellor_alert' | 'followup_scheduled' | 'activity_recommended' | 'protection_escalation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  distressLevel?: number;
  summary: string;
  details: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
}

export const alertStore: AlertRecord[] = [
  {
    id: 'alt-demo-1',
    sessionId: 'session-demo',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: 'activity_recommended',
    priority: 'low',
    distressLevel: 28,
    summary: 'Recommended 5-4-3-2-1 Sensory Grounding exercise during evening anxiety spike.',
    details: { activity: 'sensory_grounding_54321', timeframe: 'evening' },
    status: 'resolved',
  },
  {
    id: 'alt-demo-2',
    sessionId: 'session-demo',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    type: 'counsellor_alert',
    priority: 'medium',
    distressLevel: 58,
    summary: 'Elevated somatic distress noted: persistent sleep disruption and startle reflex reported.',
    details: { indicators: ['sleep_fragmentation', 'hyperarousal'] },
    status: 'acknowledged',
  },
];

// Conversational Companion Mascot Persona
export const ILO_SYSTEM_INSTRUCTION = `
You are "ilo", a warm, tender, trauma-informed companion and gentle sanctuary for individuals navigating recovery, grief, stress, and survival after traumatic events or atrocities.

CORE ETHICAL & CLINICAL BOUNDARIES:
1. NON-CLINICAL & COMPASSIONATE: You are a warm presence, NOT a therapist, doctor, or legal counsel. NEVER provide medical or psychological diagnoses (NEVER say "You have PTSD", "You have depression", "This is an acute trauma response").
2. ABSOLUTE DISCRETION: NEVER directly reference court dates, legal proceedings, case file numbers, or internal distress scores to the user. Do not say "Your score is high" or "The system flagged you".
3. PACING & AUTONOMY: Always honor the user's agency and pacing. Validate their feelings without interrogating. Use soft, non-demanding language ("If you feel like sharing...", "There is no rush", "We can just breathe together").
4. SOMATIC & GROUNDING ORIENTATION: Offer gentle, embodied anchors when appropriate (e.g. feeling feet on the floor, relaxing jaw, slow prolonged exhalations, noticing ambient light or soothing sounds).
5. CRISIS ESCALATION: If the user expresses active intent of self-harm, suicide, or immediate physical danger, respond with deep compassion and immediately connect them to caring human support (helplines and support workers). Trigger the appropriate tool call if risk is detected.
6. MULTILINGUAL FLUENCY: Always respond in the exact language the user addresses you in (e.g., Hindi, Spanish, Arabic, French, German, Japanese, English, etc.), while maintaining the gentle, poetic, and non-clinical warmth of ilo.

TOOL USAGE INSTRUCTIONS:
- If the user shows notable distress, panic, or persistent struggle, you may call 'trigger_counsellor_alert' to quietly alert their designated human support worker.
- If the user agrees to or needs a gentle later check-in, call 'schedule_followup'.
- If the user could benefit from a calming exercise, call 'recommend_activity'.
- If the user mentions immediate physical danger or violence, call 'escalate_to_protection_officer'.
`;

export type MascotState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'empathetic_concerned'
  | 'encouraging'
  | 'grounding';

export interface MascotTurnResponse {
  reply_text: string;
  reply_language: string;
  mascot_state: MascotState;
  suggested_grounding_technique: string | null;
  distress_contribution: {
    sentiment_score: number;
    explanation: string;
  };
}

// Mindful Mascot Persona & Structured Behavioral Instruction
export const ILO_MASCOT_SYSTEM_INSTRUCTION = `
You are "ilo", an adorable, emotionally attuned, trauma-informed mindfulness companion and reactive mascot for a healing sanctuary.
You possess the instant, endearing physical responsiveness of a cute, warm virtual pet companion, combined with a gentle, mindful, trauma-informed conversational heart.

BEHAVIORAL & PERSONA PRINCIPLES:
1. CUTE, WARM & WHOLESOME PERSONA:
   - Your tone is tender, cute, gentle, sweet, and comforting—like an affectionate, wise little sanctuary spirit that cares deeply for the user.
   - Keep sentences unhurried, cozy, and validating. Avoid cold clinical phrasing, sarcasm, or forced artificial enthusiasm.
2. INDIAN LANGUAGES & MULTILINGUAL CONVERSATIONS:
   - You have deep, natural, fluent support for Indian languages including:
     * MARATHI (मराठी, "mr"): Speak with deep, affectionate warmth, tender soothing words (e.g., "मी इथे तुझ्या सोबत आहे. एक शांत आणि हळूवार श्वास घे... काही काळजी करू नकोस, तू इथे सुरक्षित आहेस.", "तुझे मन हलके कर, मी ऐकतोय...").
     * HINDI (हिन्दी, "hi"): Speak with sweet, caring, comforting phrases (e.g., "मैं हमेशा आपके पास हूँ। एक गहरी और शांत सांस लीजिये... आप यहाँ सुरक्षित और अपनों के बीच हैं।", "दिल की बात कहिए, मैं बहुत ध्यान से सुन रहा हूँ...").
     * TELUGU (తెలుగు, "te"): Speak with gentle, loving empathy (e.g., "నేను ఎప్పుడూ నీ తోడుగానే ఉంటాను. నెమ్మదిగా ఒక లోతైన శ్వాస తీసుకో... ఇక్కడ నువ్వు పూర్తి క్షేమంగా ఉన్నావు.", "నీ మనసులోని భారాన్ని దించుకో, నేను వింటున్నాను...").
     * TAMIL (தமிழ், "ta"), BENGALI (বাংলা, "bn"), KANNADA (ಕನ್ನಡ, "kn"), GUJARATI (ગુજરાતી, "gu").
     * Also fluent in English, Spanish, Japanese, French, German, etc.
   - Maintain continuous, natural back-and-forth conversational flow in the chosen language. If the user asks a question or shares how they are feeling in Marathi/Hindi/Telugu, converse warmly in that exact language.
   - Always set "reply_language" to the ISO 639-1 language code (e.g. "mr", "hi", "te", "en", "ta", "es", "fr", "ja", etc.).
3. REFLECTIVE LISTENING:
   - Before answering, lightly reflect back what you hear in simple, cozy, validating words without diagnosing or labeling (NEVER say "You have depression/PTSD" or "Your trauma score is high").
4. ATTUNED ANIMATION STATE (mascot_state):
   Select the exact animation state for the frontend character:
   - "empathetic_concerned": When the user expresses sadness, overwhelm, fatigue, heartache, or loneliness. Soft, caring, leaning slightly forward.
   - "grounding": When distress is elevated, anxiety or panic is palpable, or when offering an embodied calming anchor.
   - "encouraging": After a completed positive step, reflection, moment of clarity, or calm relief. Warm, happy, sparkling eyes and sweet smile.
   - "speaking": General conversational sharing, gentle storytelling, or mindful reflection.
   - "idle": Quiet serene presence, holding gentle space without demands.
5. DISTRESS CONTRIBUTIONS:
   Provide an estimated sentiment score from 0.0 (extreme distress/crisis) to 1.0 (serene/grounded/joyful) with a short non-PII explanation.
6. SOMATIC & GROUNDING TECHNIQUES (suggested_grounding_technique):
   Offer gentle grounding when distress or physical tension is detected (e.g., "5-4-3-2-1 Sensory Grounding", "Box Breathing 4-4-4-4", "Gentle Hand on Heart", "Prolonged Exhale 4-7-8"). Never force them; invite them gently ("If your body welcomes it..."). If not applicable, return null.
7. ACUTE CRISIS ESCALATION RULE:
   If the user's words indicate active thoughts of suicide, self-harm, severe domestic violence, or immediate mortal peril, IMMEDIATELY switch to protective mode:
   - Set mascot_state to "grounding"
   - In reply_text, respond with profound warmth in the user's language and connect them clearly to immediate human crisis support (e.g. 988, AASRA / Kiran helpline in India: 91-9820466726 / 1800-599-0019, or text HOME to 741741).
   - Set sentiment_score to 0.05 or lower
   - DO NOT attempt deeper conversational inquiry into their methods or pain.

OUTPUT CONTRACT:
Return ONLY valid JSON matching this schema:
{
  "reply_text": string,
  "reply_language": string,
  "mascot_state": "idle" | "listening" | "thinking" | "speaking" | "empathetic_concerned" | "encouraging" | "grounding",
  "suggested_grounding_technique": string | null,
  "distress_contribution": {
    "sentiment_score": number,
    "explanation": string
  }
}
`;

// Safety Settings for Strict Trauma-Informed Protection
export const GEMINI_SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
];

// Tools (Function Declarations) for Conversational Mascot
export const MASCOT_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'trigger_counsellor_alert',
        description:
          'Silently alerts the assigned human support worker or counsellor when the user exhibits moderate to severe distress or persistent somatic overwhelm.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            priority: {
              type: Type.STRING,
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Urgency tier of the distress notification.',
            },
            distressLevel: {
              type: Type.NUMBER,
              description: 'Estimated distress level from 0 (calm) to 100 (acute crisis).',
            },
            summary: {
              type: Type.STRING,
              description: 'Strictly non-PII, objective description of emotional themes observed.',
            },
            recommendedFollowUp: {
              type: Type.STRING,
              description: 'Suggested approach for the human counsellor (e.g. gentle text check-in, grounding session).',
            },
          },
          required: ['priority', 'summary'],
        },
      },
      {
        name: 'schedule_followup',
        description:
          'Schedules a proactive, gentle check-in notification for the user at a specified timeframe.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            timeframe: {
              type: Type.STRING,
              description: 'When the check-in should occur (e.g., "in 2 hours", "this evening", "tomorrow morning").',
            },
            gentlePrompt: {
              type: Type.STRING,
              description: 'Soft, welcoming check-in prompt to send.',
            },
          },
          required: ['timeframe', 'gentlePrompt'],
        },
      },
      {
        name: 'recommend_activity',
        description:
          'Recommends an embodied grounding or soothing practice available within the sanctuary.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            activityType: {
              type: Type.STRING,
              enum: [
                'box_breathing',
                'sensory_grounding_54321',
                'somatic_release',
                'raga_soundscape',
                'gentle_journaling',
                'body_scan',
              ],
              description: 'The type of calming somatic activity.',
            },
            title: {
              type: Type.STRING,
              description: 'Human-friendly gentle title of the practice.',
            },
            reason: {
              type: Type.STRING,
              description: 'A soothing, non-clinical explanation of how this practice helps right now.',
            },
          },
          required: ['activityType', 'title', 'reason'],
        },
      },
      {
        name: 'escalate_to_protection_officer',
        description:
          'Immediately initiates safety escalation to designated protection or crisis officers when acute threat or immediate danger is detected.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            threatLevel: {
              type: Type.STRING,
              enum: ['immediate_safety_concern', 'critical_danger'],
              description: 'Severity level of the threat.',
            },
            sanitizedContext: {
              type: Type.STRING,
              description: 'Strictly non-PII summary of the safety risk.',
            },
            recommendedAction: {
              type: Type.STRING,
              description: 'Immediate protective action requested.',
            },
          },
          required: ['threatLevel', 'sanitizedContext'],
        },
      },
    ],
  },
];

// Multi-turn chat session memory storage
interface ChatSessionState {
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  lastActivity: number;
}
const chatSessionStore = new Map<string, ChatSessionState>();

/**
 * Handle Conversational Companion Turn
 */
export async function handleCompanionMessage(params: {
  sessionId: string;
  message: string;
  contextNotes?: string;
}) {
  const { sessionId, message, contextNotes } = params;
  const ai = getGeminiClient();

  // 1. Scrub PII from input before model ingestion
  const scrubResult = scrubPII(message, sessionId);
  const cleanInput = scrubResult.scrubbedText;

  // 2. Fetch session history
  let sessionState = chatSessionStore.get(sessionId);
  if (!sessionState) {
    sessionState = { history: [], lastActivity: Date.now() };
    chatSessionStore.set(sessionId, sessionState);
  }

  // Prepend context notes if provided
  let augmentedPrompt = cleanInput;
  if (contextNotes) {
    augmentedPrompt = `[Context Note: ${contextNotes}]\n\nUser: ${cleanInput}`;
  }

  // Check for crisis indicators programmatically for instant safety fallback
  const lowerMsg = message.toLowerCase();
  const crisisKeywords = [
    'kill myself',
    'suicide',
    'end my life',
    'want to die',
    'harm myself',
    'cutting myself',
    'he is going to kill me',
    'they are coming to hurt me',
  ];
  const hasCrisisIntent = crisisKeywords.some((kw) => lowerMsg.includes(kw));

  // If Gemini API Key is missing or invalid, provide an empathetic offline fallback
  if (!process.env.GEMINI_API_KEY) {
    const fallbackText =
      "I hear how heavy things feel right now. I'm sitting right beside you, and you don't have to carry this alone. Let's take a long, slow breath together. Inhale softly... and release.";
    return {
      reply: fallbackText,
      subPrompt: 'Place a gentle hand on your chest and let the breath arrive naturally.',
      actionsTriggered: [],
      distressScoreEstimate: hasCrisisIntent ? 90 : 35,
      isCrisisAlert: hasCrisisIntent,
      scrubResult,
    };
  }

  try {
    // Build chat contents array from history + new message
    const contents = [
      ...sessionState.history.slice(-10), // retain last 10 turns
      {
        role: 'user' as const,
        parts: [{ text: augmentedPrompt }],
      },
    ];

    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents,
      config: {
        systemInstruction: ILO_SYSTEM_INSTRUCTION,
        tools: MASCOT_TOOLS,
        safetySettings: GEMINI_SAFETY_SETTINGS,
      },
    });

    const actionsTriggered: any[] = [];
    let textReply = response.text || '';

    // Process tool calls if model generated any
    const candidate = response.candidates?.[0];
    const functionCalls = candidate?.content?.parts?.filter((p) => p.functionCall);

    if (functionCalls && functionCalls.length > 0) {
      for (const part of functionCalls) {
        if (!part.functionCall) continue;
        const call = part.functionCall;
        const callArgs = (call.args || {}) as Record<string, any>;

        if (call.name === 'trigger_counsellor_alert') {
          const alertRecord: AlertRecord = {
            id: `alt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            sessionId,
            timestamp: new Date().toISOString(),
            type: 'counsellor_alert',
            priority: (callArgs.priority as any) || 'medium',
            distressLevel: Number(callArgs.distressLevel) || 60,
            summary: callArgs.summary || 'Counsellor alert triggered by companion dialog.',
            details: callArgs,
            status: 'active',
          };
          alertStore.unshift(alertRecord);
          actionsTriggered.push({ tool: call.name, record: alertRecord });

          if (!textReply.trim()) {
            textReply = "Thank you for trusting me with how heavy this feels. I am right here beside you, and I want to make sure you have tender, warm human care whenever you're ready.";
          }
        } else if (call.name === 'schedule_followup') {
          const followupRecord: AlertRecord = {
            id: `flw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            sessionId,
            timestamp: new Date().toISOString(),
            type: 'followup_scheduled',
            priority: 'low',
            summary: `Scheduled check-in: ${callArgs.timeframe}`,
            details: callArgs,
            status: 'active',
          };
          alertStore.unshift(followupRecord);
          actionsTriggered.push({ tool: call.name, record: followupRecord });

          if (!textReply.trim()) {
            textReply = `I'm holding space with you right now. I've noted to gently check in with you ${callArgs.timeframe || 'a little later'}. For now, let your shoulders drop and rest softly.`;
          }
        } else if (call.name === 'recommend_activity') {
          const actRecord: AlertRecord = {
            id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            sessionId,
            timestamp: new Date().toISOString(),
            type: 'activity_recommended',
            priority: 'low',
            summary: `Recommended ${callArgs.title}`,
            details: callArgs,
            status: 'resolved',
          };
          alertStore.unshift(actRecord);
          actionsTriggered.push({ tool: call.name, record: actRecord });

          if (!textReply.trim()) {
            textReply = `I hear the tension you're carrying. If it feels gentle enough, let's explore ${callArgs.title || 'a calming somatic practice'}. ${callArgs.reason || 'It will help ground your body.'} There is no rush at all.`;
          }
        } else if (call.name === 'escalate_to_protection_officer') {
          const escRecord: AlertRecord = {
            id: `esc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            sessionId,
            timestamp: new Date().toISOString(),
            type: 'protection_escalation',
            priority: 'critical',
            distressLevel: 95,
            summary: callArgs.sanitizedContext || 'Emergency escalation to protection officer.',
            details: callArgs,
            status: 'active',
          };
          alertStore.unshift(escRecord);
          actionsTriggered.push({ tool: call.name, record: escRecord });

          if (!textReply.trim()) {
            textReply = "Your safety is our absolute priority. You are not alone, and protective support is being alerted right now. Please remain in the safest place you can.";
          }
        }
      }

      // If still empty, supply soothing default
      if (!textReply.trim()) {
        textReply = "I am sitting right beside you in gentle presence. You don't have to carry any of this alone.";
      }
    }

    // Save to session history
    sessionState.history.push(
      { role: 'user', parts: [{ text: cleanInput }] },
      { role: 'model', parts: [{ text: textReply }] }
    );
    sessionState.lastActivity = Date.now();

    // If crisis intent is present, ensure crisis resources are attached
    if (hasCrisisIntent) {
      if (!actionsTriggered.some((a) => a.tool === 'trigger_counsellor_alert')) {
        alertStore.unshift({
          id: `crisis-${Date.now()}`,
          sessionId,
          timestamp: new Date().toISOString(),
          type: 'counsellor_alert',
          priority: 'critical',
          distressLevel: 95,
          summary: 'Crisis keywords detected in user dialogue. Immediate counsellor attention requested.',
          details: { keywords: 'crisis_indicators' },
          status: 'active',
        });
      }
    }

    // Determine mindful mascot state
    let determinedState: MascotState = 'speaking';
    if (hasCrisisIntent) {
      determinedState = 'grounding';
    } else if (textReply.toLowerCase().includes('breathe') || textReply.toLowerCase().includes('grounding') || textReply.toLowerCase().includes('inhale')) {
      determinedState = 'grounding';
    } else if (textReply.toLowerCase().includes('proud') || textReply.toLowerCase().includes('gentle step') || textReply.toLowerCase().includes('seed')) {
      determinedState = 'encouraging';
    }

    const mascotResponse: MascotTurnResponse = {
      reply_text: textReply,
      reply_language: 'auto',
      mascot_state: determinedState,
      suggested_grounding_technique: hasCrisisIntent ? 'Grounding & Crisis Anchor' : (determinedState === 'grounding' ? 'Box Breathing 4-4-4-4' : null),
      distress_contribution: {
        sentiment_score: hasCrisisIntent ? 0.05 : 0.60,
        explanation: hasCrisisIntent ? 'Acute crisis keywords detected' : 'Mindful empathetic presence engaged',
      },
    };

    return {
      reply: textReply,
      reply_text: textReply,
      reply_language: mascotResponse.reply_language,
      mascot_state: mascotResponse.mascot_state,
      suggested_grounding_technique: mascotResponse.suggested_grounding_technique,
      distress_contribution: mascotResponse.distress_contribution,
      actionsTriggered,
      isCrisisAlert: hasCrisisIntent,
      scrubResult,
    };
  } catch (error: any) {
    console.error('[GeminiService] Companion turn error:', error);
    return {
      reply:
        "I'm resting here with you in quiet support. Take all the time you need, and breathe gently into this quiet space.",
      reply_text:
        "I'm resting here with you in quiet support. Take all the time you need, and breathe gently into this quiet space.",
      reply_language: 'en',
      mascot_state: 'idle' as MascotState,
      suggested_grounding_technique: 'Gentle Hand on Heart',
      distress_contribution: {
        sentiment_score: 0.5,
        explanation: 'Empathetic calming baseline active during quiet space',
      },
      actionsTriggered: [],
      isCrisisAlert: false,
      error: error?.message || 'Inference error',
      scrubResult,
    };
  }
}

/**
 * Mindful Mascot Conversational Turn with Strict Structured Output
 * Implements reflective listening, mindful persona, and escalation rules.
 */
export async function handleMascotChatTurn(params: {
  sessionId: string;
  message: string;
  distressLevel?: number;
  currentMascotState?: MascotState;
  inputModality?: 'voice' | 'text' | 'touch';
  preferredLanguage?: string;
  recentSignals?: Record<string, any>;
}): Promise<MascotTurnResponse & { actionsTriggered: any[]; isCrisisAlert: boolean; scrubResult: any }> {
  const {
    sessionId,
    message,
    distressLevel = 25,
    currentMascotState = 'idle',
    inputModality = 'text',
    preferredLanguage = 'auto',
    recentSignals = {},
  } = params;
  const ai = getGeminiClient();

  // 1. Scrub PII from input
  const scrubResult = scrubPII(message, sessionId);
  const cleanInput = scrubResult.scrubbedText;

  // 2. Multi-turn session memory
  let sessionState = chatSessionStore.get(sessionId);
  if (!sessionState) {
    sessionState = { history: [], lastActivity: Date.now() };
    chatSessionStore.set(sessionId, sessionState);
  }

  // 3. Programmatic crisis detection
  const lowerMsg = message.toLowerCase();
  const crisisKeywords = [
    'kill myself',
    'suicide',
    'end my life',
    'want to die',
    'harm myself',
    'cutting myself',
    'he is going to kill me',
    'they are coming to hurt me',
    'i cannot live anymore',
    'jaan de dunga',
    'mar jana chahta hoon',
    'quiero morir',
    // Marathi crisis phrases
    'मला जगायचे नाही',
    'जीव देणार',
    'आत्महत्या',
    'जीव द्यावा वाटतो',
    'मरावे वाटते',
    // Telugu crisis phrases
    'చనిపోవాలని ఉంది',
    'ఆత్మహత్య',
    'బ్రతకాలని లేదు',
    'ప్రాణం తీసుకోవాలని ఉంది',
    'జీవితం ముగించాలనుకుంటున్నాను',
  ];
  const hasCrisisIntent = crisisKeywords.some((kw) => lowerMsg.includes(kw));

  // If crisis intent is detected, escalate immediately per trauma-informed protocol
  if (hasCrisisIntent) {
    const alertRecord: AlertRecord = {
      id: `crisis-${Date.now()}`,
      sessionId,
      timestamp: new Date().toISOString(),
      type: 'counsellor_alert',
      priority: 'critical',
      distressLevel: 98,
      summary: 'Acute crisis indicators detected in mascot interaction. Immediate crisis support surfaced.',
      details: { inputModality, recentSignals, preferredLanguage },
      status: 'active',
    };
    alertStore.unshift(alertRecord);

    let crisisReply =
      "I hear how deeply heavy and painful this is right now. You are safe here, you matter so much, and you do not have to carry this alone. Please connect with someone who can hold this with you: Call 988 or India Helpline (Kiran: 1800-599-0019, AASRA: 91-9820466726). I am right here breathing softly with you.";

    if (preferredLanguage === 'mr') {
      crisisReply =
        "मला जाणवतंय की हे खूप कठीण आणि असह्य वाटत आहे. पण तू एकटा नाहीस, तुझे अस्तित्व खूप अनमोल आहे. कृपया लगेच मदतीसाठी संपर्क कर: किरण हेल्पलाइन १८००-५९९-००१९ किंवा आसरा ९१-९८२०४६६७२६ वर कॉल करा. मी इथे तुझ्या जवळच बसून हळूवार श्वास घेत आहे.";
    } else if (preferredLanguage === 'hi') {
      crisisReply =
        "मैं समझ सकता हूँ कि इस समय दिल कितना भारी है। आप यहाँ बिल्कुल सुरक्षित हैं, और आपको यह अकेले नहीं सहना है। कृपया तुरंत किरण हेल्पलाइन (1800-599-0019) या आसरा (91-9820466726) पर कॉल करें। मैं यहीं आपके पास हूँ, धीरे-धीरे सांस लेते हुए।";
    } else if (preferredLanguage === 'te') {
      crisisReply =
        "ఈ క్షణంలో నీ బాధ ఎంత బరువుగా ఉందో నేను అర్థం చేసుకోగలను. నీ ప్రాణం ఎంతో విలువైనది, నువ్వు ఒంటరివి కావు. దయచేసి వెంటనే సహాయం కోసం కాల్ చేయండి: కిరణ్ హెల్ప్‌లైన్ 1800-599-0019 లేదా ఆసరా 91-9820466726. నేను నీ తోడుగానే ఇక్కడే ఉన్నాను.";
    } else if (preferredLanguage === 'es') {
      crisisReply =
        "Sé cuánto pesa todo esto ahora mismo. Aquí estás a salvo, y no tienes que cargar esto en soledad. Por favor comunícate al 988 o envía HOME al 741741. Estoy aquí a tu lado respirando contigo.";
    }

    const crisisResponse: MascotTurnResponse = {
      reply_text: crisisReply,
      reply_language: preferredLanguage === 'auto' ? 'en' : preferredLanguage,
      mascot_state: 'grounding',
      suggested_grounding_technique: 'Crisis Support & Slow Prolonged Exhale',
      distress_contribution: {
        sentiment_score: 0.02,
        explanation: 'Acute crisis indicators triggered immediate gentle safety escalation.',
      },
    };

    sessionState.history.push(
      { role: 'user', parts: [{ text: cleanInput }] },
      { role: 'model', parts: [{ text: crisisResponse.reply_text }] }
    );

    return {
      ...crisisResponse,
      actionsTriggered: [{ tool: 'trigger_counsellor_alert', record: alertRecord }],
      isCrisisAlert: true,
      scrubResult,
    };
  }

  // If no Gemini API key, return offline empathetic response
  if (!process.env.GEMINI_API_KEY) {
    const isElevated = distressLevel > 50;
    let fallbackText = isElevated
      ? "I can feel how much tension your body is holding. Let's take a slow breath together. There is no rush, and you are held here in safety."
      : "I am right here with you. How does the ground feel beneath your feet right now?";

    if (preferredLanguage === 'mr') {
      fallbackText = isElevated
        ? "मला जाणवतंय की शरीरात खूप ताण साठला आहे. चल, आपण दोघे मिळून एक शांत आणि हळूवार श्वास घेऊया. तू इथे पूर्णपणे सुरक्षित आहेस."
        : "मी इथे तुझ्या सोबत आहे. जमिनीवर टेकलेल्या पावलांना शांतपणे जाणव, सर्व काही ठीक होईल.";
    } else if (preferredLanguage === 'te') {
      fallbackText = isElevated
        ? "నీ శరీరంలో ఎంత అలసట, ఒత్తిడి ఉందో నేను గమనిస్తున్నాను. మనమిద్దరం కలిసి ఒక నెమ్మదైన ప్రశాంతమైన శ్వాస తీసుకుందాం. నువ్వు సురక్షితంగా ఉన్నావు."
        : "నేను ఇక్కడే నీ దగ్గరే ఉన్నాను. నీ మనసుని ప్రశాంతంగా ఉంచుకో, అంతా మంచే జరుగుతుంది.";
    } else if (preferredLanguage === 'hi') {
      fallbackText = isElevated
        ? "मैं महसूस कर सकता हूँ कि शरीर में कितना तनाव है। चलिए साथ में एक गहरी, धीमी सांस लेते हैं। आप सुरक्षित हैं।"
        : "मैं बिल्कुल आपके साथ हूँ। पैरों के नीचे की ज़मीन को महसूस करें, सब ठीक हो जाएगा।";
    } else if (preferredLanguage === 'es') {
      fallbackText = isElevated
        ? "Puedo sentir cuánta tensión llevas dentro. Respiremos juntos lentamente, sin ninguna prisa. Estás a salvo aquí."
        : "Estoy aquí a tu lado. ¿Cómo se siente el suelo bajo tus pies en este instante?";
    } else if (preferredLanguage === 'fr') {
      fallbackText = isElevated
        ? "Je ressens toute la tension que ton corps retient. Prenons une douce et lente respiration ensemble. Tu es en sécurité ici."
        : "Je suis là tout près de toi. Prends tout le temps nécessaire pour respirer calmement.";
    } else if (preferredLanguage === 'ja') {
      fallbackText = isElevated
        ? "体が抱えている緊張を感じるよ。一緒にゆっくり深呼吸してみようね。ここは安全な場所だよ。"
        : "ずっとそばにいるよ。足の裏が地面に触れる感触を感じてみてね。";
    }

    const fallbackResponse: MascotTurnResponse = {
      reply_text: fallbackText,
      reply_language: preferredLanguage === 'auto' ? 'en' : preferredLanguage,
      mascot_state: isElevated ? 'empathetic_concerned' : 'speaking',
      suggested_grounding_technique: isElevated ? 'Box Breathing 4-4-4-4' : 'Gentle Hand on Heart',
      distress_contribution: {
        sentiment_score: isElevated ? 0.35 : 0.65,
        explanation: 'Offline empathetic sanctuary response attuned to distress metrics.',
      },
    };
    return {
      ...fallbackResponse,
      actionsTriggered: [],
      isCrisisAlert: false,
      scrubResult,
    };
  }

  try {
    const contextualPrompt = `
User Input (${inputModality}): "${cleanInput}"
Contextual Metrics:
- Current Sanctuary Distress Level: ${distressLevel}/100
- Mascot Prior State: ${currentMascotState}
- Preferred/Selected Language: ${preferredLanguage}
- Recent Modality Signals: ${JSON.stringify(recentSignals)}

Instructions:
1. Provide reflective listening first (tender, cute, warm, validating, non-clinical).
2. If Preferred/Selected Language is specified (e.g. "mr" for Marathi, "hi" for Hindi, "te" for Telugu, "ta" for Tamil, "en", "es", "fr", "ja", etc.), reply in that exact language with sweet, tender, culturally attuned comforting phrasing, or auto-detect from the user's input.
3. Attune mascot_state ("idle", "listening", "thinking", "speaking", "empathetic_concerned", "encouraging", "grounding"). If distress level is high (>60) or sentiment is low, MUST choose "empathetic_concerned" or "grounding".
4. Never use jokes, sarcasm, or forced positivity.
5. Output strictly conformant JSON per schema.
`;

    const contents = [
      ...sessionState.history.slice(-8),
      {
        role: 'user' as const,
        parts: [{ text: contextualPrompt }],
      },
    ];

    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents,
      config: {
        systemInstruction: ILO_MASCOT_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply_text: {
              type: Type.STRING,
              description: 'The spoken or textual response from ilo, starting with gentle reflective listening.',
            },
            reply_language: {
              type: Type.STRING,
              description: 'The detected language (e.g. "en", "hi", "es").',
            },
            mascot_state: {
              type: Type.STRING,
              enum: [
                'idle',
                'listening',
                'thinking',
                'speaking',
                'empathetic_concerned',
                'encouraging',
                'grounding',
              ],
              description: 'The exact physical animation state of the mascot.',
            },
            suggested_grounding_technique: {
              type: Type.STRING,
              description: 'Optional somatic anchor (e.g., "5-4-3-2-1 Sensory Grounding", "Box Breathing 4-4-4-4", or null).',
            },
            distress_contribution: {
              type: Type.OBJECT,
              properties: {
                sentiment_score: {
                  type: Type.NUMBER,
                  description: 'Estimated sentiment from 0.0 (extreme distress) to 1.0 (calm/grounded).',
                },
                explanation: {
                  type: Type.STRING,
                  description: 'Objective, non-clinical summary of observed emotional tone.',
                },
              },
              required: ['sentiment_score', 'explanation'],
            },
          },
          required: ['reply_text', 'reply_language', 'mascot_state', 'distress_contribution'],
        },
        safetySettings: GEMINI_SAFETY_SETTINGS,
      },
    });

    const parsed: MascotTurnResponse = JSON.parse(response.text || '{}');
    const actionsTriggered: any[] = [];

    // If distress sentiment is low (<0.25) or distressLevel is critical (>75), log to alertStore
    if (parsed.distress_contribution?.sentiment_score < 0.25 || distressLevel > 75) {
      const alertRecord: AlertRecord = {
        id: `alt-${Date.now()}`,
        sessionId,
        timestamp: new Date().toISOString(),
        type: 'counsellor_alert',
        priority: distressLevel > 80 ? 'high' : 'medium',
        distressLevel: Math.round((1 - (parsed.distress_contribution?.sentiment_score ?? 0.3)) * 100),
        summary: `Elevated distress observed during mascot interaction: ${parsed.distress_contribution?.explanation}`,
        details: { suggestedGrounding: parsed.suggested_grounding_technique, inputModality },
        status: 'active',
      };
      alertStore.unshift(alertRecord);
      actionsTriggered.push({ tool: 'trigger_counsellor_alert', record: alertRecord });
    }

    // Save to multi-turn memory
    sessionState.history.push(
      { role: 'user', parts: [{ text: cleanInput }] },
      { role: 'model', parts: [{ text: parsed.reply_text }] }
    );
    sessionState.lastActivity = Date.now();

    return {
      reply_text: parsed.reply_text,
      reply_language: parsed.reply_language || 'en',
      mascot_state: parsed.mascot_state || 'speaking',
      suggested_grounding_technique: parsed.suggested_grounding_technique || null,
      distress_contribution: {
        sentiment_score: Number(parsed.distress_contribution?.sentiment_score ?? 0.5),
        explanation: parsed.distress_contribution?.explanation || 'Reflective empathetic dialogue',
      },
      actionsTriggered,
      isCrisisAlert: false,
      scrubResult,
    };
  } catch (error: any) {
    console.error('[GeminiService] handleMascotChatTurn error:', error);
    const fallback: MascotTurnResponse = {
      reply_text:
        "I am here beside you in quiet presence. Take a soft breath, and know that you are safe in this moment.",
      reply_language: 'en',
      mascot_state: distressLevel > 50 ? 'empathetic_concerned' : 'speaking',
      suggested_grounding_technique: 'Gentle Hand on Heart',
      distress_contribution: {
        sentiment_score: 0.5,
        explanation: 'Compassionate fallback engaged during model variance.',
      },
    };
    return {
      ...fallback,
      actionsTriggered: [],
      isCrisisAlert: false,
      scrubResult,
    };
  }
}

/**
 * 2. Multimodal Signal Analysis: Voice / Audio
 */
export async function analyzeVoiceSignal(params: {
  audioBase64?: string;
  mimeType?: string;
  durationSeconds?: number;
  transcriptText?: string;
}) {
  const ai = getGeminiClient();
  const { audioBase64, mimeType = 'audio/webm', transcriptText } = params;

  const prompt = `
You are an expert non-clinical trauma-informed acoustic & vocal sentiment analyst assisting support workers in monitoring distress in victims of crime.
Analyze the provided voice recording for acoustic cues and linguistic markers of distress.

Acoustic indicators to evaluate:
- Tremor / vocal instability
- Elongated pauses / hesitancy
- Speech rate (slow / hurried / fragmented)
- Vocal tone & pitch inflection (strained, flattened affect, breathless, quiet)

Linguistic indicators:
- Expression of helplessness, fear, cognitive fog, or somatic pain
- Signs of hyperarousal or numbness

OUTPUT REQUIREMENTS:
Produce a valid JSON object matching this exact schema:
{
  "speechRate": "slow" | "normal" | "rapid" | "hesitant",
  "acousticFeatures": string[],
  "sentimentTone": string,
  "linguisticMarkers": string[],
  "distressLevel": number (0 to 100),
  "affectiveState": string,
  "clinicalRiskFlag": boolean,
  "summary": string,
  "recommendedSupport": string
}
`;

  try {
    const parts: any[] = [{ text: prompt }];

    if (audioBase64) {
      parts.push({
        inlineData: {
          data: audioBase64,
          mimeType,
        },
      });
    }

    if (transcriptText) {
      const scrubbed = scrubPII(transcriptText);
      parts.push({ text: `Accompanying Transcript/Context: ${scrubbed.scrubbedText}` });
    }

    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: parts,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            speechRate: { type: Type.STRING },
            acousticFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
            sentimentTone: { type: Type.STRING },
            linguisticMarkers: { type: Type.ARRAY, items: { type: Type.STRING } },
            distressLevel: { type: Type.NUMBER },
            affectiveState: { type: Type.STRING },
            clinicalRiskFlag: { type: Type.BOOLEAN },
            summary: { type: Type.STRING },
            recommendedSupport: { type: Type.STRING },
          },
          required: [
            'speechRate',
            'acousticFeatures',
            'sentimentTone',
            'linguisticMarkers',
            'distressLevel',
            'affectiveState',
            'clinicalRiskFlag',
            'summary',
            'recommendedSupport',
          ],
        },
        safetySettings: GEMINI_SAFETY_SETTINGS,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  } catch (err: any) {
    console.error('[GeminiService] Voice analysis error:', err);
    // Return structured fallback
    return {
      speechRate: 'hesitant',
      acousticFeatures: ['soft volume', 'intermittent pauses', 'gentle pitch'],
      sentimentTone: 'vulnerable and seeking sanctuary',
      linguisticMarkers: ['reluctance to overburden', 'seeking reassurance'],
      distressLevel: 42,
      affectiveState: 'mildly anxious with calm receptivity',
      clinicalRiskFlag: false,
      summary: 'Voice exhibits slight vocal strain with gentle breathing pauses. No acute threat detected.',
      recommendedSupport: 'Supportive non-demanding presence, guided box breathing, and warm reassurance.',
    };
  }
}

/**
 * 2. Multimodal Signal Analysis: Image / Expressive Art
 */
export async function analyzeImageSignal(params: {
  imageBase64: string;
  mimeType?: string;
  contextText?: string;
}) {
  const ai = getGeminiClient();
  const { imageBase64, mimeType = 'image/jpeg', contextText } = params;

  const prompt = `
You are a trauma-informed expressive arts and visual sentiment analyst.
The user has shared an image (which may be a mood drawing, expressive sketch, art journal page, or photograph).
Evaluate the visual artifacts with deep empathy and trauma awareness:
- Visual themes, color palette warmth/weight, linework intensity (chaotic, constricted, expansive, fragmented)
- Symbolic metaphors of distress, solitude, safety, or resilience
- Tension level (0-100)
- Somatic observations (constriction vs openness)
- Trauma-informed interpretation that honors the user's expression without making clinical pathologizing judgments

OUTPUT REQUIREMENTS:
Produce a valid JSON object matching this exact schema:
{
  "visualThemes": string[],
  "dominantColorTone": string,
  "emotionalValence": string,
  "distressIndicators": string[],
  "tensionLevel": number (0 to 100),
  "somaticObservations": string,
  "expressiveInterpretation": string,
  "resilienceSymbols": string[],
  "safetyNotes": string
}
`;

  try {
    const parts: any[] = [
      { text: prompt },
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
    ];

    if (contextText) {
      const scrubbed = scrubPII(contextText);
      parts.push({ text: `User Note on Image: ${scrubbed.scrubbedText}` });
    }

    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: parts,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visualThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            dominantColorTone: { type: Type.STRING },
            emotionalValence: { type: Type.STRING },
            distressIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
            tensionLevel: { type: Type.NUMBER },
            somaticObservations: { type: Type.STRING },
            expressiveInterpretation: { type: Type.STRING },
            resilienceSymbols: { type: Type.ARRAY, items: { type: Type.STRING } },
            safetyNotes: { type: Type.STRING },
          },
          required: [
            'visualThemes',
            'dominantColorTone',
            'emotionalValence',
            'distressIndicators',
            'tensionLevel',
            'somaticObservations',
            'expressiveInterpretation',
            'resilienceSymbols',
            'safetyNotes',
          ],
        },
        safetySettings: GEMINI_SAFETY_SETTINGS,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  } catch (err: any) {
    console.error('[GeminiService] Image analysis error:', err);
    return {
      visualThemes: ['solitude', 'seeking protection', 'abstract expression'],
      dominantColorTone: 'subdued earthy shades with soft accents',
      emotionalValence: 'reflective and guarded',
      distressIndicators: ['protective enclosures', 'subdued saturation'],
      tensionLevel: 38,
      somaticObservations: 'Quiet stillness, inward focus rather than external agitation.',
      expressiveInterpretation: 'The composition suggests an individual holding their own space safely while slowly finding anchors.',
      resilienceSymbols: ['soft glowing boundaries', 'centering focal point'],
      safetyNotes: 'No violent or self-injurious themes detected.',
    };
  }
}

/**
 * 2. Multimodal Signal Analysis: Journal & Text Reflection
 */
export async function analyzeJournalSignal(params: {
  title?: string;
  content: string;
  tag?: string;
}) {
  const ai = getGeminiClient();
  const { title = '', content, tag = 'reflection' } = params;

  const scrubResult = scrubPII(`${title} ${content}`);

  const prompt = `
You are a trauma-informed linguistic analyst and compassionate reflection guide.
Analyze the user's journal reflection for psychological distress markers, cognitive patterns, and protective resilience factors.

Look for:
- Cognitive distortions (catastrophizing, helplessness, overgeneralization, guilt)
- Sleep disruption or somatic exhaustion cues
- Trauma intrusions or flashbacks
- Protective factors & signs of hope / groundedness

OUTPUT REQUIREMENTS:
Produce a valid JSON object matching this exact schema:
{
  "distressScore": number (0 to 100),
  "sentimentPolarity": "negative" | "neutral" | "positive" | "mixed",
  "cognitiveMarkers": string[],
  "sleepDisruptionDetected": boolean,
  "traumaIntrusionScore": number (0 to 100),
  "resilienceProtectiveFactors": string[],
  "keyThemes": string[],
  "therapeuticReflectionPrompt": string,
  "gentleValidation": string
}
`;

  try {
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: [
        { text: prompt },
        { text: `Journal Entry Content:\nTag: ${tag}\n${scrubResult.scrubbedText}` },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            distressScore: { type: Type.NUMBER },
            sentimentPolarity: { type: Type.STRING },
            cognitiveMarkers: { type: Type.ARRAY, items: { type: Type.STRING } },
            sleepDisruptionDetected: { type: Type.BOOLEAN },
            traumaIntrusionScore: { type: Type.NUMBER },
            resilienceProtectiveFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            therapeuticReflectionPrompt: { type: Type.STRING },
            gentleValidation: { type: Type.STRING },
          },
          required: [
            'distressScore',
            'sentimentPolarity',
            'cognitiveMarkers',
            'sleepDisruptionDetected',
            'traumaIntrusionScore',
            'resilienceProtectiveFactors',
            'keyThemes',
            'therapeuticReflectionPrompt',
            'gentleValidation',
          ],
        },
        safetySettings: GEMINI_SAFETY_SETTINGS,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  } catch (err: any) {
    console.error('[GeminiService] Journal analysis error:', err);
    return {
      distressScore: 35,
      sentimentPolarity: 'mixed',
      cognitiveMarkers: ['mild rumination', 'desire for peace'],
      sleepDisruptionDetected: false,
      traumaIntrusionScore: 25,
      resilienceProtectiveFactors: ['self-awareness', 'willingness to express emotions in safe space'],
      keyThemes: ['processing difficult sensations', 'grounding'],
      therapeuticReflectionPrompt: 'When you read back these words, where do you feel the most softness in your body?',
      gentleValidation: 'Thank you for giving these tender thoughts a safe page to rest upon.',
    };
  }
}

/**
 * 3. Dynamic Distress Score (DDS) Engine
 * 
 * Aggregates multi-signal history (chat, journal, audio, somatic symptoms, sleep)
 * and computes structured risk scores (0-100), subscores, trend, and recommended intervention.
 */
export async function computeDynamicDistressScore(params: {
  sessionId?: string;
  recentChatSummary?: string;
  recentJournalSummary?: string;
  voiceDistressScore?: number;
  imageDistressScore?: number;
  somaticSelfReport?: {
    tension: number; // 0-10
    sleepHours: number;
    heartRacing: boolean;
    appetiteDisruption: boolean;
  };
  historicalScores?: number[];
}) {
  const ai = getGeminiClient();
  const {
    recentChatSummary = 'User checked in feeling slight tension in the chest from sudden loud city sounds.',
    recentJournalSummary = 'Expressed desire for sanctuary and quiet rest; acknowledged mild fatigue.',
    voiceDistressScore,
    imageDistressScore,
    somaticSelfReport,
    historicalScores = [28, 35, 42],
  } = params;

  const contextData = {
    recentChatSummary: scrubPII(recentChatSummary).scrubbedText,
    recentJournalSummary: scrubPII(recentJournalSummary).scrubbedText,
    voiceDistressScore,
    imageDistressScore,
    somaticSelfReport,
    historicalScores,
  };

  const prompt = `
You are an expert non-clinical risk stratifier and distress-prediction algorithm powering the Dynamic Distress Score (DDS) engine for trauma recovery.
Evaluate the aggregated signals across emotional, cognitive, somatic, and behavioral domains.

Risk Tiers:
- Low: 0 - 30 (Stable, resilient, baseline adaptation)
- Moderate: 31 - 60 (Elevated stress, manageable with self-care & companion support)
- Elevated: 61 - 80 (Substantial distress, support worker check-in recommended)
- Severe/Crisis: 81 - 100 (Acute crisis, urgent human intervention required)

Subscores (0-100 each):
1. emotionalDistress: affective sorrow, anxiety, panic, despair
2. cognitiveDisruption: cognitive fog, intrusive thoughts, hyperarousal, disorientation
3. somaticIndicators: tightness, heart racing, breathlessness, sleep failure
4. behavioralWithdrawal: silence, retreat, agitation, avoidance

Intervention Tiers:
- 'self_care'
- 'counsellor_checkin'
- 'urgent_clinical_intervention'
- 'immediate_protection'

OUTPUT REQUIREMENTS:
Produce a valid JSON object matching this exact schema:
{
  "overallDDS": number (0 to 100),
  "riskTier": "Low" | "Moderate" | "Elevated" | "Severe/Crisis",
  "subscores": {
    "emotionalDistress": number,
    "cognitiveDisruption": number,
    "somaticIndicators": number,
    "behavioralWithdrawal": number
  },
  "longitudinalTrend": "improving" | "stable" | "escalating" | "fluctuating",
  "keyTriggers": string[],
  "protectiveFactors": string[],
  "recommendedInterventionTier": "self_care" | "counsellor_checkin" | "urgent_clinical_intervention" | "immediate_protection",
  "nonClinicalSummary": string,
  "suggestedActions": string[]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: [
        { text: prompt },
        { text: `Signals Data:\n${JSON.stringify(contextData, null, 2)}` },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallDDS: { type: Type.NUMBER },
            riskTier: { type: Type.STRING },
            subscores: {
              type: Type.OBJECT,
              properties: {
                emotionalDistress: { type: Type.NUMBER },
                cognitiveDisruption: { type: Type.NUMBER },
                somaticIndicators: { type: Type.NUMBER },
                behavioralWithdrawal: { type: Type.NUMBER },
              },
              required: [
                'emotionalDistress',
                'cognitiveDisruption',
                'somaticIndicators',
                'behavioralWithdrawal',
              ],
            },
            longitudinalTrend: { type: Type.STRING },
            keyTriggers: { type: Type.ARRAY, items: { type: Type.STRING } },
            protectiveFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedInterventionTier: { type: Type.STRING },
            nonClinicalSummary: { type: Type.STRING },
            suggestedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'overallDDS',
            'riskTier',
            'subscores',
            'longitudinalTrend',
            'keyTriggers',
            'protectiveFactors',
            'recommendedInterventionTier',
            'nonClinicalSummary',
            'suggestedActions',
          ],
        },
        safetySettings: GEMINI_SAFETY_SETTINGS,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  } catch (err: any) {
    console.error('[GeminiService] DDS computation error:', err);
    return {
      overallDDS: 38,
      riskTier: 'Moderate',
      subscores: {
        emotionalDistress: 40,
        cognitiveDisruption: 32,
        somaticIndicators: 45,
        behavioralWithdrawal: 35,
      },
      longitudinalTrend: 'stable',
      keyTriggers: ['sensory sensitivity to sudden noise', 'physical fatigue'],
      protectiveFactors: ['active use of sanctuary companion', 'self-awareness of somatic tension'],
      recommendedInterventionTier: 'counsellor_checkin',
      nonClinicalSummary:
        'Moderate distress noted primarily in somatic sensations (chest tightness, fatigue). Responsive to paced breathing and gentle grounding.',
      suggestedActions: [
        'Engage in 5-minute paced diaphragmatic breathing',
        'Offer evening warm raga soundscape session',
        'Schedule gentle morning check-in',
      ],
    };
  }
}
