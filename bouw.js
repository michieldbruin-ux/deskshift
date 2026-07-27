#!/usr/bin/env node
/* bouw.js: maakt index.html (Nederlands) en en/index.html (Engels).

   Waarom een buildstap en geen taalcheck in de browser. De pagina moet in de
   broncode al de goede taal bevatten: titel, omschrijving, hreflang en de
   gestructureerde data worden gelezen door zoekmachines en AI-crawlers die geen
   javascript uitvoeren. Zou de pagina zichzelf pas in de browser omzetten, dan
   staat er voor die lezers Nederlands op /en.

   Er is precies één bron voor de opmaak en het gedrag (index.template.html) en
   precies één bron per taal voor de tekst (taal.nl.js, taal.en.js). Een wijziging
   in de flow raakt dus meteen beide talen, en een wijziging in een zin raakt
   alleen die taal.

   Draaien: node bouw.js. De uitvoer staat in git, zodat Vercel gewoon statische
   bestanden serveert en er bij het deployen niets hoeft te draaien. */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const WORTEL = __dirname;
const BASIS = "https://deskshift.pro";

/* Een taalbestand is browsercode: het zet zichzelf in window.TALEN. Hier draaien
   we het in een kale sandbox en pakken we het resultaat eruit. */
function laadTaal(code){
  const bron = fs.readFileSync(path.join(WORTEL, "taal." + code + ".js"), "utf8");
  const zand = { window: {} };
  vm.createContext(zand);
  vm.runInContext(bron, zand, { filename: "taal." + code + ".js" });
  const t = zand.window.TALEN && zand.window.TALEN[code];
  if(!t) throw new Error("taal." + code + ".js zet window.TALEN." + code + " niet");
  return t;
}

/* Twee soorten ontsnappen, en het verschil is hier zichtbaar in de paginabron.
   esc is voor tekst tussen tags: daar zijn alleen &, < en > gevaarlijk. Ook de
   aanhalingstekens ontsnappen zou werken, maar dan staat er &#39; in de bron waar
   een apostrof hoort, en dat leest een crawler net zo goed als een mens. */
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

// Voor tekst in een attribuut: daar breekt het dubbele aanhalingsteken wel.
const attr = s => String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");

// Alle html uit de teksten strippen; nodig voor de meta-omschrijving en de
// gestructureerde data, waar geen opmaak in hoort.
const kaal = s => String(s).replace(/<[^>]+>/g, "").replace(/\s+/g," ").trim();

