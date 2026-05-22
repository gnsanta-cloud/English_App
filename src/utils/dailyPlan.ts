import type { Word } from '../types';

export const WORDS_PER_DAY = 30;

export function getTotalDays(wordCount: number): number {
  if (wordCount <= 0) return 0;
  return Math.ceil(wordCount / WORDS_PER_DAY);
}

/** 1-based day number */
export function getWordsForDay(allWords: Word[], day: number): Word[] {
  const start = (day - 1) * WORDS_PER_DAY;
  return allWords.slice(start, start + WORDS_PER_DAY);
}

export function getDayWordCount(allWords: Word[], day: number): number {
  return getWordsForDay(allWords, day).length;
}

/** Legacy flat index → day + index within day */
export function indexToDayPlan(flatIndex: number): { day: number; indexInDay: number } {
  const day = Math.floor(flatIndex / WORDS_PER_DAY) + 1;
  const indexInDay = flatIndex % WORDS_PER_DAY;
  return { day, indexInDay };
}

export function dayPlanToFlatIndex(day: number, indexInDay: number): number {
  return (day - 1) * WORDS_PER_DAY + indexInDay;
}

export type DayStatus = 'completed' | 'current' | 'available' | 'locked';

export function getDayStatus(
  day: number,
  completedDays: number[],
  currentDay: number,
): DayStatus {
  if (completedDays.includes(day)) return 'completed';
  if (day === currentDay) return 'current';
  const maxCompleted = completedDays.length > 0 ? Math.max(...completedDays) : 0;
  if (day <= maxCompleted + 1) return 'available';
  return 'locked';
}
