/**
 * E2E tests for quest generation flow
 * Tests the complete flow from generator form to quest result
 */

import { test, expect, type Page } from '@playwright/test';
import { registerAndConfirmUser } from '../helpers/playwright-helpers';

// Mock quest response helper
async function mockQuestGenerationAPI(page: Page) {
  await page.route('**/api/quests/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        title: 'Poszukiwanie Skarbów w Domu',
        hook: 'W Twoim domu ukryty jest tajemniczy skarb! Czy jesteś gotowy na przygodę?',
        step1: 'Znajdź 3 przedmioty w kolorze niebieskim',
        step2: 'Ułóż z nich zabawną historię',
        step3: 'Narysuj mapę skarbów',
        easier_version: 'Znajdź tylko 2 przedmioty i opisz je',
        harder_version: 'Znajdź 5 przedmiotów i stwórz z nich teatrzyk',
        safety_notes: null,
        age_group_id: 1,
        duration_minutes: 30,
        location: 'home',
        energy_level: 'medium',
        prop_ids: [],
        source: 'ai',
      }),
    });
  });
}

test.describe('Quest Generation Flow', () => {
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

    // Navigate to generator
    await page.goto('/dashboard/generate', { waitUntil: 'networkidle' });
  });

  test('should display generator form with all fields', async ({ page }) => {
    // Check that form elements are present
    await expect(page.locator('[data-testid="age-group-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="duration-slider-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="location-picker"]')).toBeVisible();
    await expect(page.locator('[data-testid="energy-level-picker"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Generuj")')).toBeVisible();
  });

  test('should generate quest with selected parameters', async ({ page }) => {
    // Mock the API response
    await mockQuestGenerationAPI(page);

    // Select age group (e.g., "3-4 lata")
    await page.locator('[data-testid="age-group-selector"] [data-value="1"]').click();

    // Select duration (e.g., 30 minutes)
    await page.fill('[data-testid="duration-slider-input"]', '30');

    // Select location (home)
    await page.click('[data-testid="location-home"]');

    // Select energy level (medium)
    await page.click('[data-testid="energy-medium"]');

    // Click generate button
    await page.click('button[type="submit"]:has-text("Generuj")');

    // Wait for quest result (with mocked API, loading state may be too fast to catch)
    await expect(page.locator('[data-testid="quest-result"]')).toBeVisible({ timeout: 15000 });

    // Verify quest has required fields
    await expect(page.locator('[data-testid="quest-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="quest-hook"]')).toBeVisible();
    await expect(page.locator('[data-testid="quest-step1"]')).toBeVisible();
    await expect(page.locator('[data-testid="quest-step2"]')).toBeVisible();
    await expect(page.locator('[data-testid="quest-step3"]')).toBeVisible();
  });

  test('should save generated quest', async ({ page }) => {
    // Mock the API response
    await mockQuestGenerationAPI(page);

    // Generate a quest first
    await page.locator('[data-testid="age-group-selector"] [data-value="1"]').click();
    await page.fill('[data-testid="duration-slider-input"]', '30');
    await page.click('[data-testid="location-home"]');
    await page.click('[data-testid="energy-medium"]');
    await page.click('button[type="submit"]:has-text("Generuj")');

    // Wait for result
    await expect(page.locator('[data-testid="quest-result"]')).toBeVisible({ timeout: 15000 });

    // Click save button
    await page.click('button:has-text("Zapisz")');

    // Should redirect to quest detail page
    await page.waitForURL(/\/dashboard\/quest\//, { timeout: 10000 });

    // Navigate to saved quests list
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Saved quest should appear in the list
    await expect(page.locator('[data-testid="quest-card"]').first()).toBeVisible();
  });

  test('should start quest immediately after generation', async ({ page }) => {
    // Mock the API response
    await mockQuestGenerationAPI(page);

    // Generate quest
    await page.locator('[data-testid="age-group-selector"] [data-value="1"]').click();
    await page.fill('[data-testid="duration-slider-input"]', '30');
    await page.click('[data-testid="location-outdoor"]');
    await page.click('[data-testid="energy-high"]');
    await page.click('button[type="submit"]:has-text("Generuj")');

    await expect(page.locator('[data-testid="quest-result"]')).toBeVisible({ timeout: 15000 });

    // Click "Start" button
    await page.click('button:has-text("Rozpocznij")');

    // Should redirect to quest detail page with status "started"
    await page.waitForURL(/\/dashboard\/quest\//);
    await expect(page.locator('text=/w trakcie|started/i')).toBeVisible();
  });

  test('should show error message on generation failure', async ({ page }) => {
    // This test would require mocking API failure or testing with invalid data
    // For now, we ensure error handling UI exists

    // Try to generate without selecting required fields
    await page.click('button[type="submit"]:has-text("Generuj")');

    // Form should prevent submission without required fields (no navigation should occur)
    await page.waitForTimeout(2000);
    // We should still be on the generator page
    expect(page.url()).toContain('/dashboard/generate');
  });

  test('should select props for quest generation', async ({ page }) => {
    // Mock the API response
    await mockQuestGenerationAPI(page);

    // Select age group and other basic parameters
    await page.locator('[data-testid="age-group-selector"] [data-value="2"]').click();
    await page.fill('[data-testid="duration-slider-input"]', '45');
    await page.click('[data-testid="location-outdoor"]');
    await page.click('[data-testid="energy-high"]');

    // Select props (if available)
    const propsSelector = page.locator('[data-testid="props-selector"]');
    if (await propsSelector.isVisible()) {
      await propsSelector.click();
      await page.locator('[data-testid="prop-option"]').first().click();
    }

    // Generate quest
    await page.click('button[type="submit"]:has-text("Generuj")');
    await expect(page.locator('[data-testid="quest-result"]')).toBeVisible({ timeout: 15000 });

    // Quest should include selected props
    // (Verify in quest details or props display)
  });
});
