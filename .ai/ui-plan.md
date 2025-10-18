# Architektura UI dla KidsQuest MVP

## 1. Przegląd struktury UI

### 1.1 Założenia techniczne

KidsQuest MVP wykorzystuje hybrydową architekturę:
- **Astro 5** dla SSR (Server-Side Rendering) stron statycznych i publicznych
- **React 19** dla interaktywnych wysp (islands architecture) w dashboardzie
- **TypeScript 5** dla type safety
- **Tailwind 4** dla stylizacji
- **Shadcn/ui** dla komponentów UI (cherry-picking)

### 1.2 Architektura informacji

Aplikacja dzieli się na dwie główne strefy:

**Strefa publiczna (unauthenticated)**:
- Landing page z przedstawieniem wartości produktu
- Rejestracja (email+hasło, Google OAuth)
- Logowanie (email+hasło, Google OAuth)
- Reset hasła

**Strefa chroniona (authenticated)**:
- Dashboard z listą questów
- Generator questów AI
- Tworzenie manualne questów
- Detal questa
- Profil użytkownika z domyślnymi ustawieniami

### 1.3 Strategia responsywności

**Mobile-first approach** z dedykowanymi wzorcami dla urządzeń mobilnych i desktopowych:

- **Mobile** (< 768px): Bottom navigation, filter bottom sheet, full-width cards
- **Desktop** (≥ 768px): Top navbar, sidebar filters, multi-column layouts

### 1.4 Kluczowe założenia UX

1. **Minimalizacja tarcia decyzyjnego**: Domyślne wartości, presety, wizualne pickery
2. **Szybki time-to-action**: Od logowania do pierwszego questa w < 30 sekund
3. **Feedback loops**: Toast notifications, optimistic updates, loading states
4. **Bezpieczeństwo treści**: Inline walidacja z jasnym komunikatem o naruszeniach
5. **Polski język**: Wszystkie komunikaty, błędy i etykiety w języku polskim

---

## 2. Lista widoków

### 2.1 Strefa publiczna

#### V-001: Landing Page
**Ścieżka**: `/`  
**Typ**: Astro SSR (statyczna)  
**Główny cel**: Zachęcić nowych użytkowników do rejestracji poprzez przedstawienie wartości produktu

**Kluczowe informacje**:
- Nagłówek z hero section ("Kreatywne zabawy dla dzieci w kilka sekund")
- 3 główne korzyści (szybko, bezpiecznie, dopasowane do wieku)
- Przykładowy quest (preview bez logowania)
- Social proof (jeśli dostępny: liczba questów wygenerowanych)
- CTA: "Zacznij za darmo" + "Zaloguj się"

**Kluczowe komponenty**:
- Navbar (z logo, CTA do rejestracji/logowania)
- Hero section z ilustracją
- Feature cards (3 kolumny desktop, stack mobile)
- Quest preview card (read-only)
- Footer z linkami (polityka prywatności, kontakt)

**UX, dostępność i bezpieczeństwo**:
- Semantyczny HTML5 (header, main, section, footer)
- Heading hierarchy (h1 → h2 → h3)
- Alt text dla wszystkich obrazów
- High contrast dla czytelności
- HTTPS enforced
- No auth required

---

#### V-002: Rejestracja
**Ścieżka**: `/register`  
**Typ**: Astro SSR z React island dla formularza  
**Główny cel**: Umożliwić szybką rejestrację nowego użytkownika przez email+hasło lub Google OAuth

**Kluczowe informacje**:
- Formularz rejestracji (email, hasło, powtórz hasło)
- Przycisk "Zarejestruj się przez Google"
- Link do logowania ("Masz już konto?")
- Komunikaty walidacji (inline)

**Kluczowe komponenty**:
- `RegisterForm` (React island)
  - Input: email (type=email, required)
  - Input: password (type=password, required, minLength=8)
  - Input: confirmPassword (type=password, required)
  - Button: "Zarejestruj się"
  - Divider: "lub"
  - Button: "Zarejestruj się przez Google" (z ikoną Google)
- Toast dla komunikatów sukcesu/błędu

**UX, dostępność i bezpieczeństwo**:
- Zod schema validation (email format, password strength)
- Inline error messages pod każdym polem
- Password strength indicator (opcjonalnie w MVP)
- Auto-focus na pierwszym polu
- Keyboard navigation (Tab, Enter to submit)
- Google OAuth redirect z parametrem `redirect_to=/dashboard`
- Rate limiting na poziomie API
- Telemetria: `auth_signup` event po sukcesie

**Przepływ sukcesu**:
1. Użytkownik wypełnia formularz
2. Walidacja po stronie klienta (Zod)
3. Submit → Supabase Auth API
4. Auto-login + redirect do `/dashboard`
5. Telemetria `auth_signup`

**Przepływ błędu**:
- Email już istnieje → "Ten email jest już zarejestrowany. Zaloguj się."
- Słabe hasło → "Hasło musi mieć co najmniej 8 znaków"
- Hasła nie pasują → "Hasła muszą być identyczne"

---

#### V-003: Logowanie
**Ścieżka**: `/login`  
**Typ**: Astro SSR z React island dla formularza  
**Główny cel**: Umożliwić istniejącemu użytkownikowi zalogowanie się

**Kluczowe informacje**:
- Formularz logowania (email, hasło)
- Przycisk "Zaloguj się przez Google"
- Link "Zapomniałem hasła"
- Link "Nie masz konta? Zarejestruj się"

**Kluczowe komponenty**:
- `LoginForm` (React island)
  - Input: email
  - Input: password
  - Link: "Zapomniałem hasła"
  - Button: "Zaloguj się"
  - Divider: "lub"
  - Button: "Zaloguj się przez Google"
- Toast dla komunikatów błędu

**UX, dostępność i bezpieczeństwo**:
- Auto-focus na email field
- Enter to submit
- Generic error message ("Nieprawidłowy email lub hasło") bez ujawniania, które pole jest błędne
- Throttling przy wielokrotnych nieudanych próbach (handled by API)
- Telemetria: `auth_login` event po sukcesie
- Redirect do `/dashboard` po sukcesie lub do `redirect_to` query param jeśli obecny

---

#### V-004: Reset hasła
**Ścieżka**: `/reset-password`  
**Typ**: Astro SSR z React island  
**Główny cel**: Umożliwić użytkownikowi zresetowanie zapomnianego hasła

**Kluczowe informacje**:
- Formularz z polem email
- Komunikat "Wyślemy link resetujący na podany adres email"
- Po wysłaniu: komunikat sukcesu "Sprawdź swoją skrzynkę email"

**Kluczowe komponenty**:
- `ResetPasswordForm` (React island)
  - Input: email
  - Button: "Wyślij link resetujący"
- Success state (po wysłaniu)
- Link powrotu do logowania

**UX, dostępność i bezpieczeństwo**:
- Nie ujawniamy, czy email istnieje w systemie (zawsze sukces)
- Rate limiting na poziomie API
- Link resetujący wygasa po 1 godzinie (Supabase default)

---

### 2.2 Strefa chroniona (Dashboard)

#### V-005: Dashboard / Lista questów
**Ścieżka**: `/dashboard`  
**Typ**: Astro SSR + React islands dla filtrów i listy  
**Główny cel**: Wyświetlić listę questów użytkownika z możliwością filtrowania, sortowania i szybkich akcji

**Kluczowe informacje**:
- Lista questów użytkownika (cards)
- Filtry (wiek, czas, miejsce, energia, rekwizyty, źródło, status, ulubione)
- Sortowanie (Ostatnie / Ulubione)
- Puste stany (jeśli brak questów)
- FAB (Floating Action Button) do szybkiego generowania

**Kluczowe komponenty**:

**Layout**:
- `DashboardLayout` (wrapper z navbar/bottom nav)
- `DashboardHeader` (tytuł "Moje questy", sort picker)
- `FilterSidebar` (desktop) / `FilterSheet` (mobile)
- `QuestList` (grid of cards)
- `QuestCard` (pojedynczy quest)
- `EmptyState` (gdy brak questów)
- `FAB` (Floating Action Button)

**QuestCard** zawiera:
- Tytuł questa
- Hook (pierwsze 100 znaków + "...")
- Metadata badge row:
  - Wiek (emoji 👶🧒👦🧑 + label)
  - Czas (⏱️ + "30 min")
  - Miejsce (🏠 Dom / 🌳 Dwór)
  - Energia (🛋️🚶🏃)
  - Źródło (🤖 AI / ✍️ Ręczny)
