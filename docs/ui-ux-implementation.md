# Wdrożenie UI/UX — 16 października 2026

Wdrożenie wykonali równolegle trzej agenci GPT-6.1-Sol z reasoning medium, z integracją i przeglądem przez agenta głównego.

## Uzupełnienie — 17 października 2026

### Przywrócenie rozwijanych wierszy utworów

Szczegóły ponownie rozwijają się pod klikniętym wierszem listy muzyki, na całą szerokość tabeli. Kliknięcie albumu, liczby lub pustego miejsca również rozwija wiersz; link Spotify zachowuje własne działanie. Ponowne kliknięcie zwija szczegóły. Dostępne są Enter/Spacja, Escape i przeglądarkowe Wstecz. Na telefonie rozwija się element listy. Wykres ma większą wysokość i daty z rokiem; dodatkowa historia odtworzeń jest zwijana osobno.

Weryfikacja tej zmiany: pnpm check — lint, 97 testów i build obu części; pnpm test:e2e — 4 testy. Test przeglądarkowy sprawdza wykres szerszy niż 1400 px na ekranie 1920×1080, umieszczenie pod wierszem oraz brak poziomego przepełnienia na telefonie.

- W nagłówku dodano „Kolory”: pięć palet i własny HEX, zapis wyboru lokalnie. Tła, obramowania, tekst, akcenty i kolory wykresów powstają z wybranego odcienia osobno dla obu motywów. Kontrast obliczany z luminancji; testy obejmują 360 odcieni oraz skrajne kolory. Domyślna paleta jest morska.
- Listy wyboru zastąpiono stylizowanym komponentem Radix Select z obsługą klawiatury, zaznaczenia i przewijania.
- „Dopasuj rankingi do zakresu wykresu” jest domyślnie włączone i zapamiętywane. Przybliżenie suwakiem, datami lub wyborem dnia aktualizuje tylko rankingi utworów i artystów. Wyłączenie opcji i reset przybliżenia przywracają właściwy pełny zakres.
- Kalendarz pobiera cały wybrany rok przez /api/analytics/calendar, niezależnie od dat porównania. Lata pochodzą z pełnej biblioteki; domyślny jest najnowszy zaimportowany rok. Naprawiono położenie etykiet miesięcy. Kalendarz jest dostępny również przy pustym globalnym zakresie.
- Domyślne porównanie 30 dni kończy się na ostatnim wpisie w imporcie, co obsługuje archiwalne eksporty.
- Weryfikacja: pnpm check — lint, 96 testów w 24 plikach i build obu części przeszły. pnpm test:e2e — 4 testy przeszły, w tym zmiana i trwałość palety, przybliżenie i wyłączenie synchronizacji rankingów, niezależny wybór roku 2024 przy porównaniu ograniczonym do jednego dnia 2026. Testy importu użyły tymczasowej bazy.

## Wykonane zadania

- Nowy spójny motyw ciemny, wariant jasny i systemowy, szerszy obszar roboczy, prostsze panele, nawigacja i czytelne pola formularzy.
- Muzyka: kompaktowy pasek narzędzi, wyszukiwanie z opóźnieniem, rzeczywiste odświeżanie, zapis filtrów i nawigacji w URL, trwały wybór kolumn/gęstości, lista na telefonie.
- Szczegóły utworu w panelu bocznym z obsługą Escape, pułapką fokusu, przywracaniem fokusu i przeglądarkowym Wstecz. Osobne stany błędów i ponawianie.
- Dashboard: cztery metryki muzyki, historia słuchania, rankingi, mniej dominujące statystyki pomocnicze.
- Wykresy: wybór czasu/odtworzeń zamiast domyślnej podwójnej osi, sumowanie przedziałów bez nakładających się punktów, tabela danych, przybliżanie klawiaturą.
- Poprawione widoki podcastów i audiobooków, paginacja książek i historii, prawidłowe liczenie kolejnych dni aktywności podcastów.
- Osobna strona /data: foldery, profile, status importu, widoczne błędy odpytywania i ponawianie, wydzielone usuwanie. Anulowanie lub błąd usuwania nie czyści wyboru profilu. Otwarcie strony nie uruchamia przeliczania statystyk.
- Wspólne daty zapisane w URL: cała historia, lata obecne w bibliotece, ostatnie 30 dni do ostatniego wpisu i własny zakres.
- Nowy tylko do odczytu endpoint /api/stats/library-range: granice i lata historii ze wszystkich trzech typów treści, niezależnie od aktywnego filtra.
- UTC dla prezentacji dat zgodnie z agregacją; zapamiętywanie języka, poprawki polskich etykiet.

## Weryfikacja

- pnpm check: lint, 72 testy w 17 plikach, build frontendu i backendu — wszystkie przeszły.
- pnpm test:e2e: 3 testy przeszły. Import na osobnej tymczasowej bazie, wybór profilu, wyszukiwanie, szczegóły i fokus, Wstecz, daty, wykresy, układ mobilny, CSP, błąd API i ponowienie. Baza testowa została usunięta przez runner.
- Przegląd działającej aplikacji: ciemny 1920×1080, 1366×768, 768×1024 i 390×844; jasny 1366×768 i pomiar przy 1536×864.
- Pierwszy rekord muzyki przy 1920×1080 zaczyna się około 360 px od góry; poprzednio nagłówek tabeli zaczynał się około 700 px. Test E2E kontroluje próg 360 px.
- Brak poziomego przepełnienia całej strony w sprawdzonych widokach; szerokie tabele mają własne przewijanie.
- git diff --check bez błędów.

## Granice wdrożenia

Zachowano Inter i obecny stos technologiczny. Import nadal korzysta z lokalnych folderów JSON; nie dodano importu ZIP, pobierania okładek ani OAuth. Pełna historia utworu jest dostępna w przewijanym panelu, bez dodatkowej samodzielnej strony szczegółów. Albumy zachowują przewijaną tabelę. Zakres biblioteki oznacza granice wpisów, nie gwarancję kompletności eksportu.

Nie wykonano formalnego audytu WCAG ani testów na fizycznych urządzeniach. Przegląd responsywności korzystał z rozmiarów obszaru przeglądarki; nie jest potwierdzeniem każdego wariantu skalowania systemu.

Zmiany są lokalne, bez commita i publikacji. Dane istniejącej biblioteki nie były importowane ani usuwane podczas weryfikacji.
