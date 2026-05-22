export type LearningLevel = 'middle' | 'high' | 'daily' | 'travel';

export interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  exampleKo: string;
  level: LearningLevel;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  textKo?: string;
}

export interface AppState {
  level: LearningLevel;
  currentIndex: number;
  myVocabulary: string[];
  quizScore: number | null;
}

export type TabId = 'home' | 'learn' | 'quiz' | 'conversation' | 'mywords' | 'settings';
