interface DurationSliderProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
  required?: boolean;
}

const PRESET_VALUES = [5, 15, 30, 60];

export function DurationSlider({ value, onChange, error, required = false }: DurationSliderProps) {
  return (
    <div className="space-y-4">
      {/* Label */}
      <label className="text-sm font-medium text-neutral-900">
        Czas trwania
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Value Display */}
      <div className="text-center">
        <span className="text-3xl font-bold text-primary">{value}</span>
        <span className="text-lg text-neutral-600 ml-2">min</span>
      </div>

      {/* Slider */}
      <div className="px-2">
        <input
          type="range"
          min="1"
          max="480"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer slider-thumb"
          aria-label="Czas trwania w minutach"
        />
      </div>

      {/* Preset Buttons */}
      <div className="flex gap-2 justify-center flex-wrap">
        {PRESET_VALUES.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${
                value === preset
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }
            `}
          >
            {preset} min
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
