/* eslint-disable react/prop-types */
import type { AIGeneratedQuest, AgeGroupResponse, PropResponse } from '../../types';
import { getEmojiForProp } from '../../lib/prop-emojis';

interface QuestContentDisplayProps {
  quest: AIGeneratedQuest;
  ageGroup: AgeGroupResponse;
  props: PropResponse[];
}

export function QuestContentDisplay({ quest, ageGroup, props }: QuestContentDisplayProps) {
  // Get selected props labels
  const selectedProps = props.filter((p) => quest.prop_ids.includes(p.id));

  // Get location label
  const locationLabel = quest.location === 'home' ? 'Dom' : 'Dwór';

  // Get energy level label
  const energyLevelLabel = {
    low: 'Niska',
    medium: 'Średnia',
    high: 'Wysoka',
  }[quest.energy_level];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900" data-testid="quest-title">
          {quest.title}
        </h2>
      </div>

      {/* Hook Section */}
      <div className="bg-primary/10 border-l-4 border-primary p-5 rounded-r-lg" data-testid="quest-hook">
        <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">Hook</h3>
        <p className="text-lg text-neutral-900 leading-relaxed">{quest.hook}</p>
      </div>

      {/* Steps Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900">Kroki</h3>
        <ol className="space-y-3">
          {[quest.step1, quest.step2, quest.step3].map((step, index) => (
            <li key={index} className="flex gap-3" data-testid={`quest-step${index + 1}`}>
              <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </span>
              <p className="flex-1 text-neutral-700 leading-relaxed pt-1">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Variants Section */}
      {(quest.easier_version || quest.harder_version) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quest.easier_version && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg" data-testid="easier-version">
              <h3 className="text-sm font-semibold text-green-900 mb-2">🟢 Wersja łatwiej</h3>
              <p className="text-sm text-green-800">{quest.easier_version}</p>
            </div>
          )}
          {quest.harder_version && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg" data-testid="harder-version">
              <h3 className="text-sm font-semibold text-orange-900 mb-2">🔴 Wersja trudniej</h3>
              <p className="text-sm text-orange-800">{quest.harder_version}</p>
            </div>
          )}
        </div>
      )}

      {/* Safety Notes */}
      {quest.safety_notes && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0" aria-hidden="true">
              ⚠️
            </span>
            <div>
              <h3 className="text-sm font-semibold text-yellow-900 mb-1">Bezpieczeństwo</h3>
              <p className="text-sm text-yellow-800">{quest.safety_notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metadata Section */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Parametry</h3>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-900 rounded-full text-sm">
            👶 {ageGroup.label}
          </span>
          <span
            className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-900 rounded-full text-sm"
            data-testid="quest-duration"
          >
            ⏱️ {quest.duration_minutes} min
          </span>
          <span
            className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-900 rounded-full text-sm"
            data-testid="quest-location"
          >
            📍 {locationLabel}
          </span>
          <span
            className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-900 rounded-full text-sm"
            data-testid="quest-energy"
          >
            ⚡ {energyLevelLabel}
          </span>
          {selectedProps.map((prop) => (
            <span
              key={prop.id}
              className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-900 rounded-full text-sm"
            >
              {getEmojiForProp(prop.code)} {prop.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
