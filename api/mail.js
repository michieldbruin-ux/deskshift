// api/mail.js
// Stuurt de uitkomst en het plan als nette, gebrande e-mail via Brevo
// (transactional email API). Vereiste environment variables:
//   BREVO_API_KEY - de API-sleutel uit Brevo (SMTP & API > API Keys)
//   MAIL_FROM     - afzender, bijvoorbeeld: Deskshift <plan@deskshift.pro>
//                   (het afzenderadres/domein moet in Brevo geverifieerd zijn)
// De browser praat NOOIT rechtstreeks met Brevo; de sleutel blijft server-side.

const TOEGESTAAN = [/(^|\.)deskshift\.pro$/i, /\.vercel\.app$/i, /^localhost$/i, /^127\.0\.0\.1$/];
function hostToegestaan(waarde) {
  if (!waarde) return null;
  try { return TOEGESTAAN.some((re) => re.test(new URL(waarde).hostname)); }
  catch { return false; }
}
function geldigMail(e) {
  return typeof e === "string" && e.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
// "Deskshift <plan@deskshift.pro>" of "plan@deskshift.pro" -> {name, email}
function parseAfzender(s) {
  const m = /^\s*(.*?)\s*<\s*([^>]+?)\s*>\s*$/.exec(s || "");
  if (m) return { name: m[1] || "Deskshift", email: m[2] };
  return { name: "Deskshift", email: (s || "").trim() };
}

// Best-effort rate-limiting per IP. Serverless-instances zijn kortlevend en er
// kunnen er meerdere tegelijk draaien, dus dit is een drempel tegen misbruik als
// open mailrelay, geen waterdicht slot.
const RL = new Map(); // ip -> number[] (tijdstempels in ms)
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
  if (RL.size > 5000) {
    for (const [k, v] of RL) { const laatste = v[v.length - 1]; if (laatste == null || nu - laatste > maxMs) RL.delete(k); }
  }
  return regels.some((r) => lijst.filter((t) => nu - t < r.ms).length > r.max);
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Alleen POST is toegestaan." }); return; }

  // Alleen vanaf onze eigen site, als drempel tegen misbruik als open mailrelay.
  // Gemeten in een echte browser: een POST naar /api/* draagt
  // altijd een Origin, ook nu Referrer-Policy op no-referrer staat en er dus
  // nooit een Referer meekomt. "Geen van beide aanwezig" is daarom geen echte
  // bezoeker maar een script, en dat weigeren we. Let op: dit is een drempel en
  // geen slot, want een Origin is te vervalsen. Het sluit wel de situatie waarin
  // dit endpoint voor iedereen met een curl zonder headers open stond.
  const originOk = hostToegestaan(req.headers.origin);
  const refererOk = hostToegestaan(req.headers.referer);
  if (originOk === false || refererOk === false || (!originOk && !refererOk)) {
    res.status(403).json({ error: "Verzoek niet toegestaan." });
    return;
  }

  // Mail is duurder om te misbruiken: houd het strak. Max 4 per minuut en 12 per
  // uur per IP; een rapportmail plant er in dezelfde minuut een opvolger bij, en
  // dan moet een tweede poging niet meteen tegen de limiet lopen.
  if (teVaak(clientIp(req), [{ max: 4, ms: 60000 }, { max: 12, ms: 3600000 }])) {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Even te veel verzoeken. Wacht een minuut en probeer het opnieuw." });
    return;
  }

  const apiKey = process.env.BREVO_API_KEY;
  const fromRaw = process.env.MAIL_FROM;
  if (!apiKey || !fromRaw) {
    res.status(500).json({ error: "Mailconfiguratie ontbreekt (BREVO_API_KEY of MAIL_FROM)." });
    return;
  }
  const sender = parseAfzender(fromRaw);

  let body = req.body;
  if (typeof body === "string") {
    // Ruimer dan voorheen, want er kan nu een pdf als base64 in zitten.
    if (body.length > 900000) { res.status(413).json({ error: "Verzoek te groot." }); return; }
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const { email, onderwerp, html, scheduledAt, bijlagen } = body;
  if (!geldigMail(email)) { res.status(400).json({ error: "Ongeldig e-mailadres." }); return; }
  if (typeof html !== "string" || !html || html.length > 200000) {
    res.status(400).json({ error: "Ongeldige of te grote inhoud." });
    return;
  }
  const subject = (typeof onderwerp === "string" && onderwerp.trim().slice(0, 140)) || "Je Deskshift-plan";

  // Optioneel uitgesteld verzenden, voor de opvolger in week 2 van het plan.
  // Minimaal een kwartier vooruit en hooguit 14 dagen; alles daarbuiten is geen
  // opvolger van een rapport maar misbruik of een bug.
  let planTijd;
  if (scheduledAt !== undefined) {
    const t = Date.parse(scheduledAt);
    const nu = Date.now();
    if (isNaN(t) || t < nu + 15 * 60000 || t > nu + 14 * 86400000) {
      res.status(400).json({ error: "Ongeldig verzendtijdstip." });
      return;
    }
    planTijd = new Date(t).toISOString();
  }

  // Bijlagen, strak gehouden zodat dit endpoint geen open bestandsrelay wordt:
  // hooguit drie pdf's, alleen een veilige bestandsnaam, alleen echt base64, en
  // samen niet meer dan vijf megabyte na decoderen.
  let bijlage;
  if (bijlagen !== undefined) {
    if (!Array.isArray(bijlagen) || bijlagen.length > 3) {
      res.status(400).json({ error: "Ongeldige bijlagen." }); return;
    }
    let totaal = 0;
    bijlage = [];
    for (const b of bijlagen) {
      const naam = b && typeof b.naam === "string" ? b.naam : "";
      const inhoud = b && typeof b.inhoud === "string" ? b.inhoud : "";
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}\.pdf$/.test(naam)) {
        res.status(400).json({ error: "Ongeldige bestandsnaam voor een bijlage." }); return;
      }
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(inhoud) || inhoud.length % 4 !== 0) {
        res.status(400).json({ error: "Ongeldige bijlage-inhoud." }); return;
      }
      const bytes = Math.floor(inhoud.length * 3 / 4);
      totaal += bytes;
      if (totaal > 5 * 1024 * 1024) {
        res.status(413).json({ error: "Bijlagen samen te groot." }); return;
      }
      // Moet ook echt een pdf zijn: %PDF- staat aan het begin, en dat is in
      // base64 altijd "JVBERi0".
      if (!inhoud.startsWith("JVBERi0")) {
        res.status(400).json({ error: "Een bijlage is geen pdf." }); return;
      }
      bijlage.push({ name: naam, content: inhoud });
    }
    if (!bijlage.length) bijlage = undefined;
  }

  try {
    const upstream = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify(Object.assign({
        sender,
        to: [{ email }],
        subject,
        htmlContent: html,
      }, planTijd ? { scheduledAt: planTijd } : {}, bijlage ? { attachment: bijlage } : {})),
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("brevo-fout", upstream.status, JSON.stringify(data).slice(0, 400));
      res.status(502).json({ error: "De mail kon niet verstuurd worden." });
      return;
    }
    res.status(200).json({ ok: true, id: data.messageId || null });
  } catch (err) {
    res.status(502).json({ error: "Kon de mailservice niet bereiken." });
  }
}
