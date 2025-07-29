# Obsługa Danych Video/Podcasts w Spotify Analytics

## 📺 Funkcjonalności Video/Podcast

Aplikacja teraz obsługuje dane z plików `Streaming_History_Video_*.json` ze Spotify GDPR Export.

### 🎭 Nowe Modele Bazy Danych

#### 1. **Show** (Programy/Podcasty)

- `id` - Unikalny identyfikator
- `name` - Nazwa programu/podcastu
- `description` - Opis (opcjonalny)

#### 2. **Episode** (Odcinki)

- `id` - Unikalny identyfikator
- `showId` - ID programu (FK)
- `name` - Nazwa odcinka
- `spotifyUri` - URI Spotify dla odcinka
- `description` - Opis odcinka (opcjonalny)

#### 3. **VideoPlay** (Odtworzenia Video)

- `id` - Unikalny identyfikator
- `episodeId` - ID odcinka (FK)
- `profileId` - ID profilu (FK)
- `timestamp` - Czas odtworzenia
- `msPlayed` - Czas w milisekundach
- `platform` - Platforma odtwarzania
- `country` - Kod kraju
- `reasonStart/reasonEnd` - Powody rozpoczęcia/zakończenia
- `shuffle/skipped/offline/incognito` - Flagi

### 🔄 Import Danych

Importer automatycznie rozpoznaje:

- **Pliki Audio**: `Streaming_History_Audio_*.json` → Tabele: Artist, Album, Track, Play
- **Pliki Video**: `Streaming_History_Video_*.json` → Tabele: Show, Episode, VideoPlay

#### Logika Importu Video:

```typescript
// Sprawdzenie czy to dane video
const isVideoContent = !!(
  record.episode_name ||
  record.episode_show_name ||
  record.spotify_episode_uri
);

if (isVideoContent) {
  // Przetwarzanie jako podcast/video
  const showId = await getOrCreateShow(record.episode_show_name);
  const episodeId = await getOrCreateEpisode(record.episode_name, showId);
  await createVideoPlay(record, episodeId);
} else {
  // Przetwarzanie jako muzyka (dotychczasowa logika)
}
```

### 🚀 API Endpoints

#### `/api/video/shows`

- **GET** - Lista programów/podcastów
- Query params: `profileId`, `limit`, `offset`, `search`

#### `/api/video/shows/:showId/episodes`

- **GET** - Lista odcinków dla programu
- Query params: `profileId`, `limit`, `offset`, `search`

#### `/api/video/video-stats`

- **GET** - Statystyki video/podcastów
- Zwraca: przegląd statystyk + top programy
- Query params: `profileId` (wymagany)

### 🎨 Frontend - Strona Video

**URL**: `/video`

#### Komponenty:

- **Statystyki przeglądu**: Łączne odtworzenia, minuty, unikalne programy/odcinki
- **Zakładka "Programy"**: Lista wszystkich programów z możliwością wyboru
- **Zakładka "Top Programy"**: Ranking najczęściej słuchanych
- **Zakładka "Odcinki"**: Lista odcinków wybranego programu

#### Funkcje:

- Lazy loading dla optymalizacji
- Responsive design
- Formatowanie czasu (godziny/minuty)
- Filtrowanie po profilach

### 📋 Struktura Danych Video

Format danych z `Streaming_History_Video_*.json`:

```json
{
  "ts": "2024-01-15 14:30:00",
  "username": "user123",
  "platform": "Android",
  "ms_played": 1200000,
  "conn_country": "PL",
  "master_metadata_track_name": null,
  "master_metadata_album_artist_name": null,
  "master_metadata_album_album_name": null,
  "spotify_track_uri": null,
  "episode_name": "Odcinek 15: Nowa technologia",
  "episode_show_name": "Tech Podcast",
  "spotify_episode_uri": "spotify:episode:abc123",
  "reason_start": "clickrow",
  "reason_end": "endplay",
  "shuffle": false,
  "skipped": false,
  "offline": false,
  "incognito_mode": false
}
```

### 🔧 Zmienione Pliki

#### Backend:

- **Modele**: `Show.ts`, `Episode.ts`, `VideoPlay.ts`
- **Konfiguracja**: `database.ts` (rejestracja modeli)
- **Import**: `importData.ts` (obsługa video)
- **API**: `video.ts` (nowe endpoint'y)
- **Router**: `index.ts` (rejestracja tras video)

#### Frontend:

- **Strona**: `VideoPodcasts.tsx`
- **Routing**: `App.tsx` (nowa trasa)
- **Nawigacja**: `Layout.tsx` (link Video)
- **Typy**: `types.ts` (interfejsy video)

### ✅ Funkcjonalności

- [x] Import danych video z plików JSON
- [x] Rozdzielenie muzyki od podcastów/video
- [x] API dla pokazów, odcinków i statystyk
- [x] Frontend z interaktywnym interfejsem
- [x] Optymalizacja bundle'a (lazy loading)
- [x] Responsywny design
- [x] Obsługa wielu profili

### 🎯 Przyszłe Rozszerzenia

- [ ] Wykresy czasowe dla video
- [ ] Analiza skippingu w podcastach
- [ ] Eksport danych video do CSV
- [ ] Wyszukiwanie po treści odcinków
- [ ] Integracja z Spotify Web API dla metadanych

---

**Video i podcasti są teraz w pełni zintegrane z aplikacją Spotify Analytics!** 🎉