- Status badge (Zapisany / Rozpoczęty / Ukończony) z kolorami
- Action buttons row:
  - Favorite icon (heart, toggle on/off)
  - "Rozpocznij" (jeśli saved) / "Ukończ" (jeśli started) / ✓ (jeśli completed)
  - Menu dropdown (Usuń)

**FilterSidebar / FilterSheet**:
- Sekcja "Wiek" (checkboxes z emoji: 👶 3-4, 🧒 5-6, 👦 7-8, 🧑 9-10)
- Sekcja "Czas" (range slider 0-480 min lub preset buttons: 5, 15, 30, 60 min)
- Sekcja "Miejsce" (checkboxes: 🏠 Dom, 🌳 Dwór)
- Sekcja "Energia" (checkboxes: 🛋️ Niska, 🚶 Średnia, 🏃 Wysoka)
- Sekcja "Rekwizyty" (multi-select: Klocki, Rysowanie, Kartka+ołówek, etc.)
- Sekcja "Źródło" (checkboxes: 🤖 AI, ✍️ Ręczny)
- Sekcja "Status" (checkboxes: Zapisany, Rozpoczęty, Ukończony)
- Toggle "Tylko ulubione" ⭐
- Button "Resetuj filtry"
- Button "Zastosuj" (mobile)

**EmptyState**:
- Emoji 📦
- Tytuł "Nie masz jeszcze żadnych questów"
- Opis "Wygeneruj swój pierwszy quest lub wybierz preset"
- CTA primary: "Wygeneruj quest"
- CTA secondary: "Zobacz presety"

**FAB**:
- Floating button (fixed bottom-right desktop, bottom center mobile)
- Icon: ➕ lub 🎲
- Tooltip: "Wygeneruj quest"
- Click → redirect do `/dashboard/generate`

**UX, dostępność i bezpieczeństwo**:
- Optimistic update dla favorite toggle (instant feedback)
- Skeleton loading states podczas ładowania listy
- Infinite scroll lub pagination (pagination w MVP: 20 per page)
- Filtry zapisywane w URL query params (persistence po odświeżeniu)
- Keyboard shortcuts: Ctrl/Cmd+K → focus search/filter
- ARIA labels na icon-only buttons
- RLS enforcement (user widzi tylko swoje questy)
- React Query caching (5 min stale time)
- Telemetria: `favorite_toggled`, `delete_quest` events

**Przepływ użytkownika**:
1. User wchodzi na `/dashboard`
2. API call: `GET /api/quests` (z filtrami z URL params)
3. Render listy questów
4. User klika "Ulubione" → optimistic update + API call `PATCH /api/quests/:id/favorite`
5. User klika "Rozpocznij" → API call `PATCH /api/quests/:id/start` → redirect do `/dashboard/quest/:id`
6. User klika FAB → redirect do `/dashboard/generate`

---

#### V-006: Generator questów
**Ścieżka**: `/dashboard/generate`  
**Typ**: Astro SSR + React island dla formularza i wyniku  
**Główny cel**: Umożliwić użytkownikowi wygenerowanie questa przez AI z wizualnymi pickerami

**Kluczowe informacje**:
- Formularz parametrów (wiek, czas, miejsce, energia, rekwizyty)
- Presety (quick-start templates)
- Wygenerowany quest (wynik)
- Akcje na wyniku (Akceptuję i zaczynam, Zapisz na później, Pomiń, Wygeneruj ponownie)

**Kluczowe komponenty**:

**Layout** (dwa stany: Form → Result):

**Stan 1: Formularz**:
- `GeneratorForm` (React island z React Hook Form + Zod)
  - `PresetCards` (na górze, opcjonalnie)
    - Card: "⚡ Szybka zabawa" (5 min, bez rekwizytów, średnia energia)
    - Card: "🎨 Kreatywna chwila" (15 min, rysowanie, niska energia)
    - Card: "🧱 Budowanie" (30 min, klocki, średnia energia)
    - Card: "🏃 Ruch!" (20 min, bez rekwizytów, wysoka energia, dwór)
  - Divider: "lub dostosuj parametry"
  - `VisualPicker` dla wieku (4 przyciski z emoji)
    - 👶 3-4 lata
    - 🧒 5-6 lat
    - 👦 7-8 lat
    - 🧑 9-10 lat
  - `DurationSlider` (czas w minutach)
    - Slider 5-480 min
    - Preset buttons: 5, 15, 30, 60 min
    - Display: "{value} min"
  - `VisualPicker` dla miejsca (2 przyciski)
    - 🏠 Dom
    - 🌳 Dwór
  - `VisualPicker` dla energii (3 przyciski)
    - 🛋️ Niska
    - 🚶 Średnia
    - 🏃 Wysoka
  - `PropMultiSelect` (multi-select z emoji)
    - 🧱 Klocki
    - 🎨 Rysowanie
    - 📄 Kartka + ołówek
    - 📚 Storytelling
    - 🧩 Zagadki
    - 🚗 Samochodziki
    - ❌ Bez rekwizytów
  - Button primary: "Generuj quest"
  - Link secondary: "Stwórz quest ręcznie"

**Stan 2: Wynik** (po wygenerowaniu):
- `QuestResult` (React component)
  - Section: Hook (większa czcionka, pogrubiona)
  - Section: Kroki
    - Krok 1: {step1}
    - Krok 2: {step2}
    - Krok 3: {step3}
  - Section: Wersja łatwiej
    - {easier_version}
  - Section: Wersja trudniej
    - {harder_version}
  - Section: Bezpieczeństwo ⚠️
    - {safety_notes}
  - Section: Parametry (metadata badges, read-only)
  - Action buttons:
    - Primary: "✓ Akceptuję i zaczynam" (green)
    - Secondary: "💾 Zapisz na później"
    - Tertiary: "⏭️ Pomiń"
    - Link: "🔄 Wygeneruj ponownie" (z tymi samymi parametrami)

**UX, dostępność i bezpieczeństwo**:
- Domyślne wartości z profilu użytkownika (`GET /api/profiles/me`)
- Presety auto-fill formularza + instant submit
- Visual pickers (duże, touch-friendly targets: min 48x48px)
- Loading state podczas generowania: spinner + "Generuję quest..." (max 30s)
- Timeout po 30s → error message + opcja retry
- Inline validation (Zod schema)
- Rate limiting komunikat: "Zbyt wiele prób. Spróbuj za {retry_after}s"
- Telemetria: `quest_generated`, `preset_used`, `quest_started`, `quest_saved`, `error_generation`
- Parametry zapisywane w localStorage (persistence między sesjami)
- Keyboard navigation (Tab przez pola, Enter to submit)
- ARIA labels na visual pickers

**Przepływ użytkownika (happy path)**:
1. User wchodzi na `/dashboard/generate`
2. Formularz wypełniony defaultami z profilu lub localStorage
3. User wybiera preset → auto-fill + submit
4. Loading state (spinner)
5. API call: `POST /api/quests/generate`
6. Result renderuje się w miejscu formularza (smooth transition)
7. User klika "Akceptuję i zaczynam"
8. API call: `POST /api/quests` (status=started)
9. Telemetria: `quest_started`
10. Redirect do `/dashboard/quest/:id`

**Przepływ użytkownika (pomiń)**:
1. User klika "Pomiń" w Result
2. Powrót do formularza (zachowane parametry)
3. User może kliknąć "Generuj quest" ponownie lub "Wygeneruj ponownie"

**Przepływ użytkownika (zapisz)**:
1. User klika "Zapisz na później"
2. API call: `POST /api/quests` (status=saved)
3. Telemetria: `quest_saved`
4. Toast: "Quest zapisany"
5. Redirect do `/dashboard` (quest pojawia się na liście)

**Przepływ błędu**:
- Generation failed (500) → Error alert: "Wystąpił błąd, spróbuj później" + Button "Spróbuj ponownie"
- Rate limit (429) → Error alert: "Zbyt wiele prób. Spróbuj za {retry_after}s"
- Validation error (400) → Inline errors pod polami formularza

---

#### V-007: Tworzenie manualne questa
**Ścieżka**: `/dashboard/create-manual`  
**Typ**: Astro SSR + React island dla formularza  
**Główny cel**: Umożliwić użytkownikowi ręczne stworzenie questa

