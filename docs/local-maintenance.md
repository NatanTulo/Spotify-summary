# Utrzymanie wersji lokalnej

Nie ma ekranu logowania. Serwery nasłuchują na `127.0.0.1`. API sprawdza Host, Origin, Fetch Metadata, parametry i typ treści operacji zapisu. `CORS_ORIGIN` przyjmuje wyłącznie dokładne originy loopback, oddzielone przecinkami. Nie jest to tryb do publikowania aplikacji w Internecie.

## Migracje

1. Przed aktualizacją istniejącej bazy: `pnpm db:backup`.
2. `pnpm db:migrate` — wersjonowane pliki `backend/migrations/*.sql`, rejestr `schema_migrations`, transakcja i blokada migracji.
3. `pnpm dev` albo `pnpm build && pnpm start`.

Migracja początkowa tworzy brakujące tabele i indeksy bez `alter`/`force`. Kolejna weryfikuje nazwy i typy kolumn istniejącej bazy. Backend odmawia startu przy niezastosowanych migracjach. Nie edytuj zastosowanych plików migracji; dodawaj kolejne. Przy niezgodnym starszym schemacie migracja zgłasza błąd zamiast zgadywać, jak zmienić prywatne dane.

## Kopie i odtwarzanie

`pnpm db:backup` zapisuje archiwum PostgreSQL custom w ignorowanym `.local/backups/`. Wymaga `pg_dump` zgodnego z wersją serwera. `PG_BIN` wskazuje katalog narzędzi; Windows domyślnie `C:/Program Files/PostgreSQL/18/bin`, Linux/macOS używa PATH. Hasło przekazywane jest w środowisku procesu, poza argumentami polecenia.

Odtwarzanie zawsze do nowej bazy:

```powershell
pnpm db:backup restore C:/sciezka/spotify.dump spotify_restore_check
```

Polecenie odmawia nadpisania istniejącej bazy, w tym skonfigurowanej bazy aplikacji. Po odtworzeniu porównaj liczbę profili, odtworzeń i sumy `msPlayed`; dopiero po weryfikacji można świadomie przestawić `DATABASE_URL`. Nie ma automatycznego kasowania starej bazy. Kopie zawierają prywatną historię — przechowuj je tak samo jak eksport Spotify.

## Import

Foldery w `data/` są listą dozwolonych profili importu. API sprawdza rzeczywistą ścieżkę i odrzuca wyjście przez junction/symlink. Pliki historii poza rzeczywistym folderem profilu są pomijane. `SPOTIFY_DATA_DIR` pozwala wskazać inny katalog lokalny.

JSON jest czytany strumieniowo i weryfikowany przed zapisem. Odtworzenia zapisywane są partiami do 1000 rekordów. Cały import, usunięcie starej historii, metadane i agregaty profilu działają w jednej transakcji. Inni czytelnicy widzą poprzedni zatwierdzony stan aż do COMMIT. Błąd, anulowanie lub utrata połączenia wycofują import. Plików źródłowych importer nie modyfikuje.

Wspólne słowniki artystów/albumów/utworów wymagają serializacji importów przez blokadę PostgreSQL. Kolejne importy czekają; odczyty pozostają dostępne. Anulowanie sprawdzane jest między rekordami, partiami i przed zatwierdzeniem; trwające zapytanie SQL kończy się przed wycofaniem. `DELETE /api/import/progress/:profileName` żąda anulowania; status przestaje być aktywny dopiero po rollbacku. Nowe progi pozostają zgodne z poprzednim importerem: muzyka/audiobooki 5 s, podcasty 3 min.

Po imporcie wykonywane jest `ANALYZE` tabel odtworzeń. Aktualizacja postępu zmienia pamięć procesu; agregaty bazy są liczone raz, na końcu importu.

## Daty, API i pobieranie danych

Górny pasek ustawia daty we wszystkich zakładkach; końcowy dzień jest włączony. Daty i kalendarz używają UTC. Listy i wykresy muzyki, podcastów oraz audiobooków filtrują historię tego samego zakresu. Zmiana profilu lub zakresu anuluje poprzednie żądania. Najważniejsze hooki korzystają z `useQuery`; pozostałe panele i polling korzystają ze wspólnego adaptera Query z AbortSignal. Błędy pokazuje pasek z ponowieniem, a wykresy nie generują danych zastępczych.

Kontrakt typów znajduje się w `shared/api.d.ts`. Endpointy list mają wspólne główne `pagination: {page,limit,total,pages}`; zachowana jest też poprzednia zagnieżdżona paginacja. Błędy mają `{success:false,code,error}`. Zapytania przechodzą walidację Zod przed trasami, a frontend weryfikuje kopertę odpowiedzi. Szczegóły SQL pozostają w logach serwera.

Porównanie domyślnie używa poprzedniego okresu tej samej długości; można wskazać dowolny drugi okres. Bez dat analizuje ostatnie 30 dni. Kalendarz sumuje wszystkie rodzaje treści. „Odkryci artyści” oznaczają pierwsze odtworzenie artysty w całej zaimportowanej historii wybranych profili, przypadające w analizowanym okresie; lista obejmuje do 30 najnowszych odkryć.

## Pomiar z 16.10.2026

PostgreSQL 18.6, Node 24.22.0, osobna pusta baza; 24 pliki, 209 956 rekordów, około 158 MB. Import wraz z walidacją i agregacją: **45,78 s**. RSS procesu odczytane po imporcie: **337,2 MB** (nie jest pomiarem szczytu pamięci). Wynik: 196 671 odtworzeń muzyki, 160 podcastów, 13 125 pominięć poniżej progów, bez błędów rekordów. Te same sumy jak w bazie użytkownika.

`EXPLAIN (ANALYZE, BUFFERS)` agregacji utworów od 1 października: po `ANALYZE` 0,527 ms, 63 trafienia bloków i istniejący indeks `plays_timestamp`; wcześniej bez aktualnych statystyk około 39,6 ms i 145 376 trafień bloków. Pomiary ciepłej pamięci podręcznej, różnych świeżych baz testowych — nie są gwarancją czasu każdego zapytania. Nie dodano kolejnego indeksu: aktualne statystyki i istniejące indeksy wystarczają dla zmierzonego zapytania. COPY pozostaje opcją na przyszłość, gdy pomiar wykaże potrzebę; zastosowano `bulkCreate`.

Sprawdzono pełną kopię i odtworzenie do nowej bazy: 1 profil, 16 175 utworów, 196 671 odtworzeń muzyki, 160 podcastów i suma muzyki 34 795 285 108 ms zgodne z oryginałem. Baza odtworzeniowa została usunięta; kopia pozostała w `.local/backups/`.

Weryfikacja końcowa: 47 testów jednostkowych, 48 asercji integracyjnych PostgreSQL i 3 testy Playwright. Dodatkowo 17 endpointów produkcyjnego backendu na aktualnej bazie; sumy dla 1–14.10.2026 zgodne między widokami. Dane użytkownika zachowane.

Dokumentacja wykorzystanych mechanizmów: [transakcje Sequelize](https://sequelize.org/docs/v6/other-topics/transactions/), [anulowanie TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation), [konfiguracja Playwright](https://playwright.dev/docs/test-configuration), [streamparser JSON](https://github.com/juanjoDiaz/streamparser-json/tree/main/packages/node).
