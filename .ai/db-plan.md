# Schemat Bazy Danych - KidsQuest MVP

## Przegląd Architektury

Baza danych PostgreSQL dla aplikacji KidsQuest składa się z następujących głównych obszarów:

- **Użytkownicy i profile** - wykorzystanie Supabase Auth + rozszerzona tabela profiles
- **Questy** - główna funkcjonalność aplikacji
- **Telemetria** - śledzenie eventów użytkownika
- **Słowniki** - grupy wiekowe, rekwizyty, reguły bezpieczeństwa treści
- **RLS** - zabezpieczenia na poziomie wierszy

## Diagram Relacji (ERD)

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

## 1. Typy i Enumeracje

### quest_status
**Typ:** ENUM  
**Wartości:** `saved`, `started`, `completed`  
**Opis:** Status questa w cyklu życia użytkownika

### quest_source
**Typ:** ENUM  
**Wartości:** `ai`, `manual`  
**Opis:** Źródło powstania questa (wygenerowany przez AI lub stworzony ręcznie)

### location_type
**Typ:** ENUM  
**Wartości:** `home`, `outdoor`  
**Opis:** Miejsce realizacji questa

### energy_level
**Typ:** ENUM  
**Wartości:** `low`, `medium`, `high`  
**Opis:** Poziom energii wymagany do realizacji questa

### rule_type
**Typ:** ENUM  
**Wartości:** `hard_ban`, `soft_ban`, `replacement`  
**Opis:** Typ reguły bezpieczeństwa treści

### event_type
**Typ:** ENUM  
**Wartości:**
- `quest_generated` - quest wygenerowany przez AI
- `quest_started` - użytkownik rozpoczął quest
- `quest_saved` - quest zapisany na później
- `quest_completed` - quest ukończony
- `quest_created_manual` - quest utworzony ręcznie
- `auth_signup` - rejestracja nowego użytkownika
- `auth_login` - logowanie użytkownika
- `favorite_toggled` - przełączenie statusu ulubionego
- `delete_quest` - usunięcie questa
- `error_generation` - błąd podczas generacji questa

### pattern_match_type
**Typ:** ENUM  
**Wartości:** `exact`, `wildcard`, `regex`  
**Opis:** Typ dopasowania wzorca dla reguł bezpieczeństwa treści

---

## 2. Tabele Słownikowe

### age_groups
**Opis:** Słownik grup wiekowych z przedziałami wieku

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | smallserial | PRIMARY KEY | Unikalny identyfikator |
| code | text | UNIQUE, NOT NULL, CHECK (code ~ '^\d+_\d+$') | Unikalny kod, np. '3_4' |
| label | text | NOT NULL | Etykieta do wyświetlenia, np. '3-4 lata' |
| span | int4range | NOT NULL, CHECK (lower >= 0 AND upper > lower) | Przedział wieku jako int4range, np. [3,5) |

**Ograniczenia:**
- EXCLUDE USING gist (span WITH &&) - zapobiega nakładaniu się przedziałów wiekowych

**Dane referencyjne:**
```sql
('3_4',  '3–4 lata',  int4range(3,5,'[)'))
('5_6',  '5–6 lat',   int4range(5,7,'[)'))
('7_8',  '7–8 lat',   int4range(7,9,'[)'))
('9_10', '9–10 lat',  int4range(9,11,'[)'))
```

---

### props
**Opis:** Słownik rekwizytów/wyposażenia dla questów

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | smallserial | PRIMARY KEY | Unikalny identyfikator |
| code | text | UNIQUE, NOT NULL | Unikalny kod, np. 'blocks', 'drawing' |
| label | text | NOT NULL | Etykieta do wyświetlenia, np. 'Klocki', 'Rysowanie' |

**Dane referencyjne:**
- blocks (Klocki)
- drawing (Rysowanie)
- none (Bez rekwizytów)
- paper_pencil (Kartka i ołówek)
- puzzles (Zagadki)
- storytelling (Opowiadanie historii)
- toy_cars (Samochodziki)
- balls (Piłki)
- books (Książki)
- building_sets (Zestawy konstrukcyjne)
- coloring (Kolorowanki)
- costumes (Kostiumy/przebrania)
- crafts (Materiały plastyczne)
- dolls_figures (Lalki/figurki)
- music_instruments (Instrumenty muzyczne)
- playdough (Plastelina)
- plush_toys (Pluszaki)
- puppets (Pacynki)
- sand_water (Piasek/woda)

