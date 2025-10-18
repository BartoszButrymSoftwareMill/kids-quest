import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Disable parallel execution to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Use single worker to avoid database conflicts
  reporter: 'html',
  timeout: 90000, // Increase test timeout to 90 seconds for sequential execution
  expect: {
    timeout: 15000, // Increase assertion timeout to 15 seconds
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000, // Increase action timeout to 15 seconds
  },
  projects: [
    // Setup project - runs before all tests
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      teardown: 'teardown',
    },
    // Teardown project - runs after all tests
    {
      name: 'teardown',
      testMatch: /global\.teardown\.ts/,
    },
    // Main test project
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // Increase to 3 minutes for webserver startup
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      DISABLE_RATE_LIMIT: 'true', // Disable rate limiting for e2e tests
    },
  },
});
