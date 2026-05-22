import type { LearningLevel } from '../types';
import { getDayStatus } from '../utils/dailyPlan';
import { getTopicInfo } from '../utils/topics';
import { getLevelLabel } from '../utils/words';

interface HomeTabProps {
  level: LearningLevel;
  wordCount: number;
  totalDays: number;
  currentDay: number;
  completedDays: number[];
  firstIncompleteDay: number;
  getDayProgress: (day: number) => { studied: number; total: number };
  onSelectDay: (day: number) => void;
  onStartLearning: () => void;
  onOpenSettings: () => void;
}

export function HomeTab({
  level,
  wordCount,
  totalDays,
  currentDay,
  completedDays,
  firstIncompleteDay,
  getDayProgress,
  onSelectDay,
  onStartLearning,
  onOpenSettings,
}: HomeTabProps) {
  const current = getTopicInfo(level);
  const completedCount = completedDays.length;

  const handleStart = () => {
    onSelectDay(firstIncompleteDay);
    onStartLearning();
  };

  return (
    <section className="home-tab">
      <div className="home-tab-top">
        <div className="home-hero">
          <h2>학습 홈</h2>
          <p>하루 30단어 · 일차별 학습 · 퀴즈(객관식/주관식)</p>
        </div>

        <div className="home-current">
          <span className="home-current-label">현재 주제</span>
          <div className="home-current-card" style={{ borderColor: current.accent }}>
            <span className="home-topic-icon">{current.icon}</span>
            <div>
              <strong>{current.title}</strong>
              <span>
                {getLevelLabel(level)} · {wordCount}개 · {totalDays}일차
              </span>
            </div>
          </div>
          <button type="button" className="home-settings-link" onClick={onOpenSettings}>
            ⚙️ 설정에서 주제 변경
          </button>
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
            const { studied, total } = getDayProgress(day);

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
                  <span className="home-day-meta">
                    {studied}/{total}
                  </span>
                  <span className="home-day-badge">
                    {status === 'completed' && '완료'}
                    {status === 'current' && '학습 중'}
                    {status === 'available' && studied > 0 ? '이어하기' : '시작'}
                    {status === 'locked' && '잠금'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="home-tab-footer">
        <button type="button" className="primary-btn home-start-btn" onClick={handleStart}>
          {current.icon} {firstIncompleteDay}일차 학습 시작
        </button>
      </div>
    </section>
  );
}
