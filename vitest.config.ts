import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: ['backend/vitest.config.ts', 'frontend/vitest.config.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['backend/src/**/*.ts', 'frontend/src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}', '**/test/**'],
    },
  },
})
