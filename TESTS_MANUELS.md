# HORUS — Suite de tests manuels

> App version : 1.4  
> Test suite : v1.4 (stable)  
> URL locale : http://localhost:3000  
> Légende : ✅ Passé · ❌ Échoué · ⏭ Ignoré

---

## Préparation avant les tests

| # | Action | Attendu |
|---|--------|---------|
| P1 | `npm run dev` dans le terminal | Serveur démarré sur http://localhost:3000 |
| P2 | Ouvrir http://localhost:3000/logs | Page Logs visible |
| P3 | Cliquer **"🗑 Vaciar toda la aplicación"** → confirmer 2× | Toast ou rechargement. Base vide |
| P4 | Aller sur http://localhost:3000/logs → cliquer **"Demo"** | Message de succès. 27 réservations + 35 bloqueados créés |

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
| 1.1.7 | Cliquer tuile **🔒 Bloqueados** | Liste de créneaux bloqués s'affiche (tableau avec Fecha/Hora/Duración/Motivo) |
| 1.1.8 | Vérifier que les bloqueados passés sont grisés | Lignes passées à 40% d'opacité |

### 1.2 Recherche

| # | Action | Attendu |
|---|--------|---------|
| 1.2.1 | Taper "Sophie" dans la barre de recherche | Seule(s) la/les réservation(s) de Sophie Martin s'affiche(nt) |
| 1.2.2 | Taper "Bardenas" | Toutes les réservations du tour Bardenas Reales |
| 1.2.3 | Taper "mail.fr" | Résultats filtrés par domaine email |
| 1.2.4 | Effacer le champ | Toutes les réservations reviennent |

### 1.3 Filtres avancés

| # | Action | Attendu |
|---|--------|---------|
| 1.3.1 | Cliquer **Filtros** | Panneau avec Estado / Plataforma / Fecha desde / Fecha hasta / Ordenar par / Direction |
| 1.3.2 | Sélectionner Estado = "Pendiente" | Seules les réservations pending s'affichent |
| 1.3.3 | Sélectionner Plataforma = "Viator" | Filtre combiné : pending + viator |
| 1.3.4 | Définir Fecha desde = aujourd'hui + 5j | Réservations antérieures disparaissent |
| 1.3.5 | Cliquer **Restablecer filtros** | Tous les filtres remis à zéro |
| 1.3.6 | Vérifier compteur badge sur bouton Filtros | Affiche le nombre de filtres actifs (ex: "2") |
| 1.3.7 | Sélectionner Estado = "🔒 Bloqueado" | Tableau des bloqueados s'affiche |

### 1.4 Tri rapide

| # | Action | Attendu |
|---|--------|---------|
| 1.4.1 | Cliquer **Fecha** (tri rapide, hors panneau filtres) | Tri par date ascendant |
| 1.4.2 | Cliquer **Fecha** une 2e fois | Tri inversé (descendant ↓) |
| 1.4.3 | Cliquer **Cliente** | Tri alphabétique par nom de client |
| 1.4.4 | Cliquer **Pers.** | Tri par nombre de participants |

### 1.5 Pagination

| # | Action | Attendu |
|---|--------|---------|
| 1.5.1 | Vérifier la pagination avec les données de démo | Boutons de pagination visibles si > 15 réservations |
| 1.5.2 | Cliquer » (dernière page) | Dernière page affichée |
| 1.5.3 | Cliquer « (première page) | Retour page 1 |
| 1.5.4 | Cliquer un numéro de page intermédiaire | Page correspondante affichée |
| 1.5.5 | Changer un filtre pendant la pagination | Page reset à 1 automatiquement |

### 1.6 BookingCard

| # | Action | Attendu |
|---|--------|---------|
| 1.6.1 | Inspecter une carte de réservation confirmée | Bandeau vert, label "Confirmada", bouton "Eliminar" visible, pas de boutons Aceptar/Rechazar |
| 1.6.2 | Inspecter une carte pending | Boutons **✓ Aceptar** et **✗ Rechazar** visibles |
| 1.6.3 | Vérifier l'affichage du drapeau nationalité | Drapeau SVG visible (ex : drapeau 🇫🇷 pour FR) — pas de lettres brutes |
| 1.6.4 | Vérifier le code réservation | Format RCS (ex: RCV = Ruta Corta Viator), RMG = Ruta Media GetYourGuide |
| 1.6.5 | Vérifier réservation "wordpress" | Code sans 3ème caractère (ex: RC = Ruta Corta sans source initiale) |

---

