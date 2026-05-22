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
import { VideoLearnTab } from './components/VideoLearnTab';
import { AppSplash } from './components/AppSplash';



export default function App() {

  const [tab, setTab] = useState<TabId>('home');

  const {

    ready,

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

    canGoBackCard,

  } = useAppState();



  const savedWords = words.filter((w) => myVocabulary.includes(w.id));

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



  if (!ready) {

    return (

      <div className="app-loading">

        <div className="spinner" />

        <p>단어장 불러오는 중...</p>

      </div>

    );

  }



  return (

    <div className="app">

      <AppSplash />

      <header className="app-header">

        <h1>
          {tab === 'home' ? '영어 학습 홈' : tab === 'video' ? '영상 학습' : getLevelLabel(level)}
        </h1>

      </header>



      <main className="app-main">

        {tab === 'home' && (

          <HomeTab

            level={level}

            wordCount={words.length}

            onSelectTopic={handleSelectTopic}

            onStartLearning={() => setTab('learn')}

          />

        )}

        {tab === 'learn' && (

          <LearnTab

            word={currentWord}

            levelLabel={getLevelLabel(level)}

            index={currentIndex}

            total={words.length}

            saved={isSaved}

            onNext={goNext}

            onPrevious={goPrevious}

            onSave={() => currentWord && addToMyVocabulary(currentWord.id)}

          />

        )}

        {tab === 'video' && <VideoLearnTab />}

        {tab === 'quiz' && (

          <QuizTab words={words} topicLabel={getLevelLabel(level)} onWrongAnswer={addToMyVocabulary} />

        )}

        {tab === 'conversation' && <AvatarChatTab level={level} />}

        {tab === 'mywords' && (

          <MyWordsTab savedWords={savedWords} onRemove={removeFromMyVocabulary} />

        )}

        {tab === 'settings' && (

          <SettingsTab level={level} onGoHome={() => setTab('home')} />

        )}

      </main>



      <TabNav active={tab} onChange={setTab} />

    </div>

  );

}


