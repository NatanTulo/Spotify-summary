# 🚀 Instrukcje uruchomienia projektu Spotify Analytics

**Spotify Analytics** to nowoczesna aplikacja webowa do analizy danych ze Spotify GDPR Export. 
Aplikacja umożliwia **tylko odczyt i analizę danych** - nie pozwala na ich edycję.

## ✅ Co zostało usunięte z aplikacji

- **Usunięte funkcje edycji danych**: Wszystkie endpointy do dodawania, edytowania i usuwania pojedynczych utworów z backendu
- **Usunięte funkcje GUI**: Przyciski edycji, zaznaczanie utworów, generowanie raportów
- **Usunięte przykładowe dane**: Zastąpione wywołaniami API lub elegantnymi placeholderami (——)
- **Pozostawiona funkcja czyszczenia**: Tylko możliwość wyczyszczenia całej bazy danych do nowego importu

Aplikacja teraz służy wyłącznie do **analizy i wizualizacji** danych ze Spotify.

## ⚠️ Ważne - następne kroki

Projekt został skonfigurowany, ale musisz wykonać kilka kroków, aby wszystko działało:

### 1. Zrestartuj VS Code
Po instalacji Node.js, **zrestartuj całkowicie VS Code**, żeby path do npm został odświeżony.

### 2. Zainstaluj zależności
Gdy VS Code się zrestartuje, otwórz terminal (Ctrl+`) i wykonaj:

```bash
# W głównym folderze projektu
npm run install:all
```

To zainstaluje wszystkie potrzebne pakiety dla frontend i backend.

### 3. Zainstaluj MongoDB
- **Windows**: Pobierz MongoDB Community Server z https://www.mongodb.com/try/download/community
- **Ubuntu**: 
  ```bash
  sudo apt update
  sudo apt install -y mongodb
  sudo systemctl start mongodb
  ```

### 4. Skopiuj plik konfiguracyjny
```bash
cd backend
cp .env.example .env
```

### 5. Sprawdź czy wszystko działa
```bash
# Sprawdź czy MongoDB działa
# Windows: Sprawdź w Menedżerze usług lub Menedżerze zadań
# Ubuntu:
sudo systemctl status mongodb

# Uruchom projekt
npm run dev
```

## 📁 Co zostało utworzone

### Frontend (React + TypeScript + Vite)
- ✅ Konfiguracja Vite z TypeScript
- ✅ Tailwind CSS + shadcn/ui komponenty
- ✅ Routing z React Router
- ✅ React Query do zarządzania stanem
- ✅ Layout i podstawowy Dashboard
- ✅ Responsywny design

### Backend (Node.js + Express + MongoDB)
- ✅ Express server z TypeScript
- ✅ MongoDB z Mongoose ODM
- ✅ Modele danych (Artist, Album, Track, Play)
- ✅ API routes dla utworów i statystyk
- ✅ CORS, security middleware
- ✅ Rate limiting

### Struktura bazy danych
```
artists     - Artyści
albums      - Albumy (referencja do artystów)
tracks      - Utwory (referencja do albumów)
plays       - Odtworzenia (referencja do utworów)
```

## 🎯 Następne funkcjonalności do dodania

Po uruchomieniu podstawowej aplikacji można dodać:

1. **Import danych ze Spotify JSON** - skrypt do wczytywania plików GDPR
2. **Więcej statystyk** - roczne podsumowania, analiza krajów
3. **Wykresy** - używając Recharts
4. **Filtrowanie** - zaawansowane filtry w interfejsie
5. **Eksport raportów** - generowanie PDF/CSV

## 🔧 Dostępne komendy

```bash
# Instalacja wszystkich zależności
npm run install:all

# Rozwój (uruchamia frontend i backend)
npm run dev

# Tylko frontend (port 3000)
npm run dev:client

# Tylko backend (port 5000)  
npm run dev:server

# Budowanie do produkcji
npm run build

# Uruchomienie produkcji
npm start

# Import danych ze Spotify (po utworzeniu skryptu)
npm run import-data
```

## 📋 Checklisty

### Przed pierwszym uruchomieniem:
- [ ] Node.js zainstalowany (node --version działa)
- [ ] MongoDB zainstalowany i uruchomiony
- [ ] VS Code zrestartowany po instalacji Node.js
- [ ] `npm run install:all` wykonane pomyślnie
- [ ] Plik `backend/.env` skopiowany z `.env.example`

### Sprawdzenie czy działa:
- [ ] http://localhost:3000 - frontend React
- [ ] http://localhost:5000/api/health - backend health check
- [ ] Brak błędów w terminalu

## 🎵 Import danych ze Spotify

1. **Złóż wniosek na Spotify**:
   - Idź na https://www.spotify.com/account/privacy/
   - Kliknij "Poproś o dane" 
   - Wybierz "Rozszerzona historia odtwarzania"
   - Czekaj do 30 dni na email

2. **Umieść pliki JSON w folderze**:
   ```
   ./data/
   ├── endsong_0.json
   ├── endsong_1.json
   └── ...
   ```

3. **Import przez interfejs aplikacji**:
   - Uruchom aplikację na http://localhost:3000
   - Przejdź do sekcji "Import danych ze Spotify"
   - Kliknij "Importuj dane" aby załadować pliki JSON do bazy
   - **Dane mogą być tylko importowane, nie edytowane** - aplikacja służy do analizy

## 🛠️ Rozwiązywanie problemów

**"npm nie jest rozpoznany"** → Zrestartuj VS Code po instalacji Node.js

**"MongoDB connection failed"** → Sprawdź czy MongoDB jest uruchomiony

**"Port 3000 zajęty"** → Zmień port w `frontend/vite.config.ts`

**"Port 5000 zajęty"** → Zmień PORT w `backend/.env`

---

**Powodzenia!** Jeśli wszystko pójdzie dobrze, za chwilę będziesz mieć działającą nowoczesną aplikację do analiz Spotify! 🎉