/* ---------- de herhalende blokken ---------- */
const blokken = (T, taal) => ({
  BLOK_MOCKBALKEN: T.landing.mockBalken.map(b =>
    `<div class="mb"><span class="mb-l">${esc(b[0])}</span><span class="mb-t"><i style="--w:${esc(b[1])}"></i></span></div>`).join("\n            "),

  BLOK_WEEKDAGEN: T.landing.weekDagen.map(d => `<span>${esc(d)}</span>`).join(""),

  BLOK_STAPPEN: T.landing.stappen.map((st,i) =>
    `<li><span class="step-n">0${i+1}</span><div class="step-b"><h3>${esc(st[0])}</h3><p>${esc(st[1])}</p></div></li>`).join("\n      "),

  BLOK_CRED: T.landing.cred.map(c =>
    `<div class="credkaart"><b>${esc(c[0])}</b><span>${esc(c[1])}</span></div>`).join("\n      "),

  BLOK_MAKER: T.landing.maker.map(p => `<p>${p}</p>`).join("\n      "),

  BLOK_TRUST: T.landing.trust.map(c =>
    `<div class="trustkaart"><b>${esc(c[0])}</b><span>${esc(c[1])}</span></div>`).join("\n      "),

  // De prijs als rollende cijfers: één wiel per cijfer, met de eindstand in --d.
  BLOK_PRIJSCIJFERS: String(T.prijs.bedrag).split("").map(c =>
    `<span class="pd" aria-hidden="true"><span class="pd-reel" style="--d:${+c}">` +
    "0123456789".split("").map(x => `<i>${x}</i>`).join("") + "</span></span>").join(""),

  BLOK_BON: T.landing.bon.map(b =>
    `<li><span>${esc(b[0])}</span>${b[1] ? `<em>${esc(b[1])}</em>` : ""}</li>`).join("\n          "),

  BLOK_FAQ: T.landing.faq.map(f =>
    `<details><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join("\n    "),

  /* Geen taalpad ervoor: het hele pad staat in footLinks zelf. Die lijst wijst
     per taal naar de pagina's die in die taal echt bestaan, en die zijn niet
     allemaal een vertaling van elkaar. Zet er nooit automatisch /en voor, want
     een /en dat nergens op staat is een 404 en dat is erger dan een link naar
     een pagina in de andere taal. */
  BLOK_FOOTLINKS: T.landing.footLinks
    .map(l => `<a href="${attr(l[1])}">${esc(l[0])}</a>`)
    .join(' <span aria-hidden="true">&middot;</span> '),

  BLOK_PRIVACYLIJST: T.landing.privacyPopLijst.map(l =>
    `<li><b>${l[0]}</b>${l[1]}</li>`).join("\n      "),

  BLOK_SORTLIJST: T.landing.sortPopLijst.map(l =>
    `<li><b>${l[0]}</b>${l[1]}</li>`).join("\n      "),
});

/* ---------- gestructureerde data ---------- */
function jsonld(T, taal){
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "inLanguage": taal.htmlLang,
    "mainEntity": T.landing.faq.map(f => ({
      "@type": "Question",
      "name": kaal(f[0]),
      "acceptedAnswer": { "@type": "Answer", "text": kaal(f[1]) }
    }))
  };
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Deskshift",
    "url": BASIS,
    "logo": BASIS + "/brand/deskshift-appicoon-512.png",
    "description": kaal(T.meta.organisatie),
    "email": "plan@deskshift.pro",
    "priceRange": T.prijs.tekst
  };
  const app = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Deskshift",
    "url": taal.canoniek,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": T.meta.besturing,
    "inLanguage": taal.bcp47,
    "description": kaal(T.meta.omschrijving),
    "offers": {
      "@type": "Offer",
      "price": String(T.prijs.bedrag),
      "priceCurrency": T.prijs.valuta,
      "description": kaal(T.meta.aanbod)
    },
    "publisher": { "@type": "Organization", "name": "Deskshift", "url": BASIS }
  };
  return [faq, org, app]
    .map(o => '<script type="application/ld+json">\n' + JSON.stringify(o, null, 2) + "\n<\/script>")
    .join("\n\n");
}

/* ---------- de talen ---------- */
/* canoniek is de ene url die telt, en die moet zonder omleiding te bereiken zijn.
   Met cleanUrls schrijft Vercel paden zonder afsluitende schuine streep, dus
   /en en niet /en/. De wortel houdt zijn streep, want die heeft geen pad. */
const TALEN = [
  { code:"nl", pad:"",    canoniek:BASIS + "/",   htmlLang:"nl", bcp47:"nl-NL", ogLocale:"nl_NL", uit:"index.html" },
  { code:"en", pad:"/en", canoniek:BASIS + "/en", htmlLang:"en", bcp47:"en-GB", ogLocale:"en_GB", uit:"en/index.html" },
];

function hreflang(){
  return TALEN.map(t => `<link rel="alternate" hreflang="${t.htmlLang}" href="${t.canoniek}">`)
    .concat([`<link rel="alternate" hreflang="x-default" href="${BASIS}/">`])
    .join("\n");
}

/* Eén plaatshouder invullen. Puntjes lopen door het object heen, zodat
   {{landing.h1}} en {{ui.taalKnop}} allebei werken. */
function pak(bron, pad){
  return pad.split(".").reduce((o,k) => (o == null ? o : o[k]), bron);
}

function vul(sjabloon, T, taal){
  const bl = blokken(T, taal);
  const vast = {
    code: taal.code,
    htmlLang: taal.htmlLang,
    pad: taal.pad,
    basis: BASIS,
    canoniek: taal.canoniek,
    ogLocale: taal.ogLocale,
    hreflang: hreflang(),
    JSONLD: jsonld(T, taal),
  };
  return sjabloon.replace(/\{\{([A-Za-z0-9_.]+)\}\}/g, (heel, sleutel) => {
    if(sleutel in bl) return bl[sleutel];
    if(sleutel in vast) return vast[sleutel];
    const v = pak(T, sleutel);
    if(v === undefined || v === null) throw new Error("onbekende plaatshouder {{" + sleutel + "}} in taal " + taal.code);
    if(typeof v === "function") throw new Error("plaatshouder {{" + sleutel + "}} is een functie, niet in te vullen in html");
    return String(v);
  });
}

/* ---------- controle vooraf ----------
   Beide talen moeten dezelfde sleutels hebben. Zonder deze controle valt een
   ontbrekende zin pas op als een bezoeker "undefined" op zijn scherm krijgt. */
// Niet overal in duiken: onder demo.pos zijn de sleutels de sorteeronderwerpen
// zelf, en die horen per taal juist te verschillen.
const NIET_DIEPER = new Set(["demo.pos.skill", "demo.pos.energie"]);
function sleutels(o, voor){
  voor = voor || "";
  const uit = [];
  for(const k of Object.keys(o)){
    const v = o[k];
    const pad = voor ? voor + "." + k : k;
    uit.push(pad);
    if(v && typeof v === "object" && !Array.isArray(v) && !NIET_DIEPER.has(pad)) uit.push(...sleutels(v, pad));
  }
  return uit;
}
function vergelijk(a, b){
  const A = new Set(sleutels(a)), B = new Set(sleutels(b));
  const mist = [...A].filter(k => !B.has(k));
  const extra = [...B].filter(k => !A.has(k));
  return { mist, extra };
}

/* ---------- draaien ---------- */
const sjabloon = fs.readFileSync(path.join(WORTEL, "index.template.html"), "utf8");
const talen = {};
for(const t of TALEN) talen[t.code] = laadTaal(t.code);

const verschil = vergelijk(talen.nl, talen.en);
if(verschil.mist.length || verschil.extra.length){
  console.error("Taalbestanden lopen uit de pas.");
  if(verschil.mist.length)  console.error("  ontbreekt in en:", verschil.mist.join(", "));
  if(verschil.extra.length) console.error("  alleen in en:   ", verschil.extra.join(", "));
  process.exit(1);
}

// Even zwaar als de sleutelcontrole: de intake moet in beide talen dezelfde
// vragen in dezelfde volgorde stellen, anders wijken de weging en de opgeslagen
// antwoorden af.
const vorm = t => t.secties.map(s => s.id + ":" + s.stappen.map(x => x.id + "/" + x.type).join(",")).join(" | ");
if(vorm(talen.nl) !== vorm(talen.en)){
  console.error("De intake heeft niet dezelfde vorm in beide talen.");
  console.error("  nl:", vorm(talen.nl));
  console.error("  en:", vorm(talen.en));
  process.exit(1);
}

for(const t of TALEN){
  const html = vul(sjabloon, talen[t.code], t);
  const doel = path.join(WORTEL, t.uit);
  fs.mkdirSync(path.dirname(doel), { recursive: true });
  fs.writeFileSync(doel, html);
  console.log(t.uit + "  " + (html.length/1024).toFixed(0) + " kB");
}