**Kluczowe informacje**:
- Formularz z polami treści (tytuł, hook, kroki, warianty, bezpieczeństwo)
- Formularz z parametrami (wiek, czas, miejsce, energia, rekwizyty)
- Walidacja content policy (hard-ban blocks, soft-ban warns)

**Kluczowe komponenty**:

**ManualQuestForm** (React island z React Hook Form + Zod):
- Section: Treść questa
  - Input: Tytuł (1-200 znaków)
  - Textarea: Hook (10-300 znaków)
  - Textarea: Krok 1 (10-250 znaków)
  - Textarea: Krok 2 (10-250 znaków)
  - Textarea: Krok 3 (10-250 znaków)
  - Textarea: Wersja łatwiej (opcjonalnie, 10-500 znaków)
  - Textarea: Wersja trudniej (opcjonalnie, 10-500 znaków)
  - Textarea: Adnotacje bezpieczeństwa (opcjonalnie, max 500 znaków)
- Section: Parametry questa (identyczne jak w generatorze)
  - Visual picker: Wiek
  - Duration slider: Czas
  - Visual picker: Miejsce
  - Visual picker: Energia
  - Multi-select: Rekwizyty
- Button primary: "Stwórz quest"
- Button secondary: "Anuluj"

**Content Policy Alert** (pokazuje się przy naruszeniach):
- Typ "error" (hard-ban): 
  - Ikona ⛔
  - Tytuł "Treść zawiera niedozwolone słowa"
  - Lista naruszeń: "{field}: zawiera '{pattern}'"
  - Button "Popraw"
- Typ "warning" (soft-ban):
  - Ikona ⚠️
  - Tytuł "Uwaga: znaleźliśmy potencjalnie problematyczne słowa"
  - Lista sugestii: "W '{field}' rozważ zamianę '{original}' na '{replacement}'"
  - Button "Kontynuuj mimo to" + Button "Zastosuj sugestie"

**UX, dostępność i bezpieczeństwo**:
- Character count pod każdym textarea (np. "45 / 300")
- Inline Zod validation
- Content policy validation on blur + on submit
- Hard-ban blocks submit (button disabled)
- Soft-ban shows warning ale pozwala submit
- Auto-save drafts do localStorage (co 30s lub on blur)
- Toast na sukces: "Quest utworzony"
- Telemetria: `quest_created_manual`
- Redirect do `/dashboard/quest/:id` po sukcesie

**Przepływ użytkownika**:
1. User wchodzi na `/dashboard/create-manual`
2. Formularz z pustymi polami (lub draft z localStorage)
3. User wypełnia tytuł, hook, kroki
4. On blur → content policy check (client-side pre-validation)
5. Jeśli hard-ban → alert error + pole podświetlone
6. User poprawia
7. User wypełnia parametry
8. User klika "Stwórz quest"
9. Validation (Zod + content policy)
10. API call: `POST /api/quests` (source=manual, status=saved)
11. Server-side content policy check
12. Jeśli sukces: telemetria `quest_created_manual` + redirect do `/dashboard/quest/:id`
13. Jeśli błąd: response z violations → render alert

---

#### V-008: Detal questa
**Ścieżka**: `/dashboard/quest/:id`  
**Typ**: Astro SSR + React islands dla akcji  
**Główny cel**: Wyświetlić pełny detal questa i umożliwić akcje (start, complete, favorite, delete)

**Kluczowe informacje**:
- Pełna treść questa (tytuł, hook, kroki, warianty, bezpieczeństwo)
- Metadata questa (wiek, czas, miejsce, energia, rekwizyty, źródło, status)
- Action buttons (Rozpocznij / Ukończ, Ulubione, Usuń)

**Kluczowe komponenty**:

**QuestDetail** (React component):
- Header:
  - Badge: Status (Zapisany / Rozpoczęty / Ukończony)
  - Badge: Źródło (🤖 AI / ✍️ Ręczny)
  - Button icon: Ulubione (heart toggle)
  - Dropdown menu: Usuń, Udostępnij (future)
- Section: Tytuł (h1)
- Section: Hook (większa czcionka, highlight background)
- Section: Kroki
  - Krok 1: {step1}
  - Krok 2: {step2}
  - Krok 3: {step3}
- Section: Wersja łatwiej
  - {easier_version}
- Section: Wersja trudniej
  - {harder_version}
- Section: Bezpieczeństwo ⚠️
  - {safety_notes}
- Section: Parametry (metadata badges grid)
  - 👶 {age_group_label}
  - ⏱️ {duration_minutes} min
  - 🏠 {location_label}
  - 🚶 {energy_level_label}
  - Props: {props.map(p => p.label).join(", ")}
- Footer: Action buttons
  - Primary: "Rozpocznij" (jeśli status=saved) / "Ukończ" (jeśli status=started) / "✓ Ukończono" (jeśli status=completed, disabled)
  - Secondary: "Powrót do listy"

**Delete Confirmation Dialog**:
- Tytuł: "Usunąć quest?"
- Opis: "Ta akcja jest nieodwracalna."
- Button primary: "Usuń" (red)
- Button secondary: "Anuluj"

**UX, dostępność i bezpieczeństwo**:
- Breadcrumb navigation: Dashboard > Quest > {title}
- Print-friendly styling (opcjonalnie w MVP)
- Share button (future: copy link, generate PDF)
- Optimistic update dla favorite toggle
- Confirmation dialog przed usunięciem
- Loading states dla akcji
- Toast notifications: "Quest rozpoczęty", "Quest ukończony", "Quest usunięty"
- Telemetria: `quest_started`, `quest_completed`, `favorite_toggled`, `delete_quest`
- RLS enforcement (user widzi tylko własne questy)
- 404 jeśli quest nie istnieje lub nie należy do usera

**Przepływ użytkownika (start quest)**:
1. User jest na `/dashboard/quest/:id`
2. Status = saved
3. User klika "Rozpocznij"
4. Optimistic update (button zmienia się na "Ukończ", status badge → "Rozpoczęty")
5. API call: `PATCH /api/quests/:id/start`
6. Telemetria: `quest_started`
7. Toast: "Quest rozpoczęty"

**Przepływ użytkownika (complete quest)**:
1. Status = started
2. User klika "Ukończ"
3. Optimistic update (status badge → "Ukończony", button disabled)
4. API call: `PATCH /api/quests/:id/complete`
5. Telemetria: `quest_completed`
6. Toast: "Quest ukończony! 🎉"

**Przepływ użytkownika (delete quest)**:
1. User klika menu dropdown → "Usuń"
2. Confirmation dialog pojawia się
3. User klika "Usuń"
4. API call: `DELETE /api/quests/:id`
5. Telemetria: `delete_quest`
6. Redirect do `/dashboard`
7. Toast: "Quest usunięty"

---

#### V-009: Profil użytkownika
**Ścieżka**: `/dashboard/profile`  
**Typ**: Astro SSR + React island dla formularza  
**Główny cel**: Umożliwić użytkownikowi edycję domyślnych ustawień i zarządzanie kontem

**Kluczowe informacje**:
- Informacje o koncie (email, data rejestracji)
- Domyślne ustawienia generatora (wiek, czas, miejsce, energia)
- Akcje konta (zmiana hasła, wylogowanie)

**Kluczowe komponenty**:

**ProfileLayout**:
- Section: Informacje o koncie
  - Display: Email (read-only)
  - Display: Data rejestracji (read-only)
  - Link: "Zmień hasło" (jeśli rejestracja przez email)
  - Button: "Wyloguj się"
- Section: Domyślne ustawienia generatora
  - Form: `DefaultPreferencesForm` (React island)
    - Visual picker: Wiek (opcjonalnie, może być null)
    - Duration slider: Czas (opcjonalnie, może być null)
    - Visual picker: Miejsce (opcjonalnie, może być null)
    - Visual picker: Energia (opcjonalnie, może być null)
    - Info: "Te ustawienia będą automatycznie wypełniać formularz generatora"
    - Button: "Zapisz ustawienia"
- Section: Statystyki (opcjonalnie w MVP)
  - Display: Liczba questów wygenerowanych
  - Display: Liczba questów ukończonych
  - Display: Liczba ulubionych

