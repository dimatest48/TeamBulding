# Roadmap — Student Task Tracker

> Źródło: Brief.pdf + Dokumentacja UX (`docs/ux/`)  
> Czas trwania: **2 tygodnie · 2 sprinty**  
> Format: Epiki → Zadania (styl Jira)

---

## Stos technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Frontend | React + Tailwind CSS |
| Backend | Python (FastAPI) |
| Baza danych | SQLite (dev) → PostgreSQL (prod) |
| Autoryzacja | JWT |
| API | REST |

---

## Harmonogram

| Sprint | Tydzień | Zakres |
|--------|---------|--------|
| Sprint 1 | Tydzień 1 | Konfiguracja · Autoryzacja · Przedmioty · Zadania |
| Sprint 2 | Tydzień 2 | Dashboard · Udostępnianie · Onboarding · Wdrożenie |

---

---

## Sprint 1 — Rdzeń aplikacji

**Cel:** Działający backend z autoryzacją i pełnym CRUD dla zadań i przedmiotów. Użytkownik może się zalogować i zarządzać swoimi zadaniami.

---

### EP-01 · Konfiguracja projektu

| # | Zadanie |
|---|---------|
| T-01 | Inicjalizacja repozytorium (struktura `/frontend`, `/backend`, `.gitignore`, `README`) |
| T-02 | Konfiguracja backendu (FastAPI + SQLAlchemy + Alembic) |
| T-03 | Konfiguracja frontendu (React + Vite + Tailwind CSS + React Router) |
| T-04 | Stworzenie schematu bazy danych i uruchomienie pierwszej migracji |
| T-05 | Konfiguracja `docker-compose` do uruchamiania całości lokalnie jedną komendą |

---

### EP-02 · Autoryzacja i użytkownicy

| # | Zadanie |
|---|---------|
| T-06 | Rejestracja użytkownika (email + hasło + imię) |
| T-07 | Logowanie i generowanie tokenu JWT |
| T-08 | Wylogowanie (unieważnienie tokenu) |
| T-09 | Zabezpieczenie wszystkich endpointów — dostęp tylko dla zalogowanych |
| T-10 | Strona profilu — podgląd i edycja imienia |
| T-11 | UI: strona logowania/rejestracji (przełącznik zakładek na jednej stronie) |

---

### EP-03 · Przedmioty

| # | Zadanie |
|---|---------|
| T-12 | Dodawanie przedmiotu |
| T-13 | Zmiana nazwy przedmiotu |
| T-14 | Usuwanie przedmiotu (z potwierdzeniem, jeśli są powiązane zadania) |
| T-15 | Lista przedmiotów z liczbą zadań i procentem ukończenia |
| T-16 | UI: ekran listy przedmiotów z kartami i przyciskiem „Dodaj przedmiot" |

---

### EP-04 · Zadania

