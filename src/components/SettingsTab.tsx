import type { LearningLevel } from '../types';
import { getTopicInfo } from '../utils/topics';
import { getLevelLabel } from '../utils/words';

interface SettingsTabProps {
  level: LearningLevel;
  onGoHome: () => void;
}

export function SettingsTab({ level, onGoHome }: SettingsTabProps) {
  const topic = getTopicInfo(level);

  return (
    <section className="settings-tab">
      <h2>설정</h2>

      <div className="settings-topic-card" style={{ borderColor: topic.accent }}>
        <span className="settings-topic-icon">{topic.icon}</span>
        <div>
          <p className="settings-topic-title">현재 학습 주제</p>
          <p className="settings-topic-name">{getLevelLabel(level)}</p>
          <p className="settings-desc">{topic.subtitle}</p>
        </div>
      </div>

      <button type="button" className="primary-btn settings-home-btn" onClick={onGoHome}>
        🏠 홈에서 주제 변경하기
      </button>

      <div className="settings-info">
        <h3>스와이프 안내</h3>
        <ul>
          <li><strong>탭</strong> — 카드 뒤집기 (뜻·예문)</li>
          <li><strong>왼쪽</strong> — 다음 단어</li>
          <li><strong>오른쪽</strong> — 이전 단어</li>
          <li><strong>위</strong> — 나의 단어장에 저장</li>
        </ul>
      </div>
    </section>
  );
}
