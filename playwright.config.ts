import { defineConfig } from '@playwright/test'
export default defineConfig({
    testDir: './tests/e2e', fullyParallel: false, workers: 1,
    timeout: 45_000, expect: { timeout: 10_000 },
    use: { baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5107', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
    reporter: [['list'], ['html', { open: 'never' }]],
})
