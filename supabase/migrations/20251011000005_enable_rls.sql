-- =====================================================
-- Migration: Enable Row Level Security (RLS)
-- Description: Creates RLS policies for all tables
-- Tables affected: profiles, quests, quest_props, events, age_groups, props, content_policy_rules
-- Dependencies: 20251011000002_create_tables.sql
-- Author: KidsQuest Team
-- Date: 2025-10-11
-- =====================================================

-- This migration implements Row Level Security (RLS) policies to ensure:
-- 1. Users can only access their own data
-- 2. Dictionary tables are read-only for all users
-- 3. Security is enforced at the database level (zero-trust architecture)

-- Important: RLS was already enabled on all tables in the create_tables migration.
-- This migration only creates the policies that define access rules.

-- =====================================================
-- RLS Policies for profiles table
-- =====================================================

-- Policy: Authenticated users can view their own profile
-- Rationale: Users need to read their default preferences
create policy "Users can view own profile"
  on profiles
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Authenticated users can insert their own profile
-- Rationale: Allows profile creation during signup (also handled by trigger)
create policy "Users can insert own profile"
  on profiles
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Authenticated users can update their own profile
-- Rationale: Users need to modify their default preferences
create policy "Users can update own profile"
  on profiles
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

comment on policy "Users can view own profile" on profiles is 
  'Authenticated users can read their own profile data';
comment on policy "Users can insert own profile" on profiles is 
  'Authenticated users can create their own profile (also auto-created by trigger)';
comment on policy "Users can update own profile" on profiles is 
  'Authenticated users can modify their own profile preferences';

-- =====================================================
-- RLS Policies for quests table
-- =====================================================

-- Policy: Authenticated users can view their own quests
-- Rationale: Users need to see their quest library
create policy "Users can view own quests"
  on quests
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Authenticated users can insert their own quests
-- Rationale: Users can save AI-generated quests or create manual quests
create policy "Users can insert own quests"
  on quests
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Authenticated users can update their own quests
-- Rationale: Users can modify quest status, mark as favorite, etc.
create policy "Users can update own quests"
  on quests
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Authenticated users can delete their own quests
-- Rationale: Users can remove unwanted quests from their library
create policy "Users can delete own quests"
  on quests
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on policy "Users can view own quests" on quests is 
  'Authenticated users can read their own quests';
comment on policy "Users can insert own quests" on quests is 
  'Authenticated users can create new quests (AI-generated or manual)';
comment on policy "Users can update own quests" on quests is 
  'Authenticated users can modify their own quests (status, favorites, etc.)';
comment on policy "Users can delete own quests" on quests is 
  'Authenticated users can delete their own quests';

-- =====================================================
-- RLS Policies for quest_props table
-- =====================================================

-- Policy: Authenticated users can view props for their own quests
-- Rationale: Users need to see which props are required for their quests
-- Note: Uses subquery to check quest ownership
create policy "Users can view own quest props"
  on quest_props
  for select
  to authenticated
  using (
    quest_id in (
      select id from quests where user_id = auth.uid()
    )
  );

-- Policy: Authenticated users can manage props for their own quests
-- Rationale: Users can add/remove props when creating or editing quests
-- Note: ALL operations (insert, update, delete) use the same ownership check
create policy "Users can manage own quest props"
  on quest_props
  for all
  to authenticated
  using (
    quest_id in (
      select id from quests where user_id = auth.uid()
    )
  )
  with check (
    quest_id in (
      select id from quests where user_id = auth.uid()
    )
  );

comment on policy "Users can view own quest props" on quest_props is 
  'Authenticated users can read props for their own quests';
comment on policy "Users can manage own quest props" on quest_props is 
  'Authenticated users can add/remove props for their own quests';

-- =====================================================
-- RLS Policies for events table
-- =====================================================

-- Policy: Authenticated users can view their own events
-- Rationale: Users can view their activity history (analytics)
create policy "Users can view own events"
  on events
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Authenticated users can insert their own events
-- Rationale: Application logs user actions for analytics
-- Note: No UPDATE or DELETE - events are immutable once created
create policy "Users can insert own events"
  on events
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy "Users can view own events" on events is 
  'Authenticated users can read their own telemetry events';
comment on policy "Users can insert own events" on events is 
  'Authenticated users can log their own events (immutable once created)';

-- =====================================================
-- RLS Policies for age_groups table (dictionary)
-- =====================================================

-- Policy: Anonymous users can view age groups
-- Rationale: Age groups are needed before authentication (registration form)
create policy "Anyone can view age groups"
  on age_groups
  for select
  to anon
  using (true);

-- Policy: Authenticated users can view age groups
-- Rationale: Age groups are needed for quest generation and filtering
create policy "Authenticated users can view age groups"
  on age_groups
  for select
  to authenticated
  using (true);

comment on policy "Anyone can view age groups" on age_groups is 
  'Public read access for anonymous users (needed for registration)';
comment on policy "Authenticated users can view age groups" on age_groups is 
  'Public read access for authenticated users';

-- =====================================================
-- RLS Policies for props table (dictionary)
-- =====================================================

-- Policy: Anonymous users can view props
-- Rationale: Props may be shown in public quest previews
create policy "Anyone can view props"
  on props
  for select
  to anon
  using (true);

-- Policy: Authenticated users can view props
-- Rationale: Props are needed for quest generation and filtering
create policy "Authenticated users can view props"
  on props
  for select
  to authenticated
  using (true);

comment on policy "Anyone can view props" on props is 
  'Public read access for anonymous users';
comment on policy "Authenticated users can view props" on props is 
  'Public read access for authenticated users';

-- =====================================================
-- RLS Policies for content_policy_rules table (dictionary)
-- =====================================================

-- Policy: Anonymous users can view content policy rules
-- Rationale: Content validation may be needed client-side before authentication
create policy "Anyone can view content policy rules"
  on content_policy_rules
  for select
  to anon
  using (true);

-- Policy: Authenticated users can view content policy rules
-- Rationale: Content validation is needed for quest generation and manual creation
create policy "Authenticated users can view content policy rules"
  on content_policy_rules
  for select
  to authenticated
  using (true);

comment on policy "Anyone can view content policy rules" on content_policy_rules is 
  'Public read access for anonymous users (client-side validation)';
comment on policy "Authenticated users can view content policy rules" on content_policy_rules is 
  'Public read access for authenticated users';

-- =====================================================
-- End of migration
-- =====================================================
-- All RLS policies created successfully.
-- Dictionary tables (age_groups, props, content_policy_rules) are read-only for all users.
-- User data tables (profiles, quests, quest_props, events) enforce user ownership.
-- Next migration: 20251011000006_seed_reference_data.sql

