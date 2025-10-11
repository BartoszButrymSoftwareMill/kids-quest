Jesteś doświadczonym menedżerem produktu, którego zadaniem jest stworzenie kompleksowego dokumentu wymagań produktu (PRD) w oparciu o poniższe opisy:

<project_description>

# Aplikacja - KidsQuest (MVP)

## Główny problem

Rodzice/opiekunowie często nie mają pod ręką szybkich, kreatywnych scenariuszy zabaw dopasowanych do wieku dziecka, czasu, miejsca i dostępnych „rekwizytów” (klocki drewniane, rysowanie, kartka+ołówek, opowiadania, zagadki, samochodziki, bez rekwizytów). Skutkuje to nudą lub bezcelowym scrollowaniem pomysłów.

## Najmniejszy zestaw funkcjonalności

- Generowanie prostych, 3-etapowych „questów” przez AI na podstawie wieku dziecka, czasu zabawy, miejsca (dom/dwór), poziomu energii i dostępnych form (klocki, rysowanie, kartka + ołówek, storytelling, zagadki, samochodziki, bez rekwizytów).
- Manualne tworzenie questów.
- Przeglądanie, edycja i usuwanie zapisanych questów w jednej, prostej liście.
- Prosty system kont użytkowników do przechowywania własnych questów.
- Krótki „hak” fabularny oraz wariant łatwiejszy/trudniejszy do każdego questu (w ramach treści wygenerowanej przez AI).

## Co NIE wchodzi w zakres MVP

- Współdzielenie questów/linki publiczne i biblioteki społeczności.
- Profile wielu dzieci, kalendarze, przypomnienia, powiadomienia.
- System punktów, poziomów, odznak i inna gamifikacja.
- Aplikacje natywne (na start tylko web).
- Wielojęzyczność (PL-only).
- Generowanie ilustracji/obrazków do questów.
- Zaawansowana analityka poza prostymi eventami lokalnymi.

## Kryteria sukcesu

- 75% questów wygenerowanych przez AI jest akceptowane przez użytkownika
- Użytkownicy tworzą 75% questów z wykorzystaniem AI
  </project_description>

<project_details>

<conversation_summary>
<decisions>

1. Definicja „akceptacji” questa i aksjologia akcji: wprowadzamy jawne przyciski „Akceptuję i zaczynam”, „Zapisz na później”, „Pomiń”, „Ukończono”. Metryka sukcesu = odsetek wygenerowanych questów, które przeszły przez „Akceptuję i zaczynam”.
2. Widełki wieku na start: 3–4, 5–6, 7–8, 8–9, 10 lat.
3. Polityka bezpieczeństwa treści:

   - Hard-ban: przemoc/obrażenia, broń/narzędzia, treści wrażliwe (seksualność, wulgaryzmy, upokorzenia, samookalecz., używki, hazard, kradzież), dyskryminacja/stereotypy, horror/realistyczna groza, proszenie o dane osobowe/komercja.
   - Soft-ban → bezpieczne formy: antagoniści=„psotnik”, potwory „sympatyczne”, „bronio-podobne” rekwizyty wyłącznie udawane (papier/pianka) z adnotacją „udajemy”.
   - Język i styl: krótko, jasno, 3 kroki, 1 hak, wariant łatwiej/trudniej; czasowniki bez przemocy; współpraca>rywalizacja.
   - Reguły bezpieczeństwa fizycznego: wolne tempo, mała przestrzeń, brak biegania, brak małych elementów <4 r.ż., ostre narzędzia tylko z dorosłym; „na dworze” tylko bezpieczne miejsca; zero wspinania/skakania z wysokości/zasłaniania twarzy na długo.
   - Poziom konfliktu vs wiek: 3–4 brak „złoczyńców”; 5–6 lekki konflikt (psotnik); 7–8 misje z bezstykową rywalizacją.
   - Słownik bezpiecznych zamienników (np. „zabij” → „pokonaj sprytem”, „pościg” → „cichy trop”, itp.).

