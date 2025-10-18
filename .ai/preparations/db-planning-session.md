# FINALNE PODSUMOWANIE SCHEMATU BAZY DANYCH - KidsQuest MVP

## Przegląd architektury

Baza danych PostgreSQL dla aplikacji KidsQuest składa się z następujących głównych obszarów:

- **Użytkownicy i profile** - wykorzystanie Supabase Auth + rozszerzona tabela profiles
- **Questy** - główna funkcjonalność aplikacji
- **Telemetria** - śledzenie eventów użytkownika
- **Słowniki** - grupy wiekowe, rekwizyty, reguły bezpieczeństwa treści
- **RLS** - zabezpieczenia na poziomie wierszy

---

## Struktura plików migracji

```
/supabase
  /migrations
    20241011000001_create_types_and_enums.sql
    20241011000002_create_tables.sql
    20241011000003_create_indexes.sql
    20241011000004_create_functions_and_triggers.sql
    20241011000005_enable_rls.sql
    20241011000006_seed_reference_data.sql
  /seed.sql (opcjonalne dane deweloperskie)
```

---

## Diagram ERD (relacje między tabelami)

```
auth.users (Supabase Auth)
    |
    | 1:1
    |
profiles (rozszerzone dane użytkownika)
    |
    | 1:N
    |
quests (główna tabela questów)
    |
    +--- N:1 ---> age_groups (słownik grup wiekowych)
    |
    +--- N:M ---> props (słownik rekwizytów, przez quest_props)
    |
    +--- 1:N ---> events (telemetria)

content_policy_rules (reguły bezpieczeństwa treści - standalone)
```

---

## 1. Plik: 20241011000001_create_types_and_enums.sql

```sql
-- =============================================================================
-- KidsQuest MVP - Database Schema
-- Migration: Create Types and Enums
-- =============================================================================

-- Quest status type
CREATE TYPE quest_status AS ENUM ('saved', 'started', 'completed');

-- Quest source type
CREATE TYPE quest_source AS ENUM ('ai', 'manual');

-- Location type
CREATE TYPE location_type AS ENUM ('home', 'outdoor');

-- Energy level type
CREATE TYPE energy_level AS ENUM ('low', 'medium', 'high');

-- Content policy rule type
CREATE TYPE rule_type AS ENUM ('hard_ban', 'soft_ban', 'replacement');

-- Event type for telemetry
CREATE TYPE event_type AS ENUM (
  'quest_generated',
  'quest_started',
  'quest_saved',
  'quest_completed',
  'quest_created_manual',
  'auth_signup',
  'auth_login',
  'favorite_toggled',
  'delete_quest',
  'error_generation'
);

-- Pattern matching type for content policy
CREATE TYPE pattern_match_type AS ENUM ('exact', 'wildcard', 'regex');

-- =============================================================================
-- Rollback
-- =============================================================================
-- DROP TYPE IF EXISTS pattern_match_type CASCADE;
-- DROP TYPE IF EXISTS event_type CASCADE;
-- DROP TYPE IF EXISTS rule_type CASCADE;
-- DROP TYPE IF EXISTS energy_level CASCADE;
-- DROP TYPE IF EXISTS location_type CASCADE;
-- DROP TYPE IF EXISTS quest_source CASCADE;
-- DROP TYPE IF EXISTS quest_status CASCADE;
```

---

## 2. Plik: 20241011000002_create_tables.sql

