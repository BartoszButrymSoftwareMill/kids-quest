/**
 * E2E tests for authentication flow
 * Tests user registration, login, and logout
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const testPassword = 'SecurePass123!';

  // Configure to run tests serially for better isolation
  test.describe.configure({ mode: 'serial' });

  // Add delay between tests to avoid rate limiting issues
  test.beforeEach(async () => {
    // Wait 5 seconds between tests to allow rate limits to reset and server to be ready
    // This helps avoid issues when multiple tests hit the same endpoints
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });

  // Clean up after each test
  test.afterEach(async ({ context }) => {
    // Clear all cookies to ensure clean state
    await context.clearCookies();
  });

  test('should register a new user', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'networkidle' });

    // Use unique email for each test run
    const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;

    // Wait for form to be ready and fill registration form
    await page.waitForSelector('input[name="email"]', { state: 'visible' });
    await page.waitForTimeout(500); // Extra wait for form to be fully interactive
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    // Wait for register API call with increased timeout
    const [response] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/auth/register'), { timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);

    // Check if registration was successful
    const responseData = await response.json();
    if (!response.ok) {
      console.error('Registration failed:', responseData);
    }

    // Should show success message or redirect
    // Depending on email confirmation settings
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 30000 });
  });

  test('should login with valid credentials', async ({ page }) => {
    // First, ensure user exists by registering
    await page.goto('/register', { waitUntil: 'networkidle' });

    const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    await page.waitForSelector('input[name="email"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    // Wait for registration with proper timeout
    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/auth/register'), { timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);

    // Wait for registration to complete (redirect to dashboard)
    await page.waitForURL('/dashboard', { timeout: 30000 });

    // Logout to test login
    const logoutButton = page.locator('button:has-text("Wyloguj")');
    await logoutButton.click();
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Now login with the same credentials
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForSelector('input[name="email"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 30000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    await page.waitForSelector('input[name="email"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    await expect(errorMessage).toContainText('Nieprawidłowy email lub hasło');
  });

  test('should logout authenticated user', async ({ page, context }) => {
    // First register and login
    const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    await page.goto('/register', { waitUntil: 'networkidle' });
    await page.waitForSelector('input[name="email"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    // Wait for registration API call with increased timeout
    const [response] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/auth/register') && resp.status() === 201, {
        timeout: 30000,
      }),
      page.click('button[type="submit"]'),
    ]);

    // Verify registration was successful
    const responseData = await response.json();
    expect(responseData.success).toBe(true);

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 30000 });

    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Wyloguj")');
    await logoutButton.click();

    // Should redirect to login
    await page.waitForURL('/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');

    // Cookies should be cleared
    const cookies = await context.cookies();
    const authCookies = cookies.filter((c) => c.name.includes('auth'));
    expect(authCookies.length).toBe(0);
  });

  test('should show validation error for mismatched passwords', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'networkidle' });

    await page.waitForSelector('input[name="email"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'different123');
    await page.click('button[type="submit"]');

    // Should show validation error
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    await expect(errorMessage).toContainText('Hasła nie są identyczne');
  });

  test('should enforce rate limiting on login', async ({ page }) => {
    const wrongEmail = `wrong-${Date.now()}@example.com`;

    // Make 6 failed login attempts to trigger rate limiting
    for (let i = 0; i < 6; i++) {
      // Go to login page fresh each time
      await page.goto('/login', { waitUntil: 'networkidle' });

      // Wait for form to be ready
      await page.waitForSelector('input[name="email"]', { state: 'visible' });
      await page.waitForTimeout(300);

      // Fill the form
      await page.fill('input[name="email"]', wrongEmail);
      await page.fill('input[name="password"]', 'wrongpassword');

      // Submit
      await page.click('button[type="submit"]');

      // Wait for error message to appear
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 });

      // If this is the last attempt (6th), check for rate limit message
      if (i === 5) {
        const errorMessage = page.locator('[data-testid="error-message"]');
        await expect(errorMessage).toContainText(/zbyt wiele prób/i);
      }

      // Very small delay between attempts - just enough for page to be ready
      await page.waitForTimeout(500);
    }
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Should redirect to login (with redirect query param)
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
    // Should also include redirect parameter (URL encoded)
    expect(page.url()).toMatch(/redirect=%2Fdashboard/);
  });

  test('should persist session across page reloads', async ({ page }) => {
    // First register and login
    const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    await page.goto('/register', { waitUntil: 'networkidle' });
    await page.waitForSelector('input[name="email"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/auth/register') && resp.status() === 201, {
        timeout: 30000,
      }),
      page.click('button[type="submit"]'),
    ]);

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 30000 });

    // Reload page
    await page.reload({ waitUntil: 'networkidle' });

    // Should still be on dashboard (session persisted)
    expect(page.url()).toContain('/dashboard');
  });
});
