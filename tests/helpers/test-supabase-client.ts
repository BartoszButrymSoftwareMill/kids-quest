/**
 * Test Supabase client helper
 * For integration tests with real database
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/db/database.types';

/**
 * Creates a test Supabase client (regular anon key)
 * Uses environment variables for connection
 */
export function createTestSupabaseClient() {
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
  const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY || 'test-key';

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Creates a Supabase Admin client (service role key)
 * Used for admin operations like confirming emails
 */
export function createTestSupabaseAdminClient() {
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not set - admin operations will fail');
    // Return regular client as fallback
    return createTestSupabaseClient();
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Helper to create a test user for integration tests
 * Automatically confirms email if service role key is available
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

  // If email confirmation is required and we have admin access, confirm it automatically
  if (data.user && !data.session) {
    await confirmUserEmail(data.user.id);
  }

  return data.user;
}

/**
 * Confirms a user's email using Admin API
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set
 */
export async function confirmUserEmail(userId: string): Promise<void> {
  const adminClient = createTestSupabaseAdminClient();

  try {
    // Use Admin API to update user as confirmed
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (error) {
      console.error('Failed to confirm user email:', error);
      throw error;
    }

    console.log(`✅ Email confirmed for user ${userId}`);
  } catch (error) {
    console.error('Error confirming email:', error);
    throw error;
  }
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
