import type { APIRoute } from 'astro';
import { handleError } from '../../../lib/errors';

/**
 * POST /api/auth/logout
 * Logs out the current user
 */
export const POST: APIRoute = async ({ locals, cookies }) => {
  try {
    await locals.supabase.auth.signOut();

    // Clear authentication cookies
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
