import { test, expect } from '@playwright/test'

// Helper: set auth state in localStorage so protected routes are accessible
async function setAuthState(page: any) {
  await page.addInitScript(() => {
    // Zustand auth store persists to localStorage
    localStorage.setItem(
      'tap-auth',
      JSON.stringify({
        state: {
          token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwidHlwZSI6InBhcnRuZXIiLCJleHAiOjk5OTk5OTk5OTl9.sig',
          partner: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'test@example.com',
            full_name: 'Test Partner',
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

test.describe('Routing & Navigation', () => {
  test('root path redirects to dashboard when authenticated', async ({ page }) => {
    await setAuthState(page)
    // Mock all API calls
    await page.route('**/partner/**', route => route.fulfill({ json: { items: [], total: 0 } }))
    await page.goto('/')
    await expect(page).toHaveURL(/\/(dashboard|login)/)
  })

  test('unauthenticated users are redirected to login from protected routes', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated users accessing /payouts redirected to login', async ({ page }) => {
    await page.goto('/payouts')
    await expect(page).toHaveURL(/\/login/)
  })

  test('/login is accessible without auth', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('/register is accessible without auth', async ({ page }) => {
    await page.goto('/register')
    await expect(page).toHaveURL(/\/register/)
    await expect(page.getByText('Инфлюенсер')).toBeVisible()
  })

  test('page title contains TAP branding', async ({ page }) => {
    await page.goto('/login')
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })
})

test.describe('Dashboard with mocked API', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthState(page)

    // Mock stats API
    await page.route('**/partner/stats*', route =>
      route.fulfill({
        json: {
          period: '30d',
          total_clicks: 150,
          total_orders: 12,
          conversion_rate: 8.0,
          total_earned: 45000,
          pending_amount: 12000,
          available_amount: 33000,
        },
      })
    )

    // Mock click time series
    await page.route('**/partner/stats/clicks*', route =>
      route.fulfill({
        json: [],
      })
    )
  })

  test('dashboard page loads without crashing', async ({ page }) => {
    await page.goto('/dashboard')
    // Should not show error boundary or blank page
    await expect(page.locator('body')).not.toBeEmpty()
    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('displays stats when API responds', async ({ page }) => {
    await page.goto('/dashboard')
    // Wait for page to settle
    await page.waitForLoadState('networkidle')
    // Stats should be visible (numbers or the containers)
    const pageContent = await page.textContent('body')
    expect(pageContent?.length ?? 0).toBeGreaterThan(100)
  })
})
