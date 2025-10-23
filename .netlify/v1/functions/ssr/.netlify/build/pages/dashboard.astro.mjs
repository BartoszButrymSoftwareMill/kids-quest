import { d as createComponent, e as createAstro, j as renderComponent, r as renderTemplate, m as maybeRenderHead, g as addAttribute } from '../chunks/astro/server_BshbuMZ6.mjs';
import 'kleur/colors';
import { $ as $$DashboardLayout } from '../chunks/DashboardLayout_DH7-M8AE.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  let quests = [];
  try {
    const questsRes = await fetch(`${Astro2.url.origin}/api/quests`, {
      headers: { Cookie: Astro2.request.headers.get("Cookie") || "" }
    });
    if (questsRes.ok) {
      const data = await questsRes.json();
      quests = data.quests || [];
    }
  } catch (error) {
    console.error("Error fetching quests:", error);
  }
  return renderTemplate`${renderComponent($$result, "DashboardLayout", $$DashboardLayout, { "title": "Moje questy | KidsQuest", "description": "Przegl\u0105daj swoje zapisane questy" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="container mx-auto px-4"> <div class="max-w-6xl mx-auto"> <div class="mb-8"> <h1 class="text-4xl font-bold text-neutral-900 mb-2">Moje questy</h1> <p class="text-lg text-neutral-600"> ${quests.length > 0 ? `Masz ${quests.length} ${quests.length === 1 ? "zapisany quest" : "zapisane questy"}` : "Nie masz jeszcze \u017Cadnych zapisanych quest\xF3w"} </p> </div> <div data-testid="quests-list"> ${quests.length === 0 ? renderTemplate`<div class="bg-white rounded-lg shadow-md p-12 text-center"> <div class="max-w-md mx-auto"> <svg class="w-24 h-24 text-neutral-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path> </svg> <h2 class="text-2xl font-semibold text-neutral-900 mb-2">Brak zapisanych questów</h2> <p class="text-neutral-600 mb-6">
Wygeneruj swój pierwszy quest i zapisz go, aby móc do niego wrócić później.
</p> <a href="/dashboard/generate" class="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
Wygeneruj pierwszy quest
</a> </div> </div>` : renderTemplate`<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">  ${quests.map((quest) => renderTemplate`<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow" data-testid="quest-card"> <h3 class="text-xl font-semibold text-neutral-900 mb-2">${quest.title}</h3> <p class="text-neutral-600 mb-4 line-clamp-3">${quest.hook}</p> <div class="flex flex-wrap gap-2 mb-4"> <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"> ${quest.age_group.label} </span> <span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"> ${quest.location === "home" ? "Dom" : "Na zewn\u0105trz"} </span> <span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"> ${quest.duration_minutes} min
</span> </div> <a${addAttribute(`/dashboard/quest/${quest.id}`, "href")} class="text-blue-600 hover:underline font-medium">
Zobacz szczegóły →
</a> </div>`)} </div>`} </div> </div> </div> ` })}`;
}, "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/dashboard/index.astro", void 0);

const $$file = "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/dashboard/index.astro";
const $$url = "/dashboard";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
