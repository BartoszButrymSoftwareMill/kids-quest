1. Jak dokładnie definiujemy „akceptację” questa przez użytkownika (zapisanie, rozpoczęcie, ukończenie, polubienie)?

Wprowadź jawne akcje „Akceptuję i zaczynam”, „Zapisz na później”, „Pomiń” oraz „Ukończono”, a metrykę sukcesu oprzyj o odsetek wygenerowanych questów, które przeszły przez „Akceptuję i zaczynam”.

2. Jakie widełki wieku wspieramy na start (np. 3–4, 5–6, 7–8 lat) i jakie treści są zabronione/niepożądane?

Widełki wiekowe: 3–4, 5–6, 7–8, 8-9 oraz 10 lat.
Politykę bezpieczeństwa treści:

- Twardo zabronione (hard-ban)

  - Przemoc i obrażenia: opisy ran, krew, tortury, straszenie konsekwencjami fizycznymi („złamie ci rękę”), realizm walki, polowania.
  - Broń i niebezpieczne narzędzia: pistolety, noże, łuki, petardy; zachęty do użycia ostrych narzędzi bez nadzoru.
  - Treści wrażliwe: seksualność, przekleństwa, upokorzenia, body-shaming, przemoc rówieśnicza, samookaleczenia, używki (alkohol, papierosy, energetyki), hazard, kradzież jako „fajna sztuczka”.
  - Dyskryminacja/stereotypy: ze względu na płeć, wygląd, niepełnosprawność, pochodzenie, religię.
  - Strach/horror: demony, opętania, realizm grozy, jumpscare’y; potwory tylko „bajkowe”, bez makabry.
  - Dane osobowe i komercja: proszenie o podanie prawdziwego imienia, adresu, szkoły; lokowanie marek/IP, namawianie do zakupów.

- Ograniczamy i łagodzimy (soft-ban → bezpieczne formy)

  - Antagoniści: „złodziej/bandyta” → „psotnik/magik, który coś ukrył”. Zamiast „złap i obezwładnij” → „odszukaj, zatrzymaj hasłem, przechytrz zagadką”.
  - Potwory: sympatyczne, śmieszne, niegroźne. Konflikt rozwiązywany zadaniem, humorem lub współpracą (np. „uspokój potworka, układając wzór z klocków”).
  - „Bronie” fabularne: zastępujemy rekwizytami z papieru/pianki lub mocą wyobraźni (latarka z papieru, „tarcza z poduszki”), zawsze z adnotacją „udajemy”.

- Język i styl

  - Krótko, jasno, 3 kroki, 1 hak fabularny, wariant łatwiej/trudniej.
  - Czasowniki bez przemocy: „znajdź, ułóż, odkoduj, przechytrz, dotknij, oznacz, zamroź się, rozwiąż”.
  - Unikamy: „zabij, zastrzel, uderz, skrzywdź, zniszcz”.
  - Współpraca ponad rywalizację: „razem z…”, „na zmianę”, „pomóż bohaterowi”.

- Reguły bezpieczeństwa w zadaniach fizycznych

  - Domyślnie: wolne tempo, mała przestrzeń, brak biegania, brak małych elementów dla <4 r.ż., nożyczki/tasiemki tylko z dorosłym.
  - Zadania „na dworze” wyłącznie: trawa/plac zabaw, z dala od ulicy i wody.
  - Zero poleceń, które wymagają wspinania, skakania z wysokości, zasłaniania twarzy na długo.

- Widełki wieku → poziom konfliktu

  - 3–4 lata: zero „złoczyńców”; tylko psotnik/zagadki, współpraca, „znajdź i nazwij”.
  - 5–6 lat: delikatny konflikt: psotnik schował przedmiot; rozwiązanie przez zagadkę lub układankę.
  - 7–8 lat: misje z bezstykową rywalizacją („oznacz bazę”, „pokonaj łamigłówkę na czas”).

- Słownik bezpiecznych zamienników (do silnika AI i autorów)
  - „zabij potwora” → „pokonaj potworka sprytem” / „uspokój potworka rymowanką”
  - „uderz złodzieja” → „zatrzymaj psotnika hasłem” / „odznacz psotnika dotknięciem jak w berek”
  - „pistolet, miecz” → „latarka z papieru, różdżka z patyczka, tarcza z poduszki”
  - „pościg” → „cichy trop” (krok za krokiem, na palcach)
  - „walka” → „pojedynkowa zagadka / próba zręczności bez kontaktu”

