import { r as requireAuth } from '../../../chunks/auth_BXBtxCV-.mjs';
import { A as AppError, h as handleError } from '../../../chunks/errors_ClCkzvSe.mjs';
import { u as updateProfileSchema } from '../../../chunks/validation_TFVsMUGg.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async ({ locals }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const { data: profile, error } = await locals.supabase.from("profiles").select("*").eq("user_id", userId).single();
    if (error || !profile) {
      throw new AppError(404, "not_found", "Profil nie został znaleziony");
    }
    const response = {
      user_id: profile.user_id,
      default_age_group_id: profile.default_age_group_id,
      default_duration_minutes: profile.default_duration_minutes,
      default_location: profile.default_location,
      default_energy_level: profile.default_energy_level,
      created_at: profile.created_at,
      updated_at: profile.updated_at
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
const PATCH = async ({ locals, request }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      throw new AppError(400, "validation_failed", "Nieprawidłowe dane wejściowe", validation.error.errors);
    }
    const updates = validation.data;
    if (updates.default_age_group_id !== void 0 && updates.default_age_group_id !== null) {
      const { data: ageGroup } = await locals.supabase.from("age_groups").select("id").eq("id", updates.default_age_group_id).single();
      if (!ageGroup) {
        throw new AppError(404, "not_found", "Grupa wiekowa nie istnieje");
      }
    }
    const { data: profile, error } = await locals.supabase.from("profiles").update(updates).eq("user_id", userId).select().single();
    if (error) {
      throw new AppError(500, "update_failed", "Nie udało się zaktualizować profilu");
    }
    const response = {
      user_id: profile.user_id,
      default_age_group_id: profile.default_age_group_id,
      default_duration_minutes: profile.default_duration_minutes,
      default_location: profile.default_location,
      default_energy_level: profile.default_energy_level,
      created_at: profile.created_at,
      updated_at: profile.updated_at
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
  PATCH
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
