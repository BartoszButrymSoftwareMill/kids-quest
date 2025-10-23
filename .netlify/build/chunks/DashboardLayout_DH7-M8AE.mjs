import { d as createComponent, e as createAstro, j as renderComponent, r as renderTemplate, m as maybeRenderHead, l as renderSlot } from './astro/server_BshbuMZ6.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout, L as LogoutButton } from './BaseLayout_D9XVPDfW.mjs';

const $$Astro = createAstro();
const $$DashboardLayout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$DashboardLayout;
  const { title = "Dashboard | KidsQuest", description } = Astro2.props;
  const supabase = Astro2.locals.supabase;
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return Astro2.redirect(`/login?redirect=${Astro2.url.pathname}`);
  }
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-screen bg-neutral-50"> <!-- Top Navigation --> <header class="bg-white border-b border-neutral-200"> <div class="container mx-auto px-4 py-4"> <nav class="flex items-center justify-between"> <a href="/dashboard" class="text-2xl font-bold text-primary"> KidsQuest </a> <div class="flex items-center gap-4"> <a href="/dashboard" class="px-4 py-2 text-neutral-700 hover:text-primary transition-colors">
Moje questy
</a> <a href="/dashboard/generate" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
Generuj quest
</a> ${renderComponent($$result2, "LogoutButton", LogoutButton, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/components/auth/LogoutButton", "client:component-export": "LogoutButton" })} </div> </nav> </div> </header> <!-- Main Content --> <main class="py-8"> ${renderSlot($$result2, $$slots["default"])} </main> </div> ` })}`;
}, "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/layouts/DashboardLayout.astro", void 0);

export { $$DashboardLayout as $ };
