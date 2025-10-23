import { r as requireAuth } from '../../../../chunks/auth_BXBtxCV-.mjs';
import { A as AppError, h as handleError } from '../../../../chunks/errors_ClCkzvSe.mjs';
import { Q as QuestService } from '../../../../chunks/quest-service_DKGWmNqv.mjs';
import { T as TelemetryService } from '../../../../chunks/telemetry-service_C3Qw2RXq.mjs';
export { renderers } from '../../../../renderers.mjs';

const PATCH = async ({ locals, params }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const questId = params.id;
    if (!questId) {
      throw new AppError(400, "invalid_id", "Quest ID is required");
    }
    const questService = new QuestService(locals.supabase);
    const quest = await questService.updateQuest(questId, userId, {
      status: "completed"
    });
    const telemetry = new TelemetryService(locals.supabase);
    await telemetry.trackQuestCompleted(userId, questId);
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
