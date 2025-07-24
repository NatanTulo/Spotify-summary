99% AI Vibe Code - VS Code, Copilot agent mode, Claude Sonnet 4

# 🎵 Spotify Analytics - Modern Web Application

Nowoczesna aplikacja webowa do analizy danych ze Spotify GDPR Export z pełnym systemem tłumaczeń (PL/EN). React + TypeScript + PostgreSQL.

**Aplikacja jest tylko do odczytu** - analizuje dane bez możliwości ich modyfikacji.

## ✨ Główne funkcjonalności

- **🌍 Multi-profile support** - Obsługa wielu profili użytkowników
- **🔄 Real-time import** - Progress bar podczas importu z możliwością anulowania
- **📊 Zaawansowana lista utworów** - 19 kolumn danych, sortowanie, filtrowanie, timeline
- **📈 Dashboard** - Statystyki, wykresy, top listy
- **🎯 Analytics** - Timeline aktywności, wzorce słuchania, trendy
- **🌐 Wielojęzyczność** - Kompletny system tłumaczeń PL/EN
- **🌙 Ciemny motyw** - Przyjazny dla oczu design
- **🎵 Spotify integration** - Klikalny link do utworów w Spotify
- **⚡ Performance optimized** - Cachowanie, prefetching, lazy loading

## 🏗️ Architektura techniczna

- **Frontend:** React 19.1 + TypeScript 5.8 + Vite 7.0 + Tailwind CSS 3.4
- **Backend:** Node.js 22.17+ + Express 4.21 + TypeScript 5.8
- **Database:** PostgreSQL 16.9+ z Sequelize 6.37 ORM + optymalizowane indeksy
- **UI Library:** Radix UI (@radix-ui) + shadcn/ui components
- **Charts:** Recharts 3.0 z interaktywnymi wykresami i zoom
- **Dev Tools:** tsx 4.20, ESLint 9.30, concurrently 8.2
- **State Management:** React Context + custom hooks
- **Caching:** In-memory cache z TTL, timeline prefetching

## 🚀 Szybka instalacja (nowy komputer)

### 1. Wymagania systemowe

```bash
# Sprawdź czy masz zainstalowane:
node --version    # Potrzebne: 18+ (testowane z 22.17)
psql --version    # Potrzebne: PostgreSQL 14+ (testowane z 16.9)
```

**Jeśli nie masz:**

- **Node.js**: https://nodejs.org (wersja LTS)
- **PostgreSQL**: https://www.postgresql.org/download/

### 2. Konfiguracja PostgreSQL

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Utwórz bazę danych
sudo -u postgres createdb spotify_analytics
sudo -u postgres psql spotify_analytics
```

**Windows:**

1. Zainstaluj PostgreSQL z oficjalnej strony
2. Zapamiętaj hasło dla użytkownika `postgres`
3. Otwórz pgAdmin lub cmd:

```sql
createdb -U postgres spotify_analytics
```

### 3. Konfiguracja .pgpass

Aby uniknąć wprowadzania hasła za każdym razem, utwórz plik `.pgpass`:

**Linux/Mac:**

```bash
# Utwórz plik .pgpass w katalogu domowym
echo "localhost:5432:spotify_analytics:postgres:TWOJE_HASŁO" > ~/.pgpass
chmod 600 ~/.pgpass
```

**Windows:**

```batch
# Utwórz plik %APPDATA%\postgresql\pgpass.conf
echo localhost:5432:spotify_analytics:postgres:TWOJE_HASŁO > %APPDATA%\postgresql\pgpass.conf
```

### 4. Instalacja projektu

```bash
# Klonowanie/pobranie projektu
git clone <repo-url>
cd spotify-analytics

# Instalacja wszystkich zależności
npm run install:all

