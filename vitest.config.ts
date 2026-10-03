import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    exclude: ['node_modules/**', 'tests/e2e/**'],
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text', 'json-summary', 'json', 'html', 'lcov'],
      thresholds: {
        // Ratchet baseline (measured 2026-10-03: ~63 lines / 57 branches / 50 funcs).
        // Raise toward 100 per TEST_PLAN §5 as phases land. CI fails if coverage drops.
        lines: 62,
        functions: 49,
        branches: 57,
        statements: 62,
      },
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/types',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
