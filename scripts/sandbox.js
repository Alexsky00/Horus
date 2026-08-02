#!/usr/bin/env node
/**
 * Bac à sable OCTO — tester les connexions sans toucher aux données réelles.
 *
 * Postgres sait héberger plusieurs schémas dans une même base. On monte donc un
 * schéma `horus_sandbox` avec ses propres tables, à côté du schéma `public` qui
 * porte la production. Même base, même serveur Supabase, aucun coût, aucune
 * installation — et zéro contact entre les deux jeux de données.
 *
 *   node scripts/sandbox.js setup   → crée les tables + un catalogue de test + une clé
 *   node scripts/sandbox.js clone   → recopie le VRAI catalogue de prod dans le bac à sable
 *   node scripts/sandbox.js dev     → lance Horus sur le bac à sable (port 3100)
 *   node scripts/sandbox.js check   → diagnostic OCTO complet, cycle de réservation inclus
 *   node scripts/sandbox.js reset   → efface tout le bac à sable
 *
 * La production n'est JAMAIS ouverte en écriture ici : `clone` la lit, rien de plus.
 */

const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SCHEMA = "horus_sandbox";
const PORT = 3100;
const KEY_TOKEN = "hor_sandbox_civitatis_key";

const C = { ok: "\x1b[32m", ko: "\x1b[31m", warn: "\x1b[33m", dim: "\x1b[90m", b: "\x1b[1m", off: "\x1b[0m" };

/** URL de la base de prod, avec le schéma dévié vers le bac à sable. */
function sandboxUrl() {
  const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  const m = /^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m.exec(env);
  if (!m) throw new Error("DATABASE_URL introuvable dans .env");

  const url = new URL(m[1]);
  url.searchParams.set("schema", SCHEMA);
  return url.toString();
}

const DB = sandboxUrl();
const ENV = { ...process.env, DATABASE_URL: DB, DIRECT_URL: DB, OCTO_SANDBOX: "1" };

