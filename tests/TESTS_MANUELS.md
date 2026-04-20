# HORUS — Suite de tests manuels

> App version : **1.7** (non livrée — en attente de validation)
> Test suite : v1.7
> URL locale : http://localhost:3000
> Légende : ✅ Passé · ❌ Échoué · ⏭ Ignoré

---

## Préparation avant les tests

| # | Action | Attendu |
|---|--------|---------|
| P1 | `npm run dev` dans le terminal | Serveur démarré sur http://localhost:3000 |
| P2 | Ouvrir http://localhost:3000/logs | Page Logs visible |
| P3 | Cliquer **"🗑 Vaciar toda la aplicación"** → confirmer 2× | Base vide, dashboard à 0 |
| P4 | Cliquer **"✦ Cargar datos de demo"** → confirmer | Succès : ~80 réservations historiques + 21 futures + 35 bloqueados créés |

---

## MODULE 1 — Dashboard (`/`)

### 1.1 Tuiles de statistiques

| # | Action | Attendu |
|---|--------|---------|
| 1.1.1 | Charger le dashboard | 5 tuiles visibles : Pendientes / Confirmadas / Rechazadas / Total / 🔒 Bloqueados |
| 1.1.2 | Vérifier les chiffres des tuiles | Somme Pendientes + Confirmadas + Rechazadas = Total |
| 1.1.3 | Cliquer tuile **Pendientes** | Liste filtrée sur les réservations en attente uniquement |
| 1.1.4 | Cliquer tuile **Confirmadas** | Liste filtrée sur les confirmées |
| 1.1.5 | Cliquer tuile **Rechazadas** | Liste filtrée sur les refusées |
| 1.1.6 | Cliquer tuile **Total** | Filtre remis à "Todos" — toutes les réservations visibles |
| 1.1.7 | Cliquer tuile **🔒 Bloqueados** | Liste de créneaux bloqués s'affiche |
| 1.1.8 | Vérifier que les bloqueados passés sont grisés | Lignes passées à 40% d'opacité |

### 1.2 Recherche

| # | Action | Attendu |
|---|--------|---------|
| 1.2.1 | Taper un nom de client dans la barre de recherche | Seule(s) la/les réservation(s) correspondante(s) s'affiche(nt) |
| 1.2.2 | Taper "Bardenas" | Toutes les réservations du tour Bardenas Reales |
| 1.2.3 | Effacer le champ | Toutes les réservations reviennent |

### 1.3 Filtres avancés

| # | Action | Attendu |
|---|--------|---------|
| 1.3.1 | Cliquer **Filtros** | Panneau avec Estado / Plataforma / Fecha desde / Fecha hasta / Ordenar par / Direction |
| 1.3.2 | Sélectionner Estado = "Pendiente" | Seules les réservations pending s'affichent |
| 1.3.3 | Sélectionner Plataforma = "Viator" | Filtre combiné : pending + viator |
| 1.3.4 | Définir Fecha desde = aujourd'hui + 5j | Réservations antérieures disparaissent |
| 1.3.5 | Cliquer **Restablecer filtros** | Tous les filtres remis à zéro |
| 1.3.6 | Vérifier compteur badge sur bouton Filtros | Affiche le nombre de filtres actifs |

### 1.4 Tri rapide

| # | Action | Attendu |
|---|--------|---------|
| 1.4.1 | Cliquer **Fecha** (tri rapide) | Tri par date ascendant |
| 1.4.2 | Cliquer **Fecha** une 2e fois | Tri inversé (descendant ↓) |
| 1.4.3 | Cliquer **Cliente** | Tri alphabétique par nom de client |
| 1.4.4 | Cliquer **Pers.** | Tri par nombre de participants |

### 1.5 Pagination

| # | Action | Attendu |
|---|--------|---------|
| 1.5.1 | Vérifier la pagination avec les données de démo | Boutons de pagination visibles si > 15 réservations |
| 1.5.2 | Cliquer » (dernière page) | Dernière page affichée |
| 1.5.3 | Cliquer « (première page) | Retour page 1 |
| 1.5.4 | Changer un filtre pendant la pagination | Page reset à 1 automatiquement |

### 1.6 BookingCard

| # | Action | Attendu |
|---|--------|---------|
| 1.6.1 | Inspecter une carte confirmée | Bandeau vert, label "Confirmada", bouton "Eliminar" visible |
| 1.6.2 | Inspecter une carte pending | Boutons **✓ Aceptar** et **✗ Rechazar** visibles |
| 1.6.3 | Vérifier le drapeau nationalité | Drapeau SVG visible — pas de lettres brutes |
| 1.6.4 | Vérifier le code réservation | Format RCS (ex: RCV = Ruta Corta Viator) |

