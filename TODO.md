# TODO - Spotify Analytics - Naprawy do dokończenia

## 🚨 KRYTYCZNE PROBLEMY DO NAPRAWIENIA

### 1. Backend - Problem z profileId w tracks endpoint
**Status:** 🔴 BŁĄD  
**Problem:** Tracks endpoint zwraca totalPlays=0 dla konkretnego profilu, ale działa dla "Wszystkie"  
**Logi:** `profileId: "6"` jest przekazywane jako string, może problem z typem w SQL  
**Lokalizacja:** `backend/src/routes/tracks.ts:67-74`  
**Debug dodany:** Console.log w linii 98-103

**Potrzebne działania:**
- [ ] Sprawdzić czy profileId jest przekazywane jako INT czy STRING do SQL
- [ ] Przetestować query ręcznie: `SELECT * FROM plays WHERE "profileId" = 6 LIMIT 5`
- [ ] Sprawdzić czy profil 6 ma jakiekolwiek dane w tabeli plays
- [ ] Możliwe że trzeba rzutować profileId na INT: `WHERE "profileId" = CAST(:profileId AS INTEGER)`

### 2. Frontend - TracksList pokazuje "Niedostępne" 
**Status:** 🔴 BŁĄD  
**Problem:** Nazwa utworu i wykonawca pokazują "Niedostępne" zamiast prawdziwych wartości  
**Lokalizacja:** `frontend/src/components/TracksList.tsx`  
**Przyczyna:** Prawdopodobnie mapowanie pól `trackName` vs `name`

**Potrzebne działania:**
- [ ] Sprawdzić aktualne pola w TracksList.tsx po zmianach użytkownika
- [ ] Upewnić się, że backend zwraca `trackName`, `artistName`, `albumName`
- [ ] Przetestować pełny flow: Analytics -> /api/tracks -> TracksList

### 3. Średni czas odtwarzania nieprawidłowy
**Status:** 🔴 BŁĄD  
**Problem:** "Śr. czas" pokazuje `3039:39` zamiast normalnego czasu  
**Przyczyna:** `avgPlayDuration` jest w milisekundach, ale formatowanie oczekuje sekund  
**Lokalizacja:** `backend/src/routes/tracks.ts:63` i `frontend/src/components/TracksList.tsx`

**Potrzebne działania:**
- [ ] Sprawdzić jednostki avgPlayDuration (ms vs s)
- [ ] Poprawić formatowanie w TracksList.tsx lub zmienić backend
- [ ] Przetestować czy `Math.floor(duration / 60)` daje sensowne wyniki

### 4. Timeline statystyki nieprawidłowe
**Status:** 🔴 BŁĄD  
**Problem:** "Średnie odtworzenia dziennie: 1708" - za wysokie liczby  
**Przyczyna:** Agregacja danych timeline może być błędna  
**Lokalizacja:** `frontend/src/pages/Analytics.tsx:316-328`

**Potrzebne działania:**
- [ ] Sprawdzić czy dane timeline są dzienne czy miesięczne
- [ ] Przetestować `timelineData.reduce()` funkcje
- [ ] Dodać console.log do sprawdzenia raw danych z `/api/stats/timeline`

## ✅ NAPRAWIONE WCZEŚNIEJ

- ✅ Backend zwraca liczby zamiast stringów
- ✅ Dashboard mapowanie `track.name` i `track.artist.name`
- ✅ Analytics timeline mapowanie `period`→`date`, `totalMinutes`→`minutes`
- ✅ Defensywne sprawdzanie `Number(val) || 0`
- ✅ TracksList formatowanie `toFixed()` z sprawdzaniem typu

## 🔧 ŚRODOWISKO I SETUP

### Backend Status
- ✅ Port 5000 działa
- ✅ Endpoint `/api/health` odpowiada
- ⚠️ Problem z synchronizacją bazy danych (schema constraints)
- ⚠️ Możliwe że trzeba `sync: false` w database.ts

### Frontend Status  
- ✅ Port 3000 działa
- ⚠️ Błędy NaN w konsoli (częściowo naprawione)
- ⚠️ Biały ekran przy przejściu do listy utworów

### Kluczowe endpointy
- ✅ `/api/tracks` - działa dla "Wszystkie", 🔴 nie działa dla konkretnego profilu
- ✅ `/api/artists/top` - działa poprawnie  
- ✅ `/api/stats/overview` - działa
- ✅ `/api/stats/timeline` - zwraca dane, ale frontend źle je interpretuje

## 📋 PLAN DZIAŁANIA NA NASTĘPNĄ SESJĘ

1. **PRIORYTET 1:** Naprawić profileId w tracks endpoint
   - Debugować SQL query z profileId
   - Sprawdzić typy danych w bazie
   - Przetestować ręcznie

2. **PRIORYTET 2:** Naprawić TracksList mapowanie
   - Sprawdzić aktualne pola po zmianach użytkownika
   - Upewnić się o spójności backend↔frontend

3. **PRIORYTET 3:** Poprawić timeline i średnie statystyki  
   - Sprawdzić kalkulacje w Analytics.tsx
   - Poprawić jednostki czasu

4. **PRIORYTET 4:** Test end-to-end
   - Dashboard → wybór profilu → top tracks
   - Analytics → lista utworów → timeline

## 🔍 PRZYDATNE KOMENDY TESTOWE

```bash
# Test tracks endpoint bez profilu
curl -s "http://localhost:5000/api/tracks?limit=3&sortBy=totalPlays&sortOrder=desc"

# Test tracks endpoint z profilem
curl -s "http://localhost:5000/api/tracks?limit=3&sortBy=totalPlays&sortOrder=desc&profileId=6"

# Test czy profil 6 ma dane w plays
curl -s "http://localhost:5000/api/stats/overview?profileId=6"

# Debug bazy danych
# Sprawdzić SELECT * FROM plays WHERE "profileId" = 6 LIMIT 5;
```

## 📁 GŁÓWNE PLIKI DO EDYCJI

- `backend/src/routes/tracks.ts` - główny problem z profileId  
- `frontend/src/components/TracksList.tsx` - mapowanie pól
- `frontend/src/pages/Analytics.tsx` - kalkulacje timeline
- `backend/src/config/database.ts` - ewentualnie sync: false

---
**Stan na:** 1 lipca 2025, 01:00  
**Ostatnie zmiany:** Dodano debug logi w tracks.ts, naprawiono część formatowania
