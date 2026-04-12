# ☀ Horus — Gestión de Reservas Turísticas

**Versión : 1.0-Alpha**

Sistema de gestión de reservas para guía turístico independiente.
Viator · GetYourGuide · Civitatis · WordPress · Manual → un solo panel de control.

---

## Qué hace la aplicación

| Funcionalidad | Detalle |
|---|---|
| Dashboard | Lista de todas las reservas con filtros, búsqueda, ordenación y paginación |
| Tuiles de estadísticas | Pendientes / Confirmadas / Rechazadas / Total / Bloqueados — clic para filtrar |
| Aceptar / Rechazar | Un solo botón, confirmación instantánea |
| Anti double-booking | Si confirmas una reserva, cualquier otra solicitud en el mismo horario se rechaza automáticamente |
| Código de reserva | Código automático: R + tipo de ruta (C/M/L) + inicial de plataforma |
| Nacionalidad | Bandera SVG por cliente, compatible con Windows y Android |
| Tipo de ruta | Corta / Media / Larga, visible en cada reserva |
| Jornada completa | Opción "Toda la jornada" para tours sin hora fija |
| Horarios bloqueados | Bloquea días o franjas horarias donde no puedes guiar |
| Calendário | Vistas semana / mes / día / lista, colores por estado, slots bloqueados visibles |
| Planning | Tabla mensual de reservas confirmadas + bloqueados, navegación mes a mes |
| Logs | Historial completo de acciones (crear, confirmar, rechazar, eliminar) |
| Datos de demo | Carga 27 reservas + 37 bloqueados para pruebas realistas |
| Vaciado completo | Elimina todas las reservas + bloqueados + logs con doble confirmación |
| Notificaciones push | Alerta en el móvil Android al recibir una reserva, incluso con la app cerrada |
| Email de respaldo | Si las notificaciones push no llegan, se envía un email |
| PWA instalable | Se instala en Android como una app nativa |

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

### 2.2 Obtener la URL de conexión

1. En tu proyecto Supabase, clic en **Settings** (icono engranaje, abajo a la izquierda)
2. Clic en **Database**
3. Desplazarse hasta **Connection string**
4. Elegir la pestaña **URI**
5. Copiar la URL completa:

```
postgresql://postgres:[CONTRASEÑA]@db.abcdefghijkl.supabase.co:5432/postgres
```

**Sustituir `[CONTRASEÑA]` por la contraseña elegida en el paso 2.1.**

---

## PASO 3 — Configurar el entorno (.env)

### 3.1 Copiar el archivo de configuración

```bash
cp .env.example .env
```

### 3.2 Rellenar el archivo .env

Abrir `.env` en VSCode y rellenar `DATABASE_URL` con la URL del paso 2.2:

```env
DATABASE_URL="postgresql://postgres:MiContraseña123@db.xyzxyz.supabase.co:5432/postgres"
```

Dejar las demás líneas vacías por ahora.

---

## PASO 4 — Instalar dependencias

```bash
npm install
```

Esperar 1-3 minutos hasta ver `added XXX packages`.

**Si aparece error `EACCES` o `permission denied`:**
```bash
npm install --legacy-peer-deps
```

---

## PASO 5 — Generar las claves VAPID (notificaciones push)

```bash
npm run generate:vapid
```

Aparecerá algo como:

```
VAPID_PUBLIC_KEY=BPXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Copiar estas dos líneas al archivo `.env`. Añadir también el email:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BPXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VAPID_PRIVATE_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VAPID_EMAIL="mailto:tu.email@gmail.com"
```

### 5.1 Rellenar OTA_WEBHOOK_SECRET

Es una contraseña inventada que protege el endpoint. Cualquier texto sin espacios:

```env
OTA_WEBHOOK_SECRET="horus-secret-2024"
```

### Archivo .env completo

```env
DATABASE_URL="postgresql://postgres:MiContraseña@db.abcdef.supabase.co:5432/postgres"

NEXT_PUBLIC_VAPID_PUBLIC_KEY="BPXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VAPID_PRIVATE_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VAPID_EMAIL="mailto:tu.email@gmail.com"

OTA_WEBHOOK_SECRET="horus-secret-2024"

# Opcionales (email de respaldo) — dejar vacíos por ahora
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
NOTIFY_EMAIL=""
```

