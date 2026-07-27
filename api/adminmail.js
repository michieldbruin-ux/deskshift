// api/adminmail.js
// Stuurt de beheerder twee overzichten. Wordt aangeroepen door de cron van
// Vercel, staat in vercel.json.
//
//   dagmail   elke dag: betaalde rapporten van gisteren, aantal en waarde.
//             Zijn er geen, dan gaat er geen mail uit.
//   weekmail  elke maandag: de week ervoor, maandag tot en met zondag. Betaalde
//             rapporten plus het aantal mensen dat de intake afmaakte, de
//             paywall zag en niet betaalde. Die gaat altijd uit, ook op nul.
//
// Environment variables:
//   CRON_SECRET                - VERPLICHT. Vercel stuurt deze mee als
//                                Authorization: Bearer <waarde> zodra hij bestaat.
//                                Staat hij er niet, dan weigert deze functie
//                                alles: een open endpoint dat mail verstuurt is
//                                erger dan een mail die niet aankomt.
//   STRIPE_PRIVATE_KEY         - voor de betalingen. Al ingesteld.
//   BREVO_API_KEY, MAIL_FROM   - voor het versturen. Al ingesteld.
//   SUPABASE_URL               - het eigen Deskshift-project.
//   SUPABASE_SERVICE_ROLE_KEY  - de anon-sleutel mag in de meettabel alleen
//                                toevoegen en niets lezen (zie meting.sql), dus
//                                daarmee is de funnel niet uit te lezen. Zonder
//                                deze sleutel gaat de weekmail wel uit, maar
//                                zonder het aantal afhakers.
//                                LET OP: deze sleutel gaat langs RLS van elke
//                                tabel in het project. Daarom heeft Deskshift een
//                                eigen Supabase-project en deelt het er geen met
//                                een andere app.
//   ADMIN_MAIL                 - optioneel, waar het heen gaat.
//   ADMIN_NEGEER_MAILS         - optioneel, komma's ertussen. Betalingen op deze
//                                adressen tellen niet mee. Standaard staat het
//                                adres van de beheerder er al in, zodat een
//                                eigen test de cijfers niet opblaast.

const TZ = "Europe/Amsterdam";
const ADMIN_STANDAARD = "michieldbruin@gmail.com";

/* Wiens betalingen niet meetellen. Eigen tests zijn echte betalingen bij Stripe,
   dus zonder deze lijst staat je eigen proef maandag als omzet in de mail.

   LET OP, dit werkt alleen voor de betalingen. De meting achter de afhakers kent
   geen mailadres en geen enkele andere identiteit, dat is met opzet zo gebouwd.
   Doe je zelf een intake en stop je bij de paywall, dan sta je in dat getal. Er
   is geen manier om dat eruit te filteren die de meting niet meteen tot een
   profiel maakt. */
function negeerMails() {
  const uit = new Set();
  const ruw = String(process.env.ADMIN_NEGEER_MAILS || "").split(",");
  ruw.push(String(process.env.ADMIN_MAIL || ADMIN_STANDAARD));
  for (const m of ruw) {
    const s = m.trim().toLowerCase();
    if (s) uit.add(s);
  }
  return uit;
}

/* ---------- tijd ----------
   De cron van Vercel draait op UTC en 07:00 in Nederland is 's zomers 05:00 UTC
   en 's winters 06:00. Daarom staan er twee cron-regels op dit pad en beslist
   deze functie zelf of het al zeven uur geweest is. Dubbel verzenden wordt
   voorkomen door de claim verderop, niet door het uur. */
function onderdelen(d) {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, weekday: "short",
  });
  const p = {};
  for (const deel of f.formatToParts(d)) p[deel.type] = deel.value;
  return {
    jaar: +p.year, maand: +p.month, dag: +p.day,
    uur: +p.hour % 24, minuut: +p.minute, seconde: +p.second,
    weekdag: p.weekday, // Mon, Tue, ...
  };
}

// Hoeveel milliseconden de klok in Amsterdam voorloopt op UTC, op dat moment.
function verschuiving(d) {
  const p = onderdelen(d);
  return Date.UTC(p.jaar, p.maand - 1, p.dag, p.uur, p.minuut, p.seconde) - Math.floor(d.getTime() / 1000) * 1000;
}