# Test połączenia z bazą
npm run dev:server
# Powinno pokazać: "Database connected successfully"
```

### 5. Przygotowanie danych Spotify

1. **Pobierz dane GDPR ze Spotify:**

   - Przejdź do https://www.spotify.com/account/privacy/
   - Kliknij "Request data" → "Extended streaming history"
   - Spotify wyśle link do pobrania (może zająć do 30 dni)

2. **Przygotuj strukturę folderów:**

```
data/
├── NazwaProfilu1/
│   ├── Streaming_History_Audio_2023_1.json
│   ├── Streaming_History_Audio_2024_2.json
│   └── ...
├── NazwaProfilu2/
│   └── Streaming_History_Audio_2024_3.json
```

**⚠️ Ważne:** Nazwa folderu będzie używana jako nazwa profilu w aplikacji. Zmień domyślną nazwę `Spotify Extended Streaming History` na coś bardziej przyjaznego, np. imię, nazwę konta czy pseudonim.

### 6. Uruchomienie

```bash
# Uruchom aplikację (frontend + backend jednocześnie)
npm run dev
```

Aplikacja będzie dostępna pod:

- **Frontend:** http://localhost:3000 (lub kolejny dostępny port)
- **Backend API:** http://localhost:5000
- **Health check:** http://localhost:5000/api/health

## 📁 Import danych

1. Uruchom aplikację: `npm run dev`
2. Kliknij **"Importuj dane"** w górnym menu
3. Aplikacja automatycznie wykryje profile w folderze `data/`
4. Wybierz profile i kliknij **"Importuj"**
5. Obserwuj progress bar - import może zająć kilka minut

## 🛠️ Dostępne komendy

```bash
# Rozwój
npm run dev              # Frontend + backend jednocześnie
npm run dev:client       # Tylko frontend (port 3000)
npm run dev:server       # Tylko backend (port 5000)

# Instalacja
npm run install:all      # Instaluj wszystkie zależności

# Import danych (alternatywnie przez CLI)
npm run import-data

