# Propozycja UI/UX — Spotify Analytics

Status: główne zadania wdrożone. Zakres, wyniki testów i pozostałe ograniczenia opisuje [raport wdrożenia](ui-ux-implementation.md).

Priorytet: ciemny motyw na komputerze 1920×1080. Aplikacja lokalna, bez kont i logowania. Dokument jest propozycją, nie wdrożeniem zmian w aplikacji.

## Podstawa oceny

Przejrzano kod layoutu, dashboardu, muzyki, filtrów, tabeli, importu i szczegółów utworów. W przeglądarce sprawdzono dashboard w jasnym motywie przy 1280×800 oraz muzykę przy 1280×800, 390×844 i 1920×1080; przy 1920×1080 również motyw ciemny. Korzystano z istniejących danych, bez importowania i usuwania historii. Nie wykonano pełnego audytu dostępności ani wszystkich ekranów podcastów i audiobooków.

Zastosowano lokalny skill frontend-design. Istniejący plik ~/.codex/skills/frontend-design.md skopiowano do standardowej lokalizacji frontend-design/SKILL.md, zachowując oryginał.

## Najważniejsze ustalenia

1. **Dane zaczynają się zbyt nisko.** Na ekranie muzyki przy szerokości 1920 nagłówek tabeli pojawia się dopiero około 700 px od góry. Przed nim znajdują się duży zakres dat, nagłówek, zakładki i osobna karta filtrów. Kontener ma maksimum 1400 px, a kolejne wewnętrzne odstępy zmniejszają miejsce na tabelę.
2. **Dekoracje konkurują z treścią.** Layout otacza całość dużą kartą, a komponent Card dodaje kolejne półprzezroczyste powierzchnie, cienie i efekty hover także elementom nieklikalnym. Niebieskie przyciski, zielony import i różnokolorowe poświaty nie tworzą jednej hierarchii.
3. **Dashboard ma osiem równorzędnych KPI.** Kraj i liczba podcastów otrzymują tyle samo miejsca co czas słuchania. Muzyka i historia są niżej. Przewodnik importu pozostaje na dashboardzie również po zaimportowaniu danych.
4. **Tabela jest przeciążona od początku.** TracksList domyślnie pokazuje dziewięć kolumn. Długie nazwy walczą o miejsce z datami i metrykami pomocniczymi. Szczegóły zastępują tabelę poprzez lokalny stan, bez osobnego adresu.
5. **Mobilne zakładki się nakładają.** TabsList ma stałą wysokość h-9, podczas gdy Analytics układa zakładki w kilka rzędów. Przy 390 px drugi rząd nachodzi na filtry. Zakładka Wnioski ma dodatkowo hidden sm:flex.
6. **Są konkretne niespójności zachowania.** Filtry w useTracksData zmieniają klucz zapytania od razu, chociaż interfejs oferuje Szukaj/Zastosuj. fetchTracks ustawia stronę i limit, ale nie wymusza ponownego pobrania przy niezmienionych parametrach.
7. **Błąd może wyglądać jak dalsze ładowanie.** TrackDetails pokazuje spinner również dla !track; hook po błędzie pozostawia track=null. Globalny komunikat o błędzie nie usuwa tego mylącego stanu panelu.
8. **Anulowanie usuwania może zmienić wybór profilu.** ProfileManager wywołuje callback rodzica natychmiast po handleClearProfile, niezależnie od wyniku confirm i żądania. Rodzic może wyczyścić wybrany profil mimo anulowania. To ustalenie z kodu; nie testowano usuwania danych.
9. **Dialog importu wymaga obsługi klawiatury.** Layout ma role=dialog i aria-modal, ale brak widocznej implementacji pułapki fokusu, Escape i przywracania fokusu. Samo ARIA tego nie zapewnia.
10. **Język wymaga korekty.** W polskiej wersji pozostaje Analytics, literówka Najpopularniejszi oraz powtarzana instrukcja sortowania nad filtrami i tabelą.

## Kierunek wizualny

Osobista biblioteka muzyczna z czytelną warstwą analityczną. Dominują tytuły, wykonawcy i dane. Jeden charakterystyczny element: historia słuchania. Bez animowanych plam, efektu szkła i poświaty wokół logo.

Paleta bazowa dla ciemnego wariantu:
- tło #211E26;
- powierzchnia #2B2732;
- tekst #F3EEF5;
- tekst drugorzędny #C0B4C5;
- granice #48404E;
- akcent #E1ABD2.

Jasny wariant: tło #F6F5F8, powierzchnia #FFFFFF, tekst #292530, tekst pomocniczy #706877, linie #E4DFE8, akcent #744568. Zieleń zachować dla świadomie oznaczonych akcji Spotify lub sukcesu. Czerwień dla błędów i usuwania, nie dla rekordowego dnia na wykresie.

Typografia docelowa: lokalnie pakowany Manrope, jeśli po próbie wizualnej poprawi polskie nagłówki i tabelę; istniejący Inter można zachować podczas pierwszego etapu. Treść 14–16 px, nagłówki 28–32 px, wartości 28–36 px. Liczby tabular-nums, wyrównanie do prawej; nazwy do lewej. Nie zmniejszać wszystkiego, żeby zmieścić dziewięć kolumn. Makieta używa fontu systemowego i nie wymaga internetu.

## Układ dla 1080p

Zachować prostą górną nawigację — cztery główne działy nie wymagają szerokiego sidebara. Nagłówek około 64 px. Biblioteka/profil i okres muszą być zawsze czytelne. Preferencje języka, motywu i importu grupować po prawej.

