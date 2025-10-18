## 1. Encja Users (Użytkownicy)

**Pytanie 1.1:** Czy należy wykorzystać wbudowaną tabelę `auth.users` z Supabase Auth, czy stworzyć dodatkową tabelę `public.users` z rozszerzonymi informacjami?

Tak, należy wykorzystać `auth.users` z Supabase Auth jako podstawę autentykacji i stworzyć uzupełniającą tabelę `public.profiles` lub `public.user_metadata` z minimalnym zestawem danych (np. preferencje UI, data utworzenia konta, źródło rejestracji). To jest standardowe podejście w Supabase.

**Pytanie 1.2:** Czy potrzebujemy przechowywać informacje o źródle rejestracji (email+hasło vs Google Login)?

Nie

**Pytanie 1.3:** Czy należy przechowywać zanonimizowane ID użytkownika osobno dla celów telemetrycznych?

Nie

---

## 2. Encja Quests

**Pytanie 2.1:** Jak najlepiej zmodelować strukturę treści questa (hak, 3 kroki, warianty)?

Mniej więcej jak poniej:

CREATE TABLE quests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  hook            text NOT NULL,
  step1           text NOT NULL,
  step2           text NOT NULL,
  step3           text NOT NULL,
  easier_version  text,         -- np. prostsza wersja całego questa
  harder_version  text,         -- trudniejsza wersja
  safety_notes    text,
  status          text NOT NULL DEFAULT 'draft', -- 'draft' | 'published' itp.
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX quests_status_idx ON quests(status);


**Pytanie 2.2:** Czy parametry questa (wiek, czas, miejsce, energia, rekwizyty) powinny być przechowywane jako osobne kolumny czy jako JSONB?

Osobne kolumny dla kluczowych parametrów używanych w filtrach (`age_group`, `duration_minutes`, `location`, `energy_level`) i lista rekwizytów jako słownik. Jeśli jest to moliwe to chciałbym uniknąć stosowania typu JSONB

**Pytanie 2.3:** Jak modelować status questa (zapisany/rozpoczęty/ukończony)?

Użyj typu ENUM PostgreSQL `quest_status` z wartościami: 'saved', 'started', 'completed'. Dodatkowo przechowuj timestampy: `saved_at`, `started_at`, `completed_at` dla analityki.

**Pytanie 2.4:** Jak obsłużyć funkcjonalność "Ulubione" (przypięcie)?

Kolumna boolean `is_favorite` w tabeli `quests` wystarczy dla MVP. Dodatkowo kolumna `favorited_at` (nullable timestamp) pozwoli na sortowanie ulubionych po dacie przypięcia.

**Pytanie 2.5:** Czy pole `source` (AI/manual) powinno być ENUM czy TEXT?

ENUM `quest_source` z wartościami 'ai', 'manual' - zapewni to spójność danych i lepszą wydajność filtrowania.

**Pytanie 2.6:** Czy tytuł questa jest obowiązkowy?

Tak - zarówno dla questa tworzonego manualnie jak i przez AI tytuł jest obowiązkowy. Dla manualnego tworzenia questa, w przypadku gdy uytkownik nie poda tytułu wówczas tytuł jest auto-generowany na podstawie pierwszych słów haka dla UX. Dla questa generowanego przez AI tytuł jest zawsze auto-generowany. W obu przypadkach uzytkownik moze edytować tytuł.

**Pytanie 2.7:** Jak obsłużyć miękkie usuwanie questów vs twarde usuwanie?

Dla MVP wystarczy twarde usuwanie (DELETE)

---

## 3. Encja Telemetry/Events

**Pytanie 3.1:** Czy eventy telemetryczne powinny być przechowywane w PostgreSQL czy w osobnym systemie analitycznym?

Dla MVP, tabela `events` w PostgreSQL z retencją 30-90 dni jest wystarczająca.

**Pytanie 3.2:** Jaka struktura tabeli events zapewni elastyczność dla różnych typów eventów?

