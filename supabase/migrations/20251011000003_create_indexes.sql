-- =====================================================
-- Migration: Create Indexes
-- Description: Creates performance indexes for efficient querying
-- Tables affected: quests, quest_props, events, content_policy_rules
-- Dependencies: 20251011000002_create_tables.sql
-- Author: KidsQuest Team
-- Date: 2025-10-11
-- =====================================================

-- This migration creates indexes to optimize common query patterns.
-- Indexes are designed based on expected query patterns:
-- - User viewing their quest list (filtered, sorted)
-- - User viewing favorites
-- - Analytics queries on events
-- - Content policy rule lookups

-- =====================================================
-- Indexes for quests table
-- =====================================================

-- Primary query: Get user's quests sorted by creation date (newest first)
-- Usage: SELECT * FROM quests WHERE user_id = $1 ORDER BY created_at DESC
create index quests_user_created_idx 
  on quests (user_id, created_at desc);

comment on index quests_user_created_idx is 'Optimizes listing user quests by creation date (most recent first)';

-- Filtered query: Get user's favorite quests
-- Usage: SELECT * FROM quests WHERE user_id = $1 AND is_favorite = true ORDER BY favorited_at DESC
-- Partial index: Only indexes rows where is_favorite = true (more efficient)
create index quests_user_favorite_idx 
  on quests (user_id, is_favorite, favorited_at desc) 
  where is_favorite = true;

comment on index quests_user_favorite_idx is 'Optimizes listing favorite quests (partial index for favorites only)';

-- Filter query: Get quests by age group
-- Usage: SELECT * FROM quests WHERE user_id = $1 AND age_group_id = $2
create index quests_user_age_idx 
  on quests (user_id, age_group_id);

comment on index quests_user_age_idx is 'Optimizes filtering quests by age group';

-- Filter query: Get quests by location
-- Usage: SELECT * FROM quests WHERE user_id = $1 AND location = $2
create index quests_user_location_idx 
  on quests (user_id, location);

comment on index quests_user_location_idx is 'Optimizes filtering quests by location (home/outdoor)';

-- Filter query: Get quests by source (AI vs manual)
-- Usage: SELECT * FROM quests WHERE user_id = $1 AND source = $2
create index quests_user_source_idx 
  on quests (user_id, source);

comment on index quests_user_source_idx is 'Optimizes filtering quests by source (ai/manual)';

-- Analytics query: Count quests by status
-- Usage: SELECT status, COUNT(*) FROM quests GROUP BY status
create index quests_status_idx 
  on quests (status);

comment on index quests_status_idx is 'Optimizes analytics queries grouping by quest status';

-- =====================================================
-- Indexes for quest_props table
-- =====================================================

-- Reverse lookup: Find quests that use a specific prop
-- Usage: SELECT quest_id FROM quest_props WHERE prop_id = $1
-- Note: quest_id already has an index via the primary key (quest_id, prop_id)
create index quest_props_prop_id_idx 
  on quest_props (prop_id);

comment on index quest_props_prop_id_idx is 'Optimizes finding quests by required prop';

-- =====================================================
-- Indexes for events table
-- =====================================================

-- Primary query: Get user's event timeline
-- Usage: SELECT * FROM events WHERE user_id = $1 ORDER BY created_at DESC
create index events_user_created_idx 
  on events (user_id, created_at desc);

comment on index events_user_created_idx is 'Optimizes retrieving user event timeline';

-- Analytics query: Analyze events by type over time
-- Usage: SELECT * FROM events WHERE event_type = $1 ORDER BY created_at DESC
create index events_type_created_idx 
  on events (event_type, created_at desc);

comment on index events_type_created_idx is 'Optimizes analytics queries filtering by event type';

-- Quest-related events lookup
-- Usage: SELECT * FROM events WHERE quest_id = $1
-- Partial index: Only indexes rows where quest_id IS NOT NULL
create index events_quest_idx 
  on events (quest_id) 
  where quest_id is not null;

comment on index events_quest_idx is 'Optimizes finding events related to a specific quest';

-- =====================================================
-- Indexes for content_policy_rules table
-- =====================================================

-- Primary query: Get active rules for content validation
-- Usage: SELECT * FROM content_policy_rules WHERE is_active = true ORDER BY rule_type
-- Partial index: Only indexes active rules (most common query)
create index content_policy_rules_active_idx 
  on content_policy_rules (is_active, rule_type) 
  where is_active = true;

comment on index content_policy_rules_active_idx is 'Optimizes loading active content policy rules';

-- =====================================================
-- End of migration
-- =====================================================
-- All indexes created successfully.
-- Next migration: 20251011000004_create_functions_and_triggers.sql

