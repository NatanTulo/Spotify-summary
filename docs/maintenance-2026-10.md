# Aktualizacja i dalsze usprawnienia — 16.10.2026

Wyniki późniejszej weryfikacji i dodatkowe poprawki: [raport weryfikacji](verification-2026-10-16.md).

## Wprowadzone zmiany

- React 19.3.1, React Router 7.18.4, TanStack Query 5.104.3, Recharts 3.10.1, Tailwind CSS 4.3.3 i pozostałe aktualne zależności frontendu.
- Vite 8.3.4 z Rolldown, plugin React 6.1.2, Vitest 5.0.5, ESLint 10.13.0, jsdom 30.1.3 i TypeScript 6.0.3.
- Express 5.3.0, Sequelize 6.37.8, pg 8.23.1, Helmet 8.3.0, express-rate-limit 8.7.1, compression 1.8.2, dotenv 18.0.8 i tsx 4.23.15.
- Jeden workspace i lockfile pnpm. `pnpm install` instaluje teraz wszystkie trzy pakiety. Zbędny `npm-run-all` został usunięty.
- Projekt używa Node 24.22.0 LTS pobieranego przez pnpm przez `devEngines.runtime`. Globalna instalacja Node nie jest zmieniana. Typy Node odpowiadają linii 24.
- pnpm przypięty do 10.34.7. Próba użycia 12.14.0 przez istniejący launcher pnpm na Windows zakończyła się błędem uruchomienia natywnego pliku; pozostała działająca, aktualna wersja linii 10.
- TypeScript pozostaje w linii 6.0, ponieważ aktualny typescript-eslint deklaruje obsługę wersji `<6.1.0`. Wersja 7 wymaga poczekania na zgodny parser lub osobnej zmiany narzędzi lintowania.
- Lokalne preview używa Vite zamiast dodatkowego Expressa i http-proxy-middleware. Usunięto w ten sposób także zależność od podatnego `braces`, dla której audyt nie wskazywał poprawki.
- Sequelize otrzymuje przez precyzyjny override `uuid` 11.1.1, które zachowuje używane przez ORM API CommonJS `v1`/`v4`. Wersja 12+ jest wyłącznie ESM. Pozostałe zależności pośrednie zaktualizowano w zgodnych zakresach.
- Naprawiono SQL injection w wyszukiwaniu utworów i albumów: parametryzowane wyszukiwanie, dozwolone kierunki sortowania, walidacja identyfikatorów i paginacji. Doszły testy HTTP obu endpointów.
- Naprawiono warunkowy hook w timeline, zgodność typów Recharts i deklaracji matcherów Vitest 5, konfigurację projektów testowych oraz niejednoznaczne asercje istniejących testów.
- Naprawiono start skompilowanego backendu: cykliczną zależność metadanych dekoratorów audiobooków oraz wczytywanie `.env` przed utworzeniem połączenia z bazą. Obsługiwany jest teraz dokumentowany `DATABASE_URL`; usunięto domyślne hasło `admin`.
- Import CLI działa na Windows i wykrywa foldery profili. W aktualnej wersji wymaga zastosowania migracji. Najpierw weryfikuje pliki, potem zastępuje historię w jednej transakcji. `pnpm import-data` i `pnpm --dir backend import` korzystają z tego samego runnera.
- Dodano CI z instalacją przez frozen lockfile, lintem, testami, buildem i audytem oraz cotygodniowe aktualizacje Dependabot. Akcje GitHub przypięto do commitów.

## Weryfikacja pierwszej aktualizacji zależności

- `pnpm check`: lint, 28 testów i build obu części przechodzą.
- `pnpm test:coverage`: działa; pokrycie całego kodu jest nadal niskie, około 4,4% linii.
- `pnpm install --frozen-lockfile`: przechodzi.
- `pnpm audit --audit-level low`: brak znanych podatności w aktualnym lockfile na dzień aktualizacji. Nie jest to pełny audyt bezpieczeństwa aplikacji.
- Backend uruchomiony z Node 24.22.0 i PostgreSQL 18.6. Na osobnej bazie z syntetycznymi danymi sprawdzono profile, statystyki, utwory, albumy, wyszukiwanie z apostrofem, podcasty, audiobooki, routing SPA oraz poprawną odpowiedź 400 na niepoprawne sortowanie.
- W przeglądarce sprawdzono listę utworów oraz wykresy z danymi testowymi. Wykryto wcześniejszy problem: produkcyjny CSP blokuje czcionkę pobieraną z Google Fonts; aplikacja korzysta wtedy z czcionki zastępczej.

## Import aktualnych danych

Zaimportowano profil `Natan` z 24 plików historii w `data/`: 209 956 rekordów od 3.11.2017 do 14.10.2026. Zapisano 196 671 odtworzeń muzyki i 160 odtworzeń podcastów. Pozostałe 13 125 rekordów pominięto zgodnie z istniejącymi progami: poniżej 5 sekund dla muzyki/audiobooków i poniżej 3 minut dla podcastów. Import oraz przeliczenie statystyk zakończyły się bez błędów rekordów.

Statystyki profilu po imporcie: 16 175 utworów, 3 627 słuchanych artystów, 10 478 słuchanych albumów i 579 921 minut muzyki; podcasty: 24 programy, 98 odcinków i 5 050 minut. Nie znaleziono rekordów powtarzających się między plikami. W samych plikach źródłowych jest 81 dokładnych powtórzeń — zachowano je zgodnie z dotychczasowym działaniem importera. Dane źródłowe pozostały bez zmian i nie są częścią zmian Git.

