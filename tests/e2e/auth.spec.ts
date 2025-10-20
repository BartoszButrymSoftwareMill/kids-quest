/**
 * E2E tests for authentication flow
 * Tests user registration, login, and logout
 */

import { test, expect } from '@playwright/test';
import { registerAndConfirmUser } from '../helpers/playwright-helpers';

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
    // Using mailinator.com domain which is a real domain that accepts all emails
    const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@mailinator.com`;

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
    expect(response.ok()).toBeTruthy();

    // Handle both cases: with and without email confirmation
    // Wait for either email confirmation message or redirect to dashboard
    const emailConfirmationVisible = await page
      .locator('[data-testid="email-confirmation-message"]')
      .isVisible()
      .catch(() => false);

    if (emailConfirmationVisible) {
      // Email confirmation is required - verify message is shown
      const confirmationMessage = page.locator('[data-testid="email-confirmation-message"]');
      await expect(confirmationMessage).toBeVisible({ timeout: 10000 });
      await expect(confirmationMessage).toContainText('Sprawdź swoją skrzynkę email');
      console.log('✓ Email confirmation required - message displayed');
    } else {
      // No email confirmation - should redirect to dashboard
      await page.waitForURL(/\/dashboard/, { timeout: 30000 });
      console.log('✓ No email confirmation - redirected to dashboard');
    }
  });

  test('should login with valid credentials', async ({ page }) => {
    // Register and confirm user automatically
    const { email, password } = await registerAndConfirmUser(page, testPassword);

    // Logout to test login
    const logoutButton = page.locator('button:has-text("Wyloguj")');
    await logoutButton.click();
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Now login with the same credentials
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForSelector('input[name="email"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 30000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    await page.waitForSelector('input[name="email"]', { state: 'visible' });
    await page.waitForTimeout(500);
    await page.fill('input[name="email"]', `nonexistent-${Date.now()}@mailinator.com`);
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    await expect(errorMessage).toContainText('Nieprawidłowy email lub hasło');
  });

  test('should logout authenticated user', async ({ page, context }) => {
    // Register and confirm user automatically
    await registerAndConfirmUser(page, testPassword);

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
    await page.fill('input[name="email"]', `test-${Date.now()}@mailinator.com`);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'different123');
    await page.click('button[type="submit"]');

    // Should show validation error
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    await expect(errorMessage).toContainText('Hasła nie są identyczne');
  });

  test('should enforce rate limiting on login', async ({ page }) => {
    // Use same email for all attempts to trigger rate limiting
    // Rate limit is 5 attempts per 15 minutes per email
    const wrongEmail = `wrong-${Date.now()}@mailinator.com`;

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
    // Register and confirm user automatically
    await registerAndConfirmUser(page, testPassword);

    // Reload page
    await page.reload({ waitUntil: 'networkidle' });

    // Should still be on dashboard (session persisted)
    expect(page.url()).toContain('/dashboard');
  });
});