---

### content_policy_rules
**Opis:** Reguły bezpieczeństwa treści dla filtrowania i walidacji

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | serial | PRIMARY KEY | Unikalny identyfikator |
| rule_type | rule_type | NOT NULL | Typ reguły (hard_ban, soft_ban, replacement) |
| pattern | text | NOT NULL, CHECK (char_length > 0) | Wzorzec do dopasowania |
| pattern_type | pattern_match_type | NOT NULL, DEFAULT 'wildcard' | Typ dopasowania wzorca |
| replacement | text | CHECK (NULL OR char_length > 0) | Bezpieczny zamiennik (dla soft_ban i replacement) |
| description | text | NULL | Opis reguły |
| is_active | boolean | NOT NULL, DEFAULT true | Czy reguła jest aktywna |
| case_sensitive | boolean | NOT NULL, DEFAULT false | Czy dopasowanie uwzględnia wielkość liter |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Data utworzenia |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Data ostatniej aktualizacji |

**Przykładowe dane:**
- HARD BAN: pistolet, karabin, nóż, miecz, przemoc, alkohol, papieros, hazard, kradzież
- SOFT BAN: złodziej → psotnik, złoczyńca → psotnik, potwór → sympatyczny potwór
- REPLACEMENT: walka → pokonaj sprytem, wyścig → podróż, zawody → wspólna zabawa

---

## 3. Tabele Użytkowników

### profiles
**Opis:** Rozszerzony profil użytkownika z domyślnymi preferencjami

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| user_id | uuid | PRIMARY KEY, FK → auth.users(id) ON DELETE CASCADE | Identyfikator użytkownika z Supabase Auth |
| default_age_group_id | smallint | FK → age_groups(id) ON DELETE SET NULL, NULL | Domyślna grupa wiekowa |
| default_duration_minutes | integer | CHECK (NULL OR (value > 0 AND value <= 480)), NULL | Domyślny czas trwania questa (1-480 min) |
| default_location | location_type | NULL | Domyślne miejsce questa |
| default_energy_level | energy_level | NULL | Domyślny poziom energii |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Data utworzenia profilu |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Data ostatniej aktualizacji |

**Relacje:**
- 1:1 z auth.users
- N:1 z age_groups (opcjonalnie)

---

## 4. Tabele Questów

### quests
**Opis:** Główna tabela przechowująca questy

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator questa |
| user_id | uuid | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | Właściciel questa |
| title | text | NOT NULL, CHECK (char_length BETWEEN 1 AND 200 AND title ~ '\S') | Tytuł questa |
| hook | text | NOT NULL, CHECK (char_length BETWEEN 10 AND 300) | Hak przyciągający uwagę |
| step1 | text | NOT NULL, CHECK (char_length BETWEEN 10 AND 250) | Krok 1 questa |
| step2 | text | NOT NULL, CHECK (char_length BETWEEN 10 AND 250) | Krok 2 questa |
| step3 | text | NOT NULL, CHECK (char_length BETWEEN 10 AND 250) | Krok 3 questa |
| easier_version | text | CHECK (NULL OR char_length BETWEEN 10 AND 500), NULL | Łatwiejsza wersja questa |
| harder_version | text | CHECK (NULL OR char_length BETWEEN 10 AND 500), NULL | Trudniejsza wersja questa |
| safety_notes | text | CHECK (NULL OR char_length <= 500), NULL | Adnotacje bezpieczeństwa |
| age_group_id | smallint | NOT NULL, FK → age_groups(id) ON DELETE RESTRICT | Grupa wiekowa |
| duration_minutes | integer | NOT NULL, CHECK (value > 0 AND value <= 480) | Czas trwania questa (1-480 min) |
| location | location_type | NOT NULL | Miejsce realizacji questa |
| energy_level | energy_level | NOT NULL | Wymagany poziom energii |
| source | quest_source | NOT NULL | Źródło questa (ai/manual) |
| status | quest_status | NOT NULL, DEFAULT 'saved' | Status questa |
| is_favorite | boolean | NOT NULL, DEFAULT false | Czy quest jest ulubiony |
| app_version | varchar(20) | NULL | Wersja aplikacji |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Data utworzenia |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Data ostatniej aktualizacji |
| saved_at | timestamptz | NULL | Data zapisania |
| started_at | timestamptz | NULL | Data rozpoczęcia |
| completed_at | timestamptz | NULL | Data ukończenia |
| favorited_at | timestamptz | NULL | Data dodania do ulubionych |