## MODULE 2 — Créer une réservation (formulaire "Nueva reserva")

### 2.1 Validation basique

| # | Action | Attendu |
|---|--------|---------|
| 2.1.1 | Cliquer **+ Nueva reserva** | Formulaire s'ouvre |
| 2.1.2 | Soumettre sans remplir les champs | Erreur : "Faltan campos obligatorios" |
| 2.1.3 | Remplir tous les champs obligatoires et soumettre | Réservation créée, formulaire se ferme, tuile Total +1 |

### 2.2 Champs optionnels

| # | Action | Attendu |
|---|--------|---------|
| 2.2.1 | Sélectionner une nationalité (ex: Alemania) | Champ enregistré, drapeau visible sur la carte |
| 2.2.2 | Sélectionner un type de ruta (ex: Larga) | Code réservation affiche "L" en 2e position |
| 2.2.3 | Cocher "Toda la jornada" | Champ heure disparaît, champ durée disparaît |
| 2.2.4 | Décocher "Toda la jornada" | Champ heure et durée reviennent |
| 2.2.5 | Sélectionner une durée | Visible sur la carte créée |
| 2.2.6 | Vérifier le sélecteur d'heure | Saut de 30 min (09:00, 09:30, 10:00...) — pas de 09:15 |

### 2.3 Anti-double-booking

| # | Action | Attendu |
|---|--------|---------|
| 2.3.1 | Créer réservation A : date X, 09:00, 2h (confirmée) | Réservation A pending → la confirmer manuellement |
| 2.3.2 | Créer réservation B : même date X, 09:30, 2h | B créée avec status "refused" automatiquement (chevauchement) |
| 2.3.3 | Créer réservation sur un jour entièrement bloqué | Erreur 409 : "Créneau bloqué : [motivo]" affiché sous le formulaire |
| 2.3.4 | Créer réservation en dehors du créneau bloqué | Réservation créée normalement |

---

## MODULE 3 — Actions sur réservations

### 3.1 Accepter / Refuser (dashboard)

| # | Action | Attendu |
|---|--------|---------|
| 3.1.1 | Sur une carte "pending", cliquer **✓ Aceptar** | Status passe à "confirmed", tuiles mises à jour |
| 3.1.2 | Sur une carte "pending", cliquer **✗ Rechazar** | Status passe à "refused" |
| 3.1.3 | Tenter de confirmer une réservation en conflit horaire avec une déjà confirmée | Message d'erreur : "Conflicto de horario con la reserva de [Nombre]" |

### 3.2 Supprimer (dashboard)

| # | Action | Attendu |
|---|--------|---------|
| 3.2.1 | Sur une carte, cliquer **Eliminar reserva** | Confirmation navigateur |
| 3.2.2 | Confirmer la suppression | Carte disparaît, compteur Total -1 |
| 3.2.3 | Annuler la confirmation | Rien ne se passe |

### 3.3 Accepter / Refuser (calendrier)

| # | Action | Attendu |
|---|--------|---------|
| 3.3.1 | Ouvrir `/calendar`, cliquer un événement pending | Panneau latéral s'ouvre avec boutons Aceptar / Rechazar |
| 3.3.2 | Cliquer **✓ Aceptar** | Couleur de l'événement passe au vert, panneau mis à jour |
| 3.3.3 | Cliquer **✗ Rechazar** | Couleur passe au rouge |

---

## MODULE 4 — Calendrier (`/calendar`)

### 4.1 Vues

| # | Action | Attendu |
|---|--------|---------|
| 4.1.1 | Charger `/calendar` | Vue hebdomadaire par défaut |
| 4.1.2 | Cliquer **Mes** | Vue mensuelle (grille) |
| 4.1.3 | Cliquer **Semana** | Vue hebdomadaire |
| 4.1.4 | Cliquer **Día** | Vue journalière |
| 4.1.5 | Cliquer **Lista** | Vue liste |

### 4.2 Navigation

| # | Action | Attendu |
|---|--------|---------|
| 4.2.1 | Cliquer **‹** (précédent) | Semaine/mois/jour précédent |
| 4.2.2 | Cliquer **›** (suivant) | Semaine/mois/jour suivant |
| 4.2.3 | Cliquer **Hoy** | Retour à la date du jour |
| 4.2.4 | Vérifier le titre du calendrier | Affiche la période courante (ex: "14 – 20 abr 2026") |
| 4.2.5 | Naviguer plusieurs semaines en avant | Titre se met à jour à chaque clic |

### 4.3 Affichage des réservations

