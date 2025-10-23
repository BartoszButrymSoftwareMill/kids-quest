import { r as requireAuth } from '../../chunks/auth_BXBtxCV-.mjs';
import { A as AppError, h as handleError } from '../../chunks/errors_ClCkzvSe.mjs';
import { b as createQuestSchema, q as questListQuerySchema } from '../../chunks/validation_TFVsMUGg.mjs';
import { Q as QuestService } from '../../chunks/quest-service_DKGWmNqv.mjs';
import { C as ContentSafetyService } from '../../chunks/content-safety_WWQcEu_D.mjs';
import { T as TelemetryService } from '../../chunks/telemetry-service_C3Qw2RXq.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ locals, request }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const body = await request.json();
    const validation = createQuestSchema.safeParse(body);
    if (!validation.success) {
      throw new AppError(400, "validation_failed", "Nieprawidłowe dane wejściowe", validation.error.errors);
    }
    const questData = validation.data;
    if (questData.source === "manual") {
      const contentSafety = new ContentSafetyService(locals.supabase);
      const contentValidation = await contentSafety.validateContent({
        title: questData.title,
        hook: questData.hook,
        step1: questData.step1,
        step2: questData.step2,
        step3: questData.step3,
        easier_version: questData.easier_version || "",
        harder_version: questData.harder_version || "",
        safety_notes: questData.safety_notes || ""
      });
      if (!contentValidation.isValid) {
        return new Response(
          JSON.stringify({
            error: "validation_failed",
            message: "Treść zawiera niedozwolone słowa",
            violations: contentValidation.violations,
            suggestions: contentValidation.suggestions
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }
    const questService = new QuestService(locals.supabase);
    const quest = await questService.createQuest(userId, questData);
    const telemetry = new TelemetryService(locals.supabase);
    if (questData.source === "manual") {
      await telemetry.createEvent(userId, {
        event_type: "quest_created_manual",
        quest_id: quest.id,
        app_version: questData.app_version
      });
    } else if (questData.status === "started") {
      await telemetry.trackQuestStarted(userId, quest.id, questData.app_version);
    } else {
      await telemetry.trackQuestSaved(userId, quest.id, questData.app_version);
    }
    return new Response(JSON.stringify(quest), {
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
const GET = async ({ locals, url }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const params = Object.fromEntries(url.searchParams.entries());
    const validation = questListQuerySchema.safeParse(params);
    if (!validation.success) {
      throw new AppError(400, "validation_failed", "Nieprawidłowe parametry zapytania", validation.error.errors);
    }
    const query = validation.data;
    let dbQuery = locals.supabase.from("quests").select(
      `
        *,
        age_groups (id, code, label, span),
        quest_props (
          prop_id,
          props (id, code, label)
        )
      `,
      { count: "exact" }
    ).eq("user_id", userId);
    if (query.age_group_id) {
      dbQuery = dbQuery.eq("age_group_id", query.age_group_id);
    }
    if (query.location) {
      dbQuery = dbQuery.eq("location", query.location);
    }
    if (query.energy_level) {
      dbQuery = dbQuery.eq("energy_level", query.energy_level);
    }
    if (query.source) {
      dbQuery = dbQuery.eq("source", query.source);
    }
    if (query.status) {
      dbQuery = dbQuery.eq("status", query.status);
    }
    if (query.is_favorite) {
      dbQuery = dbQuery.eq("is_favorite", query.is_favorite === "true");
    }
    if (query.sort === "favorites") {
      dbQuery = dbQuery.eq("is_favorite", true).order("favorited_at", { ascending: false });
    } else {
      dbQuery = dbQuery.order("created_at", { ascending: false });
    }
    dbQuery = dbQuery.range(query.offset, query.offset + query.limit - 1);
    const { data: quests, error, count } = await dbQuery;
    if (error) {
      throw new AppError(500, "query_failed", "Nie udało się pobrać questów");
    }
    const questService = new QuestService(locals.supabase);
    const formattedQuests = quests.map((q) => questService["formatQuestResponse"](q));
    const response = {
      quests: formattedQuests,
      pagination: {
        total: count || 0,
        limit: query.limit,
        offset: query.offset,
        has_more: query.offset + query.limit < (count || 0)
      }
    };
    return new Response(JSON.stringify(response), {
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
  GET,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
