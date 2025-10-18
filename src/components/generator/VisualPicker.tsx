import type { VisualPickerOption } from '../../lib/view-models/generator.types';

interface VisualPickerProps<T extends string | number> {
  label: string;
  options: VisualPickerOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
  required?: boolean;
  tooltip?: string;
}

export function VisualPicker<T extends string | number>({
  label,
  options,
  value,
  onChange,
  error,
  required = false,
  tooltip,
}: VisualPickerProps<T>) {
  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-neutral-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {tooltip && (
          <span className="text-xs text-neutral-500 cursor-help" title={tooltip} aria-label={tooltip}>
            ℹ️
          </span>
        )}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange(option.value)}
              className={`
                relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                min-h-[80px] hover:border-primary/50 hover:bg-primary/5
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${isSelected ? 'border-primary bg-primary/10 shadow-sm' : 'border-neutral-200 bg-white'}
              `}
              aria-pressed={isSelected}
            >
              {option.emoji && (
                <span className="text-3xl mb-1" aria-hidden="true">
                  {option.emoji}
                </span>
              )}
              {option.icon && <div className="mb-1">{option.icon}</div>}
              <span className="text-sm font-medium text-center text-neutral-900">{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
