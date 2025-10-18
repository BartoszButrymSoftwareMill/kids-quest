# Plan implementacji widoku Generator questów

## 1. Przegląd

Generator questów to kluczowy widok aplikacji KidsQuest, umożliwiający użytkownikom generowanie spersonalizowanych scenariuszy zabaw dla dzieci za pomocą AI. Widok składa się z dwóch głównych stanów:

1. **Stan formularza** - wizualne pickery do wyboru parametrów (wiek, czas, miejsce, energia, rekwizyty) oraz presety do szybkiego startu
2. **Stan wyniku** - wyświetlenie wygenerowanego questa z akcjami (akceptuj i rozpocznij, zapisz na później, pomiń, wygeneruj ponownie)

Główne cele widoku:
- Umożliwienie szybkiej generacji questa (cel MVP: Time-to-First-Start < 30s)
- Intuicyjny interfejs z wizualnymi pickerami (touch-friendly)
- Wsparcie dla presetów (szybkie templates)
- Obsługa rate limiting (5/min, 30/hour)
- Persistence parametrów między sesjami (localStorage)
- Optymalna obsługa błędów i edge cases

## 2. Routing widoku

**Ścieżka**: `/dashboard/generate`

**Typ**: Astro SSR page z React islands dla interaktywnych komponentów

**Wymagania**:
- Wymagana autentykacja (middleware redirect do `/login` jeśli brak sesji)
- Layout: `DashboardLayout` z navbar i navigation
- Meta tags: title "Generuj quest | KidsQuest", description dla SEO

## 3. Struktura komponentów

```
GeneratorPage (Astro SSR)
├── DashboardLayout
│   ├── Navbar
│   └── BottomNav (mobile)
└── GeneratorContainer (React Island)
    ├── PresetSection (opcjonalne, na górze)
    │   └── PresetCard[] (4 presety)
    ├── GeneratorForm (stan: form)
    │   ├── VisualPicker (wiek)
    │   ├── DurationSlider
    │   ├── VisualPicker (miejsce)
    │   ├── VisualPicker (energia)
    │   ├── PropMultiSelect
    │   └── FormActions
    │       ├── Button "Generuj quest"
    │       └── Link "Stwórz quest ręcznie"
    ├── LoadingState (stan: loading)
    │   ├── Spinner
    │   └── ProgressMessage
    ├── QuestResult (stan: result)
    │   ├── QuestContentDisplay
    │   │   ├── HookSection
    │   │   ├── StepsSection
    │   │   ├── VariantsSection (łatwiej/trudniej)
    │   │   ├── SafetySection
    │   │   └── MetadataSection
    │   └── ResultActions
    │       ├── Button "Akceptuję i zaczynam"
    │       ├── Button "Zapisz na później"
    │       ├── Button "Pomiń"
    │       └── Link "Wygeneruj ponownie"
    └── ErrorState (stan: error)
        ├── ErrorAlert
        │   ├── Icon
        │   ├── Message
        │   └── RetryButton
        └── BackToFormButton
```

## 4. Szczegóły komponentów

### 4.1 GeneratorContainer (React Island)

**Opis**: Główny kontener zarządzający stanem generatora i przepływem między formem, loadingiem, wynikiem i błędem.

**Główne elementy**:
- Stan aplikacji (form | loading | result | error)
- Dane formularza i wygenerowanego questa
- Obsługa przejść między stanami

**Obsługiwane zdarzenia**:
- `onPresetSelect(preset: PresetConfig)` - wybór presetu, auto-fill formularza i submit
- `onFormSubmit(data: GeneratorFormData)` - submit formularza generacji
- `onAcceptAndStart(quest: AIGeneratedQuest)` - zapisz quest ze statusem "started"
- `onSaveForLater(quest: AIGeneratedQuest)` - zapisz quest ze statusem "saved"
- `onSkip()` - powrót do formularza bez zapisywania
- `onRegenerateWithSameParams()` - ponowna generacja z tymi samymi parametrami
- `onRetry()` - retry po błędzie

**Walidacja**:
- Walidacja formularza przez Zod schema (`generateQuestSchema`)
- Wszystkie pola wymagane oprócz `prop_ids` i `app_version`
- age_group_id: positive int
- duration_minutes: 1-480
- location: 'home' | 'outdoor'
- energy_level: 'low' | 'medium' | 'high'

**Typy**:
- `GeneratorState` - typ stanu ('form' | 'loading' | 'result' | 'error')
- `GeneratorFormData` - dane formularza
- `AIGeneratedQuest` - wygenerowany quest
- `ApiError` - błąd z API
- `AgeGroupResponse[]` - lista grup wiekowych
- `PropResponse[]` - lista rekwizytów
- `ProfileResponse` - profil użytkownika z defaultami

**Propsy**: Brak (top-level container, dane pobierane wewnętrznie)

---

### 4.2 PresetSection

**Opis**: Sekcja z kartami presetów do szybkiego startu. Opcjonalna w MVP (może być ukryta pod flagą feature).

**Główne elementy**:
- Grid 4 kart presetów (2x2 desktop, stack mobile)
- Każda karta: emoji, tytuł, krótki opis parametrów

**Obsługiwane zdarzenia**:
- `onClick(preset: PresetConfig)` - kliknięcie karty presetu

**Walidacja**: Brak (tylko wybór presetu)

**Typy**:
- `PresetConfig` - konfiguracja presetu

**Propsy**:
```typescript
interface PresetSectionProps {
  onSelect: (preset: PresetConfig) => void;
}
```

---

### 4.3 PresetCard

**Opis**: Karta pojedynczego presetu z emoji, tytułem i opisem.

**Główne elementy**:
- `<button>` lub `<Card>` z emoji, tytułem, opisem
- Hover/focus states dla accessibility

**Obsługiwane zdarzenia**:
- `onClick()` - kliknięcie karty

**Walidacja**: Brak

**Typy**:
- `PresetConfig` - dane presetu

**Propsy**:
```typescript
interface PresetCardProps {
  preset: PresetConfig;
  onClick: () => void;
}
```

---

### 4.4 GeneratorForm

**Opis**: Formularz z wizualnymi pickerami do wyboru parametrów generacji questa. Używa React Hook Form + Zod do walidacji.

**Główne elementy**:
- `<form>` z visual pickerami dla każdego parametru
- Divider "lub dostosuj parametry" (jeśli presety są widoczne)
- Przyciski akcji na dole

**Obsługiwane zdarzenia**:
- `onSubmit(data: GeneratorFormData)` - submit formularza po walidacji
- `onChange(field: keyof GeneratorFormData, value: any)` - zmiana wartości pola
- `onValidationError(errors: FieldErrors)` - błędy walidacji

**Walidacja**:
- Wszystkie pola wymagane oprócz `prop_ids`
- age_group_id: positive int, musi istnieć w `age_groups`
- duration_minutes: 1-480
- location: 'home' | 'outdoor'
- energy_level: 'low' | 'medium' | 'high'
- prop_ids: array of positive ints (optional)

**Typy**:
- `GeneratorFormData` - dane formularza
- `AgeGroupResponse[]` - opcje grup wiekowych
- `PropResponse[]` - opcje rekwizytów
- `FieldErrors` - błędy walidacji z React Hook Form

**Propsy**:
```typescript
interface GeneratorFormProps {
  initialValues: Partial<GeneratorFormData>;
  ageGroups: AgeGroupResponse[];
  props: PropResponse[];
  onSubmit: (data: GeneratorFormData) => void;
  isLoading: boolean;
}
```

---

### 4.5 VisualPicker (Generic)

**Opis**: Komponent generyczny do wyboru opcji w formie wizualnych przycisków z emoji/ikonami. Używany dla wieku, miejsca i energii.

**Główne elementy**:
- Label z opcjonalnym tooltipem
- Grid przycisków opcji (responsive)
- Każdy przycisk: emoji/ikona + label
- Selected state (border, background)

**Obsługiwane zdarzenia**:
- `onChange(value: string | number)` - wybór opcji

**Walidacja**:
- value musi być jednym z dostępnych options

**Typy**:
- `VisualPickerOption<T>` - opcja pickera

