import type { PresetConfig } from '../../lib/view-models/generator.types';
import { PresetCard } from './PresetCard';

interface PresetSectionProps {
  onSelect: (preset: PresetConfig) => void;
  presets: PresetConfig[];
}

export function PresetSection({ onSelect, presets }: PresetSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-neutral-900">Szybki start</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {presets.map((preset) => (
          <PresetCard key={preset.id} preset={preset} onClick={() => onSelect(preset)} />
        ))}
      </div>
    </div>
  );
}