function guard() {
  // Garde-fou : si le schéma n'est pas celui du bac à sable, on refuse de continuer.
  if (!DB.includes(`schema=${SCHEMA}`)) {
    console.error(`${C.ko}REFUS : l'URL ne pointe pas sur le schéma ${SCHEMA}.${C.off}`);
    process.exit(1);
  }
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, env: ENV, stdio: "inherit", shell: true, ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function prisma() {
  const { PrismaClient } = require(path.join(ROOT, "node_modules", "@prisma", "client"));
  return new PrismaClient({ datasources: { db: { url: DB } } });
}

// ── setup ──
async function setup() {
  guard();
  console.log(`\n${C.b}Bac à sable — création${C.off}  ${C.dim}schéma ${SCHEMA}${C.off}\n`);

  console.log("→ Création des tables…");
  run("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"]);

  const db = await prisma();

  // Catalogue de test : deux tours qui se chevauchent volontairement, pour
  // pouvoir vérifier la règle "un seul tour à la fois".
  const tours = [
    {
      name: "[TEST] Bardenas 4x4",
      category: "4x4",
      duration: 120,
      price: 60,
      pricingMode: "person",
      routeType: "corta",
      platforms: JSON.stringify(["civitatis", "viator"]),
      octoEnabled: true,
      capacity: 8,
      startTimes: JSON.stringify(["09:00", "15:00"]),
      sortOrder: 1,
    },
    {
      name: "[TEST] Senderismo día completo",
      category: "senderismo",
      duration: 180,
      price: 45,
      pricingMode: "person",
      routeType: "media",
      platforms: JSON.stringify(["civitatis"]),
      octoEnabled: true,
      capacity: 6,
      startTimes: JSON.stringify(["10:00"]), // chevauche le tour ci-dessus
      sortOrder: 2,
    },
    {
      name: "[TEST] Tour privado (grupo)",
      category: "cultural",
      duration: 240,
      price: 250,
      pricingMode: "group",
      routeType: "larga",
      platforms: JSON.stringify(["civitatis"]),
      octoEnabled: true,
      capacity: 6,
      startTimes: JSON.stringify(["11:00"]),
      sortOrder: 3,
    },
  ];

  await db.tour.deleteMany();
  for (const t of tours) await db.tour.create({ data: t });
  console.log(`${C.ok}✓${C.off} ${tours.length} tours de test créés`);

  await db.apiKey.deleteMany();
  await db.apiKey.create({
    data: { name: "Civitatis (sandbox)", source: "civitatis", token: KEY_TOKEN },
  });
  console.log(`${C.ok}✓${C.off} Clé revendeur : ${C.b}${KEY_TOKEN}${C.off}`);

  // Identité fournisseur, pour que le diagnostic passe au vert.
  const settings = {
    "octo.supplier.name": "Horus Sandbox",
    "octo.supplier.email": "sandbox@example.com",
    "octo.supplier.telephone": "+34 600 000 000",
    "octo.supplier.website": "https://example.com",
    "octo.supplier.address": "Pamplona, Navarra, España",
    "octo.bookingCutoffHours": "2",
    "octo.cancellationCutoffHours": "24",
    "octo.holdMinutes": "30",
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  console.log(`${C.ok}✓${C.off} Identité fournisseur renseignée`);

  await db.$disconnect();

  console.log(`\n${C.b}Prêt.${C.off} Ensuite :`);
  console.log(`  node scripts/sandbox.js dev     ${C.dim}# Horus sur http://localhost:${PORT}${C.off}`);
  console.log(`  node scripts/sandbox.js check   ${C.dim}# diagnostic (serveur déjà lancé)${C.off}\n`);
}

// ── clone ──
/**
 * Recopie le catalogue, les réservations et les blocages RÉELS dans le bac à sable,
 * pour que les tests portent sur tes vraies données et ta vraie occupation d'agenda.
 *
 * La prod est ouverte en LECTURE SEULE : on n'y fait que des `findMany`.
 */
async function clone() {
  guard();
  console.log(`\n${C.b}Clonage production → bac à sable${C.off}  ${C.dim}(lecture seule côté prod)${C.off}\n`);

  const { PrismaClient } = require(path.join(ROOT, "node_modules", "@prisma", "client"));

  const prodUrl = /^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m.exec(
    fs.readFileSync(path.join(ROOT, ".env"), "utf8")
  )[1];

  const prod = new PrismaClient({ datasources: { db: { url: prodUrl } } });
  const sb = new PrismaClient({ datasources: { db: { url: DB } } });

  const [tours, bookings, blocked, settings] = await Promise.all([
    prod.tour.findMany(),
    prod.booking.findMany(),
    prod.blockedSlot.findMany(),
    prod.setting.findMany(),
  ]);
  await prod.$disconnect();
  console.log(`${C.dim}Lu en prod : ${tours.length} tours, ${bookings.length} réservations, ${blocked.length} blocages${C.off}`);

  await sb.booking.deleteMany();
  await sb.blockedSlot.deleteMany();
  await sb.tour.deleteMany();

  // Les tours sont copiés tels quels, mais l'exposition OCTO reste à OFF :
  // c'est à toi de choisir ce que la plateforme aurait le droit de vendre.
  for (const t of tours) await sb.tour.create({ data: { ...t, octoEnabled: false } });
  console.log(`${C.ok}✓${C.off} ${tours.length} tours copiés ${C.dim}(venta automática désactivée, à toi de l'activer)${C.off}`);

  // Réservations et blocages : ils déterminent quels créneaux sont déjà pris.
  // Sans eux, la disponibilité testée serait irréaliste.
  for (const b of bookings) await sb.booking.create({ data: b });
  for (const x of blocked) await sb.blockedSlot.create({ data: x });
  console.log(`${C.ok}✓${C.off} ${bookings.length} réservations et ${blocked.length} blocages copiés ${C.dim}(occupation réelle de l'agenda)${C.off}`);

  for (const s of settings) {
    await sb.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }

  // La clé revendeur du bac à sable ne doit jamais fuiter en prod, et inversement.
  await sb.apiKey.deleteMany();
  await sb.apiKey.create({
    data: { name: "Civitatis (sandbox)", source: "civitatis", token: KEY_TOKEN },
  });
  console.log(`${C.ok}✓${C.off} Clé revendeur du bac à sable : ${C.b}${KEY_TOKEN}${C.off}`);

  await sb.$disconnect();

  console.log(`\n${C.warn}Aucune écriture n'a eu lieu en production.${C.off}`);
  console.log(`\nEnsuite : active « Venta automática » sur les tours à tester,`);
  console.log(`sur ${C.b}http://localhost:${PORT}/admin${C.off}, puis lance la simulation.\n`);
}

// ── dev ──
function dev() {
  guard();
  console.log(`\n${C.b}Horus — bac à sable${C.off}  ${C.dim}schéma ${SCHEMA} · port ${PORT}${C.off}`);
  console.log(`${C.warn}Tes données réelles ne sont PAS accessibles depuis cette instance.${C.off}\n`);

  const p = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    cwd: ROOT,
    env: ENV,
    stdio: "inherit",
    shell: true,
  });
  p.on("exit", (c) => process.exit(c ?? 0));
}

// ── check ──
function check() {
  guard();
  run("node", [
    "scripts/octo-check.js",
    "--url", `http://localhost:${PORT}`,
    "--key", KEY_TOKEN,
    "--booking",
  ]);
}

// ── reset ──
async function reset() {
  guard();
  const db = await prisma();
  await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
  await db.$disconnect();
  console.log(`${C.ok}✓${C.off} Bac à sable effacé. Tes données de production sont intactes.`);
}

const cmd = process.argv[2];
const actions = { setup, clone, dev, check, reset };

if (!actions[cmd]) {
  console.log(`
${C.b}Bac à sable OCTO${C.off} — tester sans toucher à la production

  node scripts/sandbox.js setup   Crée le schéma isolé + un catalogue de test + une clé
  node scripts/sandbox.js clone   Recopie ton VRAI catalogue de prod (lecture seule)
  node scripts/sandbox.js dev     Lance Horus dessus (port ${PORT})
  node scripts/sandbox.js check   Diagnostic OCTO complet (cycle de réservation inclus)
  node scripts/sandbox.js reset   Efface tout le bac à sable
`);
  process.exit(1);
}

Promise.resolve(actions[cmd]()).catch((e) => {
  console.error(`${C.ko}Erreur :${C.off}`, e.message);
  process.exit(1);
});
