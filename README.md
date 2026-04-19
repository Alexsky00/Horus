# ☀ Horus — Gestión de Reservas Turísticas

**Versión : 1.6**

Sistema de gestión de reservas para guía turístico independiente.
Viator · GetYourGuide · Civitatis · WordPress · Manual → un solo panel de control.

---

## Qué hace la aplicación

| Funcionalidad | Detalle |
|---|---|
| Dashboard | Lista de todas las reservas con filtros, búsqueda, ordenación y paginación |
| Tuiles de estadísticas | Pendientes / Confirmadas / Rechazadas / Total / Bloqueados — clic para filtrar |
| Filtro jornada completa | Toggle "☀ Solo jornada completa" para ver solo tours de día entero |
| Aceptar / Rechazar | Un solo botón, confirmación instantánea |
| Anti double-booking | Si confirmas una reserva, cualquier otra solicitud en el mismo horario se rechaza automáticamente |
| Código de reserva | Código automático: R + tipo de ruta (C/M/L) + inicial de plataforma |
| Teléfono de cliente | Campo opcional, enlace tel: cliquable en la tarjeta y en el panel del calendario |
| Nacionalidad | Bandera SVG por cliente, compatible con Windows y Android |
| Tipo de ruta | Corta / Media / Larga, visible en cada reserva |
| Jornada completa | Opción "Toda la jornada" — ocupa el bloque 06:00–22:00 en el calendario |
| Horarios bloqueados | Bloquea días o franjas horarias donde no puedes guiar |
| Calendario | Vistas semana / mes / día, colores por estado, búsqueda rápida, filtros por estado |
| Crear desde calendario | Clic en un créneau semaine/jour → formulario de reserva pré-rempli con fecha y hora |
| Planning | Tabla mensual de reservas confirmadas + bloqueados agrupados por rango de fechas |
| Logs | Historial completo de acciones (crear, confirmar, rechazar, eliminar) |
| Admin — Integraciones | Configuración de webhooks por plataforma: URL, clave secreta, confirmación automática |
| Admin — Temas de colores | 6 palettes (Noche, Océano, Bosque, Vino, Desierto, Ártico) — appliquées sans rechargement |
| Notas de versión | Clic en "Horus vX.X" en el pie de página → historial completo de versiones |
| Conflictos de horario | Reservas solapadas marcadas automáticamente como ⚡ Conflicto (púrpura), distintas de Rechazada |
| Cambio de estado manual | Clic en el badge de estado → modal de confirmación con 4 opciones |
| Notificación de conflicto | Banner púrpura al crear una reserva que entra en conflicto |
| Datos de demo | Carga 30 reservas (incl. 3 conflictos) + 35 bloqueados para pruebas realistas |
| Vaciado completo | Elimina todas las reservas + bloqueados + logs con doble confirmación |
| Notificaciones push | Alerta en el móvil Android al recibir una reserva, incluso con la app cerrada |
| PWA instalable | Se instala en Android/iOS como una app nativa (sin Play Store) |

---

## Requisitos previos

Antes de empezar, comprueba que tienes:

- [ ] **Node.js** instalado — verificar con `node -v` (debe mostrar v18 o superior)
  - Si no: descargar en https://nodejs.org → versión "LTS"
- [ ] **Git** instalado — verificar con `git -v`
  - Si no: descargar en https://git-scm.com
- [ ] **Visual Studio Code** abierto en la carpeta `Horus`
- [ ] Una cuenta **GitHub** (gratuita) — https://github.com
- [ ] Una cuenta **Supabase** (gratuita) — https://supabase.com
- [ ] Una cuenta **Vercel** (gratuita) — https://vercel.com

---

## PASO 1 — Abrir el terminal en VSCode

En VSCode:
- Menú **Terminal → New Terminal** (o `Ctrl + J`)
- El terminal se abre abajo. Verificar que estás en la carpeta correcta:

```bash
pwd
```

Debes ver algo como `/c/Users/Utilisateur/Horus`.
Si no es el caso:

```bash
cd /c/Users/Utilisateur/Horus
```

---

## PASO 2 — Crear la base de datos Supabase

### 2.1 Crear un proyecto Supabase

