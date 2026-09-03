export type NavigationTab = 'home' | 'journal' | 'chat' | 'activities' | 'profile' | 'support';

export type CamouflageMode = 'none' | 'pantry' | 'weather' | 'calc';

export interface JournalEntry {
  id: string;
  tag: string;
  tagType: 'peace' | 'release' | 'grounded';
  title: string;
  content: string;
  timestamp: string;
  dateStr: string;
  reflectionInsight?: string;
  distressLevel?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'ilo' | 'user';
  text: string;
  subPrompt?: string;
  timestamp: string;
  actionsTriggered?: {
    tool: string;
    record?: any;
  }[];
  isCrisisAlert?: boolean;
}

export interface DynamicDistressScore {
  overallDDS: number;
  riskTier: 'Low' | 'Moderate' | 'Elevated' | 'Severe/Crisis';
  subscores: {
    emotionalDistress: number;
    cognitiveDisruption: number;
    somaticIndicators: number;
    behavioralWithdrawal: number;
  };
  longitudinalTrend: 'improving' | 'stable' | 'escalating' | 'fluctuating';
  keyTriggers: string[];
  protectiveFactors: string[];
  recommendedInterventionTier: 'self_care' | 'counsellor_checkin' | 'urgent_clinical_intervention' | 'immediate_protection';
  nonClinicalSummary: string;
  suggestedActions: string[];
}

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

export type HeartFeeling =
  | 'Calm & Peaceful'
  | 'Tender & Softly Heavy'
  | 'Anxious & Restless'
  | 'Full & Overwhelmed'
  | 'Grounded & Rooted';

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'raga' | 'body' | 'rest';
  categories: string[];
  duration: string;
  badge: string;
  description: string;
  imageUrl: string;
  actionText: string;
  actionIcon: string;
  footerNote: string;
}
