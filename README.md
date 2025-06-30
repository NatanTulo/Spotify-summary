# Spotify Analytics - Modern Web Application

Nowoczesna aplikacja webowa do analizy danych ze Spotify, przepisana z PHP na React + TypeScript + MongoDB.

**Aplikacja jest tylko do odczytu** - umożliwia analizę danych ze Spotify GDPR Export bez możliwości edycji lub modyfikacji danych.

## ✨ Kluczowe funkcjonalności

### 📊 Kompleksowa analiza danych Spotify
- **Multi-profile support** - Obsługa wielu profili z jednego eksportu GDPR
- **Inteligentny import** - Automatyczne wykrywanie i kategoryzowanie plików JSON
- **Real-time progress** - Progressbar podczas importu z możliwością anulowania
- **Zagregowane statystyki** - Przygotowane modele dla szybkich zapytań

### 🎵 Zaawansowana lista utworów
- **Rozwijane wiersze** - Timeline odtworzeń w formie wykresu słupkowego
- **Dynamiczne kolumny** - Wybór spośród 19 dostępnych kolumn danych
- **Sortowanie i filtrowanie** - Według wszystkich dostępnych kryteriów
- **Responsywny design** - Pełna funkcjonalność na desktop i mobile

### 🌐 Wielojęzyczność i UI
- **PL/EN interface** - Przełączanie języka w locie
- **Ciemny motyw granatowy** - Przyjazny dla oczu dark theme
- **shadcn/ui components** - Nowoczesne, spójne komponenty UI
- **Inteligentne placeholdery** - Elegancka obsługa braku danych

### 📈 Dashboard i statystyki
- **Statystyki roczne i krajowe** - Zagregowane dane z wykresami
- **Top artyści i albumy** - Najpopularniejsze treści
- **Timeline analysis** - Historia słuchania w czasie
- **Skip rate analysis** - Analiza pomijanych utworów

## Technologie

### Frontend
- **React 18** - Biblioteka UI
- **TypeScript** - Typy dla JavaScript
- **Vite** - Szybkie narzędzie budowania
- **shadcn/ui** - Komponenty UI
- **Tailwind CSS** - Style i responsywność
- **React Query** - Zarządzanie stanem serwera

### Backend
- **Node.js 18+** - Środowisko runtime
- **Express + TypeScript** - Framework serwera
- **MongoDB + Mongoose** - Baza danych NoSQL z ODM
- **Zagregowane statystyki** - Pre-computed models dla wydajności

### Dodatkowe narzędzia
- **Concurrently** - Równoczesne uruchamianie frontend/backend
- **Recharts** - Wykresy i wizualizacje
- **Lucide React** - Ikony UI

## 🔧 Dostępne dane z Spotify GDPR

Aplikacja obsługuje wszystkie pola z plików `Streaming_History_Audio_*.json`:

### Podstawowe informacje
- **trackName, artistName, albumName** - Identyfikacja utworu
- **msPlayed** - Czas odtwarzania w milisekundach
- **endTime** - Timestamp zakończenia odtwarzania

### Szczegółowe metadane
- **platform** - Platforma odtwarzania (desktop, mobile, web, etc.)
- **country** - Kod kraju odtwarzania (ISO 2-letter)
- **ipAddrDecrypted** - Adres IP (jeśli dostępny)
- **userAgent** - Informacje o przeglądarce/aplikacji
- **username** - Nazwa użytkownika Spotify

### Analiza zachowań
- **reasonStart** - Powód rozpoczęcia (clickrow, fwdbtn, etc.)
- **reasonEnd** - Powód zakończenia (endplay, logout, etc.)
- **shuffle** - Czy włączony tryb losowy
- **skipped** - Czy utwór został pominięty
- **offline** - Czy odtwarzany offline
- **offlineTimestamp** - Timestamp offline cache
- **incognitoMode** - Czy tryb prywatny był aktywny

### Agregowane statystyki (generowane przez aplikację)
- **totalPlays** - Łączna liczba odtworzeń
- **totalMinutes** - Łączny czas słuchania
- **avgPlayDuration** - Średni czas odtwarzania
- **skipPercentage** - Procent pominiętych odtworzeń
- **firstPlay/lastPlay** - Pierwsze i ostatnie odtworzenie
- **platforms/countries** - Unikalne platformy i kraje

## Wymagania systemowe

