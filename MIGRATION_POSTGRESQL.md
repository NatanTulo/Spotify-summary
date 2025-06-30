# Migracja na PostgreSQL - Spotify Analytics

## Status migracji

✅ **Ukończone:**
- Instalacja pakietów PostgreSQL (pg, sequelize-typescript)
- Konfiguracja bazy danych PostgreSQL
- Konwersja modeli na Sequelize:
  - Artist ✅
  - Album ✅  
  - Track ✅
  - Play ✅
  - Profile ✅
  - ArtistStats ✅
  - CountryStats ✅
- Aktualizacja tsconfig.json dla decoratorów
- Utworzenie bazy danych spotify_analytics

🔄 **W trakcie:**
- Konwersja pozostałych modeli statystyk
- Aktualizacja routes/kontrolerów
- Migracja danych

## Kroki do dokończenia

### 1. Dokończ modele Sequelize
```bash
# W backend/src/models/
# Dokończ konwersję:
- DailyStats.ts
- YearlyStats.ts
```

### 2. Aktualizuj routes
Wszystkie pliki w `backend/src/routes/` wymagają aktualizacji aby używać Sequelize zamiast MongoDB:
- `tracks.ts`
- `stats.ts` 
- `artists.ts`
- `albums.ts`
- `import.ts`

### 3. Korzyści PostgreSQL
- **Wydajność:** Lepsze indeksy, optymalizacja zapytań
- **JSONB:** Szybkie zapytania na danych JSON
- **Concurrent connections:** Lepsza obsługa wielu połączeń
- **Memory management:** Bardziej efektywne zarządzanie pamięcią

### 4. Migracja danych
Po dokończeniu modeli, uruchom import danych:
```bash
npm run import:data
```

### 5. Test wydajności
PostgreSQL powinien być znacznie szybszy dla:
- Timeline queries (agregacje po datach)
- Country/Artist statistics
- Complex joins między tracks/artists/albums

## Environment Variables

```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres  
DB_PASSWORD=admin
DB_NAME=spotify_analytics
NODE_ENV=development
```

## Indeksy PostgreSQL

Modele zawierają indeksy zoptymalizowane dla:
- Zapytania timeline (timestamp)
- Statystyki krajów/artystów (profileId + field)
- Wyszukiwanie tracks (name, albumId)
- Join operations (foreign keys)

## Następne kroki

1. **Dokończ routes:** Zamień wszystkie zapytania MongoDB na Sequelize
2. **Test połączenia:** Sprawdź czy backend działa z PostgreSQL  
3. **Import danych:** Przenieś dane z JSON do PostgreSQL
4. **Performance testing:** Porównaj wydajność z MongoDB
5. **Frontend:** Sprawdź czy wszystkie endpointy działają poprawnie

Oczekiwana poprawa wydajności: **2-5x szybciej** dla złożonych zapytań statystycznych.
