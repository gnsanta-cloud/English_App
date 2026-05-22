import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Word } from '../types';
import { useBackHandler } from '../hooks/useAndroidBackButton';
import { getDayStatus, getDayWordCount, getWordsForDay } from '../utils/dailyPlan';
import { isEnglishQuizAnswerCorrect, isQuizAnswerCorrect } from '../utils/quizAnswer';
import { ConfettiCelebration } from './ConfettiCelebration';

export type QuizMode = 'multiple' | 'subjective';
export type QuizDirection = 'en-ko' | 'ko-en';

const POINTS_PER_QUESTION = 10;

type QuizPhase = 'daySelect' | 'select' | 'playing' | 'finished';

interface QuizTabProps {
  allWords: Word[];
  topicLabel: string;
  totalDays: number;
  currentDay: number;
  completedDays: number[];
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

function getCorrectAnswer(word: Word, direction: QuizDirection): string {
  return direction === 'en-ko' ? word.meaning : word.word;
}

function getPromptText(word: Word, direction: QuizDirection): string {
  return direction === 'en-ko' ? word.word : word.meaning;
}

function directionLabel(direction: QuizDirection): string {
  return direction === 'en-ko' ? '영→한' : '한→영';
}

export function QuizTab({
  allWords,
  topicLabel,
  totalDays,
  currentDay,
  completedDays,
  onWrongAnswer,
}: QuizTabProps) {
  const [phase, setPhase] = useState<QuizPhase>('daySelect');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [direction, setDirection] = useState<QuizDirection>('en-ko');
  const [playDirection, setPlayDirection] = useState<QuizDirection>('en-ko');
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [questions, setQuestions] = useState<Word[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const dayWords =
    selectedDay !== null ? getWordsForDay(allWords, selectedDay) : [];
  const questionCount = dayWords.length;
  const maxScore = questions.length > 0 ? questions.length * POINTS_PER_QUESTION : 0;

  const clearQuizRun = useCallback(() => {
    setMode(null);
    setQuestions([]);
    setCurrent(0);
    setScore(0);
    setCorrectCount(0);
    setSelected(null);
    setTextAnswer('');
    setSubmitted(false);
    setShowCelebration(false);
  }, []);

  const resetToDaySelect = useCallback(() => {
    setPhase('daySelect');
    setSelectedDay(null);
    clearQuizRun();
  }, [clearQuizRun]);

  const resetToModeSelect = useCallback(() => {
    setPhase('select');
    clearQuizRun();
  }, [clearQuizRun]);

  const startQuiz = (quizMode: QuizMode) => {
    const pool = dayWords;
    const q = shuffle(pool);
    const quizDir: QuizDirection = quizMode === 'subjective' ? 'ko-en' : direction;
    setPlayDirection(quizDir);
    setMode(quizMode);
    setQuestions(q);
    setCurrent(0);
    setScore(0);
    setCorrectCount(0);
    setSelected(null);
    setTextAnswer('');
    setSubmitted(false);
    setShowCelebration(false);
    setPhase('playing');
  };

  useEffect(() => {
    resetToDaySelect();
  }, [allWords, topicLabel, totalDays, resetToDaySelect]);

  useBackHandler(() => {
    if (phase === 'daySelect') return false;
    if (phase === 'select') {
      resetToDaySelect();
      return true;
    }
    resetToModeSelect();
    return true;
  }, phase !== 'daySelect');

  const currentWord = questions[current];
  const totalQuestions = questions.length;

  const options = useMemo(() => {
    if (!currentWord || mode !== 'multiple') return [];
    const pick = (w: Word) => (playDirection === 'en-ko' ? w.meaning : w.word);
    const correct = pick(currentWord);
    const wrongPool = allWords.filter((w) => w.id !== currentWord.id);
    const wrongCount = Math.min(3, wrongPool.length);
    const wrong = shuffle(wrongPool)
      .slice(0, wrongCount)
      .map(pick);
    return shuffle([correct, ...wrong]);
  }, [currentWord, allWords, mode, playDirection]);

  if (phase === 'daySelect') {
    return (
      <section className="quiz-tab">
        <div className="quiz-intro quiz-intro-compact">
          <h2>단어 퀴즈</h2>
          <p className="quiz-topic-badge">
            {topicLabel} · {totalDays}일차
          </p>
          <p>일차를 선택한 뒤 객관식·주관식 퀴즈를 풀어 보세요.</p>
        </div>

        <div className="home-progress-section quiz-day-section">
          <div className="home-progress-head">
            <h3>일차별 퀴즈</h3>
          </div>
          <ul className="home-day-list">
            {Array.from({ length: totalDays }, (_, i) => {
              const day = i + 1;
              const status = getDayStatus(day, completedDays, currentDay);
              const count = getDayWordCount(allWords, day);

              return (
                <li key={day}>
                  <button
                    type="button"
                    className={`home-day-item ${status}`}
                    disabled={status === 'locked'}
                    onClick={() => {
                      setSelectedDay(day);
                      setPhase('select');
                    }}
                  >
                    <span className="home-day-num">{day}일차 퀴즈</span>
                    <span className="home-day-meta">{count}문제</span>
                    <span className="home-day-badge">
                      {status === 'completed' && '완료'}
                      {status === 'current' && '학습 중'}
                      {status === 'available' && '시작'}
                      {status === 'locked' && '잠금'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    );
  }

  if (phase === 'select' && selectedDay !== null) {
    const enKo = direction === 'en-ko';
    return (
      <section className="quiz-tab">
        <div className="quiz-intro">
          <button type="button" className="quiz-back-link" onClick={resetToDaySelect}>
            ← 일차 선택
          </button>
          <h2>{selectedDay}일차 퀴즈</h2>
          <p className="quiz-topic-badge">{topicLabel}</p>
          <p className="quiz-intro-count">
            <strong>{questionCount}문제</strong> · 해당 일차 단어 전체 · 틀린 단어는 나의 단어장에 저장
          </p>

          <div className="quiz-direction-section">
            <p className="quiz-direction-label">객관식 출제 방향</p>
            <div className="quiz-direction-toggle" role="group" aria-label="객관식 출제 방향">
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
              disabled={questionCount === 0}
            >
              <span className="quiz-mode-icon">📝</span>
              <strong>객관식</strong>
              <span>{enKo ? '뜻 4개 중 고르기' : '단어 4개 중 고르기'}</span>
            </button>
            <button
              type="button"
              className="quiz-mode-card quiz-mode-card-subjective"
              onClick={() => startQuiz('subjective')}
              disabled={questionCount === 0}
            >
              <span className="quiz-mode-icon">✍️</span>
              <strong>주관식</strong>
              <span className="quiz-mode-only-ko-en">한→영 전용</span>
              <span>한글 뜻 보고 영단어 입력</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (phase === 'finished') {
    const perfect = correctCount === totalQuestions && totalQuestions > 0;
    return (
      <section className="quiz-tab">
        {showCelebration && <ConfettiCelebration />}
        <div className="quiz-result">
          <h2>퀴즈 결과</h2>
          <p className="quiz-result-mode">
            {directionLabel(playDirection)} · {mode === 'multiple' ? '객관식' : '주관식'} · {selectedDay}
            일차
          </p>
          <div className="quiz-result-stats">
            <div className="quiz-result-stat">
              <span className="quiz-result-stat-label">정답</span>
              <span className="quiz-result-stat-value">
                {correctCount}/{totalQuestions}
              </span>
            </div>
            <div className="quiz-result-stat">
              <span className="quiz-result-stat-label">점수</span>
              <span className="quiz-result-stat-value quiz-result-score">
                {score}/{maxScore}점
              </span>
            </div>
          </div>
          {perfect && <p className="celebration-text">참 잘했어요! 🎉</p>}
          <button type="button" className="primary-btn" onClick={resetToModeSelect}>
            다시 하기
          </button>
        </div>
      </section>
    );
  }

  if (!currentWord || !mode) return null;

  const isLast = current + 1 >= totalQuestions;
  const correctAnswer = getCorrectAnswer(currentWord, playDirection);
  const promptText = getPromptText(currentWord, playDirection);
  const enKo = playDirection === 'en-ko';

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
    const points = hasAnswered && isCorrect ? POINTS_PER_QUESTION : 0;
    const newCorrect = correctCount + (hasAnswered && isCorrect ? 1 : 0);
    const newScore = score + points;

    if (isLast) {
      setCorrectCount(newCorrect);
      setScore(newScore);
      setPhase('finished');
      if (newCorrect === totalQuestions) setShowCelebration(true);
      return;
    }
    setCorrectCount(newCorrect);
    setScore(newScore);
    setCurrent((c) => c + 1);
    setSelected(null);
    setTextAnswer('');
    setSubmitted(false);
  };

  const answeredCount = correctCount;
  const progressNum = current + 1;

  return (
    <section className="quiz-tab">
      <div className="quiz-status-panel">
        <div className="quiz-status-row">
          <span className="quiz-status-label">진행</span>
          <span className="quiz-status-value quiz-status-progress">
            {progressNum}/{totalQuestions}
          </span>
        </div>
        <div className="quiz-status-row">
          <span className="quiz-status-label">점수</span>
          <span className="quiz-status-value quiz-status-score">
            {score}/{totalQuestions * POINTS_PER_QUESTION}점
          </span>
        </div>
        <div className="quiz-status-tags">
          <span className="quiz-mode-label">{directionLabel(playDirection)}</span>
          <span className="quiz-mode-label">{mode === 'multiple' ? '객관식' : '주관식'}</span>
          <span className="quiz-mode-label">정답 {answeredCount}</span>
        </div>
      </div>

      <div className="quiz-card">
        <h3 className={`quiz-word ${!enKo ? 'quiz-prompt-ko' : ''}`}>{promptText}</h3>
        <p className="quiz-prompt">
          {mode === 'multiple'
            ? enKo
              ? '뜻을 고르세요'
              : '영어 단어를 고르세요'
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
              placeholder="영어 단어 입력"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={submitted}
              onKeyDown={(e) => e.key === 'Enter' && handleSubjectiveSubmit()}
              enterKeyHint="done"
              autoCapitalize="none"
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
