import { useCallback, useEffect, useState } from 'react';
import type { LearningLevel } from '../types';
import {
  applyNotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  isNativeApp,
} from '../utils/localNotifications';
import { loadNotificationSettings, type NotificationSettings } from '../utils/storage';
import { TOPICS } from '../utils/topics';
import { getLevelLabel } from '../utils/words';

interface SettingsTabProps {
  level: LearningLevel;
  wordCount: number;
  onSelectTopic: (level: LearningLevel) => void;
}

function toTimeValue(hour: number, minute: number) {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

export function SettingsTab({ level, wordCount, onSelectTopic }: SettingsTabProps) {
  const [notify, setNotify] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [notifyMsg, setNotifyMsg] = useState<string | null>(null);
  const [notifyBusy, setNotifyBusy] = useState(false);

  useEffect(() => {
    void loadNotificationSettings().then(setNotify);
  }, []);

  const handleNotifyToggle = useCallback(async () => {
    if (notifyBusy) return;
    setNotifyBusy(true);
    setNotifyMsg(null);
    const next = { ...notify, enabled: !notify.enabled };
    const result = await applyNotificationSettings(next);
    if (result.ok) {
      setNotify(next);
    } else {
      setNotify({ ...next, enabled: false });
      setNotifyMsg(result.message ?? '알림을 설정하지 못했습니다.');
    }
    setNotifyBusy(false);
  }, [notify, notifyBusy]);

  const handleTimeChange = useCallback(
    async (value: string) => {
      const [h, m] = value.split(':').map((v) => parseInt(v, 10));
      if (!Number.isFinite(h) || !Number.isFinite(m)) return;
      const next = { ...notify, hour: h, minute: m };
      setNotify(next);
      if (!notify.enabled) return;

      setNotifyBusy(true);
      setNotifyMsg(null);
      const result = await applyNotificationSettings(next);
      if (!result.ok) setNotifyMsg(result.message ?? '알림 시간을 저장하지 못했습니다.');
      setNotifyBusy(false);
    },
    [notify],
  );

  return (
    <section className="settings-tab">
      <h2>설정</h2>

      <div className="settings-section-block">
        <h3 className="settings-section-title">학습 주제</h3>
        <p className="settings-desc">중학·고등·일상·여행 대화 중 선택하세요.</p>
        <div className="settings-topic-grid">
          {TOPICS.map((t) => {
            const selected = level === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`settings-topic-pick ${selected ? 'selected' : ''}`}
                style={{ '--topic-accent': t.accent } as React.CSSProperties}
                onClick={() => void onSelectTopic(t.id)}
              >
                <span className="settings-topic-pick-icon">{t.icon}</span>
                <span className="settings-topic-pick-title">{t.title}</span>
                <span className="settings-topic-pick-sub">{t.subtitle}</span>
                {selected && <span className="settings-topic-pick-check">선택됨</span>}
              </button>
            );
          })}
        </div>
        <p className="settings-topic-current">
          현재: <strong>{getLevelLabel(level)}</strong> ({wordCount}단어)
        </p>
      </div>

      <div className="settings-notify-card">
        <div className="settings-notify-head">
          <div>
            <h3>학습 알림</h3>
            <p className="settings-desc">매일 정해진 시간에 공부를 알려드립니다.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notify.enabled}
            className={`settings-toggle ${notify.enabled ? 'on' : ''}`}
            onClick={() => void handleNotifyToggle()}
            disabled={notifyBusy}
          >
            <span className="settings-toggle-knob" />
          </button>
        </div>

        <label className="settings-time-label">
          알림 시간
          <input
            type="time"
            className="settings-time-input"
            value={toTimeValue(notify.hour, notify.minute)}
            onChange={(e) => void handleTimeChange(e.target.value)}
            disabled={!notify.enabled || notifyBusy}
          />
        </label>

        {!isNativeApp() && (
          <p className="settings-notify-hint">알림은 휴대폰에 설치한 앱에서만 동작합니다.</p>
        )}
        {notifyMsg && <p className="settings-notify-error">{notifyMsg}</p>}
      </div>

      <div className="settings-info">
        <h3>스와이프 안내</h3>
        <ul>
          <li>
            <strong>탭</strong> — 카드 뒤집기 (뜻·예문)
          </li>
          <li>
            <strong>왼쪽</strong> — 다음 단어
          </li>
          <li>
            <strong>오른쪽</strong> — 이전 단어
          </li>
          <li>
            <strong>위</strong> — 나의 단어장에 저장
          </li>
        </ul>
      </div>
    </section>
  );
}