```sql
-- =============================================================================
-- KidsQuest MVP - Database Schema
-- Migration: Create Tables
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =============================================================================
-- DICTIONARY TABLES
-- =============================================================================

-- Age groups dictionary with ranges
CREATE TABLE age_groups (
  id    smallserial PRIMARY KEY,
  code  text UNIQUE NOT NULL CHECK (code ~ '^\d+_\d+$'),
  label text NOT NULL,
  span  int4range NOT NULL,
  CHECK (lower(span) >= 0 AND upper(span) > lower(span) AND lower_inc(span) AND NOT upper_inc(span))
);

-- Prevent overlapping age ranges
ALTER TABLE age_groups
  ADD CONSTRAINT age_groups_no_overlap
  EXCLUDE USING gist (span WITH &&);

COMMENT ON TABLE age_groups IS 'Dictionary of age groups with ranges';
COMMENT ON COLUMN age_groups.code IS 'Unique code, e.g. 3_4';
COMMENT ON COLUMN age_groups.label IS 'Display label, e.g. 3-4 lata';
COMMENT ON COLUMN age_groups.span IS 'Age range as int4range, e.g. [3,5)';

-- Props (rekwizyty) dictionary
CREATE TABLE props (
  id    smallserial PRIMARY KEY,
  code  text UNIQUE NOT NULL,
  label text NOT NULL
);

COMMENT ON TABLE props IS 'Dictionary of props/equipment for quests';
COMMENT ON COLUMN props.code IS 'Unique code, e.g. blocks, drawing';
COMMENT ON COLUMN props.label IS 'Display label, e.g. Klocki, Rysowanie';

-- Content policy rules
CREATE TABLE content_policy_rules (
  id              serial PRIMARY KEY,
  rule_type       rule_type NOT NULL,
  pattern         text NOT NULL CHECK (char_length(pattern) > 0),
  pattern_type    pattern_match_type NOT NULL DEFAULT 'wildcard',
  replacement     text CHECK (replacement IS NULL OR char_length(replacement) > 0),
  description     text,
  is_active       boolean NOT NULL DEFAULT true,
  case_sensitive  boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE content_policy_rules IS 'Rules for content safety filtering';
COMMENT ON COLUMN content_policy_rules.pattern IS 'Pattern to match (exact word, wildcard, or regex)';
COMMENT ON COLUMN content_policy_rules.pattern_type IS 'Type of pattern matching';
COMMENT ON COLUMN content_policy_rules.replacement IS 'Safe replacement text (for soft_ban and replacement types)';

-- =============================================================================
-- USER PROFILE TABLE
-- =============================================================================

CREATE TABLE profiles (
  user_id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Default preferences for quest generation form
  default_age_group_id     smallint REFERENCES age_groups(id) ON DELETE SET NULL,
  default_duration_minutes integer CHECK (default_duration_minutes IS NULL OR (default_duration_minutes > 0 AND default_duration_minutes <= 480)),
  default_location         location_type,
  default_energy_level     energy_level,

  -- Timestamps
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Extended user profile with default preferences';

-- =============================================================================
-- QUESTS TABLE
-- =============================================================================

CREATE TABLE quests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  title           text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200 AND title ~ '\S'),
  hook            text NOT NULL CHECK (char_length(hook) BETWEEN 10 AND 300),
  step1           text NOT NULL CHECK (char_length(step1) BETWEEN 10 AND 250),
  step2           text NOT NULL CHECK (char_length(step2) BETWEEN 10 AND 250),
  step3           text NOT NULL CHECK (char_length(step3) BETWEEN 10 AND 250),
  easier_version  text CHECK (easier_version IS NULL OR char_length(easier_version) BETWEEN 10 AND 500),
  harder_version  text CHECK (harder_version IS NULL OR char_length(harder_version) BETWEEN 10 AND 500),
  safety_notes    text CHECK (safety_notes IS NULL OR char_length(safety_notes) <= 500),

  -- Parameters
  age_group_id    smallint NOT NULL REFERENCES age_groups(id) ON DELETE RESTRICT,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  location        location_type NOT NULL,
  energy_level    energy_level NOT NULL,

  -- Metadata
  source          quest_source NOT NULL,
  status          quest_status NOT NULL DEFAULT 'saved',
  is_favorite     boolean NOT NULL DEFAULT false,
  app_version     varchar(20),

  -- Timestamps
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  saved_at        timestamptz,
  started_at      timestamptz,
  completed_at    timestamptz,
  favorited_at    timestamptz
);

COMMENT ON TABLE quests IS 'Main quests table';
COMMENT ON COLUMN quests.title IS 'Quest title (auto-generated or user-provided, editable)';
COMMENT ON COLUMN quests.easier_version IS 'Easier variant (nullable, one variant generated by AI)';
COMMENT ON COLUMN quests.harder_version IS 'Harder variant (nullable, one variant generated by AI)';

-- =============================================================================
-- QUEST-PROPS JUNCTION TABLE (Many-to-Many)
-- =============================================================================

CREATE TABLE quest_props (
  quest_id uuid NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  prop_id  smallint NOT NULL REFERENCES props(id) ON DELETE RESTRICT,
  PRIMARY KEY (quest_id, prop_id)
);

COMMENT ON TABLE quest_props IS 'Junction table for quest-props many-to-many relationship';

-- =============================================================================
-- TELEMETRY/EVENTS TABLE
-- =============================================================================

CREATE TABLE events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type    event_type NOT NULL,
  event_data    jsonb,
  quest_id      uuid REFERENCES quests(id) ON DELETE SET NULL,
  app_version   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE events IS 'Telemetry events (90-day retention)';
COMMENT ON COLUMN events.event_data IS 'Event-specific parameters as JSONB';
COMMENT ON COLUMN events.quest_id IS 'Related quest ID (nullable for non-quest events)';

-- =============================================================================
-- Rollback
-- =============================================================================
-- DROP TABLE IF EXISTS events CASCADE;
-- DROP TABLE IF EXISTS quest_props CASCADE;
-- DROP TABLE IF EXISTS quests CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP TABLE IF EXISTS content_policy_rules CASCADE;
-- DROP TABLE IF EXISTS props CASCADE;
-- DROP TABLE IF EXISTS age_groups CASCADE;
-- DROP EXTENSION IF EXISTS btree_gist;
```

