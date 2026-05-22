import { useCallback, useEffect, useMemo, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import type { LearningLevel } from '../types';
import {
  WORDS_PER_DAY,
  getDayWordCount,
  getTotalDays,
  getWordsForDay,
  indexToDayPlan,
} from '../utils/dailyPlan';
import {
  loadCompletedDays,
  loadCurrentDay,
  loadDayIndex,
  loadDayStudiedCounts,
  loadIndex,
  loadLevel,
  loadMyVocabulary,
  saveCompletedDays,
  saveDayProgress,
  saveDayStudiedCounts,
  saveLevel,
  saveMyVocabulary,
} from '../utils/storage';
import { getAllBankWords, getWordsByLevel, loadWordBank } from '../utils/words';

export function useAppState() {
  const [ready, setReady] = useState(false);
  const [level, setLevel] = useState<LearningLevel>('middle');
  const [currentDay, setCurrentDay] = useState(1);
  const [indexInDay, setIndexInDay] = useState(0);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [dayStudiedCounts, setDayStudiedCounts] = useState<Record<number, number>>({});
  const [myVocabulary, setMyVocabulary] = useState<string[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [wordsLoaded, setWordsLoaded] = useState(false);
  const [dayJustCompleted, setDayJustCompleted] = useState<number | null>(null);

  const words = getWordsByLevel(level);
  const totalDays = getTotalDays(words.length);
  const dayWords = useMemo(() => getWordsForDay(words, currentDay), [words, currentDay]);
  const currentWord = dayWords[indexInDay] ?? null;

  const recordStudied = useCallback(
    async (day: number, count: number) => {
      const total = getDayWordCount(words, day);
      const capped = Math.min(Math.max(count, 0), total);
      setDayStudiedCounts((prev) => {
        const next = Math.max(prev[day] ?? 0, capped);
        if (next === (prev[day] ?? 0)) return prev;
        const merged = { ...prev, [day]: next };
        void saveDayStudiedCounts(level, merged);
        return merged;
      });
    },
    [level, words],
  );

  const getStudiedCount = useCallback(
    (day: number) => {
      const total = getDayWordCount(words, day);
      if (completedDays.includes(day)) return total;
      const stored = dayStudiedCounts[day] ?? 0;
      if (day === currentDay) return Math.max(stored, indexInDay + 1);
      return Math.min(stored, total);
    },
    [words, completedDays, dayStudiedCounts, currentDay, indexInDay],
  );

  const persistProgress = useCallback(
    (day: number, idx: number) => {
      void saveDayProgress(level, day, idx);
      void recordStudied(day, idx + 1);
    },
    [level, recordStudied],
  );

  useEffect(() => {
    (async () => {
      await loadWordBank();
      setWordsLoaded(true);
      const [savedLevel, flatIndex, savedVocab] = await Promise.all([
        loadLevel(),
        loadIndex(),
        loadMyVocabulary(),
      ]);

      const [savedDay, savedIdx, savedCompleted, savedStudied] = await Promise.all([
        loadCurrentDay(savedLevel),
        loadDayIndex(savedLevel),
        loadCompletedDays(savedLevel),
        loadDayStudiedCounts(savedLevel),
      ]);

      const list = getWordsByLevel(savedLevel);
      const days = getTotalDays(list.length);

      let day = savedDay;
      let idx = savedIdx;

      if (savedDay === 1 && savedIdx === 0 && flatIndex > 0) {
        const migrated = indexToDayPlan(flatIndex);
        day = Math.min(migrated.day, Math.max(1, days));
        idx = Math.min(migrated.indexInDay, getDayWordCount(list, day) - 1);
        await saveDayProgress(savedLevel, day, idx);
      }

      day = Math.min(Math.max(1, day), Math.max(1, days));
      idx = Math.min(Math.max(0, idx), Math.max(0, getDayWordCount(list, day) - 1));

      const studied = { ...savedStudied };
      const dayTotal = getDayWordCount(list, day);
      if (savedCompleted.includes(day)) {
        studied[day] = dayTotal;
      } else {
        studied[day] = Math.max(studied[day] ?? 0, idx + 1);
      }

      setLevel(savedLevel);
      setCurrentDay(day);
      setIndexInDay(idx);
      setCompletedDays(savedCompleted);
      setDayStudiedCounts(studied);
      setMyVocabulary(savedVocab);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    persistProgress(currentDay, indexInDay);
  }, [currentDay, indexInDay, ready, persistProgress]);

  useEffect(() => {
    if (!ready) return;

    const pauseListener = CapApp.addListener('pause', () => {
      persistProgress(currentDay, indexInDay);
    });

    const stateListener = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) persistProgress(currentDay, indexInDay);
    });

    const beforeUnload = () => persistProgress(currentDay, indexInDay);
    window.addEventListener('beforeunload', beforeUnload);

    return () => {
      pauseListener.then((l) => l.remove());
      stateListener.then((l) => l.remove());
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [currentDay, indexInDay, ready, persistProgress]);

  const markDayComplete = useCallback(
    async (day: number) => {
      if (completedDays.includes(day)) return;
      const total = getDayWordCount(words, day);
      const next = [...completedDays, day].sort((a, b) => a - b);
      setCompletedDays(next);
      await saveCompletedDays(level, next);
      await recordStudied(day, total);
      setDayJustCompleted(day);
    },
    [completedDays, level, words, recordStudied],
  );

  const clearDayJustCompleted = useCallback(() => setDayJustCompleted(null), []);

  const changeLevel = useCallback(async (newLevel: LearningLevel) => {
    await saveLevel(newLevel);
    const [day, idx, completed, studied] = await Promise.all([
      loadCurrentDay(newLevel),
      loadDayIndex(newLevel),
      loadCompletedDays(newLevel),
      loadDayStudiedCounts(newLevel),
    ]);
    const list = getWordsByLevel(newLevel);
    const days = getTotalDays(list.length);
    const safeDay = Math.min(Math.max(1, day), Math.max(1, days));
    const safeIdx = Math.min(Math.max(0, idx), Math.max(0, getDayWordCount(list, safeDay) - 1));

    setLevel(newLevel);
    setCurrentDay(safeDay);
    setIndexInDay(safeIdx);
    setCompletedDays(completed);
    setDayStudiedCounts(studied);
    setHistory([]);
    setDayJustCompleted(null);
    await saveDayProgress(newLevel, safeDay, safeIdx);
  }, []);

  const selectDay = useCallback(
    async (day: number) => {
      const safeDay = Math.min(Math.max(1, day), Math.max(1, totalDays));
      const total = getDayWordCount(words, safeDay);
      const stored = dayStudiedCounts[safeDay] ?? 0;
      const studied = completedDays.includes(safeDay) ? total : stored;
      let startIdx = 0;
      if (!completedDays.includes(safeDay) && studied > 0 && studied < total) {
        startIdx = Math.min(studied, total - 1);
      }

      setCurrentDay(safeDay);
      setIndexInDay(startIdx);
      setHistory([]);
      setDayJustCompleted(null);
      await saveDayProgress(level, safeDay, startIdx);
      if (startIdx > 0) await recordStudied(safeDay, startIdx + 1);
    },
    [level, totalDays, words, completedDays, dayStudiedCounts, recordStudied],
  );

  const addToMyVocabulary = useCallback(
    async (wordId: string) => {
      if (myVocabulary.includes(wordId)) return;
      const next = [...myVocabulary, wordId];
      setMyVocabulary(next);
      await saveMyVocabulary(next);
    },
    [myVocabulary],
  );

  const removeFromMyVocabulary = useCallback(
    async (wordId: string) => {
      const next = myVocabulary.filter((id) => id !== wordId);
      setMyVocabulary(next);
      await saveMyVocabulary(next);
    },
    [myVocabulary],
  );

  const savedWords = getAllBankWords().filter((w) => myVocabulary.includes(w.id));

  const goNext = useCallback(() => {
    const lastIndex = dayWords.length - 1;
    if (indexInDay < lastIndex) {
      setIndexInDay((prev) => {
        const next = prev + 1;
        setHistory((h) => [...h, prev]);
        void recordStudied(currentDay, next + 1);
        return next;
      });
      return;
    }
    void markDayComplete(currentDay);
  }, [dayWords.length, indexInDay, currentDay, markDayComplete, recordStudied]);

  const goPrevious = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setIndexInDay(prev);
      return h.slice(0, -1);
    });
  }, []);

  const firstIncompleteDay = useMemo(() => {
    for (let d = 1; d <= totalDays; d++) {
      if (!completedDays.includes(d)) return d;
    }
    return totalDays > 0 ? totalDays : 1;
  }, [totalDays, completedDays]);

  const getDayProgress = useCallback(
    (day: number) => {
      const total = getDayWordCount(words, day);
      const studied = getStudiedCount(day);
      return { studied, total };
    },
    [words, getStudiedCount],
  );

  return {
    ready: ready && wordsLoaded,
    level,
    changeLevel,
    words,
    dayWords,
    currentDay,
    indexInDay,
    totalDays,
    wordsPerDay: WORDS_PER_DAY,
    completedDays,
    dayJustCompleted,
    clearDayJustCompleted,
    currentWord,
    myVocabulary,
    savedWords,
    addToMyVocabulary,
    removeFromMyVocabulary,
    selectDay,
    markDayComplete,
    firstIncompleteDay,
    getDayProgress,
    goNext,
    goPrevious,
    canGoBackCard: history.length > 0,
  };
};
