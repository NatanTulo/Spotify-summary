# Spotify Analytics - Modern Web Application

Nowoczesna aplikacja webowa do analizy danych ze Spotify GDPR Export. React + TypeScript + PostgreSQL.

**Aplikacja jest tylko do odczytu** - analizuje dane bez możliwości ich modyfikacji.

## ✨ Główne funkcjonalności

- **Multi-profile support** - Obsługa wielu profili użytkowników
- **Real-time import** - Progress bar podczas importu z możliwością anulowania
- **Zaawansowana lista utworów** - 19 kolumn danych, sortowanie, filtrowanie, timeline
- **Dashboard** - Statystyki, wykresy, top listy
- **Analytics** - Timeline aktywności, wzorce słuchania
- **Wielojęzyczność** - PL/EN interface
- **Ciemny motyw** - Przyjazny dla oczu design

## 🏗️ Architektura techniczna

- **Frontend:** React 19.1 + TypeScript 5.8 + Vite 7.0 + Tailwind CSS 3.4
- **Backend:** Node.js 22.17 + Express 4.21 + TypeScript 5.8
- **Database:** PostgreSQL 16.9 z Sequelize 6.37 ORM
- **UI Library:** Radix UI (@radix-ui) + shadcn/ui components
- **Charts:** Recharts 3.0 dla wizualizacji danych
- **Dev Tools:** tsx 4.20, ESLint 9.30, Axios 1.10

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

### 6. Uruchomienie

```bash
# Uruchom aplikację (frontend + backend)
npm run dev
```

Aplikacja będzie dostępna pod: **http://localhost:3000**

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

- `GET /api/import/profiles` - Lista profili
- `GET /api/import/available` - Dostępne profile do importu
- `POST /api/import/profile/:name` - Rozpoczęcie importu
- `GET /api/import/progress` - Postęp importu (real-time)
- `DELETE /api/import/clear` - Usuwanie profili

**Analytics & Statistics:**

- `GET /api/stats/overview` - Ogólne statystyki słuchania
- `GET /api/stats/timeline` - Timeline aktywności (wykresy dzienne)
- `GET /api/tracks` - Lista utworów (filtry, paginacja, sortowanie)
- `GET /api/artists/top` - Top wykonawcy

**Wszystkie endpointy wspierają:**

- Multi-profile filtering (`?profileId=10`)
- Pagination (`?limit=50&offset=100`)
- Sorting (`?sortBy=totalPlays&sortOrder=desc`)
- Real-time progress tracking

## ✅ Naprawione problemy i ulepszenia

### Timeline & Analytics

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

- **Health check:** `{"status":"OK",...}`
- **Profiles:** Lista profili z statystykami
- **Timeline:** Array dni z plays/minutes
- **Average plays:** ~60-70 na dzień (nie 1000+)
- **Frontend:** Dashboard ładuje się bez błędów, profile są automatycznie wybrane

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

### Dashboard

- **Łączny czas słuchania** w minutach i godzinach
- **Top utwory/artyści** z liczbą odtworzeń
- **Statystyki platformy** - desktop vs mobile vs web
- **Wybór profilu** - przełączanie między różnymi profilami

### Analytics

- **Timeline aktywności** - wzorce słuchania w czasie (dzienna skala)
- **Średnie odtworzenia** - ~60-70 utworów dziennie (aktywne dni)
- **Trendy miesięczne/roczne** - wzrost/spadek aktywności
- **Wykresy interaktywne** - zoom, hover, legendy

### Lista utworów (19 kolumn)

- **Podstawowe:** Nazwa, Artysta, Album, Rok wydania
- **Statystyki odtworzeń:** Łączne, Unique plays, Skips
- **Dane czasowe:** Pierwsze/ostatnie odtworzenie, średni czas
- **Platform info:** Spotify URI, Country, Platform
- **Filtrowanie i sortowanie** - według dowolnej kolumny
- **Paginacja** - obsługa dużych zbiorów danych

### Import Management

- **Progress bars** - real-time tracking importu
- **Multi-profile** - importuj wiele profili jednocześnie
- **Resume capability** - wznów przerwany import
- **Data validation** - automatyczne sprawdzanie poprawności plików JSON

## 🎯 Zalecane przepływy pracy

### Pierwszy raz z aplikacją

1. **Setup PostgreSQL** + `.pgpass`
2. **Import pierwszego profilu** - obserwuj progress bar
3. **Sprawdź Dashboard** - podstawowe statystyki
4. **Przejdź do Analytics** - timeline i wzorce
5. **Eksploruj listę utworów** - filtrowanie i sortowanie

### Dodawanie kolejnych profili

1. **Dodaj folder do `data/`** z plikami JSON
2. **Kliknij "Zarządzaj danymi"** → wykryj nowe profile
3. **Importuj równolegle** - wiele progress barów
4. **Porównuj statystyki** - przełączaj między profilami

### Analiza długoterminowa

1. **Timeline patterns** - kiedy słuchasz najwięcej
2. **Artist evolution** - jak zmienia się twój gust
3. **Platform analysis** - gdzie słuchasz najczęściej
4. **Skip patterns** - które utwory pomijasz

---

## 📝 Historia zmian

**v2.0 (6 lipca 2025) - PostgreSQL Migration**

- ✅ Pełna migracja z MongoDB na PostgreSQL
- ✅ Naprawiono problem z timeline średnimi (61 zamiast 1708)
- ✅ Auto-select pierwszego profilu
- ✅ Progress bars dla multi-profile import
- ✅ TypeScript compilation errors naprawione
- ✅ Real-time synchronizacja profili
- ✅ Optimized database indexes i queries

**v1.x - MongoDB Era**

- Podstawowa funkcjonalność z MongoDB
- Single profile support
- Manual profile selection

---

**Projekt gotowy do produkcji!** 🎉
