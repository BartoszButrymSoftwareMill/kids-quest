import { d as createComponent, e as createAstro, g as addAttribute, n as renderHead, l as renderSlot, j as renderComponent, r as renderTemplate, p as Fragment } from './astro/server_BshbuMZ6.mjs';
import 'kleur/colors';
/* empty css                            */
import { jsx } from 'react/jsx-runtime';
import { useState } from 'react';

function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const handleLogout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST"
      });
      if (response.ok) {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout error:", err);
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick: handleLogout,
      disabled: loading,
      className: "px-4 py-2 text-neutral-700 hover:text-red-600 transition-colors disabled:opacity-50",
      children: loading ? "Wylogowywanie..." : "Wyloguj się"
    }
  );
}

const $$Astro = createAstro();
const $$BaseLayout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BaseLayout;
  const { title = "KidsQuest", description = "Tw\xF3rz i odkrywaj zabawy dla dzieci", showNav = false } = Astro2.props;
  const supabase = Astro2.locals.supabase;
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return renderTemplate`<html lang="pl"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"${addAttribute(Astro2.generator, "content")}><meta name="description"${addAttribute(description, "content")}><title>${title}</title>${renderHead()}</head> <body> ${showNav && renderTemplate`<header class="bg-white border-b border-neutral-200"> <div class="container mx-auto px-4 py-4"> <nav class="flex items-center justify-between"> <a href="/" class="text-2xl font-bold text-blue-600">
KidsQuest
</a> <div class="flex items-center gap-4"> ${user ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate` <a href="/dashboard" class="px-4 py-2 text-neutral-700 hover:text-blue-600 transition-colors">
Mój panel
</a> ${renderComponent($$result2, "LogoutButton", LogoutButton, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/components/auth/LogoutButton", "client:component-export": "LogoutButton" })} ` })}` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate` <a href="/login" class="px-4 py-2 text-neutral-700 hover:text-blue-600 transition-colors">
Zaloguj się
</a> <a href="/register" class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
Zarejestruj się
</a> ` })}`} </div> </nav> </div> </header>`} ${renderSlot($$result, $$slots["default"])} </body></html>`;
}, "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/layouts/BaseLayout.astro", void 0);

export { $$BaseLayout as $, LogoutButton as L };
