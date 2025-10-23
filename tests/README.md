# Dokumentacja testów - KidsQuest MVP

## Przegląd

Projekt zawiera kompleksowy zestaw testów obejmujący:
- **Testy jednostkowe** (unit tests) - logika biznesowa w izolacji
- **Testy integracyjne** (integration tests) - współpraca między warstwami
- **Testy e2e** (end-to-end) - pełne ścieżki użytkownika w przeglądarce

## Struktura testów

```
tests/
├── unit/
│   ├── lib/
│   │   ├── auth.test.ts               # Testy autentykacji
│   │   ├── validation.test.ts         # Testy schematów Zod
│   │   ├── quest-service.test.ts      # Testy serwisu questów
│   │   ├── content-safety.test.ts     # Testy bezpieczeństwa treści
│   │   ├── rate-limiter.test.ts       # Testy rate limitera
│   │   └── ai-service.test.ts         # Testy serwisu AI
│   └── openrouter/
│       └── service.test.ts            # Testy integracji OpenRouter
├── integration/
│   └── api/
│       ├── auth.test.ts               # Testy API autentykacji
│       └── quests.test.ts             # Testy API questów
├── e2e/
│   ├── auth.spec.ts                   # E2E: rejestracja, logowanie
│   ├── quest-generation.spec.ts       # E2E: generowanie questów
│   ├── quest-management.spec.ts       # E2E: zarządzanie questami
│   └── error-handling.spec.ts         # E2E: obsługa błędów
├── fixtures/
│   ├── quests.json                    # Dane testowe - questy
│   └── users.json                     # Dane testowe - użytkownicy
├── helpers/
│   ├── mock-supabase.ts               # Mocki Supabase
│   └── test-supabase-client.ts        # Klient testowy Supabase
├── global.setup.ts                    # Global setup dla testów e2e
├── global.teardown.ts                 # Global teardown - cleanup bazy
└── setup.ts                           # Konfiguracja Vitest (unit tests)
```

## Uruchamianie testów

### Testy jednostkowe

```bash
# Wszystkie testy jednostkowe
npm run test:unit

# Watch mode (przydatne podczas developmentu)
npm run test

# Pojedynczy plik
npx vitest run tests/unit/lib/auth.test.ts
```

### Testy integracyjne

```bash
# Wszystkie testy integracyjne
npm run test:integration

# Uwaga: Testy integracyjne w MVP są szablonami.
# Dla pełnej implementacji potrzebna jest testowa instancja Supabase.
```

### Testy e2e (Playwright)

**⚠️ WAŻNE:** Przed uruchomieniem testów e2e upewnij się, że:
1. Supabase działa lokalnie: `supabase start`
2. Dev server jest uruchomiony: `npm run dev`

```bash
# Uruchom wszystkie testy e2e
npm run test:e2e

# UI mode - interaktywny debugger
npm run test:e2e:ui

# ✅ REKOMENDOWANE: Uruchom testy pojedynczo dla lepszej stabilności
npm run test:e2e:auth:register     # Test rejestracji
npm run test:e2e:auth:login        # Test logowania
npm run test:e2e:auth:logout       # Test wylogowania
npm run test:e2e:auth:validation   # Test walidacji
npm run test:e2e:auth:ratelimit    # Test rate limiting
npm run test:e2e:auth:protected    # Test chronionych tras
npm run test:e2e:auth:session      # Test persystencji sesji

# Inne grupy testów e2e
npm run test:e2e:error            # Testy obsługi błędów
npm run test:e2e:quest-gen        # Testy generowania questów
npm run test:e2e:quest-mgmt       # Testy zarządzania questami

# Pojedynczy plik
npx playwright test tests/e2e/auth.spec.ts

# Z widocznymi przeglądarkami (headed mode)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

**Dlaczego pojedyncze testy?**
Testy e2e działają najlepiej pojedynczo z powodu:
- Rate limiting w Supabase (limit prób na endpoint)
- Izolacji stanu bazy danych między testami
- Unikania konfliktów przy współdzielonych zasobach
- To standardowa praktyka w przemyśle dla testów e2e

### Coverage

```bash
# Generuj raport pokrycia kodu
npm run test:coverage

# Raport będzie dostępny w ./coverage/index.html
```

### Wszystkie testy

```bash
# Uruchom wszystkie testy (unit + integration + e2e)
npm run test:all
```

## Konfiguracja

### Vitest (unit + integration)

Konfiguracja: `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
    },
  },
});
```

### Playwright (e2e)

Konfiguracja: `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
  },
  use: {
    baseURL: 'http://localhost:4321',
  },
  projects: [
    // Setup - runs before all tests
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      teardown: 'teardown',
    },
    // Teardown - runs after all tests
    {
      name: 'teardown',
      testMatch: /global\.teardown\.ts/,
    },
    // Main test project
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
```

#### Global Setup i Teardown

Testy e2e używają [Project Dependencies w Playwright](https://playwright.dev/docs/test-global-setup-teardown#teardown) dla setup i teardown:

- **`tests/global.setup.ts`** - wykonuje się raz przed wszystkimi testami
  - Przygotowuje środowisko testowe
  - Widoczny w HTML reportach
  - Wspiera trace recording

- **`tests/global.teardown.ts`** - wykonuje się raz po wszystkich testach
  - Czyści dane testowe z bazy danych
  - Usuwa wszystkie profile użytkowników testowych utworzone w ostatnich 24h
  - Usuwa powiązane questy i eventy

**Zalety tego podejścia:**
- ✅ Widoczność w HTML report jako osobny projekt
- ✅ Pełne wsparcie dla trace recording
- ✅ Możliwość użycia Playwright fixtures
- ✅ Lepsza integracja z test runnerem

## Zmienne środowiskowe

Dla testów używane są zmienne środowiskowe:

```bash
# .env.test
# Supabase configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenRouter API (dla AI quest generation)
OPENROUTER_API_KEY=your-openrouter-api-key

