import { useCallback, useEffect, useState } from 'react';

import { App as CapApp } from '@capacitor/app';

import type { LearningLevel, TabId } from './types';

import { installAndroidBackButton, setAndroidBackFallback } from './hooks/useAndroidBackButton';

import { useAppState } from './hooks/useAppState';

import { getLevelLabel } from './utils/words';

import { TabNav } from './components/TabNav';

import { HomeTab } from './components/HomeTab';

import { LearnTab } from './components/LearnTab';

import { QuizTab } from './components/QuizTab';

import { AvatarChatTab } from './components/AvatarChatTab';

import { MyWordsTab } from './components/MyWordsTab';

import { SettingsTab } from './components/SettingsTab';
import { AppSplash } from './components/AppSplash';
import { syncStudyReminderFromStorage } from './utils/localNotifications';

export default function App() {
  const [tab, setTab] = useState<TabId>('home');

  const {
    ready,
    level,
    changeLevel,
    words,
    dayWords,
    currentDay,
    indexInDay,
    totalDays,
    completedDays,
    dayJustCompleted,
    clearDayJustCompleted,
    currentWord,
    myVocabulary,
    addToMyVocabulary,
    removeFromMyVocabulary,
    savedWords,
    selectDay,
    firstIncompleteDay,
    getDayProgress,
    goNext,
    goPrevious,
    canGoBackCard,
  } = useAppState();

  const isSaved = currentWord ? myVocabulary.includes(currentWord.id) : false;

  const handleSelectTopic = useCallback(
    async (newLevel: LearningLevel) => {
      await changeLevel(newLevel);
    },
    [changeLevel],
  );

  const handleSystemBack = useCallback(() => {
    if (tab === 'home') {
      if (window.confirm('앱을 종료하시겠습니까?')) {
        void CapApp.exitApp();
      }
      return true;
    }
    if (tab === 'learn' && canGoBackCard) {
      goPrevious();
      return true;
    }
    setTab('home');
    return true;
  }, [tab, canGoBackCard, goPrevious]);

  useEffect(() => {
    installAndroidBackButton();
  }, []);

  useEffect(() => {
    setAndroidBackFallback(handleSystemBack);
  }, [handleSystemBack]);

  useEffect(() => {
    if (!ready) return;
    void syncStudyReminderFromStorage();
  }, [ready]);

  if (!ready) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>단어장 불러오는 중...</p>
      </div>
    );
  }

  const headerTitle =
    tab === 'home'
      ? '영어 학습 홈'
      : tab === 'learn'
        ? `${getLevelLabel(level)} · ${currentDay}일차`
        : tab === 'quiz'
          ? `퀴즈 · ${currentDay}일차`
          : getLevelLabel(level);

  return (
    <div className="app">
      <AppSplash />

      <header className="app-header">
        <h1>{headerTitle}</h1>
      </header>

      <main className="app-main">
        {tab === 'home' && (
          <HomeTab
            level={level}
            wordCount={words.length}
            totalDays={totalDays}
            currentDay={currentDay}
            completedDays={completedDays}
            firstIncompleteDay={firstIncompleteDay}
            getDayProgress={getDayProgress}
            onSelectDay={selectDay}
            onStartLearning={() => setTab('learn')}
            onOpenSettings={() => setTab('settings')}
          />
        )}

        {tab === 'learn' && (
          <LearnTab
            word={currentWord}
            levelLabel={getLevelLabel(level)}
            dayNumber={currentDay}
            indexInDay={indexInDay}
            dayWordCount={dayWords.length}
            saved={isSaved}
            dayJustCompleted={dayJustCompleted}
            onDismissDayComplete={clearDayJustCompleted}
            onNext={goNext}
            onPrevious={goPrevious}
            onSave={() => currentWord && addToMyVocabulary(currentWord.id)}
          />
        )}

        {tab === 'quiz' && (
          <QuizTab
            words={dayWords}
            allWords={words}
            topicLabel={getLevelLabel(level)}
            dayNumber={currentDay}
            onWrongAnswer={addToMyVocabulary}
          />
        )}

        {tab === 'conversation' && <AvatarChatTab level={level} />}

        {tab === 'mywords' && (
          <MyWordsTab savedWords={savedWords} onRemove={removeFromMyVocabulary} />
        )}

        {tab === 'settings' && (
          <SettingsTab
            level={level}
            wordCount={words.length}
            onSelectTopic={handleSelectTopic}
          />
        )}
      </main>

      <TabNav active={tab} onChange={setTab} />
    </div>
  );
}