// Een Amsterdamse klokstand omzetten naar het echte moment. Twee keer meten,
// want de verschuiving hangt af van het moment dat je nog aan het uitrekenen bent.
function instant(jaar, maand, dag, uur) {
  const gok = Date.UTC(jaar, maand - 1, dag, uur, 0, 0);
  const a = verschuiving(new Date(gok));
  const eerste = gok - a;
  const b = verschuiving(new Date(eerste));
  return a === b ? eerste : gok - b;
}

const DAGEN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli",
                 "augustus", "september", "oktober", "november", "december"];
const datumTekst = (j, m, d) => d + " " + MAANDEN[m - 1] + (new Date().getFullYear() === j ? "" : " " + j);
const sleutel = (j, m, d) => j + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");

// De dag voor `nu`, in Amsterdamse tijd, als {van, tot} in milliseconden.
function gisteren(nu) {
  const p = onderdelen(nu);
  const vandaag = Date.UTC(p.jaar, p.maand - 1, p.dag);
  const g = new Date(vandaag - 86400000);
  const j = g.getUTCFullYear(), m = g.getUTCMonth() + 1, d = g.getUTCDate();
  return { j, m, d, van: instant(j, m, d, 0), tot: instant(p.jaar, p.maand, p.dag, 0) };
}

// De week voor `nu`: maandag tot en met zondag, in Amsterdamse tijd.
function vorigeWeek(nu) {
  const p = onderdelen(nu);
  const vandaag = Date.UTC(p.jaar, p.maand - 1, p.dag);
  const index = DAGEN.indexOf(p.weekdag);            // 0 = zondag
  const sindsMaandag = (index + 6) % 7;              // maandag = 0
  const dezeMaandag = vandaag - sindsMaandag * 86400000;
  const a = new Date(dezeMaandag - 7 * 86400000);    // vorige maandag
  const b = new Date(dezeMaandag - 86400000);        // vorige zondag
  return {
    van: instant(a.getUTCFullYear(), a.getUTCMonth() + 1, a.getUTCDate(), 0),
    tot: dezeMaandag === vandaag ? instant(p.jaar, p.maand, p.dag, 0)
                                 : instant(new Date(dezeMaandag).getUTCFullYear(), new Date(dezeMaandag).getUTCMonth() + 1, new Date(dezeMaandag).getUTCDate(), 0),
    a: { j: a.getUTCFullYear(), m: a.getUTCMonth() + 1, d: a.getUTCDate() },
    b: { j: b.getUTCFullYear(), m: b.getUTCMonth() + 1, d: b.getUTCDate() },
  };
}

/* ---------- geld ----------
   Nooit optellen over valuta's heen. Sinds /en in dollars afrekent zijn er twee,
   en 25 euro plus 29 dollar is geen bedrag. */
function geld(centen, valuta) {
  try {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: valuta.toUpperCase() })
      .format(centen / 100);
  } catch (e) {
    return (centen / 100).toFixed(2) + " " + valuta.toUpperCase();
  }
}

/* ---------- Stripe ----------
   Charges en niet checkout-sessies: bij een charge is `created` het moment van
   betalen, bij een sessie het moment van aanmaken. Wie om 23:58 begint en om
   00:02 betaalt hoort in de mail van de nieuwe dag. */
