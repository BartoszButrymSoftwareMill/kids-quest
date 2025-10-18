-- =====================================================
-- Migration: Add preset_used to event_type enum
-- Description: Adds 'preset_used' event type for tracking preset selection in generator
-- Tables affected: events (indirectly through event_type enum)
-- Author: KidsQuest Team
-- Date: 2025-10-12
-- =====================================================

-- Add 'preset_used' to event_type enum
-- This tracks when users select a preset in the quest generator
alter type event_type add value 'preset_used';

-- =====================================================
-- End of migration
-- =====================================================