---

## MODULE 2 — Créer une réservation

### 2.1 Validation basique

| # | Action | Attendu |
|---|--------|---------|
| 2.1.1 | Cliquer **+ Nueva reserva** | Formulaire s'ouvre |
| 2.1.2 | Soumettre sans remplir les champs | Erreur : "Faltan campos obligatorios" |
| 2.1.3 | Remplir tous les champs obligatoires et soumettre | Réservation créée, formulaire se ferme, tuile Total +1 |

### 2.2 Champs optionnels

| # | Action | Attendu |
|---|--------|---------|
| 2.2.1 | Sélectionner une nationalité | Champ enregistré, drapeau visible sur la carte |
| 2.2.2 | Sélectionner un type de ruta (ex: Larga) | Code réservation affiche "L" en 2e position |
| 2.2.3 | Cocher "Toda la jornada" | Champ heure et durée disparaissent |
| 2.2.4 | Décocher "Toda la jornada" | Champ heure et durée reviennent |
| 2.2.5 | Vérifier le sélecteur d'heure | Saut de 30 min (09:00, 09:30…) — pas de quart d'heure |

### 2.3 Anti-double-booking

| # | Action | Attendu |
|---|--------|---------|
| 2.3.1 | Créer réservation A : date X, 09:00, 2h → la confirmer | Réservation A confirmée |
| 2.3.2 | Créer réservation B : même date X, 09:30, 2h | B créée avec status "conflict" automatiquement |
| 2.3.3 | Créer réservation sur un jour entièrement bloqué | Erreur 409 : "Franja bloqueada" affiché |

---

## MODULE 3 — Actions sur réservations

### 3.1 Accepter / Refuser (dashboard)

| # | Action | Attendu |
|---|--------|---------|
| 3.1.1 | Sur une carte "pending", cliquer **✓ Aceptar** | Status passe à "confirmed", tuiles mises à jour |
| 3.1.2 | Sur une carte "pending", cliquer **✗ Rechazar** | Status passe à "refused" |
| 3.1.3 | Tenter de confirmer une réservation en conflit | Message d'erreur "Conflicto de horario" |

### 3.2 Supprimer (dashboard)

| # | Action | Attendu |
|---|--------|---------|
| 3.2.1 | Cliquer **Eliminar reserva** | Confirmation navigateur |
| 3.2.2 | Confirmer la suppression | Carte disparaît, compteur Total -1 |
| 3.2.3 | Annuler la confirmation | Rien ne se passe |

### 3.3 Accepter / Refuser (calendrier)

| # | Action | Attendu |
|---|--------|---------|
| 3.3.1 | Ouvrir `/calendar`, cliquer un événement pending | Panneau latéral avec boutons Aceptar / Rechazar |
| 3.3.2 | Cliquer **✓ Aceptar** | Couleur de l'événement passe au vert |
| 3.3.3 | Cliquer **✗ Rechazar** | Couleur passe au rouge |

---

## MODULE 4 — Calendrier (`/calendar`)

### 4.1 Vues

| # | Action | Attendu |
|---|--------|---------|
| 4.1.1 | Charger `/calendar` | Vue hebdomadaire par défaut |
| 4.1.2 | Cliquer **Mes** | Vue mensuelle (Gantt) |
| 4.1.3 | Cliquer **Semana** | Vue hebdomadaire |
| 4.1.4 | Cliquer **Día** | Vue journalière |
| 4.1.5 | Cliquer **Lista** | Vue liste |

### 4.2 Navigation

| # | Action | Attendu |
|---|--------|---------|
| 4.2.1 | Cliquer **‹** / **›** | Semaine/mois/jour précédent/suivant |
| 4.2.2 | Cliquer **Hoy** | Retour à la date du jour |
| 4.2.3 | Vérifier le titre | Affiche la période courante |

### 4.3 Affichage des réservations

| # | Action | Attendu |
|---|--------|---------|
| 4.3.1 | Vue semaine : vérifier couleurs | Amber = pending, Vert = confirmed, Rouge = refused, Violet = conflict |
| 4.3.2 | Vue mensuelle : réservation "Toda la jornada" | Barre pleine sur la ligne, sans heure |
| 4.3.3 | Cliquer un événement | Panneau latéral avec détails complets |
| 4.3.4 | Cliquer événement conflict | Panneau affiche boutons Aceptar / Rechazar |

### 4.4 Créneaux bloqués

| # | Action | Attendu |
|---|--------|---------|
| 4.4.1 | Vue semaine : naviguer vers un jour bloqué allDay | Fond grisé sur toute la journée |
| 4.4.2 | Cliquer un créneau bloqué | Panneau "🔒 Bloqueado" avec motif |
| 4.4.3 | Dans le panneau, cliquer **Eliminar bloqueo** | Créneau supprimé, calendrier mis à jour |