async function betalingen(key, vanMs, totMs) {
  const uit = { aantal: 0, valuta: {}, terugbetaald: 0, eigen: 0 };
  const negeer = negeerMails();
  let na = null;
  for (let ronde = 0; ronde < 20; ronde++) {
    const q = new URLSearchParams();
    q.set("limit", "100");
    q.set("created[gte]", String(Math.floor(vanMs / 1000)));
    q.set("created[lt]", String(Math.floor(totMs / 1000)));
    if (na) q.set("starting_after", na);
    const r = await fetch("https://api.stripe.com/v1/charges?" + q.toString(), {
      headers: { Authorization: "Bearer " + key },
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error("stripe " + r.status + " " + JSON.stringify(d).slice(0, 200));
    for (const c of d.data || []) {
      if (!c.paid || c.status !== "succeeded") continue;
      // Eigen tests eruit. Stripe zet het adres uit de checkout in
      // billing_details; receipt_email staat er voor de zekerheid naast.
      const adressen = [(c.billing_details && c.billing_details.email) || "", c.receipt_email || ""]
        .map(x => String(x).trim().toLowerCase()).filter(Boolean);
      if (adressen.some(a => negeer.has(a))) { uit.eigen++; continue; }
      const netto = (c.amount || 0) - (c.amount_refunded || 0);
      if (c.amount_refunded) uit.terugbetaald++;
      if (netto <= 0) continue;
      uit.aantal++;
      const v = String(c.currency || "eur").toLowerCase();
      uit.valuta[v] = (uit.valuta[v] || 0) + netto;
    }
    if (!d.has_more || !(d.data || []).length) break;
    na = d.data[d.data.length - 1].id;
  }
  return uit;
}

/* ---------- Supabase ---------- */
async function supa(pad, sleutelWaarde, opties) {
  const basis = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  if (!basis) throw new Error("SUPABASE_URL ontbreekt");
  const o = opties || {};
  return fetch(basis + "/rest/v1/" + pad, {
    method: o.method || "GET",
    body: o.body,
    headers: Object.assign({
      apikey: sleutelWaarde,
      Authorization: "Bearer " + sleutelWaarde,
      "Content-Type": "application/json",
    }, o.headers || {}),
  });
}

/* Wie de intake afmaakte, de paywall zag en niet betaalde.

   De paywall-stap moet in de periode vallen. Of er betaald is wordt daarna
   opgezocht zonder tijdgrens, want wie zondagavond de paywall ziet en maandag
   betaalt is geen afhaker. */
async function afhakers(key, vanMs, totMs) {
  const q = new URLSearchParams();
  q.set("select", "sessie,taal,stap");
  q.set("ts", "gte." + new Date(vanMs).toISOString());
  q.append("ts", "lt." + new Date(totMs).toISOString());
  q.set("limit", "20000");
  const r = await supa("deskshift_meting?" + q.toString(), key);
  if (!r.ok) throw new Error("supabase " + r.status + " " + (await r.text()).slice(0, 200));
  const rijen = await r.json();

  const paywall = new Map();   // sessie -> taal
  const betaaldNu = new Set();
  for (const rij of rijen) {
    if (String(rij.stap || "").startsWith("paywall.")) paywall.set(rij.sessie, rij.taal || "onbekend");
    if (rij.stap === "betaald") betaaldNu.add(rij.sessie);
  }
  if (!paywall.size) return { bereikt: 0, gestopt: 0, perTaal: {} };

  // Betalingen van die sessies buiten de periode, in stukjes van honderd.
  const later = new Set(betaaldNu);
  const ids = [...paywall.keys()];
  for (let i = 0; i < ids.length; i += 100) {
    const deel = ids.slice(i, i + 100);
    const q2 = new URLSearchParams();
    q2.set("select", "sessie");
    q2.set("stap", "eq.betaald");
    q2.set("sessie", "in.(" + deel.join(",") + ")");
    const r2 = await supa("deskshift_meting?" + q2.toString(), key);
    if (!r2.ok) break;
    for (const rij of await r2.json()) later.add(rij.sessie);
  }

  const perTaal = {};
  let gestopt = 0;
  for (const [sessie, taal] of paywall) {
    perTaal[taal] = perTaal[taal] || { bereikt: 0, gestopt: 0 };
    perTaal[taal].bereikt++;
    if (!later.has(sessie)) { gestopt++; perTaal[taal].gestopt++; }
  }
  return { bereikt: paywall.size, gestopt, perTaal };
}

/* Eén mail per periode, ook als de cron twee keer langskomt of Vercel het
   verzoek herhaalt. De claim gaat er vóór het versturen in: lukt het versturen
   niet, dan wordt hij weer weggehaald zodat de volgende ronde het opnieuw
   probeert. */
async function claim(key, soort, periode) {
  const r = await supa("deskshift_adminmail", key, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ soort, periode }),
  });
  if (r.status === 409) return false;         // stond er al
  if (!r.ok) throw new Error("claim " + r.status + " " + (await r.text()).slice(0, 200));
  return true;
}
async function ontclaim(key, soort, periode) {
  try {
    await supa("deskshift_adminmail?soort=eq." + encodeURIComponent(soort) + "&periode=eq." + encodeURIComponent(periode),
      key, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  } catch (e) { /* niets aan te doen */ }
}

/* ---------- de mail ---------- */
const esc = s => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const KLEUR = { ink: "#404E3B", petrol: "#4F6360", lijn: "#CFD6CB", veld: "#F3F5F1", lime: "#7B9669" };

function omhulsel(kop, onder, inhoud) {
  return `<!doctype html><html><body style="margin:0;background:#E6E6E6;padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid ${KLEUR.lijn};border-radius:12px">
    <tr><td style="padding:24px 26px 6px">
      <div style="font:500 11px/1 'Courier New',monospace;letter-spacing:1.4px;text-transform:uppercase;color:${KLEUR.petrol}">Deskshift beheer</div>
      <h1 style="font:bold 21px/1.25 Arial,sans-serif;color:${KLEUR.ink};margin:10px 0 2px">${esc(kop)}</h1>
      <p style="font:14px/1.5 Arial,sans-serif;color:${KLEUR.petrol};margin:0 0 4px">${esc(onder)}</p>
    </td></tr>
    <tr><td style="padding:8px 26px 26px">${inhoud}</td></tr>
  </table></body></html>`;
}

function getalblok(label, waarde, extra) {
  return `<div style="border-top:1px solid ${KLEUR.lijn};padding:14px 0">
    <div style="font:500 11px/1 'Courier New',monospace;letter-spacing:1.2px;text-transform:uppercase;color:${KLEUR.petrol}">${esc(label)}</div>
    <div style="font:bold 30px/1.1 Arial,sans-serif;color:${KLEUR.ink};margin:6px 0 0">${esc(waarde)}</div>
    ${extra ? `<div style="font:14px/1.5 Arial,sans-serif;color:${KLEUR.petrol};margin:4px 0 0">${extra}</div>` : ""}
  </div>`;
}

function bedragregels(valuta) {
  const namen = Object.keys(valuta).sort();
  if (!namen.length) return "";
  return namen.map(v => `<span style="display:inline-block;margin-right:14px">${esc(geld(valuta[v], v))}</span>`).join("");
}

// Eigen tests worden niet stilzwijgend weggelaten: dan zit je later te zoeken
// naar het verschil tussen deze mail en het Stripe-dashboard.
const eigenzin = b => b.eigen
  ? " " + b.eigen + (b.eigen === 1 ? " eigen betaling is" : " eigen betalingen zijn") + " niet meegeteld."
  : "";

function htmlDag(datum, b) {
  return omhulsel(
    b.aantal === 1 ? "1 nieuw rapport" : b.aantal + " nieuwe rapporten",
    datum,
    getalblok("Betaalde rapporten", String(b.aantal), bedragregels(b.valuta)) +
    (b.terugbetaald ? getalblok("Waarvan terugbetaald", String(b.terugbetaald), "") : "") +
    `<p style="font:13px/1.6 Arial,sans-serif;color:${KLEUR.petrol};margin:16px 0 0;border-top:1px solid ${KLEUR.lijn};padding-top:12px">
      Bedragen zijn na aftrek van terugbetalingen, vóór de kosten van Stripe.${eigenzin(b)} Op een dag zonder verkoop gaat er geen mail uit, behalve als de cijfers niet op te halen waren.</p>`
  );
}

function htmlWeek(periode, b, a) {
  const taalregels = a && Object.keys(a.perTaal || {}).length
    ? Object.entries(a.perTaal).sort().map(([t, x]) =>
        `<span style="display:inline-block;margin-right:14px">${esc(t)}: ${x.gestopt} van ${x.bereikt} gestopt</span>`).join("")
    : "";
  return omhulsel("De week in twee getallen", periode,
    getalblok("Betaalde rapporten", String(b.aantal), bedragregels(b.valuta) || "geen omzet deze week") +
    (a
      ? getalblok("Intake af, paywall gezien, niet betaald", String(a.gestopt),
          taalregels || (a.bereikt ? a.bereikt + " bereikten de paywall" : "niemand kwam tot de paywall"))
      : getalblok("Intake af, paywall gezien, niet betaald", "onbekend",
          "de meting was niet te lezen, zie SUPABASE_SERVICE_ROLE_KEY")) +
    `<p style="font:13px/1.6 Arial,sans-serif;color:${KLEUR.petrol};margin:16px 0 0;border-top:1px solid ${KLEUR.lijn};padding-top:12px">
      De betalingen komen uit Stripe, de afhakers uit de eigen meting. Die meting telt per tabblad en slaat de testmodus over, dus het is een ondergrens en geen exacte telling.${eigenzin(b)} Een eigen intake zonder betaling is er niet uit te filteren: de meting kent geen mailadres.</p>`);
}

async function stuur(onderwerp, html) {
  const apiKey = process.env.BREVO_API_KEY;
  const van = String(process.env.MAIL_FROM || "");
  if (!apiKey || !van) throw new Error("BREVO_API_KEY of MAIL_FROM ontbreekt");
  const m = /^\s*(.*?)\s*<\s*([^>]+?)\s*>\s*$/.exec(van);
  const sender = m ? { name: m[1] || "Deskshift", email: m[2] } : { name: "Deskshift", email: van.trim() };
  const naar = String(process.env.ADMIN_MAIL || ADMIN_STANDAARD).trim();
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender, to: [{ email: naar }], subject: onderwerp, htmlContent: html }),
  });
  if (!r.ok) throw new Error("brevo " + r.status + " " + (await r.text()).slice(0, 200));
}

