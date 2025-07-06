# TODO - Spotify Analytics - Naprawy do dokończenia

## 🚨 KRYTYCZNE PROBLEMY DO NAPRAWIENIA

### 1. Timeline statystyki nieprawidłowe w frontend

**Status:** 🔴 BŁĄD  
**Problem:** "Średnie odtworzenia dziennie: 1708" - za wysokie liczby (backend zwraca prawidłowe ~60)  
**Przyczyna:** Błędna logika kalkulacji średniej w frontend lub mapowanie danych  
**Lokalizacja:** `frontend/src/pages/Analytics.tsx:322-324`  
**Backend zwraca:** 2399 dni, średnia 60.1 odtworzeń/dzień  
**Frontend pokazuje:** 1708 odtworzeń/dzień

**Potrzebne działania:**

- [ ] Sprawdzić funkcję `timelineData.reduce()` w Analytics.tsx linijki 322-324
- [ ] Dodać console.log do sprawdzenia mapowanych danych w frontend
- [ ] Sprawdzić czy wszystkie dni mają prawidłowe wartości `plays` i `minutes`
- [ ] Możliwe że problem z NaN lub null wartościami w reduce()

### 2. Profile w nagłówku nie synchronizują się z zarządzaniem danymi

**Status:** 🟡 NAPRAWIANE  
**Problem:** Wybór profilu w nagłówku nie pokrywa się z zakładką zarządzania danymi, wyświetlają się poziome kreski zamiast danych  
**Przyczyna:** HeaderProfileSelector ma własną listę profili i nie aktualizuje się gdy profil zostanie dodany/usunięty  
**Lokalizacja:** `frontend/src/components/HeaderProfileSelector.tsx`, `frontend/src/components/Layout.tsx`

**Wykonane działania:**

- ✅ Dodano `refreshTrigger` prop do HeaderProfileSelector
- ✅ Dodano `onProfilesChanged` callback do ProfileManager
- ✅ Dodano sprawdzenie czy wybrany profil nadal istnieje
- ✅ Dodano debug logi do śledzenia synchronizacji profili

**Do przetestowania:**

- [ ] Sprawdzić czy wybór profilu w header działa po dodaniu/usunięciu profili
- [ ] Przetestować czy dane się wyświetlają po wybraniu profilu w header
- [ ] Sprawdzić debug logi w konsoli przeglądarki

## ✅ NAPRAWIONE I UKOŃCZONE

### Migracja z MongoDB na PostgreSQL

- ✅ Dependencies instalacja, MongoDB usunięty, PostgreSQL skonfigurowany
- ✅ Backend i frontend działają, połączenie PostgreSQL naprawione
- ✅ Tailwind CSS i PostCSS naprawione (downgrade, konfiguracja)

### Progress bary i import profili

- ✅ Progress bar dodany i przetestowany dla importu profili
- ✅ Auto-refresh profili i progress barów (interwały ustawione)
- ✅ Backend endpoint dla manualnej aktualizacji statystyk po imporcie
- ✅ Backend usuwanie profili (usuwa powiązane plays, tracks, albums, artists)
- ✅ Progress bary widoczne i działają dla wielu profili jednocześnie
- ✅ Progress bary trwałe po nawigacji (sprawdzanie aktywnych importów)
- ✅ Statystyki profili aktualizują się po imporcie (manual/auto)

### Timeline i endpointy

- ✅ Timeline przełączony na skalę dzienną (backend default, frontend param)
- ✅ Progress bary i statystyki w czasie rzeczywistym podczas importu
- ✅ Backend `/api/tracks` endpoint działa poprawnie dla profileId
- ✅ Backend `/api/stats/timeline` zwraca prawidłowe dane dzienne
- ✅ Średni czas odtwarzania (avgPlayDuration) formatowany poprawnie w sekundach
- ✅ TracksList mapowanie pól `trackName`, `artistName`, `albumName` działa
- ✅ `.pgpass` skonfigurowany dla PostgreSQL auto-login
- ✅ Debug logi dodane dla stanu importu i cyklu komponentów