- **Node.js** 18+ (https://nodejs.org)
- **MongoDB** 6+ (https://www.mongodb.com/try/download/community)
- **Git** (opcjonalnie)

## 🚀 Instalacja i uruchomienie

### Szybki start
```bash
# 1. Klonowanie/pobranie projektu
git clone <repo-url>
cd spotify-analytics

# 2. Instalacja wszystkich zależności
npm run install:all

# 3. Uruchomienie MongoDB (Windows - jako serwis, Linux - systemctl)
# Windows: MongoDB powinno uruchomić się automatycznie jako serwis
# Linux: sudo systemctl start mongod

# 4. Uruchomienie aplikacji (frontend + backend)
npm run dev
```

Aplikacja będzie dostępna pod adresem: http://localhost:5173

### Szczegółowa instalacja

#### 1. Wymagania systemowe
- **Node.js 18+** - https://nodejs.org (pobierz wersję LTS)
- **MongoDB 6+** - https://www.mongodb.com/try/download/community
- **Git** (opcjonalnie) - do klonowania repozytorium

#### 2. Instalacja Node.js
**Windows:**
1. Pobierz instalator z https://nodejs.org
2. Uruchom plik .msi i postępuj zgodnie z instrukcjami
3. Sprawdź instalację: `node --version` i `npm --version`

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 3. Instalacja MongoDB
**Windows:**
1. Pobierz MongoDB Community Server z oficjalnej strony
2. Zainstaluj z opcją "Install MongoDB as a Service"
3. MongoDB uruchomi się automatycznie

**Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### 4. Konfiguracja projektu
```bash
# Instalacja zależności dla wszystkich modułów
npm run install:all

# Alternatywnie ręcznie:
npm install                 # Root dependencies
cd frontend && npm install  # Frontend dependencies  
cd ../backend && npm install # Backend dependencies
```

## 📁 Import danych ze Spotify

### 1. Uzyskanie danych GDPR ze Spotify
1. Przejdź do **Account Privacy Settings** na https://www.spotify.com/account/privacy/
2. Przewiń do sekcji **"Download your data"**
3. Zaznacz **"Extended streaming history"** - zawiera szczegółowe dane
4. Kliknij **"Request data"**
5. Spotify wyśle e-mail z linkiem do pobrania (może zająć do 30 dni)

### 2. Przygotowanie danych
1. Pobierz plik ZIP od Spotify
2. Rozpakuj i znajdź pliki `Streaming_History_Audio_*.json`
3. Stwórz strukturę folderów w projekcie:
```
data/
├── ProfileName1/
│   ├── Streaming_History_Audio_2021_3.json
│   ├── Streaming_History_Audio_2022_4.json
│   └── ...
├── ProfileName2/
│   ├── Streaming_History_Audio_2023_5.json
│   └── ...
```

### 3. Import przez aplikację (zalecane)
1. Uruchom aplikację: `npm run dev`
2. Przejdź do http://localhost:5173
3. Kliknij **"Importuj dane"** w górnym menu
4. Aplikacja automatycznie:
   - Wykryje profile w folderze `data/`
   - Pokaże listę dostępnych profili
   - Umożliwi import z progressbarem
   - Zagreguje statystyki

### 4. Import przez CLI (alternatywnie)
```bash
# Import wszystkich profili
npm run import-data

# Lub bezpośrednio:
cd backend && npm run import-data
```

### 5. Obsługa wielu profili
- Aplikacja automatycznie wykrywa foldery jako profile
- Każdy profil to oddzielny folder w `data/`
- Można przełączać między profilami w interfejsie
- Statystyki są oddzielnie agregowane dla każdego profilu

## 💻 Uruchomienie aplikacji

### Tryb deweloperski (zalecany)
```bash
# Uruchomienie frontend + backend jednocześnie
npm run dev
```
Aplikacja będzie dostępna pod adresem: http://localhost:5173

### Ręczne uruchomienie w oddzielnych terminalach
```bash
# Terminal 1 - Backend API (port 5000)
npm run dev:server

# Terminal 2 - Frontend dev server (port 5173)  
npm run dev:client
```

### Tryb produkcyjny
```bash
# Budowanie aplikacji
npm run build

# Uruchomienie serwera produkcyjnego
npm start
```

### Dostępne porty
- **Frontend**: http://localhost:5173 (dev) / http://localhost:5000 (prod)
- **Backend API**: http://localhost:5000/api
- **MongoDB**: mongodb://localhost:27017/spotify-analytics

## 🎛️ Instrukcja obsługi

### 1. Pierwszy uruch
1. Po uruchomieniu aplikacji zobaczysz komunikat o braku danych
2. Kliknij **"Importuj dane"** w górnym menu
3. Jeśli masz dane w folderze `data/`, zobaczysz listę dostępnych profili
4. Wybierz profile do zaimportowania i kliknij **"Importuj"**
5. Obserwuj postęp importu na progressbarze

### 2. Nawigacja po aplikacji

#### **Dashboard** - Główny panel statystyk
- Przegląd ogólnych statystyk słuchania
- Wykresy aktywności w czasie
- Top artyści i albumy
- Statystyki geograficzne

#### **Lista utworów** - Szczegółowa analiza
- **Sortowanie**: Kliknij nagłówki kolumn
- **Filtrowanie**: Użyj pól wyszukiwania i filtrów
- **Wybór kolumn**: Kliknij ikonę ⚙️ aby wybrać z 19 dostępnych kolumn
- **Timeline utworu**: Kliknij wiersz utworu aby zobaczyć wykres odtworzeń w czasie

### 3. Przełączanie profili
- Użyj dropdown **"Wybierz profil"** w górnym menu
- Wszystkie statystyki i listy automatycznie się zaktualizują
- Możesz porównywać różne profile

### 4. Język interfejsu
- Kliknij przycisk **PL/EN** w górnym menu
- Interfejs natychmiast się przetłumaczy
- Język jest zapamiętywany w sesji

### 5. Ciemny motyw
- Aplikacja używa granatowego ciemnego motywu
- Automatycznie dostosowuje się do preferencji systemowych
- Kolory wykresów są zoptymalizowane pod ciemny schemat

## 🏗️ Struktura projektu

```
spotify-analytics/
├── package.json           # Root package.json z scripts
├── README.md             # Dokumentacja
├── .gitignore            # Git ignore rules
│
├── frontend/             # React + TypeScript + Vite
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── components.json   # shadcn/ui config
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── components/
│       │   ├── ui/           # shadcn/ui components
│       │   ├── Layout.tsx    # Main layout with header
│       │   ├── TracksList.tsx # Enhanced tracks table
│       │   ├── ProfileManager.tsx
│       │   ├── charts/       # Chart components
│       │   └── filters/      # Filter components
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   └── Analytics.tsx
│       ├── context/
│       │   ├── LanguageContext.tsx # PL/EN translations
│       │   └── ProfileContext.tsx  # Profile management
│       ├── hooks/
│       │   └── useTheme.ts
│       └── lib/
│           └── utils.ts
│
├── backend/              # Node.js + Express + TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts      # Server entry point
│       ├── config/
│       │   └── database.ts
│       ├── models/       # Mongoose schemas
│       │   ├── Track.ts
│       │   ├── Artist.ts
│       │   ├── Album.ts
│       │   ├── Play.ts
│       │   ├── Profile.ts
│       │   └── *Stats.ts # Aggregated statistics
│       ├── routes/       # API endpoints
│       │   ├── tracks.ts
│       │   ├── artists.ts
│       │   ├── albums.ts
│       │   ├── stats.ts
│       │   └── import.ts
│       ├── scripts/      # Data import utilities
│       │   ├── importData.ts
│       │   └── runImport.ts
│       └── utils/
│           ├── ImportProgressManager.ts
│           └── StatsAggregator.ts
│
├── shared/               # Shared TypeScript types
│   └── types.ts
│
├── data/                 # Spotify GDPR JSON files
│   ├── Profile1/
│   │   ├── Streaming_History_Audio_*.json
│   │   └── ReadMeFirst_*.pdf
│   └── Profile2/
│       └── Streaming_History_Audio_*.json
│
└── .vscode/             # VS Code configuration
    ├── settings.json
    ├── extensions.json
    └── tasks.json
```

## 🔌 API Dokumentacja

### Tracks Endpoints
- `GET /api/tracks` - Lista utworów z filtrowaniem i paginacją
  - Parametry: `page`, `limit`, `search`, `minPlays`, `sortBy`, `sortOrder`, `profileId`
  - Zwraca: Zagregowane statystyki, wszystkie 19 kolumn danych
- `GET /api/tracks/:id` - Szczegóły konkretnego utworu
- `GET /api/tracks/:id/timeline` - Timeline odtworzeń utworu (wykres)

### Statistics Endpoints  
- `GET /api/stats/overview` - Ogólne statystyki słuchania
- `GET /api/stats/yearly` - Statystyki roczne z podziałem na lata
- `GET /api/stats/countries` - Statystyki geograficzne
- `GET /api/stats/timeline` - Timeline aktywności

### Artists & Albums
- `GET /api/artists/top` - Top wykonawcy
- `GET /api/albums/top` - Top albumy

### Profile Management
- `GET /api/import/profiles` - Lista dostępnych profili
- `GET /api/import/profile/:profileName` - Statystyki konkretnego profilu

### Import System
- `GET /api/import/status` - Status systemu importu
- `POST /api/import/start` - Rozpoczęcie importu danych
- `DELETE /api/import/clear` - Czyszczenie bazy danych
- `GET /api/import/progress` - Postęp importu (real-time)
- `DELETE /api/import/progress` - Anulowanie importu

## 🎨 Funkcjonalności UI

### Lista utworów (TracksList)
- **19 dostępnych kolumn** - Pełne dane z Spotify GDPR
- **Dynamiczny wybór kolumn** - Personalizacja widoku
- **Rozwijane wiersze** - Timeline odtworzeń jako wykres słupkowy
- **Inteligentne sortowanie** - Według wszystkich dostępnych pól
- **Responsywny design** - Działa na desktop i mobile
- **Lokalizacja PL/EN** - Tłumaczone nazwy kolumn i tooltips

### Dashboard i statystyki
- **Interaktywne wykresy** - Recharts z ciemnym motywem
- **Zagregowane dane** - Szybkie ładowanie dzięki pre-computed stats
- **Profile switching** - Porównywanie różnych użytkowników
- **Real-time updates** - Automatyczne odświeżanie po imporcie

### Import i zarządzanie danymi
- **Wykrywanie profili** - Automatyczne skanowanie folderów
- **Progress tracking** - Real-time progressbar z możliwością anulowania
- **Error handling** - Elegancka obsługa błędów importu
- **Batch processing** - Wydajny import dużych plików JSON

## 🛠️ Dostępne komendy NPM

```bash
# Rozwój
npm run dev              # Uruchom frontend + backend
npm run dev:client       # Tylko frontend (port 5173)
npm run dev:server       # Tylko backend (port 5000)

# Budowanie
npm run build            # Build frontend + backend
npm run build:client     # Build tylko frontend
npm run build:server     # Build tylko backend

# Instalacja
npm run install:all      # Instaluj wszystkie zależności
npm run setup           # install:all + import-data

# Import danych
npm run import-data      # Import wszystkich profili z folderu data/

# Produkcja
npm start               # Uruchom zbudowaną aplikację
```

## 🐛 Rozwiązywanie problemów

### Port już zajęty
```bash
# Windows - zabij proces na porcie 5000
taskkill /F /PID (netstat -ano | findstr :5000)

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### MongoDB nie uruchamia się
```bash
# Windows - restart serwisu
net stop MongoDB && net start MongoDB

# Linux
sudo systemctl restart mongod
sudo systemctl status mongod
```

### Błędy importu danych
1. Sprawdź czy pliki JSON są w poprawnym formacie Spotify
2. Upewnij się że MongoDB działa
3. Sprawdź logi w konsoli podczas importu
4. Spróbuj wyczyścić bazę: kliknij "Wyczyść dane" w interfejsie

### Problemy z frontendem
```bash
# Wyczyść cache i reinstaluj
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Problemy z backendem
```bash
# Sprawdź czy wszystkie dependencies są zainstalowane
cd backend
npm install
npm run build  # Sprawdź błędy kompilacji TypeScript
```

## 📊 Przykładowe statystyki

Po zaimportowaniu danych zobaczysz m.in.:
- **Łączny czas słuchania** w minutach i godzinach
- **Najpopularniejsze utwory** z liczbą odtworzeń
- **Top artyści** z czasem słuchania
- **Statystyki pomijania** - które utwory są często skipowane
- **Analiza geograficzna** - z jakich krajów słuchasz
- **Timeline aktywności** - wzorce słuchania w czasie
- **Platform analysis** - desktop vs mobile vs web
- **Offline vs online** - analiza trybów słuchania

## 🔐 Prywatność i bezpieczeństwo

- **Tylko lokalne dane** - nic nie jest wysyłane do zewnętrznych serwerów
- **Baza danych lokalna** - MongoDB na Twoim komputerze
- **Brak rejestracji** - nie potrzebujesz konta ani logowania
- **Open source** - kod jest dostępny do przeglądu
- **Read-only** - aplikacja tylko odczytuje dane, nie modyfikuje

## 👨‍💻 Rozwój projektu

### Wymagania deweloperskie
- Node.js 18+
- MongoDB 6+
- Git
- VS Code (zalecane) z rozszerzeniami TypeScript i React

### Struktura bazy danych
- **Kolekcje**: artists, albums, tracks, plays, profiles
- **Agregowane statystyki**: dailyStats, yearlyStats, countryStats, artistStats
- **Indeksy**: Zoptymalizowane dla częstych zapytań

### Architektura
- **Frontend**: React SPA z client-side routing
- **Backend**: RESTful API z Express
- **Database**: MongoDB z agregowanymi widokami
- **Real-time**: Progress tracking podczas importu

## 📄 Licencja

Projekt edukacyjny na licencji MIT - do użytku osobistego i nauki.

---

**Autor**: Natan Tułodziecki  
**Ostatnia aktualizacja**: Czerwiec 2025  
**Wersja**: 1.0.0
