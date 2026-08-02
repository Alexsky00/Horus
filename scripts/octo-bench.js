#!/usr/bin/env node
/**
 * Mesure de latence des endpoints OCTO.
 *
 *   node scripts/octo-bench.js --url http://localhost:3100 --key hor_sandbox_civitatis_key
 *
 * OCTO n'impose pas de SLA formel, mais une plateforme qui interroge la
 * disponibilité pendant qu'un client navigue attend une réponse rapide : au-delà
 * d'une seconde, l'expérience se dégrade et les ventes se perdent. On garde donc
 * 1 s comme cible et 3 s comme limite.
 *
 * Le coupable est presque toujours le nombre d'allers-retours SQL, pas le calcul.
 */

const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf("--" + n);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};

const BASE = arg("url", "http://localhost:3100").replace(/\/+$/, "") + "/api/octo";
const KEY = arg("key", "hor_sandbox_civitatis_key");
const N = Number(arg("n", 20));

const C = { ok: "\x1b[32m", warn: "\x1b[33m", ko: "\x1b[31m", dim: "\x1b[90m", b: "\x1b[1m", off: "\x1b[0m" };

async function call(method, path, body) {
  const t0 = performance.now();
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KEY}`,
      "Octo-Capabilities": "octo/pricing",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { ms: performance.now() - t0, status: res.status, json };
}

const pct = (xs, p) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};

function verdict(p90) {
  if (p90 < 1000) return `${C.ok}✓ bon (P90 < 1 s)${C.off}`;
  if (p90 < 3000) return `${C.warn}! lent (1–3 s)${C.off}`;
  return `${C.ko}✗ trop lent (> 3 s)${C.off}`;
}

(async () => {
  console.log(`\n${C.b}Latence OCTO${C.off} ${C.dim}${BASE} · ${N} appels par endpoint${C.off}\n`);

  const prods = await call("GET", "/products");
  if (prods.status !== 200 || !prods.json.length) {
    console.error("Aucun produit exposé — lance d'abord le bac à sable.");
    process.exit(1);
  }
  const product = prods.json[0];
  const unitId = product.options[0].units[0].id;

  const day = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
  const av = await call("POST", "/availability", {
    productId: product.id, optionId: "DEFAULT", localDateStart: day, localDateEnd: day,
  });
  const slot = av.json.find((s) => s.available);

  const scenarios = [
    ["GET /products", () => call("GET", "/products")],
    ["POST /availability (1 jour)", () => call("POST", "/availability", {
      productId: product.id, optionId: "DEFAULT", localDateStart: day, localDateEnd: day })],
    ["POST /availability (30 jours)", () => call("POST", "/availability", {
      productId: product.id, optionId: "DEFAULT", localDateStart: day,
      localDateEnd: new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 10) })],
    ["POST /availability/calendar (90 j)", () => call("POST", "/availability/calendar", {
      productId: product.id, optionId: "DEFAULT", localDateStart: day,
      localDateEnd: new Date(Date.now() + 100 * 86400000).toISOString().slice(0, 10) })],
  ];

  if (slot) {
    scenarios.push(["POST /bookings (hold)", () => call("POST", "/bookings", {
      uuid: crypto.randomUUID(), productId: product.id, optionId: "DEFAULT",
      availabilityId: slot.id, unitItems: [{ unitId }], expirationMinutes: 1 })]);
  }

  const rows = [];

  for (const [label, fn] of scenarios) {
    await fn(); // chauffe : on ne mesure pas la compilation à la volée

    const times = [];
    for (let i = 0; i < N; i++) {
      const r = await fn();
      times.push(r.ms);
    }

    const p50 = pct(times, 50);
    const p90 = pct(times, 90);
    rows.push({ endpoint: label, p50: Math.round(p50), p90: Math.round(p90), max: Math.round(Math.max(...times)) });

    console.log(`${label.padEnd(36)} p50 ${String(Math.round(p50)).padStart(5)} ms   p90 ${String(Math.round(p90)).padStart(5)} ms   ${verdict(p90)}`);
  }

  const worst = Math.max(...rows.map((r) => r.p90));
  console.log(`\n${C.b}Pire P90 : ${Math.round(worst)} ms${C.off} — ${verdict(worst)}`);
  console.log(`\n${C.dim}Rappel : en production, ajouter le démarrage à froid de Vercel (1–2 s sur le plan gratuit)`);
  console.log(`et la distance fonction↔base. Une fonction en iad1 (Virginie) contre une base en`);
  console.log(`eu-west-1 (Irlande) paie ~80–100 ms par requête SQL.${C.off}\n`);
})();
