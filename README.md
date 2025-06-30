# Spotify Analytics - Modern Web Application

Nowoczesna aplikacja webowa do analizy danych ze Spotify, przepisana z PHP na React + TypeScript + MongoDB.

**Aplikacja jest tylko do odczytu** - umożliwia analizę danych ze Spotify GDPR Export bez możliwości edycji.

## Technologie

### Frontend
- **React 18** - Biblioteka UI
- **TypeScript** - Typy dla JavaScript
- **Vite** - Szybkie narzędzie budowania
- **shadcn/ui** - Komponenty UI
- **Tailwind CSS** - Style i responsywność
- **React Query** - Zarządzanie stanem serwera

### Backend
- **Node.js** - Środowisko runtime
- **Express** - Framework serwera
- **TypeScript** - Typy dla backend
- **MongoDB** - Baza danych NoSQL
- **Mongoose** - ODM dla MongoDB

## Wymagania systemowe

- **Node.js** 18+ (https://nodejs.org)
- **MongoDB** 6+ (https://www.mongodb.com/try/download/community)
- **Git** (opcjonalnie)

## Instalacja

### 1. Instalacja Node.js
- **Windows**: Pobierz z https://nodejs.org (wersja LTS)
- **Ubuntu**: `sudo apt update && sudo apt install nodejs npm`

### 2. Instalacja MongoDB
- **Windows**: Pobierz MongoDB Community Server z oficjalnej strony
- **Ubuntu**: Instrukcje na https://docs.mongodb.com/manual/installation/

### 3. Instalacja zależności projektu
```bash
npm install
```

### 4. Konfiguracja bazy danych
```bash
# Uruchom MongoDB (Windows - jako serwis lub ręcznie)
# Ubuntu:
sudo systemctl start mongod
```

### 5. Import danych ze Spotify
```bash
# Umieść pliki JSON ze Spotify w folderze ./data/
npm run import-data
```

## Uruchomienie projektu

### Tryb deweloperski
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

### Tryb produkcyjny
```bash
npm run build
npm start
```

## Struktura projektu

```
├── frontend/          # Aplikacja React
│   ├── src/
│   │   ├── components/    # Komponenty React
│   │   ├── pages/         # Strony aplikacji
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Funkcje pomocnicze
│   │   └── types/         # Definicje TypeScript
├── backend/           # Serwer Express
│   ├── src/
│   │   ├── models/        # Modele MongoDB
│   │   ├── routes/        # Endpointy API
│   │   ├── middleware/    # Middleware Express
│   │   └── utils/         # Funkcje pomocnicze
├── shared/            # Współdzielone typy i utils
└── data/              # Pliki JSON ze Spotify
```

## Funkcjonalności

- 📊 Dashboard z statystykami słuchania
- 🔍 Filtrowanie i wyszukiwanie utworów
- 📱 Responsywny design
- 📈 Wykresy i wizualizacje
- 🎵 Analiza zachowań słuchania
- 🌍 Statystyki geograficzne
- 📅 Raporty roczne

## API Endpoints

- `GET /api/tracks` - Lista utworów z filtrowaniem
- `GET /api/stats/overview` - Ogólne statystyki
- `GET /api/stats/yearly` - Statystyki roczne
- `GET /api/stats/countries` - Statystyki krajów
- `GET /api/artists/top` - Top artyści
- `GET /api/albums/top` - Top albumy

## Import danych ze Spotify

1. Przejdź do ustawień prywatności Spotify
2. Złóż wniosek o dane (Artykuł 15 RODO)
3. Pobierz pliki JSON
4. Umieść je w folderze `./data/`
5. Uruchom `npm run import-data`

## Licencja

Projekt edukacyjny - do użytku osobistego.
