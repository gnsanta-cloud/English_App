import { Preferences } from '@capacitor/preferences';
import type { LearningLevel, Word } from '../types';

const KEYS = {
  level: 'learning_level',
  index: 'current_index',
  myVocab: 'my_vocabulary',
  customVocab: 'custom_vocabulary',
} as const;

export async function loadLevel(): Promise<LearningLevel> {
  const { value } = await Preferences.get({ key: KEYS.level });
  if (value === 'middle' || value === 'high' || value === 'daily' || value === 'travel') {
    return value;
  }
  return 'middle';
}

export async function saveLevel(level: LearningLevel): Promise<void> {
  await Preferences.set({ key: KEYS.level, value: level });
}

export async function loadIndex(): Promise<number> {
  const { value } = await Preferences.get({ key: KEYS.index });
  const n = parseInt(value ?? '0', 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function saveIndex(index: number): Promise<void> {
  await Preferences.set({ key: KEYS.index, value: String(index) });
}

export async function loadMyVocabulary(): Promise<string[]> {
  const { value } = await Preferences.get({ key: KEYS.myVocab });
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveMyVocabulary(ids: string[]): Promise<void> {
  await Preferences.set({ key: KEYS.myVocab, value: JSON.stringify(ids) });
}

export async function loadCustomVocabulary(): Promise<Word[]> {
  const { value } = await Preferences.get({ key: KEYS.customVocab });
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as Word[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCustomVocabulary(words: Word[]): Promise<void> {
  await Preferences.set({ key: KEYS.customVocab, value: JSON.stringify(words) });
}