**Propsy**:
```typescript
interface VisualPickerProps<T extends string | number> {
  label: string;
  options: VisualPickerOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
  required?: boolean;
  tooltip?: string;
}

interface VisualPickerOption<T> {
  value: T;
  label: string;
  emoji?: string;
  icon?: React.ReactNode;
}
```

---

### 4.6 DurationSlider

**Opis**: Slider do wyboru czasu trwania questa (1-480 minut) z presetowymi przyciskami (5, 15, 30, 60 min).

**Główne elementy**:
- Label "Czas trwania"
- Slider (1-480)
- Display wartości: "{value} min"
- Preset buttons pod sliderem (5, 15, 30, 60)

**Obsługiwane zdarzenia**:
- `onChange(value: number)` - zmiana wartości slidera
- `onPresetClick(value: number)` - kliknięcie preset buttona

**Walidacja**:
- value: 1-480 (int)

**Typy**:
- number (1-480)

**Propsy**:
```typescript
interface DurationSliderProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
  required?: boolean;
}
```

---

### 4.7 PropMultiSelect

**Opis**: Multi-select component do wyboru rekwizytów z emoji. Pozwala wybrać wiele opcji lub "Bez rekwizytów".

**Główne elementy**:
- Label "Rekwizyty"
- Grid checkboxów z emoji + label
- Opcja "Bez rekwizytów" wzajemnie wykluczająca się z innymi

**Obsługiwane zdarzenia**:
- `onChange(values: number[])` - zmiana wybranych rekwizytów
- `onToggle(propId: number, checked: boolean)` - toggle pojedynczego rekvitu

**Walidacja**:
- Jeśli wybrano "Bez rekwizytów" (id=3), to prop_ids = [3]
- W przeciwnym razie prop_ids = array of selected ids (bez 3)

**Typy**:
- `PropResponse[]` - lista rekwizytów

**Propsy**:
```typescript
interface PropMultiSelectProps {
  props: PropResponse[];
  value: number[];
  onChange: (values: number[]) => void;
  error?: string;
}
```

---

### 4.8 LoadingState

**Opis**: Stan ładowania podczas generacji questa z spinnerem i komunikatem postępu.

**Główne elementy**:
- Spinner/loader animation
- Tekst: "Generuję quest..." lub progress message
- Opcjonalnie: progress bar (jeśli możliwe oszacowanie czasu)

**Obsługiwane zdarzenia**: Brak (tylko display)

**Walidacja**: Brak

**Typy**: Brak

**Propsy**:
```typescript
interface LoadingStateProps {
  message?: string;
}
```

---

### 4.9 QuestResult

**Opis**: Wyświetlenie wygenerowanego questa z pełną treścią i akcjami.

**Główne elementy**:
- `QuestContentDisplay` - treść questa
- `ResultActions` - przyciski akcji

**Obsługiwane zdarzenia**:
- `onAcceptAndStart()` - zapisz quest ze statusem "started"
- `onSaveForLater()` - zapisz quest ze statusem "saved"
- `onSkip()` - powrót do formularza
- `onRegenerateWithSameParams()` - ponowna generacja

**Walidacja**: Brak (tylko display i akcje)

**Typy**:
- `AIGeneratedQuest` - wygenerowany quest

**Propsy**:
```typescript
interface QuestResultProps {
  quest: AIGeneratedQuest;
  ageGroups: AgeGroupResponse[];
  props: PropResponse[];
  onAcceptAndStart: () => void;
  onSaveForLater: () => void;
  onSkip: () => void;
  onRegenerateWithSameParams: () => void;
  isSubmitting: boolean;
}
```

---

### 4.10 QuestContentDisplay

**Opis**: Komponent wyświetlający treść questa w strukturyzowany sposób (hook, kroki, warianty, bezpieczeństwo, metadata).

**Główne elementy**:
- Section Hook (większa czcionka, highlight)
- Section Kroki (lista 3 kroków)
- Section Wersja łatwiej
- Section Wersja trudniej
- Section Bezpieczeństwo (z ikoną ⚠️)
- Section Parametry (badges z emoji i labelami)

**Obsługiwane zdarzenia**: Brak (tylko display)

**Walidacja**: Brak

**Typy**:
- `AIGeneratedQuest` - quest do wyświetlenia
- `AgeGroupResponse` - do pokazania labelu grupy wiekowej
- `PropResponse[]` - do pokazania labeli rekwizytów

**Propsy**:
```typescript
interface QuestContentDisplayProps {
  quest: AIGeneratedQuest;
  ageGroup: AgeGroupResponse;
  props: PropResponse[];
}
```

---

### 4.11 ResultActions

**Opis**: Przyciski akcji dla wygenerowanego questa.

**Główne elementy**:
- Button primary: "✓ Akceptuję i zaczynam" (green)
- Button secondary: "💾 Zapisz na później"
- Button tertiary: "⏭️ Pomiń"
- Link: "🔄 Wygeneruj ponownie"

**Obsługiwane zdarzenia**:
- `onAcceptAndStart()` - primary action
- `onSaveForLater()` - secondary action
- `onSkip()` - tertiary action
- `onRegenerateWithSameParams()` - link action

**Walidacja**: Brak

**Typy**: Brak

**Propsy**:
```typescript
interface ResultActionsProps {
  onAcceptAndStart: () => void;
  onSaveForLater: () => void;
  onSkip: () => void;
  onRegenerateWithSameParams: () => void;
  isSubmitting: boolean;
}
```

---

### 4.12 ErrorState

**Opis**: Stan błędu z komunikatem i opcjami retry/powrotu.

**Główne elementy**:
- Alert z ikoną błędu
- Komunikat błędu (user-friendly)
- Retry button (jeśli applicable)
- Back to form button

**Obsługiwane zdarzenia**:
- `onRetry()` - ponowna próba generacji
- `onBackToForm()` - powrót do formularza

**Walidacja**: Brak

**Typy**:
- `ApiError` - błąd z API

**Propsy**:
```typescript
interface ErrorStateProps {
  error: ApiError;
  onRetry: () => void;
  onBackToForm: () => void;
  canRetry: boolean;
}
```

## 5. Typy

### 5.1 Typy z API (już zdefiniowane w src/types.ts)

```typescript
// Request do generacji
export interface GenerateQuestRequest {
  age_group_id: number;
  duration_minutes: number;
  location: LocationType; // 'home' | 'outdoor'
  energy_level: EnergyLevel; // 'low' | 'medium' | 'high'
  prop_ids?: number[];
  app_version?: string;
}

// Response z generacji (AI generated quest)
export interface AIGeneratedQuest {
  title: string;
  hook: string;
  step1: string;
  step2: string;
  step3: string;
  easier_version: string | null;
  harder_version: string | null;
  safety_notes: string | null;
  age_group_id: number;
  duration_minutes: number;
  location: LocationType;
  energy_level: EnergyLevel;
  prop_ids: number[];
  source: 'ai';
}

// Request do zapisania questa
export interface CreateQuestRequest {
  title: string;
  hook: string;
  step1: string;
  step2: string;
  step3: string;
  easier_version?: string | null;
  harder_version?: string | null;
  safety_notes?: string | null;
  age_group_id: number;
  duration_minutes: number;
  location: LocationType;
  energy_level: EnergyLevel;
  prop_ids?: number[];
  source: QuestSource; // 'ai' | 'manual'
  status?: QuestStatus; // 'saved' | 'started' | 'completed'
  app_version?: string;
}

// Response po zapisaniu
export interface QuestResponse {
  id: string;
  user_id: string;
  // ... (pełny quest z metadata)
}

// Reference data
export interface AgeGroupResponse {
  id: number;
  code: string;
  label: string;
  min_age?: number;
  max_age?: number;
}

export interface PropResponse {
  id: number;
  code: string;
  label: string;
}

export interface ProfileResponse {
  user_id: string;
  default_age_group_id: number | null;
  default_duration_minutes: number | null;
  default_location: LocationType | null;
  default_energy_level: EnergyLevel | null;
  created_at: string;
  updated_at: string;
}

// Error
export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
  violations?: ContentViolation[];
  suggestions?: ContentSuggestion[];
  retry_after?: number; // dla rate limiting
}
```

