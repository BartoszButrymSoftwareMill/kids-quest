# Specyfikacja techniczna systemu autentykacji - KidsQuest MVP

**Data utworzenia**: 2025-10-15  
**Wersja**: 1.0  
**Autor**: KidsQuest Team

---

## Spis treści

1. [Przegląd systemu](#1-przegląd-systemu)
2. [Architektura interfejsu użytkownika](#2-architektura-interfejsu-użytkownika)
3. [Logika backendowa](#3-logika-backendowa)
4. [System autentykacji](#4-system-autentykacji)
5. [Walidacja i obsługa błędów](#5-walidacja-i-obsługa-błędów)
6. [Bezpieczeństwo](#6-bezpieczeństwo)
7. [Integracja z telemetrią](#7-integracja-z-telemetrią)
8. [Przepływy użytkownika](#8-przepływy-użytkownika)

---

## 1. Przegląd systemu

### 1.1 Zakres funkcjonalności

System autentykacji w KidsQuest MVP realizuje następujące user stories z PRD:

- **US-001**: Rejestracja z użyciem email+hasło
- **US-002**: Logowanie email+hasło
- **US-003**: Logowanie przez Google OAuth
- **US-004**: Wylogowanie
- **US-005**: Reset hasła przez email

### 1.2 Podstawowe założenia techniczne

- **Framework**: Astro 5 w trybie SSR (`output: 'server'`)
- **Adapter**: Node.js standalone mode
- **Autentykacja**: Supabase Auth
- **Komponenty interaktywne**: React 19 (hydratacja selektywna)
- **Walidacja**: Zod schemas
- **Styling**: Tailwind CSS 4

### 1.3 Kluczowe wzorce architektoniczne

1. **Middleware-based authentication**: Każde żądanie przechodzi przez middleware Astro, które tworzy klienta Supabase z tokenem z ciasteczek
2. **Server-side rendering**: Strony Astro renderowane po stronie serwera z kontrolą dostępu
3. **Progressive hydration**: Komponenty React hydratowane tylko tam, gdzie potrzebna interaktywność
4. **Cookie-based sessions**: Sesje przechowywane w httpOnly cookies dla bezpieczeństwa

---

## 2. Architektura interfejsu użytkownika

### 2.1 Struktura stron i komponentów

#### 2.1.1 Strony Astro (Server-side)

**Strona**: `src/pages/login.astro`
- **Typ**: Public page z redirect guard
- **Odpowiedzialności**:
  - Server-side sprawdzenie czy użytkownik już zalogowany → redirect do `/dashboard` (lista "Moje questy")
  - Renderowanie layoutu z formularzem logowania
  - Obsługa parametru `redirect` z query string (zachowanie miejsca docelowego)
  - Wyświetlanie informacji o konieczności rejestracji dla nowych użytkowników
- **Guard logic**:
  ```typescript
  const { data: { user } } = await Astro.locals.supabase.auth.getUser();
  if (user) {
    return Astro.redirect(redirectTo);
  }
  ```

**Strona**: `src/pages/register.astro`
- **Typ**: Public page z redirect guard
- **Odpowiedzialności**:
  - Server-side sprawdzenie czy użytkownik już zalogowany → redirect do `/dashboard` (lista "Moje questy")
  - Renderowanie layoutu z formularzem rejestracji
  - Obsługa parametru `redirect` z query string
  - Wyświetlanie linku do strony logowania dla użytkowników z kontem
- **Guard logic**: Identyczna jak w `login.astro`

**Strona**: `src/pages/index.astro` (Landing page)
- **Typ**: Public page z conditional redirect
- **Odpowiedzialności**:
  - Server-side sprawdzenie stanu autentykacji
  - Jeśli użytkownik zalogowany → redirect do `/dashboard` (lista "Moje questy")
  - Jeśli niezalogowany → wyświetlenie landing page z CTA do rejestracji/logowania
- **Guard logic**: Conditional redirect dla zalogowanych użytkowników

**Strony**: `src/pages/dashboard/*.astro`
- **Typ**: Protected pages
- **Odpowiedzialności**:
  - Server-side weryfikacja autentykacji (guard na początku każdej strony)
  - Jeśli brak autentykacji → redirect do `/login?redirect=/dashboard/[path]`
  - Jeśli autentykacja OK → renderowanie treści dashboardu
  - Przekazanie informacji o użytkowniku do layoutu
- **Guard logic**:
  ```typescript
  const { data: { user }, error } = await Astro.locals.supabase.auth.getUser();
  if (error || !user) {
    return Astro.redirect(`/login?redirect=${Astro.url.pathname}`);
  }
  ```

**Nowa strona**: `src/pages/reset-password.astro`
- **Typ**: Public page (nowy komponent do implementacji)
- **Odpowiedzialności**:
  - Renderowanie formularza resetowania hasła
  - Wyświetlanie komunikatu o wysłaniu linku resetu
  - Link powrotny do strony logowania
- **Uwaga**: Ta strona wymaga implementacji (nie istnieje w obecnym kodzie)

**Nowa strona**: `src/pages/auth/callback.astro`
- **Typ**: Public page (nowy komponent do implementacji dla OAuth)
- **Odpowiedzialności**:
  - Obsługa callback z Supabase Auth po OAuth (Google)
  - Wymiana kodu autoryzacyjnego na sesję
  - Ustawienie ciasteczek sesji
  - Redirect do miejsca docelowego
- **Uwaga**: Ta strona wymaga implementacji dla Google OAuth

#### 2.1.2 Komponenty React (Client-side)

**Komponent**: `src/components/auth/LoginForm.tsx`
- **Typ**: Kontrolowany formularz React
- **Odpowiedzialności**:
  - Zarządzanie stanem pól formularza (email, password)
  - Walidacja HTML5 (required, type="email", minLength)
  - Wysyłanie żądania POST do `/api/auth/login`
  - Obsługa stanów: loading, error, success
  - Obsługa redirectów (zarówno z odpowiedzi API jak i parametr `redirectTo`)
  - Przekierowanie hard reload po sukcesie (zapewnia dostępność ciasteczek)
- **State management**:
  ```typescript
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  ```
- **API integration**: `fetch('/api/auth/login', { credentials: 'include' })`
- **Error handling**: Wyświetlanie komunikatów błędów z API w czerwonym alertbox

**Komponent**: `src/components/auth/RegisterForm.tsx`
- **Typ**: Kontrolowany formularz React z multi-state view
- **Odpowiedzialności**:
  - Zarządzanie stanem pól: email, password, confirmPassword
  - Walidacja client-side: zgodność haseł, minLength=6
  - Wysyłanie żądania POST do `/api/auth/register`
  - Obsługa stanów: loading, error, success, needsConfirmation
  - Warunkowe renderowanie:
    * Formularz (stan domyślny)
    * Komunikat "Sprawdź email" (gdy `needsEmailConfirmation=true`)
    * Komunikat "Konto utworzone" + auto-redirect (gdy nie wymaga potwierdzenia)
- **State management**:
  ```typescript
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  ```
- **Conditional rendering**: 3 stany widoku w zależności od wyniku rejestracji

**Komponent**: `src/components/auth/LogoutButton.tsx`
- **Typ**: Button z action handler
- **Odpowiedzialności**:
  - Wywołanie POST do `/api/auth/logout`
  - Obsługa stanu loading podczas wylogowywania
  - Redirect do strony głównej po sukcesie
  - Error handling w konsoli (non-blocking)
- **State management**: `const [loading, setLoading] = useState(false);`
- **Integracja**: Wykorzystywany w `DashboardLayout.astro`

**Nowy komponent**: `src/components/auth/ResetPasswordForm.tsx`
- **Typ**: Kontrolowany formularz React (do implementacji)
- **Odpowiedzialności**:
  - Pole email z walidacją
  - Wysyłanie żądania do `/api/auth/reset-password`
  - Wyświetlanie komunikatu o wysłaniu linku
  - Obsługa błędów
- **Uwaga**: Wymaga implementacji

**Nowy komponent**: `src/components/auth/GoogleLoginButton.tsx`
- **Typ**: Button z OAuth flow (do implementacji)
- **Odpowiedzialności**:
  - Inicjowanie OAuth flow przez Supabase Auth
  - Redirect do Google consent screen
  - Obsługa błędów inicjalizacji
- **Uwaga**: Wymaga implementacji

#### 2.1.3 Layouty

**Layout**: `src/layouts/BaseLayout.astro`
- **Typ**: Główny layout aplikacji
- **Odpowiedzialności**:
  - Struktura HTML (head, meta tags, scripts)
  - Importy Tailwind CSS
  - SEO meta tags (title, description)
  - Brak logiki autentykacji (używany przez public i protected pages)
- **Usage**: Wykorzystywany przez wszystkie strony jako wrapper

**Layout**: `src/layouts/DashboardLayout.astro`
- **Typ**: Layout dla chronionych stron
- **Odpowiedzialności**:
  - Nawigacja dashboardu (header z logo, menu, logout button)
  - Stylowanie obszaru chronionego (background, spacing)
  - Slot dla treści strony
  - Integracja `LogoutButton` (React component)
- **Struktura nawigacji**:
  - Logo + link do `/dashboard`
  - Link "Moje questy" → `/dashboard`
  - Przycisk "Generuj quest" → `/dashboard/generate`
  - Przycisk wylogowania (LogoutButton)
- **Usage**: Opakowuje wszystkie strony `/dashboard/*`

### 2.2 Warstwy odpowiedzialności

#### Astro Pages (Server-side)
- **Kontrola dostępu**: Sprawdzanie autentykacji przed renderowaniem
- **Redirecty**: Obsługa przekierowań na podstawie stanu autentykacji
- **Server-side data fetching**: Pobieranie danych użytkownika dla chronionych stron
- **SEO i meta tags**: Ustawienie właściwego title/description
- **Parametry URL**: Obsługa `?redirect=` dla zachowania kontekstu nawigacji

#### React Components (Client-side)
- **Interaktywność formularzy**: Stan pól, walidacja, submit
- **API komunikacja**: Wysyłanie żądań do endpointów `/api/auth/*`
- **User feedback**: Loading states, error messages, success states
- **Brak logiki biznesowej**: Komponenty tylko zarządzają UI i komunikują się z API

### 2.3 Walidacja i komunikaty błędów

#### Walidacja frontend (React)

**LoginForm**:
- Email: `type="email"` + `required` (HTML5)
- Password: `minLength={6}` + `required`
- Komunikaty błędów z API wyświetlane w alertbox

**RegisterForm**:
- Email: `type="email"` + `required`
- Password: `minLength={6}` + `required`
- ConfirmPassword: `minLength={6}` + `required`
- Custom validation: sprawdzenie czy `password === confirmPassword` przed wysłaniem
- Komunikaty:
  * "Hasła nie są identyczne" (client-side)
  * Błędy z API (np. "Email już zarejestrowany")

**ResetPasswordForm** (do implementacji):
- Email: `type="email"` + `required`
- Komunikat sukcesu: "Sprawdź swoją skrzynkę email"

#### Komunikaty błędów

**Style wizualny**: 
```tsx
<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
  {errorMessage}
</div>
```

**Przykładowe komunikaty**:
- "Nieprawidłowy email lub hasło" (login)
- "Wystąpił błąd podczas logowania" (ogólny błąd)
- "Hasła nie są identyczne" (rejestracja)
- "Nie udało się utworzyć konta" (rejestracja)
- "Email już zarejestrowany" (rejestracja)

**Komunikaty sukcesu**:
```tsx
<div className="p-6 bg-green-50 border border-green-200 rounded-lg">
  <h3 className="text-lg font-semibold text-green-900">Sukces!</h3>
  <p className="text-green-700">Komunikat...</p>
</div>
```

### 2.4 Scenariusze i flow użytkownika

#### Scenariusz 1: Nowy użytkownik - rejestracja

1. User wchodzi na `/` lub `/register`
2. Widzi `RegisterForm` (React)
3. Wypełnia: email, password, confirmPassword
4. Klika "Utwórz konto"
5. Frontend sprawdza zgodność haseł
6. Wysyła POST do `/api/auth/register`
7. Backend:
   - Waliduje dane (Zod)
   - Wywołuje `supabase.auth.signUp()`
   - Jeśli sukces i wymaga potwierdzenia → zwraca `needsEmailConfirmation: true`
   - Jeśli sukces i nie wymaga → zwraca sesję + ustawia cookies
8. Frontend:
   - Jeśli `needsEmailConfirmation`: wyświetla komunikat "Sprawdź email"
   - Jeśli nie: wyświetla "Konto utworzone" + redirect po 1.5s do `/dashboard`
9. Telemetria: Event `auth_signup` zapisany w bazie

#### Scenariusz 2: Powracający użytkownik - logowanie

1. User wchodzi na `/` lub `/login`
2. Widzi `LoginForm` (React)
3. Wypełnia: email, password
4. Klika "Zaloguj się"
5. Wysyła POST do `/api/auth/login`
6. Backend:
   - Waliduje dane (Zod)
   - Wywołuje `supabase.auth.signInWithPassword()`
   - Jeśli sukces → ustawia cookies (access + refresh token)
   - Zwraca user data
7. Frontend: Hard reload do `redirectTo` (zapewnia dostępność cookies)
8. Telemetria: Event `auth_login` zapisany w bazie

#### Scenariusz 3: Wylogowanie

1. User klika "Wyloguj się" w `LogoutButton`
2. Wysyła POST do `/api/auth/logout`
3. Backend:
   - Wywołuje `supabase.auth.signOut()`
   - Usuwa cookies (access + refresh token)
4. Frontend: Redirect do `/login` (zgodnie z US-004: "Użytkownik wraca do ekranu logowania")

#### Scenariusz 4: Reset hasła (do implementacji)

1. User klika "Zapomniałem hasła" na `/login`
2. Przechodzi do `/reset-password`
3. Widzi `ResetPasswordForm`
4. Wprowadza email
5. Wysyła POST do `/api/auth/reset-password`
6. Backend wywołuje `supabase.auth.resetPasswordForEmail()`
7. Frontend wyświetla "Sprawdź email"
8. User klika link w emailu → redirect do `/auth/callback?type=recovery`
9. Callback page renderuje formularz zmiany hasła
10. User ustawia nowe hasło → redirect do `/dashboard` (lista "Moje questy")

#### Scenariusz 5: Google OAuth (do implementacji)

1. User klika "Zaloguj się z Google" na `/login` lub `/register`
2. `GoogleLoginButton` wywołuje `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. User przekierowany do Google consent screen
4. Po akceptacji → redirect do `/auth/callback?code=...`
5. Callback page:
   - Wymienia kod na sesję przez Supabase
   - Ustawia cookies
   - Redirect do `/dashboard` (lista "Moje questy" zgodnie z US-003)
6. Telemetria: Event `auth_login` zapisany w bazie

#### Scenariusz 6: Dostęp do chronionej strony bez autentykacji

1. User próbuje wejść na `/dashboard/generate` (nie zalogowany)
2. Astro page wykonuje guard:
   ```typescript
   const { data: { user }, error } = await supabase.auth.getUser();
   if (error || !user) {
     return Astro.redirect('/login?redirect=/dashboard/generate');
   }
   ```
3. User przekierowany do `/login?redirect=/dashboard/generate`
4. Po zalogowaniu → automatyczny redirect do `/dashboard/generate`

#### Scenariusz 7: Zalogowany użytkownik próbuje wejść na /login lub /register

1. User wchodzi na `/login` lub `/register`
2. Astro page wykonuje check:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   if (user) {
     return Astro.redirect(redirectTo || '/dashboard');
   }
   ```
3. Automatyczny redirect do dashboardu (lista "Moje questy")

---

## 3. Logika backendowa

### 3.1 Middleware Astro

**Plik**: `src/middleware/index.ts`

**Odpowiedzialności**:
- Wykonywany dla każdego żądania HTTP
- Tworzenie instancji Supabase client z tokenem z ciasteczek lub headera Authorization
- Przypisanie client do `context.locals.supabase`
- Umożliwienie dostępu do autentykacji we wszystkich endpointach i stronach

**Implementacja**:
```typescript
export const onRequest = defineMiddleware((context, next) => {
  // 1. Próba pobrania tokenu z cookies (główny mechanizm dla web app)
  let accessToken = context.cookies.get('sb-access-token')?.value;
  
  // 2. Fallback: próba pobrania z Authorization header (dla API clients)
  if (!accessToken) {
    const authHeader = context.request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }
  }
  
  // 3. Utworzenie Supabase client (z tokenem lub bez)
  context.locals.supabase = createSupabaseClient(accessToken);
  
  return next();
});
```

**Kluczowe decyzje**:
- Token może pochodzić z 2 źródeł: cookies (web) lub Authorization header (API)
- Client tworzony z `autoRefreshToken: false`, `persistSession: false` (zarządzanie manualne)
- Każde żądanie ma własną instancję client (per-request isolation)

### 3.2 Endpointy API

#### 3.2.1 POST `/api/auth/register`

**Plik**: `src/pages/api/auth/register.ts`

**Odpowiedzialności**:
- Rejestracja nowego użytkownika email+hasło
- Walidacja danych wejściowych
- Utworzenie konta w Supabase Auth
- Ustawienie cookies sesji (jeśli nie wymaga potwierdzenia email)
- Zwrócenie informacji o użytkowniku

**Request Schema (Zod)**:
```typescript
const registerSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
});
```

**Przepływ**:
1. Parse request body jako JSON
2. Walidacja przez `registerSchema.parse(body)`
3. Wywołanie `supabase.auth.signUp({ email, password, options: { emailRedirectTo } })`
4. Jeśli `data.session` istnieje:
   - Ustawienie cookies: `sb-access-token` (7 dni), `sb-refresh-token` (30 dni)
   - `needsEmailConfirmation: false`
5. Jeśli brak `data.session`:
   - `needsEmailConfirmation: true`
6. Zwrócenie response:
   ```json
   {
     "success": true,
     "user": { "id": "...", "email": "..." },
     "needsEmailConfirmation": true/false
   }
   ```

**Response codes**:
- `201`: Sukces (konto utworzone)
- `400`: Błąd walidacji lub email już istnieje
- `500`: Błąd serwera

**Error handling**: Wszystkie błędy przetwarzane przez `handleError()` i zwracane w formacie `ApiError`

**Integracja z telemetrią**: 
- Po sukcesie: Trigger event `auth_signup` (obsługiwane przez trigger bazodanowy lub frontend)

#### 3.2.2 POST `/api/auth/login`

**Plik**: `src/pages/api/auth/login.ts`

**Odpowiedzialności**:
- Logowanie użytkownika email+hasło
- Walidacja credentials
- Utworzenie sesji
- Ustawienie cookies
- Zwrócenie informacji o użytkowniku

**Request Schema (Zod)**:
```typescript
const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
});
```

**Przepływ**:
1. Parse request body jako JSON
2. Walidacja przez `loginSchema.parse(body)`
3. Wywołanie `supabase.auth.signInWithPassword({ email, password })`
4. Jeśli błąd → zwrot 401 z komunikatem "Nieprawidłowy email lub hasło"
5. Jeśli sukces:
   - Ustawienie cookies: `sb-access-token` (7 dni), `sb-refresh-token` (30 dni)
   - Zwrócenie user data
6. Response:
   ```json
   {
     "success": true,
     "user": { "id": "...", "email": "..." }
   }
   ```

**Response codes**:
- `200`: Sukces (zalogowano)
- `401`: Nieprawidłowe credentials
- `400`: Błąd walidacji
- `500`: Błąd serwera

**Cookies configuration**:
```typescript
{
  path: '/',
  httpOnly: true,              // Bezpieczeństwo: niedostępne z JS
  secure: import.meta.env.PROD, // HTTPS only w production
  sameSite: 'lax',             // CSRF protection
  maxAge: 60 * 60 * 24 * 7     // 7 dni dla access, 30 dla refresh
}
```

**Integracja z telemetrią**: 
- Po sukcesie: Trigger event `auth_login`

#### 3.2.3 POST `/api/auth/logout`

**Plik**: `src/pages/api/auth/logout.ts`

**Odpowiedzialności**:
- Wylogowanie użytkownika
- Usunięcie sesji w Supabase
- Usunięcie cookies

**Przepływ**:
1. Wywołanie `supabase.auth.signOut()`
2. Usunięcie cookies: `cookies.delete('sb-access-token')`, `cookies.delete('sb-refresh-token')`
3. Response:
   ```json
   { "success": true }
   ```

**Response codes**:
- `200`: Sukces (wylogowano)
- `500`: Błąd serwera (rzadkie, non-critical)

**Uwagi**: Endpoint zawsze zwraca sukces, nawet jeśli użytkownik nie był zalogowany

#### 3.2.4 GET `/api/auth/me`

**Plik**: `src/pages/api/auth/me.ts`

**Odpowiedzialności**:
- Zwrócenie informacji o aktualnie zalogowanym użytkowniku
- Weryfikacja autentykacji
- Endpoint dla frontend do sprawdzenia stanu sesji

**Przepływ**:
1. Wywołanie `getAuthUser(supabase)` (helper function)
2. Helper sprawdza `supabase.auth.getUser()`
3. Jeśli brak użytkownika → throw AppError 401
4. Jeśli user OK → zwrócenie danych:
   ```json
   {
     "user": {
       "id": "...",
       "email": "...",
       "created_at": "..."
     }
   }
   ```

**Response codes**:
- `200`: Sukces (user zwrócony)
- `401`: Brak autentykacji

**Usage**: Wykorzystywany przez frontend do sprawdzenia sesji lub pobrania danych użytkownika

#### 3.2.5 POST `/api/auth/reset-password` (do implementacji)

**Odpowiedzialności**:
- Wysłanie linku resetowania hasła na email
- Walidacja email
- Wywołanie Supabase Auth recovery flow

**Request Schema**:
```typescript
const resetSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
});
```

**Przepływ**:
1. Parse i walidacja email
2. Wywołanie `supabase.auth.resetPasswordForEmail(email, { redirectTo: '...' })`
3. Zwrot sukcesu (nawet jeśli email nie istnieje - security best practice)
4. Response:
   ```json
   { "success": true, "message": "Jeśli email istnieje, wysłaliśmy link resetowania" }
   ```

**Response codes**:
- `200`: Zawsze sukces (nie ujawniamy czy email istnieje)

#### 3.2.6 POST `/api/auth/update-password` (do implementacji)

**Odpowiedzialności**:
- Aktualizacja hasła po kliknięciu w link resetowania
- Walidacja nowego hasła
- Wymaga ważnego recovery token

**Request Schema**:
```typescript
const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
});
```

**Przepływ**:
1. Parse i walidacja haseł
2. Wywołanie `supabase.auth.updateUser({ password: newPassword })`
3. Zwrot sukcesu
4. Response:
   ```json
   { "success": true, "message": "Hasło zostało zmienione" }
   ```

**Response codes**:
- `200`: Sukces
- `400`: Błąd walidacji
- `401`: Brak ważnego recovery token

### 3.3 Helper functions

**Plik**: `src/lib/auth.ts`

#### `requireAuth(supabase: SupabaseClient): Promise<string>`

**Odpowiedzialności**:
- Weryfikacja autentykacji
- Zwrócenie user ID jeśli OK
- Throw AppError(401) jeśli brak autentykacji

**Usage**: W endpointach API wymagających autentykacji
```typescript
const userId = await requireAuth(locals.supabase);
```

**Implementacja**:
```typescript
export async function requireAuth(supabase: SupabaseClient): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new AppError(401, 'unauthorized', 'Wymagane uwierzytelnienie');
  }
  
  return user.id;
}
```

#### `getAuthUser(supabase: SupabaseClient)`

**Odpowiedzialności**:
- Weryfikacja autentykacji
- Zwrócenie pełnego obiektu user jeśli OK
- Throw AppError(401) jeśli brak autentykacji

**Usage**: Gdy potrzebujemy pełnych danych użytkownika (email, metadata)
```typescript
const user = await getAuthUser(locals.supabase);
console.log(user.email);
```

### 3.4 Server-side rendering i guards

**Pattern dla stron publicznych z redirect guard**:
```typescript
// src/pages/login.astro
const supabase = Astro.locals.supabase;
const { data: { user } } = await supabase.auth.getUser();
const redirectTo = Astro.url.searchParams.get('redirect') || '/dashboard/generate';

if (user) {
  return Astro.redirect(redirectTo);
}
```

**Pattern dla stron chronionych**:
```typescript
// src/pages/dashboard/*.astro
const supabase = Astro.locals.supabase;
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  return Astro.redirect(`/login?redirect=${Astro.url.pathname}`);
}

// Kontynuuj renderowanie z dostępem do `user`
```

**Kluczowe zasady**:
1. Guard zawsze na początku frontmatter Astro page
2. Wykorzystanie `Astro.locals.supabase` (z middleware)
3. Parametr `redirect` zachowuje kontekst nawigacji
4. Hard return z `Astro.redirect()` - nie renderujemy treści dla nieautoryzowanych

---

## 4. System autentykacji

### 4.1 Integracja Supabase Auth z Astro

#### Konfiguracja Supabase Client

**Plik**: `src/db/supabase.client.ts`

**Factory function**:
```typescript
export function createSupabaseClient(accessToken?: string): SupabaseClient {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,  // Manualne zarządzanie refreshem
      persistSession: false,    // Brak localStorage persistence
      detectSessionInUrl: false, // Nie używamy hash-based session
    },
    global: {
      headers: accessToken 
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
    },
  });
}
```

**Uzasadnienie konfiguracji**:
- `autoRefreshToken: false`: Astro SSR nie ma persistent client, refresh obsługiwany przez backend
- `persistSession: false`: Sesje w httpOnly cookies, nie localStorage
- `detectSessionInUrl: false`: Używamy cookies, nie URL hash

**Export types**:
```typescript
export type SupabaseClient = SupabaseClientBase<Database>;
```

**Usage w kodzie**:
- Middleware: Tworzy client z tokenem z cookies
- API endpoints: Używają `locals.supabase` z middleware
- Astro pages: Używają `Astro.locals.supabase`

#### 4.2 Przepływ sesji

**Lifecycle sesji**:

1. **Logowanie/Rejestracja**:
   - Supabase Auth zwraca `session` object: `{ access_token, refresh_token, expires_in, ... }`
   - Backend ustawia cookies:
     * `sb-access-token`: JWT token (7 dni maxAge)
     * `sb-refresh-token`: Refresh token (30 dni maxAge)
   - Cookies są httpOnly, secure (prod), sameSite=lax

2. **Każde żądanie**:
   - Middleware czyta `sb-access-token` z cookies
   - Tworzy Supabase client z tym tokenem
   - Client automatycznie dołącza token do żądań do Supabase

3. **Weryfikacja autentykacji**:
   - `supabase.auth.getUser()` weryfikuje token przez Supabase API
   - Jeśli token valid → zwraca user object
   - Jeśli expired/invalid → zwraca error

4. **Refresh tokenu** (opcjonalne - do implementacji):
   - Gdy access token wygasa, można użyć refresh token
   - Wywołanie `supabase.auth.refreshSession({ refresh_token })`
   - Aktualizacja cookies z nowymi tokenami

5. **Wylogowanie**:
   - Wywołanie `supabase.auth.signOut()`
   - Usunięcie cookies po stronie backendu
   - Sesja unieważniona w Supabase

**Diagram przepływu sesji**:
```
User Login → Supabase Auth → Backend Sets Cookies → User Authenticated
                                     ↓
                            Each Request: Middleware reads cookies
                                     ↓
                            Creates Supabase Client with token
                                     ↓
                            API/Pages verify auth via getUser()
                                     ↓
                            User Logout → Clear Cookies → Session Ended
```

### 4.3 OAuth Flow (Google - do implementacji)

**Konfiguracja w Supabase Dashboard**:
1. Enable Google provider
2. Dodanie Client ID i Client Secret z Google Cloud Console
3. Konfiguracja Authorized redirect URIs: `https://[projekt].supabase.co/auth/v1/callback`

**Implementacja w kodzie**:

**Komponent**: `src/components/auth/GoogleLoginButton.tsx`
```typescript
const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) {
    setError(error.message);
  }
  // User zostanie przekierowany do Google
};
```

**Callback page**: `src/pages/auth/callback.astro`
```typescript
---
// Supabase automatycznie obsługuje callback URL i wymienia kod na sesję
const supabase = Astro.locals.supabase;
const { data: { session }, error } = await supabase.auth.getSession();

if (error || !session) {
  return Astro.redirect('/login?error=oauth_failed');
}

// Ustawienie cookies z sesją
Astro.cookies.set('sb-access-token', session.access_token, { ... });
Astro.cookies.set('sb-refresh-token', session.refresh_token, { ... });

// Redirect do dashboardu (lista "Moje questy" zgodnie z US-003)
return Astro.redirect('/dashboard');
---
```

**Uwagi**:
- OAuth flow zarządzany przez Supabase (redirect, consent, callback)
- Aplikacja tylko inicjuje i obsługuje callback
- Sesja tworzona automatycznie przez Supabase
- Telemetria: Event `auth_login` z OAuth provider info

### 4.4 Email confirmation flow

**Gdy włączone w Supabase** (`Enable Email Confirmations`):

1. **Rejestracja**:
   - `signUp()` zwraca user ale bez `session`
   - Backend zwraca `needsEmailConfirmation: true`
   - Frontend pokazuje "Sprawdź email"

2. **Email z linkiem**:
   - Supabase wysyła email z tokenem
   - Link: `https://[projekt].supabase.co/auth/v1/verify?token=...&type=signup&redirect_to=...`

3. **Callback po kliknięciu**:
   - User kliknie link → redirect do Supabase → redirect do `emailRedirectTo`
   - W `emailRedirectTo` (np. `/dashboard/generate`) user już ma sesję
   - Middleware automatycznie wykryje token i utworzy client

**Gdy wyłączone** (dev/testing):
- `signUp()` zwraca `session` od razu
- Backend ustawia cookies
- Frontend automatycznie loguje użytkownika

**Rekomendacja dla MVP**:
- Development: Wyłączone (szybsze testowanie)
- Production: Włączone (bezpieczeństwo)

### 4.5 Bezpieczeństwo tokenów

**Access Token (JWT)**:
- **Format**: JWT signed by Supabase
- **Zawartość**: user_id, email, role, exp (expiration)
- **Ważność**: Domyślnie 1 godzina (konfigurowalny w Supabase)
- **Storage**: httpOnly cookie `sb-access-token`
- **Purpose**: Autentykacja każdego żądania

**Refresh Token**:
- **Format**: Opaque token (random string)
- **Ważność**: Domyślnie nieokreślona (lub długa, np. 30 dni)
- **Storage**: httpOnly cookie `sb-refresh-token`
- **Purpose**: Odnowienie access token bez ponownego logowania

**Bezpieczeństwo cookies**:
```typescript
{
  httpOnly: true,  // Niedostępne z JavaScript (XSS protection)
  secure: true,    // Tylko HTTPS w production (MITM protection)
  sameSite: 'lax', // CSRF protection (nie wysyłane cross-site poza GET)
  path: '/',       // Dostępne dla całej aplikacji
}
```

**Ochrona przed atakami**:
- **XSS**: httpOnly cookies nie są dostępne z JavaScript
- **CSRF**: sameSite=lax + Supabase własna ochrona
- **MITM**: secure flag wymusza HTTPS w production
- **Session Fixation**: Nowa sesja przy każdym logowaniu

---

## 5. Walidacja i obsługa błędów

### 5.1 Walidacja danych wejściowych

**Zod schemas w endpointach**:

**Rejestracja**:
```typescript
const registerSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
});
```

**Logowanie**:
```typescript
const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
});
```

**Proces walidacji**:
1. `registerSchema.parse(body)` - rzuca `ZodError` jeśli niepoprawne
2. `ZodError` przechwytywany przez `handleError()`
3. Zwracany jako response 400 z szczegółami błędów

### 5.2 Error handling infrastructure

**Plik**: `src/lib/errors.ts`

**AppError class**:
```typescript
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}
```

**handleError function**:
```typescript
export function handleError(error: unknown): {
  status: number;
  body: ApiError;
} {
  // AppError
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        error: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }
  
  // ZodError
  if (error instanceof z.ZodError) {
    return {
      status: 400,
      body: {
        error: 'validation_error',
        message: 'Błąd walidacji danych',
        details: error.errors,
      },
    };
  }
  
  // Generic error
  return {
    status: 500,
    body: {
      error: 'internal_error',
      message: 'Wystąpił nieoczekiwany błąd',
    },
  };
}
```

**Usage w endpointach**:
```typescript
try {
  // ... logika
} catch (error) {
  const errorResponse = handleError(error);
  return new Response(JSON.stringify(errorResponse.body), {
    status: errorResponse.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### 5.3 Standardowe błędy autentykacji

**401 Unauthorized**:
```json
{
  "error": "unauthorized",
  "message": "Wymagane uwierzytelnienie"
}
```

**400 Bad Request (błędne dane logowania)**:
```json
{
  "error": "auth_error",
  "message": "Nieprawidłowy email lub hasło"
}
```

**400 Bad Request (walidacja)**:
```json
{
  "error": "validation_error",
  "message": "Błąd walidacji danych",
  "details": [
    {
      "code": "too_small",
      "minimum": 6,
      "path": ["password"],
      "message": "Hasło musi mieć co najmniej 6 znaków"
    }
  ]
}
```

**400 Bad Request (email już istnieje)**:
```json
{
  "error": "registration_error",
  "message": "Email jest już zarejestrowany"
}
```

**500 Internal Server Error**:
```json
{
  "error": "internal_error",
  "message": "Wystąpił nieoczekiwany błąd"
}
```

### 5.4 Obsługa błędów po stronie frontendu

**Pattern w komponentach React**:
```typescript
try {
  const response = await fetch('/api/auth/login', { ... });
  const data = await response.json();
  
  if (!response.ok) {
    const errorMessage = data.error?.message || 'Wystąpił błąd';
    setError(errorMessage);
    return;
  }
  
  // Success flow
} catch (err) {
  setError('Wystąpił błąd podczas logowania');
}
```

**Wyświetlanie błędów**:
```tsx
{error && (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
    {error}
  </div>
)}
```

### 5.5 Edge cases i scenariusze graniczne

**Email już zarejestrowany**:
- Supabase zwraca błąd z kodem `user_already_exists`
- Backend mapuje na 400 z komunikatem "Email jest już zarejestrowany"
- Frontend wyświetla komunikat w formularzu

**Nieprawidłowe credentials**:
- Supabase zwraca błąd `invalid_credentials`
- Backend zwraca ogólny komunikat "Nieprawidłowy email lub hasło" (security best practice - nie ujawniamy czy email istnieje)

**Wygasła sesja podczas przeglądania**:
- `getUser()` zwraca error
- Strona chroniona wykrywa brak autentykacji w guard
- Redirect do `/login?redirect=[current-page]`

**Network error podczas logowania**:
- Frontend catch block w `try/catch`
- Wyświetlenie komunikatu "Wystąpił błąd podczas logowania"
- User może spróbować ponownie

**Cookies zablokowane przez przeglądarkę**:
- Backend ustawia cookies, ale przeglądarka je blokuje
- Następne żądanie nie będzie zawierało tokenu
- Middleware utworzy client bez tokenu
- Strony chronione wykryją brak autentykacji
- **Mitigacja**: Informacja dla użytkownika o konieczności włączenia cookies

---

## 6. Bezpieczeństwo

### 6.1 Ochrona przed podstawowymi atakami

**XSS (Cross-Site Scripting)**:
- **Ochrona**: httpOnly cookies (tokeny niedostępne z JavaScript)
- **Ochrona**: React automatyczne escapowanie w JSX
- **Ochrona**: Brak `dangerouslySetInnerHTML` w komponentach auth

**CSRF (Cross-Site Request Forgery)**:
- **Ochrona**: `sameSite: 'lax'` na cookies (nie wysyłane cross-origin poza GET)
- **Ochrona**: Supabase Auth własna ochrona CSRF
- **Ochrona**: Origin checking w Astro

**MITM (Man-in-the-Middle)**:
- **Ochrona**: `secure: true` w production (cookies tylko HTTPS)
- **Ochrona**: Wymóg HTTPS w deployment (DigitalOcean/Vercel auto-SSL)

**SQL Injection**:
- **Ochrona**: Supabase Client używa prepared statements
- **Ochrona**: Row Level Security (RLS) na poziomie bazy

**Session Fixation**:
- **Ochrona**: Nowa sesja tworzona przy każdym logowaniu
- **Ochrona**: Token rotation przy refresh

### 6.2 Walidacja i sanitizacja

**Email**:
- Walidacja przez Zod: `z.string().email()`
- Normalizacja: Supabase automatycznie lowercase
- Brak dodatkowej sanityzacji (email jako primary key)

**Password**:
- Minimum 6 znaków (MVP - można zwiększyć w production)
- **Nie przechowywane plain text**: Supabase haszuje przez bcrypt
- **Nie logowane**: Hasła nigdy nie pojawiają się w logach
- Brak maksymalnej długości (Supabase akceptuje do 72 znaków)

**User input w formularzach**:
- React automatycznie escapuje wartości w JSX
- Brak możliwości injection przez formularz

### 6.3 Rate limiting i throttling

**Status**: **WYMAGANE w MVP** (US-024: "Throttling przy wielokrotnych nieudanych próbach logowania")

**Implementacja wymagana**:

**Endpoint `/api/auth/login`**:
- Limit: 5 prób na email w ciągu 15 minut
- Implementacja: Redis lub in-memory store z tracking po IP + email
- Response: 429 Too Many Requests z `retry_after` w sekundach

**Endpoint `/api/auth/register`**:
- Limit: 3 rejestracje na IP w ciągu godziny
- Zapobiega automatycznej rejestracji botów

**Implementacja (przykład)**:
```typescript
// src/lib/rate-limiter.ts
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  // Implementation using Redis or memory store
}

// Usage w endpoint
const { allowed, retryAfter } = await checkRateLimit(
  `login:${email}:${ip}`,
  5,
  15 * 60
);

if (!allowed) {
  return new Response(JSON.stringify({
    error: 'rate_limit_exceeded',
    message: 'Zbyt wiele prób. Spróbuj ponownie później.',
    retry_after: retryAfter,
  }), { status: 429 });
}
```

### 6.4 Password recovery security

**Best practices**:
- Link resetowania valid tylko przez krótki czas (domyślnie 1h w Supabase)
- Token jednorazowy (nie może być użyty ponownie)
- Email wysyłany tylko jeśli konto istnieje (ale nie ujawniamy tego w response - security)
- Nowe hasło musi być różne od starego (opcjonalne - do implementacji)

**Flow bezpieczeństwa**:
1. User żąda resetu → zawsze zwracamy sukces (nie ujawniamy czy email istnieje)
2. Jeśli email istnieje → Supabase wysyła link
3. Link zawiera token recovery → valid 1h
4. Po użyciu token jest invalidated
5. Stare sesje pozostają valid (opcjonalnie można je invalidować)

### 6.5 Compliance i GDPR

**Minimalizacja danych**:
- Przechowywane tylko: `user_id` (UUID), `email`, `password_hash`
- Brak danych osobowych dzieci (zgodnie z PRD)
- Brak IP logging (opcjonalnie w telemetrii - zanonimizowane)

**Prawo do usunięcia**:
- `ON DELETE CASCADE` w foreign keys (profiles, quests, events)
- Usunięcie konta w Supabase Auth automatycznie usuwa wszystkie powiązane dane
- Implementacja endpoint `/api/account/delete` (poza zakresem MVP)

**Transparentność**:
- Jasne komunikaty o wysyłaniu emaili
- Privacy policy link (do implementacji w footer)

---

## 7. Integracja z telemetrią

### 7.1 Eventy autentykacji

**Event `auth_signup`** (Rejestracja):
```typescript
{
  user_id: string,
  event_type: 'auth_signup',
  event_data: {
    method: 'email' | 'google',
    needs_confirmation: boolean,
  },
  app_version: string | null,
  created_at: timestamp,
}
```

**Gdzie zapisywany**:
- Opcja 1: Trigger bazodanowy po INSERT do `auth.users`
- Opcja 2: Endpoint `/api/auth/register` po sukcesie
- Opcja 3: Frontend po otrzymaniu sukcesu (mniej pewne)

**Event `auth_login`** (Logowanie):
```typescript
{
  user_id: string,
  event_type: 'auth_login',
  event_data: {
    method: 'email' | 'google',
  },
  app_version: string | null,
  created_at: timestamp,
}
```

**Gdzie zapisywany**:
- Opcja 1: Trigger bazodanowy po UPDATE `auth.users.last_sign_in_at`
- Opcja 2: Endpoint `/api/auth/login` po sukcesie
- Rekomendacja: Backend endpoint (pełna kontrola)

### 7.2 Implementacja trackingu

**TelemetryService** (`src/lib/telemetry-service.ts`):

```typescript
export class TelemetryService {
  async trackAuthSignup(
    userId: string,
    method: 'email' | 'google',
    needsConfirmation: boolean,
    appVersion?: string
  ): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'auth_signup',
        event_data: { method, needs_confirmation: needsConfirmation },
        app_version: appVersion,
      });
    } catch (error) {
      console.error('Failed to track auth_signup:', error);
      // Non-fatal - nie przerywamy flow
    }
  }

  async trackAuthLogin(
    userId: string,
    method: 'email' | 'google',
    appVersion?: string
  ): Promise<void> {
    try {
      await this.createEvent(userId, {
        event_type: 'auth_login',
        event_data: { method },
        app_version: appVersion,
      });
    } catch (error) {
      console.error('Failed to track auth_login:', error);
    }
  }
}
```

**Usage w endpointach**:
```typescript
// /api/auth/register
const telemetry = new TelemetryService(locals.supabase);
await telemetry.trackAuthSignup(
  data.user.id,
  'email',
  !data.session,
  body.app_version
);
```

### 7.3 Metryki autentykacji

**Time-to-First-Start**:
- Mierzone jako czas od pierwszego `auth_signup` do pierwszego `quest_started`
- Implementacja: Query joining `events` table
- Cel: < 5 minut

**Registration funnel**:
- % użytkowników, którzy ukończyli rejestrację (signup → first login)
- Tracking przez eventy `auth_signup` i `auth_login`

**Login success rate**:
- % udanych loginów vs błędy autentykacji
- Wymaga trackingu błędów (opcjonalne w MVP)

---

## 8. Przepływy użytkownika

### 8.1 Diagram: Rejestracja email+hasło

```
┌─────────────────────────────────────────────────────────────┐
│ User wchodzi na /register                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Astro SSR: Sprawdza czy user już zalogowany                 │
│   - locals.supabase.auth.getUser()                          │
│   - Jeśli TAK → redirect do /dashboard/generate             │
│   - Jeśli NIE → renderuj stronę z RegisterForm              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ User wypełnia formularz (RegisterForm - React)               │
│   - email (type="email", required)                          │
│   - password (minLength=6, required)                        │
│   - confirmPassword (minLength=6, required)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ User klika "Utwórz konto"                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Walidacja client-side                             │
│   - Sprawdza czy password === confirmPassword               │
│   - Jeśli NIE → wyświetla błąd "Hasła nie są identyczne"   │
│   - Jeśli TAK → wysyła POST do /api/auth/register           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend: /api/auth/register endpoint                        │
│   1. Parse JSON body                                        │
│   2. Walidacja Zod schema                                   │
│   3. supabase.auth.signUp({ email, password })              │
│   4. Jeśli data.session istnieje:                           │
│      - Ustawia cookies (access + refresh token)             │
│      - needsEmailConfirmation = false                       │
│   5. Jeśli brak data.session:                               │
│      - needsEmailConfirmation = true                        │
│   6. Track event auth_signup (telemetria)                   │
│   7. Zwraca response 201 Created                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Obsługa response                                  │
│   - Jeśli needsEmailConfirmation:                           │
│     → Wyświetla komunikat "Sprawdź email"                   │
│   - Jeśli nie:                                              │
│     → Wyświetla "Konto utworzone"                           │
│     → Redirect po 1.5s do /dashboard (lista "Moje questy") │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Diagram: Logowanie email+hasło

```
┌─────────────────────────────────────────────────────────────┐
│ User wchodzi na /login                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Astro SSR: Sprawdza czy user już zalogowany                 │
│   - Jeśli TAK → redirect do miejsca docelowego              │
│   - Jeśli NIE → renderuj LoginForm                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ User wypełnia formularz (LoginForm - React)                 │
│   - email (type="email", required)                          │
│   - password (minLength=6, required)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ User klika "Zaloguj się"                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: POST do /api/auth/login                           │
│   - credentials: 'include' (important!)                     │
│   - body: { email, password, redirectTo }                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend: /api/auth/login endpoint                           │
│   1. Parse JSON body                                        │
│   2. Walidacja Zod schema                                   │
│   3. supabase.auth.signInWithPassword({ email, password })  │
│   4. Jeśli error → zwraca 401 "Nieprawidłowy email/hasło"  │
│   5. Jeśli sukces:                                          │
│      - Ustawia cookies (access + refresh token)             │
│      - Track event auth_login                               │
│      - Zwraca 200 OK z user data                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Hard reload do redirectTo                         │
│   - window.location.replace(redirectTo)                     │
│   - Zapewnia dostępność cookies w następnym żądaniu         │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Diagram: Wylogowanie

```
┌─────────────────────────────────────────────────────────────┐
│ User klika "Wyloguj się" (LogoutButton)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: POST do /api/auth/logout                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend: /api/auth/logout endpoint                          │
│   1. supabase.auth.signOut()                                │
│   2. cookies.delete('sb-access-token')                      │
│   3. cookies.delete('sb-refresh-token')                     │
│   4. Zwraca 200 OK                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Redirect do ekranu logowania (US-004)             │
│   - window.location.href = '/login'                         │
└─────────────────────────────────────────────────────────────┘
```

### 8.4 Diagram: Reset hasła (flow kompletny)

```
┌─────────────────────────────────────────────────────────────┐
│ User klika "Zapomniałem hasła" na /login                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Redirect do /reset-password                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ User wpisuje email w ResetPasswordForm                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: POST do /api/auth/reset-password                  │
│   - body: { email }                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend: /api/auth/reset-password                           │
│   1. Walidacja email                                        │
│   2. supabase.auth.resetPasswordForEmail(email, {           │
│        redirectTo: 'https://app.com/auth/update-password'   │
│      })                                                      │
│   3. Zwraca 200 OK (zawsze, nawet jeśli email nie istnieje) │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Wyświetla "Sprawdź email"                         │
└─────────────────────────────────────────────────────────────┘
                     │
                     │ (User sprawdza email)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Supabase wysyła email z linkiem recovery                    │
│   - Link: https://[project].supabase.co/auth/v1/verify?... │
│   - Po kliknięciu → redirect do redirectTo z tokenem        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ User klika link → redirect do /auth/update-password         │
│   - URL zawiera access_token i refresh_token w hash         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Strona /auth/update-password                                │
│   1. Astro SSR wyciąga token z URL                          │
│   2. Tworzy sesję z tokenem                                 │
│   3. Ustawia cookies                                        │
│   4. Renderuje formularz zmiany hasła                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ User wpisuje nowe hasło (2x) i klika "Zmień hasło"         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: POST do /api/auth/update-password                 │
│   - body: { password, confirmPassword }                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend: /api/auth/update-password                          │
│   1. Walidacja haseł (zgodność, długość)                    │
│   2. supabase.auth.updateUser({ password })                 │
│   3. Zwraca 200 OK                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Redirect do /dashboard (lista "Moje questy")      │
│   - User zalogowany z nowym hasłem                          │
└─────────────────────────────────────────────────────────────┘
```

### 8.5 Diagram: Google OAuth flow

```
┌─────────────────────────────────────────────────────────────┐
│ User klika "Zaloguj się z Google"                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: GoogleLoginButton                                 │
│   - supabase.auth.signInWithOAuth({                         │
│       provider: 'google',                                   │
│       options: { redirectTo: '/auth/callback' }             │
│     })                                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Redirect do Google OAuth consent screen                     │
│   - User wybiera konto Google                               │
│   - Akceptuje permissions                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Google redirect do Supabase callback URL                    │
│   - https://[project].supabase.co/auth/v1/callback?code=... │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Supabase wymienia kod na sesję                              │
│   - Tworzy user w auth.users (jeśli nie istnieje)           │
│   - Generuje access + refresh token                         │
│   - Redirect do /auth/callback (app)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Strona /auth/callback (Astro)                               │
│   1. supabase.auth.getSession() - pobiera sesję             │
│   2. Jeśli error → redirect do /login?error=oauth_failed    │
│   3. Jeśli sukces:                                          │
│      - Ustawia cookies (access + refresh)                   │
│      - Track event auth_login (method: 'google')            │
│      - Redirect do /dashboard (lista "Moje questy" US-003) │
└─────────────────────────────────────────────────────────────┘
```

### 8.6 Diagram: Dostęp do chronionej strony

```
┌─────────────────────────────────────────────────────────────┐
│ User próbuje wejść na /dashboard/generate                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Middleware (każde żądanie):                                 │
│   1. Czyta cookies: sb-access-token                         │
│   2. Tworzy Supabase client z tokenem                       │
│   3. Przypisuje do context.locals.supabase                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Astro page /dashboard/generate.astro:                       │
│   1. const { data: { user }, error } =                      │
│        await locals.supabase.auth.getUser()                 │
│   2. Sprawdza czy user istnieje                             │
└────────────────────┬────────────────────────────────────────┘
                     │
             ┌───────┴────────┐
             │                │
     User exists?         No user
             │                │
             ▼                ▼
┌──────────────────┐  ┌────────────────────────────────┐
│ Renderuj stronę  │  │ return Astro.redirect(         │
│ z danymi usera   │  │   '/login?redirect=/dashboard  │
│                  │  │     /generate'                 │
│                  │  │ )                              │
└──────────────────┘  └────────────────────────────────┘
                                │
                                ▼
                      ┌────────────────────────────────┐
                      │ User przekierowany do /login   │
                      │ Po zalogowaniu → automatyczny  │
                      │ redirect do /dashboard/generate│
                      └────────────────────────────────┘
```

---

## 9. Checklist implementacji

### 9.1 Komponenty już zaimplementowane ✅

- [x] Middleware Astro (`src/middleware/index.ts`)
- [x] Supabase client factory (`src/db/supabase.client.ts`)
- [x] Auth helpers (`src/lib/auth.ts`): `requireAuth()`, `getAuthUser()`
- [x] Error handling (`src/lib/errors.ts`): `AppError`, `handleError()`
- [x] Type definitions (`src/types.ts`): DTOs dla auth
- [x] LoginForm component (`src/components/auth/LoginForm.tsx`)
- [x] RegisterForm component (`src/components/auth/RegisterForm.tsx`)
- [x] LogoutButton component (`src/components/auth/LogoutButton.tsx`)
- [x] Login page (`src/pages/login.astro`)
- [x] Register page (`src/pages/register.astro`)
- [x] BaseLayout (`src/layouts/BaseLayout.astro`)
- [x] DashboardLayout (`src/layouts/DashboardLayout.astro`)
- [x] POST `/api/auth/register` endpoint
- [x] POST `/api/auth/login` endpoint
- [x] POST `/api/auth/logout` endpoint
- [x] GET `/api/auth/me` endpoint
- [x] Landing page (`src/pages/index.astro`) z redirect guard
- [x] Dashboard pages z auth guards (`src/pages/dashboard/*.astro`)

### 9.2 Komponenty do implementacji 🚧

#### US-005: Reset hasła
- [ ] `src/components/auth/ResetPasswordForm.tsx` - Formularz żądania resetu
- [ ] `src/components/auth/UpdatePasswordForm.tsx` - Formularz nowego hasła
- [ ] `src/pages/reset-password.astro` - Strona resetu hasła
- [ ] `src/pages/auth/update-password.astro` - Strona zmiany hasła po kliknięciu linku
- [ ] `POST /api/auth/reset-password` - Endpoint wysyłki linku
- [ ] `POST /api/auth/update-password` - Endpoint zmiany hasła

#### US-003: Google OAuth
- [ ] `src/components/auth/GoogleLoginButton.tsx` - Przycisk Google login
- [ ] `src/pages/auth/callback.astro` - OAuth callback handler
- [ ] Konfiguracja Google OAuth w Supabase Dashboard
- [ ] Integracja przycisku w `/login` i `/register` pages
- [ ] Telemetria dla OAuth login (method: 'google')

#### Bezpieczeństwo (WYMAGANE w MVP)
- [ ] **Rate limiting dla `/api/auth/login`** (5 prób / 15 min) - **US-024**
- [ ] Email verification w production (włączenie w Supabase)

#### Ulepszenia bezpieczeństwa (opcjonalne dla MVP)
- [ ] Rate limiting dla `/api/auth/register` (3 rejestracje / IP / h) - dodatkowa ochrona
- [ ] Password strength meter w RegisterForm
- [ ] Account deletion endpoint (GDPR)

#### Telemetria
- [ ] Implementacja triggerów dla `auth_signup` i `auth_login`
- [ ] Dashboard raportowania metryk autentykacji

### 9.3 Konfiguracja środowiska

**Environment variables** (`.env`):
```bash
PUBLIC_SUPABASE_URL=https://[project].supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Supabase Dashboard configuration**:
- [ ] Email templates (confirmation, password reset)
- [ ] JWT expiration (domyślnie 1h)
- [ ] Enable/disable email confirmation
- [ ] OAuth providers (Google) - client ID, secret
- [ ] Redirect URLs whitelist

**Deployment checklist**:
- [ ] HTTPS wymuszony (secure cookies)
- [ ] Environment variables w production
- [ ] CORS settings (jeśli API publiczne)
- [ ] Monitoring logów błędów autentykacji

---

## 10. Podsumowanie i wnioski

### 10.1 Kluczowe decyzje architektoniczne

1. **Middleware-based auth**: Każde żądanie tworzy nowy Supabase client z tokenem z cookies - zapewnia izolację i prostotę
2. **httpOnly cookies**: Tokeny przechowywane bezpiecznie, niedostępne z JavaScript
3. **Server-side guards**: Kontrola dostępu na poziomie Astro pages przed renderowaniem
4. **React dla interaktywności**: Formularze jako kontrolowane komponenty React z pełnym zarządzaniem stanem
5. **Zod validation**: Walidacja zarówno w endpointach jak i możliwa do reużycia w frontend
6. **Centralized error handling**: Ujednolicone formatowanie błędów przez `handleError()`

### 10.2 Zalety obecnego rozwiązania

- **Bezpieczeństwo**: httpOnly cookies, sameSite protection, secure flag
- **Developer experience**: TypeScript + Zod zapewnia type safety
- **Prostota**: Minimalna konfiguracja, Supabase zarządza większością flow
- **Skalowalność**: Middleware pattern skaluje się z dodawaniem nowych endpoints
- **SEO-friendly**: Server-side rendering z proper redirects

### 10.3 Obszary do poprawy w przyszłości

1. **Rate limiting**: Implementacja ochrony przed brute-force
2. **Session refresh**: Automatyczne odświeżanie sesji gdy access token wygasa
3. **Multi-device support**: Lista aktywnych sesji, możliwość wylogowania z innych urządzeń
4. **2FA**: Dwuetapowa weryfikacja (poza MVP)
5. **Social auth providers**: Facebook, Apple (poza Google)
6. **Password strength**: Enforcement mocniejszych haseł w production
7. **Account recovery**: Dodatkowe opcje odzyskiwania konta (security questions)

### 10.4 Zgodność z PRD

**US-001 ✅**: Rejestracja email+hasło - pełna implementacja  
**US-002 ✅**: Logowanie email+hasło - pełna implementacja  
**US-003 🚧**: Google OAuth - wymaga implementacji callback page i button  
**US-004 ✅**: Wylogowanie - pełna implementacja  
**US-005 🚧**: Reset hasła - wymaga implementacji flow i endpoints

**Metryki telemetrii**:
- ✅ Event `auth_signup` - gotowy do implementacji
- ✅ Event `auth_login` - gotowy do implementacji
- ✅ Infrastruktura telemetrii w `TelemetryService`

**Bezpieczeństwo**:
- ✅ Hasła hashowane przez Supabase (bcrypt)
- ✅ Szyfrowanie w tranzycie (HTTPS w production)
- 🚧 **Throttling prób logowania (WYMAGANE - US-024, do implementacji)**
- ✅ Brak danych o dzieciach (zgodnie z PRD)

### 10.5 Następne kroki

**Priorytet 1 (MVP Critical)**:
1. Implementacja Google OAuth (US-003)
2. Implementacja password reset (US-005)
3. **Implementacja rate limiting dla `/api/auth/login` (US-024) - WYMAGANE**
4. Poprawienie redirectów: wszystkie przekierowania po logowaniu/rejestracji/OAuth → `/dashboard` zamiast `/dashboard/generate`
5. Poprawienie redirectu po wylogowaniu: `/login` zamiast `/`
6. Testy integracyjne przepływów autentykacji
7. Konfiguracja email templates w Supabase

**Priorytet 2 (Post-MVP)**:
1. Rate limiting dla `/api/auth/register` (dodatkowa ochrona)
2. Dashboard telemetrii autentykacji
3. Password strength requirements
4. Account deletion endpoint

**Priorytet 3 (Nice-to-have)**:
1. Multi-device session management
2. Two-factor authentication
3. Additional OAuth providers

---

## 11. Historia aktualizacji i sprzeczności

### 11.1 Aktualizacja 2025-10-15: Synchronizacja z PRD

**Znalezione sprzeczności i wprowadzone poprawki**:

#### 1. ❌ Redirect po logowaniu i rejestracji
**Problem**: Auth-spec kierował do `/dashboard/generate` (generator)  
**PRD wymaga**: "pokazują listę 'Moje questy'" (US-002, US-003)  
**Poprawka**: Zmieniono wszystkie redirecty na `/dashboard` (lista questów)  
**Dotknięte miejsca**:
- Strony `login.astro`, `register.astro`, `index.astro`
- Scenariusze użytkownika (2.4)
- OAuth callback
- Diagramy przepływów (sekcja 8)

#### 2. ❌ Redirect po wylogowaniu
**Problem**: Auth-spec kierował do `/` (landing page)  
**PRD wymaga**: "Użytkownik wraca do ekranu logowania" (US-004)  
**Poprawka**: Zmieniono redirect na `/login`  
**Dotknięte miejsca**:
- Scenariusz wylogowania (2.4)
- Komponent `LogoutButton`
- Diagram wylogowania (8.3)

#### 3. ❌ Rate limiting jako opcjonalny
**Problem**: Auth-spec oznaczał rate limiting jako "opcjonalny dla MVP"  
**PRD wymaga**: "Throttling przy wielokrotnych nieudanych próbach logowania" (US-024 - User Story MVP)  
**Poprawka**: Przeniesiono rate limiting do sekcji "WYMAGANE w MVP"  
**Dotknięte miejsca**:
- Sekcja 6.3 (Bezpieczeństwo)
- Sekcja 9.2 (Checklist implementacji)
- Sekcja 10.4 (Zgodność z PRD)
- Sekcja 10.5 (Następne kroki - Priorytet 1)

#### 4. ✅ Email confirmation flow
**Status**: Brak sprzeczności  
**Uzasadnienie**: Auth-spec poprawnie implementuje oba scenariusze z PRD (z potwierdzeniem i bez)

#### 5. ✅ Reset hasła - komunikat sukcesu
**Status**: Brak sprzeczności  
**Uzasadnienie**: Auth-spec stosuje security best practice (zawsze zwraca sukces w UI), co jest zgodne z intencją PRD

### 11.2 Weryfikacja User Stories

Wszystkie User Stories z PRD mogą być zrealizowane zgodnie z zaktualizowanym planem:

- ✅ **US-001** (Rejestracja e-mail): Implementacja gotowa + poprawiony redirect
- ✅ **US-002** (Logowanie e-mail): Implementacja gotowa + poprawiony redirect
- ✅ **US-003** (Logowanie Google): Do implementacji, plan zaktualizowany o poprawny redirect
- ✅ **US-004** (Wylogowanie): Implementacja gotowa + poprawiony redirect
- ✅ **US-005** (Reset hasła): Do implementacji, plan kompletny
- ✅ **US-024** (Throttling): Przeklasyfikowane jako wymagane w MVP

### 11.3 Rekomendacje implementacyjne

**Natychmiastowe poprawki w kodzie** (przed implementacją nowych features):
1. Zaktualizować `LoginForm.tsx` - zmienić redirect z `/dashboard/generate` na `/dashboard`
2. Zaktualizować `RegisterForm.tsx` - zmienić redirect z `/dashboard/generate` na `/dashboard`
3. Zaktualizować `LogoutButton.tsx` - zmienić redirect z `/` na `/login`
4. Zaktualizować guards w `login.astro`, `register.astro`, `index.astro`

**Nowe implementacje zgodnie z priorytetami** (sekcja 10.5):
1. Rate limiting (US-024) - krityczny dla MVP
2. Google OAuth (US-003)
3. Password reset (US-005)

---

**Koniec specyfikacji**

*Dokument zaktualizowany 2025-10-15 - zsynchronizowany z PRD v1.0*

