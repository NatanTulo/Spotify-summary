# 🎵 Spotify Analytics - Instrukcje instalacji

**Spotify Analytics** to aplikacja webowa do analizy danych ze Spotify GDPR Export.
Aplikacja umożliwia **tylko odczyt danych** - służy do analizy, nie do edycji.

## Wymagania wstępne

### 1. Instalacja Node.js
- **Windows**: Przejdź na https://nodejs.org i pobierz najnowszą wersję LTS (18.x lub nowszą)
- **Ubuntu**: 
  ```bash
  sudo apt update
  sudo apt install nodejs npm
  node --version  # Sprawdź wersję (powinno być 18+)
  npm --version
  ```

### 2. Instalacja MongoDB
- **Windows**: 
  1. Pobierz MongoDB Community Server: https://www.mongodb.com/try/download/community
  2. Zainstaluj jako serwis Windows
  3. MongoDB będzie dostępne na `mongodb://localhost:27017`
- **Ubuntu**:
  ```bash
  # Dodaj klucz MongoDB
  wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
  
  # Dodaj repozytorium
  echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
  
  # Instaluj MongoDB
  sudo apt update
  sudo apt install -y mongodb-org
  
  # Uruchom MongoDB
  sudo systemctl start mongod
  sudo systemctl enable mongod
  ```

## Instalacja projektu

### Krok 1: Instalacja zależności
```bash
# W głównym folderze projektu
npm run install:all
```

### Krok 2: Konfiguracja środowiska
```bash
# Skopiuj plik konfiguracyjny
cd backend
cp .env.example .env

# Edytuj .env jeśli potrzeba (domyślne ustawienia powinny działać)
```

### Krok 3: Przygotowanie danych ze Spotify
1. Przejdź do ustawień prywatności Spotify: https://www.spotify.com/account/privacy/
2. Złóż wniosek o "Rozszerzoną historię odtwarzania" (może potrwać do 30 dni)
3. Po otrzymaniu plików JSON, umieść je w folderze `./data/`
4. Uruchom import:
   ```bash
   npm run import-data
   ```

### Krok 4: Uruchomienie aplikacji
```bash
# Tryb deweloperski (uruchamia frontend i backend)
npm run dev

# Lub oddzielnie:
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend  
npm run dev:client
```

## Dostęp do aplikacji
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health check**: http://localhost:5000/api/health

## Rozwiązywanie problemów

### Problem: "npx nie jest rozpoznany"
**Rozwiązanie**: Zainstaluj Node.js ze strony https://nodejs.org

### Problem: "Błąd połączenia z MongoDB"
**Rozwiązanie**: 
- Windows: Sprawdź czy MongoDB jest uruchomiony jako serwis
- Ubuntu: `sudo systemctl start mongod`

### Problem: Port 3000 lub 5000 zajęty
**Rozwiązanie**: Zmień porty w plikach konfiguracyjnych:
- Frontend: `frontend/vite.config.ts`
- Backend: `backend/.env`

### Problem: Błędy TypeScript
**Rozwiązanie**: 
```bash
# Zainstaluj ponownie zależności
rm -rf node_modules frontend/node_modules backend/node_modules
npm run install:all
```

## Przydatne komendy

```bash
# Kompilacja projektu
npm run build

# Produkcja
npm start

# Tylko import danych
npm run import-data

# Sprawdzenie statusu MongoDB
# Windows - Menedżer usług
# Ubuntu
sudo systemctl status mongod
```

## Struktura danych ze Spotify

Pliki JSON powinny zawierać strukturę podobną do:
```json
{
  "ts": "2023-01-01 12:00:00",
  "master_metadata_track_name": "Nazwa utworu",
  "master_metadata_album_artist_name": "Nazwa artysty", 
  "master_metadata_album_album_name": "Nazwa albumu",
  "ms_played": 180000,
  "conn_country": "PL",
  "platform": "desktop"
}
```

## Pomoc
Jeśli masz problemy:
1. Sprawdź czy wszystkie wymagania są spełnione
2. Upewnij się, że MongoDB jest uruchomiony
3. Sprawdź logi w terminalu
4. Upewnij się, że porty 3000 i 5000 są wolne
