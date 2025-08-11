99% AI Vibe Code - VS Code, Copilot agent mode, Claude Sonnet 4 + GPT-5 (Preview)

# 🎵 Spotify Analytics - Modern Web Application

Nowoczesna aplikacja webowa do analizy danych ze Spotify GDPR Export z pełnym systemem tłumaczeń (PL/EN). React + TypeScript + PostgreSQL.

**Aplikacja jest tylko do odczytu** - analizuje dane bez możliwości ich modyfikacji.

## ✨ Główne funkcjonalności

- **🌍 Multi-profile** – niezależne statystyki i równoległy import
- **🔄 Import w czasie rzeczywistym** – progres per profil + możliwość anulowania
- **📊 Lista utworów (19+ kolumn)** – sortowanie, filtrowanie, selektor kolumn, timeline per track
- **📈 Dashboard & Analytics** – roczne, dzienne, kraje, artyści, wzorce słuchania
- **🕒 Dual Axis Listening Timeline** – osobna oś Y dla plays i minutes + zaawansowane funkcje:
  - **🧪 Adaptive Aggregation** – automatyczne bucketowanie >500 punktów (z zachowaniem top dni)
  - **🔥 Top Day Markers** – 5 najaktywniejszych dni wstawiane z markerami + klik-zoom
  - **🖱️ Zoom & Brush** – płynny zakres + komunikaty o agregacji + reset zoom
- **🎙️ Podcasts & Audiobooks** – pełne wsparcie dla podcastów i audiobooków z oddzielnymi stronami
- **🌐 Pełne tłumaczenia PL/EN** – runtime switching, lokalizacja dat
- **🎵 Integracja Spotify** – bezpośrednie linki / przycisk play
- **⚡ Wydajność** – cache, prefetching timeline top utworów, lazy loading, code splitting
- **🛡️ Stabilność** – walidacja plików, rate limiting, nagłówki security, indeksy w DB

## 🏗️ Architektura techniczna

- **Frontend:** React 19.1 + TypeScript 5.8 + Vite 7.0 + Tailwind CSS 3.4
- **Backend:** Node.js 22.17+ + Express 4.21 + TypeScript 5.8
- **Database:** PostgreSQL 16.9+ z Sequelize 6.37 ORM + optymalizowane indeksy + Sequelize-TypeScript 2.1
- **UI Library:** Radix UI (@radix-ui) + shadcn/ui components + Lucide React 0.525
- **Charts:** Recharts 3.0 z interaktywnymi wykresami i zoom
- **State Management:** React Context + TanStack Query 5.81 + React Router DOM 7.6
- **Security:** Helmet 8.1, CORS 2.8, Express Rate Limit 7.5, Compression 1.8
- **Dev Tools:** tsx 4.20, ESLint 9.30, npm-run-all 4.1, TypeScript 5.8
- **Styling:** Tailwind CSS 3.4 + PostCSS 8.5 + Autoprefixer 10.4 + CVA 0.7
- **Date Handling:** date-fns 4.1 z pełną lokalizacją PL/EN
- **HTTP Client:** Axios 1.10 z interceptorami i error handling
- **Caching:** In-memory cache z TTL, timeline prefetching, TanStack Query cache

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

**Tryb rozwoju (z hot reload):**

```bash
npm run dev
# Otwórz: http://localhost:3000
```

**Tryb produkcyjny:**

```bash
npm run build
npm start
# Otwórz: http://localhost:5000
```

Aplikacja w trybie dev będzie dostępna pod:

- **Frontend:** http://localhost:3000 (Vite dev server z hot reload)
- **Backend API:** http://localhost:5000

Aplikacja w trybie produkcyjnym będzie dostępna pod:

- **Frontend + Backend:** http://localhost:5000 (pliki statyczne + API)

## 📁 Import danych

1. **Tryb dev:** Uruchom `npm run dev` → otwórz http://localhost:3000
2. **Tryb prod:** Uruchom `npm start` → otwórz http://localhost:5000
3. Kliknij **"Importuj dane"** w górnym menu
4. Aplikacja automatycznie wykryje profile w folderze `data/`
5. Wybierz profile i kliknij **"Importuj"**
6. Obserwuj progress bar - import może zająć kilka minut

## 🛠️ Dostępne komendy

```bash
# Rozwój
npm run dev              # Frontend (port 3000) + backend (port 5000) - tryb dev z hot reload
npm run dev:client       # Tylko frontend (port 3000)
npm run dev:server       # Tylko backend (port 5000)

# Instalacja
npm run install:all      # Instaluj wszystkie zależności

# Import danych (alternatywnie przez CLI)
npm run import-data

# Budowanie i uruchomienie (produkcja)
npm run build           # Buduje frontend + backend
npm start               # Uruchamia aplikację produkcyjną (port 5000 - frontend + API)

# Dodatkowe komendy
npm run setup           # Instalacja wszystkich zależności + import danych
npm run dev:client      # Tylko frontend development server (port 3000)
npm run dev:server      # Tylko backend development server (port 5000)
npm run build:client    # Buduje tylko frontend
npm run build:server    # Buduje tylko backend
npm run lint            # ESLint dla frontend
npm run preview         # Preview frontend po build
```

## 🏗️ Struktura projektu

