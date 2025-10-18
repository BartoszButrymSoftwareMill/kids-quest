import type { APIRoute } from 'astro';
import { handleError } from '../../lib/errors';
import type { AgeGroupResponse } from '../../types';

/**
 * GET /api/age-groups
 * Returns list of all available age groups
 * Public endpoint - no authentication required
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const { data: ageGroups, error } = await locals.supabase.from('age_groups').select('*').order('id');

    if (error) {
      throw error;
    }

    // Extract min/max from int4range span
    const formatted: AgeGroupResponse[] = ageGroups.map((ag) => {
      // Parse span like "[3,5)" to get min=3, max=4
      const spanStr = ag.span as string;
      const match = spanStr.match(/\[(\d+),(\d+)\)/);

      let min_age: number | undefined;
      let max_age: number | undefined;

      if (match) {
        min_age = parseInt(match[1]);
        max_age = parseInt(match[2]) - 1; // Exclusive upper bound
      }

      return {
        id: ag.id,
        code: ag.code,
        label: ag.label,
        min_age,
        max_age,
      };
    });

    return new Response(JSON.stringify({ age_groups: formatted }), {
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