**Relacje:**
- N:1 z auth.users
- N:1 z age_groups
- N:M z props (przez quest_props)
- 1:N z events

---

### quest_props
**Opis:** Tabela łącząca questy z rekwizytami (relacja wiele-do-wielu)

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| quest_id | uuid | NOT NULL, FK → quests(id) ON DELETE CASCADE | Identyfikator questa |
| prop_id | smallint | NOT NULL, FK → props(id) ON DELETE RESTRICT | Identyfikator rekwizytu |

**Klucz główny:** (quest_id, prop_id)

**Relacje:**
- N:1 z quests
- N:1 z props

---

## 5. Tabela Telemetrii

### events
**Opis:** Przechowywanie eventów telemetrycznych (retencja 90 dni)

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator eventu |
| user_id | uuid | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | Użytkownik generujący event |
| event_type | event_type | NOT NULL | Typ eventu |
| event_data | jsonb | NULL | Dodatkowe dane eventu w formacie JSON |
| quest_id | uuid | FK → quests(id) ON DELETE SET NULL, NULL | Powiązany quest (jeśli dotyczy) |
| app_version | text | NULL | Wersja aplikacji |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Timestamp eventu |

**Relacje:**
- N:1 z auth.users
- N:1 z quests (opcjonalnie)

---

## 6. Indeksy

### Indeksy dla tabeli quests

| Nazwa | Kolumny | Typ | Opis |
|-------|---------|-----|------|
| quests_user_created_idx | (user_id, created_at DESC) | B-tree | Lista ostatnich questów użytkownika |
| quests_user_favorite_idx | (user_id, is_favorite, favorited_at DESC) WHERE is_favorite = true | B-tree (partial) | Lista ulubionych questów |
| quests_user_age_idx | (user_id, age_group_id) | B-tree | Filtrowanie po grupie wiekowej |
| quests_user_location_idx | (user_id, location) | B-tree | Filtrowanie po lokalizacji |
| quests_user_source_idx | (user_id, source) | B-tree | Filtrowanie po źródle (AI/manual) |
| quests_status_idx | (status) | B-tree | Filtrowanie po statusie |

### Indeksy dla tabeli quest_props

| Nazwa | Kolumny | Typ | Opis |
|-------|---------|-----|------|
| quest_props_prop_id_idx | (prop_id) | B-tree | Filtrowanie questów po rekwizytach |

### Indeksy dla tabeli events

| Nazwa | Kolumny | Typ | Opis |
|-------|---------|-----|------|
| events_user_created_idx | (user_id, created_at DESC) | B-tree | Timeline eventów użytkownika |
| events_type_created_idx | (event_type, created_at DESC) | B-tree | Analityka per typ eventu |
| events_quest_idx | (quest_id) WHERE quest_id IS NOT NULL | B-tree (partial) | Eventy powiązane z questem |

### Indeksy dla tabeli content_policy_rules

| Nazwa | Kolumny | Typ | Opis |
|-------|---------|-----|------|
| content_policy_rules_active_idx | (is_active, rule_type) WHERE is_active = true | B-tree (partial) | Aktywne reguły bezpieczeństwa |

---

## 7. Funkcje i Triggery

### update_updated_at_column()
**Typ:** TRIGGER FUNCTION  
**Język:** plpgsql  
**Opis:** Automatyczna aktualizacja kolumny updated_at przy modyfikacji wiersza

**Triggery wykorzystujące tę funkcję:**
- update_quests_updated_at (BEFORE UPDATE ON quests)
- update_profiles_updated_at (BEFORE UPDATE ON profiles)
- update_content_policy_rules_updated_at (BEFORE UPDATE ON content_policy_rules)

### handle_new_user() [Opcjonalne]
**Typ:** TRIGGER FUNCTION  
**Język:** plpgsql  
**Opis:** Automatyczne tworzenie profilu przy rejestracji nowego użytkownika

**Trigger:**
- on_auth_user_created (AFTER INSERT ON auth.users)

