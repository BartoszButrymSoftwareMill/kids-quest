/**
 * Mock Supabase client for unit tests
 */

import { vi } from 'vitest';
import type { SupabaseClient } from '../../src/db/supabase.client';

export function createMockSupabaseClient(): SupabaseClient {
  return {
    auth: {
      getUser: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
  } as unknown as SupabaseClient;
}

export function mockAuthUser(userId: string, email = 'test@example.com') {
  return {
    id: userId,
    email,
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
  };
}

export function mockSupabaseResponse<T>(data: T, error: null | { message: string } = null) {
  return { data, error };
}
