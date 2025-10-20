import type { APIRoute } from 'astro';
import { z } from 'zod';
import { handleError } from '../../../lib/errors';
import { rateLimiter, RATE_LIMITS } from '../../../lib/rate-limiter';
import { TelemetryService } from '../../../lib/telemetry-service';

const registerSchema = z
  .object({
    email: z.string().email('Nieprawidłowy adres email'),
    password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła nie są identyczne',
    path: ['confirmPassword'],
  });

/**
 * Maps Supabase auth errors to user-friendly Polish messages
 */
function mapAuthError(error: { message: string; status?: number }): string {
  const message = error.message.toLowerCase();

  // User already registered
  if (message.includes('already registered') || message.includes('already exists')) {
    return 'Ten adres email jest już zarejestrowany. Zaloguj się lub użyj innego adresu';
  }

  // Invalid email format
  if (message.includes('invalid email')) {
    return 'Nieprawidłowy format adresu email';
  }

  // Password too weak
  if (message.includes('password') && (message.includes('weak') || message.includes('short'))) {
    return 'Hasło jest zbyt słabe. Użyj co najmniej 6 znaków';
  }

  // Too many requests
  if (message.includes('too many') || error.status === 429) {
    return 'Zbyt wiele prób rejestracji. Spróbuj ponownie później';
  }

  // Generic fallback
  return 'Nie udało się utworzyć konta. Spróbuj ponownie';
}

/**
 * POST /api/auth/register
 * Registers a new user with email and password
 * Implements rate limiting, telemetry, and proper error handling
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { email, password } = registerSchema.parse(body);

    // Rate limiting - 3 attempts per 15 minutes per email
    const rateLimitResult = await rateLimiter.checkLimit(`register:${email}`, RATE_LIMITS.AUTH_REGISTER);

    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for registration attempt: ${email}`);
      return new Response(
        JSON.stringify({
          error: {
            code: 'rate_limit_exceeded',
            message: 'Zbyt wiele prób rejestracji. Spróbuj ponownie za kilka minut',
            retryAfter: rateLimitResult.retryAfter,
          },
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Attempt user registration
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/dashboard`,
      },
    });

    if (error) {
      console.error('Registration error:', { email, error: error.message, status: error.status });
      return new Response(
        JSON.stringify({
          error: {
            code: 'registration_error',
            message: mapAuthError(error),
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!data.user) {
      console.error('Registration succeeded but no user created:', { email });
      return new Response(
        JSON.stringify({
          error: {
            code: 'registration_error',
            message: 'Nie udało się utworzyć konta. Spróbuj ponownie',
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Cookies are automatically set by @supabase/ssr via setAll() during signUp()
    // No manual cookie management needed - follows Supabase Auth best practices

    // Track auth_signup event (telemetry)
    // Only track if user has a session (i.e., email confirmation is disabled)
    // If email confirmation is enabled, user won't have a session yet and RLS will block the insert
    if (data.session) {
      const telemetry = new TelemetryService(locals.supabase);
      try {
        await telemetry.trackAuthSignup(data.user.id, 'email', !data.session);
      } catch (telemetryError) {
        // Non-fatal: log but don't fail the registration
        console.error('Failed to track auth_signup event:', telemetryError);
      }
    }

    console.info('Registration successful:', {
      userId: data.user.id,
      email,
      needsConfirmation: !data.session,
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        needsEmailConfirmation: !data.session,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error in registration endpoint:', error);
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
