import type { APIRoute } from 'astro';
import { requireAuth } from '../../../lib/auth';
import { handleError, AppError } from '../../../lib/errors';
import { generateQuestSchema } from '../../../lib/validation';
import { rateLimiter, RATE_LIMITS } from '../../../lib/rate-limiter';
import { createAIService } from '../../../lib/ai-service';
import { TelemetryService } from '../../../lib/telemetry-service';
import type { AIGeneratedQuest } from '../../../types';

/**
 * POST /api/quests/generate
 * Generates a new quest using AI based on provided parameters
 * Does NOT save to database - returns generated quest for preview
 * Implements rate limiting (5/min, 30/hour)
 * Includes content safety validation
 * Requires authentication
 *
 * Request body:
 * - age_group_id: number (1-4)
 * - duration_minutes: number (1-480)
 * - location: 'home' | 'outdoor'
 * - energy_level: 'low' | 'medium' | 'high'
 * - prop_ids?: number[] (optional)
 * - app_version?: string (optional)
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const body = await request.json();

    // Validate input
    const validation = generateQuestSchema.safeParse(body);
    if (!validation.success) {
      throw new AppError(400, 'validation_failed', 'Nieprawidłowe dane wejściowe', validation.error.errors);
    }

    const params = validation.data;

    // Check rate limiting (minute)
    const minuteLimit = await rateLimiter.checkLimit(`${userId}:gen:minute`, RATE_LIMITS.QUEST_GENERATION_MINUTE);

    if (!minuteLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'rate_limit_exceeded',
          message: 'Wystąpił błąd, spróbuj później',
          retry_after: minuteLimit.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': minuteLimit.retryAfter?.toString() || '60',
          },
        }
      );
    }

    // Check rate limiting (hour)
    const hourLimit = await rateLimiter.checkLimit(`${userId}:gen:hour`, RATE_LIMITS.QUEST_GENERATION_HOUR);

    if (!hourLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'rate_limit_exceeded',
          message: 'Wystąpił błąd, spróbuj później',
          retry_after: hourLimit.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': hourLimit.retryAfter?.toString() || '3600',
          },
        }
      );
    }

    // Generate quest with AI
    const aiService = createAIService(locals.supabase);
    let quest: AIGeneratedQuest;

    try {
      quest = await aiService.generateQuest(params);
    } catch {
      // Track generation error
      const telemetry = new TelemetryService(locals.supabase);
      await telemetry.trackGenerationError(userId, 'generation_failed', params, params.app_version);

      throw new AppError(500, 'generation_failed', 'Wystąpił błąd, spróbuj później');
    }

    // Track successful generation
    const telemetry = new TelemetryService(locals.supabase);
    await telemetry.trackQuestGenerated(userId, null, params, params.app_version);

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
