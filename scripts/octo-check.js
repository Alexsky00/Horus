#!/usr/bin/env node
/**
 * Diagnostic de connectivité OCTO.
 *
 *   node scripts/octo-check.js --url http://localhost:3000 --key hor_xxx
 *   node scripts/octo-check.js --url https://horus.vercel.app --key hor_xxx --booking
 *
 * Sans --booking : lecture seule, ne touche à rien.
 * Avec --booking : déroule en plus un cycle complet (hold → confirm → cancel)
 *                  sur une date lointaine, puis nettoie derrière lui.
 */

const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf("--" + n);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};

const BASE = (arg("url", "http://localhost:3000") + "/api/octo").replace(/\/+$/, "");
const KEY = arg("key", process.env.OCTO_KEY);
const DO_BOOKING = args.includes("--booking");

if (!KEY) {
  console.error("Falta la clave. Uso: node scripts/octo-check.js --url <url> --key <hor_...>");
  process.exit(2);
}

const C = { ok: "\x1b[32m", ko: "\x1b[31m", warn: "\x1b[33m", dim: "\x1b[90m", off: "\x1b[0m", b: "\x1b[1m" };
let failed = 0;
let warned = 0;

function ok(msg, detail) {
  console.log(`  ${C.ok}✓${C.off} ${msg}${detail ? ` ${C.dim}${detail}${C.off}` : ""}`);
}
function ko(msg, detail) {
  failed++;
  console.log(`  ${C.ko}✗${C.off} ${msg}${detail ? `\n      ${C.dim}${detail}${C.off}` : ""}`);
}
function warn(msg, detail) {
  warned++;
  console.log(`  ${C.warn}!${C.off} ${msg}${detail ? `\n      ${C.dim}${detail}${C.off}` : ""}`);
}
function section(t) {
  console.log(`\n${C.b}${t}${C.off}`);
}

async function call(method, path, body, token = KEY) {
  const headers = { "Content-Type": "application/json", "Octo-Capabilities": "octo/pricing" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch (e) {
    return { status: 0, json: {}, netError: e.message };
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text.slice(0, 120) };
  }
  return { status: res.status, json, caps: res.headers.get("octo-capabilities") };
}

const plusDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