# Dla testów E2E na produkcyjnym Supabase w chmurze (opcjonalnie)
# Użytkownik testowy z dedykowanymi uprawnieniami
E2E_USERNAME=test-user@mailinator.com
E2E_PASSWORD=your-secure-test-password
```

**Uwaga:** 
- Testy jednostkowe używają mocków i nie wymagają prawdziwych kluczy API
- `E2E_USERNAME` i `E2E_PASSWORD` są wymagane tylko jeśli testujesz na produkcyjnej instancji Supabase w chmurze
- Dla lokalnego developmentu z `supabase start` te zmienne nie są potrzebne
- **Ważne:** Testy używają domeny `@mailinator.com` ponieważ Supabase blokuje fake/test domeny jak `@example.com`

### Tworzenie dedykowanego użytkownika testowego (dla cloud Supabase)

Jeśli testujesz na produkcyjnej instancji Supabase:

1. **Utwórz użytkownika testowego** w Supabase Dashboard:
   - Idź do Authentication > Users
   - Kliknij "Add user" > "Create new user"
   - Email: `test-user@mailinator.com` (lub inna prawdziwa domena akceptująca wszystkie emaile)
   - Hasło: silne, bezpieczne hasło
   - Auto-confirm: włącz (aby ominąć weryfikację email)

2. **Dodaj do `.env.test`**:
   ```bash
   E2E_USERNAME=test-user@mailinator.com
   E2E_PASSWORD=your-secure-password
   ```

3. **Global setup automatycznie zaloguje się** jako ten użytkownik przed uruchomieniem testów

**Dlaczego to jest ważne?**
- Testy E2E tworzą nowych użytkowników dynamicznie (test-*@mailinator.com)
- Każdy test używa unikalnego emaila aby uniknąć konfliktów
- Mailinator.com to publiczna domena testowa która przechodzi walidację Supabase
- Dedykowany użytkownik testowy (E2E_USERNAME) nie jest wymagany dla większości testów, ale jest dostępny dla global setup

## Pisanie nowych testów

### Testy jednostkowe

```typescript
import { describe, it, expect, vi } from 'vitest';
import { functionToTest } from '../../../src/lib/module';

describe('Module name', () => {
  it('should do something', () => {
    const result = functionToTest();
    expect(result).toBe(expected);
  });
});
```

### Testy e2e

```typescript
import { test, expect } from '@playwright/test';

test('should perform action', async ({ page }) => {
  await page.goto('/path');
  await page.click('button');
  await expect(page.locator('[data-testid="result"]')).toBeVisible();
});
```

## Najlepsze praktyki

### Ogólne

1. **Izolacja testów** - każdy test powinien być niezależny
2. **Używaj fixtures** - dla powtarzalnych danych testowych
3. **Czyść po sobie** - w `afterEach` / `afterAll`
4. **Opisowe nazwy** - `it('should X when Y')`
5. **Grupuj testy** - używaj `describe()` dla organizacji

### Unit tests

1. **Mockuj zależności** - używaj `vi.fn()` i `vi.mock()`
2. **Testuj edge cases** - puste wartości, null, undefined
3. **Jeden koncept na test** - każdy test sprawdza jedną rzecz

### E2E tests

1. **Używaj data-testid** - dla stabilnych selektorów
2. **Czekaj na elementy** - `waitFor()`, `toBeVisible()`
3. **Unikaj hardcoded delays** - `page.waitForTimeout()` tylko gdy konieczne
4. **Testuj happy path i error cases**
5. **Cleanup jest automatyczny** - global teardown usuwa dane testowe po wszystkich testach

## Debugowanie

### Vitest

```bash
# Debug pojedynczego testu
node --inspect-brk ./node_modules/vitest/vitest.mjs run auth.test.ts
```

### Playwright

```bash
# Debug mode - zatrzymuje wykonanie
npx playwright test --debug

# UI mode - interaktywny debugger
npm run test:e2e:ui

# Screenshot on failure (domyślnie włączone)
# Znajduje się w test-results/
```

## CI/CD

Testy są skonfigurowane do uruchamiania w CI:

```yaml
# GitHub Actions example
- name: Run unit tests
  run: npm run test:unit

- name: Run e2e tests
  run: npm run test:e2e
  env:
    CI: true
```

## Znane ograniczenia MVP

1. **Testy integracyjne** są szablonami - wymagają konfiguracji testowej bazy Supabase
2. **Testy e2e** wymagają działającego klucza API OpenRouter dla pełnej funkcjonalności
3. **Rate limiting** w testach może powodować flaky tests przy wielokrotnym uruchamianiu
4. **Content safety** - brak testów z prawdziwą bazą reguł content policy

## Kolejne kroki (post-MVP)

- [ ] Skonfigurować Supabase Local Development dla testów integracyjnych
- [ ] Dodać testy performance (k6 lub Artillery)
- [ ] Dodać testy accessibility (axe-core)
- [ ] Visual regression testing (Percy lub Playwright screenshots)
- [ ] Rozszerzyć pokrycie testów o telemetry-service i event tracking
- [ ] Dodać testy migracji bazy danych

## Kontakt i wsparcie

Dla pytań dotyczących testów, sprawdź:
- [Plan testów](../PLAN_TESTOW.md) - szczegółowy plan i uzasadnienie
- [Dokumentację Vitest](https://vitest.dev/)
- [Dokumentację Playwright](https://playwright.dev/)