### Naprawione błędy z poprzednich sesji

- ✅ Backend zwraca liczby zamiast stringów
- ✅ Dashboard mapowanie `track.name` i `track.artist.name`
- ✅ Analytics timeline mapowanie `period`→`date`, `totalMinutes`→`minutes`
- ✅ Defensywne sprawdzanie `Number(val) || 0`
- ✅ TracksList formatowanie `toFixed()` z sprawdzaniem typu
- ✅ README.md uproszczony i zaktualizowany z setup info (.pgpass, PostgreSQL config)

## 🔧 ŚRODOWISKO I SETUP

### Backend Status

- ✅ Port 5000 działa
- ✅ Endpoint `/api/health` odpowiada
- ✅ PostgreSQL połączenie i synchronizacja działa
- ✅ Wszystkie główne endpointy działają poprawnie

### Frontend Status

- ✅ Port 3000 działa
- ✅ Większość błędów NaN w konsoli naprawiona
- ⚠️ Jeden pozostały problem: kalkulacja średnich w Analytics timeline

### Kluczowe endpointy - wszystkie działają

- ✅ `/api/tracks` - działa poprawnie dla wszystkich profili
- ✅ `/api/artists/top` - działa poprawnie
- ✅ `/api/stats/overview` - działa
- ✅ `/api/stats/timeline` - zwraca prawidłowe dane dzienne (backend: avg 60.1)
- ✅ `/api/import/profiles` - lista profili
- ✅ `/api/import/available` - dostępne profile do importu
- ✅ `/api/import/progress` - aktywne importy

## 📋 PLAN DZIAŁANIA NA NASTĘPNĄ SESJĘ

1. **PRIORYTET 1:** Przetestować naprawę synchronizacji profili

   - Uruchomić frontend i backend
   - Sprawdzić debug logi w konsoli
   - Przetestować dodawanie/usuwanie profili i sprawdzić czy header się aktualizuje
   - Sprawdzić czy wybór profilu w header wyświetla prawidłowe dane

2. **PRIORYTET 2:** Naprawić kalkulację średniej timeline w frontend

   - Debugować funkcję reduce() w Analytics.tsx linijki 322-324
   - Sprawdzić mapowanie danych timeline w frontend
   - Dodać console.log do sprawdzenia wartości

3. **PRIORYTET 3:** Test end-to-end wszystkich funkcji

   - Dashboard → wybór profilu → top tracks
   - Analytics → lista utworów → timeline → statystyki
   - Import profilu → progress bar → aktualizacja statystyk

4. **PRIORYTET 4:** Finalne testy i czyszczenie kodu
   - Usunięcie debug logów z production code
   - Sprawdzenie responsywności na różnych urządzeniach
   - Finalne testy performance

## 🔍 PRZYDATNE KOMENDY TESTOWE

```bash
# Test backend health
curl -s "http://localhost:5000/api/health"

# Test tracks endpoint z profilem
curl -s "http://localhost:5000/api/tracks?limit=3&sortBy=totalPlays&sortOrder=desc&profileId=10"

# Test timeline endpoint
curl -s "http://localhost:5000/api/stats/timeline?profileId=10&period=day" | python3 -c "import json, sys; data=json.load(sys.stdin); print(f'Days: {len(data[\"data\"])}, Avg plays: {sum(d[\"plays\"] for d in data[\"data\"]) / len(data[\"data\"]):.1f}')"

# Test profili
curl -s "http://localhost:5000/api/import/profiles"
```

## 📁 GŁÓWNE PLIKI DO EWENTUALNEJ EDYCJI

- `frontend/src/pages/Analytics.tsx` - kalkulacje timeline (linijki 322-324)
- `frontend/src/components/HeaderProfileSelector.tsx` - synchronizacja profili (debug logi dodane)
- `frontend/src/components/Layout.tsx` - przekazywanie callbacków synchronizacji profili

---

**Stan na:** 6 lipca 2025, 19:40  
**Ostatnie zmiany:** Naprawiono synchronizację profili, uproszczono README.md z setup info (.pgpass, PostgreSQL)
