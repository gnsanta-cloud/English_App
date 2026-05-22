import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

let webVoicesReady = false;

function loadWebVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    speechSynthesis.onvoiceschanged = () => {
      resolve(speechSynthesis.getVoices());
    };
    setTimeout(() => resolve(speechSynthesis.getVoices()), 300);
  });
}

async function speakWeb(text: string): Promise<void> {
  if (!webVoicesReady) {
    await loadWebVoices();
    webVoicesReady = true;
  }
  const voices = speechSynthesis.getVoices();
  const enVoice =
    voices.find((v) => v.lang.startsWith('en-US') && !v.localService) ??
    voices.find((v) => v.lang.startsWith('en')) ??
    voices[0];

  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    if (enVoice) utterance.voice = enVoice;
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error('TTS failed'));
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  });
}

export async function speakEnglish(text: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await TextToSpeech.speak({
      text,
      lang: 'en-US',
      rate: 0.9,
      pitch: 1.0,
      volume: 1.0,
    });
    return;
  }
  await speakWeb(text);
}