**UX, dostępność i bezpieczeństwo**:
- Auto-load current preferences: `GET /api/profiles/me`
- Nullowalne pola (user może nie mieć defaultów)
- Placeholder text: "Nie ustawiono" jeśli null
- Toast na sukces: "Ustawienia zapisane"
- API call: `PATCH /api/profiles/me`
- Wylogowanie: Supabase signOut + redirect do `/login`
- Zmiana hasła: redirect do Supabase hosted page lub custom flow (future)

---

## 3. Mapa podróży użytkownika

### 3.1 Główne ścieżki użytkownika

#### Ścieżka 1: Nowy użytkownik (Cold Start)

**Cel**: Od pierwszego kontaktu do ukończenia pierwszego questa w < 2 minuty

```
Landing Page (/)
↓
[CTA: "Zacznij za darmo"]
↓
Rejestracja (/register)
↓ [Submit form / Google OAuth]
↓ [Auto-login]
↓
Dashboard - Empty State (/dashboard)
↓ [CTA: "Wygeneruj quest" lub Preset]
↓
Generator (/dashboard/generate)
↓ [Preset selected → Auto-fill → Submit]
↓ [Loading state: "Generuję quest..." ~10-30s]
↓
Generator - Result (/dashboard/generate)
↓ [CTA: "Akceptuję i zaczynam"]
↓
Quest Detail (/dashboard/quest/:id)
Status: Rozpoczęty
↓ [User wykonuje quest z dzieckiem]
↓ [CTA: "Ukończ"]
↓
Quest Detail - Completed
Status: Ukończony
Toast: "Quest ukończony! 🎉"
↓ [CTA: "Powrót do listy"]
↓
Dashboard - List (/dashboard)
Quest widoczny na liście z status=completed
```

**Kluczowe metryki**:
- Time-to-First-Start: czas od rejestracji do `quest_started` event
- Start Rate: % wygenerowanych questów, które są akceptowane
- Completion Rate: % rozpoczętych questów, które są ukończone

---

#### Ścieżka 2: Powracający użytkownik (Returning User)

**Cel**: Szybkie wygenerowanie kolejnego questa

```
Login (/login)
↓ [Email+hasło lub Google]
↓
Dashboard - List (/dashboard)
Widoczne poprzednie questy
↓ [FAB: "Wygeneruj quest" lub Click na quest z listy]
↓
Option A: Nowy quest
  Generator (/dashboard/generate)
  ↓ [Formularz wypełniony defaultami z profilu]
  ↓ [Submit]
  ↓ [Result]
  ↓ [Akceptuję i zaczynam]
  ↓ Quest Detail (started)

Option B: Kontynuacja zapisanego
  Quest Detail (/dashboard/quest/:id)
  ↓ [Rozpocznij]
  ↓ Quest Detail (started)
```

---

#### Ścieżka 3: Manual Quest Creation

**Cel**: Stworzenie własnego questa dla zaawansowanego użytkownika

```
Dashboard (/dashboard)
↓ [Link: "Stwórz quest ręcznie"]
↓
Manual Creation (/dashboard/create-manual)
↓ [Fill form: title, hook, steps, variations, safety]
↓ [Content policy validation]
↓ [Submit]
↓
Quest Detail (/dashboard/quest/:id)
Status: Zapisany, Source: Ręczny
```

---

#### Ścieżka 4: Quest Management

**Cel**: Filtrowanie, przypinanie ulubionych, usuwanie

```
Dashboard (/dashboard)
↓ [Open filters sidebar/sheet]
↓ [Select: Wiek=5-6, Miejsce=Dom, Tylko ulubione]
↓ [Apply filters]
↓
Dashboard - Filtered List
Widoczne tylko questy 5-6 lat, Dom, ulubione
↓ [Click na quest]
↓
Quest Detail (/dashboard/quest/:id)
↓ [Toggle favorite → optimistic update]
↓ [Dropdown: Usuń]
↓ [Confirmation dialog]
↓ [Confirm]
↓
Dashboard - List (quest removed)
```

---

### 3.2 Alternatywne przepływy

#### Przepływ błędu: Generation Failed

```
Generator (/dashboard/generate)
↓ [Submit]
↓ [Loading...]
↓ [API error: 500 / timeout]
↓
Generator - Error State
Alert: "Wystąpił błąd, spróbuj później"
Button: "Spróbuj ponownie"
↓ [Click retry]
↓ [Re-submit with same params]
```

#### Przepływ błędu: Rate Limit Exceeded

```
Generator (/dashboard/generate)
↓ [Submit x5 w 1 min]
↓ [API error: 429]
↓
Generator - Rate Limit Error
Alert: "Zbyt wiele prób. Spróbuj za 45s"
Countdown timer
↓ [Wait 45s]
↓ [Button enabled again]
```

#### Przepływ "Pomiń" w generatorze

```
Generator - Result
Quest wygenerowany ale user nie chce
↓ [Button: "Pomiń"]
↓
Generator - Form
Formularz zachowany z tymi samymi parametrami
↓ [Button: "Wygeneruj ponownie" lub edycja parametrów]
```

---

## 4. Układ i struktura nawigacji

### 4.1 Nawigacja główna

#### Desktop (≥ 768px)

**Top Navbar** (sticky, fixed):
```
+----------------------------------------------------------+
| [Logo] KidsQuest    [Moje questy] [Generuj]    [User ▼] |
+----------------------------------------------------------+
```

**Elementy**:
- Logo (link do `/dashboard`)
- Link: "Moje questy" → `/dashboard`
- Link: "Generuj" → `/dashboard/generate`
- User dropdown (prawy górny róg):
  - Display: Email
  - Link: "Profil" → `/dashboard/profile`
  - Link: "Wyloguj się"

#### Mobile (< 768px)

**Top Bar** (sticky):
```
+------------------------------------------+
| [☰ Menu]  KidsQuest           [User]    |
+------------------------------------------+
```

**Bottom Navigation** (fixed):
```
+------------------------------------------+
|   [Lista]      [➕]         [Profil]     |
|    📋        Generuj          👤         |
+------------------------------------------+
```

**Elementy**:
- Tab 1: "Lista" (icon 📋) → `/dashboard`
- Tab 2: "Generuj" (icon ➕) → `/dashboard/generate`
- Tab 3: "Profil" (icon 👤) → `/dashboard/profile`

**Hamburger Menu** (slide-out):
- Link: Moje questy
- Link: Generuj quest
- Link: Stwórz ręcznie
- Divider
- Link: Profil
- Link: Wyloguj się

---

### 4.2 Nawigacja kontekstowa

#### Breadcrumbs (desktop)

Pokazują się na stronach szczegółowych:

```
Dashboard > Quest > "Tajemnica Zagubionych Klocków"
Dashboard > Generuj quest
Dashboard > Stwórz ręcznie
Dashboard > Profil
```

#### Back Navigation (mobile)

Na stronach szczegółowych pokazuje się back button w top bar:

```
+------------------------------------------+
| [← Wstecz]  Quest                       |
+------------------------------------------+
```

---

### 4.3 Filtry i sortowanie (Dashboard)

#### Desktop: Sidebar

```
+----------------------+----------------------------------+
| FILTRY               | LISTA QUESTÓW                   |
|                      |                                  |
| Wiek                 | [Sort: Ostatnie ▼]              |
| ☑ 👶 3-4 lata        |                                  |
| ☐ 🧒 5-6 lat         | [Quest Card 1]                   |
| ☐ 👦 7-8 lat         | [Quest Card 2]                   |
| ☐ 🧑 9-10 lat        | [Quest Card 3]                   |
|                      |                                  |
| Miejsce              | [Pagination: ← 1 2 3 →]         |
| ☑ 🏠 Dom             |                                  |
| ☐ 🌳 Dwór            |                                  |
|                      |                                  |
| ... (more filters)   |                                  |
|                      |                                  |
| [Resetuj filtry]     |                                  |
+----------------------+----------------------------------+
```

#### Mobile: Bottom Sheet

Filters hidden by default, shown when user taps "Filtry" button:

```
+------------------------------------------+
| Moje questy               [⚙️ Filtry]   |
+------------------------------------------+
| [Sort: Ostatnie ▼]                       |
|                                          |
| [Quest Card 1]                           |
| [Quest Card 2]                           |
+------------------------------------------+

[User taps "Filtry"]

+------------------------------------------+
| [×] Filtry                    [Zastosuj]|
|------------------------------------------|
| Wiek                                     |
| ☑ 👶 3-4  ☐ 🧒 5-6  ☐ 👦 7-8  ☐ 🧑 9-10 |
|                                          |
| Miejsce                                  |
| ☑ 🏠 Dom  ☐ 🌳 Dwór                      |
|                                          |
| ... (scrollable)                         |
|                                          |
| [Resetuj filtry]                         |
+------------------------------------------+
```

