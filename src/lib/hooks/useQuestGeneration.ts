import { useCallback } from 'react';
import type { GenerateQuestRequest, AIGeneratedQuest, ApiError } from '../../types';

export function useQuestGeneration() {
  const generateQuest = useCallback(async (params: GenerateQuestRequest): Promise<AIGeneratedQuest> => {
    try {
      const response = await fetch('/api/quests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw error;
      }

      const quest: AIGeneratedQuest = await response.json();
      return quest;
    } catch (err) {
      // Network error or timeout
      if (err instanceof TypeError) {
        throw {
          error: 'network_error',
          message: 'Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.',
        } as ApiError;
      }

      // Timeout error
      if ((err as Error).name === 'AbortError' || (err as Error).name === 'TimeoutError') {
        throw {
          error: 'timeout_error',
          message: 'Generacja trwa zbyt długo. Spróbuj ponownie.',
        } as ApiError;
      }

      // API error (already ApiError)
      throw err;
    }
  }, []);

  return { generateQuest };
}
