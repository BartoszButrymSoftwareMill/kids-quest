import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseAnonKey = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (signInError) {
        setError("Nie udało się połączyć z Google. Spróbuj ponownie.");
        setLoading(false);
      }
    } catch {
      setError("Wystąpił błąd podczas logowania przez Google");
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: handleGoogleLogin,
        disabled: loading,
        className: "w-full px-6 py-3 bg-white border-2 border-neutral-300 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3",
        children: [
          /* @__PURE__ */ jsxs("svg", { className: "w-5 h-5", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: [
            /* @__PURE__ */ jsx(
              "path",
              {
                d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z",
                fill: "#4285F4"
              }
            ),
            /* @__PURE__ */ jsx(
              "path",
              {
                d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z",
                fill: "#34A853"
              }
            ),
            /* @__PURE__ */ jsx(
              "path",
              {
                d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z",
                fill: "#FBBC05"
              }
            ),
            /* @__PURE__ */ jsx(
              "path",
              {
                d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z",
                fill: "#EA4335"
              }
            )
          ] }),
          loading ? "Łączenie z Google..." : "Kontynuuj z Google"
        ]
      }
    ),
    error && /* @__PURE__ */ jsx("div", { className: "p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm", children: error })
  ] });
}

export { GoogleLoginButton as G };