| # | Action | Attendu |
|---|--------|---------|
| 4.3.1 | Vue semaine : vérifier couleurs | Amber = pending, Vert = confirmed, Rouge = refused |
| 4.3.2 | Vue mensuelle Gantt : réservation qui commence tard dans la journée | Heure visible (non coupée) à droite de la barre si déborde |
| 4.3.3 | Vue mensuelle : réservation "Toda la jornada" | Barre pleine sur la ligne, sans heure |
| 4.3.4 | Cliquer un événement | Panneau latéral avec détails (tour, client, email, participants, flag nationalité, code OTA) |
| 4.3.5 | Fermer le panneau latéral (×) | Panneau disparaît |

### 4.4 Créneaux bloqués sur le calendrier

| # | Action | Attendu |
|---|--------|---------|
| 4.4.1 | Vue mensuelle Gantt : naviguer vers août 2026 | Barres grises "Vacaciones verano" visibles sur 3-14 août |
| 4.4.2 | Vue semaine : naviguer vers un jour bloqué allDay | Fond grisé sur toute la journée (background event) |
| 4.4.3 | Vue semaine : naviguer vers un jour avec blocage partiel | Bloc gris sur le créneau horaire concerné |
| 4.4.4 | Vue journalière : vérifier blocage allDay | Toute la journée grisée |
| 4.4.5 | Vue liste : vérifier que les bloqueados N'apparaissent PAS | Liste ne contient que des réservations |
| 4.4.6 | Cliquer un créneau bloqué (vue semaine/jour) | Panneau latéral "🔒 Bloqueado" avec motif et date |
| 4.4.7 | Dans le panneau, cliquer **Eliminar bloqueo** | Créneau supprimé, calendrier mis à jour |

### 4.5 Créer un blocage

| # | Action | Attendu |
|---|--------|---------|
| 4.5.1 | Cliquer **🔒 Bloquear horario** | Formulaire s'ouvre |
| 4.5.2 | Remplir date, cocher "Toda la jornada", motif "Test" → Guardar | Créneau créé allDay, visible dans le calendrier |
| 4.5.3 | Créer un blocage partiel : date + heure + durée 2h | Créneau créé sur ce créneau, visible en vue semaine/jour |
| 4.5.4 | Cliquer **Cancelar** | Formulaire se ferme sans créer |
| 4.5.5 | Vérifier que le bloc allDay tombe bien le bon jour | Pas de décalage d'un jour (timezone fix T12:00) |

---

## MODULE 5 — Planning (`/planning`)

### 5.1 Affichage

| # | Action | Attendu |
|---|--------|---------|
| 5.1.1 | Ouvrir `/planning` | Tableau des réservations **confirmées** du mois courant |
| 5.1.2 | Vérifier colonnes | Fecha / Código / Tour / Inicio / Fin / Pers. / Nacionalidad |
| 5.1.3 | Vérifier le code réservation | Format RCS, RMG, etc. |
| 5.1.4 | Vérifier le drapeau nationalité | Flag SVG visible par ligne |
| 5.1.5 | Réservation "Toda la jornada" | Colonne Inicio affiche "☀ Jornada", Fin affiche "—" |
| 5.1.6 | Ligne bloquée | Fond sombre, icône 🔒, motif en italique, Pers = — |
| 5.1.7 | Total en pied de tableau | Somme des participants sur le mois |
| 5.1.8 | Résumé en haut | "X reservas · Y personas · 🔒 Z bloqueados" |

### 5.2 Navigation mois

| # | Action | Attendu |
|---|--------|---------|
| 5.2.1 | Cliquer **‹** | Mois précédent |
| 5.2.2 | Cliquer **›** | Mois suivant |
| 5.2.3 | Changer le select "Mes" directement | Mois correspondant s'affiche |
| 5.2.4 | Changer l'année | Liste des années filtrée selon les données existantes |
| 5.2.5 | Naviguer vers un mois sans activité | Message "Sin actividad en [Mes] [Año]" |
| 5.2.6 | Naviguer vers juillet 2027 | Ligne bloquée "💍 Boda de Clara y Alexis" visible le 3 juillet |

---

## MODULE 6 — Logs (`/logs`)

### 6.1 Affichage

| # | Action | Attendu |
|---|--------|---------|
| 6.1.1 | Ouvrir `/logs` | Liste des événements par ordre chronologique descendant |
| 6.1.2 | Vérifier types de logs | "created", "confirmed", "refused", "deleted" avec codes couleur |
| 6.1.3 | Créer une réservation puis revenir sur Logs | Nouvelle entrée "created" en tête de liste |
| 6.1.4 | Confirmer une réservation puis vérifier Logs | Entrée "confirmed" ajoutée |