4. Formularz generowania: parametry wejściowe = czas, miejsce, poziom energii, rekwizyty. Domyślne: 30 min, dom, średnia energia; szybkie presety (np. „5 min bez rekwizytów”).
5. Styl i poziom języka questów: tylko PL; krótkie zdania; 3 kroki; 1 hak fabularny + wariant łatwiej/trudniej.
6. Brak możliwości regeneracji/edycji/miksowania przez użytkownika w MVP.
7. Przeglądanie listy: sortowanie (Ostatnie / Ulubione), filtry (wiek, czas, miejsce, rekwizyty), możliwość przypięcia do Ulubionych.
8. Pomiar „75% questów tworzonych z AI”: eventy quest_generated, quest_saved, quest_started, quest_completed, quest_created_manual; udział AI raportowany wśród rozpoczętych lub zapisanych (do wyboru).
9. Czas oczekiwania i plan awaryjny: brak limitu; w razie błędu wyświetlamy komunikat „wystąpił błąd, spróbuj później”.
10. Konta: email+hasło oraz logowanie Google. Brak trybu bez konta. Nie przechowujemy danych o dziecku; email wyłącznie do logowania i wyświetlenia listy questów użytkownika.
11. Harmonogram i zasoby: 1 osoba + wsparcie AI; termin 3 tygodnie; zakres prosty i szybki.

</decisions>

<matched_recommendations>

1. Jawne stany/akcje w lejku (akceptacja, zapis, pominięcie, ukończenie) → odzwierciedlone przyciskami i metryką „Start Rate”.
2. Bezpieczeństwo treści oparte na polityce „hard-ban / soft-ban + zamienniki” → przyjęte w całości, wraz z regułami fizycznego bezpieczeństwa.
3. Uproszczony formularz z sensownymi defaultami + szybkie presety → przyjęte.
4. Konwencja copy: PL-only, krótkie zdania, szablon 3-krokowy z hakiem i dwiema trudnościami → przyjęte.
5. Ograniczenie zakresu MVP (brak edycji/regeneracji przez użytkownika) → przyjęte dla szybkości implementacji.
6. Minimalny katalog: sort + filtry + Ulubione → przyjęte.
7. Telemetria zdarzeń i jasny mianownik dla wskaźnika 75% AI → eventy zdefiniowane; wybór mianownika do domknięcia.
8. Prosty system kont z minimalnym przechowywaniem danych i prywatnością dziecka → przyjęte.
9. Strategia błędów: komunikat „spróbuj później” bez limitu czasu → przyjęte.
10. Time-box: 3 tygodnie, 1 os. → przyjęte jako constraint projektowy.

</matched_recommendations>

<prd_planning_summary>

a. Główne wymagania funkcjonalne

- Generowanie questów:
  - Formularz: wiek (z ustalonych widełek), czas, miejsce (dom/dwór bezpieczny), energia, rekwizyty.
  - Domyślne wartości + szybkie presety.
  - Silnik treści respektuje politykę bezpieczeństwa (hard/soft-ban, zamienniki, reguły fizyczne, konflikt vs wiek) i szablon językowy (PL, 3 kroki, hak, warianty).
- Lejek akcji użytkownika:
  - Przyciski: „Akceptuję i zaczynam”, „Zapisz na później”, „Pomiń”, „Ukończono”.
  - Ustalona metryka sukcesu: % wygenerowanych → „Akceptuję i zaczynam”.
- Katalog/zarządzanie:
  - Sort: Ostatnie / Ulubione.
  - Filtry: wiek, czas, miejsce, rekwizyty.
  - „Przypnij do ulubionych”.
- Konta i prywatność:
  - Email+hasło i Google Login. Brak guest mode.
  - Brak danych o dziecku; email służy wyłącznie do autoryzacji i wyświetlenia listy questów użytkownika.
