import { useCallback, useEffect, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import type { LearningLevel } from '../types';
import {
  loadIndex,
  loadLevel,
  loadMyVocabulary,
  saveIndex,
  saveLevel,
  saveMyVocabulary,
} from '../utils/storage';
import { getWordsByLevel, loadWordBank } from '../utils/words';

export function useAppState() {
  const [ready, setReady] = useState(false);
  const [level, setLevel] = useState<LearningLevel>('middle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myVocabulary, setMyVocabulary] = useState<string[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [wordsLoaded, setWordsLoaded] = useState(false);

  const words = getWordsByLevel(level);

  useEffect(() => {
    (async () => {
      await loadWordBank();
      setWordsLoaded(true);
      const [savedLevel, savedIndex, savedVocab] = await Promise.all([
        loadLevel(),
        loadIndex(),
        loadMyVocabulary(),
      ]);
      setLevel(savedLevel);
      const list = getWordsByLevel(savedLevel);
      setCurrentIndex(Math.min(savedIndex, Math.max(0, list.length - 1)));
      setMyVocabulary(savedVocab);
      setReady(true);
    })();
  }, []);

  const persistIndex = useCallback((index: number) => {
    saveIndex(index);
  }, []);

  useEffect(() => {
    if (!ready) return;
    persistIndex(currentIndex);
  }, [currentIndex, ready, persistIndex]);

  useEffect(() => {
    if (!ready) return;

    const pauseListener = CapApp.addListener('pause', () => {
      saveIndex(currentIndex);
    });

    const stateListener = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) saveIndex(currentIndex);
    });

    const beforeUnload = () => saveIndex(currentIndex);
    window.addEventListener('beforeunload', beforeUnload);

    return () => {
      pauseListener.then((l) => l.remove());
      stateListener.then((l) => l.remove());
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [currentIndex, ready]);

  const changeLevel = useCallback(async (newLevel: LearningLevel) => {
    await saveLevel(newLevel);
    setLevel(newLevel);
    setCurrentIndex(0);
    setHistory([]);
    await saveIndex(0);
  }, []);

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

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = Math.min(prev + 1, words.length - 1);
      if (next !== prev) setHistory((h) => [...h, prev]);
      return next;
    });
  }, [words.length]);

  const goPrevious = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setCurrentIndex(prev);
      return h.slice(0, -1);
    });
  }, []);

  const currentWord = words[currentIndex] ?? null;

  return {
    ready: ready && wordsLoaded,
    level,
    changeLevel,
    words,
    currentIndex,
    currentWord,
    myVocabulary,
    addToMyVocabulary,
    removeFromMyVocabulary,
    goNext,
    goPrevious,
    canGoBackCard: history.length > 0,
  };
}