### 5.2 Nowe typy ViewModel (do utworzenia)

**Lokalizacja**: `src/lib/view-models/generator.types.ts`

```typescript
import type { 
  GenerateQuestRequest, 
  AIGeneratedQuest, 
  LocationType, 
  EnergyLevel,
  AgeGroupResponse,
  PropResponse,
  ProfileResponse,
  ApiError
} from '../../types';

/**
 * Stan generatora
 */
export type GeneratorState = 'form' | 'loading' | 'result' | 'error';

/**
 * Dane formularza generatora
 * Extends GenerateQuestRequest ale wszystkie pola nullable dla initial state
 */
export interface GeneratorFormData {
  age_group_id: number | null;
  duration_minutes: number;
  location: LocationType | null;
  energy_level: EnergyLevel | null;
  prop_ids: number[];
}

/**
 * Konfiguracja presetu
 */
export interface PresetConfig {
  id: string;
  emoji: string;
  title: string;
  description: string;
  params: GenerateQuestRequest;
}

/**
 * Opcja dla VisualPicker
 */
export interface VisualPickerOption<T extends string | number> {
  value: T;
  label: string;
  emoji?: string;
  icon?: React.ReactNode;
  tooltip?: string;
}

/**
 * Stan kontenera generatora
 */
export interface GeneratorContainerState {
  // Stan UI
  currentState: GeneratorState;
  
  // Dane formularza
  formData: GeneratorFormData;
  
  // Wygenerowany quest
  generatedQuest: AIGeneratedQuest | null;
  
  // Błąd
  error: ApiError | null;
  
  // Loading states
  isGenerating: boolean;
  isSaving: boolean;
  
  // Reference data
  ageGroups: AgeGroupResponse[];
  props: PropResponse[];
  profile: ProfileResponse | null;
}

/**
 * Preset definitions (constants)
 */
export const PRESETS: PresetConfig[] = [
  {
    id: 'quick_5min',
    emoji: '⚡',
    title: 'Szybka zabawa',
    description: '5 min, bez rekwizytów, średnia energia',
    params: {
      age_group_id: 2, // default 5-6
      duration_minutes: 5,
      location: 'home',
      energy_level: 'medium',
      prop_ids: [3], // bez rekwizytów
    }
  },
  {
    id: 'creative_15min',
    emoji: '🎨',
    title: 'Kreatywna chwila',
    description: '15 min, rysowanie, niska energia',
    params: {
      age_group_id: 2,
      duration_minutes: 15,
      location: 'home',
      energy_level: 'low',
      prop_ids: [2], // rysowanie
    }
  },
  {
    id: 'building_30min',
    emoji: '🧱',
    title: 'Budowanie',
    description: '30 min, klocki, średnia energia',
    params: {
      age_group_id: 2,
      duration_minutes: 30,
      location: 'home',
      energy_level: 'medium',
      prop_ids: [1], // klocki
    }
  },
  {
    id: 'outdoor_20min',
    emoji: '🏃',
    title: 'Ruch!',
    description: '20 min, dwór, wysoka energia',
    params: {
      age_group_id: 2,
      duration_minutes: 20,
      location: 'outdoor',
      energy_level: 'high',
      prop_ids: [3], // bez rekwizytów
    }
  }
];

/**
 * Default form values
 */
export const DEFAULT_FORM_VALUES: GeneratorFormData = {
  age_group_id: null,
  duration_minutes: 30,
  location: null,
  energy_level: null,
  prop_ids: [],
};

/**
 * LocalStorage keys
 */
export const STORAGE_KEYS = {
  GENERATOR_FORM: 'kidsquest_generator_form',
  LAST_PARAMS: 'kidsquest_last_params',
} as const;
```

### 5.3 Typy helper functions

```typescript
/**
 * Helper type guards
 */
export function isValidGeneratorFormData(data: Partial<GeneratorFormData>): data is GenerateQuestRequest {
  return (
    data.age_group_id !== null &&
    data.age_group_id !== undefined &&
    data.duration_minutes !== null &&
    data.duration_minutes !== undefined &&
    data.location !== null &&
    data.location !== undefined &&
    data.energy_level !== null &&
    data.energy_level !== undefined
  );
}

export function isRateLimitError(error: ApiError): boolean {
  return error.error === 'rate_limit_exceeded';
}

export function isGenerationError(error: ApiError): boolean {
  return error.error === 'generation_failed';
}
```

## 6. Zarządzanie stanem

### 6.1 Hook główny: `useGeneratorState`

**Lokalizacja**: `src/lib/hooks/useGeneratorState.ts`

**Odpowiedzialność**:
- Zarządzanie stanem generatora (form/loading/result/error)
- Obsługa przejść między stanami
- Przechowywanie danych formularza i wygenerowanego questa
- Integracja z localStorage dla persistence

**Struktura**:

```typescript
import { useState, useEffect, useCallback } from 'react';
import type {
  GeneratorState,
  GeneratorFormData,
  GeneratorContainerState,
  PresetConfig,
} from '../view-models/generator.types';
import type { AIGeneratedQuest, ApiError } from '../../types';
import { STORAGE_KEYS, DEFAULT_FORM_VALUES } from '../view-models/generator.types';

export function useGeneratorState(
  initialProfile: ProfileResponse | null,
  ageGroups: AgeGroupResponse[],
  props: PropResponse[]
) {
  const [state, setState] = useState<GeneratorContainerState>({
    currentState: 'form',
    formData: getInitialFormData(initialProfile),
    generatedQuest: null,
    error: null,
    isGenerating: false,
    isSaving: false,
    ageGroups,
    props,
    profile: initialProfile,
  });

  // Load saved form data from localStorage on mount
  useEffect(() => {
    const savedForm = localStorage.getItem(STORAGE_KEYS.GENERATOR_FORM);
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm);
        setState(prev => ({ ...prev, formData: parsed }));
      } catch {
        // Ignore invalid data
      }
    }
  }, []);

  // Save form data to localStorage on change
  useEffect(() => {
    if (state.formData) {
      localStorage.setItem(
        STORAGE_KEYS.GENERATOR_FORM,
        JSON.stringify(state.formData)
      );
    }
  }, [state.formData]);

  const updateFormData = useCallback((data: Partial<GeneratorFormData>) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...data },
    }));
  }, []);

  const setLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentState: 'loading',
      isGenerating: true,
      error: null,
    }));
  }, []);

  const setResult = useCallback((quest: AIGeneratedQuest) => {
    setState(prev => ({
      ...prev,
      currentState: 'result',
      generatedQuest: quest,
      isGenerating: false,
      error: null,
    }));
    
    // Save last params for "regenerate"
    localStorage.setItem(STORAGE_KEYS.LAST_PARAMS, JSON.stringify({
      age_group_id: quest.age_group_id,
      duration_minutes: quest.duration_minutes,
      location: quest.location,
      energy_level: quest.energy_level,
      prop_ids: quest.prop_ids,
    }));
  }, []);

  const setError = useCallback((error: ApiError) => {
    setState(prev => ({
      ...prev,
      currentState: 'error',
      error,
      isGenerating: false,
      isSaving: false,
    }));
  }, []);

  const resetToForm = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentState: 'form',
      generatedQuest: null,
      error: null,
      isGenerating: false,
      isSaving: false,
    }));
  }, []);

  const applyPreset = useCallback((preset: PresetConfig) => {
    setState(prev => ({
      ...prev,
      formData: {
        age_group_id: preset.params.age_group_id,
        duration_minutes: preset.params.duration_minutes,
        location: preset.params.location,
        energy_level: preset.params.energy_level,
        prop_ids: preset.params.prop_ids || [],
      },
    }));
  }, []);

  const setSaving = useCallback((isSaving: boolean) => {
    setState(prev => ({ ...prev, isSaving }));
  }, []);

  return {
    state,
    updateFormData,
    setLoading,
    setResult,
    setError,
    resetToForm,
    applyPreset,
    setSaving,
  };
}

function getInitialFormData(profile: ProfileResponse | null): GeneratorFormData {
  return {
    age_group_id: profile?.default_age_group_id || null,
    duration_minutes: profile?.default_duration_minutes || 30,
    location: profile?.default_location || null,
    energy_level: profile?.default_energy_level || null,
    prop_ids: [],
  };
}
```