# Budowanie (produkcja)
npm run build
npm start
```

## 🏗️ Struktura projektu

```
spotify-analytics/
├── package.json           # Root scripts
├── frontend/             # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # UI komponenty
│   │   ├── pages/        # Dashboard, Analytics
│   │   └── context/      # Language, Profile management
├── backend/              # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── models/       # PostgreSQL models (Sequelize)
│   │   ├── routes/       # API endpoints
│   │   └── scripts/      # Data import utilities
├── shared/               # Shared TypeScript types
├── data/                 # Spotify GDPR JSON files
└── .vscode/             # VS Code configuration
```

## 🔌 Główne API endpoints

**Import & Profile Management:**

- `GET /api/import/profiles` - Lista zaimportowanych profili
- `GET /api/import/available` - Dostępne profile do importu w folderze `data/`
- `POST /api/import/profile/:name` - Rozpoczęcie importu profilu
- `GET /api/import/progress` - Postęp importu w czasie rzeczywistym
- `DELETE /api/import/clear` - Usuwanie wszystkich danych profilu

**Analytics & Statistics:**

- `GET /api/stats/overview` - Ogólne statystyki słuchania (totalPlays, minutes, etc.)
- `GET /api/stats/timeline?period=day` - Timeline aktywności (wykresy dzienne/miesięczne)
- `GET /api/stats/yearly` - Statystyki roczne z minutami słuchania
- `GET /api/stats/countries` - Statystyki według krajów
- `GET /api/tracks` - Lista utworów z filtrowaniem i paginacją
- `GET /api/tracks/:id` - Szczegóły utworu z pełnymi statystykami
- `GET /api/tracks/:id/timeline` - Timeline konkretnego utworu (z zerami do dziś)
- `GET /api/tracks/:id/plays` - Historia odtworzeń utworu z paginacją
- `GET /api/artists/top` - Top wykonawcy z liczbą odtworzeń

**Wszystkie endpointy wspierają:**

- **Multi-profile filtering:** `?profileId=10`
- **Pagination:** `?limit=50&offset=100` lub `?page=2&limit=20`
- **Sorting:** `?sortBy=totalPlays&sortOrder=desc`
- **Advanced filtering:** `?search=nazwa&minPlays=10&country=PL`
- **Real-time progress tracking** dla importów

## ✅ Najnowsze funkcjonalności i ulepszenia

### 🌐 Unified Translation System

- ✅ **Kompletny system tłumaczeń** - Wszystkie UI elementy przetłumaczone (PL/EN)
- ✅ **TracksList columns** - Wszystkie 19+ kolumn z kluczami tłumaczeń
- ✅ **Dynamic language switching** - Przełączanie języka w czasie rzeczywistym
- ✅ **Date formatting** - Lokalizowane formatowanie dat dla każdego języka

### 🎵 Enhanced Track Management

- ✅ **Spotify URI integration** - Wszystkie utwory mają clickable linki do Spotify
- ✅ **Track details enhanced** - Usunięto sekcje techniczne, historia zawsze rozwinięta
- ✅ **Timeline optimization** - Linearny X axis z wszystkimi dniami (w tym z 0 odtworzeń)
- ✅ **Column reset button** - Przycisk resetowania widocznych kolumn do domyślnych
- ✅ **Play button integration** - Zielony przycisk Spotify obok nazwy utworu z tooltipem

### 📊 Timeline & Analytics Improvements

- ✅ **Complete timeline data** - Backend generuje serie dat od pierwszego do ostatniego/dzisiejszego dnia
- ✅ **Timeline accuracy** - Suma słupków = totalPlays (naprawiono rozbieżności)
- ✅ **Toggle for timeline** - Wybór między rozszerzeniem do dziś vs ostatnie odtworzenie
- ✅ **Performance optimization** - Cachowanie, prefetching top 3 utworów
- ✅ **Yearly stats enhanced** - Dodano minuty słuchania do tabel i wykresów

### 🛠️ Technical & UX Fixes

- ✅ **React hooks order** - Naprawiono "Rendered fewer hooks than expected"
- ✅ **Null safety** - Dodano sprawdzenia null/undefined w formatowaniu dat
- ✅ **Import UI cleanup** - Usunięto redundantne teksty "Aktywne importy"
- ✅ **Backend data integrity** - `/api/tracks/:id/plays` zwraca wszystkie wymagane pola
- ✅ **TypeScript improvements** - Usunięto wszystkie nieużywane importy i zmienne

### Timeline & Analytics (poprzednie wersje)

- ✅ **Timeline statystyki naprawione** - Frontend pokazuje prawidłowe średnie (61.3/dzień zamiast 1708)
- ✅ **Automatyczny wybór profilu** - Aplikacja automatycznie wybiera pierwszy dostępny profil
- ✅ **Timeline skala dzienna** - Backend domyślnie zwraca dane dzienne zamiast miesięcznych

### Profile Management

- ✅ **Synchronizacja profili** - Profile w nagłówku synchronizują się z zarządzaniem danymi
- ✅ **Progress bars** - Działają dla wielu profili jednocześnie, trwałe podczas nawigacji
- ✅ **Real-time updates** - Statystyki aktualizują się w czasie rzeczywistym podczas importu

### Technical Fixes

- ✅ **TypeScript compilation** - Backend kompiluje się bez błędów (Express 4.21 kompatybilność)
- ✅ **PostgreSQL integration** - Pełna migracja z MongoDB, wszystkie modele na Sequelize
- ✅ **Import stability** - Niezawodny import dużych plików JSON z progress tracking
- ✅ **Memory optimization** - Optymalne zarządzanie pamięcią podczas importu

## 🐛 Rozwiązywanie problemów

### PostgreSQL

```bash
# Linux - restart PostgreSQL
sudo systemctl restart postgresql
sudo systemctl status postgresql

# Windows - restart serwisu
net stop postgresql-x64-17 && net start postgresql-x64-17

# Test połączenia
psql -U postgres -d spotify_analytics -h localhost

# Test czy aplikacja może połączyć się z bazą
curl -s "http://localhost:5000/api/health"
```

### Port zajęty

```bash
# Linux/Mac - zabij proces na porcie 5000/3000
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Windows
taskkill /F /PID (netstat -ano | findstr :5000)
taskkill /F /PID (netstat -ano | findstr :3000)
```

### Błędy importu

1. **Sprawdź czy PostgreSQL działa** - `systemctl status postgresql`
2. **Sprawdź `.pgpass`** - czy hasło jest prawidłowe i plik ma uprawnienia 600
3. **Sprawdź pliki JSON** - czy są w folderze `data/` i zaczynają się od `Streaming_History_Audio_`
4. **Sprawdź logi** - w konsoli backendu podczas importu
5. **Test endpointów** - `curl -s "http://localhost:5000/api/import/available"`

### Błędy kompilacji TypeScript

```bash
# Test kompilacji backend
cd backend && npx tsc --noEmit