/* ---------- afhandeling ---------- */
export default async function handler(req, res) {
  const geheim = process.env.CRON_SECRET;
  if (!geheim) {
    console.error("adminmail: CRON_SECRET ontbreekt, endpoint blijft dicht");
    res.status(503).json({ error: "Niet geconfigureerd." });
    return;
  }
  if (req.headers.authorization !== "Bearer " + geheim) {
    res.status(401).json({ error: "Niet toegestaan." });
    return;
  }

  const stripeSleutel = process.env.STRIPE_PRIVATE_KEY;
  const dbSleutel = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!stripeSleutel) { res.status(500).json({ error: "STRIPE_PRIVATE_KEY ontbreekt." }); return; }
  if (!dbSleutel) { console.error("adminmail: SUPABASE_SERVICE_ROLE_KEY ontbreekt"); }

  // Met ?nu= is een andere datum door te rekenen, alleen achter het geheim.
  // Handig om te controleren wat er vorige maandag verstuurd zou zijn.
  const nu = req.query && req.query.nu ? new Date(String(req.query.nu)) : new Date();
  if (isNaN(nu.getTime())) { res.status(400).json({ error: "Ongeldige nu." }); return; }
  const p = onderdelen(nu);

  // Voor zevenen in Nederland gebeurt er niets. De tweede cron-regel van die dag
  // komt een uur later langs en is dan wel op tijd.
  const droog = !!(req.query && req.query.droog);
  if (p.uur < 7 && !droog) {
    res.status(200).json({ overgeslagen: "voor 07:00 in " + TZ, uur: p.uur });
    return;
  }

  const gedaan = [];
  const fouten = [];

  /* ----- de dagmail ----- */
  const g = gisteren(nu);
  const dagSleutel = sleutel(g.j, g.m, g.d);
  try {
    const b = await betalingen(stripeSleutel, g.van, g.tot);
    if (!b.aantal) {
      gedaan.push({ soort: "dag", periode: dagSleutel, verstuurd: false, reden: "geen betalingen" });
    } else if (droog) {
      gedaan.push({ soort: "dag", periode: dagSleutel, verstuurd: false, reden: "droog", cijfers: b });
    } else if (!dbSleutel || await claim(dbSleutel, "dag", dagSleutel)) {
      const onderwerp = "Deskshift " + datumTekst(g.j, g.m, g.d) + ": "
        + b.aantal + (b.aantal === 1 ? " rapport" : " rapporten")
        + (Object.keys(b.valuta).length ? ", " + Object.entries(b.valuta).map(([v, c]) => geld(c, v)).join(" en ") : "");
      try {
        await stuur(onderwerp, htmlDag(datumTekst(g.j, g.m, g.d), b));
        gedaan.push({ soort: "dag", periode: dagSleutel, verstuurd: true, aantal: b.aantal });
      } catch (e) {
        if (dbSleutel) await ontclaim(dbSleutel, "dag", dagSleutel);
        throw e;
      }
    } else {
      gedaan.push({ soort: "dag", periode: dagSleutel, verstuurd: false, reden: "al verstuurd" });
    }
  } catch (e) {
    // Stilte moet "geen verkoop" betekenen en nooit "de mailer is stuk", anders
    // zit je op een rustige dag naar een lege inbox te kijken die niets zegt.
    fouten.push("dag: " + String(e.message || e).slice(0, 300));
    console.error("adminmail-dag", e);
    try {
      if (!droog && (!dbSleutel || await claim(dbSleutel, "dagfout", dagSleutel))) {
        await stuur("Deskshift " + datumTekst(g.j, g.m, g.d) + ": cijfers niet op te halen",
          omhulsel("De dagmail kon de cijfers niet ophalen", datumTekst(g.j, g.m, g.d),
            `<p style="font:14px/1.6 Arial,sans-serif;color:${KLEUR.ink};margin:0 0 10px">Dit is geen dag zonder verkoop, dit is een storing. Kijk in de Vercel-logs bij <code>/api/adminmail</code>.</p>
             <pre style="font:12px/1.5 'Courier New',monospace;color:${KLEUR.petrol};background:${KLEUR.veld};padding:12px;border-radius:8px;white-space:pre-wrap">${esc(String(e.message || e).slice(0, 500))}</pre>`));
      }
    } catch (e2) { console.error("adminmail-dagfout-mail", e2); }
  }

  /* ----- de weekmail, alleen op maandag ----- */
  if (p.weekdag === "Mon" || droog) {
    const w = vorigeWeek(nu);
    const weekSleutel = "week-" + sleutel(w.a.j, w.a.m, w.a.d);
    const periode = datumTekst(w.a.j, w.a.m, w.a.d) + " tot en met " + datumTekst(w.b.j, w.b.m, w.b.d);
    try {
      const b = await betalingen(stripeSleutel, w.van, w.tot);
      let a = null;
      if (dbSleutel) {
        try { a = await afhakers(dbSleutel, w.van, w.tot); }
        catch (e) { fouten.push("week-meting: " + String(e.message || e).slice(0, 200)); console.error("adminmail-week-meting", e); }
      }
      if (droog) {
        gedaan.push({ soort: "week", periode: weekSleutel, verstuurd: false, reden: "droog", cijfers: b, afhakers: a });
      } else if (!dbSleutel || await claim(dbSleutel, "week", weekSleutel)) {
        const onderwerp = "Deskshift week " + periode + ": "
          + b.aantal + (b.aantal === 1 ? " rapport" : " rapporten")
          + (a ? ", " + a.gestopt + " afgehaakt" : "");
        try {
          await stuur(onderwerp, htmlWeek(periode, b, a));
          gedaan.push({ soort: "week", periode: weekSleutel, verstuurd: true, aantal: b.aantal });
        } catch (e) {
          if (dbSleutel) await ontclaim(dbSleutel, "week", weekSleutel);
          throw e;
        }
      } else {
        gedaan.push({ soort: "week", periode: weekSleutel, verstuurd: false, reden: "al verstuurd" });
      }
    } catch (e) {
      fouten.push("week: " + String(e.message || e).slice(0, 300));
      console.error("adminmail-week", e);
    }
  }

  res.status(fouten.length ? 500 : 200).json({ nu: nu.toISOString(), uur: p.uur, gedaan, fouten });
}
