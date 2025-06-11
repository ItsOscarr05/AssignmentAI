/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./frontend/src/test/setup.tsx'],
    include: ['frontend/src/**/__tests__/**/*.{ts,tsx}', 'frontend/src/**/*.{spec,test}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'frontend/src/test/setup.tsx',
        'frontend/src/**/*.d.ts',
        'frontend/src/index.tsx',
        'frontend/src/serviceWorker.ts',
      ],
    },
    reporters: ['basic'],
    silent: true,
    onConsoleLog(log, type) {
      return type === 'error';
    },
  },
});
