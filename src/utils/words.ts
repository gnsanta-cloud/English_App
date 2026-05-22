import type { LearningLevel, Word } from '../types';

interface RawWord {
  word: string;
  meaning: string;
  example: string;
  exampleKo: string;
}

const FILES: Record<LearningLevel, string> = {
  middle: './data/middleSchool.json',
  high: './data/highSchool.json',
  daily: './data/dailyConversation.json',
  travel: './data/travelConversation.json',
};

let wordBank: Record<LearningLevel, Word[]> | null = null;

function toWords(data: RawWord[], level: LearningLevel): Word[] {
  return data.map((item, index) => ({
    id: `${level}-${index}`,
    word: item.word,
    meaning: item.meaning,
    example: item.example,
    exampleKo: item.exampleKo,
    level,
  }));
}

export async function loadWordBank(): Promise<Record<LearningLevel, Word[]>> {
  if (wordBank) return wordBank;

  const levels = Object.keys(FILES) as LearningLevel[];
  const entries = await Promise.all(
    levels.map(async (level) => {
      const res = await fetch(FILES[level]);
      if (!res.ok) throw new Error(`Failed to load ${FILES[level]}`);
      const data = (await res.json()) as RawWord[];
      return [level, toWords(data, level)] as const;
    }),
  );

  wordBank = Object.fromEntries(entries) as Record<LearningLevel, Word[]>;
  return wordBank;
}

export function getWordsByLevel(level: LearningLevel): Word[] {
  return wordBank?.[level] ?? [];
}

/** 전체 단어장에서 단어 검색 (영상 주요 단어 → 기존 단어장 매칭) */
export function findWordInBank(term: string): Word | null {
  if (!wordBank) return null;
  const key = term.toLowerCase().trim();
  for (const list of Object.values(wordBank)) {
    const found = list.find((w) => w.word.toLowerCase() === key);
    if (found) return found;
  }
  return null;
}

export function getAllBankWords(): Word[] {
  if (!wordBank) return [];
  return Object.values(wordBank).flat();
}

export function getLevelLabel(level: LearningLevel): string {
  const labels: Record<LearningLevel, string> = {
    middle: '중학 단어',
    high: '고등 단어',
    daily: '일상 패턴',
    travel: '여행 대화',
  };
  return labels[level];
}
