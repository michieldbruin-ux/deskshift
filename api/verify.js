// api/verify.js
// Controleert een Stripe Checkout Session server-side. Geeft {paid:true} alleen
// als de betaling echt is afgerond. Zo kan de browser niet met een verzonnen
// URL-parameter gratis ontgrendelen.
// Vereiste environment variable: STRIPE_PRIVATE_KEY

const TOEGESTAAN = [/(^|\.)deskshift\.pro$/i, /\.vercel\.app$/i, /^localhost$/i, /^127\.0\.0\.1$/];
function hostToegestaan(waarde) {
  if (!waarde) return null;
  try { return TOEGESTAAN.some((re) => re.test(new URL(waarde).hostname)); }
  catch { return false; }
}

export default async function handler(req, res) {
  const originOk = hostToegestaan(req.headers.origin);
  const refererOk = hostToegestaan(req.headers.referer);
  if (originOk === false || (originOk === null && refererOk === false)) {
    res.status(403).json({ error: "Verzoek niet toegestaan.", paid: false });
    return;
  }

  const key = process.env.STRIPE_PRIVATE_KEY;
  if (!key) { res.status(500).json({ error: "Betaalconfiguratie ontbreekt.", paid: false }); return; }

  const sid = (req.query && (req.query.sid || req.query.session_id)) || "";
  if (!sid || !/^cs_[A-Za-z0-9_]+$/.test(String(sid))) {
    res.status(400).json({ error: "Ongeldige sessie.", paid: false });
    return;
  }

  try {
    const upstream = await fetch("https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(sid), {
      headers: { Authorization: "Bearer " + key },
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) { res.status(200).json({ paid: false }); return; }
    const paid = data.payment_status === "paid" || data.status === "complete";
    res.status(200).json({ paid: !!paid });
  } catch (err) {
    res.status(200).json({ paid: false });
  }
}