**Guardar: `Ctrl + S`**

---

## PASO 6 — Crear las tablas en la base de datos

```bash
npx prisma db push
```

Al final debes ver:
```
Your database is now in sync with your Prisma schema.
```

Si aparece error de conexión (`P1001` o `ECONNREFUSED`):
- Verificar que la URL en `.env` es correcta
- Verificar que `[CONTRASEÑA]` ha sido sustituido
- Verificar que no hay espacios ni comillas mal cerradas

---

## PASO 7 — Generar los iconos PWA

1. En VSCode, abrir la carpeta `public/icons/`
2. Clic derecho en `generate-icons.html` → **Reveal in File Explorer**
3. Doble clic en `generate-icons.html` → se abre en Chrome
4. Clic **Descargar icon-192.png** → guardar en `public/icons/`
5. Clic **Descargar icon-512.png** → guardar en `public/icons/`

Verificar:
```bash
ls public/icons/
```
Debe mostrar: `generate-icons.html  icon-192.png  icon-512.png`

---

## PASO 8 — Arrancar la aplicación en local

```bash
npm run dev
```

Debes ver:
```
▲ Next.js 14.x.x
- Local:   http://localhost:3000
- Ready in XXXms
```

Abrir **http://localhost:3000** en Chrome.

---

## PASO 9 — Activar notificaciones push

1. En Chrome, en http://localhost:3000
2. Clic en **"Activar notificaciones"**
3. Chrome muestra: **"Localhost quiere mostrar notificaciones"** → **Permitir**
4. El botón se vuelve verde: **"✓ Activadas"**
5. Clic en **"Probar"** → aparece una notificación en la esquina

**Si el popup no aparece:**
- Clic en el candado en la barra de direcciones
- Buscar "Notificaciones" → poner en "Permitir"
- Recargar la página

---

## PASO 10 — Cargar datos de demo y probar

### 10.1 Cargar el juego de datos de demo

1. Ir a **/logs**
2. Clic en el botón **"Demo"**
3. Mensaje de éxito: "27 reservas + 37 bloqueados creados"
4. Volver al dashboard → las tuiles muestran los datos

### 10.2 Explorar las reservas

- **Dashboard**: 27 reservas de Sophie Martin, Hans Müller, Carlos López...
- **Calendario**: navegar a agosto 2026 → barras grises "Vacaciones verano"
- **Planning**: tabla con reservas confirmadas del mes actual
- **Logs**: historial de todas las acciones de la demo

### 10.3 Crear una reserva manualmente

1. En el dashboard, clic en **"+ Nueva reserva"**
2. Rellenar: plataforma, tour, cliente, email, fecha, participantes
3. Opcionales: nacionalidad, tipo de ruta, toda la jornada, duración, notas
4. Clic **"Crear reserva"** → aparece como Pendiente

### 10.4 Aceptar / Rechazar

- En una carta "Pendiente": clic **✓ Aceptar** → pasa a Confirmada
- En una carta "Pendiente": clic **✗ Rechazar** → pasa a Rechazada
- Si hay conflicto de horario al aceptar: mensaje de error explicando el conflicto

### 10.5 Bloquear un horario

1. Ir a **/calendar** → clic **"🔒 Bloquear horario"**
2. Elegir fecha, marcar "Toda la jornada" si es día completo
3. Añadir un motivo (opcional)
4. Clic **"Guardar bloqueo"** → visible en el calendario en gris

---

## PASO 11 — Push al repositorio GitHub

El remote ya está configurado hacia `arrondiko/Horus`.

### 11.1 Dar permisos de escritura (solo una vez)

Desde la cuenta **arrondiko** en GitHub:
1. Ir a https://github.com/arrondiko/Horus
2. **Settings** → **Collaborators** → **Add people** → invitar `Alexsky00`
3. Aceptar la invitación recibida por email

