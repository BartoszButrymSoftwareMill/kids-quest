import { g as getAuthUser } from '../../../chunks/auth_BXBtxCV-.mjs';
import { h as handleError } from '../../../chunks/errors_ClCkzvSe.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async ({ locals }) => {
  try {
    const user = await getAuthUser(locals.supabase);
    const response = {
      user: {
        id: user.id,
        email: user.email || "",
        created_at: user.created_at || (/* @__PURE__ */ new Date()).toISOString()
      }
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    const errorResponse = handleError(error);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
