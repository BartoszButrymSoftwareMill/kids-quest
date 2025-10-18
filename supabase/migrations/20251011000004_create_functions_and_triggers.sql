-- =====================================================
-- Migration: Create Functions and Triggers
-- Description: Creates utility functions and automatic triggers
-- Functions created: update_updated_at_column, handle_new_user
-- Triggers created: update_*_updated_at, on_auth_user_created
-- Dependencies: 20251011000002_create_tables.sql
-- Author: KidsQuest Team
-- Date: 2025-10-11
-- =====================================================

-- This migration creates reusable functions and automatic triggers
-- to maintain data integrity and automate common operations.

-- =====================================================
-- Utility Functions
-- =====================================================

-- update_updated_at_column: Automatically updates the updated_at timestamp
-- This function is called by triggers on UPDATE operations
-- Returns: The modified NEW record with updated_at set to now()
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  -- Set the updated_at column to the current timestamp
  new.updated_at = now();
  return new;
end;
$$;

comment on function update_updated_at_column() is 
  'Trigger function that automatically updates updated_at timestamp on row modification';

-- handle_new_user: Automatically creates a profile when a new user signs up
-- This ensures every user has a profile record immediately after authentication
-- Returns: The NEW user record (unchanged)
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer  -- Runs with the privileges of the function creator
as $$
begin
  -- Create a profile record for the new user
  -- All preference fields start as NULL (user will set them on first quest generation)
  insert into public.profiles (user_id, created_at, updated_at)
  values (new.id, now(), now());
  
  return new;
end;
$$;

comment on function handle_new_user() is 
  'Trigger function that automatically creates a profile when a new user signs up via Supabase Auth';

-- =====================================================
-- Triggers for updated_at timestamp maintenance
-- =====================================================

-- Trigger: Update quests.updated_at on modification
create trigger update_quests_updated_at
  before update on quests
  for each row
  execute function update_updated_at_column();

comment on trigger update_quests_updated_at on quests is 
  'Automatically updates updated_at timestamp when quest is modified';

-- Trigger: Update profiles.updated_at on modification
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

comment on trigger update_profiles_updated_at on profiles is 
  'Automatically updates updated_at timestamp when profile is modified';

-- Trigger: Update content_policy_rules.updated_at on modification
create trigger update_content_policy_rules_updated_at
  before update on content_policy_rules
  for each row
  execute function update_updated_at_column();

comment on trigger update_content_policy_rules_updated_at on content_policy_rules is 
  'Automatically updates updated_at timestamp when content policy rule is modified';

-- =====================================================
-- Trigger for automatic profile creation
-- =====================================================

-- Trigger: Create profile when new user signs up via Supabase Auth
-- This trigger listens to INSERT operations on auth.users
-- Note: Requires security definer function to write to public.profiles
-- Note: Cannot add comment to trigger on auth.users table (insufficient privileges)
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- =====================================================
-- End of migration
-- =====================================================
-- All functions and triggers created successfully.
-- Next migration: 20251011000005_enable_rls.sql

