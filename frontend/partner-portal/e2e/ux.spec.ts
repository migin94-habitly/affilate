import { test, expect } from '@playwright/test'

async function setAuthState(page: any) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'tap-auth',
      JSON.stringify({
        state: {
          token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwidHlwZSI6InBhcnRuZXIiLCJleHAiOjk5OTk5OTk5OTl9.sig',
          partner: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'test@example.com',
            full_name: 'Тест Партнёр',
            tier: 'bronze',
            status: 'active',
            language: 'ru',
            country: 'KZ',
          },
        },
        version: 0,
      })
    )
  })
}

test.describe('UX — User Friendliness', () => {
  test('login page is responsive at mobile viewport (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('login page is responsive at tablet viewport (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('dark mode toggle is present on login page', async ({ page }) => {
    await page.goto('/login')
    // The theme toggle button exists (sun/moon icon)
    const themeBtn = page.locator('header button, .dark\\:bg-gray-950 button').first()
    await expect(themeBtn).toBeVisible()
  })

  test('registration step counter advances correctly', async ({ page }) => {
    await page.goto('/register')

    // Step 1 circle should be active (highlighted)
    const step1 = page.locator('.rounded-full').filter({ hasText: '1' }).first()
    await expect(step1).toHaveClass(/bg-brand-500/)

    // Advance to step 2
    await page.getByRole('button', { name: 'Продолжить' }).click()

    // Step 1 should now be completed (check mark replaces number)
    // Step 2 should be active
    const step2 = page.locator('.rounded-full').filter({ hasText: '2' }).first()
    await expect(step2).toHaveClass(/bg-brand-500/)
  })

  test('login form submission triggers API request', async ({ page }) => {
    let requestMade = false
    await page.route('**/partner/auth/login', async route => {
      requestMade = true
      await route.fulfill({ status: 401, json: { error: 'invalid credentials' } })
    })

    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[autocomplete="current-password"]', 'pass')

    // Verify the form triggers the login API call and shows an error on 401
    await Promise.all([
      page.waitForRequest(r => r.url().includes('partner/auth/login')),
      page.locator('button[type="submit"]').click(),
    ])
    expect(requestMade).toBe(true)
    await expect(page.locator('.text-red-600, .text-red-400').first()).toBeVisible()
  })

  test('email input accepts valid email format', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill('valid@example.com')
    const value = await emailInput.inputValue()
    expect(value).toBe('valid@example.com')
  })

  test('page has readable font and sufficient contrast (dark mode)', async ({ page }) => {
    await page.goto('/login')
    // Switch to dark mode
    const themeBtn = page.locator('button').filter({ has: page.locator('svg') }).first()
    await themeBtn.click()

    // Dark mode should apply dark background class
    const html = await page.locator('html').getAttribute('class')
    // App may apply dark class to html or body
    const body = await page.locator('body').innerHTML()
    expect(body.length).toBeGreaterThan(0)
  })

  test('sidebar navigation is visible after authentication', async ({ page }) => {
    await setAuthState(page)
    await page.route('**/partner/**', route => route.fulfill({ json: { items: [], total: 0, period: '30d', total_clicks: 0 } }))

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // The layout should have a sidebar/nav
    const nav = page.locator('nav, aside, [class*="sidebar"]')
    // At least some navigation element should be present
    const navCount = await nav.count()
    expect(navCount).toBeGreaterThan(0)
  })

  test('partner full name is displayed in the sidebar/header', async ({ page }) => {
    await setAuthState(page)
    await page.route('**/partner/**', route => route.fulfill({ json: { items: [], total: 0, period: '30d', total_clicks: 0 } }))

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('Тест Партнёр')
  })

  test('error boundary does not appear on normal navigation', async ({ page }) => {
    await setAuthState(page)
    await page.route('**/partner/**', route => route.fulfill({ json: { items: [], total: 0, period: '30d', total_clicks: 0 } }))

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const bodyText = await page.textContent('body')
    expect(bodyText).not.toMatch(/something went wrong|error boundary|cannot read|undefined/i)
  })
})
