import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Word } from '../types';
import { useBackHandler } from '../hooks/useAndroidBackButton';
import { ConfettiCelebration } from './ConfettiCelebration';

interface QuizTabProps {
  words: Word[];
  topicLabel: string;
  onWrongAnswer: (wordId: string) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function QuizTab({ words, topicLabel, onWrongAnswer }: QuizTabProps) {
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Word[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const resetQuiz = useCallback(() => {
    setStarted(false);
    setQuestions([]);
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
    setShowCelebration(false);
  }, []);

  const startQuiz = () => {
    const q = shuffle(words).slice(0, Math.min(10, words.length));
    setQuestions(q);
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
    setShowCelebration(false);
    setStarted(true);
  };

  useEffect(() => {
    resetQuiz();
  }, [words, topicLabel, resetQuiz]);

  useBackHandler(() => {
    if (!started) return false;
    resetQuiz();
    return true;
  }, started);

  const currentWord = questions[current];

  const options = useMemo(() => {
    if (!currentWord) return [];
    const wrong = shuffle(words.filter((w) => w.id !== currentWord.id))
      .slice(0, 3)
      .map((w) => w.meaning);
    return shuffle([currentWord.meaning, ...wrong]);
  }, [currentWord, words]);

  if (!started) {
    return (
      <section className="quiz-tab">
        <div className="quiz-intro">
          <h2>단어 퀴즈</h2>
          <p className="quiz-topic-badge">{topicLabel}</p>
          <p>10문제 · 객관식 · 틀린 단어는 나의 단어장에 저장됩니다</p>
          <button type="button" className="primary-btn" onClick={startQuiz}>
            퀴즈 시작
          </button>
        </div>
      </section>
    );
  }

  if (finished) {
    return (
      <section className="quiz-tab">
        {showCelebration && <ConfettiCelebration />}
        <div className="quiz-result">
          <h2>퀴즈 결과</h2>
          <p className="score-display">{score}점</p>
          {score >= 100 && <p className="celebration-text">참 잘했어요! 🎉</p>}
          <button type="button" className="primary-btn" onClick={startQuiz}>
            다시 하기
          </button>
        </div>
      </section>
    );
  }

  if (!currentWord) return null;

  const isCorrect = selected === currentWord.meaning;
  const isLast = current + 1 >= questions.length;

  const handleSelect = (meaning: string) => {
    if (selected) return;
    setSelected(meaning);
    if (meaning !== currentWord.meaning) {
      onWrongAnswer(currentWord.id);
    }
  };

  const handleNext = () => {
    const points = selected === currentWord.meaning ? 10 : 0;
    const newScore = score + points;

    if (isLast) {
      setScore(newScore);
      setFinished(true);
      if (newScore >= 100) setShowCelebration(true);
      return;
    }
    setScore(newScore);
    setCurrent((c) => c + 1);
    setSelected(null);
  };

  return (
    <section className="quiz-tab">
      <div className="quiz-progress">
        {current + 1} / {questions.length} · 현재 {score}점
      </div>
      <div className="quiz-card">
        <h3 className="quiz-word">{currentWord.word}</h3>
        <p className="quiz-prompt">뜻을 고르세요</p>
        <div className="quiz-options">
          {options.map((opt) => {
            let cls = 'quiz-option';
            if (selected) {
              if (opt === currentWord.meaning) cls += ' correct';
              else if (opt === selected) cls += ' wrong';
            }
            return (
              <button
                key={opt}
                type="button"
                className={cls}
                onClick={() => handleSelect(opt)}
                disabled={!!selected}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {selected && (
          <div className="quiz-feedback">
            <p>{isCorrect ? '정답입니다!' : '오답 — 나의 단어장에 저장했어요'}</p>
            <button type="button" className="primary-btn" onClick={handleNext}>
              {isLast ? '결과 보기' : '다음 문제'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
