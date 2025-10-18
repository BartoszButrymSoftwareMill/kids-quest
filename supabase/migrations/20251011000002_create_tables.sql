-- =====================================================
-- Migration: Create Tables
-- Description: Creates all database tables for KidsQuest MVP
-- Tables created: age_groups, props, content_policy_rules, profiles, quests, quest_props, events
-- Dependencies: 20251011000001_create_types_and_enums.sql
-- Author: KidsQuest Team
-- Date: 2025-10-11
-- =====================================================

-- This migration creates the complete table structure for KidsQuest.
-- Tables are created in dependency order to satisfy foreign key constraints.
-- All tables include RLS (Row Level Security) enabled by default.

-- =====================================================
-- Dictionary Tables (no foreign key dependencies)
-- =====================================================

-- age_groups: Dictionary of age ranges for quest targeting
-- Uses PostgreSQL range types for efficient age range queries
-- The EXCLUDE constraint prevents overlapping age ranges
create table age_groups (
  id smallserial primary key,
  
  -- Unique code identifier (e.g., '3_4', '5_6')
  code text unique not null check (code ~ '^\d+_\d+$'),
  
  -- Display label (e.g., '3-4 lata', '5-6 lat')
  label text not null,
  
  -- Age range using PostgreSQL's int4range type
  -- Format: [lower, upper) - includes lower, excludes upper
  -- Example: [3,5) means ages 3 and 4
  span int4range not null check (
    lower(span) >= 0 and 
    upper(span) > lower(span)
  ),
  
  -- Prevent overlapping age ranges using GiST exclusion constraint
  exclude using gist (span with &&)
);

-- Enable RLS for age_groups (public read access will be configured in RLS migration)
alter table age_groups enable row level security;

comment on table age_groups is 'Dictionary of age groups with non-overlapping age ranges';
comment on column age_groups.code is 'Unique code identifier in format: lower_upper (e.g., 3_4)';
comment on column age_groups.span is 'Age range as int4range [lower, upper) - includes lower, excludes upper';

-- props: Dictionary of equipment/props that can be used in quests
-- Simple lookup table for quest requirements
create table props (
  id smallserial primary key,
  
  -- Unique code identifier (e.g., 'blocks', 'drawing', 'none')
  code text unique not null,
  
  -- Display label (e.g., 'Klocki', 'Rysowanie', 'Bez rekwizytów')
  label text not null
);

-- Enable RLS for props (public read access will be configured in RLS migration)
alter table props enable row level security;

comment on table props is 'Dictionary of props/equipment that can be used in quests';
comment on column props.code is 'Unique code identifier (e.g., blocks, drawing, none)';

