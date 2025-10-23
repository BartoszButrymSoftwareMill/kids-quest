import { d as createComponent, e as createAstro, j as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_BshbuMZ6.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_D9XVPDfW.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
export { renderers } from '../renderers.mjs';

function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error?.message || "Wystąpił błąd podczas wysyłania linku");
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Wystąpił błąd podczas wysyłania linku");
      setLoading(false);
    }
  };
  if (success) {
    return /* @__PURE__ */ jsxs("div", { className: "p-6 bg-green-50 border border-green-200 rounded-lg", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-green-900 mb-2", children: "Sprawdź swoją skrzynkę email" }),
      /* @__PURE__ */ jsxs("p", { className: "text-green-700 mb-4", children: [
        "Jeśli konto z adresem ",
        /* @__PURE__ */ jsx("strong", { children: email }),
        " istnieje, wysłaliśmy link do resetowania hasła."
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-green-600", children: "Link będzie ważny przez 1 godzinę. Jeśli nie widzisz wiadomości, sprawdź folder spam." })
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
      ),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-neutral-500", children: "Wyślemy link do resetowania hasła na ten adres email" })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "submit",
        disabled: loading,
        className: "w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        children: loading ? "Wysyłanie..." : "Wyślij link resetujący"
      }
    )
  ] });
}

const $$Astro = createAstro();
const $$ResetPassword = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ResetPassword;
  const supabase = Astro2.locals.supabase;
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (user) {
    return Astro2.redirect("/dashboard");
  }
  const errorParam = Astro2.url.searchParams.get("error");
  const errorMessages = {
    invalid_token: "Link resetowania has\u0142a jest nieprawid\u0142owy lub wygas\u0142. Spr\xF3buj ponownie."
  };
  const errorMessage = errorParam ? errorMessages[errorParam] : null;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Resetuj has\u0142o | KidsQuest", "description": "Zresetuj has\u0142o do swojego konta KidsQuest" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4"> <div class="max-w-md mx-auto"> <!-- Logo/Header --> <div class="text-center mb-8"> <a href="/" class="text-3xl font-bold text-blue-600 inline-block mb-4"> KidsQuest </a> <h1 class="text-2xl font-bold text-neutral-900 mb-2">Resetuj hasło</h1> <p class="text-neutral-600">Wyślemy link do resetowania hasła na Twój adres email.</p> </div> <!-- Reset Password Form Card --> <div class="bg-white rounded-2xl shadow-lg p-8 mb-6"> ${errorMessage && renderTemplate`<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">${errorMessage}</div>`} ${renderComponent($$result2, "ResetPasswordForm", ResetPasswordForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/components/auth/ResetPasswordForm", "client:component-export": "ResetPasswordForm" })} </div> <!-- Back to Login --> <div class="text-center"> <p class="text-neutral-600">
Pamiętasz hasło?${" "} <a href="/login" class="text-blue-600 font-semibold hover:underline"> Zaloguj się </a> </p> </div> <!-- Back to Home --> <div class="text-center mt-8"> <a href="/" class="text-neutral-500 hover:text-neutral-700 text-sm"> ← Wróć do strony głównej </a> </div> </div> </div> ` })}`;
}, "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/reset-password.astro", void 0);

const $$file = "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/reset-password.astro";
const $$url = "/reset-password";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$ResetPassword,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
