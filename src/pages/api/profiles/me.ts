import type { APIRoute } from 'astro';
import { requireAuth } from '../../../lib/auth';
import { handleError, AppError } from '../../../lib/errors';
import { updateProfileSchema } from '../../../lib/validation';
import type { ProfileResponse } from '../../../types';

/**
 * GET /api/profiles/me
 * Returns current user's profile with default preferences
 * Requires authentication
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const userId = await requireAuth(locals.supabase);

    const { data: profile, error } = await locals.supabase.from('profiles').select('*').eq('user_id', userId).single();

    if (error || !profile) {
      throw new AppError(404, 'not_found', 'Profil nie został znaleziony');
    }

    const response: ProfileResponse = {
      user_id: profile.user_id,
      default_age_group_id: profile.default_age_group_id,
      default_duration_minutes: profile.default_duration_minutes,
      default_location: profile.default_location,
      default_energy_level: profile.default_energy_level,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };

    return new Response(JSON.stringify(response), {
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
 * PATCH /api/profiles/me
 * Updates current user's default preferences
 * Requires authentication
 */
export const PATCH: APIRoute = async ({ locals, request }) => {
  try {
    const userId = await requireAuth(locals.supabase);
    const body = await request.json();

    // Validate input
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      throw new AppError(400, 'validation_failed', 'Nieprawidłowe dane wejściowe', validation.error.errors);
    }

    const updates = validation.data;

    // Verify age_group_id exists if provided
    if (updates.default_age_group_id !== undefined && updates.default_age_group_id !== null) {
      const { data: ageGroup } = await locals.supabase
        .from('age_groups')
        .select('id')
        .eq('id', updates.default_age_group_id)
        .single();

      if (!ageGroup) {
        throw new AppError(404, 'not_found', 'Grupa wiekowa nie istnieje');
      }
    }

    // Update profile
    const { data: profile, error } = await locals.supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new AppError(500, 'update_failed', 'Nie udało się zaktualizować profilu');
    }

    const response: ProfileResponse = {
      user_id: profile.user_id,
      default_age_group_id: profile.default_age_group_id,
      default_duration_minutes: profile.default_duration_minutes,
      default_location: profile.default_location,
      default_energy_level: profile.default_energy_level,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };

    return new Response(JSON.stringify(response), {
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
