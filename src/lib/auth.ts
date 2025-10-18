import type { SupabaseClient } from '../db/supabase.client';
import { AppError } from './errors';

/**
 * Requires authentication and returns the user ID
 * Throws AppError with 401 status if user is not authenticated
 *
 * @param supabase - Supabase client from context.locals
 * @returns User ID string
 * @throws AppError with 401 status if not authenticated
 */
export async function requireAuth(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AppError(401, 'unauthorized', 'Wymagane uwierzytelnienie');
  }

  return user.id;
}

/**
 * Gets the authenticated user with full details
 * Throws AppError with 401 status if user is not authenticated
 *
 * @param supabase - Supabase client from context.locals
 * @returns Authenticated user object
 * @throws AppError with 401 status if not authenticated
 */
export async function getAuthUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AppError(401, 'unauthorized', 'Wymagane uwierzytelnienie');
  }

  return user;
}
