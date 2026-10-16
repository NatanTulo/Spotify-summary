# Weryfikacja po aktualizacji — 16.10.2026

## Wynik

Instalacja z zamrożonego lockfile, lint, 41 testów automatycznych, kompilacja TypeScript i build obu części przechodzą. Audyt zależności nie zgłasza znanych podatności.

Sprawdzono 55 przypadków API w trybie development oraz 52 żądania w wersji produkcyjnej, obejmujące routing SPA, zasoby statyczne i API odczytu. Backend działa z Node 24.22 i PostgreSQL 18.6. Testowany tryb development używał `NODE_ENV=test`, aby nie uruchamiać automatycznego `sync({ alter: true })` na zaimportowanej bazie.

## Sprawdzone funkcje

- Profile, dostępność plików importu i odczyt statusu/postępu.
- Statystyki ogólne, roczne, kraje, timeline dzienny i miesięczny, godziny, dni tygodnia i metadane filtrów.
- Listy utworów i albumów: wyszukiwanie, sortowanie, paginacja, profile, minimalna liczba odtworzeń, kraj, platforma, zakres dat i opcje skipped/shuffle.
- Szczegóły utworu, historia odtworzeń i timeline utworu.
- Podcasty: programy, odcinki, historia, rankingi i statystyki.
- Audiobooki: poprawny pusty widok oraz wyszukiwanie bez błędu serwera. Eksport nie zawiera odtworzeń audiobooków.
- W przeglądarce: panel, lista utworów, wyszukiwanie i reset filtrów, szczegóły utworu, pięć wykresów muzycznych z agregacją pełnej historii, lista programów/odcinków, pusty widok audiobooków, języki PL/EN i motywy jasny/ciemny/systemowy.
- Wersja produkcyjna: lokalna czcionka ładuje się przy obecnym CSP; brak błędów w konsoli świeżej sesji. Ikona jest poprawnie serwowana jako SVG.
- Widok mobilny 390 × 844: panel i tabela nie rozszerzają dokumentu poza szerokość ekranu.

## Wykryte i naprawione problemy

1. Wyszukiwanie audiobooków odwoływało się do nieistniejącej kolumny `author` i zwracało HTTP 500. Korzysta teraz z dostępnego pola nazwy.
2. Zaawansowane filtry utworów i albumów nie były stosowane w zapytaniach; część opcji nie była też wysyłana z frontendu. Dodano walidację i parametryzowane warunki, wspólny zakres filtrowania listy i licznika paginacji, poprawną granicę końcowego dnia oraz sortowania odpowiadające kontrolkom interfejsu.
3. Selektory krajów/platform na stronie muzyki były puste. Zostały podłączone do istniejącego endpointu metadanych.
4. Pobranie szczegółów utworu nie przekazywało wybranego profilu. Profil jest teraz uwzględniany w żądaniu.
5. Średnia długość odtworzenia 177 sekund była opisana jako sesja trwająca 177 minut. Panel pokazuje teraz `2:57`, z właściwą nazwą i jednostką.
6. Produkcyjny CSP blokował Google Fonts. Czcionka Inter jest teraz dostarczana lokalnie przez `@fontsource-variable/inter`, bez rozszerzania CSP. Dodano też brakującą ikonę.
7. Dekoracja nagłówka wystawała poza ekran telefonu i powodowała przewijanie poziome. Jej obszar jest teraz przycinany.

Dodano testy regresji filtrów i sortowania, wyszukiwania audiobooków oraz poprawnych jednostek na panelu. Dane profilu zachowały 196 671 odtworzeń muzyki i 160 odtworzeń podcastów. Ponowny import i usuwanie istniejących danych nie były częścią tej weryfikacji.

Po edycji plików tłumaczeń podczas pracy Vite wystąpił przejściowy błąd odświeżania kontekstu języka; po pełnym przeładowaniu nie występuje. Weryfikację produkcyjną wykonano na świeżo otwartej stronie.