### 6.2 Hook pomocniczy: `useQuestGeneration`

**Lokalizacja**: `src/lib/hooks/useQuestGeneration.ts`

**Odpowiedzialność**:
- Wywołanie API do generacji questa
- Obsługa błędów i rate limiting
- Telemetria

**Struktura**:

```typescript
import { useCallback } from 'react';
import type { GenerateQuestRequest, AIGeneratedQuest, ApiError } from '../../types';

export function useQuestGeneration() {
  const generateQuest = useCallback(
    async (params: GenerateQuestRequest): Promise<AIGeneratedQuest> => {
      const response = await fetch('/api/quests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw error;
      }

      const quest: AIGeneratedQuest = await response.json();
      return quest;
    },
    []
  );

  return { generateQuest };
}
```

### 6.3 Hook pomocniczy: `useQuestSave`

**Lokalizacja**: `src/lib/hooks/useQuestSave.ts`

**Odpowiedzialność**:
- Zapisanie questa do bazy (ze statusem saved/started)
- Obsługa błędów
- Telemetria

**Struktura**:

```typescript
import { useCallback } from 'react';
import type { CreateQuestRequest, QuestResponse, ApiError } from '../../types';

export function useQuestSave() {
  const saveQuest = useCallback(
    async (questData: CreateQuestRequest): Promise<QuestResponse> => {
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questData),
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw error;
      }

      const quest: QuestResponse = await response.json();
      return quest;
    },
    []
  );

  return { saveQuest };
}
```

## 7. Integracja API

### 7.1 Inicjalizacja - pobranie danych referencyjnych

**Endpoint**: `GET /api/profiles/me`, `GET /api/age-groups`, `GET /api/props`

**Kiedy**: Przy montowaniu komponentu `GeneratorContainer`

**Request**: Brak body (GET)

**Response**:
```typescript
// GET /api/profiles/me
{
  user_id: string;
  default_age_group_id: number | null;
  default_duration_minutes: number | null;
  default_location: LocationType | null;
  default_energy_level: EnergyLevel | null;
  created_at: string;
  updated_at: string;
}

// GET /api/age-groups
{
  age_groups: [
    { id: 1, code: "3_4", label: "3–4 lata", min_age: 3, max_age: 4 },
    { id: 2, code: "5_6", label: "5–6 lat", min_age: 5, max_age: 6 },
    { id: 3, code: "7_8", label: "7–8 lat", min_age: 7, max_age: 8 },
    { id: 4, code: "9_10", label: "9–10 lat", min_age: 9, max_age: 10 }
  ]
}

// GET /api/props
{
  props: [
    { id: 1, code: "blocks", label: "Klocki" },
    { id: 2, code: "drawing", label: "Rysowanie" },
    { id: 3, code: "none", label: "Bez rekwizytów" },
    { id: 4, code: "paper_pencil", label: "Kartka i ołówek" },
    { id: 5, code: "storytelling", label: "Storytelling" },
    { id: 6, code: "puzzles", label: "Zagadki" },
    { id: 7, code: "toy_cars", label: "Samochodziki" }
  ]
}
```

**Obsługa błędów**:
- 401 Unauthorized → redirect do `/login`
- 500 Internal Error → pokazać error state z retry

**Implementacja**:
```typescript
// W GeneratorPage.astro (SSR)
const supabase = Astro.locals.supabase;

// Fetch profile
const profileRes = await fetch(`${Astro.url.origin}/api/profiles/me`, {
  headers: { Cookie: Astro.request.headers.get('Cookie') || '' },
});
const profile = profileRes.ok ? await profileRes.json() : null;

// Fetch age groups
const ageGroupsRes = await fetch(`${Astro.url.origin}/api/age-groups`);
const { age_groups } = await ageGroupsRes.json();

// Fetch props
const propsRes = await fetch(`${Astro.url.origin}/api/props`);
const { props } = await propsRes.json();

// Pass to React island
<GeneratorContainer 
  profile={profile} 
  ageGroups={age_groups} 
  props={props} 
  client:load 
/>
```

### 7.2 Generacja questa

**Endpoint**: `POST /api/quests/generate`

**Kiedy**: Po submit formularza lub wyborze presetu

**Request**:
```typescript
// Request type: GenerateQuestRequest
{
  age_group_id: number;          // required, positive int
  duration_minutes: number;      // required, 1-480
  location: LocationType;        // required, 'home' | 'outdoor'
  energy_level: EnergyLevel;     // required, 'low' | 'medium' | 'high'
  prop_ids?: number[];           // optional, array of prop IDs
  app_version?: string;          // optional, max 20 chars
}
```

**Response (200 OK)**:
```typescript
// Response type: AIGeneratedQuest
{
  title: string;
  hook: string;
  step1: string;
  step2: string;
  step3: string;
  easier_version: string | null;
  harder_version: string | null;
  safety_notes: string | null;
  age_group_id: number;
  duration_minutes: number;
  location: LocationType;
  energy_level: EnergyLevel;
  prop_ids: number[];
  source: 'ai';
}
```

**Response (400 Bad Request)**:
```typescript
{
  error: 'validation_failed';
  message: 'Nieprawidłowe dane wejściowe';
  details?: ZodError;
}
```

**Response (429 Too Many Requests)**:
```typescript
{
  error: 'rate_limit_exceeded';
  message: 'Wystąpił błąd, spróbuj później';
  retry_after: number; // seconds
}
```

**Response (500 Internal Server Error)**:
```typescript
{
  error: 'generation_failed';
  message: 'Wystąpił błąd, spróbuj później';
}
```

**Obsługa błędów**:
- 400 → pokazać inline errors (validation)
- 429 → pokazać error alert z countdown retry_after
- 500 → pokazać error alert z retry button
- Network error → pokazać error alert z retry button
- Timeout (>30s) → pokazać error alert z retry button

### 7.3 Zapisanie questa (Akceptuję i zaczynam)

**Endpoint**: `POST /api/quests`

**Kiedy**: Po kliknięciu "Akceptuję i zaczynam" w ResultActions

**Request**:
```typescript
// Request type: CreateQuestRequest
{
  title: string;
  hook: string;
  step1: string;
  step2: string;
  step3: string;
  easier_version?: string | null;
  harder_version?: string | null;
  safety_notes?: string | null;
  age_group_id: number;
  duration_minutes: number;
  location: LocationType;
  energy_level: EnergyLevel;
  prop_ids?: number[];
  source: 'ai';
  status: 'started';           // IMPORTANT: status = started
  app_version?: string;
}
```

**Response (201 Created)**:
```typescript
// Response type: QuestResponse
{
  id: string;
  user_id: string;
  title: string;
  // ... full quest data with timestamps
  status: 'started';
  started_at: string;
}
```

**Po sukcesie**:
- Redirect do `/dashboard/quest/${quest.id}` (detal questa)
- Toast: "Quest rozpoczęty!"
- Telemetria `quest_started` jest tworzona automatycznie przez API

### 7.4 Zapisanie questa (Zapisz na później)

**Endpoint**: `POST /api/quests`

**Kiedy**: Po kliknięciu "Zapisz na później" w ResultActions

**Request**:
```typescript
// Identyczny jak w 7.3, ale:
{
  // ... all fields same as generated quest
  source: 'ai';
  status: 'saved';             // IMPORTANT: status = saved
}
```

**Response (201 Created)**:
```typescript
{
  // ... full quest
  status: 'saved';
  saved_at: string;
  started_at: null;
}
```

**Po sukcesie**:
- Redirect do `/dashboard` (lista questów)
- Toast: "Quest zapisany!"
- Telemetria `quest_saved` jest tworzona automatycznie przez API

## 8. Interakcje użytkownika

### 8.1 Happy Path: Wybór presetu → Generacja → Akceptacja

**Kroki**:

