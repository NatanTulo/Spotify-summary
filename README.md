# Spotify Analytics - Modern Web Application

Nowoczesna aplikacja webowa do analizy danych ze Spotify GDPR Export. React + TypeScript + PostgreSQL.

**Aplikacja jest tylko do odczytu** - analizuje dane bez możliwości ich modyfikacji.

## ✨ Główne funkcjonalności

- **Multi-profile support** - Obsługa wielu profili użytkowników
- **Real-time import** - Progress bar podczas importu z możliwością anulowania
- **Zaawansowana lista utworów** - 19 kolumn danych, sortowanie, filtrowanie, timeline
- **Dashboard** - Statystyki, wykresy, top listy
- **Wielojęzyczność** - PL/EN interface
- **Ciemny motyw** - Przyjazny dla oczu design

## 🚀 Szybka instalacja (nowy komputer)

### 1. Wymagania systemowe

```bash
# Sprawdź czy masz zainstalowane:
node --version    # Potrzebne: 18+
psql --version    # Potrzebne: PostgreSQL 17+
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

### 3. Konfiguracja .pgpass (ważne!)

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

### 6. Uruchomienie

```bash
# Uruchom aplikację (frontend + backend)
npm run dev
```

Aplikacja będzie dostępna pod: **http://localhost:5173**

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
npm run dev:client       # Tylko frontend (port 5173)
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

- `GET /api/tracks` - Lista utworów (filtry, paginacja, sortowanie)
- `GET /api/stats/overview` - Ogólne statystyki słuchania
- `GET /api/stats/timeline` - Timeline aktywności (wykresy)
- `GET /api/artists/top` - Top wykonawcy
- `GET /api/import/profiles` - Lista profili
- `POST /api/import/start` - Rozpoczęcie importu
- `GET /api/import/progress` - Postęp importu (real-time)

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
```

### Port zajęty

```bash
# Linux/Mac - zabij proces na porcie 5000
lsof -ti:5000 | xargs kill -9

# Windows
taskkill /F /PID (netstat -ano | findstr :5000)
```

### Błędy importu

1. Sprawdź czy PostgreSQL działa
2. Sprawdź `.pgpass` - czy hasło jest prawidłowe
3. Sprawdź czy pliki JSON są w folderze `data/`
4. Sprawdź logi w konsoli podczas importu

### Czyszczenie i reinstalacja

```bash
# Wyczyść cache NPM
rm -rf node_modules package-lock.json
npm run install:all

# Reset bazy danych (jeśli potrzebne)
# W aplikacji: "Zarządzaj danymi" → "Wyczyść wszystkie dane"
```

## 💡 Przydatne wskazówki

### .pgpass dla różnych systemów

- **Linux**: `~/.pgpass`
- **Windows**: `%APPDATA%\postgresql\pgpass.conf`
- **Format**: `hostname:port:database:username:password`
- **Uprawnienia**: 600 (tylko właściciel może czytać)

### Optymalizacja importu

- Większe pliki JSON mogą zająć 10-30 minut importu
- Progress bar pokazuje aktualny postęp
- Można anulować import w każdej chwili
- Import można wznowić - aplikacja pominie już zaimportowane dane

### Multi-profile setup

- Każdy folder w `data/` = osobny profil
- Można przełączać między profilami w interfejsie
- Statystyki są oddzielnie liczone dla każdego profilu
- Można porównywać różne profile

## 📊 Co zobaczysz po imporcie

- **Łączny czas słuchania** w minutach i godzinach
- **Top utwory/artyści** z liczbą odtworzeń
- **Timeline aktywności** - wzorce słuchania w czasie
- **Statystyki pomijania** - które utwory są często skipowane
- **Analiza geograficzna** - kraje odtwarzania
- **Platform analysis** - desktop vs mobile vs web
- **19 kolumn szczegółowych danych** z możliwością sortowania/filtrowania
