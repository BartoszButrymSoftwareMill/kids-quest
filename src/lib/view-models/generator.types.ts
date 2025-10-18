import type {
  GenerateQuestRequest,
  AIGeneratedQuest,
  LocationType,
  EnergyLevel,
  AgeGroupResponse,
  PropResponse,
  ProfileResponse,
  ApiError,
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
  age_group_id?: number;
  duration_minutes: number;
  location?: LocationType;
  energy_level?: EnergyLevel;
  prop_ids?: number[];
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
    },
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
    },
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
    },
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
    },
  },
];

/**
 * Default form values
 */
export const DEFAULT_FORM_VALUES: GeneratorFormData = {
  age_group_id: undefined,
  duration_minutes: 30,
  location: undefined,
  energy_level: undefined,
  prop_ids: [],
};

/**
 * LocalStorage keys
 */
export const STORAGE_KEYS = {
  GENERATOR_FORM: 'kidsquest_generator_form',
  LAST_PARAMS: 'kidsquest_last_params',
} as const;

/**
 * Helper type guards
 */
export function isValidGeneratorFormData(data: Partial<GeneratorFormData>): data is GenerateQuestRequest {
  return (
    data.age_group_id !== undefined &&
    data.duration_minutes !== undefined &&
    data.location !== undefined &&
    data.energy_level !== undefined
  );
}

export function isRateLimitError(error: ApiError): boolean {
  return error.error === 'rate_limit_exceeded';
}

export function isGenerationError(error: ApiError): boolean {
  return error.error === 'generation_failed';
}