| # | Zadanie |
|---|---------|
| T-17 | Dodawanie zadania (nazwa, przedmiot, termin, priorytet, status, opis) |
| T-18 | Przeglądanie listy zadań (z filtrem po statusie i sortowaniem po terminie) |
| T-19 | Edycja zadania |
| T-20 | Usuwanie zadania |
| T-21 | Szybka zmiana statusu zadania („oznacz jako ukończone" jednym kliknięciem z listy) |
| T-22 | UI: formularz dodawania/edycji zadania |
| T-23 | UI: ekran szczegółów zadania |
| T-24 | UI: ekran przedmiotu z listą jego zadań |

---

**Kryteria ukończenia Sprintu 1:**
- [ ] Można się zarejestrować, zalogować i wylogować
- [ ] Sesja jest zachowywana po odświeżeniu strony
- [ ] Pełny CRUD dla przedmiotów i zadań działa poprawnie
- [ ] Zmiana statusu zadania dostępna bezpośrednio z listy
- [ ] Wszystkie endpointy są zabezpieczone — nieautoryzowany otrzymuje 401

---

---

## Sprint 2 — Funkcjonalności i wdrożenie

**Cel:** Dashboard, udostępnianie zadań, onboarding, responsywny UI, aplikacja dostępna pod publicznym adresem.

---

### EP-05 · Dashboard i postęp

| # | Zadanie |
|---|---------|
| T-25 | Endpoint `/dashboard` — zwraca przeterminowane zadania, najbliższe terminy, postęp po przedmiotach, ogólne statystyki |
| T-26 | UI: sekcja przeterminowanych zadań (widoczna tylko jeśli istnieją, czerwone wyróżnienie, na pierwszym miejscu) |
| T-27 | UI: sekcja najbliższych terminów (top 5, relatywne etykiety: „dziś", „jutro") |
| T-28 | UI: postęp po przedmiotach (mini pasek postępu, sortowanie od najmniej ukończonych) |
| T-29 | UI: pusty stan dashboardu gdy nie ma jeszcze żadnych zadań |

---

### EP-06 · Udostępnianie zadań

| # | Zadanie |
|---|---------|
| T-30 | Udostępnianie zadania innemu użytkownikowi po emailu (dostęp do podglądu lub edycji) |
| T-31 | Generowanie linku do zadania (uprawnienie „podgląd" lub „edycja", link aktywny do odwołania) |
| T-32 | Podgląd i cofanie dostępu dla każdego użytkownika |
| T-33 | Ekran „Udostępnione mi" — osobna sekcja z zadaniami innych użytkowników |
| T-34 | Otwarcie linku przez niezalogowanego użytkownika → przekierowanie do rejestracji → automatyczne otwarcie zadania po zalogowaniu |
| T-35 | Zabezpieczenie na backendzie: użytkownik z dostępem „podgląd" nie może edytować ani udostępniać |

---

### EP-07 · Onboarding

| # | Zadanie |
|---|---------|
| T-36 | Krok 1: pytanie „Jaki przedmiot masz dziś?" — utworzenie pierwszego przedmiotu |
| T-37 | Krok 2: „Dodaj zadanie dla [przedmiot]" — utworzenie pierwszego zadania |
| T-38 | Logika: onboarding wyświetlany tylko przy pierwszym logowaniu, flaga `onboarding_completed` w profilu użytkownika |
| T-39 | Przycisk „Pomiń" — przejście do dashboardu z podpowiedzią „Dodaj pierwszy przedmiot" |

---

### EP-08 · Dopracowanie i wdrożenie

| # | Zadanie |
|---|---------|
| T-40 | Responsywny layout dla urządzeń mobilnych (375px i więcej) |
| T-41 | Stany ładowania (szkielety) dla dashboardu i list |
| T-42 | Obsługa błędów: komunikaty przy braku połączenia i błędach serwera |
| T-43 | Wdrożenie backendu (Render / Railway) z połączeniem do PostgreSQL |
| T-44 | Wdrożenie frontendu (Vercel / Netlify) |
| T-45 | Ręczne testowanie wszystkich głównych przepływów na produkcyjnym URL |

---

**Kryteria ukończenia Sprintu 2:**
- [ ] Dashboard wyświetla dane we właściwej kolejności priorytetów
- [ ] Można udostępnić zadanie po emailu i przez link
- [ ] Odbiorca widzi zadanie w sekcji „Udostępnione mi"
- [ ] Nowy użytkownik przechodzi onboarding przy pierwszym logowaniu
- [ ] Aplikacja działa na telefonie bez poziomego przewijania
- [ ] Aplikacja jest dostępna pod publicznym adresem URL

---

---

## Kolejność zależności

```
EP-01 Konfiguracja
  └── EP-02 Autoryzacja
        ├── EP-03 Przedmioty
        │     └── EP-04 Zadania
        │           ├── EP-05 Dashboard
        │           └── EP-06 Udostępnianie
        └── EP-07 Onboarding  (korzysta z EP-03 + EP-04, nie wymaga nowych endpointów)

EP-08 Dopracowanie + Wdrożenie  ─── równolegle z EP-05–07, wdrożenie na końcu
```

---

## Rejestr ryzyk

| Ryzyko | Wpływ | Sposób mitygacji |
|--------|-------|-----------------|
| JWT refresh przy równoległych zapytaniach może się posypać | Wysoki | Zaimplementować axios interceptor z kolejką zapytań |
| Sprint 1 jest przeciążony (Autoryzacja + Przedmioty + Zadania) | Średni | Backend i frontend pracują równolegle od pierwszego dnia |
| Udostępnianie przez link — złożona logika przekierowania po rejestracji | Średni | Zaimplementować parametr `?redirect=` jako pierwszą rzecz, przetestować osobno |
| Wdrożenie zajmuje więcej czasu niż oczekiwano | Niski | Skonfigurować Render/Vercel pod koniec Sprintu 1, nie zostawiać na ostatni dzień |

---

## Definicja ukończenia

Zadanie uważa się za ukończone, gdy:

- [ ] Kod scalony z `main` przez Pull Request
- [ ] Brak zahardkodowanych sekretów lub adresów URL (wyłącznie przez `.env`)
- [ ] Funkcjonalność sprawdzona ręcznie w przeglądarce
- [ ] Dla endpointu backendowego: pokryty co najmniej jednym testem (happy path + jeden przypadek błędu)
