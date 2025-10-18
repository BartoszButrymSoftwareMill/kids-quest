import type { APIRoute } from 'astro';
import { z } from 'zod';
import { handleError } from '../../../lib/errors';
import { rateLimiter, RATE_LIMITS } from '../../../lib/rate-limiter';
import { TelemetryService } from '../../../lib/telemetry-service';

const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
  redirectTo: z.string().optional(),
});

/**
 * Maps Supabase auth errors to user-friendly Polish messages
 */
function mapAuthError(error: { message: string; status?: number }): string {
  const message = error.message.toLowerCase();

  // Invalid credentials
  if (message.includes('invalid') || message.includes('credentials') || message.includes('password')) {
    return 'Nieprawidłowy email lub hasło';
  }

  // Email not confirmed
  if (message.includes('email not confirmed') || message.includes('confirm')) {
    return 'Potwierdź swój adres email przed zalogowaniem';
  }

  // Too many requests
  if (message.includes('too many') || error.status === 429) {
    return 'Zbyt wiele prób logowania. Spróbuj ponownie później';
  }

  // Generic fallback
  return 'Nieprawidłowy email lub hasło';
}

/**
 * POST /api/auth/login
 * Authenticates user with email and password
 * US-002: Email/password login with rate limiting and telemetry
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { email, password, redirectTo } = loginSchema.parse(body);

    // US-024: Rate limiting - 5 attempts per 15 minutes per email
    const rateLimitResult = await rateLimiter.checkLimit(`login:${email}`, RATE_LIMITS.AUTH_LOGIN);

    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for login attempt: ${email}`);
      return new Response(
        JSON.stringify({
          error: {
            code: 'rate_limit_exceeded',
            message: 'Zbyt wiele prób logowania. Spróbuj ponownie za kilka minut',
            retryAfter: rateLimitResult.retryAfter,
          },
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Attempt authentication
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', { email, error: error.message, status: error.status });
      return new Response(
        JSON.stringify({
          error: {
            code: 'auth_error',
            message: mapAuthError(error),
          },
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!data.session) {
      console.error('Login succeeded but no session created:', { email });
      return new Response(
        JSON.stringify({
          error: {
            code: 'auth_error',
            message: 'Nie udało się utworzyć sesji. Spróbuj ponownie',
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Cookies are automatically set by @supabase/ssr via setAll() during signInWithPassword()
    // No manual cookie management needed - follows Supabase Auth best practices

    // US-002: Track auth_login event (telemetry)
    const telemetry = new TelemetryService(locals.supabase);
    try {
      await telemetry.trackAuthLogin(data.user.id, 'email');
    } catch (telemetryError) {
      // Non-fatal: log but don't fail the login
      console.error('Failed to track auth_login event:', telemetryError);
    }

    console.info('Login successful:', { userId: data.user.id, email });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        redirectTo: redirectTo || '/dashboard',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error in login endpoint:', error);
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
