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
import { fetchCaptionFriendlyVideos } from './utils/videoRecommendations';
import type { YoutubeVideoItem } from './utils/youtubeSearch';



export default function App() {

  const [tab, setTab] = useState<TabId>('home');
  const [recommendedVideos, setRecommendedVideos] = useState<YoutubeVideoItem[]>([]);
  const [videoListLoading, setVideoListLoading] = useState(false);
  const [videoListError, setVideoListError] = useState<string | null>(null);

  const {

    ready,

    level,

    changeLevel,

    words,

    currentIndex,

    currentWord,

    myVocabulary,

    addToMyVocabulary,

    removeFromSavedWords,

    saveVideoWords,

    savedWords,

    customVocabulary,

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
    let cancelled = false;
    setVideoListLoading(true);
    setVideoListError(null);
    setRecommendedVideos([]);
    void fetchCaptionFriendlyVideos(10)
      .then((videos) => {
        if (!cancelled) setRecommendedVideos(videos);
      })
      .catch(() => {
        if (!cancelled) setVideoListError('추천 영상 목록을 불러오지 못했습니다. 네트워크를 확인해 주세요.');
      })
      .finally(() => {
        if (!cancelled) setVideoListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

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

        {tab === 'video' && (
          <VideoLearnTab
            savedWordIds={myVocabulary}
            customWords={customVocabulary}
            onSaveVideoWords={saveVideoWords}
            recommendedVideos={recommendedVideos}
            listLoading={videoListLoading}
            listError={videoListError}
          />
        )}

        {tab === 'quiz' && (

          <QuizTab words={words} topicLabel={getLevelLabel(level)} onWrongAnswer={addToMyVocabulary} />

        )}

        {tab === 'conversation' && <AvatarChatTab level={level} />}

        {tab === 'mywords' && (

          <MyWordsTab savedWords={savedWords} onRemove={removeFromSavedWords} />

        )}

        {tab === 'settings' && (

          <SettingsTab level={level} onGoHome={() => setTab('home')} />

        )}

      </main>



      <TabNav active={tab} onChange={setTab} />

    </div>

  );

}


