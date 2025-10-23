import { d as createComponent, e as createAstro, j as renderComponent, r as renderTemplate, m as maybeRenderHead, g as addAttribute } from '../chunks/astro/server_BshbuMZ6.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_D9XVPDfW.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { G as GoogleLoginButton } from '../chunks/GoogleLoginButton_Bd9Vovzl.mjs';
export { renderers } from '../renderers.mjs';

function RegisterForm({ redirectTo = "/dashboard" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password, confirmPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error?.message || "Wystąpił błąd podczas rejestracji");
        setLoading(false);
        return;
      }
      setSuccess(true);
      if (data.needsEmailConfirmation) {
        setNeedsConfirmation(true);
      } else {
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 1500);
      }
    } catch {
      setError("Wystąpił błąd podczas rejestracji");
      setLoading(false);
    }
  };
  if (success && needsConfirmation) {
    return /* @__PURE__ */ jsxs("div", { className: "p-6 bg-green-50 border border-green-200 rounded-lg", "data-testid": "email-confirmation-message", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-green-900 mb-2", children: "Sprawdź swoją skrzynkę email" }),
      /* @__PURE__ */ jsxs("p", { className: "text-green-700", children: [
        "Wysłaliśmy link aktywacyjny na adres ",
        /* @__PURE__ */ jsx("strong", { children: email }),
        ". Kliknij w link, aby aktywować konto."
      ] })
    ] });
  }
  if (success) {
    return /* @__PURE__ */ jsxs("div", { className: "p-6 bg-green-50 border border-green-200 rounded-lg text-center", "data-testid": "success-message", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-green-900 mb-2", children: "Konto utworzone!" }),
      /* @__PURE__ */ jsx("p", { className: "text-green-700", children: "Przekierowujemy Cię do aplikacji..." })
    ] });
  }
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
          minLength: 6,
          value: password,
          onChange: (e) => setPassword(e.target.value),
          className: "w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          placeholder: "••••••••",
          disabled: loading
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-neutral-500", children: "Minimum 6 znaków" })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "confirmPassword", className: "block text-sm font-medium text-neutral-700 mb-2", children: "Potwierdź hasło" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "confirmPassword",
          name: "confirmPassword",
          type: "password",
          required: true,
          minLength: 6,
          value: confirmPassword,
          onChange: (e) => setConfirmPassword(e.target.value),
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
        children: loading ? "Tworzenie konta..." : "Utwórz konto"
      }
    )
  ] });
}

const $$Astro = createAstro();
const $$Register = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Register;
  const supabase = Astro2.locals.supabase;
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const redirectTo = Astro2.url.searchParams.get("redirect") || "/dashboard";
  if (user) {
    return Astro2.redirect(redirectTo);
  }
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Zarejestruj si\u0119 | KidsQuest", "description": "Utw\xF3rz darmowe konto KidsQuest" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4"> <div class="max-w-md mx-auto"> <!-- Logo/Header --> <div class="text-center mb-8"> <a href="/" class="text-3xl font-bold text-blue-600 inline-block mb-4"> KidsQuest </a> <h1 class="text-2xl font-bold text-neutral-900 mb-2">Utwórz konto</h1> <p class="text-neutral-600">Zacznij tworzyć zabawy dla swoich dzieci już dziś!</p> </div> <!-- Register Form Card --> <div class="bg-white rounded-2xl shadow-lg p-8 mb-6"> <!-- Google Login --> ${renderComponent($$result2, "GoogleLoginButton", GoogleLoginButton, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/components/auth/GoogleLoginButton", "client:component-export": "GoogleLoginButton" })} <!-- Divider --> <div class="relative my-6"> <div class="absolute inset-0 flex items-center"> <div class="w-full border-t border-neutral-300"></div> </div> <div class="relative flex justify-center text-sm"> <span class="px-2 bg-white text-neutral-500">lub</span> </div> </div> <!-- Email Registration --> ${renderComponent($$result2, "RegisterForm", RegisterForm, { "client:load": true, "redirectTo": redirectTo, "client:component-hydration": "load", "client:component-path": "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/components/auth/RegisterForm", "client:component-export": "RegisterForm" })} </div> <!-- Login Link --> <div class="text-center"> <p class="text-neutral-600">
Masz już konto?${" "} <a${addAttribute(`/login?redirect=${redirectTo}`, "href")} class="text-blue-600 font-semibold hover:underline">
Zaloguj się
</a> </p> </div> <!-- Back to Home --> <div class="text-center mt-8"> <a href="/" class="text-neutral-500 hover:text-neutral-700 text-sm"> ← Wróć do strony głównej </a> </div> </div> </div> ` })}`;
}, "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/register.astro", void 0);

const $$file = "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/register.astro";
const $$url = "/register";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Register,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
