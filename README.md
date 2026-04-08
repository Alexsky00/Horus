# ☀ Horus — Mode d'emploi complet

Système de gestion des réservations pour guide touristique.
Viator · GetYourGuide · Civitatis · WordPress → un seul tableau de bord.

---

## Ce que fait l'application

| Fonctionnalité | Détail |
|---|---|
| Dashboard | Liste de toutes tes réservations, filtrables par statut |
| Accepter / Refuser | Un seul bouton, confirmation instantanée |
| Anti double-booking | Si tu acceptes une réservation, toute autre demande sur le même tour à la même date est automatiquement bloquée |
| Calendrier | Vue mensuelle et hebdomadaire, couleurs par statut |
| Notification push Android | Tu reçois une alerte sur ton téléphone dès qu'une réservation arrive, même appli fermée |
| Email de secours | Si les notifications push ne passent pas, un email est envoyé |
| Simulation OTA | Tu peux créer de fausses réservations pour tester sans attendre Viator |

---

## Prérequis — Ce qu'il faut avoir

Avant de commencer, vérifie que tu as :

- [ ] **Node.js** installé — vérifie avec `node -v` dans le terminal (doit afficher v18 ou plus)
  - Si non : télécharge sur https://nodejs.org → prends la version "LTS"
- [ ] **Git** installé — vérifie avec `git -v`
  - Si non : télécharge sur https://git-scm.com
- [ ] **Visual Studio Code** ouvert dans le dossier `Horus`
- [ ] Un compte **GitHub** (gratuit) — https://github.com
- [ ] Un compte **Supabase** (gratuit) — https://supabase.com
- [ ] Un compte **Vercel** (gratuit) — https://vercel.com

---

## ÉTAPE 1 — Ouvrir le terminal dans VSCode

Dans VSCode :
- Menu **Terminal → New Terminal** (ou `Ctrl + J`)
- Le terminal s'ouvre en bas. Vérifie que tu es dans le bon dossier :

```bash
pwd
```

Tu dois voir quelque chose comme `/c/Users/Utilisateur/Horus`.
Si ce n'est pas le cas :

```bash
cd /c/Users/Utilisateur/Horus
```

---

## ÉTAPE 2 — Créer la base de données Supabase

### 2.1 Créer un projet Supabase

