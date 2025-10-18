import type { AIGeneratedQuest, GenerateQuestRequest } from '../types';
import { ContentSafetyService } from './content-safety';
import type { SupabaseClient } from '../db/supabase.client';
import { OpenRouterService } from './openrouter';

/**
 * AI Service for generating quests
 * Używa uniwersalnej OpenRouterService do komunikacji z API
 */
export class AIService {
  private openRouter: OpenRouterService;

  constructor(
    apiKey: string,
    private contentSafety: ContentSafetyService
  ) {
    this.openRouter = new OpenRouterService({
      apiKey,
      httpReferer: 'https://kidsquest.app',
      appTitle: 'KidsQuest',
      defaultModel: 'meta-llama/llama-4-maverick:free',
      timeout: 30000,
      defaultModelParams: {
        temperature: 0.8,
        max_tokens: 2000,
      },
    });
  }

  /**
   * Generates a quest using AI based on provided parameters
   * Includes content safety validation and retry logic
   */
  async generateQuest(params: GenerateQuestRequest): Promise<AIGeneratedQuest> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(params);

    const response = await this.openRouter.complete<AIGeneratedQuest>({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      // responseFormat nie jest wspierane przez wszystkie modele (np. Meta/Llama)
      // Polegamy na instrukcjach w prompcie
      maxRetries: 2,
      validator: async (quest) => {
        const q = quest as AIGeneratedQuest;

        // Sprawdź czy mamy wszystkie wymagane pola
        if (!q.title || !q.hook || !q.step1 || !q.step2 || !q.step3) {
          return false;
        }

        // Walidacja content safety
        const validation = await this.contentSafety.validateContent({
          title: q.title,
          hook: q.hook,
          step1: q.step1,
          step2: q.step2,
          step3: q.step3,
          easier_version: q.easier_version || '',
          harder_version: q.harder_version || '',
          safety_notes: q.safety_notes || '',
        });

        return validation.isValid;
      },
    });

    // Dodaj parametry z requestu
    return {
      ...response.data,
      age_group_id: params.age_group_id,
      duration_minutes: params.duration_minutes,
      location: params.location,
      energy_level: params.energy_level,
      prop_ids: params.prop_ids || [],
      source: 'ai',
    };
  }

  /**
   * Builds the system prompt for AI generation
   */
  private buildSystemPrompt(): string {
    return `Jesteś ekspertem w tworzeniu kreatywnych, bezpiecznych scenariuszy zabaw dla dzieci.

ZASADY BEZPIECZEŃSTWA:
- Zawsze priorytetuj bezpieczeństwo dziecka
- Unikaj niebezpiecznych aktywności (wysokości, ostrych przedmiotów, ognia)
- Dla lokacji "outdoor" sugeruj tylko bezpieczne miejsca (park, ogród, plac zabaw)
- Nie używaj tematów związanych z przemocą, bronią, alkoholem, papierosami

WYTYCZNE TREŚCI:
- Używaj języka polskiego
- Dostosuj poziom trudności do grupy wiekowej
- Twórz pozytywne, wspierające narracje
- Zachęcaj do współpracy, kreatywności i rozwiązywania problemów
- Unikaj konkurencji - skup się na zabawie i odkrywaniu

FORMAT ODPOWIEDZI:
Odpowiedz TYLKO w formacie JSON bez dodatkowego tekstu. Struktura:
{
  "title": "Krótki, chwytliwy tytuł (10-200 znaków)",
  "hook": "Intrygujące wprowadzenie (10-300 znaków)",
  "step1": "Pierwszy krok questa (10-250 znaków)",
  "step2": "Drugi krok questa (10-250 znaków)",
  "step3": "Trzeci krok questa (10-250 znaków)",
  "easier_version": "Prostsza wersja lub null",
  "harder_version": "Trudniejsza wersja lub null",
  "safety_notes": "Uwagi dotyczące bezpieczeństwa lub null"
}`;
  }

  /**
   * Builds the user prompt with quest parameters
   */
  private buildUserPrompt(params: GenerateQuestRequest): string {
    const ageGroupMap: Record<number, string> = {
      1: '3-4 lata',
      2: '5-6 lat',
      3: '7-8 lat',
      4: '9-10 lat',
    };

    const ageLabel = ageGroupMap[params.age_group_id] || 'nieznana';

    return `Wygeneruj scenariusz zabawy (quest) o następujących parametrach:
- Grupa wiekowa: ${ageLabel}
- Czas trwania: ${params.duration_minutes} minut
- Lokalizacja: ${params.location === 'home' ? 'dom' : 'na zewnątrz'}
- Poziom energii: ${params.energy_level === 'low' ? 'niski' : params.energy_level === 'medium' ? 'średni' : 'wysoki'}

Zwróć odpowiedź TYLKO w formacie JSON zgodnie ze strukturą podaną w instrukcjach systemowych.`;
  }
}

/**
 * Factory function to create AIService instance
 * Throws error if OPENROUTER_API_KEY is not configured
 */
export function createAIService(supabase: SupabaseClient): AIService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const contentSafety = new ContentSafetyService(supabase);
  return new AIService(apiKey, contentSafety);
}
