# Dokument wymagań produktu (PRD) - KidsQuest

## 1. Przegląd produktu

KidsQuest to prosta webowa aplikacja (MVP, PL-only), która w kilka sekund generuje bezpieczne, krótkie scenariusze zabaw („questy”) dopasowane do wieku dziecka, czasu, miejsca (dom/dwór), poziomu energii i dostępnych rekwizytów. Celem jest zmniejszenie tarcia decyzyjnego u rodziców/opiekunów i szybkie przejście od „nie wiem co robić” do rozpoczęcia zabawy. Produkt skupia się na jednym, wąskim przepływie: konfiguracja → generacja → akceptacja i start → zapis/ukończenie → prosta lista.
Założenia i ograniczenia MVP:

- Platforma: web (desktop/mobile), brak aplikacji natywnych.
- Język i treści: język polski; bezpieczne, kooperacyjne, krótkie zdania; format treści: hak + 3 kroki + wariant łatwiej/trudniej + adnotacje bezpieczeństwa.
- Konta: email+hasło oraz Google Login; brak trybu gościa.
- Czas i zasoby: 1 osoba + wsparcie AI, time-box 3 tygodnie.
- Prywatność: nie zbieramy danych o dzieciach; minimalna chmura do przechowywania questów per konto; telemetria zanonimizowana.
- Polityka bezpieczeństwa treści: hard‑ban/soft‑ban, słownik bezpiecznych zamienników, reguły fizycznego bezpieczeństwa, adekwatność konfliktu do wieku.

Cele biznesowe i produktowe (MVP):

- Start Rate ≥ 75%: co najmniej 75% wygenerowanych questów jest akceptowanych przyciskiem „Akceptuję i zaczynam”.
- Udział AI ≥ 75%: co najmniej 75% rozpoczętych questów pochodzi z generatora AI (vs questy manualne).
- Zero incydentów hard‑ban w treściach.

Grupa docelowa: rodzice/opiekunowie dzieci w wieku 3–10 lat; przedziały: 3–4, 5–6, 7–8, 9–10 lat.

## 2. Problem użytkownika

Rodzice/opiekunowie często nie mają pod ręką krótkich, kreatywnych i bezpiecznych pomysłów na zabawę dostosowanych do wieku, kontekstu oraz dostępnych rekwizytów. Skutkiem jest bezczynność lub czasochłonne, bezcelowe scrollowanie pomysłów. Potrzebują narzędzia, które wprost poprowadzi ich od ustawień do gotowego scenariusza, minimalizując ryzyko nieadekwatnych lub niebezpiecznych treści.

## 3. Wymagania funkcjonalne

3.1 Generowanie questów (AI)

- Formularz parametrów: wiek (3–4, 5–6, 7–8, 9–10), czas (domyślnie 30 min), miejsce (dom/dwór – tylko bezpieczne), poziom energii (niska/średnia/wysoka), rekwizyty (klocki, rysowanie, kartka+ołówek, storytelling, zagadki, samochodziki, bez rekwizytów).
- Defaulty i presety: ustawienia domyślne + szybkie presety (np. „5 min bez rekwizytów”, „15 min rysowanie”, „30 min klocki”).
- Silnik treści: zapewnia zgodność z polityką bezpieczeństwa (hard‑ban/soft‑ban, zamienniki, reguły fizyczne, konflikt vs wiek) oraz formatem językowym (PL, hak + 3 kroki + wariant łatwiej/trudniej, krótkie zdania, kooperacja > rywalizacja).
- Struktura outputu: tytuł (opcjonalnie), hak, Kroki 1–3, Wersja łatwiej, Wersja trudniej, Adnotacje bezpieczeństwa, znacznik kategorii (czas, miejsce, rekwizyty, energia, widełki wieku).
- Akcje na wyniku: Akceptuję i zaczynam, Zapisz na później, Pomiń, Ukończono (po rozpoczęciu). Skrót „Wygeneruj ponownie z tymi samymi parametrami” (nowy quest, bez edycji treści).

  3.2 Tworzenie manualne

- Formularz ręczny z polami jak w AI oraz polami treści: hak, kroki 1–3, wariant łatwiej/trudniej, adnotacje bezpieczeństwa.
- Walidacje zgodne z polityką bezpieczeństwa (blokada treści hard‑ban; wskazówki zamienników).

  3.3 Katalog i zarządzanie

