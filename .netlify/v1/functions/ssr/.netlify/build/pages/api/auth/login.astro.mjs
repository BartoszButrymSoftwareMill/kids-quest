import { z } from 'zod';
import { h as handleError } from '../../../chunks/errors_ClCkzvSe.mjs';
import { r as rateLimiter, R as RATE_LIMITS } from '../../../chunks/rate-limiter_CparevQz.mjs';
import { T as TelemetryService } from '../../../chunks/telemetry-service_C3Qw2RXq.mjs';
export { renderers } from '../../../renderers.mjs';

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
  redirectTo: z.string().optional()
});
function mapAuthError(error) {
  const message = error.message.toLowerCase();
  if (message.includes("invalid") || message.includes("credentials") || message.includes("password")) {
    return "Nieprawidłowy email lub hasło";
  }
  if (message.includes("email not confirmed") || message.includes("confirm")) {
    return "Potwierdź swój adres email przed zalogowaniem";
  }
  if (message.includes("too many") || error.status === 429) {
    return "Zbyt wiele prób logowania. Spróbuj ponownie później";
  }
  return "Nieprawidłowy email lub hasło";
}
const POST = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { email, password, redirectTo } = loginSchema.parse(body);
    const rateLimitResult = await rateLimiter.checkLimit(`login:${email}`, RATE_LIMITS.AUTH_LOGIN);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for login attempt: ${email}`);
      return new Response(
        JSON.stringify({
          error: {
            code: "rate_limit_exceeded",
            message: "Zbyt wiele prób logowania. Spróbuj ponownie za kilka minut",
            retryAfter: rateLimitResult.retryAfter
          }
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      console.error("Login error:", { email, error: error.message, status: error.status });
      return new Response(
        JSON.stringify({
          error: {
            code: "auth_error",
            message: mapAuthError(error)
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (!data.session) {
      console.error("Login succeeded but no session created:", { email });
      return new Response(
        JSON.stringify({
          error: {
            code: "auth_error",
            message: "Nie udało się utworzyć sesji. Spróbuj ponownie"
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const telemetry = new TelemetryService(locals.supabase);
    try {
      await telemetry.trackAuthLogin(data.user.id, "email");
    } catch (telemetryError) {
      console.error("Failed to track auth_login event:", telemetryError);
    }
    console.info("Login successful:", { userId: data.user.id, email });
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email
        },
        redirectTo: redirectTo || "/dashboard"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Unexpected error in login endpoint:", error);
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
