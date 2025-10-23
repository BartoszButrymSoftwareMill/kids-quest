import { d as createComponent, e as createAstro, j as renderComponent, r as renderTemplate, m as maybeRenderHead, g as addAttribute } from '../chunks/astro/server_BshbuMZ6.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_D9XVPDfW.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { G as GoogleLoginButton } from '../chunks/GoogleLoginButton_Bd9Vovzl.mjs';
export { renderers } from '../renderers.mjs';

function LoginForm({ redirectTo = "/dashboard" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password, redirectTo }),
        credentials: "include"
        // Important: include cookies
      });
      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data.error?.message || "Wystąpił błąd podczas logowania";
        setError(errorMessage);
        setLoading(false);
        return;
      }
      const destination = data.redirectTo || redirectTo;
      window.location.replace(destination);
    } catch (err) {
      console.error("Login request failed:", err);
      setError("Wystąpił błąd połączenia. Sprawdź internet i spróbuj ponownie");
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
    error && /* @__PURE__ */ jsx(
      "div",
      {
        className: "p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm",
        "data-testid": "error-message",
        children: error
      }
    ),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-neutral-700 mb-2", children: "Adres email" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "email",
          name: "email",
          type: "email",
          required: true,
          value: email,
          onChange: (e) => setEmail(e.target.value),
          className: "w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          placeholder: "twoj@email.pl",
          disabled: loading
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-neutral-700 mb-2", children: "Hasło" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "password",
          name: "password",
          type: "password",
          required: true,
          value: password,
          onChange: (e) => setPassword(e.target.value),
          className: "w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          placeholder: "••••••••",
          disabled: loading
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "submit",
        disabled: loading,
        className: "w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        children: loading ? "Logowanie..." : "Zaloguj się"
      }
    )
  ] });
}

const $$Astro = createAstro();
const $$Login = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Login;
  const supabase = Astro2.locals.supabase;
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const redirectTo = Astro2.url.searchParams.get("redirect") || "/dashboard";
  if (user) {
    return Astro2.redirect(redirectTo);
  }
  const errorParam = Astro2.url.searchParams.get("error");
  const errorMessages = {
    oauth_failed: "Logowanie przez Google nie powiod\u0142o si\u0119. Spr\xF3buj ponownie."
  };
  const errorMessage = errorParam ? errorMessages[errorParam] : null;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Zaloguj si\u0119 | KidsQuest", "description": "Zaloguj si\u0119 do swojego konta KidsQuest" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4"> <div class="max-w-md mx-auto"> <!-- Logo/Header --> <div class="text-center mb-8"> <a href="/" class="text-3xl font-bold text-blue-600 inline-block mb-4"> KidsQuest </a> <h1 class="text-2xl font-bold text-neutral-900 mb-2">Zaloguj się</h1> <p class="text-neutral-600">Witaj z powrotem! Zaloguj się do swojego konta.</p> </div> <!-- Login Form Card --> <div class="bg-white rounded-2xl shadow-lg p-8 mb-6"> ${errorMessage && renderTemplate`<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">${errorMessage}</div>`} <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"> <p class="text-sm text-blue-700"> <strong>Uwaga:</strong> Jeśli to Twoja pierwsza wizyta, najpierw <a${addAttribute(`/register?redirect=${redirectTo}`, "href")} class="underline font-semibold">zarejestruj się</a>.
</p> </div> <!-- Google Login --> ${renderComponent($$result2, "GoogleLoginButton", GoogleLoginButton, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/components/auth/GoogleLoginButton", "client:component-export": "GoogleLoginButton" })} <!-- Divider --> <div class="relative my-6"> <div class="absolute inset-0 flex items-center"> <div class="w-full border-t border-neutral-300"></div> </div> <div class="relative flex justify-center text-sm"> <span class="px-2 bg-white text-neutral-500">lub</span> </div> </div> <!-- Email Login --> ${renderComponent($$result2, "LoginForm", LoginForm, { "client:load": true, "redirectTo": redirectTo, "client:component-hydration": "load", "client:component-path": "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/components/auth/LoginForm", "client:component-export": "LoginForm" })} <!-- Forgot Password Link --> <div class="mt-4 text-center"> <a href="/reset-password" class="text-sm text-neutral-600 hover:text-blue-600 transition-colors">
Zapomniałeś hasła?
</a> </div> </div> <!-- Register Link --> <div class="text-center"> <p class="text-neutral-600">
Nie masz jeszcze konta?${" "} <a${addAttribute(`/register?redirect=${redirectTo}`, "href")} class="text-blue-600 font-semibold hover:underline">
Zarejestruj się
</a> </p> </div> <!-- Back to Home --> <div class="text-center mt-8"> <a href="/" class="text-neutral-500 hover:text-neutral-700 text-sm"> ← Wróć do strony głównej </a> </div> </div> </div> ` })}`;
}, "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/login.astro", void 0);

const $$file = "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/login.astro";
const $$url = "/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
