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
  if (!waarde) return null; // header afwezig: hier nog geen oordeel, zie de handler
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

  // Herkomstcheck. Gemeten in een echte browser: een POST naar /api/* draagt
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

  const { max_tokens, system, messages, tier } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Verzoek mist berichten." });
    return;
  }
  // Payload-limieten: aantal berichten, totale grootte en system-lengte begrenzen.
  if (messages.length > 40) { res.status(413).json({ error: "Te veel berichten." }); return; }
  try {
    if (JSON.stringify(messages).length > 60000) { res.status(413).json({ error: "Verzoek te groot." }); return; }
  } catch { res.status(400).json({ error: "Ongeldig verzoek." }); return; }
  // Plafonds op wat de app zelf vraagt, met marge. Dit beperkt vooral wat dit
  // endpoint waard is als iemand het als gratis AI-proxy probeert te gebruiken:
  // de langste echte systeemprompt is ongeveer 4000 tekens en de zwaarste call
  // vraagt 5000 tokens.
  const veiligSystem = typeof system === "string" ? system.slice(0, 8000) : undefined;
  const veiligeMaxTokens = Math.min(Number(max_tokens) || 1000, 6000);

  // Het model wordt hier SERVER-SIDE bepaald. We nemen bewust GEEN model of
  // tools uit de browser over, zodat dit endpoint alleen de intake-taak kan
  // doen en niet als algemene, gratis AI-proxy misbruikt kan worden.
  //
  // De browser mag wel een 'tier' meegeven, maar alleen als keuze uit deze lijst.
  // Mechanische stappen (lijstjes, korte samenvattingen) draaien op het lichte,
  // goedkope model; alles wat de kwaliteit van het product bepaalt (het gratis
  // inzicht, het profiel, de richtingen en de plannen) op het zware model.
  // Onbekende of ontbrekende waarde valt terug op zwaar: bij twijfel kwaliteit.
  // Let op: geen gewone object-lookup, want een tier als "__proto__" of
  // "constructor" zou dan een object uit de prototypeketen teruggeven in plaats
  // van een model-id. Alleen deze twee exacte waarden tellen.
  const ZWAAR = "claude-sonnet-5";
  const gekozenModel = tier === "licht" ? "claude-haiku-4-5-20251001" : ZWAAR;

  const upstreamBody = {
    model: gekozenModel,
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
