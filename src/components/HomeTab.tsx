import type { LearningLevel } from '../types';
import { TOPICS, getTopicInfo } from '../utils/topics';
import { getLevelLabel } from '../utils/words';

interface HomeTabProps {
  level: LearningLevel;
  wordCount: number;
  onSelectTopic: (level: LearningLevel) => void;
  onStartLearning: () => void;
}

export function HomeTab({ level, wordCount, onSelectTopic, onStartLearning }: HomeTabProps) {
  const current = getTopicInfo(level);

  return (
    <section className="home-tab">
      <div className="home-hero">
        <h2>오늘의 학습 주제</h2>
        <p>주제를 선택하면 단어카드·퀴즈·AI 대화가 같은 내용으로 연결됩니다.</p>
      </div>

      <div className="home-current">
        <span className="home-current-label">현재 선택</span>
        <div className="home-current-card" style={{ borderColor: current.accent }}>
          <span className="home-topic-icon">{current.icon}</span>
          <div>
            <strong>{current.title}</strong>
            <span>{getLevelLabel(level)} · {wordCount}개</span>
          </div>
        </div>
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

      <button type="button" className="primary-btn home-start-btn" onClick={onStartLearning}>
        {current.icon} {current.title} 학습 시작
      </button>
    </section>
  );
}
