import { useCallback, useEffect, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import type { LearningLevel } from '../types';
import type { Word } from '../types';
import {
  loadCustomVocabulary,
  loadIndex,
  loadLevel,
  loadMyVocabulary,
  saveCustomVocabulary,
  saveIndex,
  saveLevel,
  saveMyVocabulary,
} from '../utils/storage';
import { getAllBankWords, getWordsByLevel, loadWordBank } from '../utils/words';

export function useAppState() {
  const [ready, setReady] = useState(false);
  const [level, setLevel] = useState<LearningLevel>('middle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myVocabulary, setMyVocabulary] = useState<string[]>([]);
  const [customVocabulary, setCustomVocabulary] = useState<Word[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [wordsLoaded, setWordsLoaded] = useState(false);

  const words = getWordsByLevel(level);

  useEffect(() => {
    (async () => {
      await loadWordBank();
      setWordsLoaded(true);
      const [savedLevel, savedIndex, savedVocab, savedCustom] = await Promise.all([
        loadLevel(),
        loadIndex(),
        loadMyVocabulary(),
        loadCustomVocabulary(),
      ]);
      setLevel(savedLevel);
      const list = getWordsByLevel(savedLevel);
      setCurrentIndex(Math.min(savedIndex, Math.max(0, list.length - 1)));
      setMyVocabulary(savedVocab);
      setCustomVocabulary(savedCustom);
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

  const removeCustomWord = useCallback(
    async (wordId: string) => {
      const next = customVocabulary.filter((w) => w.id !== wordId);
      setCustomVocabulary(next);
      await saveCustomVocabulary(next);
    },
    [customVocabulary],
  );

  const removeFromSavedWords = useCallback(
    async (wordId: string) => {
      if (wordId.startsWith('video-')) {
        await removeCustomWord(wordId);
        return;
      }
      await removeFromMyVocabulary(wordId);
    },
    [removeCustomWord, removeFromMyVocabulary],
  );

  /** 영상 주요 단어 → 나의 단어장 (기존 단어장 ID + 영상 전용 단어) */
  const saveVideoWords = useCallback(
    async (entries: Word[]) => {
      let vocabIds = [...myVocabulary];
      let custom = [...customVocabulary];

      for (const entry of entries) {
        const bank = getAllBankWords().find(
          (w) => w.word.toLowerCase() === entry.word.toLowerCase(),
        );
        if (bank) {
          if (!vocabIds.includes(bank.id)) vocabIds = [...vocabIds, bank.id];
          continue;
        }
        const exists = custom.some(
          (w) => w.word.toLowerCase() === entry.word.toLowerCase(),
        );
        if (!exists) custom = [...custom, entry];
      }

      setMyVocabulary(vocabIds);
      setCustomVocabulary(custom);
      await Promise.all([saveMyVocabulary(vocabIds), saveCustomVocabulary(custom)]);
    },
    [myVocabulary, customVocabulary],
  );

  const savedWords = (() => {
    const bank = getAllBankWords().filter((w) => myVocabulary.includes(w.id));
    const custom = customVocabulary.filter(
      (c) => !bank.some((b) => b.word.toLowerCase() === c.word.toLowerCase()),
    );
    return [...bank, ...custom];
  })();

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
    customVocabulary,
    savedWords,
    addToMyVocabulary,
    removeFromMyVocabulary,
    removeFromSavedWords,
    saveVideoWords,
    goNext,
    goPrevious,
    canGoBackCard: history.length > 0,
  };
}
