/* taal.nl.js
   Alle zichtbare tekst en alle systeemprompts van de Nederlandse Deskshift.

   index.template.html bevat geen tekst meer, alleen gedrag: de weegformules, de
   matrix, de flow en de opmaak. Wat er staat komt hiervandaan. Een tweede taal
   is daarmee een tweede databestand en geen tweede site, zodat een fix in de
   rekenlogica meteen voor beide talen geldt.

   bouw.js zet dit bestand en index.template.html om in index.html. Draai na elke
   wijziging hier `node bouw.js`, anders staat je nieuwe zin nergens.

   Twee soorten waarden staan hier bewust naast elkaar. Zinnen zijn tekst en mogen
   per taal alle kanten op. Sleutels zijn dat niet: de v-waarden in KALIB, de
   sleutels in DRIJF, de "sleutels" bij de grenzenvraag en de woorden
   taakverrijking / leren / zijproject en inkomen / leren / erkenning / prikkel in
   de prompts zijn interne codes waar de weging op rekent. Die blijven in elke
   taal letterlijk hetzelfde, ook in een Engelse prompt. */

window.TALEN = window.TALEN || {};

window.TALEN.nl = (function(){

/* ---------- prijs op één plek ---------- */
/* Het bedrag en het symbool staan hier, niet verspreid door de teksten. Wie de
   prijs wil wijzigen, wijzigt dit blok en verder niets. Let op: `bedrag` bepaalt
   ook hoeveel rollende cijfers er op de prijskaart staan. */
const PRIJS = {
  bedrag: 25,
  symbool: "€",
  valuta: "EUR",
  tekst: "€25",
  ariaLabel: "25 euro",
  btw: "Eenmalig, inclusief 21% btw. Geen abonnement, geen account. Meteen in beeld.",
  btwLang: "Eenmalig, inclusief 21% btw. Geen abonnement, geen account, geen upsell.",
};

/* ---------- sorteeronderwerpen ---------- */
const KAARTEN = ["Analyseren","Presenteren","Schrijven","Overleggen","Plannen","Onderhandelen","Uitzoeken","Bouwen of maken","Anderen helpen","Details controleren","Nieuwe mensen spreken","Beslissen","Documenteren","Improviseren"];
// Vakoverstijgende onderwerpen naast de rolspecifieke taken, zodat we ook vangen
// wat niet in een taaktitel past.
const ALGEMEEN = ["Creativiteit","Sociaal contact","Leidinggeven","Iets nieuws leren"];

// rolduur: maanden, daarna halve jaren, daarna hele jaren
const ROLDUUR = (function(){
  const a = [];
  for(let m=1;m<=11;m++) a.push(m===1?"1 maand":m+" maanden");
  for(let j=1;j<=5;j+=0.5) a.push(j+" jaar");
  for(let j=6;j<=20;j++) a.push(j+" jaar");
  return a;
})();

/* ---------- de intake ---------- */
const SECTIES = [
  { id:"persoonlijk", naam:"Persoonlijk", kop:"Eerst even wie je bent",
    intro:"Vier korte vragen. Geen naam nodig, geen mailadres.",
    theorie:"Levensfase bepaalt hoeveel vrije ruimte je feitelijk hebt. We vragen het om je scenario's realistisch te houden, niet om je in een hokje te stoppen.",
    stappen:[
      {id:"leeftijd",type:"slider",vraag:"Hoe oud ben je?",min:20,max:65,def:31,unit:"jaar"},
      {id:"opleiding",type:"choice",vraag:"Wat is je hoogst afgeronde opleiding?",opties:["Mbo","Hbo","Wo bachelor","Wo master of hoger","Anders"]},
      {id:"thuis",type:"choice",vraag:"Hoe ziet je thuissituatie eruit?",hint:"Dit bepaalt hoeveel avonden en weekenden echt vrij zijn.",opties:["Alleenwonend","Samenwonend zonder kinderen","Samenwonend met kinderen","Anders"]},
      {id:"avonden",type:"slider",vraag:"Hoeveel avonden per week zijn echt van jou?",hint:"Avonden zonder verplichtingen, zorg of afspraken die al vaststaan.",min:0,max:7,def:3,unit:"avonden"}
    ]},

  { id:"verleden", naam:"Verleden", kop:"Wat je tot hier heeft gebracht",
    intro:"Drie korte vragen over je loopbaan.",
    theorie:"Patronen herhalen zich. Als je in eerdere rollen na een paar maanden leegliep, zegt dat meer over de match tussen jouw tempo en de functie dan over de functie zelf.",
    stappen:[
      // labels vangt de nulwaarde af: "0 jaar" leest knullig bij iemand die net
      // een half jaar bezig is.
      {id:"jaren",type:"slider",vraag:"Hoeveel jaar werk je in totaal?",min:0,max:45,def:8,unit:"jaar",labels:{0:"minder dan een jaar"}},
      {id:"werkgevers",type:"slider",vraag:"Bij hoeveel werkgevers heb je gewerkt?",min:1,max:15,def:3,unit:"werkgevers"},
      {id:"patroon",type:"choice",vraag:"Herken je dat je werk na een tijd te ruim gaat zitten?",opties:["Ja, in vrijwel elke rol","Ja, in sommige rollen","Nee, dit is de eerste keer","Weet ik niet"]}
    ]},

  { id:"nu", naam:"Werk nu", kop:"Je huidige rol, feitelijk",
    intro:"Zes vragen. Nog geen oordeel, alleen de feiten.",
    theorie:"Het job demands-resources model onderscheidt taakeisen van hulpbronnen. Te weinig taakeisen levert net zulke reële klachten op als te veel: verveling, cynisme, schuldgevoel.",
    stappen:[
      {id:"functie",type:"text",vraag:"Wat is je functietitel?",placeholder:"Bijvoorbeeld: adviseur bedrijfsvoering"},
      {id:"sector",type:"text",vraag:"In welke sector werk je?",placeholder:"Bijvoorbeeld: zorgverzekeraar"},
      // Zonder deze vraag wordt de sector aangezien voor het vak. Een field
      // manager in de IT-sector kreeg onderwerpen over hardware upgraden, terwijl
      // die persoon HR-verantwoordelijk is voor gedetacheerde IT'ers.
      {id:"dagelijks",type:"longtext",vraag:"Wat doe je op een gewone werkdag?",hint:"Twee of drie dingen waar je tijd echt aan opgaat. Hiermee schatten we je vak niet verkeerd in."},
      {id:"contract",type:"slider",vraag:"Hoeveel uur staat er in je contract?",hint:"Werk je voor jezelf? Neem dan de uren die je jezelf hebt opgelegd.",min:16,max:45,def:40,unit:"uur"},
      {id:"kantoor",type:"slider",vraag:"Hoeveel dagen per week ben je op kantoor?",min:0,max:5,def:2,unit:"dagen"},
      {id:"rolduur",type:"schaal",vraag:"Hoe lang ben je al {functie}?",schaal:ROLDUUR,def:14}
    ]},

  { id:"rol", naam:"Je rol", kop:"Wat je rol met je doet",
    intro:"Vier vragen over de binnenkant van je werk.",
    theorie:"Job crafting begint met weten welke onderdelen van je functie je zou uitbreiden en welke je zou inruilen. Zonder dat onderscheid wordt elke verandering een gok.",
    stappen:[
      {id:"leuk",type:"longtext",vraag:"Welk deel van je werk zou je uitbreiden als het mocht?",hint:"Het onderdeel waar je wel meer van zou willen."},
      {id:"minder",type:"longtext",vraag:"En welk deel zou je morgen weggeven?"},
      {id:"ontwikkelen",type:"longtext",vraag:"Wat wil je in dit vak nog leren?",hint:"Iets wat je nu net niet kunt, maar wel wilt kunnen."},
      {id:"autonomie",type:"slider",vraag:"Hoeveel vrijheid heb je om je week zelf in te delen?",min:1,max:10,def:7,unit:"van 10",ends:["alles ligt vast","volledig vrij"]}
    ]},

  { id:"tijd",naam:"Tijd", kop:"Waar je uren echt heen gaan",
    intro:"Denk aan de afgelopen vier weken. Eerlijk mag, er kijkt niemand mee.",
    theorie:"Het verschil tussen contracturen en werkelijke taaktijd is de ruimte waar dit product over gaat. Bij hybride werk zonder harde begin- en eindtijd is dat verschil zelden zichtbaar.",
    stappen:[
      {id:"echturen",type:"slider",vraag:"Hoeveel uur per week ben je écht met taken bezig?",hint:"Een ruwe schatting van een gemiddelde week is genoeg. Exclusief overleg dat je zelf niet nodig vindt. Je contract is {contract} uur.",min:0,max:45,def:26,unit:"uur",pctVan:"contract"},
      {id:"moment",type:"choice",vraag:"Wanneer ben je meestal klaar met je week?",opties:["Al op dinsdag","Woensdag","Donderdag","Vrijdagochtend","Ik ben nooit echt klaar"]},
      {id:"invulling",type:"longtext",vraag:"Je bent aan het werk, maar niet met je werk bezig. Wat doe je dan?",hint:"Er is geen fout antwoord. Iedereen heeft die uren."}
    ]},

  { id:"talent",naam:"Talent", kop:"Waar je goed in bent en wat je leuk vindt",
    intro:"Twee sorteeroefeningen met onderwerpen uit jouw eigen vak. Dit is het hart van de intake.",
    theorie:"Kunnen en leuk vinden zijn niet hetzelfde. Waar je goed in bent maar geen plezier aan beleeft, wordt de taak die je toegeschoven krijgt. De overlap van allebei is waar het rendement zit.",
    stappen:[
      {id:"energie",type:"dual",vraag:"Hoeveel energie heb je aan het begin en aan het eind van een werkdag?",hint:"Cijfer van 1 tot 10 voor een gemiddelde dag.",a:{label:"Bij het begin",def:7},b:{label:"Aan het eind",def:5}},
      {id:"skill",type:"strip",vraag:"Waar ben je goed in?",hint:"Onderwerpen uit jouw werk als {functie}, plus een paar algemene. Zet elke schuif naar links of rechts, alleen bij wat je herkent.",links:"hier ben ik niet goed in",rechts:"hier ben ik goed in",bron:"skill"},
      {id:"energiekaart",type:"strip",vraag:"En wat vind je leuk om te doen?",hint:"Dezelfde onderwerpen, nu op plezier. Straks leg ik beide antwoorden over elkaar.",links:"vind ik niet leuk",rechts:"vind ik leuk, krijg er energie van",bron:"energie"},
      {id:"benaderd",type:"longtext",vraag:"Waar benaderen collega's je spontaan voor, ook al hoort het niet bij je functie?",hint:"Geen idee? Schrijf dan gerust: geen idee."}
    ]},

  { id:"dromen",naam:"Dromen", kop:"Nu even zonder rem",
    intro:"De laatste sectie. Eerst mag alles, daarna trekken we de grenzen.",
    theorie:"De zelfdeterminatietheorie stelt dat motivatie ontstaat bij autonomie, competentie en verbondenheid. Vraag mensen wat ze zouden doen zonder risico, en die drie komen bijna altijd boven.",
    stappen:[
      {id:"nieuwsgierig",type:"longtext",vraag:"Waar ben je de afgelopen maand nieuwsgierig naar geweest, puur voor jezelf?"},
      {id:"aldoet",type:"longtext",vraag:"Vul je je eigen ruimte binnen werktijd al in met iets naast je officiële taken?",hint:"Zonder oordeel. Dit is vaker regel dan uitzondering."},
      {id:"droom",type:"longtext",vraag:"Geen geld nodig, geen risico, niemand die meekijkt. Wat ga je doen?",hint:"Mag groot. Mag onrealistisch. Schrijf op wat er als eerste opkomt."},
      {id:"droom2",type:"longtext",vraag:"En over vijf jaar: waar wil je dan goed in zijn?",hint:"Niet welke functie. Welke vaardigheid of welk onderwerp."},
      // sleutels loopt gelijk op met opties en is wél taalonafhankelijk: de
      // risicoweging leest die codes, niet de zin ernaast.
      {id:"grenzen",type:"multi",vraag:"Wat wil je zeker niet?",hint:"Meerdere antwoorden mogelijk.",
       opties:["Mijn inkomen op het spel zetten","Mijn avonden en weekenden kwijt","Iets dat raakt aan mijn werkgever of opdrachtgever","Opvallen bij collega's"],
       sleutels:["inkomen","tijd","werkgever","opvallen"]},
      // items moet exact overeenkomen met de labels in DRIJF, anders vindt de
      // weging de drijfveer van een richting niet terug in deze rangorde.
      {id:"rangorde",type:"rank",vraag:"Zet op volgorde wat het zwaarst telt",hint:"Nummer 1 telt het zwaarst. Gelijkspel bestaat hier niet.",items:["Leren","Extra inkomen","Erkenning","Minder verveling"]}
    ]}
];

/* De vier laatste keuzes. De v-waarden zijn taalonafhankelijke sleutels waar de
   weegformule op rekent; alleen het label verandert per taal. */
const KALIB = [
  {id:"bewijs", vraag:"Wat zou de komende maanden voor jou de moeite waard maken?", opties:[
    {l:"Er financieel iets aan overhouden",v:"inkomen"},{l:"Iets nieuws echt onder de knie krijgen",v:"leren"},
    {l:"Mijn huidige werk interessanter maken",v:"werk"},{l:"Werk doen waar anderen iets aan hebben",v:"erkenning"}]},
  {id:"ritme", vraag:"Welk ritme past beter bij jou?", opties:[
    {l:"Rustig aan, een beetje per week over langere tijd",v:"traag"},{l:"In korte, intensieve periodes",v:"sprint"}]},
  {id:"spijt", vraag:"Waar ben je het zuinigst op?", opties:[
    {l:"Mijn geld",v:"geld"},{l:"Mijn tijd",v:"tijd"},
    {l:"Hoe ik overkom bij anderen",v:"gezicht"}]},
  {id:"gezelschap", vraag:"Wanneer kom jij het best tot je recht?", opties:[
    {l:"In mijn eentje, op mijn eigen tempo",v:"alleen"},{l:"Met iemand die me scherp houdt",v:"samen"}]}
];

/* De drijfveren uit de rangordevraag, gekoppeld aan de sleutel die de weging
   gebruikt. Wijzigt de rangorde-items hierboven, wijzig deze dan mee. */
const DRIJF = { inkomen:"Extra inkomen", leren:"Leren", erkenning:"Erkenning", prikkel:"Minder verveling" };

/* ---------- systeemprompts ---------- */
const TOON = `Je bent een kritische, eerlijke gesprekspartner, geen life coach. Geen coach-jargon, geen slijmerij, geen uitroeptekens. Direct, een beetje droog, positief zonder te vleien. Nederlands, korte zinnen, geen gedachtestreepjes.
Nooit suggereren dat iemand de eigen baan moet opzeggen of iets drastisch moet veranderen. Nooit doen alsof deze gegevens gedeeld worden.
Je kent het job demands-resources model, job crafting, de zelfdeterminatietheorie en flow, en gebruikt die kaders zonder ermee te pronken.
Schrijf altijd in de je-vorm. Gebruik nooit hij, zij, hem of haar over de gebruiker, en gok nooit naar geslacht.
De sector die is ingevuld zegt wat de werkgever doet, niet wat deze persoon doet. Iemand die HR-werk doet bij een IT-bedrijf is geen IT'er. Ga altijd uit van wat er staat bij wat deze persoon op een gewone werkdag doet en bij de eigen taken; de functietitel en de sector zijn alleen context. Vul nooit vakinhoud in die uit de sector komt maar nergens in de antwoorden terugkomt.
Belangrijk over tijd: de uren die binnen de werkweek overblijven zijn geen vrije tijd. Het blijft betaalde tijd. Noem het ruimte in de werkweek, nooit vrije tijd, en stel binnen die uren alleen dingen voor die te verantwoorden zijn aan wie het werk betaalt, zoals leren, oefenen, verkennen of iets opbouwen dat de organisatie ook iets oplevert. Alles wat echt voor eigen rekening is, zoals een eigen project of iets met inkomsten, plan je in de eigen uren buiten werktijd.
Werkt deze persoon voor zichzelf, blijkend uit de functietitel of de antwoorden, dan is er geen werkgever en geen leidinggevende. Spreek dan over opdrachtgevers en over eigen keuzes, en stel nooit een gesprek met een leidinggevende voor.`;

const PROMPTS = {
  toon: TOON,

  // Onderwerpen voor de sorteeroefening, uit het vak van deze persoon.
  kaarten: `Je maakt onderwerpen voor een sorteeroefening. Geef zes concrete, herkenbare taken die in het werk van deze persoon echt voorkomen. Specifiek, niet generiek. Geen algemene vaardigheden zoals "analyseren", "communiceren" of "samenwerken", die vragen we apart. Twee tot vier woorden per taak, Nederlands, zonder lidwoord, geen dubbele. Meng leuke en vervelende taken door elkaar.

BELANGRIJK, hier gaat het het vaakst mis. De sector zegt wat de wérkgever doet, niet wat deze persoon doet. Iemand die HR-werk doet bij een IT-bedrijf is geen IT'er, en een financieel medewerker in de zorg verpleegt niemand. Ga uit van wat deze persoon zelf over de eigen dag en taken schrijft. Alleen als dat niets zegt, mag je op de functietitel afgaan. Verzin nooit vaktaken uit de sector die niet passen bij wat er beschreven staat.
Antwoord uitsluitend met geldige JSON: {"kaarten":["taak","taak"]}`,
  kaartenContext: (a) => `Wat deze persoon op een gewone werkdag doet: ${a.dagelijks||"niet ingevuld"}
Zou uitbreiden: ${a.leuk||"onbekend"}
Zou weggeven: ${a.minder||"onbekend"}
Wil leren: ${a.ontwikkelen||"onbekend"}
Functietitel: ${a.functie||"onbekend"}
Sector van de werkgever: ${a.sector||"onbekend"}`,

  schets: TOON + `

Vat de situatie van deze persoon samen als korte kaarten. Puur observerend, nul advies, geen scenario's, geen aanmoediging.
Gebruik in minstens twee kaarten een kort woordelijk fragment uit de antwoorden van de gebruiker, tussen dubbele aanhalingstekens. Citeer alleen wat er letterlijk staat; is er geen bruikbaar fragment, laat de aanhalingstekens dan weg.
Antwoord uitsluitend met geldige JSON, zonder markdown:
{"kaarten":[{"label":"twee of drie woorden","tekst":"maximaal 18 woorden"}],"klap":"één zin van maximaal 20 woorden die het patroon benoemt"}
Precies vier kaarten. Elke kaart één observatie, geen bijzinnen.`,

  inzichtKern: TOON + `

Geef de kern van deze intake in één zin. Geen advies, geen scenario's, geen aanmoediging.
Onderaan de intake staan observaties die de gebruiker zelf als kloppend of niet kloppend beoordeelde. Herhaal die observaties niet: ga een laag dieper, en respecteer wat werd afgewezen.
Het veld "citaat" bevat uitsluitend een woordelijk fragment uit de antwoorden; is er geen sterk fragment, laat het dan leeg.
Antwoord uitsluitend met geldige JSON:
{"kop":"de kern in maximaal 9 woorden, in de je-vorm","citaat":"letterlijk citaat uit de antwoorden, maximaal 15 woorden"}`,

  inzichtDiepte: TOON + `

Geef de scherpste tegenstelling uit deze intake, plus wat deze persoon zelf niet opschreef. Geen advies, geen scenario's, geen aanmoediging.
Onderaan de intake staan observaties die de gebruiker zelf als kloppend of niet kloppend beoordeelde. Herhaal die observaties niet: ga een laag dieper, en respecteer wat werd afgewezen.
Het veld "onbenoemd" is het belangrijkste: iets dat deze persoon zelf nergens opschreef, maar dat uit twee verschillende antwoorden samen volgt. Verwijs kort naar beide antwoorden. Geen algemeenheid die op iedereen past.
Antwoord uitsluitend met geldige JSON:
{"spanning":{"links":"maximaal 4 woorden","rechts":"maximaal 4 woorden","tekst":"wat er tussen die twee schuurt, maximaal 16 woorden"},"onbenoemd":"maximaal 26 woorden, in de je-vorm"}`,

  analyse: (dun) => TOON + `

Je werkt als loopbaancoach en vat deze persoon samen voor een eerste gesprek. Kijk naar het patroon achter de antwoorden en wees eerlijk over wat iemand tegenhoudt. Spreek over de persoon, niet over tools of techniek.

Schrijf kort. Elke regel is een losse observatie van maximaal twaalf woorden, zonder bijzinnen en zonder alinea's.
Antwoord uitsluitend met geldige JSON:
{"archetype":"drie tot vijf woorden","punten":[{"label":"twee woorden","tekst":"maximaal 12 woorden, in de je-vorm"}],"bagage":["maximaal 6 woorden","nog een","nog een"]}
Precies vier punten, met deze labels in deze volgorde: Wat je beweegt, Wat je tegenhoudt, ${dun?"Waar je nu staat":"Je patroon"}, Blinde vlek.` + (dun ? `
LET OP: deze persoon heeft nog weinig werkgeschiedenis of geeft zelf aan geen patroon te herkennen. Beweer dan geen patroon over meerdere banen heen. Beschrijf bij "Waar je nu staat" alleen wat er in deze antwoorden feitelijk staat, en zeg desnoods gewoon dat het daarvoor nog te vroeg is.` : ""),

  kandidaten: (P, feedback) => TOON + `

Je bent loopbaancoach. Bedenk zes richtingen voor de komende maanden: twee binnen de huidige baan, twee gericht leren of ontwikkelen, twee eigen initiatieven naast het werk.

Belangrijk voor het niveau:
- Denk in richtingen en thema's, niet in tools of techniek. Geen software, platformen of automatiseringspakketten noemen, tenzij de persoon ze zelf noemde als interesse.
- Een richting beschrijft wat voor werk iemand gaat doen en wat het deze persoon oplevert, bijvoorbeeld "intern begeleider worden voor nieuwe collega's" of "een tweede vakgebied opbouwen naast je huidige".
- ${P.vlak
  ? `Deze persoon heeft de twee sorteringen nauwelijks bewogen, dus er is geen betrouwbaar beeld van wat goed gaat en energie geeft. Leun op de antwoorden in eigen woorden en beweer niets over sterktes uit die sorteringen.`
  : `Sluit aan bij wat deze persoon goed kan en leuk vindt: ${P.sweet.join(", ")||"onbekend"}.`}
- Elke richting moet binnen zes weken een eerste zichtbaar resultaat kunnen opleveren.
${P.over > 0
  ? `- LET OP DE WERKWEEK. Deze persoon werkt ${P.echt} uur op een contract van ${P.contract} uur, dus ${P.over} uur méér dan afgesproken. Er is géén ruimte in de werkweek. Doe niet alsof die uren er zijn en noem nooit een aantal uren ruimte in de werkweek. Minstens vier van de zes richtingen moeten eerst ruimte máken: taken afstoten, werk overdragen, verwachtingen bijstellen, of iets structureel oplossen dat nu tijd vreet. Buiten werktijd is er ongeveer ${P.eigenBasis} uur per week, en houd daar rekening met vermoeidheid.`
  : P.slack === 0
    ? `- De werkweek van deze persoon zit precies vol: ${P.echt} uur op een contract van ${P.contract} uur. Er komt geen ruimte vrij zonder dat er iets uit gaat. Laat minstens twee richtingen daarom beginnen bij wat eruit kan. Buiten werktijd is er ongeveer ${P.eigenBasis} uur per week.`
    : `- Deze persoon ziet op het scherm dat er ongeveer ${P.slack} uur ruimte in de werkweek zit en ongeveer ${P.eigenBasis} uur eigen tijd per week. Noem geen andere getallen dan deze twee, anders spreekt je tekst het scherm tegen. Reken er intern wel op dat daarvan realistisch ongeveer ${P.ruimte} uur in de werkweek en ${P.eigen} uur eigen tijd echt besteed kan worden, want niet alle ruimte is vrij te besteden. Ruimte binnen de werkweek blijft betaalde tijd: daar past leren, verkennen of iets opbouwen dat het werk ook dient. Alles wat puur voor eigen rekening is, hoort in de eigen uren.`}
${feedback?("\nDe gebruiker gaf deze correctie op een eerdere poging. Neem die zwaar mee en wijk echt af van de vorige richting: "+feedback):""}

Antwoord uitsluitend met geldige JSON:
{"kandidaten":[{"titel":"maximaal 5 woorden, geen jargon","type":"taakverrijking|leren|zijproject","pitch":"één zin, maximaal 16 woorden, in de je-vorm, wat je gaat doen en wat het oplevert","uren":getal uren per week,"risico":1 tot 5,"zichtbaarheid":1 tot 5,"levert":"inkomen|leren|erkenning|prikkel","sterktes":["taak die deze persoon goed kan en leuk vindt","nog een"],"horizonWeken":getal}]}
Precies zes kandidaten, alle drie de types vertegenwoordigd.`,

  uitwerking: () => TOON + `

Je bent loopbaancoach en werkt één geselecteerde richting uit voor een eerste gespreksverslag. Concreet, met een doel dat dichtbij ligt, in gewone taal. Geen tools of techniek noemen tenzij de persoon ze zelf noemde.

Je kunt niets opzoeken. Houd het marktsignaal daarom algemeen en controleerbaar: wat voor rollen, vraag of initiatieven bestaan er doorgaans rond dit pad. Noem geen specifieke organisaties, cursussen, cijfers of tarieven.
De citaten zijn uitsluitend woordelijke fragmenten uit de intake; is er geen tweede sterk citaat, geef er dan één.

Antwoord uitsluitend met geldige JSON, precies één scenario:
{"scenario":{"titel":"neem de titel over","id":"taakverrijking|leren|zijproject","pitch":"scherp de pitch aan","doel":"wat je over zes weken concreet bereikt hebt, één zin in de je-vorm","waarom":"één zin over waarom dit past","citaten":["woordelijk fragment uit de intake"],"eersteStap":"wat je deze week doet, één concrete zin in de je-vorm","weken":"wat er in zes weken gebeurt, één zin","marktsignaal":"één zin over wat er in de praktijk doorgaans bestaat rond dit pad","kosten":"één zin","kans":"de zwakke plek van dit pad, één zin","kill":"meetbaar criterium waarop je stopt","waaromNiet":"één zin"}}`,

  plan: TOON + `

Je bent loopbaancoach en schrijft het plan voor het gekozen pad. Concreet, in gewone taal, op het niveau van een coach die iemand de komende zes weken begeleidt. Geen tools of software noemen tenzij de persoon ze zelf noemde.

Zes weken, elke week met een eigen thema, twee tot vier acties en een resultaat dat aan het eind van die week klaar is. Acties moeten uitvoerbaar zijn in de uren die deze persoon heeft.
Geef bij minstens twee weken ook een veld "omdat": een kort woordelijk citaat uit de intake dat verklaart waarom juist die week erin zit. Citeer alleen wat er letterlijk staat; past er bij een week geen echt citaat, laat "omdat" daar dan weg.

Vul afhankelijk van het type ook het bijpassende blok:
- taakverrijking: script, met een opening voor het gesprek met de leidinggevende en twee tegenwerpingen met antwoord. De opening vertrekt uit wat deze persoon zelf schreef over wat er uitgebreid of geleerd moet worden, in de eigen woorden.
- leren: bronnen, drie plekken om te beginnen. Alleen breed bekende, bestaande namen; twijfel je over een naam, beschrijf dan het soort plek en hoe je die vindt. Verzin niets.
- zijproject: validatie, drie toetsen die het idee moet doorstaan, met per toets wanneer je stopt
Vul altijd berichten: een of twee korte teksten die de gebruiker letterlijk kan versturen, bijvoorbeeld naar de leidinggevende, een oud-collega of iemand uit het netwerk.

Antwoord uitsluitend met geldige JSON:
{"doel":"wat er over zes weken ligt, één zin","waarom":"twee zinnen waarom dit doel bij deze persoon past","weken":[{"nr":1,"thema":"twee tot vier woorden","acties":["maximaal 14 woorden"],"resultaat":"wat er aan het eind van deze week klaar is","omdat":"alleen een woordelijk citaat uit de intake, anders weglaten"}],"meetpunt":"waaraan je ziet dat het werkt","kill":"wanneer je stopt","steun":"wie je erbij betrekt, of hoe je het alleen volhoudt","berichten":[{"titel":"waar dit bericht voor is","tekst":"kant-en-klaar bericht dat je kunt kopieren, maximaal 60 woorden"}],"script":{"opening":"","tegenwerpingen":[{"bezwaar":"","antwoord":""}]},"bronnen":[{"naam":"","wat":"","tijd":""}],"validatie":[{"toets":"","stop":""}]}
Laat de blokken die niet van toepassing zijn helemaal weg. Zes weken, niet meer.`,

  planOpdracht: (s) => `Gekozen pad: ${s.titel} (${s.id}). ${s.pitch||""} ${s.doel||""} Er is ongeveer ${s.uren||4} uur per week beschikbaar. Schrijf het plan.`,
  transcriptKop: "Dit is de volledige intake:",
  uitwerkingOpdracht: (transcript, k) => "Intake:\n"+transcript+"\n\nDe geselecteerde richting om uit te werken:\n"+JSON.stringify(k),
  jsonHerkansing: "\n\nLET OP: je vorige antwoord was onbruikbaar. Antwoord nu UITSLUITEND met één geldig, volledig JSON-object, niets ervoor of erna, geen markdown.",
};

/* Vaste kopjes in het transcript dat naar het model gaat. */
const TRANSCRIPT = {
  overlapKop: "[OVERLAP UIT DE TWEE SORTERINGEN]",
  overlapGoedLeuk: "Goed in en vindt de gebruiker leuk: ",
  overlapGoedNiet: "Goed in maar vindt de gebruiker niet leuk: ",
  geen: "geen",
  vlak: "Let op: deze persoon heeft de schuiven nauwelijks bewogen. Trek daar geen conclusies uit en doe geen uitspraken over wat deze persoon goed kan of leuk vindt op basis van die sorteringen.",
  werkweekKop: "[WERKWEEK]",
  werkweekOver: (u) => `Let op: deze persoon werkt structureel méér dan het contract, ${u.echt} uur op een contract van ${u.contract} uur. Er is dus geen ruimte over in de werkweek maar een tekort van ${u.over} uur. Behandel dit niet als iemand die te weinig te doen heeft.`,
  schetsKop: "\n\n[EERDERE OBSERVATIES, DOOR DE GEBRUIKER ZELF BEOORDEELD]\n",
  schetsJa: "Bevestigd als kloppend:",
  schetsNee: "Afgewezen als niet kloppend (vermijd deze lezing):",
};

/* ---------- interfaceteksten ---------- */
const UI = {
  // De taalwissel in de navigatie. taalPad is waar de knop heen gaat, taalCode is
  // de taal die daar staat (voor hreflang op de link zelf).
  taalKnop: "English",
  taalPad: "/en",
  taalCode: "en",

  // intake, algemeen
  railSectie: (n, totaal, naam) => `Sectie ${n}/${totaal} · ${naam}`,
  sectieVan: (n, totaal, naam) => `Sectie ${n} van ${totaal} · ${naam}`,
  vraagVan: (n, totaal) => `Vraag ${n} van ${totaal}`,
  vraagTeller: (n, totaal) => `Vraag ${n} van ${totaal}`,
  restTijd: (min) => `nog ongeveer ${min} min`,
  volgende: "Volgende",
  naarOverzicht: "Naar het overzicht",
  vorige: "Vorige",
  terug: "Terug",
  terugKort: "Terug",
  terugStaart: "naar start",
  terugStartAria: "Terug naar de startpagina",
  terugRichtingen: "Terug naar de richtingen",
  wis: "Verwijder",
  wisStaart: "mijn data",
  wisAria: "Verwijder mijn data en stop",
  scrollAria: "Scroll naar beneden",
  enterKort: "Enter om verder te gaan",
  enterHint: "Enter gaat verder, Shift + Enter maakt een nieuwe regel.",
  langHint: "Schrijf het op zoals je het zou zeggen. Ook als het rommelig is.",
  dezeRol: "in deze rol",

  // velden
  andersVul: "Vul zelf in",
  anders: "Anders",
  eigenToevoegen: "Eigen onderwerp toevoegen",
  toevoegen: "Toevoegen",
  sleepHint: "Sleep aan de greep, of gebruik de pijltjes.",
  vanTien: "van 10",
  leeg: "leeg",
  vol: "vol",
  pctVanContract: (p) => `${p}% van je contracturen`,
  spiegelKop: "Wat er al staat",
  wachtOnderwerpen: "Stelt onderwerpen op uit jouw vak",

  foutStrip: "Beweeg minstens drie schuiven.",
  foutKeuze: "Kies een optie, of vul zelf iets in.",
  foutLeeg: "Vul dit nog even in.",

  // foutmeldingen die uit een mislukte aanroep komen
  foutTraag: "Het duurde te lang. De verbinding is afgebroken.",
  foutVerbinding: "Geen verbinding met de server.",
  foutStatus: (n) => `De verbinding gaf een fout (${n}).`,
  foutAi: "AI-fout",
  foutLeegAi: "lege uitvoer van de AI",
  foutOnleesbaar: "onleesbare uitvoer",
  foutKort: "Dat lukte niet.",
  foutPdf: "pdf niet gebouwd",
  opnieuwProberen: "Opnieuw proberen",
  bezig: "Bezig…",

  // overzicht
  bijnaKlaar: "Bijna klaar",
  reviewKop: "Kijk je antwoorden nog even na",
  reviewOnder: "Alles is aan te passen. Klik op het potlood bij het antwoord dat je wilt wijzigen.",
  reviewKlaar: "Dit klopt, maak de schets",
  reviewTerug: "Terug naar de vragen",
  overgeslagen: "overgeslagen",
  nietsGeplaatst: "niets geplaatst",
  nietsAangevinkt: "niets aangevinkt",
  aanpassen: "aanpassen",
  beginTot: (a, b) => `${a} bij het begin, ${b} aan het eind`,

  // matrix
  matrixKop: "Je twee sorteringen over elkaar",
  matrixVak: "goed in en leuk",
  matrixBoven: "goed in",
  matrixOnder: "niet goed in",
  matrixLinks: "niet leuk",
  matrixRechts: "wel leuk",
  matrixUitleg: "De plek van elk onderwerp is jouw eigen plaatsing. Alleen waar onderwerpen elkaar overlapten, zijn ze binnen hetzelfde vak iets verschoven.",
  matrixBasisKop: "Hier bouwen de scenario's op",
  matrixBasisTitel: "Benut je sterkte en doe wat je leuk vindt",
  matrixLeeg: "Er valt nu niets in dit vak. Dat is zelf ook een uitkomst.",

  // schets
  schetsEyebrow: "Jouw situatie, zoals die nu is",
  schetsKop: "Waar je nu staat",
  schetsWacht: "Stelt je schets op",
  klopt: "Klopt",
  kloptNiet: "Klopt niet",
  kloptAria: "Klopt deze observatie?",
  schetsUitleg: "Tik per kaart aan of het klopt. Wat je bevestigt of afwijst, scherpt de volgende stap aan.",
  schetsVerder: "Klopt. Laat mijn eerste inzicht zien",
  schetsAanpassen: "Ik wil iets aanpassen",

  // gratis inzicht
  inzichtEyebrow: "Gratis inzicht",
  inzichtKop: "Wat er in jouw antwoorden opvalt",
  inzichtVerder: "Verder naar de laatste vier keuzes",
  inzichtStap1: "Jouw patroon, in één zin",
  inzichtStap2: "Je week, uit je eigen antwoorden",
  inzichtStap3: "Waar het bij jou schuurt",
  inzichtStap4: "Wat je zelf niet opschreef",
  inzichtWachtKern: "Zoekt het patroon in je antwoorden",
  inzichtWachtDiepte: "Legt je antwoorden naast elkaar",
  schuurtMet: "schuurt met",
  urenEchtWerk: (echt, contract) => `<b>${echt}</b> van ${contract} uur echt werk`,
  urenRuimte: (n) => `<b>${n}</b> uur ruimte in je week`,
  urenOver: (n) => `<b>${n}</b> uur méér dan je contract`,
  weekCapRuim: (n) => `Die ${n} uur zijn geen luiheid. Dat is de ruimte waar je plan straks op bouwt.`,
  weekCapVol: "Je week zit precies vol. Er is geen ruimte die vanzelf ontstaat, dus je uitkomst hierna begint bij wat eruit kan.",
  weekCapOver: "Je week is niet te leeg maar te vol. Dat is een ander probleem, en je uitkomst hierna gaat dan ook niet over ruimte opvullen maar over ruimte maken.",
  inzichtNudge: "<b>Dit is nog maar het patroon.</b> De volgende stap zet het om in drie richtingen die hier precies op passen, elk met een pasvorm-score en een plan van zes weken.",

  // kalibratie
  kalibKop: "Nog vier korte voorkeuren",
  kalibOnder: "Geen goede of foute antwoorden. Ze helpen om de richtingen straks bij jou te laten passen.",
  kalibVerder: "Klaar, ga verder",
  keuzeVan: (n, totaal) => `Keuze ${n} van ${totaal}`,
  kalibFout: "Maak alle vier de keuzes. Ze wegen allemaal mee.",

  /* Twee dingen waar de weging naar een gegeven antwoord kijkt en die dus per
     taal moeten meebewegen. patroonDun zijn de posities in de patroonvraag die
     "ik zie geen patroon" betekenen. grenzenWoorden is een vangnet voor sessies
     die met een oudere optietekst zijn opgeslagen; de vaste weg loopt via
     `sleutels` bij de grenzenvraag. */
  patroonDun: [2, 3],
  grenzenWoorden: { inkomen:["inkomen","ontslag"], werkgever:["werkgever"], opvallen:["opvallen"] },

  // profiel
  profielKop: "Wat de intake laat zien",
  bagageKop: "Wat je al hebt liggen",
  urenZinRuim: (slack, eigen, drijf) => `Berekend uit jouw antwoorden: ongeveer ${slack} uur ruimte in je werkweek en ${eigen} uur eigen tijd per week.${drijf}`,
  urenZinVol: (eigen, drijf) => `Berekend uit jouw antwoorden: je werkweek zit precies vol, dus er komt geen ruimte vrij zonder dat er iets uit gaat. Buiten werktijd houd je ongeveer ${eigen} uur per week over.${drijf}`,
  urenZinOver: (over, eigen, drijf) => `Berekend uit jouw antwoorden: je werkt ongeveer ${over} uur per week méér dan je contract, dus er is geen ruimte in je werkweek. Buiten werktijd houd je ongeveer ${eigen} uur per week over.${drijf}`,
  drijfveerZin: (d) => ` Je sterkste drijfveer is ${d}.`,

  // de bouwanimatie
  bouwKop: "Deskshift bouwt jouw richtingen",
  bouwStappen: ["Je profiel opbouwen","Richtingen bedenken","Afwegen tegen jouw grenzen"],
  bouwSubs: [
    ["je antwoorden lezen","patronen zoeken","je eigen woorden wegen","de rem benoemen"],
    ["richtingen aftasten","je sterktes koppelen","varianten verwerpen","zes overhouden"],
    ["tijd en grenzen toetsen","drijfveer wegen","sterktes matchen","rangschikken"]
  ],
  bouwKlaar: "klaar",
  bouwFout: (m) => `Er ging iets mis in deze stap: ${m}`,

  // de vier balken onder een richting
  balkTijd: "Past in je week",
  balkGrenzen: "Past bij je grenzen",
  balkDrijf: "Bedient je drijfveer",
  balkSterkte: "Bouwt op je sterkte",
  balkGeenSortering: "Sluit aan op je sortering",
  balkGeenBeeld: "te weinig geplaatst",

  // richtingen
  richtingenKop: "Drie richtingen, gewogen",
  richtingenOnder: "De cijfers komen uit je eigen antwoorden. Bekijk ze alle drie en ga gerust heen en terug, niets ligt vast.",
  pasvorm: "pasvorm",
  pasvormN: (n) => `pasvorm ${n}`,
  overZesWeken: "Over zes weken",
  nUur: (n) => `${n} uur`,
  nWeken: (n) => `${n} weken`,
  urenPerWeek: "per week",
  looptijd: "tot resultaat",
  looptijdKaal: "looptijd",
  risico: "risico",
  risicoSchaal: ["","zeer laag","laag","gemiddeld","hoog","zeer hoog"],
  bekijkPlan: "Bekijk het plan",
  onderbouwing: "Onderbouwing",
  verbergOnderbouwing: "Verberg onderbouwing",
  waaromDitPast: "Waarom dit past",
  zwakkePlek: "Zwakke plek",
  wanneerStoppen: "Wanneer je stopt",
  afvallersKop: "Ook overwogen, afgevallen",
  vielAfOp: (label, score) => `viel af op ${String(label).toLowerCase()} (${score})`,
  herzienKop: "Raakt dit je niet?",
  herzienUitleg: "Schrijf op wat er niet klopt. De richtingen worden opnieuw bedacht met jouw correctie erin.",
  herzienPlaceholder: "Bijvoorbeeld: te braaf, of juist te risicovol, of het gaat te veel over mijn huidige werk.",
  herzienKnop: "Opnieuw, met deze correctie",

  // beslisframework
  frameKop: "Het beslisframework",
  frameTitel: "Blijven, schuiven of switchen",
  frameOnder: "Waar je antwoorden op dit moment naartoe wijzen. Geen oordeel, een stand van zaken.",
  frameBlijven: "blijven",
  frameSchuiven: "schuiven",
  frameSwitchen: "switchen",
  frameBlijvenUit: "Meer halen uit de baan die je hebt",
  frameSchuivenUit: "Zelfde baan, ander zwaartepunt",
  frameSwitchenUit: "Iets eigen opbouwen naast je werk",
  frameNiets: "vrijwel niets",
  frameAdvies: (w) => `Jouw antwoorden wijzen nu het sterkst naar <b>${w}</b>.`,

  // paywall
  paywallKlaar: "Je uitkomst is klaar",
  paywallKopHoog: (n) => `Je best passende richting scoort ${n} van 100`,
  paywallKopHoogMeer: (n) => `Je sterkste richtingen scoren ${n} van 100`,
  paywallKopLaag: "Drie richtingen, met per richting waar het schuurt",
  paywallGebouwd: (stukjes) => `Gebouwd op ${stukjes}, en op wat je in je eigen woorden schreef. Zes richtingen afgewogen, drie overgebleven.`,
  paywallGewogen: (n) => `Gewogen uit ${n} antwoorden, je twee sorteringen en je vier keuzes. Zes richtingen afgewogen, drie overgebleven.`,
  stukjeOver: (n) => `je ${n} uur overwerk per week`,
  stukjeRuimte: (n) => `je ${n} uur ruimte in de werkweek`,
  stukjeAvonden: (n) => `je ${n} vrije avond${n===1?"":"en"}`,
  stukjeSweet: (s) => `wat je goed kunt én leuk vindt (${s})`,
  paywallInvest: "Je stak hier net een kwartier in jezelf. <b>Dit is waar het op uitkomt, één klik van je vandaan.</b>",
  paywallRegel: (n, st) => `Richting ${n}, met naam, doel en plan${st?`<i class="pw-bouwt">bouwt op: ${st}</i>`:""}`,
  paywallLijst: [
    "De onderbouwing per richting, en waarom de andere afvielen",
    "Je eerste stap, uit te voeren deze week",
    "Een plan van zes weken als pdf in je mail",
    "Blijven, schuiven of switchen, met jouw stand van zaken",
    "Berichten die je meteen kunt versturen",
  ],
  paywallKnop: "Ontgrendel mijn drie richtingen",
  paywallFomo: "Deze drie richtingen zijn nu voor jou berekend. Betaal je, dan blijven ze 30 dagen op dit toestel staan. Doe je dat niet, dan worden ze opnieuw opgebouwd als je later terugkomt.",
  slotcap: "Hieronder je drie richtingen. Ontgrendel om ze helemaal uitgewerkt te lezen.",
  betaalBezig: "Veilig betalen openen…",
  betaalNietGestart: "Betaling kon niet worden gestart.",
  betaalFout: (m) => `${m} Probeer het zo nog eens.`,

  betaaldBanner: "<b>Betaling geslaagd.</b> Je hebt volledige toegang tot je uitkomst.",
  ontgrendelBezig: "Je richtingen worden helemaal uitgeschreven, een paar tellen.",
  ontgrendeld: "<b>Ontgrendeld.</b> Dit is waar je voor betaalde: je drie richtingen, helemaal uitgewerkt en van jou. Bekijk ze rustig en kies wanneer je wilt. Je uitkomst blijft 30 dagen op dit toestel bewaard, dus je kunt het venster gewoon sluiten en later terugkomen.",
  betaaldGeenOpname: `<b>Je betaling is gelukt.</b> We konden je uitkomst op dit toestel niet automatisch terugvinden. Dat gebeurt als je in een andere browser terugkomt dan waarin je de intake deed. Open deze pagina opnieuw in die browser, dan staat je uitkomst er nog en wordt hij alsnog ontgrendeld. Lukt dat niet, mail dan <a href="mailto:plan@deskshift.pro" style="color:var(--limeT);font-weight:600">plan@deskshift.pro</a>, dan lossen we het op.`,
  uitwerkingHerstel: "De onderbouwing bij je richtingen kon niet volledig worden opgehaald. Je toegang blijft gewoon staan.",

  // het plan
  actieEyebrow: "Jouw actiepad",
  planWacht: "Schrijft je plan van zes weken",
  planWachtKlaar: "Je plan van zes weken wordt geopend",
  planAlvast: "Alvast in beeld",
  planZesWeken: "Je zes weken",
  planAlvastUitleg: "Precies dit staat straks in de pdf. Vink gerust alvast af, dat blijft in dit venster.",
  weekKlein: "week",
  klaarAanEind: "Klaar aan het eind",
  inJouwWoorden: "In jouw woorden",
  doelKop: "Je doel over zes weken",
  actiesGedaan: (af, alle) => `${af} van ${alle} gedaan`,
  acties: "acties",
  wekenLooptijd: "6 weken",
  zoWeetJe: "Zo weet je of het werkt",
  wanneerStop: "Wanneer je stopt",
  wieErbij: "Wie je erbij betrekt",
  gesprekKop: "Het gesprek met je leidinggevende",
  waarBegin: "Waar je begint",
  toetsenKop: "Toetsen voordat je doorgaat",
  stoppenAls: "Stoppen als: ",
  berichtenKop: "Klaar om te versturen",
  kopieer: "Kopieer",
  gekopieerd: "Gekopieerd",
  bewaarKop: "Bewaar je plan",
  bewaarTitel: "Bewaar je plan buiten dit tabblad",
  bewaarUitleg: "Week voor week, met de acties, het resultaat per week en je stopcriterium. Sla het op als pdf of stuur het naar je eigen mailadres.",

  // downloaden en mailen
  downloadPdf: "Download als pdf",
  mailNaarMij: "Stuur naar mijn mail",
  downloadBezig: "Plannen verzamelen…",
  downloadFout: "Lukte niet, probeer opnieuw",
  mailVersturen: "Versturen",
  mailBezig: "Versturen…",
  mailVerzamelen: "Plannen verzamelen en versturen…",
  mailOngeldig: "Vul een geldig e-mailadres in.",
  mailGeenPlan: "Open eerst een plan.",
  mailGeenRichtingen: "Er zijn nog geen richtingen.",
  mailMislukt: "Versturen mislukt.",
  mailVerstuurdNaar: (adres) => `Verstuurd naar ${adres}.`,
  mailNogEens: "Nog een keer sturen",
  mailGelukt: (adres) => `Je rapport en plan zijn onderweg naar ${adres}. Kijk in je inbox, en anders even in de spam.`,
  mailGeluktAlles: (adres) => `Je rapport en alle drie de plannen zijn onderweg naar ${adres}. Kijk in je inbox, en anders even in de spam.`,
  mailPopTitelEen: "Stuur dit plan naar je mail",
  mailPopTitelAlles: "Stuur je uitkomst naar je mail",
  mailPopAlles: "Eén mail met je profiel, je drie richtingen en de volledige plannen van zes weken. Over een week volgt één korte herinnering met de acties van week twee. Geen nieuwsbrief, daarna niets meer.",
  mailPopEen: "Je krijgt je rapport en je plan van zes weken netjes opgemaakt in je inbox. Over een week volgt één korte herinnering met de acties van week twee uit je eigen plan. Geen nieuwsbrief, daarna niets meer.",

  // Het voorvoegsel dat een model soms voor een citaat zet, om er weer af te
  // halen voordat het citaat op het scherm komt.
  citaatVoor: /^je zei:?\s*/i,
};

/* ---------- spiegels bij de sectie-overgangen ---------- */
const SPIEGEL = {
  verledenGeen: "Je gaf net aan dat geen enkele avond echt van jou is. Dat telt straks net zo zwaar mee als je werkuren.",
  verleden: (a) => `Je gaf net aan dat ${a} ${+a===1?"avond":"avonden"} per week echt van jou ${+a===1?"is":"zijn"}. Onthoud dat getal, verderop bepaalt het wat er naast je werk past.`,
  talentOver: (u) => `Even terug: je contract zegt ${u.contract} uur en je schatte ${u.echt} uur echt werk. Dat is ${u.over} uur méér, niet minder. Je week is niet te leeg maar te vol, en dat verandert waar je uitkomst op gaat bouwen.`,
  talentRuim: (u) => `Even terug: je contract zegt ${u.contract} uur, je schatte ${u.echt} uur echt werk. Dat verschil van ${u.slack} uur is het materiaal waar je uitkomst op gaat bouwen.`,
  talentVol: "Je schatte net dat je week precies vol zit met echt werk. Dan wordt des te belangrijker waar je energie zit, en daar gaat deze sectie over.",
  dromenVlak: "Je hebt de schuiven dicht bij het midden gelaten. Daar tekent zich nog geen voorkeur in af, dus de vragen hierna wegen straks zwaarder mee.",
  dromenSweet: (s, n) => `Uit je twee sorteringen: ${s} ${n===1?"valt":"vallen"} bij jou in het vak goed én leuk. De vragen hierna bepalen wat je daarmee wilt.`,
  dromenLeeg: "In je twee sorteringen viel niets in het vak goed én leuk. Dat is zelf al een uitkomst; deze sectie zoekt de richting dan ergens anders.",
};

/* ---------- mail ---------- */
const MAIL = {
  onderwerpEen: "Jouw rapport en plan van zes weken",
  onderwerpAlles: "Jouw rapport en drie richtingen",
  onderwerpOpvolger: (w) => `Week ${w} van je plan`,
  bijlageMelding: (naam) => `<b>Deze mail heeft een pdf als bijlage: ${naam}.</b> Daar staat alles in wat je hieronder leest, klaar om te printen of te bewaren.`,
  waarJeStaat: "Waar je nu staat",
  jeProfiel: "Je profiel",
  jePlan: "Je plan",
  gekozenRichting: "Je gekozen richting",
  richtingNr: (n, score) => `Richting ${n}${score?` · pasvorm ${score}`:""}`,
  bagage: "Wat je al hebt liggen",
  week: "Week",
  doelKop: "Waar je over zes weken staat",
  eersteStap: "Je eerste stap deze week",
  zesWeken: "Je zes weken",
  berichtenKop: "Berichten die je meteen kunt versturen",
  // Per rij: het kopje en het veld uit het scenario dat eronder komt.
  contextRijen: [
    ["Waarom dit bij je past", "waarom"],
    ["Wat er al bestaat in de praktijk", "marktsignaal"],
    ["De zwakke plek, waar het spaak kan lopen", "kans"],
    ["Wanneer je zou stoppen", "kill"],
  ],
  voetnoot: "Gemaakt met Deskshift, uit jouw eigen antwoorden. Geen account, geen advertentietrackers; wij bewaren je gegevens niet, dus bewaar deze mail zelf. Dit is geen loopbaan-, juridisch of financieel advies.",
  opvolgerKop: (w) => `Week ${w} van je plan`,
  opvolgerCitaat: "Waarom je hieraan begon, in je eigen woorden",
  opvolgerResultaat: "Klaar aan het eind van deze week",
  opvolgerMeetpunt: "Waaraan je ziet dat het werkt",
  opvolgerSlot: "Dit is de enige geplande opvolger van je eigen rapport. Hierna mailen we je niet meer.",
};

/* ---------- pdf ---------- */
const PDF = {
  uitkomstLabel: "Deskshift, jouw uitkomst",
  planLabel: "Deskshift, jouw plan van zes weken",
  standaardTitel: "Jouw drie richtingen",
  jePlan: "Je plan",
  patroonKop: "Jouw patroon, in één zin",
  eigenWoorden: (c) => `In je eigen woorden: “${c}”`,
  weekKop: "Je week, uit je eigen antwoorden",
  weekOver: (u) => `${u.echt} van ${u.contract} uur echt werk, dus ${u.over} uur méér dan je contract`,
  weekRuim: (u) => `${u.echt} van ${u.contract} uur echt werk, ${u.slack} uur ruimte in je week`,
  schuurtKop: "Waar het bij jou schuurt",
  schuurtMet: "schuurt met",
  onbenoemdKop: "Wat je zelf niet opschreef",
  intakeKop: "Wat de intake laat zien",
  bagageKop: "WAT JE AL HEBT LIGGEN",
  inhoudKop: "Wat er in dit document staat",
  inhoudRij: (score, pagina) => (score ? `pasvorm ${score}   ·   ` : "") + `pagina ${pagina}`,
  richtingKaal: (n) => `Richting ${n}`,
  richtingLabel: (n, score) => "Richting " + n + (score ? "  ·  pasvorm " + score : ""),
  doelKop: "Je doel over zes weken",
  meta: (uren, acties) => (uren||"?") + " uur per week   ·   6 weken looptijd   ·   " + acties + " acties",
  week: "Week",
  inJouwWoorden: (c) => "In jouw woorden: “" + c + "”",
  klaarAanEind: (r) => "Klaar aan het eind: " + r,
  zoWeetJe: "Zo weet je of het werkt",
  wanneerStop: "Wanneer je stopt",
  wieErbij: "Wie je erbij betrekt",
  gesprekKop: "Het gesprek met je leidinggevende",
  waarBegin: "Waar je begint",
  toetsenKop: "Toetsen voordat je doorgaat",
  stoppenAls: "Stoppen als: ",
  berichtenKop: "Klaar om te versturen",
  bestandUitkomst: "deskshift-uitkomst",
  bestandPlan: "deskshift-plan",
};

/* ---------- landingpagina ---------- */
const LANDING = {
  navCta: "Start gratis",
  eyebrow: "Voor professionals die te snel klaar zijn",
  h1: "Je werk past in drie dagen.<br>Niemand vraagt wat je met <em>de rest</em> doet.",
  lead: `<strong class="ds-pop">Deskshift</strong> bouwt uit jóuw antwoorden een persoonlijk plan voor de ruimte die in je werkweek zit, in vijftien minuten.`,
  ctaStart: "Start, het eerste inzicht is gratis",
  ctaHervat: "Ga verder waar je gebleven was",
  ctaHerstel: "Open je uitkomst en plan",
  microPrijs: `Gratis: je patroon in één zin, plus je profiel. ${PRIJS.tekst}: drie richtingen met een plan. Geen account.`,
  microOpslag: "Je antwoorden blijven op je eigen toestel, dus je kunt altijd verder waar je gebleven was.",

  mockTag: "dit krijg je",
  mockLabel: "Voorbeeld · echt resultaat uit een testrun",
  mockQuote: `"Je vak is niet te zwaar. Het is te klein."`,
  mockKaartTitel: "Een tweede vakgebied opbouwen naast je werk",
  mockPasvorm: "jouw pasvorm",
  mockBalken: [["je week","88%"],["je grenzen","74%"],["je drijfveer","82%"],["je sterkte","69%"]],
  mockDeze: "Deze week",
  mockActie: "Schrijf in één A4 welk vakgebied je wilt opbouwen, en wat je nodig hebt om er deze maand mee te beginnen.",

  weekKop: "Een werkweek, eerlijk gemeten",
  weekDagen: ["ma","di","wo","do","vr"],
  weekLijn: "hier zakt het in",
  weekCap: "<b>Rond donderdag is je week vaak al af.</b> Die inzakking is geen luiheid. Het is ruimte die niemand voor je invult, en precies waar dit over gaat.",

  hoeKop: "Hoe het werkt",
  hoeTitel: "Van vage onvrede naar een concreet plan",
  hoeOnder: "Alles wordt opgebouwd uit jóuw antwoorden. Hoe eerlijker je bent, hoe scherper en waardevoller je plan.",
  stappen: [
    ["Intake voor jouw situatie","Een korte intake die helemaal over jou gaat. Geen eindeloze vragenlijst. Vijftien minuten op je telefoon."],
    ["Je schets, en jij corrigeert","Vier observaties uit je eigen antwoorden. Per stuk geef je aan of het klopt. Wat je afwijst, verdwijnt uit de rest."],
    ["Je gratis inzicht","Het scherpste patroon, met letterlijke citaten uit je eigen antwoorden en wat je zelf niet opschreef. Voordat je iets betaalt."],
    ["Jouw drie richtingen","Vier laatste voorkeuren, dan drie richtingen met een pasvorm-score en een plan van zes weken. Geen open einde."],
  ],

  citaatKop: "De kern",
  citaatTekst: "Je capaciteit groeit door. Je opdracht niet. Dat gat is geen luiheid, het is een tekort aan uitdaging.",
  citaatNote: "Deskshift maakt dat gat zichtbaar en zet er een plan op, uit jouw eigen antwoorden.",

  credKop: "Waarop dit rust",
  credTitel: "Onderbouwd, niet uit de onderbuik",
  credOnder: `Gegrond in de arbeids- en organisatiepsychologie. <strong class="ds-pop">Deskshift</strong> analyseert alleen jóuw antwoorden; de intake en het plan zijn daar strak omheen gebouwd.`,
  cred: [
    ["Job demands-resources","Bakker en Demerouti. Te weinig taakeisen geeft net zulke klachten als te veel."],
    ["Job crafting","Wrzesniewski en Dutton. Je functie zelf verbouwen in plaats van er alleen in werken."],
    ["Zelfdeterminatietheorie","Deci en Ryan. Autonomie, competentie en verbondenheid als brandstof."],
    ["Flow","Csikszentmihalyi. Verveling ontstaat zodra je kunde je uitdaging voorbijstreeft."],
    ["Vrije tijd met betekenis","Vrije tijd die alleen herstel is, voegt weinig toe."],
    ["Optimaal tijdsbudget","Te weinig vrije tijd geeft stress, te veel geeft leegte. Dat laatste is precies de klacht die deze test in kaart brengt."],
  ],

  makerKop: "Waarom dit bestaat",
  maker: [
    "Vier banen, hetzelfde patroon. Na een paar maanden liep het werk terug en werd mijn agenda leger. Niet omdat ik het niet aankon, maar omdat ik het te snel afkreeg.",
    "Ik zei er nooit iets over. “Ik heb te weinig werk” zeg je niet hardop op je werk. Dus vulde ik de uren zelf, in stilte, zonder dat iemand het zag.",
    "Dit is het gesprek dat ik toen had willen voeren. Geen duur coachtraject, geen abonnement, geen diagnose. Eén eerlijke intake, en een plan dat je zelf uitvoert.",
  ],

  trustKop: "Jouw data is jouw data",
  trustTitel: "Gemaakt om niets over je te onthouden",
  trust: [
    ["Geen account.","Geen mailadres, geen registratie, geen advertentietrackers. Je begint meteen."],
    ["Op je eigen toestel.","Je antwoorden worden alleen op dit toestel bewaard, zodat je later verder kunt. Heb je betaald, dan blijft je uitkomst er 30 dagen staan, zodat je hem terugvindt als je het venster sluit. Wij houden geen profiel over je bij."],
    ["Alleen voor je analyse.","Om je inzicht te maken gaan je antwoorden naar een AI-dienst (Anthropic) en worden daar alleen daarvoor gebruikt. Niet naar je werkgever of collega's."],
    ["Eén knop wist alles.","Ook halverwege, definitief."],
  ],

  prijsKop: "Wat het kost, en wat er letterlijk op je scherm staat",
  prijsOnder1: PRIJS.btwLang,
  prijsOnder2: "Ter vergelijking: een uur loopbaancoaching kost al snel meer dan dit hele plan. Dit is niet het eindpunt, het is de eerste stap naar je volgende richting.",
  prijsMicro: "Je ziet je patroon voordat je iets betaalt.",
  bonKop: "Na betaling zie je direct",
  bon: [
    ["Drie richtingen, elk met een pasvorm-score uit jouw antwoorden",""],
    ["Waarom de andere richtingen afvielen, per richting",""],
    ["Eén actie die je deze week al kunt doen",""],
    ["Een plan van zes weken, week voor week","pdf"],
    ["Kant-en-klare berichten om je richting voor te stellen, aan je leidinggevende of aan je netwerk",""],
    ["Een week later één herinnering met de acties van week twee","mail"],
  ],

  faqKop: "Voor de zekerheid",
  faq: [
    ["Is dit een cursus of coaching-traject?","Nee. Eén sessie, één plan. Geen abonnement, geen vervolgtraject dat je moet afzeggen."],
    ["Zit hier AI achter?","Ja. Deskshift gebruikt AI om alleen jóuw antwoorden te analyseren. Geen mens leest ze. Het is geen kale chatbot: de intake en het plan zijn er strak omheen gebouwd, zodat de uitkomst over jou gaat en niet over iemand in het algemeen."],
    ["Is dit niet gewoon een quiz of gimmick?","Nee. Je vult een echte intake in en krijgt direct een inzicht uit je eigen antwoorden, in je eigen woorden terug. Je corrigeert onderweg zelf wat er niet klopt, en elk citaat wordt teruggelegd naast wat je echt hebt opgeschreven, zodat er niets in staat dat je nooit gezegd hebt. Daarna een plan dat je zelf uitvoert."],
    ["Wat als het antwoord is dat ik moet blijven waar ik zit?","Dan zeggen we dat, en laten we zien hóe. Soms zit de scherpste richting in je huidige baan: een taak eruit, een tweede vakgebied erbij. Ook dat wordt een concreet plan van zes weken, geen \"ga netwerken en praat met je manager\"."],
    [`Wat krijg ik precies voor ${PRIJS.tekst}?`,"Drie richtingen met een pasvorm-score, waarom de andere afvielen, je eerste stap voor deze week, en een plan van zes weken als pdf. Mail je het naar jezelf, dan volgt een week later één herinnering met de acties van week twee. De intake en het inzicht daarvoor zijn gratis."],
    ["Ziet iemand anders mijn antwoorden?","Geen mens, nee. Je antwoorden staan op je eigen toestel en gaan alleen naar een AI-dienst die ze verwerkt om jouw inzicht en plan te maken. Verder nergens heen, ook niet naar je werkgever."],
    ["Moet ik meteen betalen?","Nee. De intake en het eerste inzicht zijn gratis. Je betaalt pas als je verder wilt naar de drie richtingen."],
  ],

  slotTitel: "Vijftien minuten. Eén eerlijk inzicht. Gratis.",
  slotOnder: `Wil je daarna je drie richtingen en je plan, dan is dat eenmalig ${PRIJS.tekst}.`,

  footMuted: "Voor mensen van wie het werk te klein is geworden. Geen cookies, geen advertentietrackers.",
  footLinks: [["Vragen","/vragen/"],["Privacyverklaring","/privacy"],["Algemene voorwaarden","/terms"]],
  footDisclaimer: "Deskshift geeft geen loopbaan-, medisch, juridisch of financieel advies. Je blijft zelf verantwoordelijk voor je keuzes.",

  mobielCta: "±15 min · gratis inzicht",
  mobielKnop: "Start gratis inzicht",
  mobielAria: "Snel starten",

  privacyPopKop: "Voordat je begint",
  privacyPopTitel: "Je antwoorden blijven van jou",
  privacyPopLijst: [
    ["Geen account, geen mailadres."," Je begint meteen."],
    ["Alleen op dit toestel."," Je antwoorden blijven hier, zodat je later verder kunt. Wij houden geen profiel over je bij."],
    ["Niemand leest mee."," Om je inzicht te maken gaan ze alleen anoniem naar de Deskshift AI engine, en verder nergens heen, niet naar je werkgever of collega's."],
    ["Eén knop wist alles,"," ook halverwege."],
  ],
  privacyPopSlot: `Wees dus gerust eerlijk. Hoe eerlijker je antwoordt, hoe scherper je uitkomst. Door te beginnen ga je akkoord met onze <a href="/privacy" target="_blank" rel="noopener" style="color:#4A6B1E">privacyverklaring</a>.`,
  privacyPopKnop: "Ik snap het, we beginnen",

  sortPopKop: "Twee keer sorteren",
  sortPopTitel: "Let op: twee verschillende vragen",
  sortPopLijst: [
    ["Eerst:"," waar ben je <b>goed</b> in?"],
    ["Daarna:"," wat vind je <b>leuk</b> om te doen?"],
  ],
  sortPopSlot: "<b>Goed</b> kunnen en <b>leuk</b> vinden zijn niet hetzelfde. We leggen je twee antwoorden over elkaar en zoeken waar ze allebei samenvallen. Daar zit je richting.",
  sortPopKnop: "Duidelijk",

  exitPopKop: "Stoppen en wissen",
  exitPopTitel: "Al je antwoorden verwijderen?",
  exitPopSlot: "Dit wist alles wat je op dit toestel hebt ingevuld en sluit de intake. Dit kan niet ongedaan worden gemaakt.",
  exitPopJa: "Ja, verwijder alles",
  exitPopNee: "Nee, ik ga door",

  mailPopKop: "Bewaar het",
  mailPopTitel: "Stuur dit plan naar je mail",
  mailPopPlaceholder: "jouw@email.nl",
  mailPopKnop: "Versturen",
  mailPopSluit: "Sluiten",
  mailOkKop: "Onderweg naar je inbox",
  mailOkTitel: "Verstuurd",
  mailOkStandaard: "We hebben je rapport verstuurd. Kijk in je inbox, en anders even in de spam.",
  mailOkKnop: "Klaar",

  richtingenTerug: "Richtingen",
  testrij: ["Testmodus: direct naar de uitkomst","Testmodus: vanaf de schets","Testmodus: door de intake lopen"],
  testrijUit: "Testmodus staat aan op dit toestel. Zet uit met ?test=0",
};

/* ---------- testmodus ---------- */
/* Verborgen voor bezoekers, aan te zetten met ?test=1. Staat hier omdat de
   testroutes anders in het Engels een Nederlandse intake laten zien. */
const DEMO = {
  ant:{
    leeftijd:33, opleiding:"Hbo", thuis:"Samenwonend zonder kinderen", avonden:4,
    jaren:8, werkgevers:4, patroon:"Ja, in vrijwel elke rol",
    functie:"Strategic Partner Manager", sector:"HR-dienstverlening en flexbranche",
    dagelijks:"Gesprekken met partners over samenwerkingen, businesscases doorrekenen, en intern afstemmen met sales en legal om afspraken rond te krijgen.",
    contract:40, kantoor:2, rolduur:"2 jaar",
    leuk:"Nieuwe partnerships opzetten. Het stuk waar nog niets ligt en ik het model zelf mag bedenken.",
    minder:"Terugkerend accountbeheer en het bijhouden van rapportages die niemand leest.",
    ontwikkelen:"De technische kant. Zelf iets kunnen bouwen in plaats van het altijd te laten bouwen.",
    autonomie:8,
    echturen:26, moment:"Donderdag",
    invulling:"Ik werk eigen ideeën uit, doe marktonderzoek en bouw prototypes. Meestal in blokken van een uur tussen overleggen door.",
    energie:{a:8,b:5},
    benaderd:"Partnermodellen doorrekenen, presentaties scherp krijgen, sparren over hoe je een deal insteekt.",
    nieuwsgierig:"AI-automatisering, workflows bouwen met n8n, en hoe kleine SaaS-producten distributie vinden.",
    aldoet:"Ja. Ik bouw en valideer eigen productideeën, meestal in de uren dat de agenda leeg is.",
    droom:"Een eigen product bouwen, klanten vinden en het uiteindelijk verkopen.",
    droom2:"Iets van nul naar één zetten. Niet één vak, maar het bouwen zelf.",
    grenzen:["Iets dat raakt aan mijn werkgever of opdrachtgever"],
    rangorde:["Extra inkomen","Leren","Minder verveling","Erkenning"]
  },
  pos:{
    skill:{ "Analyseren":0.82,"Presenteren":0.86,"Overleggen":0.74,"Plannen":0.70,"Onderhandelen":0.78,
            "Uitzoeken":0.88,"Bouwen of maken":0.58,"Anderen helpen":0.66,"Nieuwe mensen spreken":0.72,
            "Beslissen":0.68,"Details controleren":0.24,"Documenteren":0.22,"Schrijven":0.62,"Improviseren":0.76 },
    energie:{ "Analyseren":0.72,"Presenteren":0.66,"Overleggen":0.34,"Plannen":0.46,"Onderhandelen":0.74,
              "Uitzoeken":0.90,"Bouwen of maken":0.94,"Anderen helpen":0.58,"Nieuwe mensen spreken":0.80,
              "Beslissen":0.62,"Details controleren":0.14,"Documenteren":0.10,"Schrijven":0.52,"Improviseren":0.84 }
  },
  // De vier kalibratie-keuzes, zodat de testmodus tot en met de uitkomst kan doorlopen.
  kalib:{ bewijs:"leren", ritme:"sprint", spijt:"tijd", gezelschap:"alleen" }
};

/* ---------- meta, alleen voor de paginabron ---------- */
const META = {
  titel: "Deskshift",
  omschrijving: "Deskshift is een online tool die kenniswerkers die hun werk sneller af hebben dan hun contracturen helpt om die ruimte om te zetten in een concreet plan, op basis van hun eigen antwoorden. Gratis inzicht, daarna eenmalig 25 euro voor drie richtingen en een plan van zes weken.",
  ogOmschrijving: "Zeven korte secties, direct een gratis inzicht, daarna drie gewogen paden met een plan van zes weken.",
  ogAlt: "Deskshift. Je werk past in drie dagen. Niemand vraagt wat je met de rest doet.",
  organisatie: "Deskshift bouwt uit je eigen antwoorden een persoonlijk plan voor de ruimte die in je werkweek zit, voor mensen van wie het werk te klein is geworden.",
  besturing: "Elke browser",
  aanbod: "Eenmalig, geen abonnement. Drie richtingen met een pasvorm-score en een plan van zes weken als pdf.",
};

return { code:"nl", htmlLang:"nl", pad:"", prijs:PRIJS, kaarten:KAARTEN, algemeen:ALGEMEEN,
         rolduur:ROLDUUR, secties:SECTIES, kalib:KALIB, drijf:DRIJF,
         prompts:PROMPTS, transcript:TRANSCRIPT, ui:UI, spiegel:SPIEGEL,
         mail:MAIL, pdf:PDF, landing:LANDING, demo:DEMO, meta:META };
})();
