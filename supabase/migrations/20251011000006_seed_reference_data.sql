-- =====================================================
-- Migration: Seed Reference Data
-- Description: Populates dictionary tables with initial data
-- Tables populated: age_groups, props, content_policy_rules
-- Dependencies: 20251011000002_create_tables.sql
-- Author: KidsQuest Team
-- Date: 2025-10-11
-- =====================================================

-- This migration seeds the dictionary tables with reference data.
-- This data is essential for the application to function properly.

-- =====================================================
-- Seed age_groups table
-- =====================================================

-- Insert age group ranges for children aged 3-10
-- Format: (code, label, span)
-- span uses PostgreSQL's int4range type: [lower, upper) includes lower, excludes upper
insert into age_groups (code, label, span) values
  ('3_4',  '3–4 lata',  int4range(3, 5, '[)')),   -- Ages 3 and 4
  ('5_6',  '5–6 lat',   int4range(5, 7, '[)')),   -- Ages 5 and 6
  ('7_8',  '7–8 lat',   int4range(7, 9, '[)')),   -- Ages 7 and 8
  ('9_10', '9–10 lat',  int4range(9, 11, '[)'));  -- Ages 9 and 10

comment on table age_groups is 
  'Age groups with non-overlapping ranges (EXCLUDE constraint enforces this)';

-- =====================================================
-- Seed props table
-- =====================================================

-- Insert all available props/equipment for quests
-- Ordered alphabetically by code for maintainability
insert into props (code, label) values
  ('balls',              'Piłki'),
  ('blocks',             'Klocki'),
  ('books',              'Książki'),
  ('building_sets',      'Zestawy konstrukcyjne'),
  ('coloring',           'Kolorowanki'),
  ('costumes',           'Kostiumy/przebrania'),
  ('crafts',             'Materiały plastyczne'),
  ('dolls_figures',      'Lalki/figurki'),
  ('drawing',            'Rysowanie'),
  ('music_instruments',  'Instrumenty muzyczne'),
  ('none',               'Bez rekwizytów'),
  ('paper_pencil',       'Kartka i ołówek'),
  ('playdough',          'Plastelina'),
  ('plush_toys',         'Pluszaki'),
  ('puppets',            'Pacynki'),
  ('puzzles',            'Zagadki'),
  ('sand_water',         'Piasek/woda'),
  ('storytelling',       'Opowiadanie historii'),
  ('toy_cars',           'Samochodziki');

comment on table props is 
  'Equipment/props that can be required for quests';

-- =====================================================
-- Seed content_policy_rules table
-- =====================================================

-- Insert content safety rules to protect children
-- Rule types:
--   - hard_ban: Content containing these patterns is completely rejected
--   - soft_ban: Content is flagged and replaced with a safer alternative
--   - replacement: Content is automatically transformed to be more appropriate

-- HARD BAN rules: Dangerous or inappropriate content
-- These patterns trigger complete rejection of the content
insert into content_policy_rules (rule_type, pattern, pattern_type, replacement, description, is_active, case_sensitive) values
  ('hard_ban', 'pistolet',   'wildcard', null, 'Zakaz broni palnej',           true, false),
  ('hard_ban', 'karabin',    'wildcard', null, 'Zakaz broni palnej',           true, false),
  ('hard_ban', 'broń',       'wildcard', null, 'Zakaz broni',                  true, false),
  ('hard_ban', 'nóż',        'wildcard', null, 'Zakaz ostrych przedmiotów',    true, false),
  ('hard_ban', 'miecz',      'wildcard', null, 'Zakaz broni białej',           true, false),
  ('hard_ban', 'przemoc',    'wildcard', null, 'Zakaz przemocy',               true, false),
  ('hard_ban', 'alkohol',    'wildcard', null, 'Zakaz substancji',             true, false),
  ('hard_ban', 'papieros',   'wildcard', null, 'Zakaz substancji',             true, false),
  ('hard_ban', 'hazard',     'wildcard', null, 'Zakaz hazardu',                true, false),
  ('hard_ban', 'kradzież',   'wildcard', null, 'Zakaz nieetycznych zachowań',  true, false);

-- SOFT BAN rules: Content that should be replaced with safer alternatives
-- These patterns are automatically transformed to more child-friendly versions
insert into content_policy_rules (rule_type, pattern, pattern_type, replacement, description, is_active, case_sensitive) values
  ('soft_ban', 'złodziej',   'wildcard', 'psotnik',           'Zamiana na łagodniejsze określenie', true, false),
  ('soft_ban', 'złoczyńca',  'wildcard', 'psotnik',           'Zamiana na łagodniejsze określenie', true, false),
  ('soft_ban', 'potwór',     'wildcard', 'sympatyczny potwór', 'Zamiana na przyjazną wersję',        true, false);

-- REPLACEMENT rules: Transform potentially problematic themes
-- These patterns are replaced with more constructive alternatives
insert into content_policy_rules (rule_type, pattern, pattern_type, replacement, description, is_active, case_sensitive) values
  ('replacement', 'walka',   'wildcard', 'pokonaj sprytem',    'Zamiana konfliktu na strategię',    true, false),
  ('replacement', 'wyścig',  'wildcard', 'podróż',             'Zamiana rywalizacji na przygodę',   true, false),
  ('replacement', 'zawody',  'wildcard', 'wspólna zabawa',     'Zamiana konkurencji na współpracę', true, false);

comment on table content_policy_rules is 
  'Content safety rules: hard_ban (reject), soft_ban (warn+replace), replacement (auto-fix)';

-- =====================================================
-- End of migration
-- =====================================================
-- All reference data seeded successfully.
-- The database is now ready for use.