---

## 3. Plik: 20241011000003_create_indexes.sql

```sql
-- =============================================================================
-- KidsQuest MVP - Database Schema
-- Migration: Create Indexes
-- =============================================================================

-- =============================================================================
-- QUESTS INDEXES
-- =============================================================================

-- User's recent quests (main list view)
CREATE INDEX quests_user_created_idx ON quests(user_id, created_at DESC);

-- User's favorite quests (filtered list view)
CREATE INDEX quests_user_favorite_idx ON quests(user_id, is_favorite, favorited_at DESC)
  WHERE is_favorite = true;

-- Filtering by age group
CREATE INDEX quests_user_age_idx ON quests(user_id, age_group_id);

-- Filtering by location
CREATE INDEX quests_user_location_idx ON quests(user_id, location);

-- Filtering by source (AI/manual)
CREATE INDEX quests_user_source_idx ON quests(user_id, source);

-- Status filtering
CREATE INDEX quests_status_idx ON quests(status);

-- =============================================================================
-- QUEST_PROPS INDEXES
-- =============================================================================

-- Filtering quests by props
CREATE INDEX quest_props_prop_id_idx ON quest_props(prop_id);

-- =============================================================================
-- EVENTS INDEXES
-- =============================================================================

-- User's events timeline
CREATE INDEX events_user_created_idx ON events(user_id, created_at DESC);

-- Event type analytics
CREATE INDEX events_type_created_idx ON events(event_type, created_at DESC);

-- Events related to specific quest
CREATE INDEX events_quest_idx ON events(quest_id) WHERE quest_id IS NOT NULL;

-- =============================================================================
-- CONTENT_POLICY_RULES INDEXES
-- =============================================================================

-- Active rules filtering
CREATE INDEX content_policy_rules_active_idx ON content_policy_rules(is_active, rule_type)
  WHERE is_active = true;

-- =============================================================================
-- Rollback
-- =============================================================================
-- DROP INDEX IF EXISTS content_policy_rules_active_idx;
-- DROP INDEX IF EXISTS events_quest_idx;
-- DROP INDEX IF EXISTS events_type_created_idx;
-- DROP INDEX IF EXISTS events_user_created_idx;
-- DROP INDEX IF EXISTS quest_props_prop_id_idx;
-- DROP INDEX IF EXISTS quests_status_idx;
-- DROP INDEX IF EXISTS quests_user_source_idx;
-- DROP INDEX IF EXISTS quests_user_location_idx;
-- DROP INDEX IF EXISTS quests_user_age_idx;
-- DROP INDEX IF EXISTS quests_user_favorite_idx;
-- DROP INDEX IF EXISTS quests_user_created_idx;
```

---

## 4. Plik: 20241011000004_create_functions_and_triggers.sql

```sql
-- =============================================================================
-- KidsQuest MVP - Database Schema
-- Migration: Create Functions and Triggers
-- =============================================================================

-- =============================================================================
-- FUNCTION: Update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS 'Automatically updates updated_at column on row update';

-- =============================================================================
-- TRIGGERS: Auto-update updated_at
-- =============================================================================

CREATE TRIGGER update_quests_updated_at
  BEFORE UPDATE ON quests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_policy_rules_updated_at
  BEFORE UPDATE ON content_policy_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Rollback
-- =============================================================================
-- DROP TRIGGER IF EXISTS update_content_policy_rules_updated_at ON content_policy_rules;
-- DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
-- DROP TRIGGER IF EXISTS update_quests_updated_at ON quests;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
```

