/* eslint-disable react/prop-types */
import type { PropResponse } from '../../types';
import { getEmojiForProp } from '../../lib/prop-emojis';

interface PropMultiSelectProps {
  props: PropResponse[];
  value: number[];
  onChange: (values: number[]) => void;
  error?: string;
}

export function PropMultiSelect({ props, value, onChange, error }: PropMultiSelectProps) {
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
        newValues = [...value.filter((id) => id !== 3), propId];
      } else {
        // Remove prop
        newValues = value.filter((id) => id !== propId);
      }
    }

    onChange(newValues);
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="text-sm font-medium text-neutral-900">Rekwizyty</div>

      {/* Props Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {props.map((prop) => {
          const isChecked = value.includes(prop.id);
          const emoji = getEmojiForProp(prop.code);

          return (
            <label
              key={prop.id}
              className={`
                relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all cursor-pointer
                min-h-[80px] hover:border-primary/50 hover:bg-primary/5
                ${isChecked ? 'border-primary bg-primary/10 shadow-sm' : 'border-neutral-200 bg-white'}
              `}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => handleToggle(prop.id, e.target.checked)}
                className="sr-only"
              />
              <span className="text-3xl mb-1" aria-hidden="true">
                {emoji}
              </span>
              <span className="text-sm font-medium text-center text-neutral-900">{prop.label}</span>
              {isChecked && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </label>
          );
        })}
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