---

### 4.4 Deep Linking i URL Strategy

**Clean URLs z SEO-friendly slugs**:

```
/                                 → Landing
/login                            → Login
/register                         → Register
/reset-password                   → Reset Password
/dashboard                        → Quest List
/dashboard?age=2&location=home    → Filtered Quest List
/dashboard?sort=favorites         → Favorites view
/dashboard/generate               → Generator
/dashboard/create-manual          → Manual Creation
/dashboard/quest/:id              → Quest Detail
/dashboard/profile                → Profile
```

**Query Params dla filtrów** (persisted in URL):
- `age`: age_group_id (1, 2, 3, 4)
- `location`: home | outdoor
- `energy`: low | medium | high
- `source`: ai | manual
- `status`: saved | started | completed
- `favorites`: true
- `props`: comma-separated IDs (e.g., `props=1,3,5`)
- `sort`: recent | favorites

**Benefits**:
- Shareable URLs (user może wysłać link do przefiltrowanej listy)
- Back/forward browser navigation działa poprawnie
- Refresh zachowuje stan filtrów

---

## 5. Kluczowe komponenty

### 5.1 Layout Components

#### `DashboardLayout`
**Przeznaczenie**: Wrapper dla wszystkich stron w strefie chronionej

**Struktura**:
- Navbar (desktop) / Top Bar + Bottom Nav (mobile)
- Main content area
- Toast container (fixed position dla notifications)

**Props**:
- `children`: React.ReactNode
- `title`: string (document title)
- `showBackButton`: boolean (mobile back navigation)

**Responsywność**:
- Desktop: Top navbar always visible
- Mobile: Top bar + bottom navigation

---

#### `Navbar` (Desktop)
**Przeznaczenie**: Główna nawigacja desktop

**Elementy**:
- Logo (link)
- Navigation links (Moje questy, Generuj)
- User dropdown (Email, Profil, Wyloguj się)

**Props**:
- `user`: User object z Supabase Auth

**Interaktywność**:
- Hover states na linkach
- Dropdown menu dla usera
- Active state dla current route

---

#### `BottomNav` (Mobile)
**Przeznaczenie**: Bottom navigation dla mobile

**Elementy**:
- 3 tabs: Lista, Generuj, Profil
- Icons + labels
- Active state indicator

**Props**:
- `currentRoute`: string (dla active state)

**Accessibility**:
- ARIA labels
- Touch targets min 48x48px

---

### 5.2 Quest Components

#### `QuestCard`
**Przeznaczenie**: Pojedynczy quest na liście

**Elementy**:
- Tytuł
- Hook (truncated)
- Metadata badges (wiek, czas, miejsce, energia, źródło)
- Status badge
- Favorite icon (toggle)
- Action button (Rozpocznij / Ukończ / ✓)
- Dropdown menu (Usuń)

**Props**:
```typescript
{
  quest: Quest;
  onFavoriteToggle: (questId: string, isFavorite: boolean) => void;
  onStart: (questId: string) => void;
  onComplete: (questId: string) => void;
  onDelete: (questId: string) => void;
}
```

**Interaktywność**:
- Click na card → navigate do `/dashboard/quest/:id`
- Click na favorite icon → optimistic toggle + API call
- Click na action button → API call + update status

---

#### `QuestDetail`
**Przeznaczenie**: Pełny widok desta z wszystkimi sekcjami

**Elementy**:
- Header (status, źródło, favorite, menu)
- Tytuł
- Hook (highlight)
- Kroki (numbered list)
- Wersja łatwiej
- Wersja trudniej
- Bezpieczeństwo (alert style)
- Metadata grid
- Action buttons

**Props**:
```typescript
{
  quest: Quest;
  onFavoriteToggle: () => void;
  onStart: () => void;
  onComplete: () => void;
  onDelete: () => void;
}
```

---

#### `QuestResult` (w generatorze)
**Przeznaczenie**: Display wygenerowanego questa z action buttons

**Elementy**:
- Identyczne sekcje jak `QuestDetail`
- Action buttons: Akceptuję i zaczynam, Zapisz, Pomiń, Wygeneruj ponownie

**Props**:
```typescript
{
  quest: GeneratedQuest;
  onAcceptAndStart: () => void;
  onSave: () => void;
  onSkip: () => void;
  onRegenerate: () => void;
}
```

---

### 5.3 Form Components

#### `GeneratorForm`
**Przeznaczenie**: Formularz generatora questów z visual pickers

**Elementy**:
- Preset cards (optional)
- Visual picker: Wiek
- Duration slider
- Visual picker: Miejsce
- Visual picker: Energia
- Multi-select: Rekwizyty
- Submit button
- Link: Stwórz ręcznie

**Props**:
```typescript
{
  defaultValues: Partial<GeneratorParams>;
  onSubmit: (params: GeneratorParams) => void;
  onPresetSelect: (preset: Preset) => void;
}
```

**State**:
- React Hook Form
- Zod validation
- localStorage persistence

---

#### `ManualQuestForm`
**Przeznaczenie**: Formularz ręcznego tworzenia questa

**Elementy**:
- Content fields (tytuł, hook, kroki, warianty, bezpieczeństwo)
- Parameter fields (identyczne jak generator)
- Content policy alerts
- Submit + Cancel buttons

**Props**:
```typescript
{
  onSubmit: (quest: ManualQuest) => void;
  onCancel: () => void;
}
```

**State**:
- React Hook Form
- Zod validation
- Content policy validation (client-side)
- localStorage draft persistence

---

#### `VisualPicker`
**Przeznaczenie**: Reusable component dla wizualnego wyboru opcji

**Przykład użycia**:
```tsx
<VisualPicker
  options={[
    { value: 1, label: "3-4 lata", icon: "👶" },
    { value: 2, label: "5-6 lat", icon: "🧒" },
  ]}
  value={selectedAge}
  onChange={setSelectedAge}
  layout="grid" // "grid" | "inline"
/>
```

**Responsywność**:
- Desktop: 4 kolumny grid
- Mobile: 2 kolumny grid lub stack

---

#### `DurationSlider`
**Przeznaczenie**: Slider z preset buttons dla czasu questa

**Elementy**:
- Range slider (5-480 min)
- Preset buttons (5, 15, 30, 60 min)
- Display value ("{value} min")

**Props**:
```typescript
{
  value: number;
  onChange: (value: number) => void;
  presets?: number[];
}
```

---

#### `PropMultiSelect`
**Przeznaczenie**: Multi-select z emoji dla rekwizytów

**Elementy**:
- Checkboxes z emoji + label
- "Select all" / "Deselect all" (opcjonalnie)

**Props**:
```typescript
{
  options: Prop[];
  value: number[];
  onChange: (value: number[]) => void;
}
```

---

### 5.4 Filter Components

#### `FilterSidebar` (Desktop)
**Przeznaczenie**: Sidebar z filtrami dla listy questów

**Elementy**:
- Sekcje filtrów (Wiek, Miejsce, Energia, Rekwizyty, Źródło, Status)
- Toggle "Tylko ulubione"
- Reset button

**Props**:
```typescript
{
  filters: QuestFilters;
  onChange: (filters: QuestFilters) => void;
  onReset: () => void;
}
```

**State**:
- Synced z URL query params

---

#### `FilterSheet` (Mobile)
**Przeznaczenie**: Bottom sheet z filtrami dla mobile

**Elementy**:
- Identyczne sekcje jak FilterSidebar
- Close button
- Apply button

