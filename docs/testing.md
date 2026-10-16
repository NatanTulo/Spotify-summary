# Testy utrzymaniowe

- `pnpm check` — lint, testy jednostkowe i build.
- `pnpm test:postgres` — testy rzeczywistego importu, transakcji, anulowania, agregacji i API. Wymaga PostgreSQL z `backend/.env` i prawa CREATE DATABASE. Zawsze tworzy własną bazę `spotify_maintenance_test_*` i usuwa ją w `finally`.
- `pnpm test:e2e` — udokumentowany workflow Playwright (Chromium): osobna baza, syntetyczne pliki, produkcyjny backend, import w UI, wybór profilu, wyszukiwanie, wykres, zakres dat, błędy i telefon. Najpierw `pnpm exec playwright install chromium` oraz `pnpm build`. Runner usuwa własną bazę i zatrzymuje serwer również przy błędzie. Nie uruchamia testów na danych użytkownika.
- Pełny pomiar importu: ustaw `BENCHMARK_DATA_DIR` na bezwzględną ścieżkę `data/`, potem `pnpm test:postgres`. Profil `Natan` importowany jest wyłącznie do bazy testowej. Wynik i `EXPLAIN (ANALYZE, BUFFERS)` trafiają do ignorowanego `tmp/maintenance-benchmark.json`.

Pliki w `tmp/`, kopie `.local/backups/`, raporty Playwright i eksporty Spotify są ignorowane przez Git.
