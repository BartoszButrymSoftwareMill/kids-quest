import { d as createComponent, e as createAstro, j as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_BshbuMZ6.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../../chunks/BaseLayout_D9XVPDfW.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
export { renderers } from '../../renderers.mjs';

function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
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
    if (password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password, confirmPassword }),
        credentials: "include"
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error?.message || "Wystąpił błąd podczas zmiany hasła");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch {
      setError("Wystąpił błąd podczas zmiany hasła");
      setLoading(false);
    }
  };
  if (success) {
    return /* @__PURE__ */ jsxs("div", { className: "p-6 bg-green-50 border border-green-200 rounded-lg text-center", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-green-900 mb-2", children: "Hasło zostało zmienione!" }),
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
      /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-neutral-700 mb-2", children: "Nowe hasło" }),
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
      /* @__PURE__ */ jsx("label", { htmlFor: "confirmPassword", className: "block text-sm font-medium text-neutral-700 mb-2", children: "Potwierdź nowe hasło" }),
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
        children: loading ? "Zmiana hasła..." : "Zmień hasło"
      }
    )
  ] });
}

const $$Astro = createAstro();
const $$UpdatePassword = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$UpdatePassword;
  const supabase = Astro2.locals.supabase;
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();
  if (error || !user) {
    return Astro2.redirect("/reset-password?error=invalid_token");
  }
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Ustaw nowe has\u0142o | KidsQuest", "description": "Ustaw nowe has\u0142o do swojego konta KidsQuest" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4"> <div class="max-w-md mx-auto"> <!-- Logo/Header --> <div class="text-center mb-8"> <a href="/" class="text-3xl font-bold text-blue-600 inline-block mb-4"> KidsQuest </a> <h1 class="text-2xl font-bold text-neutral-900 mb-2">Ustaw nowe hasło</h1> <p class="text-neutral-600">Wprowadź nowe hasło do swojego konta.</p> </div> <!-- Update Password Form Card --> <div class="bg-white rounded-2xl shadow-lg p-8 mb-6"> ${renderComponent($$result2, "UpdatePasswordForm", UpdatePasswordForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/components/auth/UpdatePasswordForm", "client:component-export": "UpdatePasswordForm" })} </div> <!-- Security Note --> <div class="bg-blue-50 border border-blue-200 rounded-lg p-4"> <p class="text-sm text-blue-700"> <strong>Wskazówka:</strong> Wybierz silne hasło, które zawiera litery, cyfry i znaki specjalne.
</p> </div> </div> </div> ` })}`;
}, "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/auth/update-password.astro", void 0);

const $$file = "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/auth/update-password.astro";
const $$url = "/auth/update-password";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$UpdatePassword,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