### 6.2 Filtres logs

| # | Action | Attendu |
|---|--------|---------|
| 6.2.1 | Filtrer par type "created" | Seuls les logs de création |
| 6.2.2 | Taper dans la recherche (ex : "Bardenas") | Logs filtrés par contenu |

### 6.3 Actions dangereuses

| # | Action | Attendu |
|---|--------|---------|
| 6.3.1 | Cliquer **Vaciar logs** → confirmer | Tous les logs supprimés |
| 6.3.2 | Cliquer **🗑 Vaciar toda la aplicación** → annuler à la 1ère confirmation | Rien supprimé |
| 6.3.3 | Cliquer **🗑 Vaciar toda la aplicación** → annuler à la 2e confirmation | Rien supprimé |
| 6.3.4 | Cliquer **🗑 Vaciar toda la aplicación** → confirmer 2× | Réservations + bloqueados + logs supprimés. Dashboard = 0 partout |

### 6.4 Données de démo

| # | Action | Attendu |
|---|--------|---------|
| 6.4.1 | Cliquer **Demo** (base vide) | Succès : "27 reservas + 37 bloqueados créés" |
| 6.4.2 | Cliquer **Demo** (base déjà remplie) | Erreur affichée (contrainte unicité ou log d'erreur) |

---

## MODULE 7 — Données de démo (seed)

| # | Action | Attendu |
|---|--------|---------|
| 7.1 | Après seed : vérifier les 5 sources | viator, getyourguide, civitatis, wordpress, manual tous présents |
| 7.2 | Vérifier les 3 statuts | confirmed, pending, refused tous présents |
| 7.3 | Vérifier les 3 types de ruta | corta, media, larga tous présents |
| 7.4 | Vérifier réservations allDay | Au moins 5 réservations avec "Toda la jornada" |
| 7.5 | Naviguer vers août 2026 (planning) | 10 jours bloqués "Vacaciones verano" |
| 7.6 | Naviguer vers décembre 2026 (planning) | Bloqueados Navidad + festivos |
| 7.7 | Naviguer vers juillet 2027 | "💍 Boda de Clara y Alexis" le 3 juillet |
| 7.8 | Vérifier variété nationalités | FR, DE, ES, IT, PT, NL, GB, US, JP, AR, MX, BR, CA, BE, NO, SE |

---

## MODULE 8 — Comportements transversaux

### 8.1 Cohérence des données entre pages

| # | Action | Attendu |
|---|--------|---------|
| 8.1.1 | Confirmer une réservation depuis le dashboard | Visible comme confirmée dans /calendar ET /planning |
| 8.1.2 | Supprimer une réservation depuis /calendar | Disparaît du dashboard et du planning |
| 8.1.3 | Créer un blocage depuis /calendar | Visible dans la tuile 🔒 Bloqueados du dashboard |
| 8.1.4 | Supprimer un blocage depuis /calendar | Tuile 🔒 Bloqueados décrémentée dans le dashboard |

### 8.2 États vides

| # | Action | Attendu |
|---|--------|---------|
| 8.2.1 | Vider l'app → ouvrir dashboard | Tuiles à 0, message "Sin reservas con estos filtros" |
| 8.2.2 | Filtre "blocked" avec base vide | Message "Sin horarios bloqueados" avec icône 🔒 |
| 8.2.3 | Planning sur mois sans données | Message "Sin actividad en [Mes] [Año]" |

### 8.3 Actualisation

| # | Action | Attendu |
|---|--------|---------|
| 8.3.1 | Cliquer bouton **↻** (refresh) du dashboard | Données rechargées depuis la base |
| 8.3.2 | Rafraîchir la page navigateur (F5) | Données toujours présentes (persistance BDD) |

---

## Checklist de régression rapide (smoke test)

À faire après chaque déploiement ou grosse modification :

- [ ] Dashboard charge sans erreur console
- [ ] Les 5 tuiles affichent des chiffres cohérents
- [ ] Le formulaire "Nueva reserva" crée une réservation
- [ ] Calendrier : vue semaine s'affiche, navigation fonctionne
- [ ] Planning : tableau visible avec données de démo
- [ ] Logs : logs visibles, actions de reset fonctionnent
- [ ] Un créneau bloqué allDay bloque bien la création d'une réservation
- [ ] Les drapeaux nationalités s'affichent (pas de lettres brutes)