1. Ir a https://supabase.com
2. Clic en **Start your project** → conectarse con GitHub o email
3. Clic en **New Project**
4. Rellenar:
   - **Organization**: tu nombre o "Personal"
   - **Name**: `horus`
   - **Database Password**: elegir una contraseña segura y **anotarla**
   - **Region**: `West EU (Ireland)` (el más cercano a España)
5. Clic en **Create new project**
6. Esperar 2-3 minutos → aparece un panel verde

### 2.2 Obtener las URLs de conexión

1. En tu proyecto Supabase, clic en **Settings** → **Database**
2. Desplazarse hasta **Connection string**
3. Pestaña **URI** → copiar → c'est `DATABASE_URL` (pooler, port 6543)
4. Pestaña **Direct connection** → copiar → c'est `DIRECT_URL` (port 5432, pour migrations)

```
DATABASE_URL=postgresql://postgres.xxx:[CONTRASEÑA]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:[CONTRASEÑA]@db.xxx.supabase.co:5432/postgres
```

---

## PASO 3 — Configurar el entorno (.env)

```env
DATABASE_URL="postgresql://postgres.xxx:MiContraseña@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres:MiContraseña@db.xxx.supabase.co:5432/postgres"

NEXT_PUBLIC_VAPID_PUBLIC_KEY="BPXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VAPID_PRIVATE_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VAPID_EMAIL="mailto:tu.email@gmail.com"
```

**Guardar: `Ctrl + S`**

---

## PASO 4 — Instalar dependencias

```bash
npm install
```

Esperar 1-3 minutos hasta ver `added XXX packages`.

---

## PASO 5 — Generar las claves VAPID (notificaciones push)

```bash
npm run generate:vapid
```

Copiar las dos claves generadas al archivo `.env`.

---

## PASO 6 — Crear las tablas en la base de datos

```bash
npx prisma db push
```

Al final debes ver:
```
Your database is now in sync with your Prisma schema.
```

---

## PASO 7 — Generar los iconos PWA

1. En VSCode, abrir la carpeta `public/icons/`
2. Clic derecho en `generate-icons.html` → **Reveal in File Explorer**
3. Doble clic en `generate-icons.html` → se abre en Chrome
4. Clic **Descargar icon-192.png** → guardar en `public/icons/`
5. Clic **Descargar icon-512.png** → guardar en `public/icons/`

---

## PASO 8 — Arrancar la aplicación en local

```bash
npm run dev
```

Abrir **http://localhost:3000** en Chrome.

---

## PASO 9 — Cargar datos de demo y probar

1. Ir a **/logs** → clic **"Demo"**
2. Mensaje de éxito: `"27 reservas + 35 bloqueados creados"`
3. Volver al dashboard → las tuiles muestran los datos

---

## PASO 10 — Desplegar en Vercel

### 10.1 Conectar Vercel a GitHub

1. Ir a https://vercel.com → conectarse con GitHub
2. Clic **"Add New Project"** → importar `Alexsky00/Horus`
3. Vercel detecta Next.js automáticamente

### 10.2 Variables de entorno Vercel

| Nombre | Valor |
|--------|-------|
| `DATABASE_URL` | URL pooler Supabase (port 6543) |
| `DIRECT_URL` | URL directa Supabase (port 5432) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | clave VAPID pública |
| `VAPID_PRIVATE_KEY` | clave VAPID privada |
| `VAPID_EMAIL` | `mailto:tu@email.com` |

### 10.3 Desplegar

Clic **"Deploy"** → esperar 2-3 minutos → URL pública generada.

**Cada `git push` redespliega automáticamente.**

### 10.4 Desactivar protección de autenticación

En Vercel → Settings → Deployment Protection → desactivar para que la URL sea pública.

---

## PASO 11 — Instalar en Android como app (PWA)

1. Abrir **Chrome** en Android
2. Ir a la URL Vercel
3. Pulsar los **3 puntos** → **"Añadir a pantalla de inicio"**
4. Confirmar → icono Horus en la pantalla de inicio

L'app s'ouvre en plein écran, sans barre d'adresse.

**Sur iPhone :** ouvrir avec Safari → icône Partager → "Sur l'écran d'accueil".

