import type { APIRoute } from 'astro';
import { requireAuth } from '../../../lib/auth';
import { handleError, AppError } from '../../../lib/errors';
import { updateQuestSchema } from '../../../lib/validation';
import { QuestService } from '../../../lib/quest-service';
import { TelemetryService } from '../../../lib/telemetry-service';

/**
 * GET /api/quests/:id
 * Returns detailed information about a specific quest
 * Requires authentication and ownership
 */
export const GET: APIRoute = async ({ locals, params }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const questId = params.id;

    if (!questId) {
      throw new AppError(400, 'invalid_id', 'Quest ID is required');
    }

    const questService = new QuestService(locals.supabase);
    const quest = await questService.getQuest(questId, userId);

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

/**
 * PATCH /api/quests/:id
 * Updates quest status or favorite status
 * Automatically manages timestamps based on status changes
 * Tracks telemetry events
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
    const validation = updateQuestSchema.safeParse(body);
    if (!validation.success) {
      throw new AppError(400, 'validation_failed', 'Nieprawidłowe dane wejściowe', validation.error.errors);
    }

    const updates = validation.data;

    // Update quest
    const questService = new QuestService(locals.supabase);
    const quest = await questService.updateQuest(questId, userId, updates);

    // Track telemetry
    const telemetry = new TelemetryService(locals.supabase);

    if (updates.status === 'started') {
      await telemetry.trackQuestStarted(userId, questId);
    } else if (updates.status === 'completed') {
      await telemetry.trackQuestCompleted(userId, questId);
    }

    if (updates.is_favorite !== undefined) {
      await telemetry.trackFavoriteToggled(userId, questId, updates.is_favorite);
    }

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

/**
 * DELETE /api/quests/:id
 * Deletes a quest
 * Tracks telemetry before deletion
 * Requires authentication and ownership
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const questId = params.id;

    if (!questId) {
      throw new AppError(400, 'invalid_id', 'Quest ID is required');
    }

    // Track deletion before deleting
    const telemetry = new TelemetryService(locals.supabase);
    await telemetry.trackQuestDeleted(userId, questId);

    // Delete quest
    const questService = new QuestService(locals.supabase);
    await questService.deleteQuest(questId, userId);

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