Po imporcie sprawdzono API na docelowej bazie oraz pięć wykresów muzycznych w przeglądarce, w tym agregację pełnej historii w timeline. Tymczasowa baza z danymi syntetycznymi została usunięta.

## Realizacja dalszych prac — 16.10.2026

Wykonano poniższe punkty dla wersji **wyłącznie lokalnej, bez logowania**, zgodnie z decyzją właściciela projektu. Instrukcje operacyjne i pomiary: [utrzymanie lokalne](local-maintenance.md). Polecenia testowe: [testowanie](testing.md).

1. **Dostęp lokalny.** Frontend i backend nasłuchują na `127.0.0.1`; API sprawdza Host, Origin i Fetch Metadata. Import przyjmuje tylko wykryte nazwy profili i kontroluje rzeczywiste ścieżki folderów oraz plików.
2. **Migracje i import.** Usunięto `sync()` przy starcie oraz z CLI. Dodano wersjonowane migracje, weryfikację schematu, kopię PostgreSQL i odtwarzanie wyłącznie do nowej bazy. Import historii, metadanych i agregatów jest jedną transakcją z rollbackiem przy błędzie lub anulowaniu. Usuwanie profili i przeliczanie statystyk współdzielą blokadę z importem; poprawiono obsługę podcastów i audiobooków podczas czyszczenia.
3. **Testy.** Usunięto test `1 + 1`. Dodano testy PostgreSQL: powtórny import, uszkodzony JSON, błąd po pierwszej partii, anulowanie, separacja profili, agregaty, wszystkie rodzaje treści, daty, walidacja i czyszczenie. Playwright sprawdza import → profil → wyszukiwanie → wykres, pozostałe zakładki, daty, telefon, CSP i odzyskanie po błędzie API. CI otrzymało PostgreSQL i testy przeglądarkowe.
4. **Pobieranie danych.** Główne hooki używają TanStack Query; pozostałe panele i polling wspólnego adaptera Query. Żądania są anulowane po zmianie profilu/dat. Dodano widoczne błędy i ponowienie; usunięto losowe dane zastępcze oraz odpowiedzi podcastów udające sukces po błędzie bazy.
5. **Kontrakt.** Wspólne typy w `shared/api.d.ts`, Zod dla query/body/identyfikatorów oraz odpowiedzi klienta, wspólna paginacja i kody błędów. Ograniczono `any` w przebudowanych hookach i dodano dla nich mocniejsze reguły TS oraz zależności hooków.
6. **Wydajność.** Strumieniowy JSON, `bulkCreate` po maksymalnie 1000 rekordów, agregacja raz na końcu i `ANALYZE`. Pełny eksport w pustej bazie testowej: 45,78 s, identyczne liczby i sumy. Zmierzona agregacja po aktualizacji statystyk: 0,527 ms. Nie dodano zbędnego indeksu ani COPY — istniejące indeksy wystarczają w wykonanym pomiarze. RSS po imporcie 337,2 MB; nie jest to pomiar szczytu.
7. **CSP i błędy.** Skrypty tylko z własnego originu, bez `unsafe-eval` i inline scripts. Inter lokalnie, dokładna konfiguracja CORS loopback, odpowiedzi API bez szczegółów SQL. Style inline pozostały potrzebne dla wykresów i komponentów UI.
8. **Analizy i UI.** Wspólny zakres dat UTC dla zakładek, porównanie z poprzednim lub własnym okresem, roczny kalendarz aktywności wszystkich treści, do 30 nowych artystów rozpoznawanych po pierwszym odtworzeniu w całej historii. Dodano odmianę liczebników w nowych analizach, rankingach i paginacji utworów, etykiety dostępności oraz poprawki układu telefonu. Bez wymiany frameworka.

### Wynik końcowej weryfikacji

- `pnpm check`: lint, **47 testów**, build frontendu i backendu.
- `pnpm test:postgres`: **48 asercji** na osobnej bazie PostgreSQL; każda baza testowa jest usuwana po zakończeniu.
- `pnpm test:e2e`: **3 testy przeglądarkowe** na produkcyjnym buildzie i osobnej bazie.
- `pnpm install --frozen-lockfile`: przechodzi; `pnpm audit --audit-level low`: brak znanych podatności.
- Pełną kopię bazy odtworzono do nowej bazy; liczby profili, utworów, odtworzeń i suma czasu zgodne z oryginałem. Baza odtworzeniowa została usunięta; kopia pozostaje w ignorowanym `.local/backups/`.
- Produkcyjny backend na aktualnej bazie: **17 endpointów** odpowiada prawidłowo; sumy muzyki, podcastów, porównania i kalendarza są zgodne dla zakresu 1–14.10.2026.
- Bieżąca historia użytkownika i pliki w `data/` pozostały zachowane. Pełne importy sprawdzano wyłącznie w bazach testowych.

## Źródła zgodności

- [Migracja do Vite 8](https://vite.dev/guide/migration)
- [Migracja do Vitest 5](https://main.vitest.dev/guide/migration/)
- [Deklarowanie matcherów Vitest](https://main.vitest.dev/guide/extending-matchers)
- [Cykl wsparcia Node](https://github.com/nodejs/Release#release-schedule)
- Zakres wspieranych wersji TypeScript sprawdzony w `peerDependencies` pakietów `@typescript-eslint/parser` i `@typescript-eslint/eslint-plugin` 8.71.2 w rejestrze npm.
