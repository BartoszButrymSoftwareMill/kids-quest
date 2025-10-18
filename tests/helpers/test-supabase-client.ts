/**
 * Test Supabase client helper
 * For integration tests with real database
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/db/database.types';

/**
 * Creates a test Supabase client
 * Uses environment variables for connection
 */
export function createTestSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://test.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 'test-key';

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Helper to create a test user for integration tests
 */
export async function createTestUser(email: string, password: string) {
  const supabase = createTestSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data.user;
}

/**
 * Helper to sign in test user
 */
export async function signInTestUser(email: string, password: string) {
  const supabase = createTestSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Cleanup helper - removes test user
 */
export async function cleanupTestUser(userId: string) {
  const supabase = createTestSupabaseClient();

  // Delete user's quests
  await supabase.from('quests').delete().eq('user_id', userId);

  // Delete user's events
  await supabase.from('events').delete().eq('user_id', userId);

  // Delete user's profile
  await supabase.from('profiles').delete().eq('user_id', userId);
}