---

## 8. Row Level Security (RLS)

### Tabela: profiles

| Polityka | Operacja | Warunek |
|----------|----------|---------|
| Users can view own profile | SELECT | user_id = auth.uid() |
| Users can insert own profile | INSERT | user_id = auth.uid() |
| Users can update own profile | UPDATE | user_id = auth.uid() |

### Tabela: quests

| Polityka | Operacja | Warunek |
|----------|----------|---------|
| Users can view own quests | SELECT | user_id = auth.uid() |
| Users can insert own quests | INSERT | user_id = auth.uid() |
| Users can update own quests | UPDATE | user_id = auth.uid() |
| Users can delete own quests | DELETE | user_id = auth.uid() |

### Tabela: quest_props

| Polityka | Operacja | Warunek |
|----------|----------|---------|
| Users can view own quest props | SELECT | quest_id IN (SELECT id FROM quests WHERE user_id = auth.uid()) |
| Users can manage own quest props | ALL | quest_id IN (SELECT id FROM quests WHERE user_id = auth.uid()) |

### Tabela: events

| Polityka | Operacja | Warunek |
|----------|----------|---------|
| Users can view own events | SELECT | user_id = auth.uid() |
| Users can insert own events | INSERT | user_id = auth.uid() |

### Tabele słownikowe

**Bez RLS** - age_groups, props, content_policy_rules  
**Dostęp:** Read-only na poziomie aplikacji, zarządzane przez Supabase Dashboard

---

## 9. Decyzje Architektoniczne

| Obszar | Decyzja | Uzasadnienie |
|--------|---------|--------------|
| **Typy danych** | Unikanie JSONB dla głównych danych | Preferowane kolumny strukturalne dla lepszej walidacji i wydajności zapytań |
| **Wersje questa** | Nullable easier/harder | AI generuje tylko jeden wariant w MVP, flexibility dla przyszłości |
| **Rate limiting** | Poziom aplikacji | Brak tabeli w MVP, łatwiejsze do testowania i iteracji |
| **Rekwizyty** | Many-to-Many przez quest_props | Elastyczność w przypisywaniu wielu rekwizytów do questa |
| **Grupy wiekowe** | int4range + słownik | Elastyczne zarządzanie przedziałami wiekowymi, brak duplikacji |
| **Pattern matching** | Wildcard z opcją rozszerzenia | Balance między prostotą a elastycznością |
| **RLS** | Włączone dla danych użytkownika | Bezpieczeństwo na poziomie bazy danych, zero trust architecture |
| **Migracje** | 6 plików logicznych | Czytelność, łatwość rollbacku, możliwość selektywnego stosowania |
| **Timestampy** | Pełny lifecycle tracking | Szczegółowa analityka zachowań użytkowników (saved_at, started_at, completed_at, favorited_at) |
| **Supabase Auth** | Wykorzystanie auth.users | Unikanie duplikacji danych, integracja z OAuth providers |

---

## 10. Metryki i Analityka

### Główne wskaźniki obliczane z eventów:

**Start Rate (cel ≥ 75%)**
```sql
SELECT 
  COUNT(CASE WHEN event_type = 'quest_started' THEN 1 END)::float / 
  NULLIF(COUNT(CASE WHEN event_type = 'quest_generated' THEN 1 END), 0) AS start_rate
FROM events
WHERE created_at >= NOW() - INTERVAL '30 days';
```

**Udział AI (cel ≥ 75%)**
```sql
SELECT 
  COUNT(CASE WHEN q.source = 'ai' THEN 1 END)::float / 
  NULLIF(COUNT(*), 0) AS ai_share
FROM events e
JOIN quests q ON e.quest_id = q.id
WHERE e.event_type = 'quest_started'
  AND e.created_at >= NOW() - INTERVAL '30 days';
```

**Completion Rate**
```sql
SELECT 
  COUNT(CASE WHEN event_type = 'quest_completed' THEN 1 END)::float / 
  NULLIF(COUNT(CASE WHEN event_type = 'quest_started' THEN 1 END), 0) AS completion_rate
FROM events
WHERE created_at >= NOW() - INTERVAL '30 days';
```

