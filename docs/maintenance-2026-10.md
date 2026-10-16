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
- Import CLI działa na Windows i wykrywa foldery profili. Tworzy brakujące tabele przez `sync()` bez `alter`/`force`. Najpierw czyta pliki źródłowe, dopiero potem zastępuje historię danego profilu. `pnpm import-data` i `pnpm --dir backend import` korzystają z tego samego runnera.
- Dodano CI z instalacją przez frozen lockfile, lintem, testami, buildem i audytem oraz cotygodniowe aktualizacje Dependabot. Akcje GitHub przypięto do commitów.

## Weryfikacja

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

## Zalecana kolejność dalszych prac

1. **Dostęp do prywatnych danych i operacji zapisu.** Backend nasłuchuje na `0.0.0.0`, a endpointy odczytu, importu i kasowania nie wymagają uwierzytelnienia. Dla wersji lokalnej warto domyślnie używać loopback; dla udostępnianej — uwierzytelnienia i uprawnień do profili. CORS nie zastępuje kontroli dostępu. W `ImportService.startImport` warto dodatkowo ograniczyć nazwę profilu do listy wykrytych folderów i zweryfikować docelową ścieżkę.
2. **Migracje i bezpieczna wymiana importu.** Zastąpić `sequelize.sync({ alter: true })` w trybie development wersjonowanymi migracjami. Importować do zestawu roboczego i przełączać dane dopiero po poprawnym przetworzeniu całości. Obecny import usuwa poprzednią historię profilu przed zapisem nowej; błąd w trakcie może pozostawić niepełne dane. Dodać sprawdzony backup i odtwarzanie.
3. **Testy importu i agregacji na PostgreSQL.** Pokryć ponowny import, uszkodzony plik, anulowanie, separację profili i zgodność sum na wykresach. Dołożyć test przeglądarkowy: import → wybór profilu → wyszukiwanie → wykres. Dotychczasowy smoke test `1 + 1` nie weryfikuje działania backendu.
4. **Spójne pobieranie danych i błędy.** Wykorzystać już zainstalowany TanStack Query w hookach, które obecnie używają ręcznych efektów i `fetch`. Dodać anulowanie żądań po zmianie profilu oraz widoczny stan błędu zamiast udawania pustych statystyk. Selektory krajów i platform zostały już podłączone do metadanych podczas późniejszej weryfikacji.
5. **Walidacja i kontrakt API.** Rozszerzyć walidację query/body na pozostałe endpointy, ujednolicić paginację, statusy błędów i typy odpowiedzi. Wykorzystać `shared/` oraz ograniczyć liczne `any`. Obecny lint obejmuje reguły JS i kolejność hooków; kolejne reguły TS i zależności efektów można włączać wraz z porządkowaniem kodu.
6. **Wydajność dużych historii.** Pomierzyć import i zapytania na pełnym eksporcie; rozważyć `bulkCreate`/COPY zamiast pojedynczego INSERT dla każdego odtworzenia, strumieniowe czytanie JSON i indeksy dobierane na podstawie `EXPLAIN ANALYZE`. Import aktualizuje też statystyki cyklicznie, co dokłada koszt przy dużej bazie.
7. **Polityka CSP i czcionki.** Inter jest już serwowany lokalnie po późniejszej weryfikacji. Warto usunąć niepotrzebne uprawnienia `unsafe-eval` i inline scripts po sprawdzeniu aplikacji, uporządkować konfigurowanie CORS i ukryć szczegóły błędów SQL w odpowiedziach produkcyjnych.
8. **Funkcje analityczne.** Największy zysk użytkowy dają wspólny zakres dat dla wszystkich zakładek, porównanie dwóch okresów, kalendarz aktywności oraz odkrycia nowych artystów. Warto też poprawić odmianę polskich liczebników i etykiety tabel na telefonie. Obecny React/Vite/PostgreSQL wystarcza do tych zmian; zmiana frameworka nie jest do nich potrzebna.

## Źródła zgodności

- [Migracja do Vite 8](https://vite.dev/guide/migration)
- [Migracja do Vitest 5](https://main.vitest.dev/guide/migration/)
- [Deklarowanie matcherów Vitest](https://main.vitest.dev/guide/extending-matchers)
- [Cykl wsparcia Node](https://github.com/nodejs/Release#release-schedule)
- Zakres wspieranych wersji TypeScript sprawdzony w `peerDependencies` pakietów `@typescript-eslint/parser` i `@typescript-eslint/eslint-plugin` 8.71.2 w rejestrze npm.