---

## 5. Plik: 20241011000005_enable_rls.sql

```sql
-- =============================================================================
-- KidsQuest MVP - Database Schema
-- Migration: Enable Row Level Security (RLS)
-- =============================================================================

-- =============================================================================
-- PROFILES RLS
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON POLICY "Users can view own profile" ON profiles IS 'Users can only view their own profile';
COMMENT ON POLICY "Users can insert own profile" ON profiles IS 'Users can only create their own profile';
COMMENT ON POLICY "Users can update own profile" ON profiles IS 'Users can only update their own profile';

-- =============================================================================
-- QUESTS RLS
-- =============================================================================

ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quests"
  ON quests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own quests"
  ON quests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own quests"
  ON quests FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own quests"
  ON quests FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON POLICY "Users can view own quests" ON quests IS 'Users can only view their own quests';
COMMENT ON POLICY "Users can insert own quests" ON quests IS 'Users can only create their own quests';
COMMENT ON POLICY "Users can update own quests" ON quests IS 'Users can only update their own quests';
COMMENT ON POLICY "Users can delete own quests" ON quests IS 'Users can only delete their own quests';

-- =============================================================================
-- QUEST_PROPS RLS
-- =============================================================================

ALTER TABLE quest_props ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quest props"
  ON quest_props FOR SELECT
  USING (quest_id IN (SELECT id FROM quests WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own quest props"
  ON quest_props FOR ALL
  USING (quest_id IN (SELECT id FROM quests WHERE user_id = auth.uid()))
  WITH CHECK (quest_id IN (SELECT id FROM quests WHERE user_id = auth.uid()));

COMMENT ON POLICY "Users can view own quest props" ON quest_props IS 'Users can view props for their own quests';
COMMENT ON POLICY "Users can manage own quest props" ON quest_props IS 'Users can manage props for their own quests';

-- =============================================================================
-- EVENTS RLS
-- =============================================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  WITH CHECK (user_id = auth.uid());

COMMENT ON POLICY "Users can view own events" ON events IS 'Users can only view their own events';
COMMENT ON POLICY "Users can insert own events" ON events IS 'Users can only create their own events';

-- =============================================================================
-- DICTIONARY TABLES - NO RLS (read-only access handled at application level)
-- =============================================================================
-- age_groups, props, content_policy_rules are managed through Supabase Dashboard
-- and accessed read-only by the application

-- =============================================================================
-- Rollback
-- =============================================================================
-- DROP POLICY IF EXISTS "Users can insert own events" ON events;
-- DROP POLICY IF EXISTS "Users can view own events" ON events;
-- ALTER TABLE events DISABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS "Users can manage own quest props" ON quest_props;
-- DROP POLICY IF EXISTS "Users can view own quest props" ON quest_props;
-- ALTER TABLE quest_props DISABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS "Users can delete own quests" ON quests;
-- DROP POLICY IF EXISTS "Users can update own quests" ON quests;
-- DROP POLICY IF EXISTS "Users can insert own quests" ON quests;
-- DROP POLICY IF EXISTS "Users can view own quests" ON quests;
-- ALTER TABLE quests DISABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
-- DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
-- DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

---

## 6. Plik: 20241011000006_seed_reference_data.sql

```sql
-- =============================================================================
-- KidsQuest MVP - Database Schema
-- Migration: Seed Reference Data
-- =============================================================================

-- =============================================================================
-- AGE GROUPS
-- =============================================================================

INSERT INTO age_groups (code, label, span) VALUES
('3_4',  '3–4 lata',  int4range(3,5,'[)')),
('5_6',  '5–6 lat',   int4range(5,7,'[)')),
('7_8',  '7–8 lat',   int4range(7,9,'[)')),
('9_10', '9–10 lat',  int4range(9,11,'[)'));

-- =============================================================================
-- PROPS (REKWIZYTY)
-- =============================================================================
-- Sorted alphabetically for UX consistency