```
Spotify-summary/
├── package.json           # Root scripts + npm-run-all
├── README.md             # Dokumentacja projektu
├── .github/              # GitHub configuration & Copilot instructions
├── .vscode/              # VS Code workspace configuration
├── frontend/             # React 19.1 + TypeScript 5.8 + Vite 7.0
│   ├── src/
│   │   ├── components/   # UI komponenty (charts, filters, theme, ui/)
│   │   ├── pages/        # Dashboard, music/, podcasts/, audiobooks/
│   │   ├── context/      # LanguageContext, ProfileContext
│   │   ├── hooks/        # Custom hooks (useTheme)
│   │   └── lib/         # Utilities (utils.ts)
├── backend/              # Node.js 22.17+ + Express 4.21 + TypeScript 5.8
│   ├── src/
│   │   ├── models/       # Sequelize models (music/, podcasts/, audiobooks/, stats/, common/)
│   │   ├── routes/       # API endpoints (music/, podcasts/, audiobooks/, import.ts, stats.ts)
│   │   ├── scripts/      # Import utilities (importData.ts, runImport.ts)
│   │   ├── utils/        # ImportProgressManager, StatsAggregator
│   │   └── config/       # Database configuration
├── shared/               # Shared TypeScript types
└── data/                 # Spotify GDPR JSON files (organizacja per profil)
```

## 🔌 Główne API endpoints

**Health & System:**

- `GET /api/health` - Status aplikacji i połączenia z bazą danych

**Import & Profile Management:**

- `GET /api/import/profiles` - Lista zaimportowanych profili z bazy danych
- `GET /api/import/available` - Dostępne profile do importu w folderze `data/`
- `GET /api/import/status` - Status importu (czy trwa import)
- `GET /api/import/progress` - Postęp importu w czasie rzeczywistym (wszystkie profile)
- `GET /api/import/progress/:profileName` - Postęp importu konkretnego profilu
- `POST /api/import/profile/:profileName` - Rozpoczęcie importu profilu
- `POST /api/import/profile/:profileName/update-stats` - Aktualizacja statystyk profilu
- `DELETE /api/import/clear?profileId=X` - Usuwanie danych konkretnego profilu
- `DELETE /api/import/clear-all` - Usuwanie wszystkich danych ze wszystkich profili
- `GET /api/import/debug/data/:profileId` - Debug informacje o danych profilu

**Music Analytics & Statistics:**

- `GET /api/stats/test` - Test endpoint dla statystyk
- `GET /api/stats/overview` - Ogólne statystyki słuchania (totalPlays, minutes, artists, etc.)
- `GET /api/stats/timeline?period=day|month` - Timeline aktywności (wykresy dzienne/miesięczne)
- `GET /api/stats/yearly` - Statystyki roczne z minutami słuchania
- `GET /api/stats/countries` - Statystyki według krajów
- `GET /api/stats/time-of-day` - Wzorce słuchania według godzin
- `GET /api/stats/day-of-week` - Wzorce słuchania według dni tygodnia
- `GET /api/stats/video` - Statystyki wideo (YouTube itp.)
- `GET /api/stats/podcasts` - Ogólne statystyki podcastów

**Tracks (Utwory):**

- `GET /api/tracks` - Lista utworów z filtrowaniem i paginacją
- `GET /api/tracks/:id` - Szczegóły utworu z pełnymi statystykami
- `GET /api/tracks/:id/timeline` - Timeline konkretnego utworu (z zerami do dziś)
- `GET /api/tracks/:id/plays` - Historia odtworzeń utworu z paginacją

**Artists & Albums:**

- `GET /api/artists/top` - Top wykonawcy z liczbą odtworzeń
- `GET /api/albums/top` - Top albumy (endpoint placeholder)

**Podcasts:**

- `GET /api/podcasts/shows` - Lista podcastów/programów
- `GET /api/podcasts/shows/:showId/episodes` - Odcinki konkretnego podcastu
- `GET /api/podcasts/stats` - Ogólne statystyki podcastów
- `GET /api/podcasts/top-shows` - Najchętniej słuchane podcasty
- `GET /api/podcasts/top-episodes` - Najchętniej słuchane odcinki
- `GET /api/podcasts/daily-stats` - Dzienne statystyki podcastów
- `GET /api/podcasts/daily-stats-all` - Wszystkie dzienne statystyki podcastów
- `GET /api/podcasts/platform-stats` - Statystyki według platform
- `GET /api/podcasts/time-of-day` - Wzorce słuchania podcastów według godzin
- `GET /api/podcasts/day-of-week` - Wzorce słuchania podcastów według dni tygodnia

**Audiobooks:**

- `GET /api/audiobooks/:profileId` - Lista audiobooków dla profilu
- `GET /api/audiobooks/:profileId/audiobook/:audiobookId/plays` - Historia odtworzeń audiobooka

**Wszystkie endpointy wspierają:**

- **Multi-profile filtering:** `?profileId=10`
- **Pagination:** `?limit=50&offset=100` lub `?page=2&limit=20`
- **Sorting:** `?sortBy=totalPlays&sortOrder=desc`
- **Advanced filtering:** `?search=nazwa&minPlays=10&country=PL`
- **Real-time progress tracking** dla importów

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

## 💡 Przydatne wskazówki

### 🔧 .pgpass dla różnych systemów

- **Linux/macOS**: `~/.pgpass` (uprawnienia 600)
- **Windows**: `%APPDATA%\postgresql\pgpass.conf`
- **Format**: `hostname:port:database:username:password`
- **Przykład**: `localhost:5432:spotify_analytics:postgres:mypassword`
