import { expect, test } from '@playwright/test'

test('local import → profile → search → chart, date scope and mobile', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/')
    await expect(page.getByRole('button', { name: /log.?in|zaloguj/i })).toHaveCount(0)
    await page.getByRole('button', { name: /zarządzanie danymi/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('E2E', { exact: true })).toBeVisible()
    await dialog.getByRole('button', { name: 'Importuj', exact: true }).click()
    await expect(dialog.getByRole('button', { name: 'E2E', exact: true })).toBeVisible({ timeout: 20_000 })
    await dialog.getByRole('button', { name: 'E2E', exact: true }).click()
    await dialog.getByRole('button', { name: 'Zamknij' }).click()
    await page.goto('/music')
    await page.getByPlaceholder('Szukaj utworów, artystów lub albumów...').fill('Needle')
    await expect(page.getByRole('cell', { name: /Needle/ }).first()).toBeVisible()
    await expect(page.getByRole('cell', { name: /Different/ })).toHaveCount(0)
    await page.getByRole('tab', { name: 'Wykresy', exact: true }).click()
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible()
    for (const path of ['/podcasts', '/audiobooks']) {
        await page.goto(path)
        await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible()
        await expect(page.getByRole('alert')).toHaveCount(0)
    }
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Twoja historia w czasie' })).toBeVisible()
    await page.getByLabel('Data od', { exact: true }).fill('2026-10-01')
    await page.getByLabel('Data do', { exact: true }).fill('2026-10-01')
    await page.getByRole('button', { name: 'Zastosuj', exact: true }).click()
    await expect(page.getByText('A: 2026-10-01 – 2026-10-01', { exact: false })).toBeVisible()
    await expect(page.getByRole('button', { name: /2026-10-01: 2 odtworzenia/ })).toBeAttached()
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('button', { name: 'Zastosuj', exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: 'test-results/history-mobile.png', fullPage: true })
    expect(errors).toEqual([])
})

test('production CSP allows local scripts and fonts without unsafe script permissions', async ({ request }) => {
    const response = await request.get('/')
    const csp = response.headers()['content-security-policy']
    expect(csp).toContain("script-src 'self'")
    expect(csp).not.toContain('unsafe-eval')
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/)
    expect(await response.text()).not.toContain('fonts.googleapis.com')
})

test('failed API is visible and retry recovers', async ({ page }) => {
    await page.route('**/api/stats/overview*', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, code: 'TEST_FAILURE', error: 'Test API unavailable' }) }))
    await page.goto('/')
    await expect(page.getByRole('alert').filter({ hasText: 'Test API unavailable' })).toBeVisible()
    await page.unroute('**/api/stats/overview*')
    await page.getByRole('button', { name: 'Spróbuj ponownie' }).click()
    await expect(page.getByRole('alert')).toHaveCount(0)
})