-- content_policy_rules: Rules for content safety and filtering
-- Used to validate and sanitize user-generated and AI-generated content
create table content_policy_rules (
  id serial primary key,
  
  -- Type of rule: hard_ban (reject), soft_ban (flag), replacement (auto-replace)
  rule_type rule_type not null,
  
  -- Pattern to match (format depends on pattern_type)
  pattern text not null check (char_length(pattern) > 0),
  
  -- How to match: exact, wildcard, or regex
  pattern_type pattern_match_type not null default 'wildcard',
  
  -- Optional replacement text (required for soft_ban and replacement types)
  replacement text check (replacement is null or char_length(replacement) > 0),
  
  -- Human-readable description of the rule
  description text,
  
  -- Whether this rule is currently active
  is_active boolean not null default true,
  
  -- Whether pattern matching is case-sensitive
  case_sensitive boolean not null default false,
  
  -- Audit timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS for content_policy_rules (admin-only write, public read)
alter table content_policy_rules enable row level security;

comment on table content_policy_rules is 'Content safety rules for filtering and validation';
comment on column content_policy_rules.rule_type is 'Action to take: hard_ban (reject), soft_ban (warn), replacement (auto-fix)';
comment on column content_policy_rules.pattern is 'Pattern to match against content';
comment on column content_policy_rules.replacement is 'Safe replacement text (for soft_ban and replacement types)';

-- =====================================================
-- User Tables
-- =====================================================

-- profiles: Extended user profile with default quest preferences
-- 1:1 relationship with auth.users (Supabase Auth)
create table profiles (
  -- Primary key is the user_id from Supabase Auth
  user_id uuid primary key references auth.users(id) on delete cascade,
  
  -- Default preferences for quest generation
  -- These values are used to pre-fill the quest generation form
  default_age_group_id smallint references age_groups(id) on delete set null,
  
  -- Default quest duration in minutes (1-480, i.e., 1 min to 8 hours)
  default_duration_minutes integer check (
    default_duration_minutes is null or 
    (default_duration_minutes > 0 and default_duration_minutes <= 480)
  ),
  
  default_location location_type,
  default_energy_level energy_level,
  
  -- Audit timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS for profiles (users can only access their own profile)
alter table profiles enable row level security;

comment on table profiles is 'Extended user profiles with default quest generation preferences';
comment on column profiles.user_id is 'References Supabase Auth user (cascade delete for GDPR compliance)';
comment on column profiles.default_duration_minutes is 'Default quest duration (1-480 minutes)';

-- =====================================================
-- Quest Tables
-- =====================================================

-- quests: Main table storing all user quests (AI-generated and manual)
-- Contains the complete quest structure with lifecycle tracking
create table quests (
  id uuid primary key default gen_random_uuid(),
  
  -- Quest owner (references Supabase Auth)
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Core quest content
  -- Title is the main quest name shown to the user
  title text not null check (
    char_length(title) between 1 and 200 and 
    title ~ '\S'  -- Must contain at least one non-whitespace character
  ),
  
  -- Hook is the attention-grabbing introduction
  hook text not null check (char_length(hook) between 10 and 300),
  
  -- Three steps guide the user through the quest
  step1 text not null check (char_length(step1) between 10 and 250),
  step2 text not null check (char_length(step2) between 10 and 250),
  step3 text not null check (char_length(step3) between 10 and 250),
  
  -- Optional difficulty variants (generated by AI in post-MVP)
  easier_version text check (
    easier_version is null or 
    char_length(easier_version) between 10 and 500
  ),
  harder_version text check (
    harder_version is null or 
    char_length(harder_version) between 10 and 500
  ),
  
  -- Optional safety notes for parents
  safety_notes text check (
    safety_notes is null or 
    char_length(safety_notes) <= 500
  ),
  
  -- Quest metadata
  age_group_id smallint not null references age_groups(id) on delete restrict,
  
  -- Duration in minutes (1-480, i.e., 1 min to 8 hours)
  duration_minutes integer not null check (
    duration_minutes > 0 and 
    duration_minutes <= 480
  ),
  
  location location_type not null,
  energy_level energy_level not null,
  
  -- Quest origin: ai (generated) or manual (user-created)
  source quest_source not null,
  
  -- Quest lifecycle status
  status quest_status not null default 'saved',
  
  -- User engagement flags
  is_favorite boolean not null default false,
  
  -- Technical metadata
  app_version varchar(20),
  
  -- Audit timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Lifecycle timestamps (null until the action occurs)
  saved_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  favorited_at timestamptz
);

-- Enable RLS for quests (users can only access their own quests)
alter table quests enable row level security;

comment on table quests is 'Main quest table storing all user quests with full lifecycle tracking';
comment on column quests.hook is 'Attention-grabbing introduction to engage the child';
comment on column quests.step1 is 'First step in the quest sequence';
comment on column quests.step2 is 'Second step in the quest sequence';
comment on column quests.step3 is 'Third step in the quest sequence';
comment on column quests.easier_version is 'Simplified version for younger children (optional, post-MVP)';
comment on column quests.harder_version is 'Advanced version for older children (optional, post-MVP)';
comment on column quests.safety_notes is 'Safety reminders for parents (optional)';
comment on column quests.duration_minutes is 'Expected quest duration (1-480 minutes)';
comment on column quests.source is 'Quest origin: ai (generated) or manual (user-created)';
comment on column quests.status is 'Quest lifecycle: saved, started, or completed';

-- quest_props: Many-to-many relationship between quests and props
-- Allows a quest to require multiple props
create table quest_props (
  quest_id uuid not null references quests(id) on delete cascade,
  prop_id smallint not null references props(id) on delete restrict,
  
  -- Composite primary key ensures no duplicate quest-prop pairs
  primary key (quest_id, prop_id)
);

-- Enable RLS for quest_props (access controlled through quests)
alter table quest_props enable row level security;

comment on table quest_props is 'Many-to-many relationship between quests and required props';

-- =====================================================
-- Telemetry Tables
-- =====================================================

-- events: Telemetry tracking for user behavior and analytics
-- Retention: 90 days (cleanup job required)
-- Used for calculating key metrics: Start Rate, Completion Rate, etc.
create table events (
  id uuid primary key default gen_random_uuid(),
  
  -- Event owner (references Supabase Auth)
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Type of event (see event_type enum for full list)
  event_type event_type not null,
  
  -- Optional JSON payload for event-specific data
  -- Examples:
  --   - quest_generated: {prompt: '...', duration_ms: 1234}
  --   - error_generation: {error: 'timeout', attempt: 2}
  --   - favorite_toggled: {is_favorite: true}
  event_data jsonb,
  
  -- Optional reference to related quest
  quest_id uuid references quests(id) on delete set null,
  
  -- Technical metadata
  app_version text,
  
  -- Event timestamp
  created_at timestamptz not null default now()
);

-- Enable RLS for events (users can only access their own events)
alter table events enable row level security;

comment on table events is 'Telemetry events for analytics (90-day retention)';
comment on column events.event_type is 'Type of event (see event_type enum)';
comment on column events.event_data is 'Optional JSON payload with event-specific data';
comment on column events.quest_id is 'Optional reference to related quest (null if not quest-related)';

-- =====================================================
-- End of migration
-- =====================================================
-- All tables created successfully.
-- Next migration: 20251011000003_create_indexes.sql

