#!/usr/bin/env node
/**
 * Appelle un endpoint OCTO et affiche la réponse lisiblement.
 *
 *   node scripts/octo-call.js GET  /products
 *   node scripts/octo-call.js POST /availability '{"productId":"…","optionId":"DEFAULT","localDateStart":"2026-08-01","localDateEnd":"2026-08-01"}'
 *
 * Vise le bac à sable par défaut (port 3100). Pour taper ailleurs :
 *   --url http://localhost:3000  --key hor_xxx
 *
 * Les réponses de réservation embarquent tout le produit et toutes ses options
 * (la spec l'exige), soit des milliers de caractères illisibles. On les replie
 * par défaut ; `--full` affiche tout.
 */

const args = process.argv.slice(2);

const flag = (n, d) => {
  const i = args.indexOf("--" + n);
  if (i < 0) return d;
  const v = args[i + 1];
  args.splice(i, v && !v.startsWith("--") ? 2 : 1);
  return v && !v.startsWith("--") ? v : true;
};

const FULL = args.includes("--full");
if (FULL) args.splice(args.indexOf("--full"), 1);

const URL_BASE = flag("url", "http://localhost:3100");
const KEY = flag("key", "hor_sandbox_civitatis_key");

const [method, rawPath, body] = args;

/**
 * Git Bash (MSYS) réécrit tout argument qui commence par « / » en chemin
 * Windows : `/products` arrive ici sous la forme `C:/Program Files/Git/products`.
 * On repart donc du premier segment qu'on reconnaît. Écrire `products` ou
 * `/products` revient au même.
 */
const ROOTS = ["supplier", "products", "availability", "bookings"];

function normalizePath(raw) {
  const parts = String(raw).split(/[\\/]+/).filter(Boolean);
  const i = parts.findIndex((p) => ROOTS.includes(p));
  return "/" + (i < 0 ? parts : parts.slice(i)).join("/");
}

const path = rawPath ? normalizePath(rawPath) : rawPath;

if (!method || !path) {
  console.log(`
Usage : node scripts/octo-call.js <METHOD> <chemin> [corps JSON]

  node scripts/octo-call.js GET  /supplier
  node scripts/octo-call.js GET  /products
  node scripts/octo-call.js POST /availability '{"productId":"…","optionId":"DEFAULT","localDateStart":"2026-08-01","localDateEnd":"2026-08-05"}'
  node scripts/octo-call.js POST /bookings     '{"productId":"…","optionId":"DEFAULT","availabilityId":"…","unitItems":[{"unitId":"…"}]}'

Options : --url <url>   --key <clé>   --full (ne rien replier)
`);
  process.exit(1);
}

// Les gros objets imbriqués noient l'information utile pendant l'apprentissage.
const FOLDED = new Set(["product", "option", "unit", "options", "units"]);

function fold(v) {
  if (Array.isArray(v)) return v.map(fold);
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      out[k] = FOLDED.has(k) ? "«replié — relance avec --full»" : fold(val);
    }
    return out;
  }
  return v;
}

(async () => {
  const url = URL_BASE.replace(/\/+$/, "") + "/api/octo" + path;

  const res = await fetch(url, {
    method: method.toUpperCase(),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KEY}`,
      "Octo-Capabilities": "octo/pricing",
    },
    body: body || undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.log(`HTTP ${res.status}\n${text.slice(0, 400)}`);
    process.exit(1);
  }

  const colour = res.ok ? "\x1b[32m" : "\x1b[31m";
  console.log(`${colour}HTTP ${res.status}\x1b[0m  \x1b[90m${method.toUpperCase()} ${path}\x1b[0m\n`);
  console.log(JSON.stringify(FULL ? json : fold(json), null, 2));
})();
