import type { AIGeneratedQuest, AgeGroupResponse, PropResponse } from '../../types';
import { QuestContentDisplay } from './QuestContentDisplay';
import { ResultActions } from './ResultActions';

interface QuestResultProps {
  quest: AIGeneratedQuest;
  ageGroups: AgeGroupResponse[];
  props: PropResponse[];
  onAcceptAndStart: () => void;
  onSaveForLater: () => void;
  onSkip: () => void;
  onRegenerateWithSameParams: () => void;
  isSubmitting: boolean;
}

export function QuestResult({
  quest,
  ageGroups,
  props,
  onAcceptAndStart,
  onSaveForLater,
  onSkip,
  onRegenerateWithSameParams,
  isSubmitting,
}: QuestResultProps) {
  // Find the age group for this quest
  const ageGroup = ageGroups.find((ag) => ag.id === quest.age_group_id);

  if (!ageGroup) {
    return (
      <div className="text-center text-red-600">
        <p>Błąd: Nie znaleziono grupy wiekowej dla tego questa.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8">
      {/* Quest Content */}
      <QuestContentDisplay quest={quest} ageGroup={ageGroup} props={props} />

      {/* Actions */}
      <ResultActions
        onAcceptAndStart={onAcceptAndStart}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onRegenerateWithSameParams={onRegenerateWithSameParams}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