1. Va sur https://supabase.com
2. Clique **Start your project** → connecte-toi avec GitHub ou email
3. Clique **New Project**
4. Remplis :
   - **Organization** : ton nom ou "Personnel"
   - **Name** : `horus`
   - **Database Password** : choisis un mot de passe fort, **note-le**, tu en auras besoin
   - **Region** : `West EU (Ireland)` (le plus proche de l'Espagne)
5. Clique **Create new project**
6. Attends 2-3 minutes → tu vois une page avec un tableau de bord vert

### 2.2 Récupérer l'URL de connexion

1. Dans ton projet Supabase, clique **Settings** (icône engrenage, en bas à gauche)
2. Clique **Database**
3. Fais défiler jusqu'à **Connection string**
4. Choisis l'onglet **URI**
5. Copie l'URL entière. Elle ressemble à :

```
postgresql://postgres:[MOT_DE_PASSE]@db.abcdefghijkl.supabase.co:5432/postgres
```

**Remplace `[MOT_DE_PASSE]` par le mot de passe que tu as choisi à l'étape 2.1.**

Exemple réel :
```
postgresql://postgres:MonMotDePasse123@db.xyzxyzxyz.supabase.co:5432/postgres
```

---

## ÉTAPE 3 — Configurer l'environnement (.env)

### 3.1 Copier le fichier de configuration

Dans le terminal VSCode :

```bash
cp .env.example .env
```

### 3.2 Ouvrir et remplir le fichier .env

Dans VSCode, ouvre le fichier `.env` (clique dessus dans l'explorateur à gauche).

Tu vois ceci :

```
DATABASE_URL="postgresql://postgres:[MOT_DE_PASSE]@db.[ID_PROJET].supabase.co:5432/postgres"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="ta_cle_publique_vapid"
VAPID_PRIVATE_KEY="ta_cle_privee_vapid"
VAPID_EMAIL="mailto:ton@email.com"
...
```

**Remplis uniquement la ligne `DATABASE_URL` pour l'instant** avec l'URL copiée à l'étape 2.2.

Exemple :
```
DATABASE_URL="postgresql://postgres:MonMotDePasse123@db.xyzxyzxyz.supabase.co:5432/postgres"
```

Laisse les autres lignes vides pour l'instant.

---

## ÉTAPE 4 — Installer les dépendances

Dans le terminal :

```bash
npm install
```

Tu vas voir beaucoup de texte défiler. C'est normal.
Attends que ça finisse (1-3 minutes). Tu dois voir `added XXX packages` à la fin.

**Si tu vois une erreur `EACCES` ou `permission denied` :**
```bash
npm install --legacy-peer-deps
```

---

## ÉTAPE 5 — Générer les clés VAPID (notifications push)

Les clés VAPID permettent à ton serveur d'envoyer des notifications push sécurisées sur Android.

```bash
npm run generate:vapid
```

Tu vas voir quelque chose comme :

```
VAPID_PUBLIC_KEY=BPXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Copie ces deux lignes et colle-les dans ton fichier `.env`.**

Remplis aussi `VAPID_EMAIL` avec ton adresse email :

```
VAPID_EMAIL="mailto:ton.email@gmail.com"
```

### 5.1 Remplir OTA_WEBHOOK_SECRET

C'est un mot de passe inventé qui sécurise l'endpoint de simulation.
Mets n'importe quelle chaîne sans espaces, par exemple :

```
OTA_WEBHOOK_SECRET="horus-secret-2024"
```

### Ton .env complet doit ressembler à ça

```env
DATABASE_URL="postgresql://postgres:MonMotDePasse@db.abcdef.supabase.co:5432/postgres"

NEXT_PUBLIC_VAPID_PUBLIC_KEY="BPXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VAPID_PRIVATE_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VAPID_EMAIL="mailto:ton.email@gmail.com"

OTA_WEBHOOK_SECRET="horus-secret-2024"

# Ces 4 lignes sont optionnelles (email de secours) — laisse-les vides pour l'instant
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
NOTIFY_EMAIL=""
```

**Sauvegarde le fichier : `Ctrl + S`**

---

## ÉTAPE 6 — Créer les tables en base de données

```bash
npx prisma db push
```

Tu dois voir à la fin :
```
Your database is now in sync with your Prisma schema.
```

Si tu vois une erreur de connexion (`P1001` ou `ECONNREFUSED`) :
- Vérifie que l'URL dans `.env` est correcte (pas d'espace, guillemets bien fermés)
- Vérifie que tu as bien remplacé `[MOT_DE_PASSE]` dans l'URL

---

## ÉTAPE 7 — Générer les icônes PWA

L'appli a besoin de deux icônes pour s'installer sur Android.

1. Dans VSCode, dans l'explorateur de fichiers à gauche, ouvre le dossier `public/icons/`
2. Clique droit sur `generate-icons.html` → **Reveal in File Explorer**
3. Double-clique sur `generate-icons.html` → ça s'ouvre dans Chrome
4. Clique **Télécharger icon-192.png** → sauvegarde dans `public/icons/`
5. Clique **Télécharger icon-512.png** → sauvegarde dans `public/icons/`

**Vérifie que les deux fichiers sont bien dans `public/icons/` :**
```bash
ls public/icons/
```
Tu dois voir : `generate-icons.html  icon-192.png  icon-512.png`

---

## ÉTAPE 8 — Lancer l'application en local

```bash
npm run dev
```

Tu dois voir :
```
▲ Next.js 14.x.x
- Local:   http://localhost:3000
- Ready in XXXms
```

Ouvre **http://localhost:3000** dans Chrome.

Tu vois le dashboard Horus avec :
- Le bandeau "Activer les notifications" en haut
- Les stats (tout à zéro)
- Le bouton "+ Simuler une réservation OTA" en bas

---

## ÉTAPE 9 — Activer les notifications push (sur PC d'abord)

1. Dans Chrome, sur http://localhost:3000
2. Clique **"Activer les notifications"**
3. Chrome affiche un popup en haut : **"Localhost souhaite afficher des notifications"**
4. Clique **Autoriser**
5. Le bouton devient vert : **"✓ Activées"**
6. Clique **"Tester"** → une notification apparaît dans le coin de l'écran

**Si le popup Chrome ne s'affiche pas :**
- Clique sur le cadenas dans la barre d'adresse
- Cherche "Notifications" → mets sur "Autoriser"
- Recharge la page

---

## ÉTAPE 10 — Tester une réservation complète

### 10.1 Créer une réservation simulée

1. Sur http://localhost:3000
2. Clique **"+ Simuler une réservation OTA"** (tout en bas)
3. Le formulaire s'ouvre. Remplis :
   - **Source** : Viator
   - **Tour** : Randonnée Bardenas
   - **Nom du client** : Marie Dupont
   - **Email** : marie@example.com
   - **Date & heure** : n'importe quelle date dans le futur
   - **Participants** : 2
4. Clique **"Créer la réservation"**

**Résultat attendu :**
- La réservation apparaît dans la liste avec le badge **"En attente"** et une bordure orange
- Une notification push s'affiche sur ton écran

### 10.2 Accepter la réservation

1. Dans la carte de réservation, clique **"✓ Accepter"**
2. La carte disparaît de la liste "En attente"
3. Change le filtre en "Confirmées" → la réservation est là avec une bordure verte

### 10.3 Tester l'anti double-booking

1. Crée une deuxième réservation **exactement sur le même tour et la même date**
2. Résultat : la 2ème est automatiquement créée avec le statut **"Refusée"**
3. Un message d'erreur s'affiche si tu essaies de confirmer manuellement une réservation qui double-bookerait

### 10.4 Voir le calendrier

1. Clique **"Calendrier"** dans la barre de navigation en haut
2. Tu vois les réservations sur le calendrier :
   - Orange = En attente
   - Vert = Confirmée
   - Rouge = Refusée
3. Clique sur un événement → les détails s'affichent

---

## ÉTAPE 11 — Créer le repo GitHub et pousser le code

### 11.1 Créer le repo sur GitHub

1. Va sur https://github.com/Arrondiko
2. Clique le bouton vert **"New"** (ou **"+"** en haut à droite → "New repository")
3. Remplis :
   - **Repository name** : `horus`
   - **Description** : `Système de gestion des réservations touristiques`
   - **Visibility** : Private (recommandé — ton .env ne sera pas public)
   - **NE PAS** cocher "Add a README file" (tu en as déjà un)
4. Clique **"Create repository"**

### 11.2 Pousser le code

Dans le terminal VSCode (arrête `npm run dev` avec `Ctrl+C` d'abord si nécessaire) :

```bash
git init
git add .
git commit -m "feat: MVP Horus — gestion réservations touristiques"
git branch -M main
git remote add origin https://github.com/Arrondiko/horus.git
git push -u origin main
```

Si GitHub demande tes identifiants :
- **Username** : ton nom d'utilisateur GitHub (Arrondiko)
- **Password** : **pas ton mot de passe GitHub** mais un **Personal Access Token**

Pour créer un token :
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token → coche `repo` → Generate
3. Copie le token et colle-le comme mot de passe

Relance le dev :
```bash
npm run dev
```

---

## ÉTAPE 12 — Déployer sur Vercel (accès depuis ton téléphone)

### 12.1 Connecter Vercel à GitHub

1. Va sur https://vercel.com
2. Connecte-toi avec **GitHub** (recommandé)
3. Clique **"Add New Project"**
4. Dans la liste de tes repos, clique **"Import"** à côté de `horus`
5. Vercel détecte automatiquement Next.js → ne change rien au Framework Preset

### 12.2 Ajouter les variables d'environnement

Avant de cliquer "Deploy", clique **"Environment Variables"** et ajoute **une par une** :

| Name | Value |
|------|-------|
| `DATABASE_URL` | ton URL postgresql complète |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ta clé VAPID publique |
| `VAPID_PRIVATE_KEY` | ta clé VAPID privée |
| `VAPID_EMAIL` | `mailto:ton@email.com` |
| `OTA_WEBHOOK_SECRET` | ton secret (ex: `horus-secret-2024`) |

**Important :** `DATABASE_URL` et `VAPID_PRIVATE_KEY` sont sensibles → Vercel les chiffre automatiquement.

### 12.3 Déployer

Clique **"Deploy"** → attends 2-3 minutes.

Tu obtiens une URL comme `https://horus-tau.vercel.app`.

**C'est cette URL que tu utiliseras sur ton téléphone Android.**

---

## ÉTAPE 13 — Installer l'app sur Android et activer les notifications

### 13.1 Ouvrir l'app dans Chrome Android

1. Ouvre **Chrome** sur ton Android (pas Samsung Internet, pas Firefox — **Chrome uniquement**)
2. Va sur ton URL Vercel (ex: `https://horus-tau.vercel.app`)
3. Connecte-toi → tu vois le dashboard Horus

### 13.2 Installer la PWA

Chrome Android va afficher une bannière en bas :
**"Ajouter Horus à l'écran d'accueil"** → Appuie dessus → **"Ajouter"**

Si la bannière n'apparaît pas :
1. Appuie sur les **3 points** en haut à droite de Chrome
2. Cherche **"Ajouter à l'écran d'accueil"**
3. Appuie → **"Ajouter"**

L'icône Horus apparaît sur ton écran d'accueil comme une vraie app.

### 13.3 Activer les notifications dans l'app installée

1. Ouvre l'app Horus depuis l'écran d'accueil (pas depuis Chrome)
2. Clique **"Activer les notifications"**
3. Android affiche : **"Horus veut vous envoyer des notifications"** → **Autoriser**
4. Le bouton passe au vert : **"✓ Activées"**
5. Clique **"Tester"** → tu reçois une notification sur Android

**Désormais, chaque nouvelle réservation te notifie sur ton téléphone, même app fermée.**

---

## Utilisation quotidienne

### Workflow normal

```
Réservation reçue (Viator, GYG, etc.)
         ↓
Notification push sur ton Android
         ↓
Tu ouvres l'app Horus
         ↓
Tu vois la réservation "En attente"
         ↓
Tu cliques Accepter ou Refuser
         ↓
Si Accepter : le calendrier se met à jour, anti double-booking activé
```

### Simuler l'arrivée d'une réservation OTA

Pour tester sans attendre une vraie réservation, tu peux :

**Option A : depuis l'interface (le plus simple)**
→ Clique "+ Simuler une réservation OTA" dans le dashboard

**Option B : depuis le terminal (simulation webhook)**

Remplace `horus-secret-2024` par ton vrai `OTA_WEBHOOK_SECRET` et l'URL Vercel par la tienne :

```bash
curl -X POST https://horus-tau.vercel.app/api/simulate-ota \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: horus-secret-2024" \
  -d '{
    "source": "getyourguide",
    "guestName": "Carlos García",
    "guestEmail": "carlos@example.com",
    "tourName": "Bardenas Reales 4x4",
    "date": "2024-08-10T09:00:00Z",
    "participants": 4,
    "notes": "Un enfant de 8 ans",
    "externalRef": "GYG-987654"
  }'
```

---

## Configurer l'email de secours (optionnel)

Si tu veux recevoir un email en plus des notifications push :

### Avec Gmail

1. Va sur https://myaccount.google.com → Sécurité → Vérification en 2 étapes (active-la)
2. Puis : Sécurité → Mots de passe des applications
3. Crée un mot de passe pour "Mail / Windows"
4. Copie le mot de passe de 16 caractères

Dans ton `.env` :

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="ton.email@gmail.com"
SMTP_PASS="abcd efgh ijkl mnop"
NOTIFY_EMAIL="ton.email@gmail.com"
```

Sur Vercel, ajoute aussi ces 5 variables dans les Environment Variables.

---

## Explorer la base de données

Prisma Studio = interface graphique pour voir/modifier les données directement :

```bash
npx prisma studio
```

Ouvre http://localhost:5555 → tu vois toutes les tables et toutes les réservations.

---

## Commandes de référence

```bash
# Développement local
npm run dev                  # Lance l'app sur http://localhost:3000

# Base de données
npx prisma db push           # Synchronise le schéma avec Supabase
npx prisma studio            # Interface graphique base de données

# Notifications push
npm run generate:vapid       # Génère de nouvelles clés VAPID (seulement si besoin)

# Déploiement
git add .
git commit -m "ma modification"
git push                     # Vercel redéploie automatiquement en 2 minutes
```

---

## Résolution de problèmes fréquents

### "Cannot connect to database" au démarrage

```
Vérifier dans .env :
- DATABASE_URL commence bien par postgresql://
- Le mot de passe ne contient pas de @ ou de # (caractères spéciaux → les encoder)
- Les guillemets sont bien présents autour de l'URL
```

### Les notifications ne fonctionnent pas sur Android

```
1. Utilise Chrome (pas Samsung Internet, pas Firefox)
2. L'app doit être ouverte depuis l'icône installée, pas depuis Chrome directement
3. Dans Paramètres Android → Applications → Chrome ou Horus → Notifications → Activer
4. Vérifie que NEXT_PUBLIC_VAPID_PUBLIC_KEY est identique en local et sur Vercel
```

### "Double booking détecté" quand j'accepte

```
C'est normal : une autre réservation sur le même tour à la même date est déjà confirmée.
Refuse l'une des deux, ou change la date.
```

### La page du calendrier est vide

```
FullCalendar se charge côté client. Attends 2-3 secondes après le chargement.
Si toujours vide, ouvre la console (F12) et cherche les erreurs.
```

### git push demande un mot de passe à chaque fois

```bash
git config --global credential.helper store
# Puis refais git push, entre ton token une dernière fois → mémorisé
```

---

## Structure du projet — ce que fait chaque fichier

```
horus/
│
├── .env                    ← TES SECRETS (ne jamais commit)
├── .env.example            ← Template vide à partager
├── .gitignore              ← Dit à git d'ignorer .env et node_modules
│
├── prisma/
│   └── schema.prisma       ← Définition des tables : Booking + PushSubscription
│
├── public/
│   ├── manifest.json       ← Config PWA (nom, icônes, couleurs)
│   ├── sw.js               ← Service Worker : cache + réception des push
│   └── icons/
│       ├── icon-192.png    ← Icône Android petite (À CRÉER)
│       └── icon-512.png    ← Icône Android grande (À CRÉER)
│
└── src/
    ├── app/
    │   ├── layout.tsx      ← Structure globale : <html>, header, nav
    │   ├── globals.css     ← Tailwind + thème sombre + styles FullCalendar
    │   ├── page.tsx        ← Dashboard principal (toute la logique UI)
    │   ├── calendar/
    │   │   └── page.tsx    ← Page calendrier (charge FullCalendar)
    │   └── api/
    │       ├── bookings/
    │       │   ├── route.ts        ← GET /api/bookings, POST /api/bookings
    │       │   └── [id]/route.ts   ← PATCH (accept/refuse), DELETE
    │       ├── simulate-ota/
    │       │   └── route.ts        ← POST /api/simulate-ota (webhook mock sécurisé)
    │       └── push/
    │           ├── subscribe/route.ts  ← POST/DELETE abonnements push
    │           └── send/route.ts       ← POST envoi notification test
    │
    ├── components/
    │   ├── BookingCard.tsx     ← Affiche une réservation (badge, boutons, couleurs)
    │   ├── Calendar.tsx        ← Composant FullCalendar (chargé dynamiquement)
    │   └── PushSubscribe.tsx   ← Bouton "Activer les notifications"
    │
    └── lib/
        ├── db.ts               ← Connexion Prisma (singleton pour éviter les fuites)
        └── push.ts             ← Envoyer une notif push + email fallback
```

---

## Récapitulatif — checklist de démarrage

```
[ ] Node.js installé (node -v → v18+)
[ ] Git installé (git -v)
[ ] npm install → dépendances installées
[ ] Supabase : projet créé, URL copiée
[ ] .env rempli (DATABASE_URL + VAPID + OTA_WEBHOOK_SECRET)
[ ] npx prisma db push → tables créées
[ ] public/icons/icon-192.png et icon-512.png créés
[ ] npm run dev → app sur http://localhost:3000
[ ] Notification test réussie sur PC
[ ] Repo GitHub créé et code poussé
[ ] Vercel déployé avec les variables d'env
[ ] App installée sur Android (icône sur écran d'accueil)
[ ] Notification test réussie sur Android
[ ] Première réservation simulée et acceptée
```

Si toutes les cases sont cochées : **Horus est opérationnel.**