- Lista „Moje questy”: Ostatnie (domyślne sortowanie) i Ulubione (przypięcia).
- Filtry: wiek, czas, miejsce, rekwizyty, źródło (AI/manual).
- Sortowanie: Ostatnie / Ulubione (w ramach ulubionych kolejność po dacie przypięcia).
- Detal questa: pełna treść i metadane, akcje: Ulubione on/off, Usuń (tylko własne), Rozpocznij/Ukończono.
- Brak edycji/regeneracji/miksowania treści w MVP (poza stworzeniem nowego questa z tymi samymi parametrami AI).

  3.4 Konta i bezpieczeństwo dostępu

- Rejestracja: email+hasło (wymogi minimalne), alternatywnie Google Login (OAuth).
- Logowanie/wylogowanie; reset hasła via email.
- Sesje: utrzymanie zalogowania; możliwość ręcznego wylogowania.
- Minimalna chmura: questy i ich metadane przechowywane na serwerze per konto (bez danych o dzieciach).

  3.5 Telemetria i raportowanie

- Zdarzenia: quest_generated, quest_started, quest_saved, quest_completed, quest_created_manual, auth_signup, auth_login, preset_used, favorite_toggled, delete_quest, error_generation.
- Atrybuty eventów: zanonimizowane ID użytkownika, parametry (wiek-bracket, czas, miejsce, energia, rekwizyty, źródło AI/manual), timestamp, wersja aplikacji.
- Raporty w aplikacji admin/dev (prosty podgląd) lub eksport logów: Start Rate, AI Share, Completion Rate, Favorite Rate, Preset Adoption, Error Rate, Time-to-First-Start.

  3.6 Obsługa błędów i stany brzegowe

- Błąd generacji: komunikat „Wystąpił błąd, spróbuj później” + możliwość powrotu do formularza lub ponownego wywołania z tymi samymi parametrami.
- Brak internetu/timeout: komunikat i powrót do formularza (bez utraty danych).
- Puste stany: jasne komunikaty (np. brak zapisanych questów), CTA do generacji/presetu.
- Granice wieku: „8 lat” przypisane do grupy 7–8 (MVP) i komunikat podpowiedzi na formularzu.

  3.7 Polityka bezpieczeństwa treści (wyciąg do implementacji)

- Hard‑ban: przemoc i obrażenia, broń/narzędzia, treści wrażliwe (seks/wulgaryzmy/upokorzenia/samookaleczenia/używki/hazard/kradzież), dyskryminacja/stereotypy, horror/realistyczna groza, proszenie o dane osobowe/komercja.
- Soft‑ban: antagoniści tylko jako „psotnik”; potwory wyłącznie „sympatyczne”; „bronio‑podobne” tylko udawane (papier/pianka) z adnotacją „udajemy”.
- Język i styl: krótko; 3 kroki; 1 hak; wariant łatwiej/trudniej; czasowniki neutralne; kooperacja > rywalizacja.
- Reguły bezpieczeństwa fizycznego: wolne tempo, mała przestrzeń, brak biegania; brak małych elementów <4 r.ż.; ostre narzędzia tylko z dorosłym; „na dworze” wyłącznie bezpieczne miejsca; zero wspinania/skakania z wysokości; nie zasłaniać twarzy na długo.
- Konflikt vs wiek: 3–4 brak złoczyńców; 5–6 lekki konflikt (psotnik); 7–8 misje z bezstykową rywalizacją.

  3.8 Wymagania niefunkcjonalne

- Wydajność: responsywne UI, pierwsza generacja questa zwykle do kilkunastu sekund (brak twardego SLA w MVP).
- Dostępność: czytelny język; brak TTS/piktogramów w MVP (na roadmapie).
- Zgodność prawna i prywatność: brak danych o dziecku; minimalny profil użytkownika (email); logi i telemetria zanonimizowane.
- Bezpieczeństwo: szyfrowanie danych w tranzycie; podstawowe ograniczenia prób logowania (np. throttling).
- Skalowalność: architektura gotowa na dalsze rozszerzenia (profile dzieci, współdzielenie, powiadomienia) po MVP.

## 4. Granice produktu

W zakresie MVP:

- Generowanie questów AI na podstawie parametrów (wiek, czas, miejsce, energia, rekwizyty).
- Tworzenie manualne questów.
- Lista, filtry, sortowanie, ulubione; usuwanie własnych questów.
- Akcje: Akceptuję i zaczynam, Zapisz na później, Pomiń, Ukończono; skrót „Wygeneruj ponownie z tymi samymi parametrami”.
- Konta: email+hasło, Google Login; brak trybu gościa.
- Telemetria podstawowa i prosta obsługa błędów.

Poza zakresem MVP (explicit out-of-scope):

