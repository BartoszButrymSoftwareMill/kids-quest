import { useState, useEffect, useCallback } from 'react';
import type { GeneratorFormData, GeneratorContainerState, PresetConfig } from '../view-models/generator.types';
import type { AIGeneratedQuest, ApiError, AgeGroupResponse, PropResponse, ProfileResponse } from '../../types';
import { STORAGE_KEYS, DEFAULT_FORM_VALUES } from '../view-models/generator.types';

export function useGeneratorState(
  initialProfile: ProfileResponse | null,
  ageGroups: AgeGroupResponse[],
  props: PropResponse[]
) {
  const [state, setState] = useState<GeneratorContainerState>(() => {
    // Load saved form data from localStorage during initialization
    // Check if we're on the client side before accessing localStorage
    let savedForm: string | null = null;
    if (typeof window !== 'undefined') {
      savedForm = localStorage.getItem(STORAGE_KEYS.GENERATOR_FORM);
    }

    let formData = getInitialFormData(initialProfile);

    if (savedForm) {
      try {
        formData = JSON.parse(savedForm);
      } catch {
        // Ignore invalid data, use default
      }
    }

    return {
      currentState: 'form',
      formData,
      generatedQuest: null,
      error: null,
      isGenerating: false,
      isSaving: false,
      ageGroups,
      props,
      profile: initialProfile,
    };
  });

  // Save form data to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined' && state.formData) {
      localStorage.setItem(STORAGE_KEYS.GENERATOR_FORM, JSON.stringify(state.formData));
    }
  }, [state.formData]);

  const updateFormData = useCallback((data: Partial<GeneratorFormData>) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, ...data },
    }));
  }, []);

  const setLoading = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentState: 'loading',
      isGenerating: true,
      error: null,
    }));
  }, []);

  const setResult = useCallback((quest: AIGeneratedQuest) => {
    setState((prev) => ({
      ...prev,
      currentState: 'result',
      generatedQuest: quest,
      isGenerating: false,
      error: null,
    }));

    // Save last params for "regenerate"
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        STORAGE_KEYS.LAST_PARAMS,
        JSON.stringify({
          age_group_id: quest.age_group_id,
          duration_minutes: quest.duration_minutes,
          location: quest.location,
          energy_level: quest.energy_level,
          prop_ids: quest.prop_ids,
        })
      );
    }
  }, []);

  const setError = useCallback((error: ApiError) => {
    setState((prev) => ({
      ...prev,
      currentState: 'error',
      error,
      isGenerating: false,
      isSaving: false,
    }));
  }, []);

  const resetToForm = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentState: 'form',
      generatedQuest: null,
      error: null,
      isGenerating: false,
      isSaving: false,
    }));
  }, []);

  const applyPreset = useCallback((preset: PresetConfig) => {
    setState((prev) => ({
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
    setState((prev) => ({ ...prev, isSaving }));
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
