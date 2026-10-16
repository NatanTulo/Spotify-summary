99% AI Vibe Code - VS Code, Copilot agent mode, Claude Sonnet 4 + GPT-5 (Preview)

# 🎵 Spotify Analytics - Modern Web Application

Nowoczesna aplikacja webowa do analizy danych ze Spotify GDPR Export z pełnym systemem tłumaczeń (PL/EN). React + TypeScript + PostgreSQL.

Aplikacja analizuje eksport Spotify i pozwala importować oraz usuwać dane profili. Backend jest przeznaczony do pracy lokalnej; obecnie nie ma logowania ani uprawnień do profili.

Aktualizacja zależności i plan dalszych prac: [raport utrzymaniowy — październik 2026](docs/maintenance-2026-10.md).

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

- **Frontend:** React 19.3 + TypeScript 6.0 + Vite 8.3 (Rolldown) + Tailwind CSS 4.3
- **Backend:** Node.js 24.22 LTS + Express 5.3 + TypeScript 6.0
- **Baza:** PostgreSQL + Sequelize 6.37.8 + sequelize-typescript 2.1
- **UI:** Radix UI, komponenty shadcn/ui i Lucide React
- **Wykresy:** Recharts 3.10
- **Stan i routing:** React Context, TanStack Query 5, React Router 7
- **Bezpieczeństwo:** Helmet 8.3, CORS, express-rate-limit 8.7, compression 1.8
- **Narzędzia:** pnpm 10.34.7 (jeden workspace), ESLint 10, tsx 4.23
- **Testy:** Vitest 5, Testing Library, jsdom 30, coverage V8

## 🚀 Szybka instalacja

### 1. Wymagania

- **Node.js 24 LTS** i **pnpm**: https://pnpm.io/installation
- Repozytorium przypina pnpm 10.34.7 oraz automatycznie pobiera Node 24.22.0 do poleceń projektu. `.nvmrc` wskazuje tę samą wersję.
- **PostgreSQL**: https://www.postgresql.org/download/

### 2. Konfiguracja PostgreSQL

**Windows (PowerShell):**

```powershell
# Utwórz bazę danych (podaj hasło ustawione podczas instalacji PostgreSQL)
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres spotify_analytics
```

**Linux/macOS:**

```bash
sudo -u postgres createdb spotify_analytics
```

### 3. Instalacja i uruchomienie

```bash
# Klonowanie projektu
git clone https://github.com/NatanTulo/Spotify-summary
cd spotify-summary

# Instalacja Node.js przez pnpm (jeśli nie masz)
pnpm env use --global 24.22.0

# Instalacja zależności
pnpm install

# Konfiguracja backendu - skopiuj .env.example do .env i ustaw hasło PostgreSQL
cp backend/.env.example backend/.env
# Edytuj backend/.env: DATABASE_URL=postgresql://postgres:TWOJE_HASŁO@localhost:5432/spotify_analytics

# Uruchomienie
pnpm run dev
```

Aplikacja dostępna pod:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

### 4. Przygotowanie danych Spotify

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

### 5. Uruchomienie

**Tryb rozwoju (z hot reload):**

```bash
pnpm run dev
# Otwórz: http://localhost:3000
```

**Tryb produkcyjny:**

```bash
pnpm run build
pnpm start
# Otwórz: http://localhost:5000
```

Aplikacja w trybie dev będzie dostępna pod:

- **Frontend:** http://localhost:3000 (Vite dev server z hot reload)
- **Backend API:** http://localhost:5000

Aplikacja w trybie produkcyjnym będzie dostępna pod:

- **Frontend + Backend:** http://localhost:5000 (pliki statyczne + API)

## 📁 Import danych

CLI: `pnpm import-data` wykrywa profile w `data/`, tworzy brakujące tabele i importuje ich historię. Opcjonalnie można podać inny katalog: `pnpm import-data /sciezka/do/data`. Ponowny import zastępuje historię danego profilu, więc przed nim warto wykonać kopię bazy. Import nie jest jeszcze atomowy.

Przy pustej bazie uruchom najpierw import CLI lub tryb development; sam `pnpm start` nie tworzy schematu.

