import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flagarcade.app',
  appName: 'Flag Arcade',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      backgroundColor: '#7EC8E3',
      style: 'DARK',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#7EC8E3',
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
    },
  },
};

export default config;
