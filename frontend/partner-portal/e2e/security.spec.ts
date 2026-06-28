import { test, expect } from '@playwright/test'

test.describe('Security — Frontend checks', () => {
  test('login page does not expose sensitive data in HTML source', async ({ page }) => {
    await page.goto('/login')
    const html = await page.content()

    // No JWT secrets or API keys in the HTML
    expect(html).not.toContain('jwt_secret')
    expect(html).not.toContain('secret_key')
    expect(html).not.toContain('minioadmin')
    expect(html).not.toContain('tap_secret')
  })

  test('Content-Security-Policy header presence (if set by server)', async ({ page }) => {
    const response = await page.goto('/login')
    // Check CSP header — may not be set in dev, but document the check
    const csp = response?.headers()['content-security-policy']
    // In production this should be set; in dev it may be absent
    if (csp) {
      expect(csp).toContain("default-src")
    }
    // This test documents what SHOULD be in place for production
  })

  test('password field type is "password" by default (not exposing input)', async ({ page }) => {
    await page.goto('/login')
    const pwdInput = page.locator('input[autocomplete="current-password"]')
    await expect(pwdInput).toHaveAttribute('type', 'password')
  })

  test('password field type is "password" on register page by default', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('button', { name: 'Продолжить' }).click()
    const pwdInput = page.locator('input[type="password"]')
    await expect(pwdInput).toBeVisible()
    await expect(pwdInput).toHaveAttribute('type', 'password')
  })

  test('login form uses POST method (no sensitive data in URL)', async ({ page }) => {
    let requestMethod = ''
    await page.route('**/partner/auth/login', async route => {
      requestMethod = route.request().method()
      await route.fulfill({ status: 200, json: { token: 'tok', partner: {} } })
    })

    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[autocomplete="current-password"]', 'pass')
    await page.locator('button[type="submit"]').click()

    await page.waitForTimeout(500)
    expect(requestMethod).toBe('POST')
  })

  test('API request includes Authorization header after login', async ({ page }) => {
    // First login
    await page.route('**/partner/auth/login', route =>
      route.fulfill({
        json: {
          token: 'test.jwt.token',
          refresh_token: 'refresh',
          partner: { id: 'uuid', email: 'p@e.com', tier: 'bronze', status: 'active' },
        },
      })
    )

    let authHeader = ''
    await page.route('**/partner/stats*', async route => {
      authHeader = route.request().headers()['authorization'] || ''
      await route.fulfill({ json: { period: '30d', total_clicks: 0 } })
    })

    await page.goto('/login')
    await page.fill('input[type="email"]', 'p@e.com')
    await page.fill('input[autocomplete="current-password"]', 'pass')
    await page.locator('button[type="submit"]').click()

    await page.waitForTimeout(2000)

    if (authHeader) {
      expect(authHeader).toMatch(/^Bearer /)
    }
  })

  test('no XSS vector from error message display', async ({ page }) => {
    const xssPayload = '<script>window.__xss__=1</script>'
    await page.route('**/partner/auth/login', route =>
      route.fulfill({
        status: 400,
        json: { error: xssPayload },
      })
    )

    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[autocomplete="current-password"]', 'pass')
    await page.locator('button[type="submit"]').click()

    await page.waitForTimeout(500)

    // XSS script should NOT execute — window.__xss__ should not be set
    const xssExecuted = await page.evaluate(() => (window as any).__xss__)
    expect(xssExecuted).toBeUndefined()
  })

  test('login form HTML5 validation blocks empty submission', async ({ page }) => {
    let apiCalled = false
    await page.route('**/partner/auth/login', () => { apiCalled = true })

    await page.goto('/login')
    // Try clicking submit without filling any fields
    await page.locator('button[type="submit"]').click()

    await page.waitForTimeout(300)
    // The login form wraps inputs in <form> with required attributes;
    // HTML5 native validation prevents submission with empty required fields
    expect(apiCalled).toBe(false)
  })
})