- Telemetria i raportowanie:
  - Eventy: quest_generated, quest_saved, quest_started, quest_completed, quest_created_manual.
  - Raporty: Start Rate (główna metryka), udział AI wśród rozpoczętych/zapisanych, Completion Rate, Error Rate.
- Obsługa błędów:
  - Brak SLA czasu generacji; komunikat „wystąpił błąd, spróbuj później”.
- UX treści:
  - Każdy quest = 3 kroki + hak + wariant łatwiej/trudniej + adnotacje bezpieczeństwa.
  - Język neutralny, bez przemocy, kooperacyjny.

b. Kluczowe historie użytkownika i ścieżki

1. „Jako rodzic chcę szybko wygenerować bezpieczny quest dla dziecka w wieku 5–6, na 30 min, w domu, bez rekwizytów, by mieć gotową zabawę”

- Wejście: preset „30 min bez rekwizytów” lub defaulty.
- Wyjście: quest 3-krokowy z hakiem i dwiema trudnościami; przyciski akcji.
- Kryterium: klik „Akceptuję i zaczynam” rejestruje quest_started.

2. „Jako użytkownik chcę zapisać ciekawy quest na później”

   - Akcja: „Zapisz na później”; pojawia się w Ostatnich i Ulubionych (jeśli przypięty).

3. „Jako użytkownik chcę znaleźć questy dopasowane do wieku i warunków”

   - Filtr: wiek, czas, miejsce, rekwizyty; sort wg Ostatnie.

4. „Jako użytkownik chcę oznaczyć quest jako ukończony”

   - Akcja: „Ukończono” → quest_completed (do metryk).

5. „Jako użytkownik chcę zalogować się e-mailem lub kontem Google i zobaczyć swoją listę questów”

   - Akceptacja: brak trybu gościa; po zalogowaniu widok katalogu z moimi pozycjami.

6. „Jako użytkownik chcę pominąć nietrafiony quest i szybko wygenerować nowy”

   - Akcja: „Pomiń” + ewentualny skrót do ponownego generowania z tymi samymi parametrami.

c. Kryteria sukcesu i pomiar

- Główna metryka: Start Rate = % wygenerowanych questów, które przeszły przez „Akceptuję i zaczynam”.
- Cel 75% AI w tworzeniu: udział AI wśród questów rozpoczętych (lub zapisanych) — mianownik do wyboru i ujednolicenia.
- Dodatkowe: Completion Rate, Favorite Rate, Preset Adoption (% preset_used), Error Rate (błędy generacji), czas do pierwszego startu (od logowania do pierwszego „Akceptuję i zaczynam”).
- Zgodność z polityką bezpieczeństwa: 0 incydentów hard-ban w treści.

d. Nierozwiązane kwestie / do doprecyzowania w implementacji

- Synchronizacja a konta: brak chmury vs. „pokazywanie listy utworzonych questów” po zalogowaniu — czy lista ma być per-urządzenie (lokalna), czy minimalna chmura tylko do metadanych? (obecnie sprzeczność).
- Mianownik dla wskaźnika 75% AI: „rozpoczęte” czy „zapisane” — wskazać jeden wiążący.
- Zakres telemetrii vs. „nie przechowujemy danych”: potwierdzić, że gromadzone eventy są zanonimizowane (bez danych dziecka) i zgodne z polityką prywatności.
- Granice widełek wiekowych: nakładające się zakresy 7–8 i 8–9 — reguły przypisania wieku „8 lat” do jednej grupy lub obu.
- UX „Ukończono”: czy po ukończeniu pokazujemy feedback/gamifikację (naklejka, pochwała) — obecnie brak.
- Tolerancja błędów i komunikaty: czy przewidzieć przycisk „Spróbuj ponownie”/fallback do presetu offline?
- Dostępność/tryb głośnego czytania (TTS) i piktogramy dla początkujących czytelników — poza MVP czy w MVP?

</prd_planning_summary>

<unresolved_issues>