1. **User wchodzi na `/dashboard/generate`**
   - Stan: `form`
   - Formularz wypełniony defaultami z profilu (jeśli istnieją)
   - Presety widoczne na górze

2. **User klika preset "Szybka zabawa"**
   - Event: `onPresetSelect(preset)`
   - Action: Zastosuj parametry presetu do formularza
   - Auto-submit formularza (wywołaj `onFormSubmit`)
   - Telemetria: `preset_used` (event_type, event_data: { preset_id: 'quick_5min' })

3. **System generuje quest**
   - Stan: `loading`
   - UI: Spinner + "Generuję quest..."
   - API call: `POST /api/quests/generate`
   - Timeout: max 30s

4. **Quest wygenerowany**
   - Stan: `result`
   - UI: QuestResult z pełną treścią questa
   - Smooth transition z loading → result

5. **User przegląda quest i klika "Akceptuję i zaczynam"**
   - Event: `onAcceptAndStart()`
   - Action: Optimistic UI (disable button, show spinner)
   - API call: `POST /api/quests` (status: 'started')
   - Po sukcesie: Redirect do `/dashboard/quest/${id}`
   - Toast: "Quest rozpoczęty!"

**Telemetria**:
- `preset_used` (krok 2, client-side)
- `quest_generated` (krok 3, server-side)
- `quest_started` (krok 5, server-side)

### 8.2 Alternative Path: Modyfikacja parametrów → Generacja → Zapisz na później

**Kroki**:

1. **User wchodzi na `/dashboard/generate`**
   - Stan: `form`
   - Formularz wypełniony defaultami

2. **User modyfikuje parametry**
   - Wybiera wiek: 7-8 lat
   - Wybiera czas: 45 min (slider)
   - Wybiera miejsce: Dwór
   - Wybiera energię: Wysoka
   - Wybiera rekwizyty: Bez rekwizytów
   - Event: `onChange` dla każdego pola
   - Validation: Inline validation (Zod)

3. **User klika "Generuj quest"**
   - Event: `onFormSubmit(formData)`
   - Validation: Sprawdź czy wszystkie required fields są wypełnione
   - Jeśli valid: Przejdź do loading state
   - Jeśli invalid: Pokaż inline errors

4. **System generuje quest**
   - Stan: `loading`
   - API call: `POST /api/quests/generate`

5. **Quest wygenerowany**
   - Stan: `result`
   - UI: QuestResult

6. **User klika "Zapisz na później"**
   - Event: `onSaveForLater()`
   - Action: Optimistic UI
   - API call: `POST /api/quests` (status: 'saved')
   - Po sukcesie: Redirect do `/dashboard`
   - Toast: "Quest zapisany!"

**Telemetria**:
- `quest_generated` (krok 4, server-side)
- `quest_saved` (krok 6, server-side)

### 8.3 Error Path: Rate Limiting

**Kroki**:

1. **User generuje 6 questów w ciągu minuty**
   - Pierwsze 5: Success
   - Szósty: Rate limit exceeded

2. **System zwraca 429 Too Many Requests**
   - Response: `{ error: 'rate_limit_exceeded', message: '...', retry_after: 45 }`

3. **UI pokazuje error alert**
   - Stan: `error`
   - Message: "Zbyt wiele prób. Spróbuj za 45 sekund."
   - Retry button: Disabled z countdown (45... 44... 43...)
   - Po countdown: Enable retry button

4. **User klika retry po odliczeniu**
   - Event: `onRetry()`
   - Action: Przywróć ostatnie parametry formularza
   - Stan: `form`
   - User może ponownie kliknąć "Generuj"

**Telemetria**:
- `error_generation` (automatycznie przez API przy rate limit)

### 8.4 Error Path: Generation Failed

**Kroki**:

1. **User klika "Generuj quest"**
   - Stan: `loading`

2. **System zwraca 500 Internal Server Error**
   - Response: `{ error: 'generation_failed', message: 'Wystąpił błąd, spróbuj później' }`

3. **UI pokazuje error alert**
   - Stan: `error`
   - Message: "Wystąpił błąd, spróbuj później"
   - Retry button: Enabled
   - Back to form button: Enabled

4. **User klika "Spróbuj ponownie"**
   - Event: `onRetry()`
   - Action: Wywołaj generację ponownie z tymi samymi parametrami
   - Stan: `loading`

**Telemetria**:
- `error_generation` (automatycznie przez API)

### 8.5 Skip Path: Pomiń quest

**Kroki**:

1. **User widzi wygenerowany quest w result state**

2. **User klika "Pomiń"**
   - Event: `onSkip()`
   - Action: Nie zapisuj questa
   - Stan: `form`
   - Parametry formularza: Zachowane (user może wygenerować ponownie)

3. **User widzi formularz z zachowanymi parametrami**
   - Może kliknąć "Generuj quest" ponownie
   - Może kliknąć "Wygeneruj ponownie z tymi samymi parametrami"

### 8.6 Regenerate Path: Wygeneruj ponownie

**Kroki**:

1. **User widzi wygenerowany quest w result state**

2. **User klika "Wygeneruj ponownie"**
   - Event: `onRegenerateWithSameParams()`
   - Action: Wywołaj generację z tymi samymi parametrami co poprzedni quest
   - Stan: `loading`
   - API call: `POST /api/quests/generate` (z zapisanymi lastParams)

3. **Nowy quest wygenerowany**
   - Stan: `result`
   - UI: Nowy quest (różna treść, te same parametry)

**Telemetria**:
- `quest_generated` (nowy event)

## 9. Warunki i walidacja

### 9.1 Walidacja formularza (client-side)

**Komponent**: `GeneratorForm`

**Schema**: `generateQuestSchema` (z `src/lib/validation.ts`)

**Warunki**:

1. **age_group_id** (required):
   - Typ: positive integer
   - Warunek: Musi być jednym z dostępnych age_groups.id
   - Błąd: "Wybierz grupę wiekową"

2. **duration_minutes** (required):
   - Typ: integer
   - Zakres: 1-480
   - Warunek: Musi być liczbą całkowitą w zakresie
   - Błąd: "Czas musi być od 1 do 480 minut"

3. **location** (required):
   - Typ: enum
   - Wartości: 'home' | 'outdoor'
   - Warunek: Musi być jedną z wartości
   - Błąd: "Wybierz miejsce"

4. **energy_level** (required):
   - Typ: enum
   - Wartości: 'low' | 'medium' | 'high'
   - Warunek: Musi być jedną z wartości
   - Błąd: "Wybierz poziom energii"

5. **prop_ids** (optional):
   - Typ: array of positive integers
   - Warunek: Jeśli podane, każdy element musi być valid prop ID
   - Warunek specjalny: Jeśli zawiera ID=3 ("Bez rekwizytów"), to musi być jedynym elementem
   - Błąd: "Nieprawidłowe rekwizyty"

**Implementacja walidacji**:

```typescript
// W GeneratorForm
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateQuestSchema } from '../../lib/validation';

const {
  register,
  handleSubmit,
  formState: { errors },
  setValue,
  watch,
} = useForm<GeneratorFormData>({
  resolver: zodResolver(generateQuestSchema),
  defaultValues: initialValues,
});

const onSubmit = handleSubmit((data) => {
  // Zod validation passed
  onSubmit(data);
});
```

**Wyświetlanie błędów**:
- Inline pod każdym polem (jeśli `errors[field]`)
- Kolor czerwony dla border i text
- Ikona błędu obok labela
- Message z `errors[field].message`

### 9.2 Walidacja logiki "Bez rekwizytów"

**Komponent**: `PropMultiSelect`

**Warunek**: ID=3 ("Bez rekwizytów") jest wzajemnie wykluczający się z innymi rekwizytami

**Implementacja**:

```typescript
const handleToggle = (propId: number, checked: boolean) => {
  let newValues: number[];

  if (propId === 3) {
    // "Bez rekwizytów" clicked
    if (checked) {
      newValues = [3]; // Only "none"
    } else {
      newValues = []; // Uncheck "none"
    }
  } else {
    // Other prop clicked
    if (checked) {
      // Remove "none" if present, add new prop
      newValues = [...value.filter(id => id !== 3), propId];
    } else {
      // Remove prop
      newValues = value.filter(id => id !== propId);
    }
  }

  onChange(newValues);
};
```