1. **Tryb dev:** Uruchom `pnpm run dev` → otwórz http://localhost:3000
2. **Tryb prod:** Uruchom `pnpm start` → otwórz http://localhost:5000
3. Kliknij **"Importuj dane"** w górnym menu
4. Aplikacja automatycznie wykryje profile w folderze `data/`
5. Wybierz profile i kliknij **"Importuj"**
6. Obserwuj progress bar - import może zająć kilka minut

## 🛠️ Dostępne komendy

```bash
# Rozwój
pnpm run dev              # Frontend (port 3000) + backend (port 5000) - tryb dev z hot reload
pnpm run dev:client       # Tylko frontend (port 3000)
pnpm run dev:server       # Tylko backend (port 5000)

# Instalacja
pnpm install              # Instaluj wszystkie zależności

# Import danych (alternatywnie przez CLI)
pnpm run import-data

# Budowanie i uruchomienie (produkcja)
pnpm run build           # Buduje frontend + backend
pnpm start               # Uruchamia aplikację produkcyjną (port 5000 - frontend + API)

# Testy
pnpm test                # Uruchom testy w trybie watch (projekty frontend/backend)
pnpm test:run            # Jednorazowe uruchomienie testów
pnpm test:coverage       # Raport pokrycia całego kodu
pnpm check               # Lint + testy + build obu części
pnpm audit               # Znane podatności zależności
pnpm run test:ui         # Uruchom testy w trybie UI (Vitest)

# Dodatkowe komendy
pnpm run setup           # Instalacja wszystkich zależności + import danych
pnpm run dev:client      # Tylko frontend development server (port 3000)
pnpm run dev:server      # Tylko backend development server (port 5000)
pnpm run build:client    # Buduje tylko frontend
pnpm run build:server    # Buduje tylko backend
pnpm run lint            # ESLint dla frontend
pnpm run preview         # Preview frontend po build
```

## 🏗️ Struktura projektu

```
Spotify-summary/
├── package.json           # Root scripts + pnpm workspace
├── README.md             # Dokumentacja projektu
├── .github/              # GitHub configuration & Copilot instructions
├── .vscode/              # VS Code workspace configuration
├── frontend/             # React 19.3 + TypeScript 6.0 + Vite 8.3
│   ├── src/
│   │   ├── components/   # UI komponenty (charts, filters, theme, ui/)
│   │   ├── pages/        # Dashboard, music/, podcasts/, audiobooks/
│   │   ├── context/      # LanguageContext, ProfileContext
│   │   ├── hooks/        # Custom hooks (useTheme)
│   │   └── lib/         # Utilities (utils.ts)
├── backend/              # Node.js 24.22 + Express 5.3 + TypeScript 6.0
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

- `GET /api/health` - Status procesu aplikacji (bez sprawdzania połączenia z bazą danych)

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
- `GET /api/stats/metadata` - Unikalne kraje i platformy (używane w filtrach)
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
cd frontend && pnpm run build

# Przy podejrzeniu uszkodzonej instalacji zachowaj lockfile
pnpm install --force --frozen-lockfile
```

### Problemy z profilami

- **Profile nie są widoczne** - Sprawdź czy są w `data/NazwaProfilu/` z plikami JSON
- **Nieprawidłowe statystyki** - Sprawdź czy profil został poprawnie zaimportowany
- **Średnie timeline błędne** - Sprawdź czy profil jest wybrany (auto-select powinien działać)

### Czyszczenie i reinstalacja

```bash
# Odtwórz instalację z wersji zapisanych w repozytorium
pnpm install --force --frozen-lockfile

# Usuwanie danych wykonuj przez interfejs aplikacji po zrobieniu kopii bazy.
```

## 💡 Przydatne wskazówki

### 🔧 .pgpass dla różnych systemów

- **Linux/macOS**: `~/.pgpass` (uprawnienia 600)
- **Windows**: `%APPDATA%\postgresql\pgpass.conf`
- **Format**: `hostname:port:database:username:password`
- **Przykład**: `localhost:5432:spotify_analytics:postgres:mypassword`
