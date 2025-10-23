import { d as createComponent, e as createAstro, j as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_BshbuMZ6.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_D9XVPDfW.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const supabase = Astro2.locals.supabase;
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (user) {
    return Astro2.redirect("/dashboard");
  }
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "KidsQuest - Tw\xF3rz i odkrywaj zabawy dla dzieci", "description": "Generuj bezpieczne, kr\xF3tkie scenariusze aktywno\u015Bci dla dzieci w wieku 3-10 lat w kilka sekund" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white"> <!-- Navigation --> <nav class="container mx-auto px-4 py-6"> <div class="flex justify-between items-center"> <div class="text-2xl font-bold text-blue-600">KidsQuest</div> <a href="/login" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
Zaloguj się
</a> </div> </nav> <!-- Hero Section --> <section class="container mx-auto px-4 py-20"> <div class="max-w-4xl mx-auto text-center"> <h1 class="text-5xl md:text-6xl font-bold text-neutral-900 mb-6">
Zabawy dla dzieci<br>w kilka sekund
</h1> <p class="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
Nie wiesz, co robić z dzieckiem? KidsQuest generuje bezpieczne, angażujące scenariusze zabaw dopasowane do
          wieku, czasu i dostępnych rekwizytów.
</p> <div class="flex flex-col sm:flex-row gap-4 justify-center"> <a href="/register" class="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
Wygeneruj pierwszą zabawę
</a> <a href="/login" class="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-neutral-50 transition-colors shadow-lg hover:shadow-xl border-2 border-blue-600">
Mam już konto
</a> </div> </div> </section> <!-- Features Section --> <section class="container mx-auto px-4 py-20 bg-white"> <div class="max-w-6xl mx-auto"> <h2 class="text-3xl font-bold text-center text-neutral-900 mb-12">Jak to działa?</h2> <div class="grid md:grid-cols-3 gap-8"> <!-- Feature 1 --> <div class="text-center p-6"> <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"> <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path> </svg> </div> <h3 class="text-xl font-semibold text-neutral-900 mb-2">1. Wybierz parametry</h3> <p class="text-neutral-600">Wiek dziecka, dostępny czas, miejsce i poziom energii</p> </div> <!-- Feature 2 --> <div class="text-center p-6"> <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"> <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path> </svg> </div> <h3 class="text-xl font-semibold text-neutral-900 mb-2">2. Generuj AI</h3> <p class="text-neutral-600">AI stworzy scenariusz zabawy w kilka sekund</p> </div> <!-- Feature 3 --> <div class="text-center p-6"> <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"> <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> </div> <h3 class="text-xl font-semibold text-neutral-900 mb-2">3. Zacznij zabawę!</h3> <p class="text-neutral-600">Każdy quest zawiera krok po kroku instrukcje</p> </div> </div> </div> </section> <!-- Benefits Section --> <section class="container mx-auto px-4 py-20"> <div class="max-w-6xl mx-auto"> <h2 class="text-3xl font-bold text-center text-neutral-900 mb-12">Dlaczego KidsQuest?</h2> <div class="grid md:grid-cols-2 gap-8"> <div class="flex gap-4"> <div class="flex-shrink-0"> <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"> <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> </div> </div> <div> <h3 class="text-lg font-semibold text-neutral-900 mb-1">Bezpieczeństwo przede wszystkim</h3> <p class="text-neutral-600">
Każdy quest jest sprawdzany pod kątem bezpieczeństwa i odpowiedniości dla wieku
</p> </div> </div> <div class="flex gap-4"> <div class="flex-shrink-0"> <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"> <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> </div> </div> <div> <h3 class="text-lg font-semibold text-neutral-900 mb-1">Oszczędność czasu</h3> <p class="text-neutral-600">Od "nie wiem co robić" do rozpoczęcia zabawy w kilka sekund</p> </div> </div> <div class="flex gap-4"> <div class="flex-shrink-0"> <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"> <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path> </svg> </div> </div> <div> <h3 class="text-lg font-semibold text-neutral-900 mb-1">Spersonalizowane zabawy</h3> <p class="text-neutral-600">Dostosowane do wieku, energii i dostępnych rekwizytów</p> </div> </div> <div class="flex gap-4"> <div class="flex-shrink-0"> <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"> <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path> </svg> </div> </div> <div> <h3 class="text-lg font-semibold text-neutral-900 mb-1">Siła AI</h3> <p class="text-neutral-600">Nieskończone możliwości twórczych zabaw generowanych przez AI</p> </div> </div> </div> </div> </section> <!-- CTA Section --> <section class="container mx-auto px-4 py-20 bg-blue-600 text-white rounded-3xl my-20"> <div class="max-w-3xl mx-auto text-center"> <h2 class="text-4xl font-bold mb-4">Gotowy na przygodę?</h2> <p class="text-xl mb-8 text-blue-100">Dołącz do rodziców, którzy odkryli prostszy sposób na zabawę z dziećmi</p> <a href="/register" class="inline-block px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-xl">
Zacznij za darmo
</a> </div> </section> <!-- Footer --> <footer class="container mx-auto px-4 py-8 text-center text-neutral-600"> <p>&copy; 2025 KidsQuest. Dla dzieci w wieku 3-10 lat.</p> </footer> </div> ` })}`;
}, "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/index.astro", void 0);

const $$file = "/Users/bartoszbutrym/Desktop/workshop/10xDevs/mvp/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