Tabela `events` z kolumnami:
- `id` (UUID, PK)
- `user_id` (UUID, indexed)
- `event_type` (ENUM lub TEXT, indexed)
- `event_data` (JSONB) - parametry specyficzne dla eventu
- `quest_id` (UUID, nullable, FK) - jeśli event dotyczy questa
- `app_version` (TEXT)
- `created_at` (TIMESTAMPTZ, indexed)

**Pytanie 3.3:** Czy potrzebujemy osobnej tabeli dla każdego typu eventu czy jedna uniwersalna wystarczy?

Jedna uniwersalna tabela `events` wystarczy dla MVP - to upraszcza zapytania agregujące i raportowanie. JSONB pozwoli na elastyczne przechowywanie różnych atrybutów.

---

## 4. Relacje między encjami

**Pytanie 4.1:** Jaka jest kardynalność relacji User -> Quests?

One-to-Many (1:N) - jeden użytkownik może mieć wiele questów. Kolumna `user_id` (UUID, NOT NULL, FK do auth.users) w tabeli `quests` z indeksem.

**Pytanie 4.2:** Czy questy mogą być współdzielone między użytkownikami w MVP?

Nie. Każdy quest należy do dokładnie jednego użytkownika (strict ownership).

**Pytanie 4.3:** Czy potrzebujemy relacji między Events a Quests?

Tak, opcjonalny FK `quest_id` w tabeli `events` pozwoli na łatwe śledzenie lifecycle questa (generated -> started -> completed). Relacja powinna być nullable, bo nie wszystkie eventy dotyczą questów (np. auth_signup).

---

## 5. Indeksy i wydajność

**Pytanie 5.1:** Jakie indeksy są kluczowe dla głównych use case'ów?

- `quests(user_id, created_at DESC)` - lista "Ostatnie"
- `quests(user_id, is_favorite, favorited_at DESC)` - lista "Ulubione"
- `quests(user_id, age_group, location, source)` - filtry
- `events(user_id, created_at)` - telemetria per użytkownik
- `events(event_type, created_at)` - agregacje globalne
- Indeks GIN na `quests.props` dla wyszukiwania po rekwizytach

**Pytanie 5.2:** Czy przewidujemy potrzebę full-text search po treści questów?

Nie

**Pytanie 5.3:** Czy potrzebujemy partycjonowania tabel?

Nie

---

## 6. RLS (Row Level Security)

**Pytanie 6.1:** Jakie polityki RLS są potrzebne dla tabeli quests?

- SELECT: `user_id = auth.uid()`
- INSERT: `user_id = auth.uid()`
- UPDATE: `user_id = auth.uid()`
- DELETE: `user_id = auth.uid()`
Każdy użytkownik widzi i modyfikuje tylko swoje questy.

**Pytanie 6.2:** Czy tabela events powinna mieć RLS?

Tak, polityka SELECT: `user_id = (SELECT user_id FROM profiles WHERE user_id = auth.uid())`.

**Pytanie 6.3:** Czy potrzebujemy osobnych polityk dla różnych statusów questa?

Nie, wystarczą podstawowe polityki oparte o `user_id`. Status questa może być swobodnie zmieniany przez właściciela.

---

## 7. Typy danych i ograniczenia

**Pytanie 7.1:** Jakie ograniczenia (constraints) powinny być nałożone na parametry questa?

- `age_group`: Najlepiej nie robić ENUM-a dla grup wiekowych, tylko dać tabelę słownikową + zakres (range) i klucz obcy. To jest elastyczne (łatwo dodać/zmienić zakresy, tłumaczenia, opisy), bez wad ENUM (kolejność, trudne usuwanie wartości). Na przykład tabela age_groups z int4range. Przykład:

-- Tabela słownikowa
CREATE TABLE age_groups (
  id    smallserial PRIMARY KEY,
  code  text UNIQUE NOT NULL CHECK (code ~ '^\d+_\d+$'), -- np. '3_4'
  label text NOT NULL,                                   -- np. '3–4 lata'
  span  int4range NOT NULL,                              -- [3,5) = 3 i 4 lata
  CHECK (lower(span) >= 0 AND upper(span) > lower(span) AND lower_inc(span) AND NOT upper_inc(span))
);