1. Brak chmury vs. lista questów po logowaniu — doprecyzować model przechowywania (lokalnie per urządzenie? minimalna chmura tylko na metadane?).
2. Wybrać jeden mianownik dla wskaźnika 75% AI (rozpoczęte _albo_ zapisane).
3. Ustalić politykę i technikę anonimizacji telemetrii (zgodność z prywatnością dziecka).
4. Jednoznacznie przypisać wiek „8 lat” (do 7–8 czy 8–9) i określić reguły brzegowe.
5. Zdecydować o feedbacku po „Ukończono” (np. lekka gamifikacja) — w MVP czy później.
6. Określić zachowanie przy błędzie (tylko komunikat czy także „Spróbuj ponownie”/preset awaryjny).
7. Czy TTS/piktogramy są w MVP, czy w roadmapie po MVP.

</unresolved_issues>
</conversation_summary>

</project_details>

Wykonaj następujące kroki, aby stworzyć kompleksowy i dobrze zorganizowany dokument:

1. Podziel PRD na następujące sekcje:
   a. Przegląd projektu
   b. Problem użytkownika
   c. Wymagania funkcjonalne
   d. Granice projektu
   e. Historie użytkownika
   f. Metryki sukcesu

2. W każdej sekcji należy podać szczegółowe i istotne informacje w oparciu o opis projektu i odpowiedzi na pytania wyjaśniające. Upewnij się, że:

   - Używasz jasnego i zwięzłego języka
   - W razie potrzeby podajesz konkretne szczegóły i dane
   - Zachowujesz spójność w całym dokumencie
   - Odnosisz się do wszystkich punktów wymienionych w każdej sekcji

3. Podczas tworzenia historyjek użytkownika i kryteriów akceptacji
   - Wymień WSZYSTKIE niezbędne historyjki użytkownika, w tym scenariusze podstawowe, alternatywne i skrajne.
   - Przypisz unikalny identyfikator wymagań (np. US-001) do każdej historyjki użytkownika w celu bezpośredniej identyfikowalności.
   - Uwzględnij co najmniej jedną historię użytkownika specjalnie dla bezpiecznego dostępu lub uwierzytelniania, jeśli aplikacja wymaga identyfikacji użytkownika lub ograniczeń dostępu.
   - Upewnij się, że żadna potencjalna interakcja użytkownika nie została pominięta.
   - Upewnij się, że każda historia użytkownika jest testowalna.

Użyj następującej struktury dla każdej historii użytkownika:

- ID
- Tytuł
- Opis
- Kryteria akceptacji

4. Po ukończeniu PRD przejrzyj go pod kątem tej listy kontrolnej:

   - Czy każdą historię użytkownika można przetestować?
   - Czy kryteria akceptacji są jasne i konkretne?
   - Czy mamy wystarczająco dużo historyjek użytkownika, aby zbudować w pełni funkcjonalną aplikację?
   - Czy uwzględniliśmy wymagania dotyczące uwierzytelniania i autoryzacji (jeśli dotyczy)?

5. Formatowanie PRD:
   - Zachowaj spójne formatowanie i numerację.
   - Nie używaj pogrubionego formatowania w markdown ( \*\* ).
   - Wymień WSZYSTKIE historyjki użytkownika.
   - Sformatuj PRD w poprawnym markdown.

Przygotuj PRD z następującą strukturą:

```markdown
# Dokument wymagań produktu (PRD) - KidsQuest

## 1. Przegląd produktu

## 2. Problem użytkownika

## 3. Wymagania funkcjonalne

## 4. Granice produktu

## 5. Historyjki użytkowników

## 6. Metryki sukcesu
```

Pamiętaj, aby wypełnić każdą sekcję szczegółowymi, istotnymi informacjami w oparciu o opis projektu i nasze pytania wyjaśniające. Upewnij się, że PRD jest wyczerpujący, jasny i zawiera wszystkie istotne informacje potrzebne do dalszej pracy nad produktem.

Ostateczny wynik powinien składać się wyłącznie z PRD zgodnego ze wskazanym formatem w markdown, który zapiszesz w pliku .ai/prd.md
