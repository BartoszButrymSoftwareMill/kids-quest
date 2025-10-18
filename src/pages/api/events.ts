import type { APIRoute } from 'astro';
import { requireAuth } from '../../lib/auth';
import { handleError, AppError } from '../../lib/errors';
import { createEventSchema } from '../../lib/validation';
import { TelemetryService } from '../../lib/telemetry-service';

/**
 * POST /api/events
 * Creates a telemetry event for tracking user interactions
 * Requires authentication
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const body = await request.json();

    // Validate input
    const validation = createEventSchema.safeParse(body);
    if (!validation.success) {
      throw new AppError(400, 'validation_failed', 'Nieprawidłowe dane wejściowe', validation.error.errors);
    }

    const eventData = validation.data;

    // Verify quest_id belongs to user if provided
    if (eventData.quest_id) {
      const { data: quest } = await locals.supabase
        .from('quests')
        .select('id')
        .eq('id', eventData.quest_id)
        .eq('user_id', userId)
        .single();

      if (!quest) {
        throw new AppError(400, 'invalid_quest', 'Quest nie istnieje lub nie należy do użytkownika');
      }
    }

    // Create event
    const telemetry = new TelemetryService(locals.supabase);
    const event = await telemetry.createEvent(userId, eventData);

    return new Response(JSON.stringify(event), {
      status: 201,
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
