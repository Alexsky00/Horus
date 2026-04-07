# ☀ Horus — Gestion des Réservations Touristiques

MVP simple pour gérer tes réservations Viator, GetYourGuide, Civitatis et WordPress depuis un seul endroit, avec notifications push sur Android.

---

## Fonctionnalités

- Dashboard : liste des réservations avec filtres (en attente / confirmées / refusées)
- Accepter ou refuser une réservation en un clic
- Anti double-booking automatique
- Calendrier visuel (vue mois / semaine)
- Notifications push sur Android (PWA)
- Email de fallback (optionnel)
- Simulation de réservations OTA (pour tester sans vrai webhook)

---

## Stack

- **Next.js 14** (App Router) — frontend + backend dans un seul projet
- **PostgreSQL** via [Supabase](https://supabase.com) (gratuit)
- **Prisma** — ORM
- **web-push** — notifications push Android
- **FullCalendar** — calendrier
- **Tailwind CSS** — styles
- **Vercel** — déploiement (gratuit)

---

## Démarrage rapide (moins de 2 heures)

### Étape 1 — Créer le repo GitHub

1. Va sur https://github.com/Arrondiko
2. Clique **New repository**
3. Nom : `horus`, visibilité : Public ou Private
4. **Ne pas** cocher "Initialize with README"
5. Clique **Create repository**

Dans ton terminal VSCode (dans le dossier du projet) :

```bash
git init
git add .
git commit -m "chore: initial commit Horus MVP"
git branch -M main
git remote add origin https://github.com/Arrondiko/horus.git
git push -u origin main
```

---

### Étape 2 — Créer la base de données Supabase

1. Va sur https://supabase.com → **New project**
2. Nom : `horus`, choisis un mot de passe fort, région : Europe West
3. Attends 2 minutes que le projet se crée
4. Va dans **Settings → Database → Connection string → URI**
5. Copie l'URL (commence par `postgresql://postgres:...`)

---

### Étape 3 — Configurer l'environnement local

```bash
# Copier le fichier d'exemple
cp .env.example .env
```

Ouvre `.env` et remplis :

```
DATABASE_URL="postgresql://postgres:[TON_MOT_DE_PASSE]@db.[ID_PROJET].supabase.co:5432/postgres"
```

---

### Étape 4 — Générer les clés VAPID (notifications push)

```bash
npm install
npm run generate:vapid
```

Copie les deux lignes affichées dans ton `.env` :

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:ton@email.com
```

---

### Étape 5 — Créer les tables en base

```bash
npx prisma db push
```

Tu dois voir : `All migrations have been applied successfully.`

---

### Étape 6 — Lancer en local

```bash
npm run dev
```

Ouvre http://localhost:3000 dans ton navigateur.

---

### Étape 7 — Ajouter les icônes PWA

Crée deux images PNG :
- `public/icons/icon-192.png` (192×192 px)
- `public/icons/icon-512.png` (512×512 px)

Tu peux utiliser https://favicon.io ou n'importe quel outil d'image.
(Sans icônes, la PWA fonctionne quand même, juste sans logo personnalisé.)

---

## Tester les notifications Android

### Sur ton PC (Chrome recommandé)

1. Ouvre http://localhost:3000
2. Clique **"Activer les notifications"** → Autorise dans le popup Chrome
3. Clique **"Tester"** → Tu dois recevoir une notification

### Sur ton téléphone Android

1. Déploie d'abord sur Vercel (voir section Déploiement)
2. Ouvre l'URL Vercel dans Chrome Android
3. Chrome propose **"Ajouter à l'écran d'accueil"** → Accepte
4. L'app s'installe comme une appli Android
5. Ouvre l'app installée → Active les notifications
6. Clique "Tester" → Notification reçue même app fermée ✓

---

## Simuler une réservation

### Via l'interface web

1. Ouvre http://localhost:3000
2. Clique **"+ Simuler une réservation OTA"**
3. Remplis le formulaire → **Créer la réservation**
4. La réservation apparaît dans la liste avec le statut "En attente"
5. Clique **Accepter** ou **Refuser**

### Via curl (terminal)

```bash
# Assure-toi que OTA_WEBHOOK_SECRET est défini dans .env
curl -X POST http://localhost:3000/api/simulate-ota \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: change_moi_en_secret_aleatoire" \
  -d '{
    "source": "viator",
    "guestName": "Sophie Bernard",
    "guestEmail": "sophie@example.com",
    "tourName": "Randonnée Bardenas",
    "date": "2024-07-20T09:00:00Z",
    "participants": 3
  }'
