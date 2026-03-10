/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      include: [
        'lib/**/*.{ts,tsx}',
        'modules/**/*.{ts,tsx}',
        'verticals/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'components/common/**/*.{ts,tsx}',
        'components/forms/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.d.ts',
        '**/index.ts',
        '**/*.stories.{ts,tsx}',
        '**/types/**',
      ],
      thresholds: {
        // Critical paths: auth, permissions, errors, forms
        'lib/errors/**': { statements: 80, branches: 80 },
        'lib/query/**': { statements: 80, branches: 80 },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@modules': path.resolve(__dirname, './modules'),
      '@verticals': path.resolve(__dirname, './verticals'),
      '@config': path.resolve(__dirname, './config'),
      '@lib': path.resolve(__dirname, './lib'),
      '@hooks': path.resolve(__dirname, './hooks'),
    },
  },
});