### 9.3 Walidacja defaultów z profilu

**Komponent**: `GeneratorContainer`

**Warunek**: Jeśli profil ma defaulty, wypełnij formularz; w przeciwnym razie użyj DEFAULT_FORM_VALUES

**Implementacja**:

```typescript
function getInitialFormData(profile: ProfileResponse | null): GeneratorFormData {
  if (profile) {
    return {
      age_group_id: profile.default_age_group_id,
      duration_minutes: profile.default_duration_minutes || 30,
      location: profile.default_location,
      energy_level: profile.default_energy_level,
      prop_ids: [],
    };
  }
  
  return DEFAULT_FORM_VALUES;
}
```

### 9.4 Walidacja przed submitem (type guard)

**Funkcja**: `isValidGeneratorFormData`

**Warunek**: Wszystkie required fields muszą być non-null przed wysłaniem do API

**Implementacja**:

```typescript
const handleFormSubmit = async (data: GeneratorFormData) => {
  if (!isValidGeneratorFormData(data)) {
    // Should not happen if form validation works
    setError({
      error: 'validation_failed',
      message: 'Wypełnij wszystkie wymagane pola',
    });
    return;
  }

  // Now data is GenerateQuestRequest
  setLoading();
  try {
    const quest = await generateQuest(data);
    setResult(quest);
  } catch (err) {
    setError(err as ApiError);
  }
};
```

### 9.5 Walidacja rate limiting (UI state)

**Komponent**: `ErrorState`

**Warunek**: Jeśli error.retry_after istnieje, disable retry button i pokaż countdown

**Implementacja**:

```typescript
const [countdown, setCountdown] = useState<number | null>(
  isRateLimitError(error) ? error.retry_after || 60 : null
);

useEffect(() => {
  if (countdown === null || countdown <= 0) return;

  const timer = setInterval(() => {
    setCountdown(prev => (prev && prev > 0 ? prev - 1 : 0));
  }, 1000);

  return () => clearInterval(timer);
}, [countdown]);

const canRetry = countdown === null || countdown <= 0;
```

### 9.6 Walidacja przed zapisaniem questa

**Komponent**: `ResultActions`

**Warunek**: Quest musi być wygenerowany (not null) przed zapisaniem

**Implementacja**:

```typescript
const handleAcceptAndStart = async () => {
  if (!quest) return; // Should not happen

  setSaving(true);
  
  const questToSave: CreateQuestRequest = {
    ...quest,
    status: 'started',
    app_version: '1.0.0', // TODO: Get from env or config
  };

  try {
    const savedQuest = await saveQuest(questToSave);
    // Navigate to quest detail
    window.location.href = `/dashboard/quest/${savedQuest.id}`;
  } catch (err) {
    setError(err as ApiError);
    setSaving(false);
  }
};
```

## 10. Obsługa błędów

### 10.1 Błędy walidacji formularza (400)

**Źródło**: Client-side (Zod) lub Server-side (API validation)

**Typ błędu**:
```typescript
{
  error: 'validation_failed',
  message: 'Nieprawidłowe dane wejściowe',
  details: ZodError | ValidationError[]
}
```

**Obsługa**:
- **UI**: Inline errors pod każdym polem formularza
- **Message**: Pokaż szczegółowy message z details
- **Action**: User poprawia dane i resubmituje
- **Telemetria**: Nie logujemy walidacji client-side (za dużo eventów)

**Implementacja**:
```typescript
// W GeneratorForm
{errors.age_group_id && (
  <p className="text-sm text-red-600 mt-1">
    {errors.age_group_id.message}
  </p>
)}
```

### 10.2 Rate limiting (429)

**Źródło**: API `/api/quests/generate`

**Typ błędu**:
```typescript
{
  error: 'rate_limit_exceeded',
  message: 'Wystąpił błąd, spróbuj później',
  retry_after: 45 // seconds
}
```

**Obsługa**:
- **UI**: Error alert z countdown
- **Message**: "Zbyt wiele prób. Spróbuj za {countdown} sekund."
- **Action**: Disable retry button do końca countdown
- **Stan**: `error`
- **Telemetria**: `error_generation` (automatycznie przez API)

**Implementacja**:
```typescript
// W ErrorState
{isRateLimitError(error) ? (
  <>
    <p>{error.message}</p>
    <p className="text-sm text-gray-600">
      Spróbuj za {countdown} sekund
    </p>
    <Button 
      onClick={onRetry} 
      disabled={!canRetry}
    >
      {canRetry ? 'Spróbuj ponownie' : `Poczekaj (${countdown}s)`}
    </Button>
  </>
) : (
  // Standard error UI
)}
```

### 10.3 Generation failed (500)

**Źródło**: API `/api/quests/generate` (AI service failure)

**Typ błędu**:
```typescript
{
  error: 'generation_failed',
  message: 'Wystąpił błąd, spróbuj później'
}
```

**Obsługa**:
- **UI**: Error alert z retry button
- **Message**: "Wystąpił błąd, spróbuj później"
- **Action**: Retry button (od razu enabled)
- **Stan**: `error`
- **Telemetria**: `error_generation` (automatycznie przez API)

**Implementacja**:
```typescript
// W ErrorState
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Błąd generacji</AlertTitle>
  <AlertDescription>{error.message}</AlertDescription>
</Alert>
<div className="flex gap-2 mt-4">
  <Button onClick={onRetry}>Spróbuj ponownie</Button>
  <Button variant="outline" onClick={onBackToForm}>
    Powrót do formularza
  </Button>
</div>
```

### 10.4 Network error / Timeout

**Źródło**: Fetch failure, timeout (>30s), no internet

**Typ błędu**: JavaScript Error (not ApiError)

**Obsługa**:
- **UI**: Error alert z retry button
- **Message**: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
- **Action**: Retry button
- **Stan**: `error`
- **Telemetria**: Nie logujemy (brak połączenia)

**Implementacja**:
```typescript
// W useQuestGeneration hook
const generateQuest = async (params: GenerateQuestRequest) => {
  try {
    const response = await fetch('/api/quests/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }

    return await response.json();
  } catch (err) {
    // Network error or timeout
    if (err instanceof TypeError || err.name === 'AbortError') {
      throw {
        error: 'network_error',
        message: 'Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.',
      } as ApiError;
    }
    
    // API error (already ApiError)
    throw err;
  }
};
```

### 10.5 Unauthorized (401)

**Źródło**: Brak sesji lub wygasła sesja

**Typ błędu**:
```typescript
{
  error: 'unauthorized',
  message: 'Sesja wygasła. Zaloguj się ponownie.'
}
```

**Obsługa**:
- **UI**: Nie pokazujemy error state w componencie
- **Action**: Redirect do `/login` (handled by middleware lub global error handler)
- **Stan**: Brak (redirect przed ustawieniem stanu)

**Implementacja**:
```typescript
// W middleware lub global error handler
if (response.status === 401) {
  window.location.href = '/login?redirect=' + window.location.pathname;
  return;
}
```

### 10.6 Save quest error (po generacji)

**Źródło**: API `/api/quests` (POST) - zapis questa failed

**Typ błędu**:
```typescript
{
  error: 'save_failed',
  message: 'Nie udało się zapisać questa'
}
```

**Obsługa**:
- **UI**: Toast error message (nie zmieniamy stanu z `result` na `error`)
- **Message**: "Nie udało się zapisać questa. Spróbuj ponownie."
- **Action**: User może retry akcję (przycisk nadal dostępny)
- **Stan**: `result` (nie zmieniamy)

