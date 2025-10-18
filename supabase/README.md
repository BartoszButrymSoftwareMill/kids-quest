# Supabase Database Setup

Ten folder zawiera migracje bazy danych PostgreSQL dla projektu KidsQuest MVP.

## 📋 Struktura Plików

```
/supabase
  /migrations
    20251011000001_create_types_and_enums.sql      # Typy ENUM
    20251011000002_create_tables.sql               # Definicje tabel
    20251011000003_create_indexes.sql              # Indeksy wydajności
    20251011000004_create_functions_and_triggers.sql # Funkcje i triggery
    20251011000005_enable_rls.sql                  # Polityki RLS
    20251011000006_seed_reference_data.sql         # Dane słownikowe
  config.toml                                      # Konfiguracja Supabase CLI
  seed.sql                                         # Opcjonalne dane deweloperskie
```

## 🚀 Rozpoczęcie Pracy

### 1. Instalacja Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

### 2. Uruchomienie Lokalnej Instancji Supabase

```bash
# W katalogu głównym projektu
supabase start
```

Komenda uruchomi lokalne kontenery Docker z:
- PostgreSQL (port 54322)
- Supabase Studio (port 54323)
- API Gateway (port 54321)
- Auth Server
- Storage Server

Po uruchomieniu otrzymasz dostępy (zapisz je!):
```
API URL: http://localhost:54321
Studio URL: http://localhost:54323
anon key: <your-anon-key>
service_role key: <your-service-role-key>
```

### 3. Zastosowanie Migracji

Migracje są automatycznie aplikowane podczas `supabase start`.

Jeśli chcesz je zastosować ponownie:

```bash
# Reset bazy danych
supabase db reset

# Lub zastosuj konkretną migrację
supabase migration up
```

### 4. Dostęp do Supabase Studio

Otwórz przeglądarkę: `http://localhost:54323`

W Studio możesz:
- Przeglądać tabele i dane
- Testować zapytania SQL
- Zarządzać politykami RLS
- Monitorować logi

## 📊 Schemat Bazy Danych

Szczegółowy opis schematu znajduje się w pliku: `/.ai/db-plan.md`

### Główne Tabele

- **profiles** - rozszerzone profile użytkowników
- **quests** - główna tabela questów
- **quest_props** - relacja wiele-do-wielu między questami a rekwizytami
- **events** - telemetria użytkownika
- **age_groups** - słownik grup wiekowych
- **props** - słownik rekwizytów
- **content_policy_rules** - reguły bezpieczeństwa treści

## 🔐 Row Level Security (RLS)

Wszystkie tabele mają włączone RLS:

- **Tabele użytkowników** (profiles, quests, quest_props, events)
  - Użytkownicy widzą tylko swoje dane
  - Polityki oparte na `auth.uid()`

- **Tabele słownikowe** (age_groups, props, content_policy_rules)
  - Publiczny odczyt dla wszystkich użytkowników
  - Zapis tylko przez administratorów (poza zakresem MVP)

## 🧪 Testowanie Migracji

### Sprawdzenie statusu migracji

```bash
supabase migration list
```

### Utworzenie nowej migracji

```bash
supabase migration new nazwa_migracji
```

### Generowanie typów TypeScript

```bash
supabase gen types typescript --local > src/db/database.types.ts
```

## 🔄 Workflow Development

1. **Lokalne zmiany**
   ```bash
   # Edytuj plik w /migrations lub utwórz nowy
   supabase migration new my_changes
   
   # Zastosuj zmiany
   supabase db reset
   ```

2. **Generowanie typów**
   ```bash
   supabase gen types typescript --local > src/db/database.types.ts
   ```

3. **Testowanie**
   - Otwórz Studio: http://localhost:54323
   - Przetestuj zapytania
   - Sprawdź polityki RLS

4. **Commit**
   ```bash
   git add supabase/migrations/
   git commit -m "feat: add new migration"
   ```

## 📦 Deployment na Produkcję

### 1. Połącz projekt z Supabase

```bash
# Login do Supabase
supabase login

# Link projektu
supabase link --project-ref <your-project-ref>
```

### 2. Zastosuj migracje

```bash
# Push migracji na produkcję
supabase db push
```

### 3. Wygeneruj typy produkcyjne

```bash
supabase gen types typescript > src/db/database.types.ts
```

## 🛠️ Przydatne Komendy

```bash
# Status Supabase
supabase status

# Zatrzymanie lokalnej instancji
supabase stop

# Restart z czystą bazą
supabase db reset

# Podgląd SQL do wykonania
supabase migration up --dry-run

# Backup lokalnej bazy
supabase db dump -f backup.sql

# Logi z bazy danych
supabase logs db

# Otwórz Studio
supabase studio
```

## 📝 Seed Data

### Development

Plik `seed.sql` zawiera przykładowe dane testowe. Odkomentuj sekcje, które chcesz użyć.

**Uwaga:** Dane słownikowe (age_groups, props, content_policy_rules) są już seedowane w migracji `20251011000006_seed_reference_data.sql`.

### Production

Dane referencyjne są seedowane automatycznie przez migracje. Nie musisz nic robić.

## 🐛 Troubleshooting

### Problem: Migracje się nie aplikują

```bash
# Reset i ponowne zastosowanie
supabase db reset
```

### Problem: Błąd polityk RLS

```bash
# Sprawdź polityki w Studio
# Settings > Database > Policies

# Lub przez SQL
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Problem: Brak danych słownikowych

```bash
# Sprawdź czy migracja seed została zastosowana
supabase migration list

# Jeśli nie, zresetuj bazę
supabase db reset
```

## 📚 Dodatkowe Zasoby

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Design Plan](/.ai/db-plan.md)

## ⚠️ Uwagi Bezpieczeństwa

1. **Nigdy nie commituj** plików `.env` lub `.env.local`
2. **Service role key** to klucz administratora - używaj tylko server-side
3. **Anon key** jest bezpieczny do użycia client-side
4. **RLS jest zawsze włączone** - testuj polityki dokładnie
5. **Content policy rules** chronią dzieci - nie wyłączaj ich

---

**Autor:** KidsQuest Team  
**Data utworzenia:** 2025-10-11  
**Ostatnia aktualizacja:** 2025-10-11

