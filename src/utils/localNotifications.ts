import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  loadNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from './storage';

const NOTIFICATION_ID = 1;
const CHANNEL_ID = 'study-reminder';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  hour: 9,
  minute: 0,
};

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export async function ensureNotificationChannel(): Promise<void> {
  if (!isNativeApp()) return;
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: '학습 알림',
    description: '매일 영어 학습 시간을 알려드립니다',
    importance: 4,
    visibility: 1,
    sound: 'default',
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  const check = await LocalNotifications.checkPermissions();
  if (check.display === 'granted') return true;
  const req = await LocalNotifications.requestPermissions();
  return req.display === 'granted';
}

export async function cancelStudyReminder(): Promise<void> {
  if (!isNativeApp()) return;
  const pending = await LocalNotifications.getPending();
  const mine = pending.notifications.filter((n) => n.id === NOTIFICATION_ID);
  if (mine.length > 0) {
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
  }
}

export async function scheduleStudyReminder(hour: number, minute: number): Promise<void> {
  if (!isNativeApp()) return;
  await ensureNotificationChannel();
  await cancelStudyReminder();
  await LocalNotifications.schedule({
    notifications: [
      {
        id: NOTIFICATION_ID,
        title: 'Julia Voca',
        body: '오늘 영어 단어 공부할 시간이에요 📚',
        channelId: CHANNEL_ID,
        schedule: {
          on: { hour, minute },
          repeats: true,
          every: 'day',
        },
      },
    ],
  });
}

export async function applyNotificationSettings(
  settings: NotificationSettings,
): Promise<{ ok: boolean; message?: string }> {
  await saveNotificationSettings(settings);

  if (!settings.enabled) {
    await cancelStudyReminder();
    return { ok: true };
  }

  if (!isNativeApp()) {
    const off = { ...settings, enabled: false };
    await saveNotificationSettings(off);
    return { ok: false, message: '알림은 Android 앱에서만 사용할 수 있습니다.' };
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    const off = { ...settings, enabled: false };
    await saveNotificationSettings(off);
    return {
      ok: false,
      message: '알림 권한이 필요합니다. 휴대폰 설정에서 Julia Voca 알림을 허용해 주세요.',
    };
  }

  await scheduleStudyReminder(settings.hour, settings.minute);
  return { ok: true };
}

/** 앱 시작 시 저장된 설정으로 알림 다시 등록 */
export async function syncStudyReminderFromStorage(): Promise<void> {
  const settings = await loadNotificationSettings();
  if (!settings.enabled || !isNativeApp()) {
    await cancelStudyReminder();
    return;
  }
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') return;
  await scheduleStudyReminder(settings.hour, settings.minute);
}