**Implementacja**:
```typescript
// W ResultActions
const handleAcceptAndStart = async () => {
  setSaving(true);
  
  try {
    const savedQuest = await saveQuest(questToSave);
    window.location.href = `/dashboard/quest/${savedQuest.id}`;
  } catch (err) {
    // Show toast, don't change state
    toast.error('Nie udało się zapisać questa. Spróbuj ponownie.');
    setSaving(false);
    // User can retry by clicking button again
  }
};
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików i typów

**Cel**: Utworzenie struktury folderów i plików typów

**Zadania**:

1.1. Utwórz strukturę folderów:
```
src/
├── lib/
│   ├── view-models/
│   │   └── generator.types.ts (nowy)
│   └── hooks/
│       ├── useGeneratorState.ts (nowy)
│       ├── useQuestGeneration.ts (nowy)
│       └── useQuestSave.ts (nowy)
├── components/
│   └── generator/ (nowy folder)
│       ├── GeneratorContainer.tsx
│       ├── PresetSection.tsx
│       ├── PresetCard.tsx
│       ├── GeneratorForm.tsx
│       ├── VisualPicker.tsx
│       ├── DurationSlider.tsx
│       ├── PropMultiSelect.tsx
│       ├── LoadingState.tsx
│       ├── QuestResult.tsx
│       ├── QuestContentDisplay.tsx
│       ├── ResultActions.tsx
│       └── ErrorState.tsx
└── pages/
    └── dashboard/
        └── generate.astro (nowy)
```

1.2. Implementuj typy w `src/lib/view-models/generator.types.ts`:
- Skopiuj wszystkie typy z sekcji 5.2 tego planu
- Dodaj PRESETS constants
- Dodaj DEFAULT_FORM_VALUES
- Dodaj STORAGE_KEYS
- Dodaj helper functions (isValidGeneratorFormData, etc.)

1.3. Zweryfikuj istniejące typy w `src/types.ts`:
- Sprawdź czy wszystkie potrzebne typy są zdefiniowane
- Dodaj brakujące typy jeśli potrzebne

**Weryfikacja**: Wszystkie pliki typów kompilują się bez błędów TypeScript

---

### Krok 2: Implementacja hooków zarządzania stanem

**Cel**: Implementacja custom hooks do zarządzania stanem generatora

**Zadania**:

2.1. Implementuj `useGeneratorState.ts`:
- Skopiuj implementację z sekcji 6.1
- Dodaj wszystkie funkcje: updateFormData, setLoading, setResult, setError, resetToForm, applyPreset, setSaving
- Implementuj localStorage persistence
- Dodaj getInitialFormData helper

2.2. Implementuj `useQuestGeneration.ts`:
- Skopiuj implementację z sekcji 6.2
- Dodaj timeout handling (30s)
- Dodaj network error handling
- Dodaj proper TypeScript types dla errors

2.3. Implementuj `useQuestSave.ts`:
- Skopiuj implementację z sekcji 6.3
- Dodaj error handling

2.4. Napisz unit testy dla hooków (opcjonalnie w MVP):
- Test useGeneratorState state transitions
- Test localStorage persistence
- Test useQuestGeneration error handling

**Weryfikacja**: Hooki działają poprawnie (można przetestować w izolacji z React Testing Library)

---

### Krok 3: Implementacja komponentów prezentacyjnych (UI-only)

**Cel**: Implementacja komponentów bez logiki biznesowej (tylko UI + props)

**Zadania**:

3.1. Implementuj `LoadingState.tsx`:
- Spinner component (użyj Shadcn/ui Spinner)
- Message prop
- Styling: center alignment, subtle animation

3.2. Implementuj `ErrorState.tsx`:
- Alert component (użyj Shadcn/ui Alert)
- Error message display
- Retry button (if canRetry)
- Back to form button
- Countdown display (for rate limiting)
- Hook useEffect dla countdown timer

3.3. Implementuj `VisualPicker.tsx` (generic):
- Grid layout (responsive)
- Button dla każdej opcji (emoji/icon + label)
- Selected state styling
- Error message display
- Tooltip support (opcjonalnie)
- Accessibility: ARIA labels, keyboard navigation

3.4. Implementuj `DurationSlider.tsx`:
- Slider component (użyj Shadcn/ui Slider)
- Value display ("{value} min")
- Preset buttons (5, 15, 30, 60)
- Error message display
- Styling: intuitive, touch-friendly

3.5. Implementuj `PropMultiSelect.tsx`:
- Grid checkboxów (responsive)
- Emoji + label dla każdego propa
- Logika "Bez rekwizytów" (wzajemnie wykluczająca)
- Error message display
- Accessibility: proper checkbox markup

3.6. Implementuj `PresetCard.tsx`:
- Card component (użyj Shadcn/ui Card)
- Emoji, title, description
- Hover/focus states
- Click handler
- Touch-friendly (min 48x48px)

3.7. Implementuj `PresetSection.tsx`:
- Grid 4 kart (2x2 desktop, stack mobile)
- Responsive layout
- Map presets → PresetCard

3.8. Implementuj `QuestContentDisplay.tsx`:
- Section Hook (highlight styling)
- Section Kroki (numbered list)
- Section Wersja łatwiej
- Section Wersja trudniej
- Section Bezpieczeństwo (icon + text)
- Section Parametry (badges grid)
- Responsive layout
- Print-friendly styling (opcjonalnie)

3.9. Implementuj `ResultActions.tsx`:
- 4 przyciski (primary, secondary, tertiary, link)
- Styling: różne warianty dla hierarchy
- Loading states (disable podczas saving)
- Responsive layout (stack na mobile)

**Weryfikacja**: Komponenty renderują się poprawnie w Storybook lub standalone testach

---

### Krok 4: Implementacja komponentów kontenerowych

**Cel**: Implementacja komponentów z logiką biznesową

**Zadania**:

4.1. Implementuj `GeneratorForm.tsx`:
- React Hook Form setup z Zod resolver
- Integracja wszystkich sub-komponentów (VisualPicker, DurationSlider, PropMultiSelect)
- Obsługa onChange events
- Obsługa submit event
- Walidacja inline (errors display)
- defaultValues z props
- Loading state (disable form podczas generacji)

4.2. Implementuj `QuestResult.tsx`:
- Composition: QuestContentDisplay + ResultActions
- Pass props do sub-komponentów
- Lookup age group label (z ageGroups array)
- Lookup props labels (z props array)
- isSubmitting state propagation

4.3. Implementuj `GeneratorContainer.tsx` (main):
- Import wszystkich hooków (useGeneratorState, useQuestGeneration, useQuestSave)
- Import wszystkich sub-komponentów
- State management setup
- Conditional rendering based on currentState (form/loading/result/error)
- Event handlers:
  - handlePresetSelect
  - handleFormSubmit
  - handleAcceptAndStart
  - handleSaveForLater
  - handleSkip
  - handleRegenerateWithSameParams
  - handleRetry
- Error handling wrapper
- Smooth transitions między stanami

**Weryfikacja**: Komponenty kontenerowe zarządzają stanem poprawnie i wywołują API

---

### Krok 5: Implementacja strony Astro (SSR)

**Cel**: Utworzenie strony Astro z React island

**Zadania**:

5.1. Utwórz `src/pages/dashboard/generate.astro`:
- Layout: DashboardLayout
- Middleware: requireAuth (redirect do /login jeśli brak sesji)
- SSR: Fetch profile, age_groups, props
- Pass data do React island
- Meta tags: title, description
- Error handling dla SSR fetches

5.2. Implementacja SSR data fetching:
```astro
---
import DashboardLayout from '../../layouts/DashboardLayout.astro';
import GeneratorContainer from '../../components/generator/GeneratorContainer';

// Fetch profile
const profileRes = await fetch(`${Astro.url.origin}/api/profiles/me`, {
  headers: { Cookie: Astro.request.headers.get('Cookie') || '' },
});
const profile = profileRes.ok ? await profileRes.json() : null;

// Fetch age groups
const ageGroupsRes = await fetch(`${Astro.url.origin}/api/age-groups`);
const { age_groups } = await ageGroupsRes.json();

// Fetch props
const propsRes = await fetch(`${Astro.url.origin}/api/props`);
const { props } = await propsRes.json();
---

<DashboardLayout title="Generuj quest | KidsQuest">
  <GeneratorContainer 
    profile={profile}
    ageGroups={age_groups}
    props={props}
    client:load
  />
