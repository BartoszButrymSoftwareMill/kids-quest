import { useCallback } from 'react';
import type { CreateQuestRequest, QuestResponse, ApiError } from '../../types';

export function useQuestSave() {
  const saveQuest = useCallback(async (questData: CreateQuestRequest): Promise<QuestResponse> => {
    try {
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questData),
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw error;
      }

      const quest: QuestResponse = await response.json();
      return quest;
    } catch (err) {
      // Network error
      if (err instanceof TypeError) {
        throw {
          error: 'network_error',
          message: 'Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.',
        } as ApiError;
      }

      // API error (already ApiError)
      throw err;
    }
  }, []);

  return { saveQuest };
}
