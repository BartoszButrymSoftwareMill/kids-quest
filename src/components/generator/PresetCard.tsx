import type { PresetConfig } from '../../lib/view-models/generator.types';

interface PresetCardProps {
  preset: PresetConfig;
  onClick: () => void;
}

export function PresetCard({ preset, onClick }: PresetCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex flex-col items-start gap-3 p-5 rounded-lg border-2 border-neutral-200 bg-white
        hover:border-primary hover:bg-primary/5 hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        transition-all duration-200 text-left w-full
      "
    >
      <span className="text-4xl" aria-hidden="true">
        {preset.emoji}
      </span>
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">{preset.title}</h3>
        <p className="text-sm text-neutral-600">{preset.description}</p>
      </div>
    </button>
  );
}
