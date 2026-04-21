# Horus — Backlog
_Dernière mise à jour : 2026-04-21_

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

## ⚠️ Limites connues — point de vue utilisateur

| # | Domaine | Limite | Impact | Priorité |
|---|---------|--------|--------|----------|
| L1 | Sécurité | Pas d'authentification — quiconque a l'URL peut accéder et modifier toutes les données | Élevé si URL partagée | 🔴 Haute |
| L2 | Multi-utilisateur | Pas de gestion multi-guide — modifications simultanées sans avertissement de conflit | Moyen | 🟠 Moyenne |
| L3 | Intégrations | Saisie 100% manuelle — les plateformes n'alimentent pas encore Horus automatiquement | Élevé (quotidien) | 🔴 Haute (voir INT1–INT4) |
| L4 | Récurrence | Pas de réservations récurrentes — un tour hebdomadaire doit être créé une par une | Moyen | 🟡 Basse |
| L5 | Historique client | Pas de vue "toutes les réservations d'un client" à travers le temps | Faible | 🟡 Basse |
| L6 | Facturation | Pas de tarification, devis ni facturation — Horus gère le planning uniquement | Faible | 🟡 Basse |
| L7 | Notifications | Push uniquement sur Android + Chrome — iPhone (Safari) et Firefox non supportés | Élevé sur iOS | 🟠 Moyenne |
| L8 | Notifications | Pas d'alerte par email en fallback si push non reçu | Moyen | 🟡 Basse |
| L9 | Hors-ligne | Sans internet, les données ne chargent pas (PWA shell uniquement) | Élevé terrain | 🟠 Moyenne |
| L10 | Export | Pas d'export PDF, Excel ou impression du planning | Faible | 🟡 Basse |
| L11 | Sauvegarde | Pas de sauvegarde automatique — "Vaciar" est irréversible | Élevé si erreur | 🟠 Moyenne |
| L12 | Infrastructure | Supabase free tier : 500 Mo DB, 2 Go bande passante/mois | Faible pour usage solo | 🟢 Surveillance |
| L13 | Infrastructure | Vercel free tier : cold start ~1–2s après inactivité | Faible | 🟢 Surveillance |
| L14 | Annulation | Pas de "Annuler" (undo) sur les actions — suppression définitive immédiate | Moyen | 🟡 Basse |

---

## 📱 Distribution mobile (non planifiée)

| # | Option | Description | Complexité | Prérequis | Statut |
|---|--------|-------------|------------|-----------|--------|
| MOB1 | TWA sideload (sans Play Store) | Générer un APK avec Bubblewrap CLI, transférer sur le téléphone et installer directement (sources inconnues). L'APK charge l'URL Vercel — pas besoin de le regénérer à chaque mise à jour de l'app. | Faible | Java JDK 8+, Android SDK (téléchargés automatiquement par Bubblewrap), 0 € | ⬜ À faire |
| MOB2 | TWA Play Store | Même APK que MOB1, soumis sur la Play Console. Ajouter `assetlinks.json` sur Vercel pour la validation Google. | Faible + | Compte Google Play Developer (25 $ unique) | ⬜ À faire |
| MOB3 | App Store iOS (Capacitor) | Encapsule le frontend Next.js dans une app native iOS/Android. Build statique requis, API routes restent sur Vercel. | Moyenne | Compte Apple Developer (99 €/an) + Mac pour build Xcode | ⬜ À faire |

**Recommandation :** MOB1 en priorité — 0 €, rapide, et l'APK n'a pas à être regénéré à chaque update Vercel. MOB2 si publication publique souhaitée ensuite.

---

## 🔌 Intégrations plateformes (non planifiées)

Objectif : les réservations Viator / GetYourGuide / Civitatis / WordPress alimentent Horus automatiquement, sans saisie manuelle.

### Approche recommandée (par ordre de priorité)

| # | Source | Mécanisme | Complexité | Statut |
|---|--------|-----------|------------|--------|
| INT1 | WordPress | Webhook natif plugin → `POST /api/webhooks/wordpress` | Moyenne | ⬜ À faire |
| INT2 | Viator / GYG / Civitatis | Email booking → Zapier/Make → `POST /api/bookings` | Moyenne | ⬜ À faire |
| INT3 | Viator | API officielle Viator (accès partenaire requis) | Haute | ⬜ À faire |
| INT4 | GetYourGuide | API officielle GYG (accès partenaire requis) | Haute | ⬜ À faire |

### Fichiers à créer dans Horus

| Fichier | Rôle |
|---------|------|
| `src/app/api/webhooks/wordpress/route.ts` | Endpoint réception WordPress |
| `src/app/api/webhooks/viator/route.ts` | Endpoint réception Viator |
| `src/app/api/webhooks/getyourguide/route.ts` | Endpoint réception GYG |
| `src/lib/webhook-parsers.ts` | Normalisation des formats → modèle Booking |

Chaque endpoint doit valider une clé secrète (header `X-Webhook-Secret` ou HMAC) avant d'insérer en base.

---

## 💡 Idées à implémenter

| # | Écran | Idée | Complexité | Priorité |
|---|-------|------|------------|----------|
| F1 | Admin — Tarifas / Formulaire réservation | Appliquer automatiquement les tarifs de route (configurés dans Admin) aux **nouvelles réservations futures** dès leur création — si le tarif est modifié après coup, les réservations déjà existantes ne sont pas affectées | Basse | 🟡 Moyenne |

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
| **v1.4 stable** (2026-04-18) | — | Release notes cliquables dans le footer | — |
| **v1.5 stable** (2026-04-18) | flash thème | 6 palettes de couleurs depuis Admin | — |
| **v1.6 stable** (2026-04-19) | B1–B5 + traductions FR→ES | Conflit violet, splash screen, panel calendrier conflit | — |
| **v1.7.2 stable** (2026-04-20) | Caché API, boutons passé, sync onglets | Stats heatmap + filtres, Admin tarifas pre-fill | — |
| **v1.8 stable** (2026-04-20) | — | Catálogo tours, select tour par plateforme, prix BookingCard/calendrier, badges stats, seed réel | — |
| **v1.8.1 stable** (2026-04-21) | Tours inactifs dans formulaire, confirm suppression | Date + badge jour dashboard, édition inline catalogue, catégorie libre, heatmap bleu | — |
| **Total** | **22** | **16** | **4** |