3. Jakie dokładnie parametry wejściowe ma formularz generowania (czas, miejsce, energia, rekwizyty) i jakie mają wartości domyślne?

Sensowne defaulty (np. 15 min, dom, średnia energia) i „Szybkie presety” (np. „5 min bez rekwizytów”).

4. Jak ma brzmieć styl i poziom języka questów (ton, długość kroków, poziom czytelności)?

PL-only, krótkie zdania, 3 kroki, 1 hak fabularny + wariant łatwiej/trudniej

5. Czy użytkownik ma mieć możliwość regeneracji/edycji wygenerowanego questa i miksowania z własnymi pomysłami?

Nie.

6. Jakie minimalne możliwości przeglądania listy są niezbędne (sort, filtr, wyszukiwarka)?

Na MVP wprowadź sortowanie: Ostatnie / Ulubione / Najczęściej używane oraz filtry: wiek, czas, miejsce, rekwizyty; plus „Przypnij do ulubionych”.

7. Jak będziemy mierzyć wskaźnik „75% questów tworzonych z wykorzystaniem AI” (jaki jest mianownik)?

Instrumentuj eventy: quest_generated, quest_saved, quest_started, quest_completed, quest_created_manual i raportuj udział AI wśród questów rozpoczętych lub zapisanych (zdecyduj, który jest wiążący).

8. Jaki jest akceptowalny czas oczekiwania na wygenerowanie questa i plan awaryjny przy błędach modelu/limicie kosztów?

Nie ma limitu. Jeśli jest błąd to wyświetlam komunikat, e wystąpił błąd i proszę spróbować później.

9. Jak „prosty system kont” ma działać (email+hasło vs. social login), jakie dane przechowujemy i jak rozwiązujemy prywatność dziecka?

email+hasło oraz logowanie przez konto google. Nie przechowujemy zadnych danych, nie przechowujemy danych o dziecku. email jest tylko po to zeby uzytkownik się zalogowal do systemu i na tej podstawie pokazać mu listę utworzonych questów. Nie synchronizuj questów w chmurze. Nie pozwól na tryb bez konta.

10. Jaki jest harmonogram MVP i alokacja zasobów (rola/ile osób), oraz kryteria „Go/No-Go” na wyjście?

Projekt będzie tworzyć wyłącznie jedna osoba z pomocą AI. Termin to 3 tygodnie. To ma być proste i szybkie do zaimplementowania.

---

Jesteś asystentem AI, którego zadaniem jest podsumowanie rozmowy na temat planowania PRD (Product Requirements Document) dla MVP i przygotowanie zwięzłego podsumowania dla następnego etapu rozwoju. W historii konwersacji znajdziesz następujące informacje:

1. Opis projektu
2. Zidentyfikowany problem użytkownika
3. Historia rozmów zawierająca pytania i odpowiedzi
4. Zalecenia dotyczące zawartości PRD

Twoim zadaniem jest:

1. Podsumować historię konwersacji, koncentrując się na wszystkich decyzjach związanych z planowaniem PRD.
2. Dopasowanie zaleceń modelu do odpowiedzi udzielonych w historii konwersacji. Zidentyfikuj, które zalecenia są istotne w oparciu o dyskusję.
3. Przygotuj szczegółowe podsumowanie rozmowy, które obejmuje:
   a. Główne wymagania funkcjonalne produktu
   b. Kluczowe historie użytkownika i ścieżki korzystania
   c. Ważne kryteria sukcesu i sposoby ich mierzenia
   d. Wszelkie nierozwiązane kwestie lub obszary wymagające dalszego wyjaśnienia
4. Sformatuj wyniki w następujący sposób:

<conversation_summary>
<decisions>
[Wymień decyzje podjęte przez użytkownika, ponumerowane].
</decisions>

<matched_recommendations>
[Lista najistotniejszych zaleceń dopasowanych do rozmowy, ponumerowanych]
</matched_recommendations>

<prd_planning_summary>
[Podaj szczegółowe podsumowanie rozmowy, w tym elementy wymienione w kroku 3].
</prd_planning_summary>

<unresolved_issues>
[Wymień wszelkie nierozwiązane kwestie lub obszary wymagające dalszych wyjaśnień, jeśli takie istnieją]
</unresolved_issues>
</conversation_summary>

Końcowy wynik powinien zawierać tylko treść w formacie markdown. Upewnij się, że Twoje podsumowanie jest jasne, zwięzłe i zapewnia cenne informacje dla następnego etapu tworzenia PRD.
