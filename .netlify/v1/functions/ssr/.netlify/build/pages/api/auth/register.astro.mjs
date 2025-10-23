import { z } from 'zod';
import { h as handleError } from '../../../chunks/errors_ClCkzvSe.mjs';
import { r as rateLimiter, R as RATE_LIMITS } from '../../../chunks/rate-limiter_CparevQz.mjs';
import { T as TelemetryService } from '../../../chunks/telemetry-service_C3Qw2RXq.mjs';
export { renderers } from '../../../renderers.mjs';

const registerSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła nie są identyczne",
  path: ["confirmPassword"]
});
function mapAuthError(error) {
  const message = error.message.toLowerCase();
  if (message.includes("already registered") || message.includes("already exists")) {
    return "Ten adres email jest już zarejestrowany. Zaloguj się lub użyj innego adresu";
  }
  if (message.includes("invalid email")) {
    return "Nieprawidłowy format adresu email";
  }
  if (message.includes("password") && (message.includes("weak") || message.includes("short"))) {
    return "Hasło jest zbyt słabe. Użyj co najmniej 6 znaków";
  }
  if (message.includes("too many") || error.status === 429) {
    return "Zbyt wiele prób rejestracji. Spróbuj ponownie później";
  }
  return "Nie udało się utworzyć konta. Spróbuj ponownie";
}
const POST = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { email, password } = registerSchema.parse(body);
    const rateLimitResult = await rateLimiter.checkLimit(`register:${email}`, RATE_LIMITS.AUTH_REGISTER);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for registration attempt: ${email}`);
      return new Response(
        JSON.stringify({
          error: {
            code: "rate_limit_exceeded",
            message: "Zbyt wiele prób rejestracji. Spróbuj ponownie za kilka minut",
            retryAfter: rateLimitResult.retryAfter
          }
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/dashboard`
      }
    });
    if (error) {
      console.error("Registration error:", { email, error: error.message, status: error.status });
      return new Response(
        JSON.stringify({
          error: {
            code: "registration_error",
            message: mapAuthError(error)
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (!data.user) {
      console.error("Registration succeeded but no user created:", { email });
      return new Response(
        JSON.stringify({
          error: {
            code: "registration_error",
            message: "Nie udało się utworzyć konta. Spróbuj ponownie"
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (data.session) {
      const telemetry = new TelemetryService(locals.supabase);
      try {
        await telemetry.trackAuthSignup(data.user.id, "email", !data.session);
      } catch (telemetryError) {
        console.error("Failed to track auth_signup event:", telemetryError);
      }
    }
    console.info("Registration successful:", {
      userId: data.user.id,
      email,
      needsConfirmation: !data.session
    });
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email
        },
        needsEmailConfirmation: !data.session
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Unexpected error in registration endpoint:", error);
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
