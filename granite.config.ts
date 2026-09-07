import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'voice-timer',
  brand: {
    displayName: '말하는 타이머',
    primaryColor: '#3182F6',
    icon: 'https://static.toss.im/appsintoss/29923/000b9cb5-76bf-4310-b870-845f9fc1ba36.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'vite build',
    },
  },
  permissions: [],
});
