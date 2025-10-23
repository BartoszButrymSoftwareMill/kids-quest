import { defineMiddleware } from 'astro:middleware';

import { createSupabaseServerInstance } from '../db/supabase.client';

/**
 * Public paths that don't require authentication
 * Includes auth pages, API endpoints, and static assets
 */
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/reset-password',
  '/auth/callback',
  '/auth/update-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
];

/**
 * Check if a path is public (doesn't require authentication)
 */
function isPublicPath(pathname: string): boolean {
  // Exact match for public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }

  // Allow static assets (CSS, JS, images, fonts)
  if (pathname.startsWith('/_astro/') || pathname.startsWith('/favicon.')) {
    return true;
  }

  // Allow API routes except auth-protected ones
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/profiles') && !pathname.startsWith('/api/quests')) {
    return true;
  }

  return false;
}

/**
 * Middleware that creates a Supabase client for each request and handles authentication
 *
 * For protected routes (e.g., /dashboard/*):
 * - Verifies user authentication via Supabase Auth
 * - Redirects to login if user is not authenticated
 *
 * For public routes:
 * - Still creates Supabase client but doesn't enforce authentication
 *
 * Following Supabase Auth best practices with @supabase/ssr
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, request, url, redirect } = context;

  // Create Supabase client using proper SSR cookie handling
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Attach Supabase client to context.locals for use in pages and API routes
  context.locals.supabase = supabase;

  // Skip auth check for public paths
  if (isPublicPath(url.pathname)) {
    return next();
  }

  // For protected routes, verify user authentication
  // IMPORTANT: Always call getUser() to validate the JWT and refresh if needed
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    // User is not authenticated - redirect to login with return URL
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('redirect', url.pathname);
    return redirect(loginUrl.toString());
  }

  // User is authenticated - continue to the requested page
  return next();
});
