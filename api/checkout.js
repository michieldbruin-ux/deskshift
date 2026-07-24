// api/checkout.js
// Maakt een Stripe Checkout Session voor de eenmalige betaling van EUR 25 en
// geeft de gehoste checkout-URL terug. De geheime sleutel blijft server-side.
// Vereiste environment variable:
//   STRIPE_PRIVATE_KEY  - de secret key uit Stripe (sk_live_... of sk_test_...)
// Optioneel:
//   STRIPE_PRICE_ID     - overschrijft de prijs-id hieronder, bijvoorbeeld om in
//                         testmodus een test-prijs te gebruiken.
// (STRIPE_PUBLIC_KEY is voor de browser en wordt hier niet gebruikt.)
// De browser praat NOOIT rechtstreeks met Stripe met de secret key.

// Het product in de Stripe-catalogus. Een prijs-id is geen geheim, dus die mag
// hier staan; via STRIPE_PRICE_ID is hij per omgeving te overschrijven.
const PRIJS_ID_STANDAARD = "price_1TwnuI46s0kCbhKWr4iibUvS";
// Vangnet als er geen (geldige) prijs-id is: dezelfde prijs, in code.
const PRIJS_CENTEN = 2500;
const PRODUCT_NAAM = "Deskshift, drie richtingen en plan van zes weken";

const TOEGESTAAN = [/(^|\.)deskshift\.pro$/i, /\.vercel\.app$/i, /^localhost$/i, /^127\.0\.0\.1$/];
function hostToegestaan(waarde) {
  if (!waarde) return null;
  try { return TOEGESTAAN.some((re) => re.test(new URL(waarde).hostname)); }
  catch { return false; }
}

// Best-effort rate-limiting per IP: rem tegen het in bulk aanmaken van sessies.
const RL = new Map();
function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff) return xff.split(",")[0].trim();
  return req.headers["x-real-ip"] || (req.socket && req.socket.remoteAddress) || "onbekend";
}
function teVaak(ip, regels) {
  const nu = Date.now();
  const maxMs = Math.max.apply(null, regels.map((r) => r.ms));
  const lijst = (RL.get(ip) || []).filter((t) => nu - t < maxMs);
  lijst.push(nu);
  RL.set(ip, lijst);
  if (RL.size > 5000) { for (const [k, v] of RL) { const l = v[v.length - 1]; if (l == null || nu - l > maxMs) RL.delete(k); } }
  return regels.some((r) => lijst.filter((t) => nu - t < r.ms).length > r.max);
}

// Bepaal de basis-URL (voor success/cancel) uit de request-headers.
function siteBasis(req) {
  const origin = req.headers.origin;
  if (origin && /^https?:\/\//i.test(origin)) return origin.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0];
  return host ? `${proto}://${host}` : "https://deskshift.pro";
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Alleen POST is toegestaan." }); return; }

  const originOk = hostToegestaan(req.headers.origin);
  const refererOk = hostToegestaan(req.headers.referer);
  if (originOk === false || (originOk === null && refererOk === false)) {
    res.status(403).json({ error: "Verzoek niet toegestaan." });
    return;
  }

  if (teVaak(clientIp(req), [{ max: 8, ms: 60000 }, { max: 40, ms: 3600000 }])) {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Even te veel verzoeken. Wacht een minuut en probeer het opnieuw." });
    return;
  }

  const key = process.env.STRIPE_PRIVATE_KEY;
  if (!key) { res.status(500).json({ error: "Betaalconfiguratie ontbreekt (STRIPE_PRIVATE_KEY)." }); return; }
  const prijsId = (process.env.STRIPE_PRICE_ID || PRIJS_ID_STANDAARD || "").trim();

  const basis = siteBasis(req);

  function bouwParams(metPrijsId) {
    const p = new URLSearchParams();
    p.append("mode", "payment");
    p.append("success_url", basis + "/?betaald=1&sid={CHECKOUT_SESSION_ID}");
    p.append("cancel_url", basis + "/?betaald=0");
    // Bewust GEEN payment_method_types meegeven: dan gebruikt Stripe automatisch de
    // betaalmethoden die in het Dashboard aanstaan (card, iDEAL, ...). Dat voorkomt
    // een harde fout als iDEAL nog niet geactiveerd is.
    p.append("locale", "nl");
    // Laat de klant een kortingscode invoeren op de betaalpagina. De codes zelf
    // maak je in het Stripe-dashboard (kortingsbon plus promotiecode).
    p.append("allow_promotion_codes", "true");
    p.append("line_items[0][quantity]", "1");
    if (metPrijsId) {
      p.append("line_items[0][price]", metPrijsId);
    } else {
      p.append("line_items[0][price_data][currency]", "eur");
      p.append("line_items[0][price_data][unit_amount]", String(PRIJS_CENTEN));
      p.append("line_items[0][price_data][product_data][name]", PRODUCT_NAAM);
    }
    return p;
  }

  async function maakSessie(params) {
    const upstream = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await upstream.json().catch(() => ({}));
    return { ok: upstream.ok && !!data.url, status: upstream.status, data };
  }

  try {
    // Eerst met het product uit de Stripe-catalogus, als er een prijs-id is.
    let poging = prijsId ? await maakSessie(bouwParams(prijsId)) : null;

    // Een prijs-id hoort bij één modus: een live-prijs bestaat niet onder een
    // test-sleutel en omgekeerd. Mislukt het daarop, val dan terug op de prijs
    // in code, zodat afrekenen altijd blijft werken (ook tijdens testen).
    if (poging && !poging.ok) {
      console.error("stripe-prijsid-mislukt", poging.status, JSON.stringify(poging.data).slice(0, 300));
      poging = null;
    }
    if (!poging) poging = await maakSessie(bouwParams(null));

    if (!poging.ok) {
      console.error("stripe-checkout-fout", poging.status, JSON.stringify(poging.data).slice(0, 400));
      res.status(502).json({ error: "De betaling kon niet worden gestart." });
      return;
    }
    res.status(200).json({ url: poging.data.url, id: poging.data.id });
  } catch (err) {
    res.status(502).json({ error: "Kon de betaaldienst niet bereiken." });
  }
}
