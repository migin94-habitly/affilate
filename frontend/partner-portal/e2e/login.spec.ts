import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('renders login form with required fields', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('page has TAP brand logo', async ({ page }) => {
    await expect(page.getByText('TAP')).toBeVisible()
  })

  test('page has link to register', async ({ page }) => {
    const registerLink = page.locator('a[href="/register"]')
    await expect(registerLink).toBeVisible()
  })

  test('email field has correct type and autocomplete', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveAttribute('autocomplete', 'email')
    await expect(emailInput).toHaveAttribute('required', '')
  })

  test('password field toggles visibility', async ({ page }) => {
    const passwordInput = page.locator('input[autocomplete="current-password"]')
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Click the toggle button (eye icon)
    const toggleBtn = page.locator('button[type="button"]').filter({ hasNot: page.locator('[type="submit"]') })
    await toggleBtn.click()

    await expect(passwordInput).toHaveAttribute('type', 'text')

    // Toggle back
    await toggleBtn.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('submit button triggers login API call', async ({ page }) => {
    let loginCalled = false
    await page.route('**/partner/auth/login', async route => {
      loginCalled = true
      await route.fulfill({ status: 401, json: { error: 'invalid credentials' } })
    })

    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[autocomplete="current-password"]', 'password123')

    // Wait for the request to be made synchronously with the click
    await Promise.all([
      page.waitForRequest(r => r.url().includes('partner/auth/login')),
      page.locator('button[type="submit"]').click(),
    ])
    expect(loginCalled).toBe(true)
  })

  test('shows error message on invalid credentials', async ({ page }) => {
    await page.route('**/partner/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid credentials' }),
      })
    })

    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[autocomplete="current-password"]', 'wrongpass')
    await page.locator('button[type="submit"]').click()

    const errorMsg = page.locator('.text-red-600, .text-red-400').first()
    await expect(errorMsg).toBeVisible()
    await expect(errorMsg).toContainText('invalid credentials')
  })

  test('redirects to dashboard on successful login', async ({ page }) => {
    await page.route('**/partner/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwidHlwZSI6InBhcnRuZXIiLCJleHAiOjk5OTk5OTk5OTl9.sig',
          refresh_token: 'refresh',
          partner: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'partner@example.com',
            full_name: 'Test Partner',
            tier: 'bronze',
            status: 'active',
          },
        }),
      })
    })

    await page.fill('input[type="email"]', 'partner@example.com')
    await page.fill('input[autocomplete="current-password"]', 'password')
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('form requires email and password before submission', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]')
    // Click submit without filling fields
    await submitBtn.click()
    // Browser native validation should prevent form submission
    // Email input should be focused with validation error
    const emailInput = page.locator('input[type="email"]')
    // The required attribute should prevent submission
    const isRequired = await emailInput.getAttribute('required')
    expect(isRequired).not.toBeNull()
  })

  test('copyright footer is visible', async ({ page }) => {
    const footer = page.locator('text=/Ticketon Affiliate Platform/')
    await expect(footer).toBeVisible()
  })
})
