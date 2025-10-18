import type { APIRoute } from 'astro';
import { requireAuth } from '../../../../lib/auth';
import { handleError, AppError } from '../../../../lib/errors';
import { QuestService } from '../../../../lib/quest-service';
import { TelemetryService } from '../../../../lib/telemetry-service';

/**
 * PATCH /api/quests/:id/complete
 * Convenience endpoint to mark quest as completed
 * Updates quest status to 'completed' and sets completed_at timestamp
 * Tracks telemetry event
 * Requires authentication and ownership
 */
export const PATCH: APIRoute = async ({ locals, params }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const questId = params.id;

    if (!questId) {
      throw new AppError(400, 'invalid_id', 'Quest ID is required');
    }

    const questService = new QuestService(locals.supabase);
    const quest = await questService.updateQuest(questId, userId, {
      status: 'completed',
    });

    // Track telemetry
    const telemetry = new TelemetryService(locals.supabase);
    await telemetry.trackQuestCompleted(userId, questId);

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
