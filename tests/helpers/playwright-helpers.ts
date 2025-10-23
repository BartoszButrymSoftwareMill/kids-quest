/**
 * Playwright test helpers
 * Utilities for E2E tests
 */

import type { Page, Response } from '@playwright/test';
import { confirmUserEmail } from './test-supabase-client';

/**
 * Registers a user via the UI and automatically confirms their email
 * Returns the email and password used
 */
export async function registerAndConfirmUser(
  page: Page,
  testPassword: string
): Promise<{ email: string; password: string; userId?: string }> {
  const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@mailinator.com`;

  await page.goto('/register', { waitUntil: 'networkidle' });
  await page.waitForSelector('input[name="email"]', { state: 'visible' });
  await page.waitForTimeout(500);
  await page.fill('input[name="email"]', uniqueEmail);
  await page.fill('input[name="password"]', testPassword);
  await page.fill('input[name="confirmPassword"]', testPassword);

  // Wait for registration API call
  const [response] = await Promise.all([
    page.waitForResponse((resp: Response) => resp.url().includes('/api/auth/register'), { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);

  const responseData = await response.json();

  if (!response.ok()) {
    throw new Error(`Registration failed: ${JSON.stringify(responseData)}`);
  }

  // If email confirmation is required, confirm it automatically using Admin API
  if (responseData.needsEmailConfirmation && responseData.user?.id) {
    console.log(`📧 Email confirmation required - auto-confirming user ${responseData.user.id}`);

    try {
      await confirmUserEmail(responseData.user.id);
      console.log('✅ Email confirmed successfully');

      // Now we need to login since confirmation doesn't create a session
      await page.goto('/login', { waitUntil: 'networkidle' });
      await page.waitForSelector('input[name="email"]', { state: 'visible' });
      await page.waitForTimeout(500);
      await page.fill('input[name="email"]', uniqueEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 30000 });
    } catch (error) {
      console.error('❌ Failed to confirm email:', error);
      throw new Error(
        'Email confirmation required but SUPABASE_SERVICE_ROLE_KEY is not set. ' +
          'Please add it to your .env.test file or disable email confirmation in Supabase Dashboard.'
      );
    }
  } else {
    // No email confirmation needed - should redirect to dashboard automatically
    await page.waitForURL('/dashboard', { timeout: 30000 });
  }

  return {
    email: uniqueEmail,
    password: testPassword,
    userId: responseData.user?.id,
  };
}
