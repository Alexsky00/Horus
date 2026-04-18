# Horus — Backlog
_Dernière mise à jour : 2026-04-15_

---

## 🔴 Bugs critiques

| # | Réf. test | Écran | Description | Statut |
|---|-----------|-------|-------------|--------|
| B1 | 4.15/4.16/4.17 | Calendrier Gantt | allDay events et bloqueados affichés un jour après — bug timezone | ✅ Corrigé v1.1 — helper `toLocalKey()` |
| B2 | 1.29/1.30 | BookingCard | Code réservation (RCV...) absent des cartes | ✅ Corrigé v1.1 — badge amber ajouté |
| B2.1 | B2.1 | BookingCard | ExternalRef (VIA-001) encore visible sur les cartes — doit être masqué | ✅ Corrigé v1.2 — supprimé |
| B2.2 | B2.2 | Calendrier — panneau latéral | ExternalRef (Ref. OTA: VIA-001) encore affiché dans le panneau latéral du calendrier | ✅ Corrigé v1.3 — supprimé |
| B3 | 1.31 | BookingCard | Réservations allDay sans indicateur visuel sur la carte | ✅ Corrigé v1.1 — "☀ Toda la jornada" en amber |
| B4 | 3.6 | Formulaire réservation | Sélecteur d'heure non limité à 30 min (`step=1800` ignoré sur `datetime-local`) | ✅ Corrigé v1.1 — split `date` + `time` |
| B4.2 | B4.2 | Formulaire réservation | `<input type="time">` n'affiche pas les intervalles 30 min dans tous les navigateurs | ✅ Corrigé v1.2 — `<select>` 06:00–21:30 |
| B4.3 | B4.3 | Formulaire blocage | `<input type="time">` également non limité dans le formulaire "Bloquear horario" | ✅ Corrigé v1.3 — `<select>` 06:00–21:30 |

---

## 🟠 Bugs mineurs

| # | Réf. test | Écran | Description | Statut |
|---|-----------|-------|-------------|--------|
| B5 | 4.18 | Calendrier | Changement de vue remet le calendrier à aujourd'hui | ✅ Corrigé v1.1 — `fcDate` mis à jour via `datesSet` |
| B5.2 | B5.2 | Calendrier | Semana→Mes→Semana : `current` Gantt non synchronisé avec navigation FullCalendar | ✅ Corrigé v1.2 — `setCurrent` dans `datesSet` |
| B6 | 6.10 | Dashboard post-reset | Tuile Bloqueados pas rafraîchie après reset depuis /logs | ✅ Corrigé v1.1 — redirect `/` après reset |
| N1 | B3.1 | Calendrier — panneau latéral | allDay : panneau latéral affichait l'heure (12:00) au lieu de "Toda la jornada" | ✅ Corrigé v1.2 |

---

## 🟡 Corrections de tests / données

| # | Description | Statut |
|---|-------------|--------|
| T1 | Recherche "Bardenas" : 9 résultats (pas 6) | ✅ Corrigé v1.1 |
| T2 | Tri par participants : description reformulée | ✅ Corrigé v1.1 |
| T3 | Vue "Lista" absente de l'app → SKIP | ✅ Corrigé v1.1 |
| N2 | Seed : 35 bloqueados (pas 37) — message seed + tous les fichiers tests | ✅ Corrigé v1.2 |

---

## 🔵 Améliorations livrées

| # | Écran | Description | Statut |
|---|-------|-------------|--------|
| A1 | Planning | Colonne **Cliente** dans le tableau Planning | ✅ Livré v1.1 |

---

## 💡 Idées livrées

| # | Réf. test | Écran | Idée | Complexité | Statut |
|---|-----------|-------|------|------------|--------|
| I1 | 4.13 | Calendrier | Barre de recherche rapide sur toutes les vues | Moyenne | ✅ Livré v1.3 |
| I2 | 4.21 | Planning | Bloqueados multi-jours affichés comme une plage unique ("3–14 ago") | Haute | ✅ Livré v1.3 |
| I3 | 4.13 | Calendrier | Filtre rapide par statut dans la vue calendrier | Moyenne | ✅ Livré v1.3 |
| I4 | 7.4 | Dashboard | Toggle "Toda la jornada" dans les filtres | Basse | ✅ Livré v1.3 |
| I5 | R5 | Calendrier — formulaire blocage | Pré-remplir la date du formulaire "Bloquear horario" avec la date visible dans la vue courante | Basse | ✅ Livré v1.3 |

---

## Récapitulatif

| Session | Bugs corrigés | Améliorations | Tests corrigés |
|---------|---------------|---------------|----------------|
| v1.1 (2026-04-12) | 4 critiques + 2 mineurs | A1 | T1, T2, T3 |
| v1.2 (2026-04-13) | B2.1, B4.2, B5.2, N1 | — | N2 |
| v1.3 → **v1.1 stable** (2026-04-13) | B2.2, B4.3 | — | — |
| **v1.2 stable** (2026-04-14) | form time init | allDay conflict + blocs 06–22 + couleur | — |
| **v1.3 stable** (2026-04-15) | — | I1 I2 I3 I4 I5 + champ tél | — |
| **Total** | **13** | **8** | **4** |