### 11.2 Configurar autenticación (solo una vez)

GitHub ya no acepta contraseñas — necesitas un **Personal Access Token**:

1. Conectado como `arrondiko` en GitHub
2. **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. **Generate new token** → marcar `repo` → copiar el token
4. En el terminal:
```bash
git config --global credential.helper wincred
```
5. Al hacer push, usar el token como contraseña

### 11.3 Hacer push

```bash
git add .
git commit -m "descripción del cambio"
git push origin main
```

---

## PASO 12 — Desplegar en Vercel (acceso desde móvil)

### 12.1 Conectar Vercel a GitHub

1. Ir a https://vercel.com → conectarse con GitHub
2. Clic **"Add New Project"** → importar `arrondiko/Horus`
3. Vercel detecta Next.js automáticamente

### 12.2 Añadir las variables de entorno

Antes de hacer clic en "Deploy", añadir en **Environment Variables**:

| Nombre | Valor |
|--------|-------|
| `DATABASE_URL` | tu URL postgresql completa |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | tu clave VAPID pública |
| `VAPID_PRIVATE_KEY` | tu clave VAPID privada |
| `VAPID_EMAIL` | `mailto:tu@email.com` |
| `OTA_WEBHOOK_SECRET` | tu secreto |

### 12.3 Desplegar

Clic **"Deploy"** → esperar 2-3 minutos.

Obtienes una URL como `https://horus-xxx.vercel.app`.

**Cada `git push` redespliega automáticamente en 2 minutos.**

---

## PASO 13 — Instalar en Android y activar notificaciones

### 13.1 Abrir la app en Chrome Android

1. Abrir **Chrome** en Android (no Samsung Internet, no Firefox — **Chrome únicamente**)
2. Ir a la URL de Vercel (ej: `https://horus-xxx.vercel.app`)

### 13.2 Instalar la PWA

Chrome Android mostrará un banner:
**"Añadir Horus a la pantalla de inicio"** → Pulsar → **"Añadir"**

Si el banner no aparece:
1. Pulsar los **3 puntos** arriba a la derecha
2. Buscar **"Añadir a pantalla de inicio"**
3. Confirmar

### 13.3 Activar notificaciones en la app instalada

1. Abrir Horus desde el icono en la pantalla de inicio
2. Clic **"Activar notificaciones"** → **Permitir**
3. El botón se vuelve verde: **"✓ Activadas"**
4. Clic **"Probar"** → recibes una notificación en Android

**A partir de ahora, cada nueva reserva te notifica en el móvil, incluso con la app cerrada.**

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
npx prisma studio            # Interfaz gráfica de la base de datos (http://localhost:5555)
npx prisma generate          # Regenerar el cliente Prisma (tras cambios en schema.prisma)

# Notificaciones push
npm run generate:vapid       # Genera nuevas claves VAPID (solo si es necesario)

