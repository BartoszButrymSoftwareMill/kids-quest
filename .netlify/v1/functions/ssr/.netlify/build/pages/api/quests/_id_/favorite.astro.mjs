import { r as requireAuth } from '../../../../chunks/auth_BXBtxCV-.mjs';
import { A as AppError, h as handleError } from '../../../../chunks/errors_ClCkzvSe.mjs';
import { t as toggleFavoriteSchema } from '../../../../chunks/validation_TFVsMUGg.mjs';
import { Q as QuestService } from '../../../../chunks/quest-service_DKGWmNqv.mjs';
import { T as TelemetryService } from '../../../../chunks/telemetry-service_C3Qw2RXq.mjs';
export { renderers } from '../../../../renderers.mjs';

const PATCH = async ({ locals, params, request }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const questId = params.id;
    if (!questId) {
      throw new AppError(400, "invalid_id", "Quest ID is required");
    }
    const body = await request.json();
    const validation = toggleFavoriteSchema.safeParse(body);
    if (!validation.success) {
      throw new AppError(400, "validation_failed", "Nieprawidłowe dane wejściowe", validation.error.errors);
    }
    const { is_favorite } = validation.data;
    const questService = new QuestService(locals.supabase);
    const quest = await questService.updateQuest(questId, userId, {
      is_favorite
    });
    const telemetry = new TelemetryService(locals.supabase);
    await telemetry.trackFavoriteToggled(userId, questId, is_favorite);
    return new Response(JSON.stringify(quest), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  PATCH
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
