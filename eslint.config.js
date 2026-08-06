import eslint from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      '*.config.js',
      '*.config.ts',
      'vite.config.ts',
      'tailwind.config.ts',
      'postcss.config.js',
      'dist/**',
      'node_modules/**',
      'electron/**',
      'build/**',
      'release/**',
      'scripts/**/*.cjs',  // Ignore CommonJS files in scripts
      'scripts/*.js',
      'design/**',  // Design system source-of-truth assets, not app code
    ],
  },
  {
    // Build-time scripts run in Node, not the browser
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
      },
    },
  },
  {
    // Type declarations copied verbatim from /design — keep them identical
    files: ['src/ds/components/**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off'
    },
  }
);
