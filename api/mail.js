// api/mail.js
// Stuurt de uitkomst en het plan als nette, gebrande e-mail.
// Werkt via Resend (https://resend.com). Vereiste environment variables:
//   RESEND_API_KEY  - de API-sleutel uit je Resend-dashboard
//   MAIL_FROM       - afzender, bijvoorbeeld: Deskshift <plan@deskshift.pro>
//                     (het domein moet in Resend geverifieerd zijn)
// De browser praat NOOIT rechtstreeks met Resend; de sleutel blijft server-side.

const TOEGESTAAN = [/(^|\.)deskshift\.pro$/i, /\.vercel\.app$/i, /^localhost$/i, /^127\.0\.0\.1$/];
function hostToegestaan(waarde) {
  if (!waarde) return null;
  try { return TOEGESTAAN.some((re) => re.test(new URL(waarde).hostname)); }
  catch { return false; }
}
function geldigMail(e) {
  return typeof e === "string" && e.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Alleen POST is toegestaan." }); return; }

  // Alleen vanaf onze eigen site (drempel tegen misbruik als open mailrelay).
  const originOk = hostToegestaan(req.headers.origin);
  const refererOk = hostToegestaan(req.headers.referer);
  if (originOk === false || (originOk === null && refererOk === false)) {
    res.status(403).json({ error: "Verzoek niet toegestaan." });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) {
    res.status(500).json({ error: "Mailconfiguratie ontbreekt (RESEND_API_KEY of MAIL_FROM)." });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    if (body.length > 220000) { res.status(413).json({ error: "Verzoek te groot." }); return; }
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const { email, onderwerp, html } = body;
  if (!geldigMail(email)) { res.status(400).json({ error: "Ongeldig e-mailadres." }); return; }
  if (typeof html !== "string" || !html || html.length > 200000) {
    res.status(400).json({ error: "Ongeldige of te grote inhoud." });
    return;
  }
  const subject = (typeof onderwerp === "string" && onderwerp.trim().slice(0, 140)) || "Je Deskshift-plan";

  try {
    const upstream = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
      body: JSON.stringify({ from, to: [email], subject, html }),
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("resend-fout", upstream.status, JSON.stringify(data).slice(0, 400));
      res.status(502).json({ error: "De mail kon niet verstuurd worden." });
      return;
    }
    res.status(200).json({ ok: true, id: data.id || null });
  } catch (err) {
    res.status(502).json({ error: "Kon de mailservice niet bereiken." });
  }
}