```

### Tester l'anti double-booking

```bash
# Envoie deux fois la même réservation :
# La 2ème sera automatiquement refusée si la 1ère est confirmée
```

---

## Déploiement sur Vercel (gratuit)

1. Va sur https://vercel.com → **New Project**
2. Connecte ton GitHub → importe le repo `horus`
3. Dans **Environment Variables**, ajoute toutes les variables de `.env`
4. **Ne pas** mettre `DATABASE_URL` dans les vars publiques (elle contient ton mot de passe)
5. Clique **Deploy**
6. En 2 minutes, ton app est en ligne sur `https://horus-xxx.vercel.app`

---

## Structure du projet

```
horus/
├── prisma/
│   └── schema.prisma          # Schéma base de données
├── public/
│   ├── manifest.json          # Config PWA
│   ├── sw.js                  # Service Worker (notifications)
│   └── icons/                 # Icônes PWA (à créer)
├── src/
│   ├── app/
│   │   ├── page.tsx            # Dashboard principal
│   │   ├── layout.tsx          # Layout + header nav
│   │   ├── globals.css         # Styles Tailwind
│   │   ├── calendar/
│   │   │   └── page.tsx        # Page calendrier
│   │   └── api/
│   │       ├── bookings/
│   │       │   ├── route.ts    # GET (liste) + POST (créer)
│   │       │   └── [id]/
│   │       │       └── route.ts # PATCH (accepter/refuser) + DELETE
│   │       ├── simulate-ota/
│   │       │   └── route.ts    # Webhook simulation OTA
│   │       └── push/
│   │           ├── subscribe/
│   │           │   └── route.ts # Abonnement push
│   │           └── send/
│   │               └── route.ts # Envoi notification test
│   ├── components/
│   │   ├── BookingCard.tsx     # Carte réservation
│   │   ├── Calendar.tsx        # Composant FullCalendar
│   │   └── PushSubscribe.tsx   # Bouton activation notifications
│   └── lib/
│       ├── db.ts               # Singleton Prisma
│       └── push.ts             # Helpers web-push + email
├── .env.example
├── package.json
└── README.md
```

---

## API Reference

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/bookings` | Liste des réservations (filtres: `?status=pending`) |
| POST | `/api/bookings` | Créer une réservation |
| PATCH | `/api/bookings/:id` | Accepter/refuser `{"status":"confirmed"}` |
| DELETE | `/api/bookings/:id` | Supprimer une réservation |
| POST | `/api/simulate-ota` | Simuler un webhook OTA (header: `X-Webhook-Secret`) |
| POST | `/api/push/subscribe` | Enregistrer un abonnement push |
| DELETE | `/api/push/subscribe` | Se désabonner |
| POST | `/api/push/send` | Envoyer une notification test |

---

## Variables d'environnement

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `DATABASE_URL` | URL PostgreSQL Supabase | ✓ |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clé VAPID publique | ✓ |
| `VAPID_PRIVATE_KEY` | Clé VAPID privée | ✓ |
| `VAPID_EMAIL` | Email pour VAPID (format: `mailto:...`) | ✓ |
| `OTA_WEBHOOK_SECRET` | Secret pour endpoint simulate-ota | ✓ |
| `SMTP_HOST` | Serveur SMTP email | optionnel |
| `SMTP_PORT` | Port SMTP (défaut: 587) | optionnel |
| `SMTP_USER` | Utilisateur SMTP | optionnel |
| `SMTP_PASS` | Mot de passe SMTP | optionnel |
| `NOTIFY_EMAIL` | Email destinataire notifications | optionnel |

---

## Commandes utiles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npx prisma db push   # Synchroniser le schéma avec la DB
npx prisma studio    # Interface graphique de la DB (localhost:5555)
npm run generate:vapid  # Générer de nouvelles clés VAPID
```