# Despliegue
git add .
git commit -m "mi cambio"
git push                     # Vercel redespliegue automático
```

---

## Resolución de problemas frecuentes

### "Cannot connect to database" al arrancar

```
Verificar en .env:
- DATABASE_URL empieza por postgresql://
- La contraseña no contiene @ ni # (caracteres especiales → codificarlos)
- Las comillas están bien cerradas
- Sin espacios al inicio o al final
```

### Las notificaciones no funcionan en Android

```
1. Usar Chrome (no Samsung Internet, no Firefox)
2. Abrir la app desde el icono instalado, no desde Chrome directamente
3. Ajustes Android → Aplicaciones → Horus → Notificaciones → Activar
4. Verificar que NEXT_PUBLIC_VAPID_PUBLIC_KEY es idéntica en local y en Vercel
```

### "Conflicto de horario" al aceptar una reserva

```
Normal: otra reserva en el mismo horario ya está confirmada.
Rechazar una de las dos, o cambiar la fecha.
```

### La página del calendario está vacía

```
FullCalendar se carga en el lado cliente. Esperar 2-3 segundos.
Si sigue vacío, abrir la consola (F12) y buscar errores en rojo.
```

### git push pide contraseña cada vez

```bash
git config --global credential.helper wincred
# Hacer push una vez con el token → queda guardado
```

### `npx prisma generate` falla con error EPERM

```
El servidor de desarrollo bloquea el archivo DLL de Prisma.
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
├── .gitignore                  ← Ignora .env y node_modules
├── RELEASE_NOTES.md            ← Historial de versiones y funcionalidades
├── TECH_NOTES.md               ← Documentación técnica
├── TESTS_MANUELS.md            ← Suite de tests completa (internal)
├── TESTS_TESTER.txt            ← Ficha de tests para testeador externo
│
├── prisma/
│   └── schema.prisma           ← Modelos: Booking, BlockedSlot, Log, PushSubscription
│
├── public/
│   ├── manifest.json           ← Config PWA (nombre, iconos, colores)
│   ├── sw.js                   ← Service Worker: caché + recepción push
│   └── icons/
│       ├── icon-192.png        ← Icono Android pequeño
│       └── icon-512.png        ← Icono Android grande
│
└── src/
    ├── app/
    │   ├── layout.tsx          ← Estructura global: <html>, header, nav, footer (versión)
    │   ├── globals.css         ← Tailwind + tema oscuro + estilos FullCalendar
    │   ├── page.tsx            ← Dashboard principal
    │   ├── calendar/
    │   │   └── page.tsx        ← Página calendario (FullCalendar + panel lateral)
    │   ├── planning/
    │   │   └── page.tsx        ← Tabla mensual de reservas confirmadas
    │   ├── logs/
    │   │   └── page.tsx        ← Historial de acciones + zona de peligro
    │   └── api/
    │       ├── bookings/
    │       │   ├── route.ts        ← GET / POST / DELETE (all)
    │       │   └── [id]/route.ts   ← PATCH (aceptar/rechazar) / DELETE (one)
    │       ├── blocked/
    │       │   ├── route.ts        ← GET / POST / DELETE (all)
    │       │   └── [id]/route.ts   ← DELETE (one)
    │       ├── seed/
    │       │   └── route.ts        ← POST: carga datos de demo
    │       ├── logs/
    │       │   └── route.ts        ← GET / DELETE
    │       └── push/
    │           ├── subscribe/route.ts  ← POST/DELETE suscripciones push
    │           └── send/route.ts       ← POST envío notificación de prueba
    │
    ├── components/
    │   ├── BookingCard.tsx      ← Tarjeta de reserva (badge, botones, bandera, código)
    │   ├── Calendar.tsx         ← Componente FullCalendar + Gantt mensual personalizado
    │   └── PushSubscribe.tsx    ← Botón "Activar notificaciones"
    │
    └── lib/
        ├── db.ts               ← Conexión Prisma (singleton)
        ├── push.ts             ← Enviar notificación push + email de respaldo
        ├── log.ts              ← Escribir en el historial de logs
        ├── types.ts            ← Tipos compartidos (BlockedSlot)
        └── nationalities.ts    ← Lista de nacionalidades ISO 3166-1 + helper
```

---

## Checklist de puesta en marcha

```
[ ] Node.js instalado (node -v → v18+)
[ ] Git instalado (git -v)
[ ] npm install → dependencias instaladas
[ ] Supabase: proyecto creado, URL copiada
[ ] .env rellenado (DATABASE_URL + VAPID + OTA_WEBHOOK_SECRET)
[ ] npx prisma db push → tablas creadas
[ ] public/icons/icon-192.png y icon-512.png creados
[ ] npm run dev → app en http://localhost:3000
[ ] Notificación de prueba exitosa en PC
[ ] Datos de demo cargados desde /logs
[ ] Repositorio GitHub: permisos configurados, push exitoso
[ ] Vercel desplegado con las variables de entorno
[ ] App instalada en Android (icono en pantalla de inicio)
[ ] Notificación de prueba exitosa en Android
[ ] Primera reserva creada y aceptada
```

Si todas las casillas están marcadas: **Horus está operativo.**

---

*Horus v1.0-Alpha — Gestión de reservas turísticas*
