import type { APIRoute } from 'astro';
import { handleError } from '../../lib/errors';
import type { PropResponse } from '../../types';

/**
 * GET /api/props
 * Returns list of all available props/equipment
 * Public endpoint - no authentication required
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const { data: props, error } = await locals.supabase.from('props').select('*').order('id');

    if (error) {
      throw error;
    }

    const formatted: PropResponse[] = props.map((p) => ({
      id: p.id,
      code: p.code,
      label: p.label,
    }));

    return new Response(JSON.stringify({ props: formatted }), {
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