# Test kompilacji frontend
cd frontend && npm run build

# Jeśli błędy - wyczyść cache
rm -rf node_modules package-lock.json
npm run install:all
```

### Problemy z profilami

- **Profile nie są widoczne** - Sprawdź czy są w `data/NazwaProfilu/` z plikami JSON
- **Nieprawidłowe statystyki** - Sprawdź czy profil został poprawnie zaimportowany
- **Średnie timeline błędne** - Sprawdź czy profil jest wybrany (auto-select powinien działać)

### Czyszczenie i reinstalacja

```bash
# Wyczyść cache NPM
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf backend/node_modules backend/package-lock.json
npm run install:all

# Reset bazy danych (jeśli potrzebne)
# W aplikacji: "Zarządzaj danymi" → "Wyczyść wszystkie dane"

# Alternatywnie przez SQL
psql -U postgres -d spotify_analytics -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

## 📋 Testowanie aplikacji

### Manual testing checklist

```bash
# 1. Test backend health
curl -s "http://localhost:5000/api/health"

# 2. Test profili
curl -s "http://localhost:5000/api/import/profiles" | jq '.data | length'

# 3. Test timeline z profilem
curl -s "http://localhost:5000/api/stats/timeline?profileId=10&period=day" | jq '.data | length'

# 4. Test tracks endpoint
curl -s "http://localhost:5000/api/tracks?limit=3&profileId=10" | jq '.data | length'

# 5. Kalkulacja średnich (powinno być ~60, nie 1700+)
curl -s "http://localhost:5000/api/stats/timeline?profileId=10&period=day" | python3 -c "
import json, sys
data = json.load(sys.stdin)
timeline = data['data']
total_plays = sum(d['plays'] for d in timeline)
active_days = len([d for d in timeline if d['plays'] > 0])
print(f'Total days: {len(timeline)}, Active days: {active_days}')
print(f'Average plays per active day: {total_plays / active_days:.1f}')
"
```

### Expected results

- **Health check:** `{"status":"OK", "timestamp":"2025-01-24T...", "database":"connected"}`
- **Profiles:** Lista profili z pełnymi statystykami (totalPlays, totalMinutes, etc.)
- **Timeline:** Array dni z plays/minutes - WSZYSTKIE dni od pierwszego do dziś
- **Average plays:** ~60-70 na aktywny dzień (nie 1000+)
- **Frontend:** Dashboard ładuje się bez błędów, profile auto-wybrane
- **Translations:** Wszystkie UI elementy w wybranym języku (PL/EN)
- **Track timelines:** Suma słupków = totalPlays dla każdego utworu

## 💡 Przydatne wskazówki

### 🔧 .pgpass dla różnych systemów

- **Linux/macOS**: `~/.pgpass` (uprawnienia 600)
- **Windows**: `%APPDATA%\postgresql\pgpass.conf`
- **Format**: `hostname:port:database:username:password`
- **Przykład**: `localhost:5432:spotify_analytics:postgres:mypassword`

### ⚡ Optymalizacja importu i wydajności

- **Duże pliki JSON:** Import może zająć 10-30 minut (progress bar pokazuje postęp)
- **Równoległy import:** Można importować wiele profili jednocześnie
- **Resume capability:** Import można anulować i wznowić później
- **Database indexes:** Automatycznie tworzone dla optymalnej wydajności
- **Timeline caching:** Top 3 utwory mają timeline pre-fetchowane
- **Memory management:** Optymalne zarządzanie pamięcią podczas importu

### 👥 Multi-profile setup i zarządzanie

- **Folder structure:** Każdy folder w `data/` = osobny profil
- **Profile switching:** Płynne przełączanie w nagłówku aplikacji
- **Separated statistics:** Każdy profil ma osobne statystyki i trendy
- **Import detection:** Automatyczne wykrywanie nowych profili
- **Data isolation:** Profile nie wpływają na siebie nawzajem

