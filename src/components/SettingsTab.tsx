import { useCallback, useEffect, useState } from 'react';
import type { LearningLevel } from '../types';
import {
  applyNotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  isNativeApp,
} from '../utils/localNotifications';
import { loadNotificationSettings, type NotificationSettings } from '../utils/storage';
import { getTopicInfo } from '../utils/topics';
import { getLevelLabel } from '../utils/words';

interface SettingsTabProps {
  level: LearningLevel;
  onGoHome: () => void;
}

function toTimeValue(hour: number, minute: number) {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

export function SettingsTab({ level, onGoHome }: SettingsTabProps) {
  const topic = getTopicInfo(level);
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

      <div className="settings-topic-card" style={{ borderColor: topic.accent }}>
        <span className="settings-topic-icon">{topic.icon}</span>
        <div>
          <p className="settings-topic-title">현재 학습 주제</p>
          <p className="settings-topic-name">{getLevelLabel(level)}</p>
          <p className="settings-desc">{topic.subtitle}</p>
        </div>
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

      <button type="button" className="primary-btn settings-home-btn" onClick={onGoHome}>
        🏠 홈에서 주제 변경하기
      </button>

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
