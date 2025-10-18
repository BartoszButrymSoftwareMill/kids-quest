/**
 * Global teardown for E2E tests
 * Runs once after all tests complete
 */

import { test as teardown } from '@playwright/test';
import { createTestSupabaseClient } from './helpers/test-supabase-client';

teardown('cleanup test data', async () => {
  console.log('🧹 Starting cleanup of test data...');

  try {
    const supabase = createTestSupabaseClient();

    // If using cloud environment with dedicated test user, sign in first for proper permissions
    if (process.env.E2E_USERNAME && process.env.E2E_PASSWORD) {
      console.log('🔐 Signing in as test user for cleanup...');
      await supabase.auth.signInWithPassword({
        email: process.env.E2E_USERNAME,
        password: process.env.E2E_PASSWORD,
      });
    }

    // Get all profiles created in the last 24 hours (test users)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id')
      .gte('created_at', oneDayAgo);

    if (profilesError) {
      console.error('❌ Error fetching test profiles:', profilesError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('✅ No test data to cleanup');
      return;
    }

    console.log(`📋 Found ${profiles.length} test user(s) to cleanup`);

    // Delete test users' data in correct order (respecting foreign keys)
    for (const profile of profiles) {
      console.log(`  Cleaning up user: ${profile.user_id}`);

      // Delete user's quests (has foreign key to user_id)
      const { error: questsError } = await supabase.from('quests').delete().eq('user_id', profile.user_id);

      if (questsError) {
        console.error(`  ⚠️  Error deleting quests for ${profile.user_id}:`, questsError);
      }

      // Delete user's events (has foreign key to user_id)
      const { error: eventsError } = await supabase.from('events').delete().eq('user_id', profile.user_id);

      if (eventsError) {
        console.error(`  ⚠️  Error deleting events for ${profile.user_id}:`, eventsError);
      }

      // Delete user's profile
      const { error: profileError } = await supabase.from('profiles').delete().eq('user_id', profile.user_id);

      if (profileError) {
        console.error(`  ⚠️  Error deleting profile for ${profile.user_id}:`, profileError);
      }
    }

    console.log('✅ Test data cleanup completed successfully');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    // Don't throw - we don't want teardown failures to fail the test suite
  }
});