**Props**:
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  filters: QuestFilters;
  onChange: (filters: QuestFilters) => void;
  onApply: () => void;
  onReset: () => void;
}
```

---

### 5.5 Preset Components

#### `PresetCard`
**Przeznaczenie**: Pojedyncza karta presetu w generatorze

**Elementy**:
- Icon (emoji)
- Tytuł (np. "⚡ Szybka zabawa")
- Metadata (czas, miejsce, energia, rekwizyty)
- Description (opcjonalnie)

**Props**:
```typescript
{
  preset: Preset;
  onSelect: (preset: Preset) => void;
}
```

**Interaktywność**:
- Click → auto-fill form + submit
- Hover → highlight border

**Presety w MVP**:

1. **⚡ Szybka zabawa**
   - Czas: 5 min
   - Miejsce: Dom
   - Energia: Średnia
   - Rekwizyty: Bez rekwizytów

2. **🎨 Kreatywna chwila**
   - Czas: 15 min
   - Miejsce: Dom
   - Energia: Niska
   - Rekwizyty: Rysowanie

3. **🧱 Budowanie**
   - Czas: 30 min
   - Miejsce: Dom
   - Energia: Średnia
   - Rekwizyty: Klocki

4. **🏃 Ruch!**
   - Czas: 20 min
   - Miejsce: Dwór
   - Energia: Wysoka
   - Rekwizyty: Bez rekwizytów

---

### 5.6 Utility Components

#### `EmptyState`
**Przeznaczenie**: Pusty stan gdy brak danych

**Elementy**:
- Icon (emoji)
- Tytuł
- Opis
- CTA button(s)

**Props**:
```typescript
{
  icon: string;
  title: string;
  description: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}
```

---

#### `LoadingState`
**Przeznaczenie**: Loading spinner z kontekstowym komunikatem

**Elementy**:
- Spinner
- Message (np. "Generuję quest...")

**Props**:
```typescript
{
  message?: string;
}
```

---

#### `ErrorState`
**Przeznaczenie**: Error alert z retry option

**Elementy**:
- Alert component (Shadcn/ui)
- Error icon
- Error message
- Retry button (opcjonalnie)

**Props**:
```typescript
{
  title: string;
  message: string;
  onRetry?: () => void;
}
```

---

#### `ContentPolicyAlert`
**Przeznaczenie**: Alert dla naruszeń content policy

**Warianty**:
- Error (hard-ban): Red alert, blocks action
- Warning (soft-ban): Yellow alert, shows suggestions

**Props**:
```typescript
{
  type: "error" | "warning";
  violations?: Array<{ field: string; pattern: string }>;
  suggestions?: Array<{ field: string; original: string; replacement: string }>;
  onApplySuggestions?: () => void;
  onContinueAnyway?: () => void;
}
```

---

#### `ConfirmDialog`
**Przeznaczenie**: Reusable confirmation dialog

**Elementy**:
- Dialog component (Shadcn/ui)
- Tytuł
- Opis
- Primary button (action)
- Secondary button (cancel)

**Props**:
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}
```

---

### 5.7 Badge Components

#### `StatusBadge`
**Przeznaczenie**: Badge dla statusu questa

**Warianty**:
- Zapisany: Gray
- Rozpoczęty: Blue
- Ukończony: Green

**Props**:
```typescript
{
  status: "saved" | "started" | "completed";
}
```

---

#### `SourceBadge`
**Przeznaczenie**: Badge dla źródła questa

**Warianty**:
- AI: 🤖 AI (blue)
- Manual: ✍️ Ręczny (gray)

**Props**:
```typescript
{
  source: "ai" | "manual";
}
```

---

#### `MetadataBadge`
**Przeznaczenie**: Badge dla pojedynczego parametru questa

**Elementy**:
- Icon (emoji)
- Label

**Props**:
```typescript
{
  icon: string;
  label: string;
  variant?: "default" | "outline";
}
```

---

## 6. Stany aplikacji i error handling

### 6.1 Loading States

#### Global Loading
- Pokazuje się podczas initialnego ładowania aplikacji
- Skeleton screens dla list questów
- Spinner dla pojedynczych akcji (favorite toggle, delete)

#### Generator Loading
- Kontekstowy komunikat: "Generuję quest..."
- Spinner
- Timeout po 30s → error state

#### List Loading
- Skeleton cards (3-5 placeholders)
- Pagination loading (pokazuje stare dane + spinner podczas ładowania nowych)

---

### 6.2 Error States

#### Network Error
```
Tytuł: "Brak połączenia z internetem"
Opis: "Sprawdź swoje połączenie i spróbuj ponownie."
Akcja: [Spróbuj ponownie]
```

#### Generation Error (500)
```
Tytuł: "Wystąpił błąd"
Opis: "Nie udało się wygenerować questa. Spróbuj ponownie za chwilę."
Akcja: [Spróbuj ponownie]
```

#### Rate Limit (429)
```
Tytuł: "Zbyt wiele prób"
Opis: "Spróbuj ponownie za {retry_after}s."
Akcja: [Countdown timer]
```

#### Not Found (404)
```
Tytuł: "Quest nie istnieje"
Opis: "Nie znaleziono questa lub nie masz do niego dostępu."
Akcja: [Wróć do listy]
```

#### Unauthorized (401)
```
Redirect do /login
Toast: "Sesja wygasła. Zaloguj się ponownie."
```

#### Content Policy Violation (400)
```
Alert: Hard-ban → "Treść zawiera niedozwolone słowa"
Lista naruszeń
Akcja: [Popraw treść]
```

---

### 6.3 Empty States

#### Empty Quest List
```
Icon: 📦
Tytuł: "Nie masz jeszcze żadnych questów"
Opis: "Wygeneruj swój pierwszy quest lub wybierz preset"
Akcja: [Wygeneruj quest] [Zobacz presety]
```

#### Empty Filtered List
```
Icon: 🔍
Tytuł: "Brak questów spełniających kryteria"
Opis: "Spróbuj zmienić filtry lub wygeneruj nowy quest"
Akcja: [Resetuj filtry] [Wygeneruj quest]
```

#### Empty Favorites
```
Icon: ⭐
Tytuł: "Nie masz jeszcze ulubionych questów"
Opis: "Kliknij ikonę serca przy queście, aby dodać go do ulubionych"
Akcja: [Zobacz wszystkie questy]
```

---

### 6.4 Success States

#### Toast Notifications

**Quest Started**:
```
✓ "Quest rozpoczęty"
Duration: 3s
```

**Quest Completed**:
```
🎉 "Quest ukończony!"
Duration: 3s
```

**Quest Saved**:
```
💾 "Quest zapisany"
Duration: 3s
```

**Quest Deleted**:
```
✓ "Quest usunięty"
Duration: 3s
```

**Favorite Added**:
```
⭐ "Dodano do ulubionych"
Duration: 2s
```

**Settings Saved**:
```
✓ "Ustawienia zapisane"
Duration: 3s
```

---

## 7. Mapowanie historyjek użytkownika do UI

### 7.1 Authentication & Profile (US-001 do US-005)

| User Story | Widoki | Komponenty |
|------------|---------|-----------|
| US-001: Rejestracja email | V-002: Register | RegisterForm, Toast |
| US-002: Logowanie email | V-003: Login | LoginForm, Toast |
| US-003: Logowanie Google | V-002, V-003 | GoogleAuthButton |
| US-004: Wylogowanie | V-009: Profile | Navbar dropdown, Button |
| US-005: Reset hasła | V-004: Reset Password | ResetPasswordForm |

---

### 7.2 Quest Generation (US-006 do US-009)

| User Story | Widoki | Komponenty |
|------------|---------|-----------|
| US-006: Generacja z defaultami | V-006: Generator | GeneratorForm, QuestResult |
| US-007: Generacja z presetów | V-006: Generator | PresetCard, GeneratorForm |
| US-008: Wyświetlenie questa | V-006, V-008 | QuestResult, QuestDetail |
| US-009: Akceptuję i zaczynam | V-006, V-008 | QuestResult action button |

---

### 7.3 Quest Actions (US-010 do US-012)

| User Story | Widoki | Komponenty |
|------------|---------|-----------|
| US-010: Zapisz na później | V-006: Generator | QuestResult action button |
| US-011: Pomiń | V-006: Generator | QuestResult action button |
| US-012: Ukończono | V-008: Quest Detail | QuestDetail action button |

---

### 7.4 Manual Creation (US-013)

| User Story | Widoki | Komponenty |
|------------|---------|-----------|
| US-013: Tworzenie manualne | V-007: Create Manual | ManualQuestForm, ContentPolicyAlert |

---

### 7.5 Quest Management (US-014 do US-018)

