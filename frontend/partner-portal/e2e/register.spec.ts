import { test, expect } from '@playwright/test'

test.describe('Register Page — Multi-step flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('shows 4-step progress indicator', async ({ page }) => {
    // There should be 4 step circles
    const stepCircles = page.locator('.rounded-full').filter({ hasText: /^[1-4]$/ })
    await expect(stepCircles).toHaveCount(4)
  })

  test('step 1 shows segment selection with 3 options', async ({ page }) => {
    await expect(page.getByText('Инфлюенсер')).toBeVisible()
    await expect(page.getByText('UGC-создатель')).toBeVisible()
    await expect(page.getByText('Веб-сервис')).toBeVisible()
  })

  test('step 1 has "Продолжить" button', async ({ page }) => {
    const continueBtn = page.getByRole('button', { name: 'Продолжить' })
    await expect(continueBtn).toBeVisible()
  })

  test('selecting a segment highlights it', async ({ page }) => {
    // Click UGC-создатель — each segment is a <button> element
    await page.getByText('UGC-создатель').click()
    const ugcButton = page.locator('button').filter({ hasText: 'UGC-создатель' })
    await expect(ugcButton).toHaveClass(/border-brand-500/)
  })

  test('step 1 → step 2 navigation', async ({ page }) => {
    await page.getByRole('button', { name: 'Продолжить' }).click()
    // Step 2 should show registration form
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('step 2 has all required fields', async ({ page }) => {
    // Navigate to step 2
    await page.getByRole('button', { name: 'Продолжить' }).click()

    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="tel"]')).toBeVisible()
    await expect(page.locator('input[type="password"], input[type="text"]').last()).toBeVisible()
    // Country select
    await expect(page.locator('select')).toBeVisible()
  })

  test('step 2 back button returns to step 1', async ({ page }) => {
    await page.getByRole('button', { name: 'Продолжить' }).click()
    await page.getByRole('button', { name: /Назад/ }).click()
    // Should be back at step 1
    await expect(page.getByText('Инфлюенсер')).toBeVisible()
  })

  test('step 2 shows error on duplicate email', async ({ page }) => {
    await page.route('**/partner/auth/register', async route => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'already exists' }),
      })
    })

    await page.getByRole('button', { name: 'Продолжить' }).click()

    // Fill all step 2 fields (Input component has no htmlFor, use placeholder)
    await page.fill('input[placeholder="Иван Иванов"]', 'Test User')
    await page.fill('input[type="email"]', 'existing@example.com')
    await page.fill('input[type="password"]', 'password123')

    // Submit step 2
    const continueBtn = page.getByRole('button', { name: 'Продолжить' }).last()
    await continueBtn.click()

    const errorMsg = page.locator('.text-red-600, .text-red-400').first()
    await expect(errorMsg).toBeVisible()
    await expect(errorMsg).toContainText('already exists')
  })

  test('step 2 calls register API and transitions to authenticated state', async ({ page }) => {
    // After registration succeeds, setAuth updates the Zustand store.
    // PublicRoute may redirect to /dashboard (if re-render races ahead) or
    // setStep(3) may win and show the KYC form — both are valid outcomes.
    let registrationCalled = false
    // Register generic stub FIRST so that the specific register handler (registered after)
    // takes priority — Playwright uses LIFO order when multiple routes match.
    await page.route('**/partner/**', route =>
      route.fulfill({ json: { items: [], total: 0, period: '30d', total_clicks: 0 } })
    )
    await page.route('**/partner/auth/register', async route => {
      registrationCalled = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'test-token',
          refresh_token: 'refresh',
          partner: { id: 'uuid', email: 'new@example.com', tier: 'bronze', status: 'pending' },
        }),
      })
    })

    await page.getByRole('button', { name: 'Продолжить' }).click()
    await page.fill('input[placeholder="Иван Иванов"]', 'Test User')
    await page.fill('input[type="email"]', 'new@example.com')
    await page.fill('input[placeholder="Минимум 8 символов"]', 'password123')

    await Promise.all([
      page.waitForRequest(r => r.url().includes('partner/auth/register')),
      page.getByRole('button', { name: 'Продолжить' }).last().click(),
    ])
    expect(registrationCalled).toBe(true)

    await page.waitForLoadState('networkidle')
    const body = await page.textContent('body')
    // User is now in authenticated state: either KYC step 3 or dashboard
    expect(body).toMatch(/Данные для выплат|Начало работы|Дашборд|Выйти/)
  })

  test('has link back to login', async ({ page }) => {
    const loginLink = page.locator('a[href="/login"]')
    await expect(loginLink).toBeVisible()
  })
})