### 4.5 Créer un blocage

| # | Action | Attendu |
|---|--------|---------|
| 4.5.1 | Cliquer **🔒 Bloquear horario** | Formulaire s'ouvre avec date pré-remplie |
| 4.5.2 | Cocher "Toda la jornada", motif "Test" → Guardar | Créneau allDay créé, visible dans le calendrier |
| 4.5.3 | Créer un blocage partiel : date + heure + durée 2h | Créneau créé sur ce créneau horaire |
| 4.5.4 | Vérifier que le bloc allDay tombe bien le bon jour | Pas de décalage d'un jour |

---

## MODULE 5 — Planning (`/planning`)

### 5.1 Affichage

| # | Action | Attendu |
|---|--------|---------|
| 5.1.1 | Ouvrir `/planning` | Tableau des réservations **confirmées** du mois courant |
| 5.1.2 | Vérifier colonnes | Fecha / Código / Tour / Inicio / Fin / Pers. / Nacionalidad |
| 5.1.3 | Réservation "Toda la jornada" | Colonne Inicio = "☀ Jornada", Fin = "—" |
| 5.1.4 | Ligne bloquée | Fond sombre, icône 🔒, motif en italique |
| 5.1.5 | Résumé en haut | "X reservas · Y personas · 🔒 Z bloqueados" |

### 5.2 Navigation mois

| # | Action | Attendu |
|---|--------|---------|
| 5.2.1 | Cliquer **‹** / **›** | Mois précédent / suivant |
| 5.2.2 | Changer le select "Mes" directement | Mois correspondant s'affiche |
| 5.2.3 | Naviguer vers un mois sans activité | Message "Sin actividad en [Mes] [Año]" |

---

## MODULE 6 — Statistiques (`/stats`) ← NOUVEAU v1.7

### 6.1 Filtre temporel

| # | Action | Attendu |
|---|--------|---------|
| 6.1.1 | Ouvrir `/stats` | Filtre par défaut = **Año completo** + année courante |
| 6.1.2 | Vérifier les KPIs en mode "Año completo" | KPIs agrègent toutes les réservations de l'année |
| 6.1.3 | Cliquer **‹** en mode "Año completo" | L'année recule d'un an (mois ne change pas) |
| 6.1.4 | Cliquer **›** en mode "Año completo" | L'année avance d'un an |
| 6.1.5 | Sélectionner un mois (ex: Marzo) | KPIs se recalculent sur mars uniquement |
| 6.1.6 | En mode mois, cliquer **‹** depuis Enero | Passe à Diciembre de l'année précédente |
| 6.1.7 | En mode mois, cliquer **›** depuis Diciembre | Passe à Enero de l'année suivante |
| 6.1.8 | Repasser sur "Año completo" | KPIs reviennent à l'agrégat annuel |

### 6.2 Graphique "Reservas por mes"

| # | Action | Attendu |
|---|--------|---------|
| 6.2.1 | Vérifier le graphique en barres | 12 barres visibles (Ene → Dic), couleurs empilées |
| 6.2.2 | En mode mois sélectionné, barre du mois actif | Barre à opacité 100%, anneau amber visible, autres à 40% |
| 6.2.3 | En mode "Año completo" | Aucune barre mise en évidence |
| 6.2.4 | Survoler une barre | Tooltip : nb confirmadas / pendientes / rechazadas / conflictos |
| 6.2.5 | Cliquer une barre | Filtre mois change vers le mois cliqué |

### 6.3 Heatmap activité annuelle ← NOUVEAU v1.7

| # | Action | Attendu |
|---|--------|---------|
| 6.3.1 | Vérifier la grille heatmap | 12 mini-calendriers en grille (3 cols mobile, 4 cols desktop) |
| 6.3.2 | Vérifier qu'aucun mois ne contient des jours d'un autre mois | Mars affiche uniquement les jours 1–31 mars |
| 6.3.3 | Vérifier les jours de padding | Cellules vides (sans couleur) avant le 1er et après le dernier jour du mois |
| 6.3.4 | Vérifier les labels jours (L M X J V S D) | Labels visibles au-dessus de chaque mini-calendrier |
| 6.3.5 | Vérifier l'échelle de couleur | Dynamique selon le max du jour : mauve (peu) → orange → jaune → vert (beaucoup) |
| 6.3.6 | Survoler une cellule avec réservations | Tooltip : date + nb confirmadas + nb autres |
| 6.3.7 | Survoler une cellule sans réservation | Tooltip : "Sin reservas" |
| 6.3.8 | Heatmap sans données (année vide) | Toutes les cellules en gris neutre |
| 6.3.9 | Toute l'année visible sans scroll horizontal | Les 12 mois s'affichent dans la fenêtre |

