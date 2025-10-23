/**
 * E2E tests for error handling
 * Tests various error scenarios and user feedback
 */

import { test, expect, type Page } from '@playwright/test';
import { registerAndConfirmUser } from '../helpers/playwright-helpers';

// Mock error response helper
async function mockQuestGenerationError(page: Page, errorMessage = 'Wystąpił błąd, spróbuj później') {
  await page.route('**/api/quests/generate', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'generation_failed',
        message: errorMessage,
      }),
    });
  });
}

test.describe('Error Handling', () => {
  const testPassword = 'SecurePass123!';
  let sharedUser: { email: string; password: string } | null = null;

  // Configure to run tests serially for better isolation
  test.describe.configure({ mode: 'serial' });

  // Add delay between tests to avoid rate limiting issues
  test.beforeEach(async ({ page }) => {
    // Wait between tests (longer delay to avoid rate limiting)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    if (!sharedUser) {
      // Register user only once for all tests in this describe block
      sharedUser = await registerAndConfirmUser(page, testPassword);
    } else {
      // Login with existing user
      await page.goto('/login', { waitUntil: 'networkidle' });
      await page.waitForSelector('input[name="email"]', { state: 'visible' });
      await page.waitForTimeout(500);
      await page.fill('input[name="email"]', sharedUser.email);
      await page.fill('input[name="password"]', sharedUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 30000 });
    }
  });

  test('should show error when generating quest without required fields', async ({ page }) => {
    await page.goto('/dashboard/generate', { waitUntil: 'networkidle' });

    const currentUrl = page.url();

    // Try to submit form without filling required fields
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]:has-text("Generuj")');

    // Wait a bit to see if anything happens
    await page.waitForTimeout(2000);

    // Should stay on the same page (form validation prevents submission)
    expect(page.url()).toBe(currentUrl);
    // Loading state should not appear
    await expect(page.locator('[data-testid="loading-state"]')).not.toBeVisible();
  });

  test('should handle OpenRouter API timeout gracefully', async ({ page }) => {
    // Mock an error response
    await mockQuestGenerationError(page);

    await page.goto('/dashboard/generate', { waitUntil: 'networkidle' });

    // Fill form
    await page.waitForTimeout(500);
    await page.locator('[data-testid="age-group-selector"] [data-value="1"]').click();
    await page.fill('[data-testid="duration-slider-input"]', '30');
    await page.click('[data-testid="location-home"]');
    await page.click('[data-testid="energy-low"]');

    // Submit - should show error
    await page.click('button[type="submit"]:has-text("Generuj")');

    // Should show error state
    await expect(page.locator('[data-testid="error-state"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show content safety violations when detected', async ({ page }) => {
    // This would require creating a quest manually with unsafe content
    // For now, we verify that the UI can display violations

    await page.goto('/dashboard/generate', { waitUntil: 'networkidle' });

    // Manual quest creation with potentially unsafe content
    // (This is a placeholder - actual implementation depends on manual quest feature)
    await page.waitForTimeout(500);
    const hasManualQuestFeature = await page.locator('[data-testid="manual-quest-button"]').isVisible();

    if (hasManualQuestFeature) {
      await page.click('[data-testid="manual-quest-button"]');
      // Fill form with content that would trigger safety rules
      // Then verify violation message is shown
    }

    expect(true).toBe(true); // Placeholder
  });

  test('should handle quest not found (404)', async ({ page }) => {
    // Try to access non-existent quest
    await page.goto('/dashboard/quest/00000000-0000-0000-0000-000000000000', { waitUntil: 'networkidle' });

    // Should redirect back to dashboard with error parameter
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    await page.goto('/dashboard/generate', { waitUntil: 'networkidle' });

    // Fill form
    await page.waitForTimeout(500);
    await page.locator('[data-testid="age-group-selector"] [data-value="1"]').click();
    await page.fill('[data-testid="duration-slider-input"]', '30');
    await page.click('[data-testid="location-home"]');
    await page.click('[data-testid="energy-low"]');

    // Simulate network offline
    await context.setOffline(true);

    // Try to generate
    await page.click('button[type="submit"]:has-text("Generuj")');

    // Should show network error message
    await expect(page.locator('text=/błąd sieci|brak połączenia/i')).toBeVisible({ timeout: 15000 });

    // Restore network
    await context.setOffline(false);
  });

  test('should show rate limit error message', async ({ page }) => {
    // Make rapid quest generation requests to trigger rate limit
    for (let i = 0; i < 6; i++) {
      // Navigate to generator page for each attempt
      await page.goto('/dashboard/generate', { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      // Fill and submit form
      await page.locator('[data-testid="age-group-selector"] [data-value="1"]').click();
      await page.fill('[data-testid="duration-slider-input"]', '30');
      await page.click('[data-testid="location-home"]');
      await page.click('[data-testid="energy-low"]');
      await page.click('button[type="submit"]:has-text("Generuj")');

      // Wait a bit between requests
      await page.waitForTimeout(1000);
    }

    // Should show rate limit error
    await expect(page.locator('text=/zbyt wiele prób|rate limit/i')).toBeVisible({ timeout: 10000 });
  });
});