- Współdzielenie/publiczne linki i biblioteki społeczności.
- Profile wielu dzieci, kalendarze, przypomnienia, powiadomienia.
- System punktów/poziomów/odznak (gamifikacja).
- Aplikacje natywne (iOS/Android).
- Wielojęzyczność (tylko PL).
- Generowanie ilustracji do questów.
- Zaawansowana analityka i panele BI.
- Edycja treści questów i regeneracja wariantów (poza wygenerowaniem nowego questa z tymi samymi parametrami).
- TTS/piktogramy (na roadmapie).

## 5. Historyjki użytkowników

US-001
Tytuł: Rejestracja e‑mailem
Opis: Jako nowy użytkownik chcę założyć konto przy użyciu e‑maila i hasła, aby móc zapisywać i przeglądać moje questy.
Kryteria akceptacji:

- Formularz rejestracji z walidacją e‑mail i minimalnymi wymaganiami hasła.
- Po sukcesie automatyczne zalogowanie lub przekierowanie do logowania.
- Zdarzenie auth_signup zapisane w telemetrii.

US-002
Tytuł: Logowanie e‑mail/hasło
Opis: Jako użytkownik chcę zalogować się e‑mailem i hasłem, aby uzyskać dostęp do moich questów.
Kryteria akceptacji:

- Poprawne dane logują i pokazują listę „Moje questy”.
- Błędne dane zwracają jasny komunikat bez ujawniania, które pole jest niepoprawne.
- Zdarzenie auth_login zapisane w telemetrii.

US-003
Tytuł: Logowanie Google
Opis: Jako użytkownik chcę zalogować się z Google, aby szybko uzyskać dostęp do moich questów bez tworzenia hasła.
Kryteria akceptacji:

- OAuth Google działa poprawnie i łączy konto z profilem użytkownika.
- Po sukcesie widzę listę „Moje questy”.
- Zdarzenie auth_login zapisane w telemetrii.

US-004
Tytuł: Wylogowanie
Opis: Jako użytkownik chcę się wylogować, aby zakończyć sesję na współdzielonym urządzeniu.
Kryteria akceptacji:

- Po kliknięciu „Wyloguj” sesja jest unieważniona.
- Użytkownik wraca do ekranu logowania.

US-005
Tytuł: Reset hasła
Opis: Jako użytkownik chcę zresetować hasło przez e‑mail, aby odzyskać dostęp do konta.
Kryteria akceptacji:

- Formularz „Zapomniałem hasła” wysyła link resetu na podany e‑mail, jeśli istnieje.
- Po zmianie hasła mogę się zalogować nowymi danymi.

US-006
Tytuł: Generacja questa z domyślnymi ustawieniami
Opis: Jako rodzic chcę użyć domyślnych parametrów (30 min, dom, średnia energia), aby szybko wygenerować quest.
Kryteria akceptacji:

- Kliknięcie „Generuj” przy domyślnych ustawieniach zwraca quest z hakiem, 3 krokami, wariantem łatwiej/trudniej i adnotacjami bezpieczeństwa.
- Zdarzenie quest_generated zapisane w telemetrii z parametrami.

US-007
Tytuł: Generacja questa z presetów
Opis: Jako rodzic chcę wybrać preset (np. „5 min bez rekwizytów”), aby natychmiast wygenerować quest.
Kryteria akceptacji:

- Wybranie presetu uzupełnia formularz i generuje quest bez dodatkowych kroków.
- Zdarzenie preset_used i quest_generated zapisane w telemetrii.

US-008
Tytuł: Wyświetlenie treści questa
Opis: Jako rodzic chcę zobaczyć quest w jednolitym formacie, aby łatwo go poprowadzić.
Kryteria akceptacji:

- Widok zawiera hak, Kroki 1–3, Wersję łatwiej, Wersję trudniej, Adnotacje bezpieczeństwa, metadane (wiek, czas, miejsce, energia, rekwizyty, źródło).
- Treść spełnia politykę bezpieczeństwa.

US-009
Tytuł: Akceptuję i zaczynam
Opis: Jako rodzic chcę jednym kliknięciem zaakceptować i rozpocząć quest.
Kryteria akceptacji:

- Kliknięcie „Akceptuję i zaczynam” zapisuje quest do „Moich questów” (jeśli nie zapisany) i rejestruje quest_started.
- Start Rate obliczany jako quest_started/quest_generated na poziomie konta i globalnie.

US-010
Tytuł: Zapisz na później
Opis: Jako użytkownik chcę zapisać quest bez rozpoczynania, aby wrócić do niego później.
Kryteria akceptacji:

- Quest pojawia się na liście Ostatnie i może być przypięty do Ulubionych.
- Zdarzenie quest_saved zapisane w telemetrii.

