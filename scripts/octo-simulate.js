#!/usr/bin/env node
/**
 * Simulateur de revendeur OCTO — teste la connectivité ENTRANTE.
 *
 *   node scripts/octo-simulate.js --url http://localhost:3100 --key hor_sandbox_civitatis_key
 *
 * Rejoue ce qu'une plateforme (Civitatis, Viator…) ferait réellement contre Horus :
 * elle découvre le fournisseur, lit le catalogue, consulte les disponibilités,
 * bloque une place le temps d'encaisser, confirme — ou abandonne.
 *
 * Aucune plateforme n'est contactée. Rien ne sort de ta machine.
 *
 * ⚠ Ce script ÉCRIT des réservations. À lancer contre le bac à sable, jamais
 *   contre la production : il refuse de démarrer si l'URL n'est pas isolée.
 */

const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf("--" + n);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};

const URL_BASE = arg("url", "http://localhost:3100");
const BASE = URL_BASE.replace(/\/+$/, "") + "/api/octo";
const KEY = arg("key", process.env.OCTO_KEY || "hor_sandbox_civitatis_key");
const FORCE = args.includes("--i-know-what-im-doing");

const C = { ok: "\x1b[32m", ko: "\x1b[31m", warn: "\x1b[33m", dim: "\x1b[90m", cy: "\x1b[36m", b: "\x1b[1m", off: "\x1b[0m" };

// Garde-fou : le port 3100 est celui du bac à sable. Tout le reste est suspect.
if (!URL_BASE.includes(":3100") && !FORCE) {
  console.error(`
${C.ko}${C.b}REFUS${C.off} — ce script crée de vraies réservations.

  URL visée : ${URL_BASE}
  Attendu   : http://localhost:3100 (le bac à sable)

Lance d'abord :  npm run sandbox:dev
Si tu sais vraiment ce que tu fais : --i-know-what-im-doing
`);
  process.exit(2);
}

let failed = 0;
const step = (t) => console.log(`\n${C.cy}▸ ${t}${C.off}`);
const act = (who, what) => console.log(`  ${C.dim}${who} →${C.off} ${what}`);
const ok = (m) => console.log(`  ${C.ok}✓${C.off} ${m}`);
const ko = (m, d) => { failed++; console.log(`  ${C.ko}✗${C.off} ${m}${d ? `\n      ${C.dim}${String(d).slice(0, 300)}${C.off}` : ""}`); };

/** Une réponse OCTO complète fait des milliers de caractères : on n'en garde que l'utile. */
const brief = (j) =>
  JSON.stringify({ status: j.status, error: j.error, errorMessage: j.errorMessage, utcExpiresAt: j.utcExpiresAt });