</DashboardLayout>
```

5.3. Dodaj error boundary (jeśli SSR fetch fails):
- Sprawdź response status codes
- Redirect do /login jeśli 401
- Show error page jeśli 500
- Graceful degradation (null profile jeśli failed)

**Weryfikacja**: Strona renderuje się poprawnie, dane SSR są przekazywane do React island

---

### Krok 6: Styling i responsywność

**Cel**: Dopracowanie stylów i responsywności

**Zadania**:

6.1. Dodaj Tailwind classes do wszystkich komponentów:
- Responsive breakpoints (sm, md, lg)
- Dark mode support (opcjonalnie)
- Consistent spacing (gap, padding, margin)
- Typography (font sizes, weights, line heights)
- Colors (użyj Shadcn/ui theme colors)

6.2. Przetestuj na różnych rozdzielczościach:
- Mobile (320px - 640px)
- Tablet (640px - 1024px)
- Desktop (1024px+)

6.3. Touch-friendly targets:
- Min 48x48px dla wszystkich interaktywnych elementów
- Adequate spacing między przyciskami

6.4. Focus states dla accessibility:
- Visible focus rings
- Keyboard navigation działa poprawnie

6.5. Smooth transitions:
- Fade in/out między stanami
- Skeleton loading (opcjonalnie)
- Optimistic UI updates

**Weryfikacja**: UI wygląda dobrze na wszystkich urządzeniach i jest dostępny

---

### Krok 7: Integracja telemetrii (opcjonalnie client-side)

**Cel**: Dodanie client-side telemetrii dla eventów

**Zadania**:

7.1. Dodaj telemetrię dla `preset_used`:
```typescript
// W GeneratorContainer.handlePresetSelect
const handlePresetSelect = async (preset: PresetConfig) => {
  applyPreset(preset);
  
  // Track preset usage
  await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: 'preset_used',
      event_data: { preset_id: preset.id },
      app_version: '1.0.0',
    }),
  });
  
  // Auto-submit form
  handleFormSubmit(preset.params);
};
```

7.2. Pozostała telemetria jest obsługiwana server-side:
- `quest_generated` - w API generate
- `quest_started` - w API quests POST
- `quest_saved` - w API quests POST
- `error_generation` - w API generate

**Weryfikacja**: Eventy są zapisywane w bazie danych

---

### Krok 8: Obsługa błędów i edge cases

**Cel**: Dodanie obsługi wszystkich błędów i edge cases

**Zadania**:

8.1. Dodaj error boundaries w React:
```typescript
// W GeneratorContainer
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  fallback={<ErrorState error={{...}} onRetry={...} onBackToForm={...} />}
>
  {/* Components */}
</ErrorBoundary>
```

8.2. Dodaj timeout dla generacji (30s):
```typescript
// W useQuestGeneration
signal: AbortSignal.timeout(30000)
```

8.3. Dodaj retry logic dla network errors:
- Exponential backoff (opcjonalnie)
- Max retries (opcjonalnie)

8.4. Dodaj validation dla edge cases:
- Empty form submission (wszystkie pola wymagane)
- Invalid age_group_id (nie istnieje w DB)
- Invalid prop_ids (nie istnieją w DB)

8.5. Dodaj graceful degradation:
- Jeśli profile fetch fails → użyj DEFAULT_FORM_VALUES
- Jeśli age_groups fetch fails → hard error (nie można kontynuować)
- Jeśli props fetch fails → hard error (nie można kontynuować)

**Weryfikacja**: Wszystkie edge cases są obsłużone bez crashy

---

### Krok 9: Testing

**Cel**: Napisanie testów dla komponentów i hooków

**Zadania**:

9.1. Unit testy dla hooków:
- `useGeneratorState` - state transitions
- `useQuestGeneration` - API calls, error handling
- `useQuestSave` - API calls, error handling

9.2. Component testy:
- `VisualPicker` - rendering, selection, onChange
- `DurationSlider` - rendering, onChange, presets
- `PropMultiSelect` - rendering, toggle, "Bez rekwizytów" logic
- `GeneratorForm` - validation, submit
- `QuestResult` - rendering, action buttons

9.3. Integration testy:
- `GeneratorContainer` - full flow (form → loading → result → save)
- API mocking (MSW)

9.4. E2E testy (opcjonalnie):
- Playwright: Full user journey (preset → generate → accept → redirect)

**Weryfikacja**: Wszystkie testy przechodzą

---

### Krok 10: Accessibility audit i polishing

**Cel**: Zapewnienie pełnej dostępności i dopracowanie UX

**Zadania**:

10.1. Accessibility audit:
- Uruchom Lighthouse (score ≥90)
- Sprawdź ARIA labels (wszystkie icon-only buttons)
- Sprawdź heading hierarchy (h1 → h2 → h3)
- Sprawdź focus management (keyboard navigation)
- Sprawdź color contrast (WCAG AA)
- Sprawdź screen reader support (test z NVDA/JAWS)

10.2. Performance audit:
- Lighthouse Performance score ≥90
- Optimize bundle size (code splitting jeśli potrzebne)
- Lazy load heavy components (opcjonalnie)

10.3. UX polishing:
- Smooth animations/transitions
- Loading states (nie za długie, nie za krótkie)
- Toast notifications (sukces/błąd)
- Skeleton loading (opcjonalnie)
- Microcopy (review wszystkich tekstów)

10.4. Final review:
- Code review (inny developer)
- Manual testing na różnych urządzeniach
- Cross-browser testing (Chrome, Firefox, Safari)

**Weryfikacja**: Wszystkie audity przechodzą, UX jest płynny

---

### Krok 11: Deployment i monitoring

**Cel**: Deploy widoku na produkcję i setup monitoring

**Zadania**:

11.1. Build i deploy:
- `npm run build` - check for build errors
- Deploy do DigitalOcean (Docker)
- Smoke test na produkcji

11.2. Setup monitoring:
- Error tracking (Sentry)
- Analytics (Google Analytics / Plausible)
- Telemetria (Supabase events → analytics dashboard)

11.3. Monitor metryki:
- Start Rate (quest_started / quest_generated)
- Preset Adoption (preset_used / quest_generated)
- Error Rate (error_generation / quest_generated)
- Time-to-First-Start (median)

11.4. Setup alerting:
- Alert jeśli Error Rate > 10%
- Alert jeśli Start Rate < 50%

**Weryfikacja**: Widok działa na produkcji, metryki są monitorowane

---

## Końcowe uwagi

### Priorytety implementacji (MVP)

**Must-have**:
- Krok 1-5 (core functionality)
- Krok 6 (styling i responsywność)
- Krok 8 (obsługa błędów)

**Should-have**:
- Krok 7 (telemetria client-side)
- Krok 9 (testing - przynajmniej unit testy)
- Krok 10 (accessibility - podstawowe)

**Nice-to-have**:
- Krok 9 (E2E testy)
- Krok 10 (zaawansowana accessibility, performance optimization)
- Krok 11 (monitoring - można dodać post-MVP)

### Szacowany czas implementacji

- Junior developer: **40-50 godzin**
- Mid-level developer: **25-35 godzin**
- Senior developer: **15-20 godzin**

### Potencjalne blokery

1. **Rate limiting UX**: Wymaga przemyślenia UX (countdown, disable buttons)
2. **Smooth transitions**: Może wymagać dodatkowej biblioteki animacji (Framer Motion)
3. **localStorage sync**: Może powodować conflicts jeśli user ma otwarte wiele tabów
4. **SSR data fetching**: Może być slow jeśli API jest wolne (rozważ caching)
5. **Timeout handling**: Wymaga testowania z real AI API (może być wolniejsze niż 30s)

### Zalecenia

1. **Start od prostego**: Implementuj core functionality bez presetsów i advanced features
2. **Iteruj**: Dodawaj features stopniowo (presety → smooth transitions → telemetria)
3. **Test wcześnie**: Testuj na prawdziwych userach jak najwcześniej (user testing)
4. **Monitor**: Setup monitoringu od razu, żeby widzieć bottlenecki
5. **Feedback loop**: Zbieraj feedback i iteruj (Start Rate to kluczowa metryka)

