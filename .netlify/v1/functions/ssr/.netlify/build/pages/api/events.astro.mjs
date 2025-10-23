import { r as requireAuth } from '../../chunks/auth_BXBtxCV-.mjs';
import { A as AppError, h as handleError } from '../../chunks/errors_ClCkzvSe.mjs';
import { c as createEventSchema } from '../../chunks/validation_TFVsMUGg.mjs';
import { T as TelemetryService } from '../../chunks/telemetry-service_C3Qw2RXq.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ locals, request }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const body = await request.json();
    const validation = createEventSchema.safeParse(body);
    if (!validation.success) {
      throw new AppError(400, "validation_failed", "Nieprawidłowe dane wejściowe", validation.error.errors);
    }
    const eventData = validation.data;
    if (eventData.quest_id) {
      const { data: quest } = await locals.supabase.from("quests").select("id").eq("id", eventData.quest_id).eq("user_id", userId).single();
      if (!quest) {
        throw new AppError(400, "invalid_quest", "Quest nie istnieje lub nie należy do użytkownika");
      }
    }
    const telemetry = new TelemetryService(locals.supabase);
    const event = await telemetry.createEvent(userId, eventData);
    return new Response(JSON.stringify(event), {
      status: 201,
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
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
