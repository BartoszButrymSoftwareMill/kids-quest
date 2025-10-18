/**
 * Global setup for E2E tests
 * Runs once before all tests
 */

import { test as setup } from '@playwright/test';
import { createTestSupabaseClient } from './helpers/test-supabase-client';

setup('prepare test environment', async () => {
  console.log('🚀 Starting E2E test suite...');

  // If using cloud Supabase (production environment), sign in as dedicated test user
  const e2eUsername = process.env.E2E_USERNAME;
  const e2ePassword = process.env.E2E_PASSWORD;

  if (e2eUsername && e2ePassword) {
    console.log('🔐 Signing in as test user for cloud environment...');
    const supabase = createTestSupabaseClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: e2eUsername,
      password: e2ePassword,
    });

    if (signInError) {
      console.error('❌ Error signing in as test user:', signInError);
      throw signInError;
    }

    console.log('✅ Signed in as test user');
  } else {
    console.log('ℹ️  No E2E credentials provided - using local/anonymous mode');
  }

  console.log('✅ Test environment ready');
});