(async () => {
  console.log(`\n${C.b}Diagnóstico OCTO${C.off} ${C.dim}${BASE}${C.off}`);

  // ── 1. Accesibilidad y autenticación ──
  section("1. Acceso y autenticación");

  let r = await call("GET", "/supplier", null, null);
  if (r.netError) {
    ko("El servidor no responde", r.netError + "  ¿Está la app arrancada en esa URL?");
    process.exit(1);
  }
  if (r.status === 401) ok("Sin clave → 401 UNAUTHORIZED");
  else ko(`Sin clave debería dar 401, ha dado ${r.status}`, "La API está abierta sin autenticación.");

  r = await call("GET", "/supplier", null, "clave_invalida_xxx");
  if (r.status === 403) ok("Clave inválida → 403 FORBIDDEN");
  else ko(`Clave inválida debería dar 403, ha dado ${r.status}`);

  r = await call("GET", "/supplier");
  if (r.status !== 200) {
    ko(`Tu clave no funciona (HTTP ${r.status})`, JSON.stringify(r.json));
    console.log(`\n${C.ko}Diagnóstico interrumpido: sin clave válida no se puede seguir.${C.off}\n`);
    process.exit(1);
  }
  ok("Tu clave funciona");

  if (r.caps === "octo/pricing") ok("Capability octo/pricing negociada");
  else warn(`La cabecera Octo-Capabilities devuelve "${r.caps}"`, "Se esperaba octo/pricing.");

  // ── 2. Identidad del proveedor ──
  section("2. Identidad del proveedor (GET /supplier)");
  const sup = r.json;

  if (sup.name && sup.name !== "Horus") ok(`Nombre: ${sup.name}`);
  else warn("Nombre comercial sin configurar", "Admin → Conexión OCTO → Nombre comercial. La plataforma lo verá.");

  const missing = ["email", "telephone", "address"].filter((f) => !sup.contact?.[f]);
  if (!missing.length) ok("Contacto completo (email, teléfono, dirección)");
  else warn(`Contacto incompleto: falta ${missing.join(", ")}`, "Las plataformas suelen exigirlo antes de conectar.");

  if (sup.endpoint?.startsWith("https://")) ok(`Endpoint público: ${sup.endpoint}`);
  else warn(`Endpoint no es HTTPS: ${sup.endpoint}`, "OCTO exige HTTPS en producción. En local es normal.");

  // ── 3. Catálogo ──
  section("3. Catálogo expuesto (GET /products)");
  r = await call("GET", "/products");

  if (r.status !== 200) {
    ko(`GET /products ha fallado (HTTP ${r.status})`, JSON.stringify(r.json));
    process.exit(1);
  }

  const products = r.json;
  if (!products.length) {
    ko("Ningún tour expuesto a las plataformas", 'Admin → Catálogo → ✎ → activa "Venta automática" en al menos un tour.');
    console.log(`\n${C.ko}Sin producto no hay nada que vender: el resto del diagnóstico no aplica.${C.off}\n`);
    process.exit(1);
  }
  ok(`${products.length} tour(s) a la venta`, products.map((p) => p.internalName).join(" · "));

  for (const p of products) {
    const o = p.options?.[0];
    const u = o?.units?.[0];
    const price = u?.pricing?.[0];

    if (!o?.availabilityLocalStartTimes?.length) {
      ko(`"${p.internalName}": sin horas de salida`);
    }
    if (!price || price.retail <= 0) {
      ko(`"${p.internalName}": sin precio`, "La plataforma no puede venderlo.");
    } else {
      const eur = (price.retail / 10 ** price.currencyPrecision).toFixed(2);
      const per = u.type === "ADULT" ? "por persona" : "por grupo entero";
      ok(`"${p.internalName}" — ${eur} € ${per}, salidas ${o.availabilityLocalStartTimes.join("/")}`);
    }
  }

  // ── 4. Disponibilidad ──
  section("4. Disponibilidad (próximos 30 días)");
  const product = products[0];
  const unitId = product.options[0].units[0].id;

  r = await call("POST", "/availability/calendar", {
    productId: product.id,
    optionId: "DEFAULT",
    localDateStart: plusDays(1),
    localDateEnd: plusDays(30),
  });

  if (r.status !== 200) {
    ko(`Calendario ha fallado (HTTP ${r.status})`, JSON.stringify(r.json));
  } else {
    const openDays = r.json.filter((d) => d.available).length;
    if (openDays === 0) {
      ko("Ningún día disponible en 30 días", "¿Agenda llena, o todo bloqueado? Las plataformas no podrán vender nada.");
    } else if (openDays < 5) {
      warn(`Solo ${openDays} día(s) disponible(s) de 30`, "Poco inventario para una plataforma.");
    } else {
      ok(`${openDays} día(s) disponibles de 30`);
    }
  }

  r = await call("POST", "/availability", {
    productId: product.id,
    optionId: "DEFAULT",
    localDateStart: plusDays(1),
    localDateEnd: plusDays(30),
  });

  const slots = Array.isArray(r.json) ? r.json : [];
  const sellable = slots.filter((s) => s.available);

  if (!sellable.length) {
    ko("Ninguna salida reservable", "Sin availabilityId no hay reserva posible.");
    console.log(`\n${C.ko}${failed} problema(s).${C.off}\n`);
    process.exit(1);
  }
  ok(`${sellable.length} salida(s) reservables`);

  const sample = sellable[0];
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(sample.id)) {
    ok(`availabilityId con zona horaria: ${sample.id}`);
  } else {
    ko(`availabilityId con formato inesperado: ${sample.id}`);
  }

  // ── 5. Ciclo de reserva ──
  if (!DO_BOOKING) {
    section("5. Ciclo de reserva");
    console.log(`  ${C.dim}Omitido. Añade --booking para probar hold → confirm → cancel (crea y borra una reserva real).${C.off}`);
  } else {
    section("5. Ciclo de reserva completo (reserva de prueba)");
    const uuid = crypto.randomUUID();

    r = await call("POST", "/bookings", {
      uuid,
      productId: product.id,
      optionId: "DEFAULT",
      availabilityId: sample.id,
      unitItems: [{ unitId }],
      testMode: true,
    });

    if (r.status !== 200 || r.json.status !== "ON_HOLD") {
      ko(`No se ha podido bloquear la plaza (HTTP ${r.status})`, JSON.stringify(r.json));
    } else {
      ok(`Bloqueo creado — ON_HOLD, expira ${r.json.utcExpiresAt}`);

      const after = await call("POST", "/availability", {
        productId: product.id,
        optionId: "DEFAULT",
        availabilityIds: [sample.id],
      });
      const left = after.json[0]?.vacancies;
      if (left === sample.vacancies - 1) ok(`El bloqueo consume la capacidad (${sample.vacancies} → ${left})`);
      else ko(`La capacidad no ha bajado como se esperaba (${sample.vacancies} → ${left})`);

      r = await call("POST", `/bookings/${uuid}/confirm`, {
        resellerReference: "OCTO-CHECK",
        contact: {
          firstName: "Prueba",
          lastName: "Conectividad",
          emailAddress: "octo-check@example.com",
        },
      });

      if (r.status === 200 && r.json.status === "CONFIRMED") {
        ok("Confirmación OK — la venta se registraría en Horus");
        console.log(`      ${C.dim}Deberías haber recibido una notificación push.${C.off}`);
      } else {
        ko(`La confirmación ha fallado (HTTP ${r.status})`, JSON.stringify(r.json));
      }

      r = await call("POST", `/bookings/${uuid}/cancel`, { reason: "Diagnóstico automático", force: true });
      if (r.status === 200 && r.json.status === "CANCELLED") ok("Cancelación OK — la reserva de prueba se ha limpiado");
      else ko(`No se ha podido cancelar la reserva de prueba (HTTP ${r.status})`, `Bórrala a mano: uuid ${uuid}`);
    }
  }

  // ── Resumen ──
  console.log("");
  if (failed === 0 && warned === 0) {
    console.log(`${C.ok}${C.b}✅ Todo correcto. Horus está listo para conectarse.${C.off}\n`);
  } else if (failed === 0) {
    console.log(`${C.warn}${C.b}⚠ Funciona, con ${warned} aviso(s) a revisar antes de conectar una plataforma real.${C.off}\n`);
  } else {
    console.log(`${C.ko}${C.b}❌ ${failed} problema(s) bloqueante(s)${warned ? ` y ${warned} aviso(s)` : ""}.${C.off}\n`);
  }

  process.exit(failed === 0 ? 0 : 1);
})();
