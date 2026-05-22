export type LearningLevel = 'middle' | 'high' | 'daily' | 'travel';

export interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  exampleKo: string;
  level: LearningLevel;
  /** 영상 자막에서 추출한 단어 */
  fromVideo?: boolean;
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

export type TabId = 'home' | 'learn' | 'video' | 'quiz' | 'conversation' | 'mywords' | 'settings';

export interface VideoCaptionLine {
  id: string;
  start: number;
  duration: number;
  text: string;
  textKo: string;
}
