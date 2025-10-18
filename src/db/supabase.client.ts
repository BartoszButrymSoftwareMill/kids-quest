import type { AstroCookies } from 'astro';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import type { SupabaseClient as SupabaseClientBase } from '@supabase/supabase-js';

import type { Database } from './database.types';

// Export custom SupabaseClient type for use across the application
export type SupabaseClient = SupabaseClientBase<Database>;

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Cookie options for Supabase authentication
 * Following security best practices from Supabase Auth documentation
 */
export const cookieOptions: CookieOptionsWithName = {
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'lax',
};

/**
 * Parses Cookie header string into array of name-value pairs
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

/**
 * Creates a Supabase server instance with proper cookie handling
 * This is the recommended approach for SSR applications using @supabase/ssr
 *
 * IMPORTANT: Only use getAll and setAll for cookie management (never use get/set/remove individually)
 *
 * @param context - Context object with headers and cookies from Astro
 * @returns Configured Supabase client for server-side operations
 */
export function createSupabaseServerInstance(context: { headers: Headers; cookies: AstroCookies }): SupabaseClient {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get('Cookie') ?? '');
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options: CookieOptionsWithName;
        }[]
      ) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });
}
