import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Word } from '../types';
import { useBackHandler } from '../hooks/useAndroidBackButton';
import { isEnglishQuizAnswerCorrect, isQuizAnswerCorrect } from '../utils/quizAnswer';
import { ConfettiCelebration } from './ConfettiCelebration';

export type QuizMode = 'multiple' | 'subjective';
export type QuizDirection = 'en-ko' | 'ko-en';

interface QuizTabProps {
  words: Word[];
  allWords: Word[];
  topicLabel: string;
  dayNumber: number;
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

const QUIZ_SIZE = 10;

function getCorrectAnswer(word: Word, direction: QuizDirection): string {
  return direction === 'en-ko' ? word.meaning : word.word;
}

function getPromptText(word: Word, direction: QuizDirection): string {
  return direction === 'en-ko' ? word.word : word.meaning;
}

function directionLabel(direction: QuizDirection): string {
  return direction === 'en-ko' ? '영→한' : '한→영';
}

export function QuizTab({ words, allWords, topicLabel, dayNumber, onWrongAnswer }: QuizTabProps) {
  const [phase, setPhase] = useState<'select' | 'playing' | 'finished'>('select');
  const [direction, setDirection] = useState<QuizDirection>('en-ko');
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [questions, setQuestions] = useState<Word[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const resetQuiz = useCallback(() => {
    setPhase('select');
    setMode(null);
    setQuestions([]);
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setTextAnswer('');
    setSubmitted(false);
    setShowCelebration(false);
  }, []);

  const startQuiz = (quizMode: QuizMode) => {
    const pool = words.length > 0 ? words : allWords;
    const q = shuffle(pool).slice(0, Math.min(QUIZ_SIZE, pool.length));
    setMode(quizMode);
    setQuestions(q);
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setTextAnswer('');
    setSubmitted(false);
    setShowCelebration(false);
    setPhase('playing');
  };

  useEffect(() => {
    resetQuiz();
  }, [words, topicLabel, dayNumber, resetQuiz]);

  useBackHandler(() => {
    if (phase === 'select') return false;
    resetQuiz();
    return true;
  }, phase !== 'select');

  const currentWord = questions[current];

  const options = useMemo(() => {
    if (!currentWord || mode !== 'multiple') return [];
    const pick = (w: Word) => (direction === 'en-ko' ? w.meaning : w.word);
    const correct = pick(currentWord);
    const wrong = shuffle(allWords.filter((w) => w.id !== currentWord.id))
      .slice(0, 3)
      .map(pick);
    return shuffle([correct, ...wrong]);
  }, [currentWord, allWords, mode, direction]);

  if (phase === 'select') {
    const poolSize = words.length > 0 ? words.length : allWords.length;
    const enKo = direction === 'en-ko';
    return (
      <section className="quiz-tab">
        <div className="quiz-intro">
          <h2>단어 퀴즈</h2>
          <p className="quiz-topic-badge">
            {topicLabel} · {dayNumber}일차
          </p>
          <p>최대 {Math.min(QUIZ_SIZE, poolSize)}문제 · 틀린 단어는 나의 단어장에 저장</p>

          <div className="quiz-direction-section">
            <p className="quiz-direction-label">출제 방향</p>
            <div className="quiz-direction-toggle" role="group" aria-label="출제 방향">
              <button
                type="button"
                className={`quiz-direction-btn ${enKo ? 'active' : ''}`}
                onClick={() => setDirection('en-ko')}
              >
                영→한
              </button>
              <button
                type="button"
                className={`quiz-direction-btn ${!enKo ? 'active' : ''}`}
                onClick={() => setDirection('ko-en')}
              >
                한→영
              </button>
            </div>
            <p className="quiz-direction-hint">
              {enKo ? '영어 단어를 보고 한글 뜻 맞추기' : '한글 뜻을 보고 영어 단어 맞추기'}
            </p>
          </div>

          <div className="quiz-mode-grid">
            <button
              type="button"
              className="quiz-mode-card"
              onClick={() => startQuiz('multiple')}
              disabled={poolSize === 0}
            >
              <span className="quiz-mode-icon">📝</span>
              <strong>객관식</strong>
              <span>{enKo ? '뜻 4개 중 고르기' : '단어 4개 중 고르기'}</span>
            </button>
            <button
              type="button"
              className="quiz-mode-card"
              onClick={() => startQuiz('subjective')}
              disabled={poolSize === 0}
            >
              <span className="quiz-mode-icon">✍️</span>
              <strong>주관식</strong>
              <span>{enKo ? '뜻 직접 입력' : '영단어 직접 입력'}</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (phase === 'finished') {
    return (
      <section className="quiz-tab">
        {showCelebration && <ConfettiCelebration />}
        <div className="quiz-result">
          <h2>퀴즈 결과</h2>
          <p className="quiz-result-mode">
            {directionLabel(direction)} · {mode === 'multiple' ? '객관식' : '주관식'}
          </p>
          <p className="score-display">{score}점</p>
          {score >= 100 && <p className="celebration-text">참 잘했어요! 🎉</p>}
          <button type="button" className="primary-btn" onClick={resetQuiz}>
            다시 하기
          </button>
        </div>
      </section>
    );
  }

  if (!currentWord || !mode) return null;

  const isLast = current + 1 >= questions.length;
  const correctAnswer = getCorrectAnswer(currentWord, direction);
  const promptText = getPromptText(currentWord, direction);
  const enKo = direction === 'en-ko';

  const checkAnswer = (answer: string) => {
    if (enKo) return isQuizAnswerCorrect(answer, correctAnswer);
    return isEnglishQuizAnswerCorrect(answer, correctAnswer);
  };

  const handleMultipleSelect = (option: string) => {
    if (selected) return;
    setSelected(option);
    if (option !== correctAnswer) onWrongAnswer(currentWord.id);
  };

  const handleSubjectiveSubmit = () => {
    if (submitted || !textAnswer.trim()) return;
    setSubmitted(true);
    if (!checkAnswer(textAnswer)) onWrongAnswer(currentWord.id);
  };

  const isCorrect =
    mode === 'multiple' ? selected === correctAnswer : submitted && checkAnswer(textAnswer);

  const hasAnswered = mode === 'multiple' ? !!selected : submitted;

  const handleNext = () => {
    const points = hasAnswered && isCorrect ? 10 : 0;
    const newScore = score + points;

    if (isLast) {
      setScore(newScore);
      setPhase('finished');
      if (newScore >= 100) setShowCelebration(true);
      return;
    }
    setScore(newScore);
    setCurrent((c) => c + 1);
    setSelected(null);
    setTextAnswer('');
    setSubmitted(false);
  };

  return (
    <section className="quiz-tab">
      <div className="quiz-progress">
        <span className="quiz-mode-label">{directionLabel(direction)}</span>
        <span className="quiz-mode-label">{mode === 'multiple' ? '객관식' : '주관식'}</span>
        {current + 1} / {questions.length} · {score}점
      </div>
      <div className="quiz-card">
        <h3 className={`quiz-word ${!enKo ? 'quiz-prompt-ko' : ''}`}>{promptText}</h3>
        <p className="quiz-prompt">
          {mode === 'multiple'
            ? enKo
              ? '뜻을 고르세요'
              : '영어 단어를 고르세요'
            : enKo
              ? '뜻을 입력하세요'
              : '영어 단어를 입력하세요'}
        </p>

        {mode === 'multiple' && (
          <div className="quiz-options">
            {options.map((opt) => {
              let cls = 'quiz-option';
              if (selected) {
                if (opt === correctAnswer) cls += ' correct';
                else if (opt === selected) cls += ' wrong';
              }
              return (
                <button
                  key={opt}
                  type="button"
                  className={cls}
                  onClick={() => handleMultipleSelect(opt)}
                  disabled={!!selected}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {mode === 'subjective' && (
          <div className="quiz-subjective">
            <input
              type="text"
              className="quiz-text-input"
              placeholder={enKo ? '한글 뜻 입력' : '영어 단어 입력'}
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={submitted}
              onKeyDown={(e) => e.key === 'Enter' && handleSubjectiveSubmit()}
              enterKeyHint="done"
              autoCapitalize={enKo ? 'off' : 'none'}
              autoCorrect="off"
            />
            {!submitted && (
              <button
                type="button"
                className="primary-btn quiz-submit-btn"
                onClick={handleSubjectiveSubmit}
                disabled={!textAnswer.trim()}
              >
                제출
              </button>
            )}
          </div>
        )}

        {hasAnswered && (
          <div className="quiz-feedback">
            <p>{isCorrect ? '정답입니다!' : '오답 — 나의 단어장에 저장했어요'}</p>
            {mode === 'subjective' && !isCorrect && submitted && (
              <p className="quiz-correct-answer">정답: {correctAnswer}</p>
            )}
            <button type="button" className="primary-btn" onClick={handleNext}>
              {isLast ? '결과 보기' : '다음 문제'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
