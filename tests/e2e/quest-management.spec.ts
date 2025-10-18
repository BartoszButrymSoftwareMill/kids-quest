/**
 * E2E tests for quest management
 * Tests quest status changes, favorites, and deletion
 */

import { test, expect, type Page } from '@playwright/test';

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

test.describe('Quest Management Flow', () => {
  const testPassword = 'SecurePass123!';
  // Shared user for all tests in this file to avoid rate limiting
  const sharedEmail = `management-test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  let isUserRegistered = false;

  // Configure to run tests serially for better isolation
  test.describe.configure({ mode: 'serial' });

  // Add delay between tests to avoid rate limiting issues
  test.beforeEach(async ({ page }) => {
    // Wait between tests (longer delay to avoid rate limiting)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    if (!isUserRegistered) {
      // Register user only once for all tests in this describe block
      await page.goto('/register', { waitUntil: 'networkidle' });
      await page.waitForSelector('input[name="email"]', { state: 'visible' });
      await page.waitForTimeout(500);
      await page.fill('input[name="email"]', sharedEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.fill('input[name="confirmPassword"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|login)/, { timeout: 30000 });
      isUserRegistered = true;
    } else {
      // Login with existing user
      await page.goto('/login', { waitUntil: 'networkidle' });
      await page.waitForSelector('input[name="email"]', { state: 'visible' });
      await page.waitForTimeout(500);
      await page.fill('input[name="email"]', sharedEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 30000 });
    }
  });

  test('should display list of saved quests', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Should show quests list (may be empty initially)
    await expect(page.locator('[data-testid="quests-list"]')).toBeVisible();
  });

  test('should start a saved quest', async ({ page }) => {
    // Mock the API response
    await mockQuestGenerationAPI(page);

    // First, create a saved quest by generating one
    await page.goto('/dashboard/generate', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.locator('[data-testid="age-group-selector"] [data-value="1"]').click();
    await page.fill('[data-testid="duration-slider-input"]', '30');
    await page.click('[data-testid="location-home"]');
    await page.click('[data-testid="energy-low"]');
    await page.click('button[type="submit"]:has-text("Generuj")');
    await expect(page.locator('[data-testid="quest-result"]')).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("Zapisz")');

    // Should redirect to quest detail page
    await page.waitForURL(/\/dashboard\/quest\//, { timeout: 10000 });

    // Go to dashboard
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Find and click on the quest detail link
    await page.locator('[data-testid="quest-card"]').first().locator('a:has-text("Zobacz szczegóły")').click();

    // Wait for quest detail page to load
    await page.waitForURL(/\/dashboard\/quest\//);

    // Click "Start" button on quest detail page
    await page.click('button:has-text("Rozpocznij quest")');

    // Status should change to "W trakcie" / "Started"
    await expect(page.locator('[data-testid="quest-status"]:has-text("W trakcie")')).toBeVisible({ timeout: 10000 });
  });

  test('should complete a started quest', async ({ page }) => {
    // Mock the API response
    await mockQuestGenerationAPI(page);

    // Create and start a quest first
    await page.goto('/dashboard/generate', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.locator('[data-testid="age-group-selector"] [data-value="1"]').click();
    await page.fill('[data-testid="duration-slider-input"]', '30');
    await page.click('[data-testid="location-home"]');
    await page.click('[data-testid="energy-medium"]');
    await page.click('button[type="submit"]:has-text("Generuj")');
    await expect(page.locator('[data-testid="quest-result"]')).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("Rozpocznij")');

    // Now on quest detail page with status "started"
    await page.waitForURL(/\/dashboard\/quest\//, { timeout: 15000 });

    // Click "Complete" button
    await page.click('button:has-text("Oznacz jako ukończony")');

    // Status should change to "Ukończony" / "Completed"
    await expect(page.locator('[data-testid="quest-status"]:has-text("Ukończon")')).toBeVisible({ timeout: 10000 });
  });
});
