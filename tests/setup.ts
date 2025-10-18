/**
 * Vitest setup file
 * Runs before all tests
 */

import { vi } from 'vitest';

// Mock environment variables
process.env.OPENROUTER_API_KEY = 'test-api-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';

// Global test utilities
global.mockDate = (isoString: string) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(isoString));
};

global.restoreDate = () => {
  vi.useRealTimers();
};

declare global {
  var mockDate: (isoString: string) => void;

  var restoreDate: () => void;
}