US-011
Tytuł: Pomiń
Opis: Jako użytkownik chcę pominąć nietrafiony quest i szybko wygenerować inny.
Kryteria akceptacji:

- Kliknięcie „Pomiń” nie zapisuje questa; wracam do formularza z zachowanymi parametrami.
- Mogę kliknąć „Generuj” ponownie lub użyć skrótu „Wygeneruj ponownie z tymi samymi parametrami”.

US-012
Tytuł: Ukończono
Opis: Jako użytkownik chcę oznaczyć quest jako ukończony, aby śledzić postęp.
Kryteria akceptacji:

- Kliknięcie „Ukończono” rejestruje quest_completed i aktualizuje status na liście.
- Completion Rate liczony jako quest_completed/quest_started.

US-013
Tytuł: Tworzenie manualne questa
Opis: Jako użytkownik chcę ręcznie utworzyć quest w tym samym formacie, aby zapisać własne pomysły.
Kryteria akceptacji:

- Formularz umożliwia wprowadzenie haka, 3 kroków, wariantów i adnotacji bezpieczeństwa.
- Treści walidowane pod kątem polityki bezpieczeństwa (blokada hard‑ban).
- Zdarzenie quest_created_manual zapisane w telemetrii.

US-014
Tytuł: Lista „Moje questy”
Opis: Jako użytkownik chcę przeglądać moje questy w prostej liście.
Kryteria akceptacji:

- Widok listy zawiera podstawowe metadane i status (zapisany/rozpoczęty/ukończony), źródło (AI/manual) oraz ikonę Ulubionych.
- Pusty stan zawiera CTA do generacji/presetów.

US-015
Tytuł: Filtry i sortowanie listy
Opis: Jako użytkownik chcę filtrować po wieku, czasie, miejscu, rekwizytach i źródle oraz sortować listę.
Kryteria akceptacji:

- Filtry mogą być łączone; stan filtrów jest czytelny i resetowalny.
- Sortowanie: Ostatnie / Ulubione.
- Telemetria: zastosowanie filtrów nie jest obowiązkowo logowane w MVP.

US-016
Tytuł: Ulubione (przypięcie)
Opis: Jako użytkownik chcę przypiąć ważne questy do ulubionych.
Kryteria akceptacji:

- Kliknięcie ikony serca przełącza stan ulubione on/off i odświeża listę Ulubionych.
- Zdarzenie favorite_toggled zapisane w telemetrii.

US-017
Tytuł: Usuwanie własnego questa
Opis: Jako użytkownik chcę usunąć wybrany quest z mojej listy.
Kryteria akceptacji:

- Akcja „Usuń” dostępna tylko dla moich questów; potwierdzenie przed usunięciem.
- Zdarzenie delete_quest zapisane w telemetrii.

US-018
Tytuł: Detal questa
Opis: Jako użytkownik chcę wyświetlić pełny detal i metadane konkretnego questa.
Kryteria akceptacji:

- Ekran detalu pokazuje całą treść, metadane i dostępne akcje (Ulubione, Rozpocznij/Ukończono, Usuń).

US-019
Tytuł: Wygeneruj ponownie z tymi samymi parametrami
Opis: Jako użytkownik chcę wygenerować nowy quest na bazie tych samych parametrów wejściowych (bez edycji treści).
Kryteria akceptacji:

- Skrót generuje nowy quest, który różni się treściowo od poprzedniego, zachowując parametry.
- Zdarzenie quest_generated odnotowuje parametry wejściowe.

US-020
Tytuł: Zgodność treści z polityką bezpieczeństwa
Opis: Jako rodzic chcę mieć pewność, że żaden quest nie zawiera treści hard‑ban i przestrzega reguł bezpieczeństwa.
Kryteria akceptacji:

- Automatyczne zasady filtrujące generatora odrzucają/naprawiają treści niezgodne.
- Jednostkowe testy treści i testy integracyjne pokrywają przypadki graniczne (np. słowa‑pułapki, „udajemy”).
- Zero incydentów hard‑ban w środowisku produkcyjnym (MVP).

US-021
Tytuł: Komunikacja błędu generacji
Opis: Jako użytkownik chcę jasny komunikat w razie błędu generacji oraz bezpieczny powrót do formularza.
Kryteria akceptacji:

- Widzę komunikat „Wystąpił błąd, spróbuj później” i pozostają mi wybrane parametry.
- Zdarzenie error_generation zapisane w telemetrii.

US-022
Tytuł: Granica wieku 8 lat
Opis: Jako użytkownik wybierający 8 lat chcę jednoznacznego przypisania do grupy wiekowej.
Kryteria akceptacji:

