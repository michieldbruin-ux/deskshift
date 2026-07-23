// api/chat.js
// Vercel serverless function (Node.js runtime).
// Doel: de browser praat NOOIT rechtstreeks met api.anthropic.com, omdat de
// API-sleutel dan in de broncode zou moeten staan en door iedereen te stelen is.
// In plaats daarvan stuurt de browser naar /api/chat, en deze functie stuurt
// het verzoek met de sleutel uit een environment variable door naar Anthropic.

export default async function handler(req, res) {
  // Alleen POST toestaan
  if (req.method !== "POST") {
    res.status(405).json({ error: "Alleen POST is toegestaan." });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Dit betekent dat de environment variable niet is ingesteld in het
    // hostingdashboard. Zie README-DEPLOY.md, stap "Environment variable".
    res.status(500).json({ error: "Serverconfiguratie ontbreekt (ANTHROPIC_API_KEY)." });
    return;
  }

  // Body kan al geparsed zijn (Vercel doet dit meestal automatisch bij JSON),
  // maar we vangen ook de rauwe-string variant af voor de zekerheid.
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const { model, max_tokens, system, messages, tools } = body;

  // Kleine validatie, zodat een leeg of kwaadaardig verzoek niet zomaar
  // tokens van je account verbruikt.
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Verzoek mist berichten." });
    return;
  }
  const veiligeMaxTokens = Math.min(Number(max_tokens) || 1000, 4096);

  const upstreamBody = {
    model: model || "claude-sonnet-4-6",
    max_tokens: veiligeMaxTokens,
    system: system,
    messages: messages,
  };
  if (tools) upstreamBody.tools = tools;

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
      // Geef geen ruwe Anthropic-foutdetails door aan de browser (kan
      // interne info lekken), wel een bruikbare boodschap.
      res.status(upstream.status).json({
        error: "De AI-dienst gaf een fout terug.",
        status: upstream.status,
      });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "Kon de AI-dienst niet bereiken." });
  }
}
