import type { APIRoute } from 'astro';
import { getAuthUser } from '../../../lib/auth';
import { handleError } from '../../../lib/errors';
import type { UserResponse } from '../../../types';

/**
 * GET /api/auth/me
 * Returns current authenticated user information
 * Requires authentication
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const user = await getAuthUser(locals.supabase);

    const response: { user: UserResponse } = {
      user: {
        id: user.id,
        email: user.email || '',
        created_at: user.created_at || new Date().toISOString(),
      },
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
