# Deployment na Netlify

## ⚠️ Ważne: Konfiguracja projektu na Netlify

Jeśli już masz utworzony projekt na Netlify i widzisz błąd 404, **MUSISZ** sprawdzić i poprawić ustawienia:

### Poprawka dla istniejącego projektu

1. Wejdź w **Site settings** > **Build & deploy** > **Build settings**
2. Znajdź pole **Publish directory**
3. **POZOSTAW JE PUSTE** lub usuń wartość "dist"
   - Adapter Astro Netlify automatycznie wykryje właściwą strukturę
   - Ręczne ustawienie "dist" powoduje błąd 404!
4. Kliknij **Save**
5. Wykonaj **Clear cache and deploy site** w zakładce **Deploys**

### 1. Konfiguracja nowego projektu Netlify

1. Zaloguj się do [Netlify](https://app.netlify.com/)
2. Utwórz nowy projekt
3. Znajdź **Site ID** w ustawieniach projektu (Settings > General > Site details)
4. Wygeneruj **Personal Access Token** w ustawieniach użytkownika (User settings > Applications > Personal access tokens)
5. **Ważne**: W Build settings **NIE ustawiaj** Publish directory (pozostaw puste)

### 2. Konfiguracja GitHub Secrets

Dodaj następujące sekrety w ustawieniach repozytorium GitHub:
(Settings > Secrets and variables > Actions > New repository secret)

#### Wymagane sekrety:

- `PUBLIC_SUPABASE_URL` - URL twojego projektu Supabase
- `PUBLIC_SUPABASE_ANON_KEY` - Klucz publiczny (anon) z Supabase
- `OPENROUTER_API_KEY` - Klucz API do OpenRouter.ai
- `NETLIFY_SITE_ID` - ID projektu Netlify
- `NETLIFY_AUTH_TOKEN` - Personal Access Token z Netlify

#### Opcjonalne sekrety dla codecov:

- `CODECOV_TOKEN` - Token do przesyłania raportów coverage (jeśli używasz)

### 3. Zmienne środowiskowe w Netlify

Dodaj również zmienne środowiskowe w panelu Netlify:
(Site settings > Environment variables)

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY`

### 4. Deployment

Po skonfigurowaniu sekretów, każdy push do brancha `main` automatycznie:
1. Uruchomi linting
2. Wykona testy jednostkowe
3. Zbuduje projekt
4. Wdroży na Netlify

## Lokalne testowanie buildu

Aby przetestować build lokalnie przed wdrożeniem:

```bash
npm run build
npm run preview
```

## Struktura CI/CD

Workflow `master.yml` składa się z następujących kroków:

1. **Lint** - sprawdzenie jakości kodu
2. **Unit Tests** - testy jednostkowe z coverage
3. **Build** - budowanie aplikacji
4. **Deploy** - wdrożenie na Netlify
5. **Status Notification** - powiadomienie o statusie deployu

## Troubleshooting

### ❌ Błąd 404 "Not Found" na stronie

**Przyczyna**: Najczęściej to problem z ustawieniem "Publish directory" w Netlify.

**Rozwiązanie**:
1. W panelu Netlify: **Site settings** > **Build & deploy** > **Build settings**
2. Znajdź **Publish directory** i **usuń wartość** (pozostaw puste)
3. Kliknij **Save**
4. W zakładce **Deploys** kliknij **Clear cache and deploy site**

### Build fails on Netlify

Sprawdź:
- Czy wszystkie zmienne środowiskowe są poprawnie ustawione w Netlify
- Czy Node.js version (22.14.0) jest wspierana
- Logi buildu w panelu Netlify

### Deployment fails in GitHub Actions

Sprawdź:
- Czy wszystkie sekrety są dodane w GitHub
- Czy `NETLIFY_SITE_ID` i `NETLIFY_AUTH_TOKEN` są poprawne
- Logi workflow w GitHub Actions

### Environment variables missing

Upewnij się, że:
- Zmienne są dodane zarówno w GitHub Secrets (dla CI/CD)
- Zmienne są dodane w Netlify (dla runtime)
- Zmienne zaczynające się od `PUBLIC_` są dostępne w kodzie klienckim

### Funkcje SSR nie działają

Upewnij się, że:
- Plik `public/_redirects` istnieje i przekierowuje do `/.netlify/functions/ssr`
- W `netlify.toml` NIE MA ustawionego `publish` directory
- Build command to `npm run build`