### 🌐 Translation system

- **Full coverage:** Wszystkie UI elementy przetłumaczone (PL/EN)
- **Runtime switching:** Zmiana języka bez przeładowania strony
- **Date localization:** Automatyczne formatowanie dat per język
- **Column headers:** Wszystkie 19+ kolumn z właściwymi tłumaczeniami
- **Error messages:** Komunikaty błędów również zlokalizowane

### 🎵 Spotify integration

- **URI clickable:** Wszystkie utwory mają linki do Spotify (zielony przycisk)
- **Deep linking:** Bezpośrednie otwarcie w aplikacji Spotify
- **URI backfill:** Automatyczne uzupełnianie brakujących URI podczas importu
- **Tooltip hints:** Hover effects i tooltips dla lepszego UX

## 📊 Co zobaczysz po imporcie

### 🏠 Dashboard

- **📈 Statystyki ogólne** - Łączny czas słuchania w minutach/godzinach, unikalne utwory/artyści
- **🎵 Top utwory/artyści** - Ranking z liczbą odtworzeń i interaktywnymi kartami
- **🖥️ Statystyki platformy** - Podział na desktop vs mobile vs web player
- **👤 Wybór profilu** - Smooth przełączanie między różnymi profilami
- **🎯 Smart navigation** - Szybkie przejścia do Analytics i szczegółów utworów

### 📈 Analytics (4 zakładki)

- **Overview:** Kluczowe metryki, wzorce słuchania, średnie dzienne/miesięczne
- **Charts:** Wykresy roczne, według krajów, top artyści z interaktywnymi tooltipami
- **Tracks:** Pełna lista utworów z 19+ kolumnami i zaawansowanymi filtrami
- **Timeline:** Dzienny timeline aktywności z zoom, brush controls i toggle opcjami

**Główne funkcje Analytics:**

- **Timeline aktywności** - Wzorce słuchania w czasie (precyzyjna skala dzienna)
- **Średnie odtworzenia** - ~60-70 utworów dziennie (tylko aktywne dni)
- **Trendy miesięczne/roczne** - Analiza wzrostu/spadku aktywności
- **Wykresy interaktywne** - Zoom, hover tooltips, brush selection, legendy

### 🎵 Lista utworów (19+ kolumn z translations)

**Podstawowe dane:**

- Nazwa, Artysta, Album, Rok wydania
- Link do Spotify (zielony przycisk play)

**Statystyki odtworzeń:**

- Łączne odtworzenia, Minuty słuchania, Unique plays
- Procent pominięć z color coding
- Średni czas odtworzenia

**Dane czasowe:**

- Pierwsze/ostatnie odtworzenie (sformatowane daty)
- Timeline dla każdego utworu (rozwijana)

**Informacje techniczne:**

- Spotify URI (clickable), Kraj, Platforma
- Shuffle, Offline, Incognito mode indicators

**Zaawansowane funkcje:**

- **Column selector** - Wybór widocznych kolumn + reset do domyślnych
- **Sorting & filtering** - Według dowolnej kolumny z visual indicators
- **Timeline per track** - Mini wykres z toggle "extend to today"
- **Paginacja** - Smooth navigation przez duże zbiory
- **Prefetching** - Top 3 utwory ładują timeline w tle

### 🎵 Track Details (szczegółowy widok)

- **📊 Podstawowe metryki** - Odtworzenia, minuty, średni czas, skip%
- **📈 Timeline chart** - Interaktywny wykres odtworzeń w czasie
- **🎼 Historia odtworzeń** - Lista szczegółowych sesji (zawsze rozwinięta)
  - Data/czas z lokalizacją
  - Platforma, kraj, czas trwania
  - Badges: Shuffle, Offline, Incognito
  - Powody rozpoczęcia/zakończenia

### 🔄 Import Management

