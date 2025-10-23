import { d as createComponent, e as createAstro, j as renderComponent, k as renderScript, r as renderTemplate, m as maybeRenderHead, g as addAttribute } from '../../../chunks/astro/server_BshbuMZ6.mjs';
import 'kleur/colors';
import { $ as $$DashboardLayout } from '../../../chunks/DashboardLayout_DH7-M8AE.mjs';
import { A as AppError } from '../../../chunks/errors_ClCkzvSe.mjs';
export { renderers } from '../../../renderers.mjs';

const $$Astro = createAstro();
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  if (!id) {
    throw new AppError(400, "invalid_id", "Quest ID is required");
  }
  let quest = null;
  let error = null;
  try {
    const questRes = await fetch(`${Astro2.url.origin}/api/quests/${id}`, {
      headers: { Cookie: Astro2.request.headers.get("Cookie") || "" }
    });
    if (!questRes.ok) {
      const errorData = await questRes.json().catch(() => ({}));
      if (questRes.status === 404) {
        error = "Quest nie zosta\u0142 znaleziony";
      } else if (questRes.status === 403) {
        error = "Nie masz dost\u0119pu do tego questa";
      } else {
        error = errorData.message || "Nie uda\u0142o si\u0119 pobra\u0107 questa";
      }
    } else {
      quest = await questRes.json();
    }
  } catch (err) {
    console.error("Error fetching quest:", err);
    error = "Wyst\u0105pi\u0142 b\u0142\u0105d podczas pobierania questa";
  }
  if (error || !quest) {
    return Astro2.redirect("/dashboard?error=" + encodeURIComponent(error || "Unknown error"));
  }
  function getStatusLabel(status) {
    switch (status) {
      case "saved":
        return "Zapisany";
      case "started":
        return "W trakcie";
      case "completed":
        return "Uko\u0144czony";
      default:
        return status;
    }
  }
  function getStatusColor(status) {
    switch (status) {
      case "saved":
        return "bg-blue-100 text-blue-700";
      case "started":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  }
  function getLocationLabel(location) {
    switch (location) {
      case "home":
        return "Dom";
      case "outside":
        return "Na zewn\u0105trz";
      default:
        return location;
    }
  }
  function getEnergyLevelLabel(level) {
    switch (level) {
      case "low":
        return "Niska energia";
      case "medium":
        return "\u015Arednia energia";
      case "high":
        return "Wysoka energia";
      default:
        return level;
    }
  }
  return renderTemplate`${renderComponent($$result, "DashboardLayout", $$DashboardLayout, { "title": `${quest.title} | KidsQuest`, "description": quest.hook }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="container mx-auto px-4"> <div class="max-w-4xl mx-auto"> <!-- Back Button --> <div class="mb-6"> <a href="/dashboard" class="inline-flex items-center text-neutral-600 hover:text-neutral-900 transition-colors"> <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path> </svg>
Wróć do listy questów
</a> </div> <!-- Quest Header --> <div class="bg-white rounded-lg shadow-md p-8 mb-6"> <div class="flex items-start justify-between mb-4"> <h1 class="text-3xl font-bold text-neutral-900" data-testid="quest-title">${quest.title}</h1> <button id="favorite-btn"${addAttribute(quest.id, "data-quest-id")}${addAttribute(quest.is_favorite, "data-is-favorite")} data-testid="favorite-button"${addAttribute(quest.is_favorite, "data-favorited")} class="text-2xl transition-transform hover:scale-110"${addAttribute(quest.is_favorite ? "Usu\u0144 z ulubionych" : "Dodaj do ulubionych", "aria-label")}> ${quest.is_favorite ? "\u2764\uFE0F" : "\u{1F90D}"} </button> </div> <!-- Meta Information --> <div class="flex flex-wrap gap-2 mb-6"> <span${addAttribute(`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quest.status)}`, "class")} data-testid="quest-status"> ${getStatusLabel(quest.status)} </span> <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"> ${quest.age_group.label} </span> <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium" data-testid="quest-location"> ${getLocationLabel(quest.location)} </span> <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium" data-testid="quest-duration"> ${quest.duration_minutes} minut
</span> <span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium" data-testid="quest-energy"> ${getEnergyLevelLabel(quest.energy_level)} </span> </div> <!-- Hook --> <div class="mb-6" data-testid="quest-hook"> <h2 class="text-xl font-semibold text-neutral-900 mb-3">✨ Wprowadzenie</h2> <p class="text-neutral-700 text-lg leading-relaxed">${quest.hook}</p> </div> </div> <!-- Steps --> <div class="bg-white rounded-lg shadow-md p-8 mb-6"> <h2 class="text-2xl font-bold text-neutral-900 mb-6">Kroki</h2> <div class="space-y-6"> <!-- Step 1 --> <div class="flex gap-4" data-testid="quest-step1"> <div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
1
</div> <div class="flex-1"> <p class="text-neutral-700 leading-relaxed">${quest.step1}</p> </div> </div> <!-- Step 2 --> <div class="flex gap-4" data-testid="quest-step2"> <div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
2
</div> <div class="flex-1"> <p class="text-neutral-700 leading-relaxed">${quest.step2}</p> </div> </div> <!-- Step 3 --> <div class="flex gap-4" data-testid="quest-step3"> <div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
3
</div> <div class="flex-1"> <p class="text-neutral-700 leading-relaxed">${quest.step3}</p> </div> </div> </div> </div> <!-- Props --> ${quest.props && quest.props.length > 0 && renderTemplate`<div class="bg-white rounded-lg shadow-md p-8 mb-6"> <h2 class="text-2xl font-bold text-neutral-900 mb-4">Potrzebne rekwizyty</h2> <div class="flex flex-wrap gap-2"> ${quest.props.map((prop) => renderTemplate`<span class="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm font-medium"> ${prop.label} </span>`)} </div> </div>`} <!-- Variations --> ${(quest.easier_version || quest.harder_version) && renderTemplate`<div class="bg-white rounded-lg shadow-md p-8 mb-6"> <h2 class="text-2xl font-bold text-neutral-900 mb-6">Warianty</h2> ${quest.easier_version && renderTemplate`<div class="mb-6 pb-6 border-b border-neutral-200 last:border-0 last:pb-0" data-testid="easier-version"> <h3 class="text-lg font-semibold text-green-700 mb-3">🟢 Łatwiejsza wersja</h3> <p class="text-neutral-700 leading-relaxed">${quest.easier_version}</p> </div>`} ${quest.harder_version && renderTemplate`<div class="mb-0" data-testid="harder-version"> <h3 class="text-lg font-semibold text-red-700 mb-3">🔴 Trudniejsza wersja</h3> <p class="text-neutral-700 leading-relaxed">${quest.harder_version}</p> </div>`} </div>`} <!-- Safety Notes --> ${quest.safety_notes && renderTemplate`<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6"> <h2 class="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2"> <span>⚠️</span> <span>Uwagi dotyczące bezpieczeństwa</span> </h2> <p class="text-yellow-800 leading-relaxed">${quest.safety_notes}</p> </div>`} <!-- Actions --> <div class="bg-white rounded-lg shadow-md p-8"> <div class="flex flex-col sm:flex-row gap-4"> ${quest.status === "saved" && renderTemplate`<button id="start-btn"${addAttribute(quest.id, "data-quest-id")} class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
Rozpocznij quest
</button>`} ${quest.status === "started" && renderTemplate`<button id="complete-btn"${addAttribute(quest.id, "data-quest-id")} class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
Oznacz jako ukończony
</button>`} ${quest.status === "completed" && renderTemplate`<button id="restart-btn"${addAttribute(quest.id, "data-quest-id")} class="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
Rozpocznij ponownie
</button>`} <button id="delete-btn"${addAttribute(quest.id, "data-quest-id")} data-testid="delete-button" class="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">
Usuń quest
</button> </div> </div> </div> </div> ` })} ${renderScript($$result, "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/dashboard/quest/[id].astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/dashboard/quest/[id].astro", void 0);

const $$file = "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/dashboard/quest/[id].astro";
const $$url = "/dashboard/quest/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
