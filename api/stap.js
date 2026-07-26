// api/stap.js
// Telt waar bezoekers in de intake afhaken. Geen cookie, geen antwoorden, geen
// mailadres, geen IP. Wat er binnenkomt is een willekeurig sessienummer uit
// sessionStorage, de naam van een stap, en hoeveel milliseconden na de eerste
// stap die stap bereikt werd. Daarmee is een funnel te maken en verder niets.
//
// Environment variables (optioneel):
//   SUPABASE_URL       - bijvoorbeeld https://xxxx.supabase.co
//   SUPABASE_ANON_KEY  - de publieke sleutel. Die mag in deze tabel alleen
//                        toevoegen en niets lezen; dat is met een RLS-policy
//                        vastgelegd, zie meting.sql.
// Staan die niet ingesteld, dan schrijft deze functie de stappen naar de
// Vercel-logs. Dan werkt het meteen na een deploy, alleen niet duurzaam: die
// logs zijn kort houdbaar en niet op te tellen.

const TOEGESTAAN = [/(^|\.)deskshift\.pro$/i, /\.vercel\.app$/i, /^localhost$/i, /^127\.0\.0\.1$/];
function hostToegestaan(waarde) {
  if (!waarde) return null;
  try { return TOEGESTAAN.some((re) => re.test(new URL(waarde).hostname)); }
  catch { return false; }
}

// Best-effort rate-limiting per IP. Ruimer dan bij de andere endpoints, want een
// hele intake levert een paar dozijn stappen op, gebundeld in een handvol
// verzoeken. Dit remt alleen iemand die de tabel wil volgooien.
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

// Een stapnaam is iets als "vraag.talent.skill" of "betaald". Kleine letters,
// cijfers, punt en liggend streepje, hooguit drie delen. Zo kan er niets anders
// in de tabel belanden dan namen die de app zelf verstuurt.
const STAP = /^[a-z0-9][a-z0-9_]{0,23}(\.[a-z0-9][a-z0-9_]{0,23}){0,2}$/;
const SESSIE = /^[a-z0-9]{8,32}$/;

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Alleen POST is toegestaan." }); return; }

  // Bewust de milde herkomstcheck: alleen een aantoonbaar vreemde herkomst gaat
  // eruit. Strenger kan hier niet, want dit endpoint wordt ook aangeroepen met
  // navigator.sendBeacon als de bezoeker het tabblad wegklikt, en of daar een
  // Origin bij zit verschilt per browser. Een gemiste meting is erger dan een
  // regel rommel: er is hier niets te stelen en niets te besteden.
  const originOk = hostToegestaan(req.headers.origin);
  const refererOk = hostToegestaan(req.headers.referer);
  if (originOk === false || refererOk === false) {
    res.status(403).json({ error: "Verzoek niet toegestaan." });
    return;
  }

  if (teVaak(clientIp(req), [{ max: 60, ms: 60000 }, { max: 600, ms: 3600000 }])) {
    // Geen 429 met uitleg: de browser doet hier niets mee en een beacon leest
    // het antwoord niet eens. Stil laten vallen is genoeg.
    res.status(204).end();
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    if (body.length > 8000) { res.status(413).end(); return; }
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== "object") { res.status(400).end(); return; }

  const sessie = typeof body.sessie === "string" ? body.sessie : "";
  if (!SESSIE.test(sessie)) { res.status(400).end(); return; }

  const rauw = Array.isArray(body.stappen) ? body.stappen.slice(0, 60) : [];
  const regels = [];
  for (const s of rauw) {
    const stap = s && typeof s.stap === "string" ? s.stap : "";
    if (!STAP.test(stap)) continue;
    let ms = Math.round(Number(s && s.ms));
    if (!isFinite(ms) || ms < 0 || ms > 24 * 3600 * 1000) ms = null;
    regels.push({ sessie, stap, ms });
  }
  if (!regels.length) { res.status(204).end(); return; }

  const url = process.env.SUPABASE_URL;
  const sleutel = process.env.SUPABASE_ANON_KEY;

  if (!url || !sleutel) {
    // Vangnet zonder database: in de logs staat het dan tenminste.
    for (const r of regels) console.log("meting", r.sessie, r.stap, r.ms);
    res.status(204).end();
    return;
  }

  try {
    const upstream = await fetch(url.replace(/\/$/, "") + "/rest/v1/deskshift_meting", {
      method: "POST",
      headers: {
        apikey: sleutel,
        Authorization: "Bearer " + sleutel,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(regels),
    });
    if (!upstream.ok) {
      const tekst = await upstream.text().catch(() => "");
      console.error("meting-fout", upstream.status, tekst.slice(0, 300));
    }
  } catch (err) {
    console.error("meting-onbereikbaar", String(err && err.message).slice(0, 200));
  }
  // Altijd 204, ook als het wegschrijven mislukte. Een meting die niet aankomt
  // mag nooit iets zijn dat de bezoeker merkt.
  res.status(204).end();
}
