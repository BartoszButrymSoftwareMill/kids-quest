import { d as createComponent, e as createAstro } from '../../chunks/astro/server_BshbuMZ6.mjs';
import 'kleur/colors';
import 'clsx';
import '../../chunks/BaseLayout_D9XVPDfW.mjs';
import { T as TelemetryService } from '../../chunks/telemetry-service_C3Qw2RXq.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$Callback = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Callback;
  const supabase = Astro2.locals.supabase;
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();
  if (error || !session) {
    console.error("OAuth callback error:", error);
    return Astro2.redirect("/login?error=oauth_failed");
  }
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("OAuth callback: no user found despite having session");
    return Astro2.redirect("/login?error=oauth_failed");
  }
  const telemetry = new TelemetryService(supabase);
  try {
    const createdAt = new Date(user.created_at);
    const now = /* @__PURE__ */ new Date();
    const isNewUser = now.getTime() - createdAt.getTime() < 1e4;
    if (isNewUser) {
      await telemetry.trackAuthSignup(user.id, "google", false);
      console.info("OAuth signup successful:", { userId: user.id, email: user.email });
    } else {
      await telemetry.trackAuthLogin(user.id, "google");
      console.info("OAuth login successful:", { userId: user.id, email: user.email });
    }
  } catch (telemetryError) {
    console.error("Failed to track OAuth event:", telemetryError);
  }
  return Astro2.redirect("/dashboard");
}, "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/auth/callback.astro", void 0);

const $$file = "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/auth/callback.astro";
const $$url = "/auth/callback";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Callback,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
