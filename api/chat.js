// api/chat.js
// Vercel serverless function (Node.js runtime).
// Doel: de browser praat NOOIT rechtstreeks met api.anthropic.com, omdat de
// API-sleutel dan in de broncode zou moeten staan en door iedereen te stelen is.
// In plaats daarvan stuurt de browser naar /api/chat, en deze functie stuurt
// het verzoek met de sleutel uit een environment variable door naar Anthropic.

// Alleen aanroepen vanaf onze eigen site toestaan. Geen waterdicht slot (een
// script kan headers vervalsen), wel een drempel tegen willekeurig misbruik.
const TOEGESTAAN = [/(^|\.)deskshift\.pro$/i, /\.vercel\.app$/i, /^localhost$/i, /^127\.0\.0\.1$/];
function hostToegestaan(waarde) {
  if (!waarde) return null; // header afwezig: niet blokkeren (mobiel strippt soms Referer)
  try { return TOEGESTAAN.some((re) => re.test(new URL(waarde).hostname)); }
  catch { return false; }
}

// Best-effort rate-limiting per IP. Elke call kost geld bij Anthropic; dit is een
// drempel tegen scripts die de gratis intake in bulk draaien. Serverless-instances
// zijn kortlevend en meervoudig, dus geen slot, wel een rem.
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
  if (req.method !== "POST") {
    res.status(405).json({ error: "Alleen POST is toegestaan." });
    return;
  }

  // Herkomstcheck: als Origin/Referer aanwezig is, moet die van onze site komen.
  const originOk = hostToegestaan(req.headers.origin);
  const refererOk = hostToegestaan(req.headers.referer);
  if (originOk === false || (originOk === null && refererOk === false)) {
    res.status(403).json({ error: "Verzoek niet toegestaan." });
    return;
  }

  // Eén echte intake doet een handvol calls kort na elkaar (analyse, kandidaten,
  // drie uitwerkingen, plus de plannen na betaling). Deze grenzen laten dat ruim
  // toe, maar remmen een script dat de gratis intake honderden keren draait.
  if (teVaak(clientIp(req), [{ max: 25, ms: 60000 }, { max: 120, ms: 3600000 }])) {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Even te veel verzoeken. Wacht een minuut en probeer het opnieuw." });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Serverconfiguratie ontbreekt (ANTHROPIC_API_KEY)." });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    // Payload-limiet: weiger overdreven grote verzoeken (kosten/DoS).
    if (body.length > 200000) { res.status(413).json({ error: "Verzoek te groot." }); return; }
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const { max_tokens, system, messages } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Verzoek mist berichten." });
    return;
  }
  // Payload-limieten: aantal berichten, totale grootte en system-lengte begrenzen.
  if (messages.length > 40) { res.status(413).json({ error: "Te veel berichten." }); return; }
  try {
    if (JSON.stringify(messages).length > 180000) { res.status(413).json({ error: "Verzoek te groot." }); return; }
  } catch { res.status(400).json({ error: "Ongeldig verzoek." }); return; }
  const veiligSystem = typeof system === "string" ? system.slice(0, 20000) : undefined;
  const veiligeMaxTokens = Math.min(Number(max_tokens) || 1000, 8192);

  // Het model wordt hier SERVER-SIDE bepaald. We nemen bewust GEEN model of
  // tools uit de browser over, zodat dit endpoint alleen de intake-taak kan
  // doen en niet als algemene, gratis AI-proxy misbruikt kan worden.
  const upstreamBody = {
    model: "claude-sonnet-5",
    max_tokens: veiligeMaxTokens,
    system: veiligSystem,
    messages: messages,
  };

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(upstreamBody),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      // Log de echte oorzaak server-side (zichtbaar in de Vercel-logs),
      // maar geef geen ruwe Anthropic-foutdetails door aan de browser.
      console.error("anthropic-fout", upstream.status, JSON.stringify(data).slice(0, 600));
      res.status(upstream.status).json({
        error: "De AI-dienst gaf een fout terug.",
        status: upstream.status,
      });
      return;
    }

    // Diagnose voor "lege uitvoer van de AI": als er geen bruikbaar tekstblok
    // terugkomt, leg dan de stop_reason en de bloktypes vast in de logs.
    const blokken = Array.isArray(data.content) ? data.content : [];
    const heeftTekst = blokken.some((b) => b && b.type === "text" && b.text && b.text.trim());
    if (!heeftTekst) {
      console.error(
        "anthropic-leeg",
        "stop_reason=" + data.stop_reason,
        "blokken=" + JSON.stringify(blokken.map((b) => b && b.type)),
        "model=" + data.model
      );
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "Kon de AI-dienst niet bereiken." });
  }
}