Dla tabeli szerokość robocza około 1680–1760 px przy 1920 px ekranu; dla dashboardu można zastosować nieco mniejszą szerokość. Usunąć zewnętrzną kartę obejmującą całą stronę. Zostawić odstępy 24–32 px i maksymalnie jedną warstwę paneli.

Podsumowanie:
- trzy–cztery podstawowe liczby, z jednoznacznym zakresem: muzyka / cała biblioteka;
- wykres historii po lewej, krótkie rankingi po prawej;
- kalendarz aktywności i wzorce godzinowe niżej;
- mniej istotne statystyki dostępne w szczegółach;
- brak podcastów oznacza krótką informację w ich sekcji, a nie zestaw pustych kart.

Muzyka:
- tytuł, zakres i wybór widoku w zwartej górnej części;
- wyszukiwanie, Filtry (liczba aktywnych), Kolumny w jednym pasku;
- pierwsze rekordy docelowo przed 320–360 px wysokości obszaru przeglądarki;
- wiersze 44–48 px, opcjonalny tryb gęsty 36–40 px dla myszy;
- domyślnie: utwór z wykonawcą, album, odtworzenia, czas, ostatnio słuchane;
- trwały wybór kolumn, sortowania i gęstości;
- przyklejony nagłówek i wyraźny stan sortowania;
- szczegóły w bocznym panelu około 420–480 px, z możliwością pełnego widoku.

To cele do zweryfikowania na rzeczywistych długich nazwach, a nie gwarancja liczby widocznych wierszy.

## Zachowanie i przepływy

**Daty.** Cała historia, konkretne lata i własny zakres. Ostatnie 30 dni liczyć jawnie względem ostatniego dnia w imporcie albo nazwać zgodnie z rzeczywistym zakresem — archiwalny eksport nie powinien domyślnie prowadzić do pustego ekranu. Jedno źródło zakresu; usunąć konkurujące pola dat z filtrów zaawansowanych. Pokazywać pokrycie danych i brakujące okresy. Zachować UTC do czasu świadomej zmiany całej logiki agregacji.

**Wyszukiwanie.** Jeden model: automatyczne wyszukiwanie po krótkiej pauzie, bez pozornego przycisku Zastosuj; zaawansowane filtry mogą mieć własny formularz zatwierdzany raz. URL przechowuje zakładkę, zakres, wyszukiwanie, sortowanie i wybrany utwór. Wstecz przywraca pozycję listy.

**Wykresy.** Domyślnie jedna metryka i jedna oś; przełącznik Czas / Odtworzenia. Podwójna oś jako opcja zaawansowana. Czytelne jednostki, tooltip, dostępny tekstowy odpowiednik danych. Zero aktywności odróżnić od braku pokrycia eksportem. Wnioski liczyć z danych, z widoczną definicją, bez dopisywania narracji przez model.

**Import.** Osobny ekran Dane i import: wykryte foldery, liczba plików, profil, zakres, ostatni import, postęp i rezultat. Obecny mechanizm folderów można zachować. Wybór ZIP/plików jest opcjonalnym drugim etapem wymagającym zmian backendu. Przed zastąpieniem historii opisać skutek; przy błędzie zachować jasny status. Usuwanie przenieść do odrębnej sekcji. Zmiana aktywnego profilu dopiero po potwierdzonym sukcesie.

**Puste stany.** Rozdzielić brak importu, brak wyników filtrów, błąd pobrania i faktyczne zero. Każdy stan ma własny następny krok. Skeleton tylko podczas rzeczywistego ładowania; ponowienie w miejscu awarii.

**Okładki.** Opcjonalne lokalne obrazy lub estetyczne zastępniki. Nie uzależniać nowego interfejsu od Spotify OAuth ani pobierania ilustracji z internetu. Link Otwórz w Spotify jasno odróżnić od odtwarzania w aplikacji.

## Warianty i kryteria odbioru

Główny przegląd: ciemny 1920×1080, także przy rzeczywistym skalowaniu systemu i zoomie przeglądarki. Dodatkowo 1536×864 i 1366×768, jasny motyw, szerokości 768 i 390 px. Na telefonie dostępne wszystkie zakładki, tekstowe etykiety nawigacji, lista zamiast miniaturowej tabeli i szczegóły na pełnej szerokości.

Sprawdzić: brak nakładania elementów, czytelność pól dat i placeholderów w dark mode, widoczny fokus, całą obsługę dialogów klawiaturą, kontrast tekstu min. 4,5:1, powiększenie 200%, długie nazwy, PL/EN, puste i błędne odpowiedzi. Są to kryteria planowanego wdrożenia, nie deklaracja zgodności obecnej aplikacji ani makiety.

## Kolejność wdrożenia

1. Naprawy UX: mobilne zakładki, spinner błędu, anulowanie usuwania, działanie filtrów i odświeżania, dialog i korekta tekstów.
2. Fundament wizualny dark/1080p: tokeny, layout, typografia, przyciski, usunięcie zbędnych kart i efektów.
3. Tabela muzyki: zagęszczenie, trwały stan, szczegóły, pasek narzędzi.
4. Dashboard i wykresy: hierarchia, kontekst danych, rankingi.
5. Import i pozostałe działy, następnie przekrojowa kontrola wariantów.

Pozostawić React, Tailwind, Radix i Recharts. Nie ma uzasadnienia, by sam redesign oznaczał wymianę frameworka. Przy wdrażaniu testować rzeczywiste regresje zachowania, a wizualnie porównywać reprezentatywne ekrany.

## Artefakt

ui-ux-concept.html to samodzielna, responsywna makieta kierunku dashboardu z domyślnym ciemnym motywem i przełącznikiem jasnego. Dane są fikcyjne, nawigacja jest poglądowa. Makieta nie zmienia aplikacji ani jej bazy.
