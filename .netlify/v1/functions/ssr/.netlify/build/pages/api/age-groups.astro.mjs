import { h as handleError } from '../../chunks/errors_ClCkzvSe.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ locals }) => {
  try {
    const { data: ageGroups, error } = await locals.supabase.from("age_groups").select("*").order("id");
    if (error) {
      throw error;
    }
    const formatted = ageGroups.map((ag) => {
      const spanStr = ag.span;
      const match = spanStr.match(/\[(\d+),(\d+)\)/);
      let min_age;
      let max_age;
      if (match) {
        min_age = parseInt(match[1]);
        max_age = parseInt(match[2]) - 1;
      }
      return {
        id: ag.id,
        code: ag.code,
        label: ag.label,
        min_age,
        max_age
      };
    });
    return new Response(JSON.stringify({ age_groups: formatted }), {
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
