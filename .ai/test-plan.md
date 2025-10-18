# Plan testów (MVP)

## Kontekst i założenia

Projekt: **KidsQuest** – aplikacja do generowania i zarządzania zabawami dla dzieci.

**Stack:** Astro 5, React 19, TypeScript 5, Supabase (PostgreSQL + Auth), OpenRouter.ai (AI), Playwright (e2e)

**Zakres MVP:** Koncentrujemy się na kluczowych ścieżkach biznesowych i mechanizmach bezpieczeństwa. Plan obejmuje tylko podstawowe funkcjonalności niezbędne do weryfikacji działania aplikacji w wersji MVP.

## Priorytety i kryteria wyboru

**Wysoki priorytet:**
- Autentykacja i autoryzacja użytkowników (bezpieczeństwo)
- Generowanie questów przez AI (główna funkcjonalność)
- Walidacja i content safety (bezpieczeństwo treści)
- Operacje na questach w bazie danych (CRUD)

**Średni priorytet:**
- Rate limiting (zabezpieczenie przed nadużyciami)
- Integracja z OpenRouter API
- Zarządzanie statusami questów

**Pominięte:**
- Komponenty prezentacyjne bez logiki
- Pliki konfiguracyjne
- Typy wygenerowane z bazy

---

## Testy jednostkowe (MVP)

### Cel
Weryfikacja logiki biznesowej i pomocniczych funkcji w izolacji od zależności zewnętrznych (baza danych, API).

### Zakres
1. **`src/lib/auth.ts`** – funkcje `requireAuth()` i `getAuthUser()`
2. **`src/lib/quest-service.ts`** – metody QuestService: `createQuest()`, `updateQuest()`, `formatQuestResponse()`
3. **`src/lib/validation.ts`** – wszystkie schematy Zod (generateQuestSchema, createQuestSchema, updateQuestSchema)
4. **`src/lib/rate-limiter.ts`** – logika `checkLimit()` i `cleanup()`
5. **`src/lib/content-safety.ts`** – `validateContent()`, `matchPattern()`, `replacePattern()`
6. **`src/lib/openrouter/service.ts`** – walidacje konfiguracji, budowanie request body, parsowanie JSON, retry logic
7. **`src/lib/ai-service.ts`** – `buildSystemPrompt()`, `buildUserPrompt()`, logika walidacji odpowiedzi AI

### Priorytet
- **Wysoki:** auth.ts, quest-service.ts, validation.ts, content-safety.ts
- **Średni:** rate-limiter.ts, openrouter/service.ts, ai-service.ts

### Przykładowe przypadki

**auth.ts:**
- `requireAuth()` zwraca user ID dla zalogowanego użytkownika
- `requireAuth()` rzuca AppError(401) gdy brak użytkownika
- `getAuthUser()` zwraca pełny obiekt użytkownika

**quest-service.ts:**
- `createQuest()` poprawnie ustawia timestampy dla statusu "saved"
- `createQuest()` ustawia saved_at + started_at dla statusu "started"
- `updateQuest()` aktualizuje is_favorite i favorited_at
- `formatQuestResponse()` parsuje age span (np. "[3,5)") na min/max_age

**validation.ts:**
- generateQuestSchema odrzuca duration_minutes > 480
- createQuestSchema wymaga title długości 1-200 z non-whitespace
- updateQuestSchema odrzuca pusty obiekt (brak pól)

**rate-limiter.ts:**
- `checkLimit()` blokuje po przekroczeniu maxRequests
- `checkLimit()` zwraca poprawny retryAfter w sekundach
- `cleanup()` usuwa stare wpisy sprzed > 1h

**content-safety.ts:**
- `validateContent()` wykrywa hard_ban pattern i zwraca violations
- `matchPattern()` prawidłowo obsługuje exact/wildcard/regex
- `replacePattern()` zamienia tekst według reguły replacement

