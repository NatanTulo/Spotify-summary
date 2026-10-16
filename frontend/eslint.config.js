import js from '@eslint/js'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'vite.config.js', 'vite.config.d.ts'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-undef': 'off', // TypeScript checks identifiers and types.
      'no-unused-vars': 'off', // Checked by noUnusedLocals/noUnusedParameters.
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  {
    files: ['*.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
]
