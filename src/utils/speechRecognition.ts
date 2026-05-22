import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

export async function requestMicPermission(): Promise<boolean> {
  try {
    const { available } = await SpeechRecognition.available();
    if (!available && Capacitor.isNativePlatform()) return false;

    if (Capacitor.isNativePlatform()) {
      const { speechRecognition } = await SpeechRecognition.checkPermissions();
      if (speechRecognition === 'granted') return true;
      const result = await SpeechRecognition.requestPermissions();
      return result.speechRecognition === 'granted';
    }
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  } catch {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
}

export async function startListening(
  onResult: (text: string, isFinal: boolean) => void,
  onError?: (msg: string) => void,
): Promise<() => void> {
  const ok = await requestMicPermission();
  if (!ok) {
    onError?.('마이크 권한이 필요합니다. 설정에서 허용해 주세요.');
    return () => {};
  }

  if (Capacitor.isNativePlatform()) {
    let lastText = '';

    const partialHandler = await SpeechRecognition.addListener('partialResults', (data) => {
      const text = data.matches?.[0] ?? '';
      if (text) {
        lastText = text;
        onResult(text, false);
      }
    });

    const stateHandler = await SpeechRecognition.addListener('listeningState', (state) => {
      if (state.status === 'stopped' && lastText.trim()) {
        onResult(lastText.trim(), true);
      }
    });

    try {
      await SpeechRecognition.start({
        language: 'en-US',
        maxResults: 1,
        popup: false,
        partialResults: true,
      });
    } catch {
      onError?.('음성 인식을 시작할 수 없습니다.');
      await partialHandler.remove();
      await stateHandler.remove();
      return () => {};
    }

    return async () => {
      try {
        await SpeechRecognition.stop();
      } catch {
        /* ignore */
      }
      await partialHandler.remove();
      await stateHandler.remove();
    };
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    onError?.('이 환경에서는 음성 인식을 지원하지 않습니다.');
    return () => {};
  }

  const rec = new SR() as SpeechRecognition & { continuous?: boolean };
  rec.lang = 'en-US';
  rec.interimResults = true;
  rec.continuous = true;
  rec.maxAlternatives = 1;

  rec.onresult = (e: SpeechRecognitionEvent) => {
    let interim = '';
    let final = '';
    const start = (e as SpeechRecognitionEvent & { resultIndex?: number }).resultIndex ?? 0;
    for (let i = start; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t;
      else interim += t;
    }
    if (final.trim()) onResult(final.trim(), true);
    else if (interim.trim()) onResult(interim.trim(), false);
  };

  rec.onerror = () => onError?.('음성 인식 오류가 발생했습니다.');
  rec.start();

  return () => {
    try {
      rec.stop();
    } catch {
      /* ignore */
    }
  };
}

export async function listenOnce(): Promise<string> {
  const ok = await requestMicPermission();
  if (!ok) throw new Error('마이크 권한이 필요합니다.');

  if (Capacitor.isNativePlatform()) {
    return new Promise(async (resolve, reject) => {
      let lastText = '';
      let done = false;

      const finish = async (text: string) => {
        if (done) return;
        done = true;
        try {
          await SpeechRecognition.stop();
        } catch {
          /* ignore */
        }
        await partialHandler.remove();
        await stateHandler.remove();
        resolve(text.trim());
      };

      const partialHandler = await SpeechRecognition.addListener('partialResults', (data) => {
        lastText = data.matches?.[0] ?? '';
      });

      const stateHandler = await SpeechRecognition.addListener('listeningState', (state) => {
        if (state.status === 'stopped') void finish(lastText);
      });

      try {
        await SpeechRecognition.start({
          language: 'en-US',
          maxResults: 1,
          popup: true,
          prompt: 'Speak in English',
          partialResults: true,
        });
      } catch (e) {
        if (!done) {
          done = true;
          await partialHandler.remove();
          await stateHandler.remove();
          reject(e);
        }
        return;
      }

      setTimeout(() => void finish(lastText), 12000);
    });
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) throw new Error('음성 인식을 지원하지 않습니다.');

  return new Promise((resolve, reject) => {
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      resolve(e.results[0]?.[0]?.transcript?.trim() ?? '');
    };
    rec.onerror = () => reject(new Error('음성 인식 실패'));
    rec.onend = () => resolve('');
    rec.start();
    setTimeout(() => {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }, 10000);
  });
}
