import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.english.hybridapp',
  appName: '영어 단어장',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