async function call(method, path, body, key = KEY) {
  const headers = { "Content-Type": "application/json", "Octo-Capabilities": "octo/pricing" };
  if (key) headers.Authorization = `Bearer ${key}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { _raw: text.slice(0, 150) }; }
  return { status: res.status, json };
}

const plusDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

(async () => {
  console.log(`\n${C.b}Simulation d'un revendeur OCTO${C.off} ${C.dim}${BASE}${C.off}`);
  console.log(`${C.dim}Aucune plateforme réelle n'est contactée.${C.off}`);

  // ── 1. Onboarding : ce que la plateforme fait en premier ──
  step("1. La plateforme découvre le fournisseur");

  let r = await call("GET", "/supplier");
  if (r.status !== 200) {
    ko(`Impossible de lire le fournisseur (HTTP ${r.status})`, JSON.stringify(r.json));
    process.exit(1);
  }
  act("Civitatis", "GET /supplier");
  ok(`Fournisseur reconnu : ${r.json.name}`);

  act("Civitatis", "GET /products");
  r = await call("GET", "/products");
  const products = r.json;

  if (!Array.isArray(products) || !products.length) {
    ko("Aucun tour exposé", 'Active « Venta automática » sur au moins un tour dans /admin.');
    process.exit(1);
  }
  ok(`${products.length} produit(s) importé(s) dans son catalogue`);
  products.forEach((p) => {
    const u = p.options[0].units[0];
    const price = u.pricing?.[0];
    const eur = price ? (price.retail / 10 ** price.currencyPrecision).toFixed(2) + " €" : "?";
    console.log(`      ${C.dim}· ${p.internalName} — ${eur} — départs ${p.options[0].availabilityLocalStartTimes.join("/")}${C.off}`);
  });

  // On teste sur un produit vendu à la personne : c'est le cas OTA courant.
  const product = products.find((p) => p.options[0].units[0].type === "ADULT") ?? products[0];
  const unitId = product.options[0].units[0].id;
  console.log(`\n  ${C.dim}Produit retenu pour la simulation : ${product.internalName}${C.off}`);

  // ── 2. Un client navigue ──
  step("2. Un client cherche une date");

  act("Client", "ouvre le calendrier du mois");
  r = await call("POST", "/availability/calendar", {
    productId: product.id,
    optionId: "DEFAULT",
    localDateStart: plusDays(1),
    localDateEnd: plusDays(45),
  });

  const openDays = (r.json || []).filter((d) => d.available);
  if (!openDays.length) {
    ko("Aucune date disponible sur 45 jours", "La plateforme n'afficherait rien à vendre.");
    process.exit(1);
  }
  ok(`${openDays.length} dates proposées au client sur 45 jours`);

  const day = openDays[0].localDate;
  act("Client", `choisit le ${day}`);

  r = await call("POST", "/availability", {
    productId: product.id,
    optionId: "DEFAULT",
    localDateStart: day,
    localDateEnd: day,
  });

  const slots = (r.json || []).filter((s) => s.available);
  if (!slots.length) {
    ko(`Le ${day} était annoncé libre par le calendrier mais n'a aucun créneau vendable`,
       "Incohérence entre /availability/calendar et /availability.");
    process.exit(1);
  }
  const slot = slots[0];
  ok(`${slots.length} départ(s) proposé(s), ${slot.vacancies} place(s) sur celui de ${slot.id.slice(11, 16)}`);

  // ── 3. Achat nominal ──
  step("3. Le client achète 2 places");

  const uuid = crypto.randomUUID();
  act("Civitatis", "bloque les places le temps d'encaisser (POST /bookings)");

  r = await call("POST", "/bookings", {
    uuid,
    productId: product.id,
    optionId: "DEFAULT",
    availabilityId: slot.id,
    unitItems: [{ unitId }, { unitId }],
  });

  if (r.json.status !== "ON_HOLD") {
    ko(`Le blocage a échoué (HTTP ${r.status})`, brief(r.json));
    process.exit(1);
  }
  ok(`Places bloquées jusqu'à ${r.json.utcExpiresAt}`);

  const after = await call("POST", "/availability", {
    productId: product.id, optionId: "DEFAULT", availabilityIds: [slot.id],
  });
  if (after.json[0].vacancies === slot.vacancies - 2) {
    ok(`Les places sont retirées de la vente pendant le paiement (${slot.vacancies} → ${after.json[0].vacancies})`);
  } else {
    ko(`Les places n'ont pas été décomptées (${slot.vacancies} → ${after.json[0].vacancies})`,
       "Deux clients pourraient acheter la même place.");
  }

  act("Client", "paie sur Civitatis");
  act("Civitatis", "confirme (POST /bookings/{uuid}/confirm)");

  r = await call("POST", `/bookings/${uuid}/confirm`, {
    resellerReference: "CIV-2026-88431",
    contact: {
      firstName: "Lucía",
      lastName: "Fernández",
      emailAddress: "lucia.fernandez@example.com",
      phoneNumber: "+34 611 223 344",
      country: "ES",
      locales: ["es"],
    },
  });

  if (r.json.status === "CONFIRMED") {
    ok(`Vente confirmée — ${r.json.contact.firstName} ${r.json.contact.lastName}, réf. ${r.json.supplierReference}`);
    console.log(`      ${C.dim}Le guide reçoit une notification push. La réservation apparaît dans Horus.${C.off}`);
  } else {
    ko(`La confirmation a échoué (HTTP ${r.status})`, JSON.stringify(r.json));
  }

  // ── 4. Panier abandonné ──
  step("4. Un client abandonne son panier");

  const uuidAbandon = crypto.randomUUID();
  act("Civitatis", "bloque 1 place (hold de 1 min)");

  r = await call("POST", "/bookings", {
    uuid: uuidAbandon,
    productId: product.id,
    optionId: "DEFAULT",
    availabilityId: slot.id,
    unitItems: [{ unitId }],
    expirationMinutes: 1,
  });
  const heldOk = r.json.status === "ON_HOLD";
  heldOk ? ok("Place bloquée") : ko("Blocage impossible", JSON.stringify(r.json));

  act("Client", "ferme son navigateur sans payer");
  act("Civitatis", "n'appelle jamais /confirm");

  if (heldOk) {
    act("Simulation", "on attend l'expiration du hold (65 s)…");
    await new Promise((res) => setTimeout(res, 65_000));

    const back = await call("POST", "/availability", {
      productId: product.id, optionId: "DEFAULT", availabilityIds: [slot.id],
    });
    const expected = slot.vacancies - 2; // les 2 places vendues restent prises
    if (back.json[0].vacancies === expected) {
      ok(`La place abandonnée est revenue à la vente (${expected} disponibles)`);
    } else {
      ko(`La place abandonnée n'a pas été libérée (attendu ${expected}, obtenu ${back.json[0].vacancies})`,
         "Un panier abandonné bloquerait ton agenda indéfiniment.");
    }

    const st = await call("GET", `/bookings/${uuidAbandon}`);
    st.json.status === "EXPIRED"
      ? ok("La réservation abandonnée est marquée EXPIRED")
      : ko(`Statut inattendu : ${st.json.status}`);
  }

  // ── 5. Course à la dernière place ──
  step("5. Deux clients se disputent les dernières places (course)");

  const now = await call("POST", "/availability", {
    productId: product.id, optionId: "DEFAULT", availabilityIds: [slot.id],
  });
  const left = now.json[0].vacancies;

  if (left < 1) {
    console.log(`  ${C.dim}Départ déjà complet, scénario non applicable.${C.off}`);
  } else {
    act("Simulation", `${left} place(s) restante(s) — deux clients tentent de prendre TOUT le reste, simultanément`);

    const mk = () => ({
      uuid: crypto.randomUUID(),
      productId: product.id,
      optionId: "DEFAULT",
      availabilityId: slot.id,
      unitItems: Array.from({ length: left }, () => ({ unitId })),
    });

    const [a, b] = await Promise.all([
      call("POST", "/bookings", mk()),
      call("POST", "/bookings", mk()),
    ]);

    const won = [a, b].filter((x) => x.json.status === "ON_HOLD").length;

    if (won === 1) {
      ok("Un seul client obtient les places — l'autre est refusé");
      const loser = [a, b].find((x) => x.json.status !== "ON_HOLD");
      console.log(`      ${C.dim}Le perdant reçoit : ${loser.json.error} — ${loser.json.errorMessage}${C.off}`);
    } else if (won === 2) {
      ko("LES DEUX clients ont obtenu les mêmes places — SURVENTE",
         "Deux réservations concurrentes sont passées. Le guide serait en double réservation.");
    } else {
      ko("Aucun des deux clients n'a pu réserver", JSON.stringify(a.json));
    }

    const end = await call("POST", "/availability", {
      productId: product.id, optionId: "DEFAULT", availabilityIds: [slot.id],
    });
    end.json[0].vacancies === 0 && end.json[0].status === "SOLD_OUT"
      ? ok("Le départ est désormais complet (SOLD_OUT)")
      : ko(`Le départ devrait être complet, il reste ${end.json[0].vacancies} place(s)`);
  }

  // ── 6. Le guide est occupé ailleurs ──
  step("6. Un autre tour chevauche-t-il ce départ ?");

  const others = products.filter((p) => p.id !== product.id);
  if (!others.length) {
    console.log(`  ${C.dim}Un seul tour exposé — active-en un second dont l'horaire chevauche celui-ci pour tester cette règle.${C.off}`);
  } else {
    let tested = false;
    for (const other of others) {
      const av = await call("POST", "/availability", {
        productId: other.id, optionId: "DEFAULT", localDateStart: day, localDateEnd: day,
      });

      const overlapping = (av.json || []).filter((s) => {
        const st = new Date(s.localDateTimeStart).getTime();
        const en = new Date(s.localDateTimeEnd).getTime();
        const bs = new Date(slot.localDateTimeStart).getTime();
        const be = new Date(slot.localDateTimeEnd).getTime();
        return st < be && bs < en;
      });

      if (!overlapping.length) continue;
      tested = true;

      const stillOpen = overlapping.filter((s) => s.available);
      if (!stillOpen.length) {
        ok(`« ${other.internalName} » est fermé sur le créneau chevauchant — le guide est déjà pris`);
      } else {
        ko(`« ${other.internalName} » est encore vendable alors qu'il chevauche un départ vendu`,
           "Le guide serait attendu à deux endroits à la fois.");
      }
    }
    if (!tested) {
      console.log(`  ${C.dim}Aucun autre tour exposé ne chevauche ce créneau — règle non testable ici.${C.off}`);
    }
  }

  // ── 7. Rejeu réseau ──
  step("7. Civitatis rejoue une requête (timeout réseau de son côté)");

  const replay = await call("POST", "/bookings", {
    uuid, // le même uuid que la vente confirmée
    productId: product.id,
    optionId: "DEFAULT",
    availabilityId: slot.id,
    unitItems: [{ unitId }],
  });

  replay.json.uuid === uuid && replay.json.status === "CONFIRMED"
    ? ok("Le rejeu renvoie la réservation existante — aucun doublon créé")
    : ko("Le rejeu a créé ou cassé quelque chose", JSON.stringify(replay.json).slice(0, 160));

  // ── 8. Annulation ──
  step("8. Le client annule");

  act("Civitatis", "POST /bookings/{uuid}/cancel");
  r = await call("POST", `/bookings/${uuid}/cancel`, { reason: "Cliente canceló su viaje", force: true });

  if (r.json.status === "CANCELLED") {
    ok("Annulation acceptée — le guide est notifié");
    const freed = await call("POST", "/availability", {
      productId: product.id, optionId: "DEFAULT", availabilityIds: [slot.id],
    });
    freed.json[0].vacancies >= 2
      ? ok(`Les 2 places sont remises en vente (${freed.json[0].vacancies} disponibles)`)
      : ko(`Les places n'ont pas été libérées (${freed.json[0].vacancies} disponibles)`);
  } else {
    ko(`L'annulation a échoué (HTTP ${r.status})`, JSON.stringify(r.json));
  }

  // ── 9. Requêtes malformées ──
  step("9. La plateforme envoie n'importe quoi (robustesse)");

  const bad = [
    ["Produit inconnu", () => call("POST", "/availability", { productId: "xxx", optionId: "DEFAULT", localDateStart: day, localDateEnd: day }), "INVALID_PRODUCT_ID"],
    ["Option inconnue", () => call("POST", "/availability", { productId: product.id, optionId: "PREMIUM", localDateStart: day, localDateEnd: day }), "INVALID_OPTION_ID"],
    ["Unité inconnue", () => call("POST", "/bookings", { productId: product.id, optionId: "DEFAULT", availabilityId: slot.id, unitItems: [{ unitId: "xxx" }] }), "INVALID_UNIT_ID"],
    // 03:17 n'est l'heure de départ d'aucun tour. (Une date lointaine ne suffit
    // pas : 2099 à 09:00 serait un créneau parfaitement valide.)
    ["Heure qui n'est pas un départ", () => call("POST", "/bookings", { productId: product.id, optionId: "DEFAULT", availabilityId: `${plusDays(30)}T03:17:00+02:00`, unitItems: [{ unitId }] }), "INVALID_AVAILABILITY_ID"],
    ["availabilityId illisible", () => call("POST", "/bookings", { productId: product.id, optionId: "DEFAULT", availabilityId: "n'importe quoi", unitItems: [{ unitId }] }), "INVALID_AVAILABILITY_ID"],
    ["Créneau déjà passé", () => call("POST", "/bookings", { productId: product.id, optionId: "DEFAULT", availabilityId: `${plusDays(-5)}T09:00:00+02:00`, unitItems: [{ unitId }] }), null],
    ["Réservation inconnue", () => call("GET", "/bookings/pas-un-uuid"), "INVALID_BOOKING_UUID"],
    ["Champs manquants", () => call("POST", "/bookings", { productId: product.id, optionId: "DEFAULT" }), null],
    ["Clé révoquée", () => call("GET", "/supplier", null, "hor_cle_bidon"), "FORBIDDEN"],
  ];

  for (const [label, fn, expected] of bad) {
    const res = await fn();
    const isError = res.status >= 400 && res.json.error && res.json.errorMessage;

    if (!isError) {
      ko(`${label} : réponse non conforme (HTTP ${res.status})`, "OCTO impose { error, errorMessage }.");
    } else if (expected && res.json.error !== expected) {
      ko(`${label} : code ${res.json.error}, attendu ${expected}`);
    } else {
      ok(`${label} → ${res.json.error}`);
    }
  }

  // ── Bilan ──
  console.log("");
  if (failed === 0) {
    console.log(`${C.ok}${C.b}✅ Horus se comporte correctement face à un revendeur OCTO.${C.off}`);
    console.log(`${C.dim}   Ventes, paniers abandonnés, courses à la dernière place, rejeux, annulations et requêtes malformées : tout est géré.${C.off}\n`);
  } else {
    console.log(`${C.ko}${C.b}❌ ${failed} problème(s). Une plateforme réelle échouerait ici.${C.off}\n`);
  }

  process.exit(failed === 0 ? 0 : 1);
})();
