import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../lib/auth';
import { handleError, AppError } from '../../../../lib/errors';
import { toggleFavoriteSchema } from '../../../../lib/validation';
import { QuestService } from '../../../../lib/quest-service';
import { TelemetryService } from '../../../../lib/telemetry-service';

/**
 * PATCH /api/quests/:id/favorite
 * Toggles favorite status of a quest
 * Sets/clears favorited_at timestamp
 * Tracks telemetry event
 * Requires authentication and ownership
 */
export const PATCH: APIRoute = async ({ locals, params, request }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const questId = params.id;

    if (!questId) {
      throw new AppError(400, 'invalid_id', 'Quest ID is required');
    }
    const body = await request.json();

    // Validate input
    const validation = toggleFavoriteSchema.safeParse(body);
    if (!validation.success) {
      throw new AppError(400, 'validation_failed', 'Nieprawidłowe dane wejściowe', validation.error.errors);
    }

    const { is_favorite } = validation.data;

    const questService = new QuestService(locals.supabase);
    const quest = await questService.updateQuest(questId, userId, {
      is_favorite,
    });

    // Track telemetry
    const telemetry = new TelemetryService(locals.supabase);
    await telemetry.trackFavoriteToggled(userId, questId, is_favorite);

    return new Response(JSON.stringify(quest), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
