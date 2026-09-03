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
}

export interface ChatMessage {
  id: string;
  sender: 'ilo' | 'user';
  text: string;
  subPrompt?: string;
  timestamp: string;
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