- Wartość 8 jest mapowana do grupy 7–8; tooltip wyjaśnia mapowanie.
- Parametr wieku w telemetrii odzwierciedla grupę 7–8.

US-023
Tytuł: Persistencja danych konta i listy
Opis: Jako użytkownik chcę widzieć moje questy po ponownym zalogowaniu na dowolnym urządzeniu.
Kryteria akceptacji:

- Questy (treść i metadane) są przechowywane na serwerze per konto i synchronizowane po zalogowaniu.
- Brak danych o dzieciach w profilu; przechowywany jest e‑mail i hash hasła (dla kont e‑mail).

US-024
Tytuł: Minimalne bezpieczeństwo logowania
Opis: Jako użytkownik chcę podstawowych zabezpieczeń przy logowaniu.
Kryteria akceptacji:

- Throttling przy wielokrotnych nieudanych próbach logowania.
- Przechowywanie haseł wyłącznie w formie hash; transmisja po HTTPS.

US-025
Tytuł: Puste stany i CTA
Opis: Jako użytkownik, który nie ma jeszcze questów, chcę jasnych wskazówek co dalej.
Kryteria akceptacji:

- Puste stany zawierają krótki tekst i przyciski do presetu lub formularza generacji.

US-026
Tytuł: Widok responsywny
Opis: Jako użytkownik mobilny chcę mieć wygodne UI na telefonie.
Kryteria akceptacji:

- Kluczowe widoki (formularz, wynik, lista, detal) są w pełni responsywne i dostępne na małych ekranach.

US-027
Tytuł: Manualna walidacja bezpieczeństwa
Opis: Jako twórca manualnego questa chcę podpowiedzi zamienników, gdy wpiszę ryzykowne słowo.
Kryteria akceptacji:

- Dla słów spoza słownika bezpiecznego pojawia się podpowiedź („użyj: pokonaj sprytem / cichy trop”); treści hard‑ban blokowane.

US-028
Tytuł: Widoczność źródła questa
Opis: Jako użytkownik chcę wiedzieć, czy quest jest z AI czy manualny.
Kryteria akceptacji:

- Lista i detal wskazują źródło (AI/manual).

US-029
Tytuł: Ustawienie miejsca i energii
Opis: Jako rodzic chcę łatwo wybrać miejsce (dom/dwór) i poziom energii.
Kryteria akceptacji:

- Pola formularza są proste (radio/select); wartości trafiają do generatora i telemetrii.

US-030
Tytuł: Czas do pierwszego startu
Opis: Jako nowy użytkownik chcę szybko przejść od logowania do uruchomienia pierwszego questa.
Kryteria akceptacji:

- Domyślne wartości formularza i presety pozwalają uruchomić pierwszy quest w kilku kliknięciach.
- Mierzone Time‑to‑First‑Start.

## 6. Metryki sukcesu

6.1 Główne wskaźniki

- Start Rate (cel ≥ 75%): liczony jako liczba quest_started / liczba quest_generated w danym okresie (globalnie i per konto).
- Udział AI (cel ≥ 75%): liczony wśród rozpoczętych questów jako liczba quest_started ze źródłem AI / łączna liczba quest_started.
- Completion Rate: quest_completed / quest_started.
- Preset Adoption: liczba preset_used / liczba quest_generated.
- Favorite Rate: liczba unikalnych favorite_toggled-on / liczba aktywnych użytkowników.
- Error Rate: error_generation / quest_generated.
- Time‑to‑First‑Start: mediana czasu od pierwszego zalogowania do pierwszego quest_started.

  6.2 Telemetria i prywatność

- Wszystkie eventy zawierają wyłącznie zanonimizowane identyfikatory i metadane techniczne; brak danych o dzieciach.
- Przechowywanie danych zgodne z zasadą minimalizacji; retencja logów ustalona na krótkie okno (np. 30–90 dni) w MVP.

  6.3 Jakość treści i bezpieczeństwo

- Zero incydentów treści hard‑ban w środowisku produkcyjnym.
- Co najmniej 95% próbek QA przechodzi checklistę stylu i reguł bezpieczeństwa (hak, 3 kroki, warianty, adnotacje).

  6.4 Wejścia do roadmapy po MVP

- Feedback po „Ukończono” (lekka gamifikacja: pochwała/naklejka).
- Tryb gościa i lokalny cache.
- Współdzielenie questów i biblioteka społeczności.
- Wielojęzyczność, TTS/piktogramy, aplikacje natywne.
- Edycja/regeneracja treści przez użytkownika.
