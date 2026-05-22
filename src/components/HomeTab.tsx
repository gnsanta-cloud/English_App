import type { LearningLevel } from '../types';
import { WORDS_PER_DAY, getDayStatus } from '../utils/dailyPlan';
import { TOPICS, getTopicInfo } from '../utils/topics';
import { getLevelLabel } from '../utils/words';

interface HomeTabProps {
  level: LearningLevel;
  wordCount: number;
  totalDays: number;
  currentDay: number;
  completedDays: number[];
  firstIncompleteDay: number;
  onSelectTopic: (level: LearningLevel) => void;
  onSelectDay: (day: number) => void;
  onStartLearning: () => void;
}

export function HomeTab({
  level,
  wordCount,
  totalDays,
  currentDay,
  completedDays,
  firstIncompleteDay,
  onSelectTopic,
  onSelectDay,
  onStartLearning,
}: HomeTabProps) {
  const current = getTopicInfo(level);
  const completedCount = completedDays.length;

  const handleStart = () => {
    onSelectDay(firstIncompleteDay);
    onStartLearning();
  };

  return (
    <section className="home-tab">
      <div className="home-hero">
        <h2>오늘의 학습 주제</h2>
        <p>하루 {30}단어 · 일차별 학습 · 퀴즈(객관식/주관식)</p>
      </div>

      <div className="home-current">
        <span className="home-current-label">현재 선택</span>
        <div className="home-current-card" style={{ borderColor: current.accent }}>
          <span className="home-topic-icon">{current.icon}</span>
          <div>
            <strong>{current.title}</strong>
            <span>
              {getLevelLabel(level)} · {wordCount}개 · {totalDays}일차
            </span>
          </div>
        </div>
      </div>

      <div className="home-progress-section">
        <div className="home-progress-head">
          <h3>학습 진행</h3>
          <span className="home-progress-summary">
            {completedCount}/{totalDays}일차 완료
          </span>
        </div>
        <ul className="home-day-list">
          {Array.from({ length: totalDays }, (_, i) => {
            const day = i + 1;
            const status = getDayStatus(day, completedDays, currentDay);
            const actualCount = Math.min(
              WORDS_PER_DAY,
              Math.max(0, wordCount - (day - 1) * WORDS_PER_DAY),
            );

            return (
              <li key={day}>
                <button
                  type="button"
                  className={`home-day-item ${status}`}
                  disabled={status === 'locked'}
                  onClick={() => {
                    onSelectDay(day);
                    onStartLearning();
                  }}
                >
                  <span className="home-day-num">{day}일차</span>
                  <span className="home-day-meta">{actualCount}단어</span>
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

      <div className="home-topic-grid">
        {TOPICS.map((topic) => {
          const selected = level === topic.id;
          return (
            <button
              key={topic.id}
              type="button"
              className={`home-topic-card ${selected ? 'selected' : ''}`}
              style={{ '--topic-accent': topic.accent } as React.CSSProperties}
              onClick={() => onSelectTopic(topic.id)}
            >
              <span className="home-topic-icon">{topic.icon}</span>
              <span className="home-topic-title">{topic.title}</span>
              <span className="home-topic-sub">{topic.subtitle}</span>
              {selected && <span className="home-topic-check">선택됨</span>}
            </button>
          );
        })}
      </div>

      <button type="button" className="primary-btn home-start-btn" onClick={handleStart}>
        {current.icon} {firstIncompleteDay}일차 학습 시작
      </button>
    </section>
  );
}
