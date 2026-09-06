/**
 * Rive State Machine Specification for ilo - Reactive Trauma-Informed AI Mascot
 * 
 * Defines the state machine inputs, states, transition logic, layers, and
 * blend parameters for Rive (.riv) runtime implementation.
 */

export interface RiveStateMachineInputDefinition {
  name: string;
  type: 'Number' | 'Boolean' | 'Trigger';
  defaultValue: number | boolean;
  min?: number;
  max?: number;
  description: string;
}

export interface RiveStateDefinition {
  name: string;
  type: 'Animation' | 'BlendState' | 'AnyState' | 'EntryState';
  animationClip?: string;
  durationMs?: number;
  loop: 'Loop' | 'OneShot' | 'PingPong';
  description: string;
}

export interface RiveTransitionDefinition {
  fromState: string;
  toState: string;
  condition: string;
  exitTimeMs?: number;
  interpolationDurationMs: number;
}

/**
 * Formal Rive State Machine Configuration Specification
 */
export const RIVE_MASCOT_STATE_MACHINE_SPEC = {
  stateMachineName: 'MascotStateMachine',
  artboardName: 'ilo_character',
  version: '2.0.0',
  description:
    'Trauma-informed, mindful reactive mascot combining instant virtual-pet physical responsiveness with emotional attunement.',

  /**
   * 1. State Machine Inputs (Wired from mobile/web runtime)
   */
  inputs: [
    {
      name: 'mic_amplitude',
      type: 'Number',
      defaultValue: 0,
      min: 0,
      max: 100,
      description:
        'Live microphone audio RMS / amplitude metering (0-100). Drives mouth opening & active listening responsiveness.',
    },
    {
      name: 'distress_level',
      type: 'Number',
      defaultValue: 25,
      min: 0,
      max: 100,
      description:
        'Longitudinal Dynamic Distress Score (DDS) from backend fusion engine. Smoothly modulates posture from resting to concerned to grounding.',
    },
    {
      name: 'mascot_state',
      type: 'Number',
      defaultValue: 0,
      min: 0,
      max: 6,
      description:
        'Explicit LLM structured output state: 0=Idle, 1=Listening, 2=Thinking, 3=Speaking, 4=Empathetic_Concerned, 5=Encouraging, 6=Grounding.',
    },
    {
      name: 'touch_tap',
      type: 'Trigger',
      defaultValue: false,
      description:
        'Fires on user single tap / click for instant (<200ms) soft acknowledgment nod and eye-crinkle.',
    },
    {
      name: 'touch_hold',
      type: 'Boolean',
      defaultValue: false,
      description:
        'True when user holds/long-presses the character. Engages guided somatic grounding breathing.',
    },
    {
      name: 'is_listening',
      type: 'Boolean',
      defaultValue: false,
      description: 'True when microphone recording or user speech input is active.',
    },
    {
      name: 'is_speaking',
      type: 'Boolean',
      defaultValue: false,
      description: 'True while TTS audio playback or spoken response is actively outputting.',
    },
    {
      name: 'reduced_motion',
      type: 'Boolean',
      defaultValue: false,
      description:
        'Accessibility toggle: reduces amplitude, head tilts, and rapid transitions for neurodivergent or easily overstimulated users.',
    },
  ] as RiveStateMachineInputDefinition[],

  /**
   * 2. Animation States
   */
  states: [
    {
      name: 'Idle',
      type: 'Animation',
      animationClip: 'idle_breathing_loop',
      durationMs: 4500,
      loop: 'Loop',
      description:
        'Resting presence: slow diaphragm sinus rhythm (0.22 Hz), periodic soft blink cycle (every 3.8s), calm gaze.',
    },
    {
      name: 'Listening',
      type: 'Animation',
      animationClip: 'listening_attentive',
      durationMs: 2000,
      loop: 'Loop',
      description:
        'Alert but serene posture: subtle ear perk (3° outward), soft eye focus forward, gentle chest rise, listening aura ripple.',
    },
    {
      name: 'Thinking',
      type: 'Animation',
      animationClip: 'thinking_pondering',
      durationMs: 1600,
      loop: 'PingPong',
      description:
        'Gentle 2.5° head tilt, warm pulsing halo aura, avoiding freeze or stuck appearance while waiting for Gemini output.',
    },
    {
      name: 'Speaking',
      type: 'BlendState',
      animationClip: 'speaking_viseme_blend',
      durationMs: 1200,
      loop: 'Loop',
      description:
        'Mouth aperture and soft chest pulsation modulated in real-time by mic_amplitude or TTS audio envelope.',
    },
    {
      name: 'Empathetic_Concerned',
      type: 'Animation',
      animationClip: 'empathetic_attunement',
      durationMs: 3800,
      loop: 'Loop',
      description:
        'Gentle forward lean (scale 1.03), softened rounded eyelids, extended blink duration (450ms), relaxed brow — never a sad frown or mocking mimicry.',
    },
    {
      name: 'Encouraging',
      type: 'Animation',
      animationClip: 'warm_acknowledgment',
      durationMs: 2400,
      loop: 'Loop',
      description:
        'Understated warm micro-smile, gentle affirmative head nod, subtle warm golden ambient glow.',
    },
    {
      name: 'Grounding',
      type: 'Animation',
      animationClip: 'somatic_breath_guide',
      durationMs: 8000,
      loop: 'Loop',
      description:
        'Paced 4-4-4-4 or 4-7-8 breathing guide: character chest expands with radiant outer ring (Inhale), holds with stillness, softens deeply (Exhale).',
    },
    {
      name: 'Touch_Acknowledge',
      type: 'Animation',
      animationClip: 'micro_touch_crinkle',
      durationMs: 450,
      loop: 'OneShot',
      description:
        'Micro-reaction (<200ms): eye-crinkle, soft ear wiggle, instant physical tactile connection.',
    },
  ] as RiveStateDefinition[],

  /**
   * 3. State Transition Matrix & Transition Logic
   */
  transitions: [
    {
      fromState: 'AnyState',
      toState: 'Touch_Acknowledge',
      condition: 'touch_tap is triggered',
      interpolationDurationMs: 100,
    },
    {
      fromState: 'Touch_Acknowledge',
      toState: 'Idle',
      condition: 'Animation complete && touch_hold == false',
      exitTimeMs: 450,
      interpolationDurationMs: 200,
    },
    {
      fromState: 'AnyState',
      toState: 'Grounding',
      condition: 'touch_hold == true || distress_level >= 75 || mascot_state == 6',
      interpolationDurationMs: 300,
    },
    {
      fromState: 'Idle',
      toState: 'Listening',
      condition: 'is_listening == true || mic_amplitude > 12 || mascot_state == 1',
      interpolationDurationMs: 180,
    },
    {
      fromState: 'Listening',
      toState: 'Thinking',
      condition: 'is_listening == false && mascot_state == 2',
      interpolationDurationMs: 250,
    },
    {
      fromState: 'Thinking',
      toState: 'Speaking',
      condition: 'is_speaking == true || mascot_state == 3',
      interpolationDurationMs: 200,
    },
    {
      fromState: 'Speaking',
      toState: 'Empathetic_Concerned',
      condition: 'is_speaking == false && (mascot_state == 4 || distress_level > 50)',
      interpolationDurationMs: 400,
    },
    {
      fromState: 'Speaking',
      toState: 'Encouraging',
      condition: 'is_speaking == false && mascot_state == 5',
      interpolationDurationMs: 300,
    },
    {
      fromState: 'Speaking',
      toState: 'Idle',
      condition: 'is_speaking == false && mascot_state == 0',
      interpolationDurationMs: 400,
    },
    {
      fromState: 'Empathetic_Concerned',
      toState: 'Idle',
      condition: 'distress_level < 40 && mascot_state == 0',
      interpolationDurationMs: 600,
    },
    {
      fromState: 'Grounding',
      toState: 'Idle',
      condition: 'touch_hold == false && mascot_state != 6 && distress_level < 70',
      interpolationDurationMs: 500,
    },
  ] as RiveTransitionDefinition[],
};

export default RIVE_MASCOT_STATE_MACHINE_SPEC;