-- Zakaz nakładania się przedziałów (spójność)
CREATE EXTENSION IF NOT EXISTS btree_gist; -- nie zawsze konieczne, ale przyda się ogólnie
ALTER TABLE age_groups
  ADD CONSTRAINT age_groups_no_overlap
  EXCLUDE USING gist (span WITH &&);

-- Wstawienie Twoich grup
INSERT INTO age_groups (code, label, span) VALUES
('3_4',  '3–4 lata',  int4range(3,5,'[)')),
('5_6',  '5–6 lat',   int4range(5,7,'[)')),
('7_8',  '7–8 lat',   int4range(7,9,'[)')),
('9_10', '9–10 lat',  int4range(9,11,'[)'));

- `duration_minutes` INTEGER CHECK (duration_minutes > 0 AND duration_minutes <= 480) - max 8h dla bezpieczeństwa
- `location` ENUM: 'home', 'outdoor'
- `energy_level` ENUM: 'low', 'medium', 'high'
- `source` ENUM: 'ai', 'manual'
- `quest_status` ENUM: 'saved', 'started', 'completed'

**Pytanie 7.2:** Czy content JSONB powinien mieć walidację schematu?

Jeśli jest to mozliwe to nie chcę uzywać typu JSONB. Podałem juz wyjaśnienie i alteernatywę wyzej.

**Pytanie 7.3:** Jakie limity tekstowe powinny być nałożone?


- `title` VARCHAR(200) - krótki tytuł
- content: uwzględnij moją propozycję ze nie chę typu JSOB i weź pod uwagę zaproponowaną przeze mnie strukturę dla content
- Bez twardych limitów w DB dla elastyczności, ale walidacja w API

---

## 8. Dodatkowe rozważania

**Pytanie 8.1:** Czy potrzebujemy tabeli dla presetów?

Nie

**Pytanie 8.2:** Czy potrzebujemy audit log dla zmian w questach?

Nie

**Pytanie 8.3:** Jak obsłużyć współbieżność przy jednoczesnej edycji questa?

Dla MVP nie jest to problemem (użytkownik sam edytuje swoje questy).

**Pytanie 8.4:** Czy potrzebujemy tabeli dla polityki bezpieczeństwa treści (hard-ban słowa)?

Tak, tabela `content_policy_rules` z kolumnami:
- `id` (PK)
- `rule_type` ENUM: 'hard_ban', 'soft_ban', 'replacement'
- `pattern` (TEXT) - słowo/fraza do wykrycia
- `replacement` (TEXT, nullable) - bezpieczny zamiennik
- `active` (BOOLEAN)
To pozwoli na dynamiczne zarządzanie polityką bez redeploy aplikacji.

**Pytanie 8.5:** Czy należy przechowywać wersję aplikacji przy której stworzono questa?

Tak, kolumna `app_version` (VARCHAR(20)) w tabeli `quests` pomoże w przyszłych migracjach formatu treści i debugowaniu.

**Pytanie 8.6:** Jak obsłużyć rate limiting dla generacji AI?

Można dodać tabelę `user_rate_limits` z kolumnami:
- `user_id` (FK)
- `action_type` (ENUM: 'ai_generation')
- `count` (INTEGER)
- `window_start` (TIMESTAMPTZ)
- `window_duration` (INTERVAL)
Lub użyć zewnętrznego rozwiązania (Redis) dla lepszej wydajności.

**Pytanie 8.7:** Czy potrzebujemy tabeli dla cache'owania podobnych requestów AI?

Nie

**Pytanie 8.8:** Jak zapewnić integralność referencyjną przy usuwaniu użytkownika?

`quests.user_id` FK z `ON DELETE CASCADE` - usunięcie użytkownika usuwa jego questy
