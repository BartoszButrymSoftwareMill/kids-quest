-- =====================================================
-- Seed File: Development/Testing Data
-- Description: Optional seed data for local development and testing
-- Usage: This file is automatically run by Supabase CLI after migrations
-- Author: KidsQuest Team
-- Date: 2025-10-11
-- =====================================================

-- This file contains optional seed data for development and testing.
-- In production, this data should NOT be loaded.

-- Important Notes:
-- 1. Reference data (age_groups, props, content_policy_rules) is already 
--    seeded in migration 20251011000006_seed_reference_data.sql
-- 2. This file is for test users, sample quests, and development-only data
-- 3. User IDs must match actual Supabase Auth user IDs (create users first)

-- =====================================================
-- Development Test Data (Optional)
-- =====================================================

-- Uncomment and customize the following sections as needed for local testing

-- Example: Create a test user profile (after creating user in Supabase Auth)
-- Replace 'your-test-user-uuid-here' with actual UUID from auth.users
/*
insert into profiles (user_id, default_age_group_id, default_duration_minutes, default_location, default_energy_level)
values (
  'your-test-user-uuid-here',
  (select id from age_groups where code = '5_6'),
  30,
  'home',
  'medium'
);
*/

-- Example: Create sample quests for testing
/*
insert into quests (
  user_id,
  title,
  hook,
  step1,
  step2,
  step3,
  age_group_id,
  duration_minutes,
  location,
  energy_level,
  source,
  status,
  is_favorite
) values (
  'your-test-user-uuid-here',
  'Poszukiwanie Skarbów w Domu',
  'Ahoj, młody poszukiwaczu przygód! W twoim domu ukryty jest skarb, ale musisz go najpierw znaleźć!',
  'Znajdź 5 przedmiotów w kolorze niebieskim i ułóż je w linię.',
  'Policz wszystkie okna w swoim domu i zapisz liczbę na kartce.',
  'Znajdź coś miękkiego, coś twardego i coś błyszczącego - to części mapy do skarbu!',
  (select id from age_groups where code = '5_6'),
  30,
  'home',
  'medium',
  'ai',
  'saved',
  false
);
*/

-- Example: Link props to quest
/*
insert into quest_props (quest_id, prop_id)
select 
  (select id from quests where title = 'Poszukiwanie Skarbów w Domu' limit 1),
  id
from props
where code in ('paper_pencil', 'none');
*/

-- Example: Log some test events
/*
insert into events (user_id, event_type, quest_id)
values 
  (
    'your-test-user-uuid-here',
    'auth_login',
    null
  ),
  (
    'your-test-user-uuid-here',
    'quest_generated',
    (select id from quests where title = 'Poszukiwanie Skarbów w Domu' limit 1)
  );
*/

-- =====================================================
-- End of seed file
-- =====================================================
-- Remember: This file is for local development only.
-- Do not commit real user data or sensitive information.