| User Story | Widoki | Komponenty |
|------------|---------|-----------|
| US-014: Lista "Moje questy" | V-005: Dashboard | QuestList, QuestCard, EmptyState |
| US-015: Filtry i sortowanie | V-005: Dashboard | FilterSidebar, FilterSheet, SortPicker |
| US-016: Ulubione | V-005, V-008 | QuestCard favorite icon, QuestDetail header |
| US-017: Usuwanie | V-008: Quest Detail | QuestDetail menu, ConfirmDialog |
| US-018: Detal questa | V-008: Quest Detail | QuestDetail |

---

### 7.6 Regeneration & Content Safety (US-019 do US-021)

| User Story | Widoki | Komponenty |
|------------|---------|-----------|
| US-019: Wygeneruj ponownie | V-006: Generator | QuestResult action button |
| US-020: Content policy | V-006, V-007 | ContentPolicyAlert, inline validation |
| US-021: Błąd generacji | V-006: Generator | ErrorState, Toast |

---

### 7.7 Edge Cases & Security (US-022 do US-027)

| User Story | Widoki | Komponenty |
|------------|---------|-----------|
| US-022: Granica wieku 8 lat | V-006, V-007 | VisualPicker z tooltip |
| US-023: Persistencja danych | Wszystkie | API integration, React Query cache |
| US-024: Bezpieczeństwo logowania | V-003: Login | Rate limiting (API), error handling |
| US-025: Puste stany | V-005: Dashboard | EmptyState z CTA |
| US-026: Responsywność | Wszystkie | Mobile-first CSS, breakpoints |
| US-027: Walidacja manualna | V-007: Create Manual | ContentPolicyAlert, inline suggestions |

---

### 7.8 UX & Telemetry (US-028 do US-030)

| User Story | Widoki | Komponenty |
|------------|---------|-----------|
| US-028: Widoczność źródła | V-005, V-008 | SourceBadge |
| US-029: Miejsce i energia | V-006, V-007 | VisualPicker |
| US-030: Time-to-First-Start | V-006: Generator | Telemetry tracking hook |

---

## 8. Accessibility Considerations

### 8.1 WCAG 2.1 Level AA Compliance

