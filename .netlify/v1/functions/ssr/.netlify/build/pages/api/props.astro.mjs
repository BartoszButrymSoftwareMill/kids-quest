import { h as handleError } from '../../chunks/errors_ClCkzvSe.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ locals }) => {
  try {
    const { data: props, error } = await locals.supabase.from("props").select("*").order("id");
    if (error) {
      throw error;
    }
    const formatted = props.map((p) => ({
      id: p.id,
      code: p.code,
      label: p.label
    }));
    return new Response(JSON.stringify({ props: formatted }), {
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