### 6.4 Autres blocs stats

| # | Action | Attendu |
|---|--------|---------|
| 6.4.1 | Bloc "Por plataforma" | Barres par source avec taux de confirmation |
| 6.4.2 | Bloc "Tours más reservados" | Top 5 tours par nb de réservations confirmées |
| 6.4.3 | Bloc "Top nacionalidades" | Drapeaux SVG + compteurs |
| 6.4.4 | Bloc "Día de la semana" | 7 barres Lun–Dom |
| 6.4.5 | Bloc "Franja horaria" | Mañana / Tarde / Noche / Jornada completa |
| 6.4.6 | Bloc "Por tipo de ruta" | Barres corta / media / larga avec revenus |

---

## MODULE 7 — Logs (`/logs`)

### 7.1 Affichage et filtres

| # | Action | Attendu |
|---|--------|---------|
| 7.1.1 | Ouvrir `/logs` | Liste des événements (created / confirmed / refused / deleted) |
| 7.1.2 | Filtrer par type | Seuls les logs du type sélectionné |
| 7.1.3 | Taper dans la recherche | Logs filtrés par contenu |

### 7.2 Actions dangereuses

| # | Action | Attendu |
|---|--------|---------|
| 7.2.1 | Cliquer **Vaciar logs** → confirmer | Tous les logs supprimés |
| 7.2.2 | Cliquer **🗑 Vaciar toda la aplicación** → confirmer 2× | Réservations + bloqueados + logs supprimés |

### 7.3 Données de démo

| # | Action | Attendu |
|---|--------|---------|
| 7.3.1 | Cliquer **✦ Cargar datos de demo** (base vide) | Message de succès. Volumes : ~80 historiques + 21 futures + 35 bloqueados |
| 7.3.2 | Vérifier le message de confirmation | Volumes corrects affichés (pas "27 reservas") |

---

## MODULE 8 — Administration (`/admin`) ← NOUVEAU v1.7 (tarifs)

### 8.1 Champs tarifas pré-remplis

| # | Action | Attendu |
|---|--------|---------|
| 8.1.1 | Ouvrir `/admin` sans avoir enregistré de tarifs | Champs tarifs désactivés (opacity 50%) pendant le chargement, placeholder "…" |
| 8.1.2 | Une fois chargé, sans tarifs enregistrés | Champs vides avec placeholder "ej: 120 / ej: 200 / ej: 350" |
| 8.1.3 | Saisir des tarifs (ex: 120 / 200 / 350) et cliquer **Guardar tarifas** | Message "✓ Guardado" apparaît |
| 8.1.4 | Naviguer vers une autre page puis revenir sur `/admin` | Les 3 champs tarifs affichent bien 120 / 200 / 350 (pré-remplis depuis la DB) |
| 8.1.5 | Modifier un tarif et enregistrer | Nouvelle valeur persistée, visible au rechargement |

### 8.2 Thèmes et intégrations

| # | Action | Attendu |
|---|--------|---------|
| 8.2.1 | Changer de thème (ex: Océano) | Couleurs changent immédiatement sans rechargement |
| 8.2.2 | Rafraîchir la page | Thème Océano toujours actif |
| 8.2.3 | Activer une intégration (ex: WordPress) | Section se déplie avec URL webhook et champs |

---

## MODULE 9 — Cohérence transversale

| # | Action | Attendu |
|---|--------|---------|
| 9.1 | Confirmer une réservation depuis dashboard | Visible comme confirmée dans /calendar ET /planning |
| 9.2 | Supprimer une réservation depuis /calendar | Disparaît du dashboard et du planning |
| 9.3 | Créer un blocage depuis /calendar | Visible dans la tuile 🔒 Bloqueados du dashboard |
| 9.4 | Les stats /stats reflètent les confirmations faites | KPIs et heatmap mis à jour après action |

---

## Checklist smoke test (régression rapide)

À faire après chaque déploiement :

- [ ] Dashboard charge sans erreur console, tuiles cohérentes
- [ ] Formulaire "Nueva reserva" crée une réservation
- [ ] Calendrier : vue semaine s'affiche, navigation fonctionne
- [ ] Planning : tableau visible avec données de démo
- [ ] Stats : heatmap 12 mois visible sans scroll, filtre "Año completo" fonctionnel
- [ ] Admin : champs tarifs pré-remplis après rechargement
- [ ] Logs : logs visibles, reset fonctionne
- [ ] Drapeaux nationalités s'affichent (pas de lettres brutes)
- [ ] Aucune erreur TypeScript (`npx tsc --noEmit`)
