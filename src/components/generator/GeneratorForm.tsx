import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateQuestSchema } from '../../lib/validation';
import type { GeneratorFormData } from '../../lib/view-models/generator.types';
import type { AgeGroupResponse, PropResponse, LocationType, EnergyLevel } from '../../types';
import { VisualPicker } from './VisualPicker';
import { DurationSlider } from './DurationSlider';
import { PropMultiSelect } from './PropMultiSelect';

interface GeneratorFormProps {
  initialValues: Partial<GeneratorFormData>;
  ageGroups: AgeGroupResponse[];
  props: PropResponse[];
  onSubmit: (data: GeneratorFormData) => void;
  isLoading: boolean;
}

export function GeneratorForm({ initialValues, ageGroups, props, onSubmit, isLoading }: GeneratorFormProps) {
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<GeneratorFormData>({
    resolver: zodResolver(generateQuestSchema),
    defaultValues: initialValues,
  });

  const formValues = watch();

  // Age group options
  const ageGroupOptions = ageGroups.map((group) => ({
    value: group.id,
    label: group.label,
    emoji: getEmojiForAgeGroup(group.code),
  }));

  // Location options
  const locationOptions = [
    { value: 'home' as LocationType, label: 'Dom', emoji: '🏠' },
    { value: 'outdoor' as LocationType, label: 'Dwór', emoji: '🌳' },
  ];

  // Energy level options
  const energyOptions = [
    { value: 'low' as EnergyLevel, label: 'Niska', emoji: '😌' },
    { value: 'medium' as EnergyLevel, label: 'Średnia', emoji: '😊' },
    { value: 'high' as EnergyLevel, label: 'Wysoka', emoji: '🏃' },
  ];

  const handleFormSubmit = handleSubmit(
    (data) => {
      onSubmit(data);
    },
    (errors) => {
      // Handle validation errors
      console.error('Form validation errors:', errors);
    }
  );

  return (
    <form onSubmit={handleFormSubmit} className="space-y-8 max-w-4xl mx-auto">
      {/* Age Group Picker */}
      <VisualPicker
        label="Wiek dziecka"
        options={ageGroupOptions}
        value={formValues.age_group_id ?? null}
        onChange={(value) => setValue('age_group_id', value as number)}
        error={errors.age_group_id?.message}
        required
        data-testid="age-group-selector"
      />

      {/* Duration Slider */}
      <DurationSlider
        value={formValues.duration_minutes}
        onChange={(value) => setValue('duration_minutes', value)}
        error={errors.duration_minutes?.message}
        required
        data-testid="duration-slider"
      />

      {/* Location Picker */}
      <VisualPicker
        label="Miejsce"
        options={locationOptions}
        value={formValues.location ?? null}
        onChange={(value) => setValue('location', value)}
        error={errors.location?.message}
        required
        data-testid="location-picker"
      />

      {/* Energy Level Picker */}
      <VisualPicker
        label="Poziom energii"
        options={energyOptions}
        value={formValues.energy_level ?? null}
        onChange={(value) => setValue('energy_level', value as EnergyLevel)}
        error={errors.energy_level?.message}
        required
        data-testid="energy-level-picker"
      />

      {/* Props Multi-Select */}
      <PropMultiSelect
        props={props}
        value={formValues.prop_ids ?? []}
        onChange={(value) => setValue('prop_ids', value)}
        error={errors.prop_ids?.message}
      />

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Generuję...' : 'Generuj quest'}
        </button>
        <a
          href="/dashboard/create"
          className="flex-1 px-6 py-3 bg-neutral-100 text-neutral-900 rounded-lg font-medium hover:bg-neutral-200 transition-colors text-center"
        >
          Stwórz quest ręcznie
        </a>
      </div>
    </form>
  );
}

// Helper function to map age group codes to emojis
function getEmojiForAgeGroup(code: string): string {
  const emojiMap: Record<string, string> = {
    '3_4': '👶',
    '5_6': '🧒',
    '7_8': '👦',
    '9_10': '👧',
  };
  return emojiMap[code] || '👤';
}