- **📁 Auto-detection** - Automatyczne wykrywanie profili w folderze `data/`
- **⚡ Progress bars** - Real-time tracking dla każdego profilu osobno
- **🔄 Multi-profile import** - Równoległe importowanie wielu profili
- **🔄 Resume capability** - Wznowienie przerwanego importu
- **✅ Data validation** - Sprawdzanie poprawności plików JSON
- **📊 Import statistics** - Podsumowanie zaimportowanych danych

## 🎯 Zalecane przepływy pracy

### 🚀 Pierwszy raz z aplikacją

1. **Setup PostgreSQL** + `.pgpass` dla bezproblemowego dostępu
2. **Import pierwszego profilu** - obserwuj real-time progress bar
3. **Sprawdź Dashboard** - podstawowe statystyki i top listy
4. **Przejdź do Analytics** - eksploruj 4 zakładki (Overview/Charts/Tracks/Timeline)
5. **Eksploruj listę utworów** - testuj filtrowanie, sortowanie i timeline per track
6. **Track Details** - kliknij "oko" przy utworze → szczegółowy widok

### 👥 Dodawanie kolejnych profili

1. **Dodaj folder do `data/`** z plikami JSON (nazwa folderu = nazwa profilu)
2. **Kliknij "Zarządzaj danymi"** → automatyczne wykrycie nowych profili
3. **Importuj równolegle** - wielokrotne progress bary dla różnych profili
4. **Porównuj statystyki** - przełączaj między profilami w nagłówku
5. **Multi-profile analytics** - każdy profil ma osobne dane

### 📊 Analiza długoterminowa

1. **Timeline patterns** - Analytics → Timeline → kiedy słuchasz najwięcej muzyki
2. **Artist evolution** - Charts → jak zmienia się twój gust muzyczny w czasie
3. **Platform analysis** - Dashboard → gdzie słuchasz najczęściej (desktop/mobile)
4. **Skip patterns** - Tracks → które utwory/gatunki pomijasz najczęściej
5. **Seasonal trends** - Yearly charts → jak aktywność zmienia się przez rok

### 🔍 Advanced Analytics Workflow

1. **Daily patterns:** Analytics → Timeline → zoom na konkretne okresy
2. **Track deep-dive:** Tracks → kliknij oko → Track Details → timeline + historia
3. **Country analysis:** Charts → gdzie słuchasz (podróże, przeprowadzki)
4. **Multi-profile comparison:** Przełączaj profile → porównuj wzorce słuchania
5. **Export insights:** Screenshots wykresów dla własnych analiz

---

## 📝 Historia zmian

**v3.0 (styczeń 2025) - Unified Translation & UX Overhaul** 🌟

- ✅ **Complete translation system** - Wszystkie UI elementy z kluczami tłumaczeń (PL/EN)
- ✅ **Enhanced TracksList** - 19+ kolumn, reset button, Spotify play buttons z tooltipami
- ✅ **Timeline optimization** - Linearny X axis, suma słupków = totalPlays, toggle opcje
- ✅ **Track Details revamp** - Usunięto sekcje techniczne, historia zawsze rozwinięta
- ✅ **Backend data integrity** - Wszystkie API endpointy zwracają kompletne dane
- ✅ **Performance improvements** - Cachowanie, prefetching, null safety
- ✅ **React hooks fixes** - Naprawiono błędy "fewer hooks than expected"
- ✅ **Import URI backfill** - Wszystkie utwory mają clickable Spotify linki

**v2.0 (lipiec 2024) - PostgreSQL Migration**

- ✅ Pełna migracja z MongoDB na PostgreSQL z Sequelize
- ✅ Naprawiono problem z timeline średnimi (61 zamiast 1708)
- ✅ Auto-select pierwszego profilu przy starcie
- ✅ Progress bars dla multi-profile import z real-time tracking
- ✅ TypeScript compilation errors naprawione (Express 4.21 kompatybilność)
- ✅ Real-time synchronizacja profili między komponentami
- ✅ Optimized database indexes i query performance

**v1.x (2023) - MongoDB Era**

- Podstawowa funkcjonalność z MongoDB
- Single profile support
- Manual profile selection
- Podstawowe wykresy i statystyki

---

**🎉 Projekt gotowy do produkcji z pełnym systemem tłumaczeń i zaawansowanymi funkcjami analytics!**