INSERT INTO props (code, label) VALUES
-- Original props from PRD
('blocks', 'Klocki'),
('drawing', 'Rysowanie'),
('none', 'Bez rekwizytów'),
('paper_pencil', 'Kartka i ołówek'),
('puzzles', 'Zagadki'),
('storytelling', 'Opowiadanie historii'),
('toy_cars', 'Samochodziki'),

-- Additional popular props for children 3-10 years old
('balls', 'Piłki'),
('books', 'Książki'),
('building_sets', 'Zestawy konstrukcyjne'),
('coloring', 'Kolorowanki'),
('costumes', 'Kostiumy/przebrania'),
('crafts', 'Materiały plastyczne'),
('dolls_figures', 'Lalki/figurki'),
('music_instruments', 'Instrumenty muzyczne'),
('playdough', 'Plastelina'),
('plush_toys', 'Pluszaki'),
('puppets', 'Pacynki'),
('sand_water', 'Piasek/woda');

-- =============================================================================
-- CONTENT POLICY RULES
-- =============================================================================

INSERT INTO content_policy_rules (rule_type, pattern, pattern_type, replacement, description, is_active, case_sensitive) VALUES
-- HARD BAN - Violence and weapons
('hard_ban', '%pistolet%', 'wildcard', NULL, 'Broń palna - zabroniona', true, false),
('hard_ban', '%karabin%', 'wildcard', NULL, 'Broń palna - zabroniona', true, false),
('hard_ban', '%strzelba%', 'wildcard', NULL, 'Broń palna - zabroniona', true, false),
('hard_ban', '%nóż%', 'wildcard', NULL, 'Broń biała - zabroniona', true, false),
('hard_ban', '%miecz%', 'wildcard', NULL, 'Broń biała - zabroniona (w kontekście realnej broni)', true, false),
('hard_ban', '%przemoc%', 'wildcard', NULL, 'Przemoc fizyczna - zabroniona', true, false),
('hard_ban', '%bij%', 'wildcard', NULL, 'Przemoc fizyczna - zabroniona', true, false),
('hard_ban', '%uderz%', 'wildcard', NULL, 'Przemoc fizyczna - zabroniona', true, false),

-- HARD BAN - Sensitive content
('hard_ban', '%alkohol%', 'wildcard', NULL, 'Używki - zabronione', true, false),
('hard_ban', '%papieros%', 'wildcard', NULL, 'Używki - zabronione', true, false),
('hard_ban', '%hazard%', 'wildcard', NULL, 'Hazard - zabroniony', true, false),
('hard_ban', '%kradnij%', 'wildcard', NULL, 'Kradzież - zabroniona', true, false),
('hard_ban', '%kradzież%', 'wildcard', NULL, 'Kradzież - zabroniona', true, false),
('hard_ban', '%wulgaryzm%', 'wildcard', NULL, 'Wulgarne treści - zabronione', true, false),

-- SOFT BAN - Antagonists
('soft_ban', '%złodziej%', 'wildcard', 'psotnik', 'Antagonista jako psotnik', true, false),
('soft_ban', '%złoczyńca%', 'wildcard', 'psotnik', 'Antagonista jako psotnik', true, false),
('soft_ban', '%bandyta%', 'wildcard', 'psotnik', 'Antagonista jako psotnik', true, false),

-- SOFT BAN - Monsters
('soft_ban', '%potwór%', 'wildcard', 'sympatyczny potwór', 'Potwory tylko sympatyczne', true, false),
('soft_ban', '%straszny%', 'wildcard', 'zabawny', 'Bez straszenia dzieci', true, false),

-- REPLACEMENT - Violence to cooperation
('replacement', '%walka%', 'wildcard', 'pokonaj sprytem', 'Kooperacja zamiast walki', true, false),
('replacement', '%walcz%', 'wildcard', 'pokonaj sprytem', 'Kooperacja zamiast walki', true, false),
('replacement', '%pokonaj siłą%', 'wildcard', 'pokonaj sprytem', 'Kooperacja zamiast walki', true, false),
('replacement', '%wygraj walkę%', 'wildcard', 'rozwiąż zagadkę', 'Kooperacja zamiast rywalizacji', true, false),

-- REPLACEMENT - Competition to cooperation
('replacement', '%wyścig%', 'wildcard', 'podróż', 'Kooperacja > rywalizacja', true, false),
('replacement', '%zawody%', 'wildcard', 'wspólna zabawa', 'Kooperacja > rywalizacja', true, false);

