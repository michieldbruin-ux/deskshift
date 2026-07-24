// api/checkout.js
// Maakt een Stripe Checkout Session voor de eenmalige betaling van EUR 25 en
// geeft de gehoste checkout-URL terug. De geheime sleutel blijft server-side.
// Vereiste environment variable:
//   STRIPE_PRIVATE_KEY  - de secret key uit Stripe (sk_live_... of sk_test_...)
// (STRIPE_PUBLIC_KEY is voor de browser en wordt hier niet gebruikt.)
// De browser praat NOOIT rechtstreeks met Stripe met de secret key.

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

  const basis = siteBasis(req);
  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("success_url", basis + "/?betaald=1&sid={CHECKOUT_SESSION_ID}");
  params.append("cancel_url", basis + "/?betaald=0");
  params.append("payment_method_types[0]", "card");
  params.append("payment_method_types[1]", "ideal");
  params.append("line_items[0][quantity]", "1");
  params.append("line_items[0][price_data][currency]", "eur");
  params.append("line_items[0][price_data][unit_amount]", "2500");
  params.append("line_items[0][price_data][product_data][name]", "Deskshift, drie richtingen en plan van zes weken");

  try {
    const upstream = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok || !data.url) {
      console.error("stripe-checkout-fout", upstream.status, JSON.stringify(data).slice(0, 400));
      res.status(502).json({ error: "De betaling kon niet worden gestart." });
      return;
    }
    res.status(200).json({ url: data.url, id: data.id });
  } catch (err) {
    res.status(502).json({ error: "Kon de betaaldienst niet bereiken." });
  }
}