---

## Flujo de trabajo diario

```
Llega una reserva (Viator, GYG, Civitatis...)
         ↓
Notificación push en el Android
         ↓
Abres la app Horus
         ↓
Ves la reserva en "Pendiente"
         ↓
Pulsas Aceptar o Rechazar
         ↓
Si Aceptas → calendario actualizado, anti double-booking activo
```

---

## Comandos de referencia

```bash
# Desarrollo local
npm run dev                  # Arranca la app en http://localhost:3000

# Base de datos
npx prisma db push           # Sincroniza el esquema con Supabase
npx prisma studio            # Interfaz gráfica de la base de datos
npx prisma generate          # Regenerar el cliente Prisma

# Notificaciones push
npm run generate:vapid       # Genera nuevas claves VAPID

# Despliegue
git add .
git commit -m "mi cambio"
git push                     # Vercel redespliegue automático
```

---

## Resolución de problemas frecuentes

### "Cannot connect to database"
```
- DATABASE_URL empieza por postgresql://
- La contraseña no contiene @ ni # (codificar caracteres especiales)
- Las comillas están bien cerradas
- DIRECT_URL configurada (necesaria para las migraciones)
```

### Las notificaciones no funcionan en Android
```
1. Usar Chrome (no Samsung Internet, no Firefox)
2. Abrir la app desde el icono instalado, no desde Chrome directamente
3. Ajustes Android → Aplicaciones → Horus → Notificaciones → Activar
```

### "Conflicto de horario" al aceptar
```
Normal: otra reserva confirmada ocupa ese horario (o es jornada completa).
Rechazar una de las dos, o cambiar la fecha.
```

### `npx prisma generate` falla con error EPERM
```
1. Detener npm run dev (Ctrl+C)
2. npx prisma generate
3. npm run dev
```

---

## Estructura del proyecto

```
horus/
│
├── .env                        ← TUS SECRETOS (nunca hacer commit)
├── .env.example                ← Plantilla vacía para compartir
├── RELEASE_NOTES.md            ← Historial de versiones
├── TECH_NOTES.md               ← Documentación técnica
├── TESTS_MANUELS.md            ← Suite de tests (interno)
├── TESTS_TESTER.txt            ← Ficha de tests para testeador externo
├── BACKLOG.md                  ← Bugs, mejoras e integraciones pendientes
│
├── prisma/
│   └── schema.prisma           ← Modelos: Booking, BlockedSlot, Log, Setting, PushSubscription
│
├── public/
│   ├── manifest.json           ← Config PWA
│   ├── sw.js                   ← Service Worker
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
│
└── src/
    ├── app/
    │   ├── layout.tsx          ← Header, nav, VersionFooter
    │   ├── page.tsx            ← Dashboard principal
    │   ├── calendar/page.tsx   ← Calendario (FullCalendar + panel lateral + formularios)
    │   ├── planning/page.tsx   ← Tabla mensual confirmadas + bloqueados groupés
    │   ├── logs/page.tsx       ← Historial + zona de peligro
    │   ├── admin/page.tsx      ← Configuration des intégrations sources
    │   └── api/
    │       ├── bookings/       ← GET / POST / DELETE / PATCH
    │       ├── blocked/        ← GET / POST / DELETE
    │       ├── settings/       ← GET / POST (config intégrations)
    │       ├── seed/           ← POST (données de démo)
    │       ├── logs/           ← GET / DELETE
    │       └── push/           ← subscribe + send
    │
    ├── components/
    │   ├── BookingCard.tsx     ← Tarjeta de reserva
    │   ├── Calendar.tsx        ← FullCalendar + Gantt mensuel personnalisé
    │   ├── VersionFooter.tsx   ← Bouton version + modale release notes
    │   └── PushSubscribe.tsx   ← Bouton "Activar notificaciones"
    │
    └── lib/
        ├── db.ts               ← Connexion Prisma (singleton)
        ├── push.ts             ← Envoi notifications push
        ├── log.ts              ← Écriture logs
        ├── types.ts            ← Types partagés
        └── nationalities.ts    ← Liste nationalités ISO 3166-1
```

---

*Horus v1.6 — Gestión de reservas turísticas*