-- =============================================================================
-- Rollback
-- =============================================================================
-- DELETE FROM content_policy_rules;
-- DELETE FROM props;
-- DELETE FROM age_groups;
```

---

## Dodatkowe informacje implementacyjne

### Inicjalizacja profilu użytkownika

Po rejestracji nowego użytkownika należy automatycznie utworzyć rekord w tabeli `profiles`. Można to zrobić za pomocą Supabase Trigger lub w kodzie aplikacji:

```sql
-- Opcjonalny trigger do auto-tworzenia profilu
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Workflow migracji z Supabase

```bash
# Inicjalizacja Supabase w projekcie
supabase init

# Link do projektu (development/production)
supabase link --project-ref <project-id>

# Uruchomienie lokalnej instancji
supabase start

# Zastosowanie migracji lokalnie
supabase db reset

# Zastosowanie migracji na środowisku produkcyjnym
supabase db push

# Tworzenie nowej migracji
supabase migration new <migration_name>

# Status migracji
supabase migration list
```

### Rate Limiting (implementacja w aplikacji)

Ponieważ tabela `user_rate_limits` nie jest częścią MVP, rate limiting dla generacji AI powinien być obsłużony na poziomie aplikacji poprzez:

1. **Cache (Redis/Memory)** - przechowywanie liczników per użytkownik
2. **Middleware** - sprawdzanie limitów przed wywołaniem API
3. **Zalecane limity początkowe**:
   - 30 generacji AI na godzinę per użytkownik
   - 5 generacji AI na minutę per użytkownik (burst protection)
   - W przypadku przekroczenia: komunikat "Osiągnięto limit generacji. Spróbuj ponownie za X minut"

### Monitoring i maintenance

1. **Retencja eventów**: Rozważyć periodyczne czyszczenie tabeli `events` (>90 dni) poprzez scheduled job
2. **Monitoring wydajności**: Śledzić query performance dla głównych widoków (lista questów, filtrowanie)
3. **Backup**: Regularne backupy bazy danych (Supabase oferuje automatyczne backupy)

### Bezpieczeństwo

1. **RLS włączony** dla wszystkich tabel zawierających dane użytkowników
2. **Tabele słownikowe** bez RLS - dostęp read-only zarządzany przez Supabase Dashboard
3. **Content policy rules** zarządzane przez administratora w Supabase Dashboard
4. **Hasła** - haszowane przez Supabase Auth (bcrypt)
5. **HTTPS** - obligatoryjne dla wszystkich połączeń

---

## Podsumowanie decyzji architektonicznych

| Obszar               | Decyzja                         | Uzasadnienie                                                        |
| -------------------- | ------------------------------- | ------------------------------------------------------------------- |
| **Typy danych**      | Unikanie JSONB                  | Preferowane kolumny strukturalne dla lepszej walidacji i wydajności |
| **Wersje questa**    | Nullable easier/harder          | AI generuje tylko jeden wariant, flexibility dla przyszłości        |
| **Rate limiting**    | Poziom aplikacji                | Brak tabeli w MVP, łatwiejsze do testowania i iteracji              |
| **Rekwizyty**        | Many-to-Many                    | Elastyczność w przypisywaniu wielu rekwizytów do questa             |
| **Grupy wiekowe**    | int4range + słownik             | Elastyczne zarządzanie przedziałami wiekowymi                       |
| **Pattern matching** | Wildcard z opcją rozszerzenia   | Balance między prostotą a elastycznością                            |
| **RLS**              | Włączone dla danych użytkownika | Bezpieczeństwo na poziomie bazy danych                              |
| **Migracje**         | 6 plików logicznych             | Czytelność i łatwość rollbacku                                      |
| **Timestampy**       | Pełny lifecycle                 | Szczegółowa analityka zachowań użytkowników                         |

---

## Następne kroki

1. ✅ Schemat bazy danych - **GOTOWE**
2. ⏭️ Implementacja migracji w projekcie Supabase
3. ⏭️ Konfiguracja Supabase w projekcie Astro
4. ⏭️ Generowanie TypeScript typów z bazy danych
5. ⏭️ Implementacja API endpoints dla CRUD operacji
6. ⏭️ Integracja z AI (OpenRouter) dla generacji questów
7. ⏭️ Walidacja content policy w aplikacji
8. ⏭️ Implementacja UI komponentów

---
