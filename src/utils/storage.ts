import { Preferences } from '@capacitor/preferences';
import type { LearningLevel } from '../types';

export interface NotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

const KEYS = {
  level: 'learning_level',
  index: 'current_index',
  currentDay: 'current_day',
  dayIndex: 'day_index',
  completedDays: 'completed_days',
  myVocab: 'my_vocabulary',
  notifyEnabled: 'notify_enabled',
  notifyHour: 'notify_hour',
  notifyMinute: 'notify_minute',
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

function completedDaysKey(level: LearningLevel) {
  return `${KEYS.completedDays}_${level}`;
}

function currentDayKey(level: LearningLevel) {
  return `${KEYS.currentDay}_${level}`;
}

function dayIndexKey(level: LearningLevel) {
  return `${KEYS.dayIndex}_${level}`;
}

export async function loadCurrentDay(level: LearningLevel): Promise<number> {
  const { value } = await Preferences.get({ key: currentDayKey(level) });
  const n = parseInt(value ?? '1', 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export async function saveCurrentDay(level: LearningLevel, day: number): Promise<void> {
  await Preferences.set({ key: currentDayKey(level), value: String(day) });
}

export async function loadDayIndex(level: LearningLevel): Promise<number> {
  const { value } = await Preferences.get({ key: dayIndexKey(level) });
  const n = parseInt(value ?? '0', 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function saveDayProgress(
  level: LearningLevel,
  day: number,
  indexInDay: number,
): Promise<void> {
  await Promise.all([
    Preferences.set({ key: currentDayKey(level), value: String(day) }),
    Preferences.set({ key: dayIndexKey(level), value: String(indexInDay) }),
    Preferences.set({ key: KEYS.index, value: String((day - 1) * 30 + indexInDay) }),
  ]);
}

export async function loadCompletedDays(level: LearningLevel): Promise<number[]> {
  const { value } = await Preferences.get({ key: completedDaysKey(level) });
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as number[];
    return Array.isArray(parsed) ? parsed.filter((d) => Number.isFinite(d) && d >= 1) : [];
  } catch {
    return [];
  }
}

export async function saveCompletedDays(level: LearningLevel, days: number[]): Promise<void> {
  const unique = [...new Set(days)].sort((a, b) => a - b);
  await Preferences.set({ key: completedDaysKey(level), value: JSON.stringify(unique) });
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

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  const [enabledVal, hourVal, minuteVal] = await Promise.all([
    Preferences.get({ key: KEYS.notifyEnabled }),
    Preferences.get({ key: KEYS.notifyHour }),
    Preferences.get({ key: KEYS.notifyMinute }),
  ]);

  const hour = parseInt(hourVal.value ?? '9', 10);
  const minute = parseInt(minuteVal.value ?? '0', 10);

  return {
    enabled: enabledVal.value === 'true',
    hour: Number.isFinite(hour) && hour >= 0 && hour <= 23 ? hour : 9,
    minute: Number.isFinite(minute) && minute >= 0 && minute <= 59 ? minute : 0,
  };
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await Promise.all([
    Preferences.set({ key: KEYS.notifyEnabled, value: String(settings.enabled) }),
    Preferences.set({ key: KEYS.notifyHour, value: String(settings.hour) }),
    Preferences.set({ key: KEYS.notifyMinute, value: String(settings.minute) }),
  ]);
}