#### Color Contrast
- Primary color (#f05945) tested against white/black backgrounds
- All text meets 4.5:1 ratio minimum
- Status badges use sufficient contrast for readability

#### Keyboard Navigation
- All interactive elements focusable via Tab
- Enter/Space activates buttons
- Escape closes modals/dialogs
- Arrow keys for radio groups and sliders

#### Screen Reader Support
- Semantic HTML5 elements (header, nav, main, section, footer)
- ARIA labels on icon-only buttons
- ARIA live regions for toast notifications
- ARIA expanded/collapsed for dropdowns and sheets

#### Focus Management
- Visible focus indicators on all interactive elements (2px solid outline)
- Focus trap in modals and dialogs
- Auto-focus on first field in forms
- Focus return after closing modals

---

### 8.2 Responsive Design

#### Breakpoints
```css
mobile: < 640px
tablet: 640px - 1023px
desktop: ≥ 1024px
```

#### Touch Targets
- Minimum 48x48px for all interactive elements (mobile)
- Generous spacing between buttons (min 8px gap)

#### Typography Scale
```
mobile: 
  body: 14px / 1.5
  h1: 24px
  h2: 20px
  h3: 18px

desktop:
  body: 16px / 1.6
  h1: 32px
  h2: 24px
  h3: 20px
```

---

### 8.3 Performance

#### Core Web Vitals Targets
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

#### Optimization Strategies
- Astro SSR for fast initial render
- React islands for minimal hydration overhead
- Image optimization (future: lazy loading, responsive images)
- Code splitting (per-route)
- React Query caching to minimize API calls

---

### 8.4 Security

#### Client-Side
- Content policy pre-validation before API calls
- XSS protection via React's built-in escaping
- Input sanitization (Zod schemas)
- No sensitive data in localStorage (only preferences)

#### Authentication
- Supabase Auth with httpOnly cookies
- RLS enforcement at database level
- Protected routes redirect to /login if unauthenticated

#### Rate Limiting
- API layer enforcement (5/min for generation)
- Client-side feedback (countdown timer, disabled button)

---

## 9. Mapowanie wymagań funkcjonalnych na UI

### 9.1 Generowanie questów AI (Wymaganie 3.1)

**Formularz parametrów** → `GeneratorForm` (V-006)
- Wiek: `VisualPicker` z emoji 👶🧒👦🧑
- Czas: `DurationSlider` z presetami
- Miejsce: `VisualPicker` 🏠🌳
- Energia: `VisualPicker` 🛋️🚶🏃
- Rekwizyty: `PropMultiSelect` z emoji

**Defaulty i presety** → `PresetCard` grid (V-006)
- 4 presety: Szybka zabawa, Kreatywna chwila, Budowanie, Ruch!

**Struktura outputu** → `QuestResult` (V-006) i `QuestDetail` (V-008)
- Wszystkie sekcje zgodne z API: hook, kroki, warianty, bezpieczeństwo, metadata

**Akcje** → Action buttons w `QuestResult` i `QuestDetail`
- Akceptuję i zaczynam → `onAcceptAndStart`
- Zapisz na później → `onSave`
- Pomiń → `onSkip`
- Wygeneruj ponownie → `onRegenerate`

---

### 9.2 Tworzenie manualne (Wymaganie 3.2)

**Formularz** → `ManualQuestForm` (V-007)
- Pola treści: title, hook, step1-3, easier_version, harder_version, safety_notes
- Pola parametrów: identyczne jak generator

**Walidacje** → `ContentPolicyAlert`
- Hard-ban → error alert, blokuje submit
- Soft-ban → warning alert, sugestie zamienników

---

### 9.3 Katalog i zarządzanie (Wymaganie 3.3)

**Lista** → `QuestList` z `QuestCard` (V-005)
- Sortowanie: Sort picker (Ostatnie / Ulubione)
- Paginacja: 20 per page z prev/next buttons

**Filtry** → `FilterSidebar` (desktop) / `FilterSheet` (mobile)
- Wszystkie filtry zgodne z API query params

**Detal** → `QuestDetail` (V-008)
- Pełna treść + akcje (Ulubione, Rozpocznij/Ukończ, Usuń)

---

### 9.4 Konta i bezpieczeństwo (Wymaganie 3.4)

**Rejestracja** → `RegisterForm` (V-002)
- Email+hasło: inline validation
- Google OAuth: `GoogleAuthButton`

**Logowanie** → `LoginForm` (V-003)
- Email+hasło + Google

**Reset hasła** → `ResetPasswordForm` (V-004)

**Profil** → `ProfileLayout` (V-009)
- Domyślne ustawienia: editable form

---

### 9.5 Telemetria (Wymaganie 3.5)

**Events tracked** → Client-side hooks
- Wszystkie wymagane eventy zgodne z PRD
- Batch flushing (10s lub 5 events)
- Zustand store dla queue

**Time-to-First-Start** → Custom hook w `GeneratorForm`
- Tracking: entry timestamp → quest_started timestamp

---

### 9.6 Obsługa błędów (Wymaganie 3.6)

**Błąd generacji** → `ErrorState` w `GeneratorForm`
- Komunikat PL + retry button

**Brak internetu** → Network error state

**Puste stany** → `EmptyState` z CTA

**Granice wieku** → Tooltip w `VisualPicker`

---

### 9.7 Polityka bezpieczeństwa (Wymaganie 3.7)

**Hard-ban** → `ContentPolicyAlert` type="error"
- Blokuje submit

**Soft-ban** → `ContentPolicyAlert` type="warning"
- Sugestie zamienników

**Język i styl** → Enforced w AI prompt (backend)
- Frontend tylko wyświetla wynik

---

## 10. Punkty bólu użytkownika i rozwiązania UI

### 10.1 Problem: "Nie wiem co wybrać" (Decision Fatigue)

**Rozwiązanie UI**:
- **Presety** na górze generatora (4 opcje quick-start)
- **Domyślne wartości** z profilu użytkownika
- **Wizualne pickery** zamiast dropdownów (łatwiejszy wybór)

**Komponenty**:
- `PresetCard` grid
- `VisualPicker` z emoji
- Default values w `GeneratorForm`

---

### 10.2 Problem: "Generowanie trwa zbyt długo"

**Rozwiązanie UI**:
- **Loading state** z komunikatem "Generuję quest..." (managing expectations)
- **Timeout** po 30s z opcją retry
- **Presety** jako alternatywa (instant fill + submit)

**Komponenty**:
- `LoadingState` z kontekstowym komunikatem
- `ErrorState` po timeout

---

### 10.3 Problem: "Nie wiem czy quest jest bezpieczny"

**Rozwiązanie UI**:
- **Sekcja bezpieczeństwa** widoczna w każdym queście (⚠️ icon)
- **Content policy validation** przy ręcznym tworzeniu
- **Inline walidacja** z jasnym komunikatem o naruszeniach

**Komponenty**:
- Safety notes section w `QuestDetail` i `QuestResult`
- `ContentPolicyAlert` w `ManualQuestForm`

---

### 10.4 Problem: "Zapomniałem o queście, który chciałem zrobić"

**Rozwiązanie UI**:
- **Ulubione** (przypinanie ważnych questów)
- **Status badges** (Zapisany / Rozpoczęty)
- **Sortowanie po ulubionych** (quick access)

**Komponenty**:
- Favorite icon w `QuestCard` i `QuestDetail`
- Filter "Tylko ulubione" w `FilterSidebar`
- Sort by favorites w `SortPicker`

---

### 10.5 Problem: "Mam za dużo questów, nie znajduję tego czego szukam"

**Rozwiązanie UI**:
- **Filtry** (wiek, miejsce, energia, rekwizyty, źródło, status)
- **Sortowanie** (Ostatnie / Ulubione)
- **Paginacja** (20 per page)
- **Filtry w URL** (shareable, persistent)

**Komponenty**:
- `FilterSidebar` (desktop)
- `FilterSheet` (mobile)
- Query params w URL

---

### 10.6 Problem: "Nie wiem jak długo zajmie quest"

**Rozwiązanie UI**:
- **Metadata badges** z czasem (⏱️ 30 min) widoczne na każdej karcie
- **Duration slider** w generatorze z preset buttons (5, 15, 30, 60 min)

**Komponenten**:
- `MetadataBadge` w `QuestCard`
- `DurationSlider` w `GeneratorForm`

---

### 10.7 Problem: "Wygenerowany quest nie pasuje" (Low Start Rate)

**Rozwiązanie UI**:
- **Akcja "Pomiń"** z zachowaniem parametrów (easy retry)
- **"Wygeneruj ponownie"** shortcut (same params, new content)
- **"Zapisz na później"** (nie tracę questa, mogę wrócić)

**Komponenty**:
- Action buttons w `QuestResult`
- Formularz persistence w `GeneratorForm`

---

### 10.8 Problem: "Nie wiem czy quest jest dla mojego dziecka" (Age Matching)

**Rozwiązanie UI**:
- **Wizualne pickery wieku** z emoji (👶🧒👦🧑) - instant recognition
- **Age badges** na każdej karcie questa
- **Filtry wieku** w liście (quick filtering)
- **Tooltip dla wieku 8 lat** (jasne mapowanie do grupy 7-8)

**Komponenty**:
- `VisualPicker` z emoji w `GeneratorForm`
- Age badge w `QuestCard` metadata
- Age filter w `FilterSidebar`

---

### 10.9 Problem: "Aplikacja wydaje się wolna" (Perceived Performance)

**Rozwiązanie UI**:
- **Optimistic updates** dla favorite toggle (instant feedback)
- **Skeleton loaders** podczas ładowania listy
- **React Query caching** (5 min stale time dla questów)
- **Toast notifications** (immediate confirmation)

**Komponenty**:
- Optimistic update logic w `QuestCard`
- Skeleton screens w `QuestList`
- Toast component dla akcji

---

### 10.10 Problem: "Nie wiem co się stało" (Lack of Feedback)

**Rozwiązanie UI**:
- **Toast notifications** dla każdej akcji (Quest zapisany, rozpoczęty, ukończony)
- **Status badges** (wizualna reprezentacja stanu)
- **Loading states** z komunikatami ("Generuję quest...")
- **Error states** z retry option

**Komponenty**:
- Toast container w `DashboardLayout`
- `StatusBadge` w `QuestCard` i `QuestDetail`
- `LoadingState` i `ErrorState`

---

## 11. Kolejność implementacji (Priority)

### Phase 1: Core Infrastructure (Day 1-2)
1. Setup Tailwind 4 + Shadcn/ui init
2. Create `DashboardLayout` (Navbar, BottomNav)
3. Setup Zustand store (auth state, UI state)
4. Setup React Query client
5. Create Supabase client wrappers (client.ts, server.ts)
6. Implement auth middleware (Astro)

### Phase 2: Authentication (Day 2-3)
1. `RegisterForm` component (V-002)
2. `LoginForm` component (V-003)
3. `ResetPasswordForm` component (V-004)
4. Auth API integration
5. Protected route handling

### Phase 3: Quest List & Management (Day 3-5)
1. `QuestCard` component (V-005)
2. `QuestList` component (V-005)
3. `FilterSidebar` / `FilterSheet` components (V-005)
4. `EmptyState` component (V-005)
5. API integration: GET /api/quests
6. Pagination logic
7. Filter URL persistence

### Phase 4: Quest Detail (Day 5-6)
1. `QuestDetail` component (V-008)
2. Action handlers (start, complete, favorite, delete)
3. `ConfirmDialog` component (delete confirmation)
4. API integration: GET /api/quests/:id, PATCH, DELETE
5. Optimistic updates

### Phase 5: Quest Generator (Day 6-9)
1. `VisualPicker` component (reusable)
2. `DurationSlider` component
3. `PropMultiSelect` component
4. `PresetCard` component
5. `GeneratorForm` component (V-006)
6. `QuestResult` component (V-006)
7. API integration: POST /api/quests/generate, POST /api/quests
8. Loading/error states
9. Form persistence (localStorage)

### Phase 6: Manual Creation (Day 9-10)
1. `ManualQuestForm` component (V-007)
2. `ContentPolicyAlert` component
3. Content policy validation (client-side)
4. API integration: POST /api/quests (source=manual)
5. Draft persistence (localStorage)

### Phase 7: Profile & Settings (Day 10-11)
1. `ProfileLayout` component (V-009)
2. `DefaultPreferencesForm` component
3. API integration: GET /api/profiles/me, PATCH /api/profiles/me
4. Logout functionality

### Phase 8: Telemetry & Polish (Day 11-12)
1. Telemetry hooks (event tracking)
2. Batch flushing logic (Zustand)
3. Time-to-First-Start tracking
4. Toast notifications refinement
5. Loading states polish
6. Error handling refinement

### Phase 9: Responsive & Accessibility (Day 12-13)
1. Mobile layout refinement
2. Touch target sizing
3. Keyboard navigation testing
4. ARIA labels audit
5. Focus management

### Phase 10: Testing & Bug Fixes (Day 13-14)
1. E2E testing (critical paths)
2. Cross-browser testing
3. Performance audit
4. Bug fixes

---

## 12. Technologie i narzędzia

### 12.1 Core Stack
- **Astro 5**: SSR, routing, middleware
- **React 19**: Interactive islands
- **TypeScript 5**: Type safety
- **Tailwind 4**: Styling
- **Shadcn/ui**: UI components (cherry-picked)

### 12.2 State Management
- **Zustand**: Global state (auth, UI, telemetry queue)
- **React Query**: API caching, mutations, optimistic updates
- **React Hook Form**: Form state
- **Zod**: Schema validation

### 12.3 API Integration
- **Supabase SDK**: Auth, database, RLS
- **OpenRouter**: AI generation (backend)

### 12.4 Utilities
- **lucide-react**: Icons
- **class-variance-authority**: Component variants
- **clsx** + **tailwind-merge**: Class merging
- **date-fns**: Date formatting (future)

---

## Podsumowanie

Architektura UI KidsQuest MVP została zaprojektowana z naciskiem na:

1. **Minimalizację tarcia decyzyjnego**: Presety, defaulty, wizualne pickery
2. **Szybki time-to-action**: < 30s od rejestracji do pierwszego questa
3. **Bezpieczeństwo treści**: Content policy validation z jasnym feedbackiem
4. **Responsywność**: Mobile-first approach z dedykowanymi wzorcami
5. **Accessibility**: WCAG 2.1 Level AA compliance
6. **Performance**: Astro SSR + React islands + React Query caching

Każdy widok, komponent i interakcja została zaprojektowana z myślą o celu biznesowym: **Start Rate ≥ 75%** i **AI Share ≥ 75%**.

Architektura jest gotowa do implementacji zgodnie z priorytetami w sekcji 11.