**Favorite Rate**
```sql
SELECT 
  COUNT(DISTINCT user_id)::float / 
  NULLIF((SELECT COUNT(*) FROM profiles), 0) AS favorite_rate
FROM events
WHERE event_type = 'favorite_toggled'
  AND (event_data->>'is_favorite')::boolean = true
  AND created_at >= NOW() - INTERVAL '30 days';
```

---

## 11. Bezpieczeństwo i Prywatność

### Zasady ochrony danych

1. **Minimalizacja danych** - brak przechowywania danych o dzieciach (imiona, wiek dokładny, zdjęcia)
2. **Zanonimizowana telemetria** - eventy zawierają tylko user_id (UUID) i metadane techniczne
3. **Retencja danych** - eventy przechowywane max 90 dni (scheduled cleanup)
4. **RLS enforcement** - wszystkie tabele z danymi użytkowników chronione politykami RLS
5. **Szyfrowanie** - HTTPS dla transmisji, szyfrowanie at-rest przez Supabase
6. **Throttling** - rate limiting na poziomie aplikacji (30 generacji/h, 5 generacji/min)

### Compliance

- **RODO** - prawo do usunięcia danych (CASCADE DELETE z auth.users)
- **Zgoda użytkownika** - wymagana przy rejestracji dla telemetrii
- **Audit trail** - wszystkie operacje logowane przez events

---

## 12. Maintenance i Monitoring

### Scheduled Jobs (do implementacji)

```sql
-- Czyszczenie starych eventów (>90 dni)
DELETE FROM events 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Aktualizacja statystyk tabel
ANALYZE quests;
ANALYZE events;
ANALYZE quest_props;
```

### Monitoring wydajności

**Slow queries do monitorowania:**
- Lista questów z filtrami (docelowo <100ms)
- Generacja metryki Start Rate (docelowo <500ms)
- Zapis eventu (docelowo <50ms)

**Metryki do śledzenia:**
- Rozmiar tabeli events (wzrost >1GB/miesiąc = sygnał alarmowy)
- Index hit ratio (docelowo >99%)
- Connection pool utilization (docelowo <80%)

---

## 13. Roadmap Schematu (Post-MVP)

### Potencjalne rozszerzenia

1. **Profiles dzieci** - tabela children (parent_user_id, name, birth_year)
2. **Współdzielenie** - tabela shared_quests (quest_id, shared_by, shared_with, access_level)
3. **Gamifikacja** - tabela achievements (user_id, achievement_type, earned_at)
4. **Kalendarz** - tabela scheduled_quests (quest_id, scheduled_for, reminder_sent)
5. **Feedback** - tabela quest_ratings (quest_id, rating, comment, created_at)
6. **User rate limits** - tabela user_rate_limits (user_id, action_type, count, window_start)

### Możliwe optymalizacje

1. **Materialized views** - dla często używanych metryk (Start Rate, AI Share)
2. **Partitioning** - tabela events partycjonowana po created_at (monthly)
3. **Full-text search** - indeks GIN dla wyszukiwania w treści questów
4. **Caching** - Redis dla słowników i często używanych questów

---

## 14. Struktura Plików Migracji

```
/supabase
  /migrations
    20241011000001_create_types_and_enums.sql      # Typy ENUM
    20241011000002_create_tables.sql               # Definicje tabel
    20241011000003_create_indexes.sql              # Indeksy wydajności
    20241011000004_create_functions_and_triggers.sql # Funkcje i triggery
    20241011000005_enable_rls.sql                  # Polityki RLS
    20241011000006_seed_reference_data.sql         # Dane słownikowe
  /seed.sql                                        # Opcjonalne dane deweloperskie
```

---

## Podsumowanie

Schemat bazy danych został zaprojektowany z myślą o:

✅ **Wydajności** - indeksy dla kluczowych zapytań, optymalizacja JOIN'ów  
✅ **Bezpieczeństwie** - RLS na wszystkich tabelach użytkowników, minimalizacja danych osobowych  
✅ **Skalowalności** - architektura gotowa na rozszerzenia post-MVP  
✅ **Utrzymywalności** - czytelna struktura, komentarze, logiczne pliki migracji  
✅ **Zgodności z PRD** - pokrywa wszystkie wymagania funkcjonalne MVP  
✅ **Best practices** - normalizacja 3NF, foreign keys, constraints, triggers  

Schemat jest gotowy do implementacji i można przystąpić do tworzenia migracji Supabase.

