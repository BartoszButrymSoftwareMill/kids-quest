-- =====================================================
-- Migration: Create Collections Table with RLS
-- Description: Creates collections table for organizing quests and implements RLS policies
-- Tables created: collections, collection_quests
-- Dependencies: 20251011000002_create_tables.sql
-- Author: KidsQuest Team
-- Date: 2025-10-18
-- =====================================================

-- This migration creates the collections feature which allows users to:
-- 1. Create named collections to organize their quests
-- 2. Add multiple quests to a collection (many-to-many relationship)
-- 3. Share collections with other users (future feature)
-- 
-- Security: Full RLS implementation ensures users can only manage their own collections

-- =====================================================
-- Create collections table
-- =====================================================

-- collections: User-created collections for organizing quests
-- Allows users to group quests by theme, difficulty, or any custom criteria
create table collections (
  id uuid primary key default gen_random_uuid(),
  
  -- Collection owner (references Supabase Auth)
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Collection name (required, user-facing)
  name text not null check (
    char_length(name) between 1 and 100 and 
    name ~ '\S'  -- Must contain at least one non-whitespace character
  ),
  
  -- Optional description
  description text check (
    description is null or 
    (char_length(description) between 1 and 500 and description ~ '\S')
  ),
  
  -- Optional color/icon for UI customization (hex color or icon identifier)
  color varchar(20),
  
  -- Visibility flag (for future sharing feature)
  -- Default: false (private collections)
  is_public boolean not null default false,
  
  -- Display order for user's collection list
  -- Lower numbers appear first, allows manual sorting
  sort_order integer not null default 0,
  
  -- Audit timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index for efficient user-specific queries
create index idx_collections_user_id on collections(user_id);

-- Create index for sorting collections
create index idx_collections_user_sort on collections(user_id, sort_order);

-- Enable RLS for collections
alter table collections enable row level security;

comment on table collections is 'User-created collections for organizing quests into custom groups';
comment on column collections.user_id is 'Collection owner (cascade delete for GDPR compliance)';
comment on column collections.name is 'Collection name (1-100 characters, required)';
comment on column collections.description is 'Optional description (1-500 characters)';
comment on column collections.is_public is 'Visibility flag for future sharing feature (default: false)';
comment on column collections.sort_order is 'Display order in users collection list (lower = higher priority)';

-- =====================================================
-- Create collection_quests junction table
-- =====================================================

-- collection_quests: Many-to-many relationship between collections and quests
-- Allows a quest to belong to multiple collections
create table collection_quests (
  collection_id uuid not null references collections(id) on delete cascade,
  quest_id uuid not null references quests(id) on delete cascade,
  
  -- Timestamp when quest was added to collection
  added_at timestamptz not null default now(),
  
  -- Optional sort order within collection
  sort_order integer not null default 0,
  
  -- Composite primary key ensures no duplicate collection-quest pairs
  primary key (collection_id, quest_id)
);

-- Create indexes for efficient lookups
create index idx_collection_quests_collection on collection_quests(collection_id);
create index idx_collection_quests_quest on collection_quests(quest_id);
create index idx_collection_quests_sort on collection_quests(collection_id, sort_order);

-- Enable RLS for collection_quests
alter table collection_quests enable row level security;

comment on table collection_quests is 'Many-to-many relationship between collections and quests';
comment on column collection_quests.added_at is 'Timestamp when quest was added to collection';
comment on column collection_quests.sort_order is 'Display order within collection (lower = higher priority)';

-- =====================================================
-- RLS Policies for collections table
-- =====================================================

-- Policy: Authenticated users can view their own collections
-- Rationale: Users need to see their collection library
create policy "Users can view own collections"
  on collections
  for select
  to authenticated
  using (user_id = auth.uid());

-- Policy: Authenticated users can insert their own collections
-- Rationale: Users can create new collections to organize quests
create policy "Users can insert own collections"
  on collections
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Policy: Authenticated users can update their own collections
-- Rationale: Users can modify collection name, description, color, sort order
create policy "Users can update own collections"
  on collections
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: Authenticated users can delete their own collections
-- Rationale: Users can remove unwanted collections (cascade deletes collection_quests)
create policy "Users can delete own collections"
  on collections
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on policy "Users can view own collections" on collections is 
  'Authenticated users can read their own collections';
comment on policy "Users can insert own collections" on collections is 
  'Authenticated users can create new collections';
comment on policy "Users can update own collections" on collections is 
  'Authenticated users can modify their own collections (name, description, color, sort order)';
comment on policy "Users can delete own collections" on collections is 
  'Authenticated users can delete their own collections (cascade deletes entries)';

-- =====================================================
-- RLS Policies for collection_quests table
-- =====================================================

-- Policy: Authenticated users can view collection_quests for their own collections
-- Rationale: Users need to see which quests are in their collections
-- Note: Validates ownership through collections table
create policy "Users can view own collection quests"
  on collection_quests
  for select
  to authenticated
  using (
    collection_id in (
      select id from collections where user_id = auth.uid()
    )
  );

-- Policy: Authenticated users can add quests to their own collections
-- Rationale: Users can add their quests to their collections
-- Note: Validates both collection and quest ownership
create policy "Users can insert own collection quests"
  on collection_quests
  for insert
  to authenticated
  with check (
    collection_id in (
      select id from collections where user_id = auth.uid()
    )
    and quest_id in (
      select id from quests where user_id = auth.uid()
    )
  );

-- Policy: Authenticated users can update collection_quests for their own collections
-- Rationale: Users can reorder quests within their collections
-- Note: Validates collection ownership (quest ownership validated on insert)
create policy "Users can update own collection quests"
  on collection_quests
  for update
  to authenticated
  using (
    collection_id in (
      select id from collections where user_id = auth.uid()
    )
  )
  with check (
    collection_id in (
      select id from collections where user_id = auth.uid()
    )
  );

-- Policy: Authenticated users can delete collection_quests from their own collections
-- Rationale: Users can remove quests from their collections
-- Note: Validates collection ownership
create policy "Users can delete own collection quests"
  on collection_quests
  for delete
  to authenticated
  using (
    collection_id in (
      select id from collections where user_id = auth.uid()
    )
  );

comment on policy "Users can view own collection quests" on collection_quests is 
  'Authenticated users can read quests in their own collections';
comment on policy "Users can insert own collection quests" on collection_quests is 
  'Authenticated users can add their quests to their collections';
comment on policy "Users can update own collection quests" on collection_quests is 
  'Authenticated users can reorder quests within their collections';
comment on policy "Users can delete own collection quests" on collection_quests is 
  'Authenticated users can remove quests from their collections';

-- =====================================================
-- Create trigger for updating updated_at timestamp
-- =====================================================

-- Trigger: Update collections.updated_at on modification
-- Rationale: Automatically track when collections are modified
create trigger update_collections_updated_at
  before update on collections
  for each row
  execute function update_updated_at_column();

comment on trigger update_collections_updated_at on collections is 
  'Automatically updates updated_at timestamp on collection modifications';

-- =====================================================
-- End of migration
-- =====================================================
-- Collections feature created successfully with full RLS protection.
-- Tables created: collections, collection_quests
-- RLS policies: 
--   - collections: 4 policies (select, insert, update, delete)
--   - collection_quests: 4 policies (select, insert, update, delete)
-- All policies enforce user ownership at database level (zero-trust architecture)
--

