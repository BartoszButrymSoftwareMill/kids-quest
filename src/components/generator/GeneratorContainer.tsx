import { useCallback } from 'react';
import type { AgeGroupResponse, PropResponse, ProfileResponse, CreateQuestRequest, ApiError } from '../../types';
import { useGeneratorState } from '../../lib/hooks/useGeneratorState';
import { useQuestGeneration } from '../../lib/hooks/useQuestGeneration';
import { useQuestSave } from '../../lib/hooks/useQuestSave';
import { isValidGeneratorFormData, PRESETS } from '../../lib/view-models/generator.types';
import type { PresetConfig, GeneratorFormData } from '../../lib/view-models/generator.types';
import { PresetSection } from './PresetSection';
import { GeneratorForm } from './GeneratorForm';
import { LoadingState } from './LoadingState';
import { QuestResult } from './QuestResult';
import { ErrorState } from './ErrorState';
import { ErrorBoundary } from './ErrorBoundary';

interface GeneratorContainerProps {
  profile: ProfileResponse | null;
  ageGroups: AgeGroupResponse[];
  props: PropResponse[];
}

export function GeneratorContainer({ profile, ageGroups, props }: GeneratorContainerProps) {
  const { state, setLoading, setResult, setError, resetToForm, applyPreset, setSaving } = useGeneratorState(
    profile,
    ageGroups,
    props
  );

  const { generateQuest } = useQuestGeneration();
  const { saveQuest } = useQuestSave();

  // Handle preset selection
  const handlePresetSelect = useCallback(
    async (preset: PresetConfig) => {
      applyPreset(preset);

      // Track preset usage (client-side telemetry)
      try {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'preset_used',
            event_data: { preset_id: preset.id },
            app_version: '1.0.0',
          }),
        });
      } catch {
        // Ignore telemetry errors
      }

      // Auto-submit with preset params
      setLoading();
      try {
        const quest = await generateQuest(preset.params);
        setResult(quest);
      } catch (err) {
        setError(err as ApiError);
      }
    },
    [applyPreset, setLoading, generateQuest, setResult, setError]
  );

  // Handle form submission
  const handleFormSubmit = useCallback(
    async (data: GeneratorFormData) => {
      if (!isValidGeneratorFormData(data)) {
        setError({
          error: 'validation_failed',
          message: 'Wypełnij wszystkie wymagane pola',
        });
        return;
      }

      setLoading();
      try {
        const quest = await generateQuest(data);
        setResult(quest);
      } catch (err) {
        setError(err as ApiError);
      }
    },
    [setLoading, generateQuest, setResult, setError]
  );

  // Handle "Accept and Start"
  const handleAcceptAndStart = useCallback(async () => {
    if (!state.generatedQuest) return;

    setSaving(true);

    const questToSave: CreateQuestRequest = {
      ...state.generatedQuest,
      status: 'started',
      app_version: '1.0.0',
    };

    try {
      const savedQuest = await saveQuest(questToSave);
      // Navigate to quest detail
      window.location.href = `/dashboard/quest/${savedQuest.id}`;
    } catch {
      // Show error but don't change state
      alert('Nie udało się zapisać questa. Spróbuj ponownie.');
      setSaving(false);
    }
  }, [state.generatedQuest, saveQuest, setSaving]);

  // Handle "Save for Later"
  const handleSaveForLater = useCallback(async () => {
    if (!state.generatedQuest) return;

    setSaving(true);

    const questToSave: CreateQuestRequest = {
      ...state.generatedQuest,
      status: 'saved',
      app_version: '1.0.0',
    };

    try {
      await saveQuest(questToSave);
      // Navigate to dashboard
      window.location.href = '/dashboard';
    } catch {
      alert('Nie udało się zapisać questa. Spróbuj ponownie.');
      setSaving(false);
    }
  }, [state.generatedQuest, saveQuest, setSaving]);

  // Handle "Skip"
  const handleSkip = useCallback(() => {
    resetToForm();
  }, [resetToForm]);

  // Handle "Regenerate with Same Params"
  const handleRegenerateWithSameParams = useCallback(async () => {
    if (!state.generatedQuest) return;

    const params = {
      age_group_id: state.generatedQuest.age_group_id,
      duration_minutes: state.generatedQuest.duration_minutes,
      location: state.generatedQuest.location,
      energy_level: state.generatedQuest.energy_level,
      prop_ids: state.generatedQuest.prop_ids,
    };

    setLoading();
    try {
      const quest = await generateQuest(params);
      setResult(quest);
    } catch (err) {
      setError(err as ApiError);
    }
  }, [state.generatedQuest, setLoading, generateQuest, setResult, setError]);

  // Handle retry after error
  const handleRetry = useCallback(() => {
    resetToForm();
  }, [resetToForm]);

  // Render based on current state
  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        {state.currentState === 'form' && (
          <div className="space-y-12">
            {/* Preset Section */}
            <PresetSection onSelect={handlePresetSelect} presets={PRESETS} />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-neutral-300" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-sm text-neutral-500">lub dostosuj parametry</span>
              </div>
            </div>

            {/* Generator Form */}
            <GeneratorForm
              initialValues={state.formData}
              ageGroups={state.ageGroups}
              props={state.props}
              onSubmit={handleFormSubmit}
              isLoading={state.isGenerating}
            />
          </div>
        )}

        {state.currentState === 'loading' && <LoadingState message="Generuję quest..." />}

        {state.currentState === 'result' && state.generatedQuest && (
          <QuestResult
            quest={state.generatedQuest}
            ageGroups={state.ageGroups}
            props={state.props}
            onAcceptAndStart={handleAcceptAndStart}
            onSaveForLater={handleSaveForLater}
            onSkip={handleSkip}
            onRegenerateWithSameParams={handleRegenerateWithSameParams}
            isSubmitting={state.isSaving}
          />
        )}

        {state.currentState === 'error' && state.error && (
          <ErrorState error={state.error} onRetry={handleRetry} onBackToForm={resetToForm} canRetry={true} />
        )}
      </div>
    </ErrorBoundary>
  );
}