**openrouter/service.ts:**
- `validateConfig()` rzuca ConfigurationError dla pustego apiKey
- `buildRequestBody()` łączy default i custom modelParams
- `parseJSON()` usuwa markdown code blocks (```json)
- `retryWithBackoff()` wykonuje retry z exponential backoff

**ai-service.ts:**
- `buildUserPrompt()` mapuje age_group_id na polski label
- Walidator w `generateQuest()` odrzuca odpowiedź bez required fields

---

## Testy integracyjne (MVP)

### Cel
Weryfikacja współpracy między warstwami: API routes + serwisy + baza danych (lub mocki Supabase).

### Zakres
1. **API Auth** (`src/pages/api/auth/*`) – rejestracja, logowanie, wylogowanie, pobranie profilu
2. **API Quests CRUD** (`src/pages/api/quests/index.ts`, `[id].ts`) – tworzenie, pobieranie, aktualizacja, usuwanie questów
3. **API Quest Generation** (`src/pages/api/quests/generate.ts`) – generowanie questa z AI (mockowany OpenRouter)
4. **Quest Service + Supabase** – testy z prawdziwą testową bazą Supabase lub in-memory PostgreSQL

### Priorytet
- **Wysoki:** API Auth, API Quests CRUD, Quest Generation
- **Średni:** Quest Service + Supabase

### Przykładowe przypadki

**API Auth:**
- POST /api/auth/register tworzy użytkownika i zwraca profil
- POST /api/auth/login zwraca session dla poprawnych danych
- POST /api/auth/login zwraca 401 dla błędnych danych (+ sprawdź rate limit)
- GET /api/auth/me zwraca 401 bez tokena

**API Quests CRUD:**
- POST /api/quests tworzy quest z prop_ids i zwraca pełny obiekt
- GET /api/quests/[id] zwraca 404 dla nieistniejącego ID
- PATCH /api/quests/[id]/start zmienia status na "started" i ustawia started_at
- DELETE /api/quests/[id] usuwa quest i kaskadowo usuwa quest_props

**API Quest Generation:**
- POST /api/quests/generate zwraca quest z AI (mock OpenRouter odpowiedzi)
- POST /api/quests/generate odrzuca request po 5 próbach w minucie (rate limit)
- POST /api/quests/generate odrzuca unsafe content (mock content-safety violations)

**Quest Service + Supabase:**
- QuestService.createQuest() zapisuje dane w testowej bazie
- QuestService.getQuest() ładuje relacje age_groups i quest_props
- QuestService.updateQuest() zmienia status i timestamps

---

## Testy e2e – Playwright (MVP)

### Cel
Weryfikacja kluczowych ścieżek użytkownika od UI do bazy danych w realnym środowisku przeglądarki.

### Zakres
1. **Auth flow** – rejestracja, logowanie, wylogowanie
2. **Quest generation flow** – generowanie questa, wyświetlenie rezultatu, zapisanie
3. **Quest management flow** – zmiana statusu (start, complete), dodanie do ulubionych
4. **Error handling** – obsługa błędów generowania (timeout, unsafe content)

### Priorytet
- **Wysoki:** Auth flow, Quest generation flow
- **Średni:** Quest management flow, Error handling

### Przykładowe przypadki

**Auth flow:**
- Użytkownik rejestruje się przez /register (email + hasło)
- Użytkownik loguje się przez /login i zostaje przekierowany do /dashboard
- Użytkownik klika "Wyloguj" i zostaje przekierowany do /login

**Quest generation flow:**
- Użytkownik wybiera parametry (wiek, czas, lokalizacja, energia, props)
- Klika "Generuj quest" i widzi loading state
- Po wygenerowaniu widzi quest content (tytuł, hook, steps)
- Klika "Zapisz" i quest pojawia się w liście saved

**Quest management flow:**
- Użytkownik klika "Start" na zapisanym queście
- Status zmienia się na "W trakcie"
- Klika "Zakończ" – status zmienia się na "Ukończony"
- Klika ikonę gwiazdki – quest dodaje się do ulubionych

**Error handling:**
- Generowanie questa bez zalogowania przekierowuje na /login
- Po przekroczeniu rate limitu wyświetla się komunikat "Zbyt wiele prób"
- Timeout OpenRouter API wyświetla komunikat błędu

---

## Out of scope (na teraz)

**Świadomie pomijamy w MVP:**
- Testy performance (load testing, stress testing)
- Testy accessibility (a11y) – zostawiamy na późniejszą iterację
- Testy wizualne (screenshot comparison) – dodamy po stabilizacji UI
- Testy komponentów React w izolacji (np. Testing Library) – skupiamy się na e2e
- Testy migracji bazy danych
- Testy telemetrii i eventów (src/lib/telemetry-service.ts)
- Testy presetów (src/components/generator/PresetSection.tsx)
- Testy hooków React (useGeneratorState, useQuestGeneration, useQuestSave) – pokryte w e2e

---

## Struktura i uruchamianie

### Struktura folderów

```
/tests
  /unit
    /lib
      auth.test.ts
      quest-service.test.ts
      validation.test.ts
      rate-limiter.test.ts
      content-safety.test.ts
      ai-service.test.ts
    /openrouter
      service.test.ts
  /integration
    /api
      auth.test.ts
      quests.test.ts
      quest-generation.test.ts
    /services
      quest-service-db.test.ts
  /e2e
    auth.spec.ts
    quest-generation.spec.ts
    quest-management.spec.ts
    error-handling.spec.ts
  /fixtures
    quests.json
    users.json
  /helpers
    db-setup.ts
    test-supabase-client.ts
```

### Konfiguracja

**vitest.config.ts** (dla unit + integration):
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**'],
      exclude: ['src/lib/**/*.types.ts', 'src/db/database.types.ts'],
    },
  },
});
```

**playwright.config.ts** (dla e2e):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Komendy

**package.json scripts:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:coverage": "vitest run --coverage",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

**Instalacja zależności:**
```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @playwright/test
npx playwright install chromium
```

---

## Ryzyka i kolejne kroki

**Największe ryzyka:**
1. **Brak testów integracyjnych z realnym Supabase** – konieczne skonfigurowanie testowej instancji lub używanie Supabase Local Development
2. **Mockowanie OpenRouter API** – wymaga stworzenia stabilnych fixtures dla odpowiedzi AI
3. **Flaky testy e2e** – generowanie questa przez AI może być niestabilne (różne czasy odpowiedzi, losowe odpowiedzi)

**Kolejne kroki po MVP:**
1. Dodać testy accessibility (axe-core w Playwright)
2. Rozszerzyć coverage o telemetry-service.ts i event tracking
3. Dodać testy performance dla API (k6 lub Artillery)
4. Wprowadzić visual regression testing (Percy lub Playwright screenshots)
5. Testować edge cases (np. długie title, specjalne znaki w content)

