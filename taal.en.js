/* taal.en.js
   Every visible string and every system prompt for the English Deskshift.

   This is not a translation of taal.nl.js. The Dutch file was read for intent,
   section by section, and then written again for English-speaking knowledge
   workers aged roughly 25 to 35: salaried, hybrid, through the week's work before
   the week's hours run out. British spelling throughout (organisation, colour,
   programme, recognise, prioritise, analyse), because one variety of English has
   to be picked and this one reads as neutral in more places than the American
   spelling does. The UK and Ireland are the nearest market, not the only one.

   What stayed identical on purpose:
   - The four frameworks: job demands-resources (Bakker and Demerouti), job
     crafting (Wrzesniewski and Dutton), self-determination theory (Deci and
     Ryan), flow (Csikszentmihalyi). Named authors, same claims, new sentences.
   - The intake: same seven sections, same question ids, same order, same types.
     bouw.js refuses to build if that drifts.
   - The internal codes. The v-values in KALIB, the keys in DRIJF, the `sleutels`
     on the boundaries question, and the tokens taakverrijking / leren /
     zijproject and inkomen / leren / erkenning / prikkel inside the prompts are
     identifiers the scoring code reads, not words a user ever sees. They stay
     Dutch in the English prompts too, so one weighting formula serves both
     languages. Do not "translate" them.

   PRICE: the amount and the currency symbol live in the PRIJS block below and
   nowhere else, marked [PRIJS]. Change those four fields, run `node bouw.js`, and
   every price on the page follows. The same figure also sits in api/checkout.js;
   the comment on the block says why and what else has to move with it. */

window.TALEN = window.TALEN || {};

window.TALEN.en = (function(){

/* ---------- price, in one place ---------- */
/* >>> [PRIJS] EEN PLEK, EEN REGEL PER VELD <<<
   Nergens anders in dit bestand of in index.template.html staat een bedrag of
   een valutateken. Wijzig dit blok, draai `node bouw.js`, en de prijs volgt op
   de knop, in de hero, in de FAQ, op de prijskaart en in de gestructureerde data.

   Het staat op 29 dollar. Hier stond eerst 19 pond, en dat is er bewust af: het
   pond maakt de pagina Brits terwijl de Engelse tekst breder mikt. De dollar is de
   valuta die een Engelstalige bezoeker overal ter wereld zonder nadenken leest.

   29 dollar is ongeveer 25 euro, dus de twee pagina's vragen praktisch hetzelfde.
   Dat is geen toeval en het is de bedoeling dat het zo blijft. De taalknop staat in
   de voet van beide pagina's, dus elke bezoeker kan de andere prijs in twee klikken
   zien. Loopt het bedrag hier flink weg van de 25 euro, dan is dat geen
   prijsstrategie maar een klacht.

   Eén punt van eerlijkheid: "$" is niet alleen de Amerikaanse dollar. Voor iemand
   in Canada of Australië staat er ook "$" op het scherm terwijl Stripe US-dollars
   afrekent. Daarom staat "in US dollars" in de kleine letters bij de prijs
   hieronder, en niet alleen in het valutaveld.

   LET OP, twee dingen moeten hiermee meebewegen:
   1. api/checkout.js heeft dezelfde bedragen staan (TALEN.en.centen en .valuta),
      plus de prijs-id van het Engelse product. Lopen die uit de pas, dan betaalt
      de klant iets anders dan het scherm zegt. En als er een prijs-id is, dan is
      Stripe de waarheid: het bedrag hieronder is dan alleen nog wat er op de
      pagina staat, niet wat er van de kaart gaat.
   2. De btw-regel hieronder. Die noemt bewust geen percentage en geen
      "inclusief". Waar de klant zit bepaalt welke btw geldt, en dat is bij een
      Engelse pagina niet één land. Zet er pas een percentage in als je
      boekhouder heeft bevestigd hoe dat voor deze verkoop geregeld is. */
const PRIJS = {
  bedrag: 29,                 // [PRIJS] alleen cijfers
  symbool: "$",               // [PRIJS] wat op de pagina staat
  valuta: "USD",              // [PRIJS] ISO-code, gaat naar Stripe en schema.org
  tekst: "$29",               // [PRIJS] hoe de prijs in een zin leest
  ariaLabel: "29 US dollars", // [PRIJS] wat een schermlezer voorleest
  // Geen percentage en geen "inclusief" tot de btw-registratie rond is. De valuta
  // staat er wel bij: zie de opmerking over "$" hierboven.
  btw: "One payment in US dollars. No subscription, no account. Straight to your results.",
  btwLang: "One payment in US dollars. No subscription, no account, nothing sold to you afterwards.",
};

/* ---------- sorting topics ---------- */
const KAARTEN = ["Analysing","Presenting","Writing","Facilitating","Planning","Negotiating","Digging into problems","Building things","Helping colleagues","Checking the detail","Meeting new people","Making the call","Documenting","Improvising"];
// Cross-cutting topics alongside the role-specific tasks, so we also catch what
// no job task ever gets a name for.
const ALGEMEEN = ["Creative work","Time with people","Leading others","Learning something new"];

// role tenure: months, then half years, then whole years
const ROLDUUR = (function(){
  const a = [];
  for(let m=1;m<=11;m++) a.push(m===1?"1 month":m+" months");
  for(let j=1;j<=5;j+=0.5) a.push(j===1?"1 year":j+" years");
  for(let j=6;j<=20;j++) a.push(j+" years");
  return a;
})();

/* ---------- the intake ---------- */
const SECTIES = [
  { id:"persoonlijk", naam:"About you", kop:"First, a bit about you",
    intro:"Four quick questions. No name, no email address.",
    theorie:"How much genuinely free time you have depends on where you are in life. We ask so your options stay realistic, not to put you in a box.",
    stappen:[
      {id:"leeftijd",type:"slider",vraag:"How old are you?",min:20,max:65,def:31,unit:"years"},
      {id:"opleiding",type:"choice",vraag:"What is your highest qualification?",opties:["Secondary school or equivalent","Apprenticeship or vocational","Bachelor's degree","Master's degree or higher","Something else"]},
      {id:"thuis",type:"choice",vraag:"What does home look like?",hint:"This decides how many evenings and weekends are genuinely yours.",opties:["Living alone","Living with a partner, no children","Living with children at home","Something else"]},
      {id:"avonden",type:"slider",vraag:"How many evenings a week are genuinely yours?",hint:"Evenings with nothing already booked in: no caring, no commitments, no plans.",min:0,max:7,def:3,unit:"evenings"}
    ]},

  { id:"verleden", naam:"Track record", kop:"How you got here",
    intro:"Three quick questions about your career so far.",
    theorie:"Patterns repeat. If earlier roles ran dry on you after a few months, that says more about the fit between your pace and the job than about the job itself.",
    stappen:[
      // labels catches the zero: "0 years" reads badly for someone six months in.
      {id:"jaren",type:"slider",vraag:"How many years have you been working in total?",min:0,max:45,def:8,unit:"years",labels:{0:"less than a year"}},
      {id:"werkgevers",type:"slider",vraag:"How many employers have you had?",min:1,max:15,def:3,unit:"employers"},
      {id:"patroon",type:"choice",vraag:"Does a job tend to get too easy for you after a while?",opties:["Yes, in nearly every role","Yes, in some roles","No, this is the first time","Not sure"]}
    ]},

  { id:"nu", naam:"Work now", kop:"Your job, as it actually is",
    intro:"Six questions. No verdict yet, just the facts.",
    theorie:"The job demands-resources model separates what a job asks of you from what it gives you. A job that asks too little of you produces problems as real as one that asks too much: boredom, cynicism, a low hum of guilt.",
    stappen:[
      {id:"functie",type:"text",vraag:"What is your job title?",placeholder:"For example: operations manager"},
      {id:"sector",type:"text",vraag:"What sector do you work in?",placeholder:"For example: health insurance"},
      // Without this question the sector gets mistaken for the job. A field
      // manager at an IT company was handed topics about upgrading hardware,
      // when the actual work was HR for engineers out on client sites.
      {id:"dagelijks",type:"longtext",vraag:"What do you actually do on a normal working day?",hint:"Two or three things your time really goes on. This is how we avoid guessing your job wrong."},
      {id:"contract",type:"slider",vraag:"How many hours are in your contract?",hint:"Self-employed? Use the hours you have set yourself.",min:16,max:45,def:40,unit:"hours"},
      {id:"kantoor",type:"slider",vraag:"How many days a week are you in the office?",min:0,max:5,def:2,unit:"days"},
      {id:"rolduur",type:"schaal",vraag:"How long have you been {functie}?",schaal:ROLDUUR,def:14}
    ]},

  { id:"rol", naam:"The role", kop:"What the role does to you",
    intro:"Four questions about the inside of your job.",
    theorie:"Job crafting starts with knowing which parts of your role you would take more of and which you would trade away. Without that split, any change is a guess.",
    stappen:[
      {id:"leuk",type:"longtext",vraag:"Which part of your job would you do more of, if you could?",hint:"The bit you would happily be given more of."},
      {id:"minder",type:"longtext",vraag:"And which part would you hand over tomorrow?"},
      {id:"ontwikkelen",type:"longtext",vraag:"What do you still want to get good at in this field?",hint:"Something just outside what you can do now, but that you want to be able to do."},
      {id:"autonomie",type:"slider",vraag:"How much say do you have over how your own week runs?",min:1,max:10,def:7,unit:"of 10",ends:["it is all fixed","entirely mine"]}
    ]},

  { id:"tijd",naam:"Hours", kop:"Where your hours actually go",
    intro:"Think about the last four weeks. Be honest, nobody is reading over your shoulder.",
    theorie:"The gap between contracted hours and hours of real work is what this product is about. In hybrid work, with no hard start and no hard finish, that gap is almost never visible.",
    stappen:[
      {id:"echturen",type:"slider",vraag:"How many hours a week are you genuinely doing the work?",hint:"A rough estimate of an average week is fine. Not counting meetings you would not have booked yourself. Your contract says {contract} hours.",min:0,max:45,def:26,unit:"hours",pctVan:"contract"},
      {id:"moment",type:"choice",vraag:"When is your week normally done?",opties:["By Tuesday","Wednesday","Thursday","Friday morning","I'm never really done"]},
      {id:"invulling",type:"longtext",vraag:"You are at work but not doing your work. What are you doing?",hint:"There is no wrong answer. Everyone has those hours."}
    ]},

  { id:"talent",naam:"Strengths", kop:"What you are good at, and what you enjoy",
    intro:"Two sorting exercises using topics from your own field. This is the heart of the intake.",
    theorie:"Being good at something and enjoying it are not the same thing. What you are good at but get nothing from becomes the work that gets handed to you. Where the two overlap is where the return is.",
    stappen:[
      {id:"energie",type:"dual",vraag:"How much energy do you have at the start and at the end of a working day?",hint:"Score an average day from 1 to 10.",a:{label:"At the start",def:7},b:{label:"At the end",def:5}},
      {id:"skill",type:"strip",vraag:"What are you good at?",hint:"Topics from your work as {functie}, plus a few general ones. Move each slider left or right, only for the ones you recognise.",links:"not good at this",rechts:"good at this",bron:"skill"},
      {id:"energiekaart",type:"strip",vraag:"And what do you enjoy doing?",hint:"The same topics, now scored on enjoyment. In a moment I'll lay your two answers over each other.",links:"do not enjoy this",rechts:"enjoy this, it gives me energy",bron:"energie"},
      {id:"benaderd",type:"longtext",vraag:"What do colleagues come to you for unprompted, even though it is not your job?",hint:"No idea? Then write: no idea."}
    ]},

  { id:"dromen",naam:"Ambition", kop:"Now without the handbrake",
    intro:"Last section. Anything goes first, then we draw the lines.",
    theorie:"Self-determination theory says motivation comes from autonomy, competence and connection. Ask people what they would do with no risk attached and those three surface almost every time.",
    stappen:[
      {id:"nieuwsgierig",type:"longtext",vraag:"What have you been curious about this past month, purely for yourself?"},
      {id:"aldoet",type:"longtext",vraag:"Are you already filling your spare capacity at work with something outside your official remit?",hint:"No judgement. This is the rule far more often than the exception."},
      {id:"droom",type:"longtext",vraag:"No money needed, no risk, nobody watching. What do you do?",hint:"Go big. Be unrealistic. Write down whatever comes first."},
      {id:"droom2",type:"longtext",vraag:"And in five years: what do you want to be good at?",hint:"Not a job title. A skill, or a subject."},
      // sleutels runs parallel to opties and is language-independent on purpose:
      // the risk weighting reads those codes, never the sentence beside them.
      {id:"grenzen",type:"multi",vraag:"What is off the table?",hint:"Tick as many as apply.",
       opties:["Putting my income at risk","Losing my evenings and weekends","Anything that touches my employer or client","Standing out in front of colleagues"],
       sleutels:["inkomen","tijd","werkgever","opvallen"]},
      // items must match the labels in DRIJF exactly, or the weighting cannot
      // find a direction's driver back in this ranking.
      {id:"rangorde",type:"rank",vraag:"Put these in order, heaviest first",hint:"Number 1 counts most. No ties allowed here.",items:["Learning","Extra income","Being recognised","Less boredom"]}
    ]}
];

/* The four closing choices. The v-values are language-independent keys the
   weighting formula reads; only the label changes per language. */
const KALIB = [
  {id:"bewijs", vraag:"What would make the next few months worth it for you?", opties:[
    {l:"Having something to show for it financially",v:"inkomen"},{l:"Properly getting to grips with something new",v:"leren"},
    {l:"Making the job I already have more interesting",v:"werk"},{l:"Doing work other people actually need",v:"erkenning"}]},
  {id:"ritme", vraag:"Which rhythm suits you better?", opties:[
    {l:"A steady bit each week over a longer stretch",v:"traag"},{l:"Short, intense bursts",v:"sprint"}]},
  {id:"spijt", vraag:"What are you most careful with?", opties:[
    {l:"My money",v:"geld"},{l:"My time",v:"tijd"},
    {l:"How I come across to other people",v:"gezicht"}]},
  {id:"gezelschap", vraag:"When are you at your best?", opties:[
    {l:"On my own, at my own pace",v:"alleen"},{l:"With someone who keeps me honest",v:"samen"}]}
];

/* The drivers from the ranking question, tied to the key the weighting uses.
   Change the rangorde items above and you change these with them. */
const DRIJF = { inkomen:"Extra income", leren:"Learning", erkenning:"Being recognised", prikkel:"Less boredom" };

/* ---------- system prompts ---------- */
const TOON = `You are a sharp, honest sounding board, not a life coach. No coaching jargon, no flattery, no exclamation marks. Direct, a little dry, positive without buttering anyone up. British English, short sentences, no dashes used as punctuation.
Never suggest that someone should quit their job or do anything drastic. Never imply this information is shared with anyone.
You know the job demands-resources model, job crafting, self-determination theory and flow, and you use those frames without showing them off.
Write in the second person, to "you". Never use he, she, him or her about the user, and never guess at gender.
The sector someone gives you says what the employer does, not what this person does. Someone doing HR at a software company is not an engineer. Always work from what this person writes about a normal working day and their own tasks; the job title and the sector are context only. Never fill in subject matter that comes from the sector but appears nowhere in the answers.
Important about time: the hours left over inside the working week are not free time. They are still paid time. Call it capacity in the working week, never free time, and inside those hours only suggest things that could be justified to whoever pays for the work, such as learning, practising, exploring, or building something the organisation also gets something out of. Anything genuinely for this person's own account, such as a personal venture or anything that earns money, belongs in their own hours outside work.
If this person works for themselves, going by the job title or the answers, there is no employer and no manager. Talk about clients and about their own choices, and never propose a conversation with a manager.`;

const PROMPTS = {
  toon: TOON,

  // Topics for the sorting exercise, drawn from this person's own field.
  kaarten: `You are writing topics for a sorting exercise. Give six concrete, recognisable tasks that genuinely occur in this person's work. Specific, not generic. No broad skills such as "analysing", "communicating" or "collaborating", we ask about those separately. Two to four words per task, British English, no articles, no duplicates. Mix enjoyable and tedious tasks together.

IMPORTANT, this is where it goes wrong most often. The sector says what the employer does, not what this person does. Someone doing HR at a software company is not an engineer, and a finance officer in a hospital treats no patients. Work from what this person writes about their own day and their own tasks. Only if that says nothing may you fall back on the job title. Never invent tasks from the sector that do not match what is described.
Reply with valid JSON only: {"kaarten":["task","task"]}`,
  kaartenContext: (a) => `What this person does on a normal working day: ${a.dagelijks||"not given"}
Would do more of: ${a.leuk||"unknown"}
Would hand over: ${a.minder||"unknown"}
Wants to learn: ${a.ontwikkelen||"unknown"}
Job title: ${a.functie||"unknown"}
Employer's sector: ${a.sector||"unknown"}`,

  schets: TOON + `

Sum up this person's situation as short cards. Observation only, zero advice, no options, no encouragement.
In at least two cards use a short verbatim fragment from the user's own answers, inside double quotation marks. Only quote what is literally there; if there is no usable fragment, drop the quotation marks.
Reply with valid JSON only, no markdown:
{"kaarten":[{"label":"two or three words","tekst":"18 words at most"}],"klap":"one sentence of at most 20 words naming the pattern"}
Exactly four cards. One observation per card, no subordinate clauses.`,

  inzichtKern: TOON + `

Give the core of this intake in one sentence. No advice, no options, no encouragement.
At the end of the intake are observations the user has judged as right or wrong themselves. Do not repeat those observations: go one layer deeper, and respect what was rejected.
The "citaat" field holds nothing but a verbatim fragment from the answers; if there is no strong fragment, leave it empty.
Reply with valid JSON only:
{"kop":"the core in at most 9 words, addressed to you","citaat":"literal quote from the answers, at most 15 words"}`,

  inzichtDiepte: TOON + `

Give the sharpest contradiction in this intake, plus the thing this person did not write down themselves. No advice, no options, no encouragement.
At the end of the intake are observations the user has judged as right or wrong themselves. Do not repeat those observations: go one layer deeper, and respect what was rejected.
The "onbenoemd" field matters most: something this person nowhere states, but that follows from two different answers taken together. Refer briefly to both. Nothing so general it would fit anyone.
Reply with valid JSON only:
{"spanning":{"links":"4 words at most","rechts":"4 words at most","tekst":"what grates between those two, 16 words at most"},"onbenoemd":"26 words at most, addressed to you"}`,

  analyse: (dun) => TOON + `

You are a career coach summarising this person ahead of a first conversation. Look for the pattern behind the answers and be honest about what is holding someone back. Talk about the person, not about tools or technology.

Keep it short. Every line is a single observation of at most twelve words, no subordinate clauses and no paragraphs.
Reply with valid JSON only:
{"archetype":"three to five words","punten":[{"label":"two words","tekst":"12 words at most, addressed to you"}],"bagage":["6 words at most","another","another"]}
Exactly four points, with these labels in this order: What drives you, What holds you back, ${dun?"Where you are now":"Your pattern"}, Blind spot.` + (dun ? `
NOTE: this person has little work history yet, or says themselves that they see no pattern. Do not then claim a pattern across several jobs. Under "Where you are now" describe only what these answers actually state, and if need be simply say it is too early to tell.` : ""),

  kandidaten: (P, feedback) => TOON + `

You are a career coach. Come up with six directions for the months ahead: two inside the current job, two about deliberate learning or development, two personal initiatives alongside the work.

Getting the level right matters:
- Think in directions and themes, not in tools or technology. Do not name software, platforms or automation products, unless this person named them as an interest themselves.
- A direction describes what kind of work someone will be doing and what it gets them, for example "become the person who brings new colleagues up to speed" or "build a second specialism alongside your current one".
- ${P.vlak
  ? `This person barely moved the two sorting exercises, so there is no reliable picture of what goes well and what gives energy. Lean on the answers in their own words and claim nothing about strengths from those sorts.`
  : `Build on what this person is good at and enjoys: ${P.sweet.join(", ")||"unknown"}.`}
- Every direction has to be able to produce a first visible result within six weeks.
${P.over > 0
  ? `- MIND THE WORKING WEEK. This person works ${P.echt} hours on a ${P.contract} hour contract, so ${P.over} hours MORE than agreed. There is NO spare capacity in the working week. Do not pretend those hours exist and never quote a number of spare hours in the working week. At least four of the six directions have to make room first: shedding tasks, handing work over, resetting expectations, or fixing something structural that currently eats time. Outside working hours there are roughly ${P.eigenBasis} hours a week, and allow for tiredness there.`
  : P.slack === 0
    ? `- This person's working week is exactly full: ${P.echt} hours on a ${P.contract} hour contract. No capacity frees up unless something comes out. So let at least two directions start with what could go. Outside working hours there are roughly ${P.eigenBasis} hours a week.`
    : `- This person can see on screen that there are roughly ${P.slack} spare hours in the working week and roughly ${P.eigenBasis} hours of their own time per week. Do not quote any numbers other than those two, or your text contradicts their screen. Internally, though, reckon on realistically about ${P.ruimte} hours inside the working week and ${P.eigen} hours of their own time actually being usable, because not all spare capacity is free to spend. Capacity inside the working week is still paid time: learning, exploring or building something that also serves the job all fit there. Anything purely for their own account belongs in their own hours.`}
${feedback?("\nThe user gave this correction on an earlier attempt. Weigh it heavily and genuinely move away from the previous direction: "+feedback):""}

Reply with valid JSON only. Keep the type and levert values exactly as written, they are internal codes:
{"kandidaten":[{"titel":"5 words at most, no jargon","type":"taakverrijking|leren|zijproject","pitch":"one sentence, 16 words at most, addressed to you, what you will do and what it gets you","uren":number of hours per week,"risico":1 to 5,"zichtbaarheid":1 to 5,"levert":"inkomen|leren|erkenning|prikkel","sterktes":["task this person is good at and enjoys","another"],"horizonWeken":number}]}
Exactly six candidates, all three types represented.`,

  uitwerking: () => TOON + `

You are a career coach working up one selected direction for a first written summary. Concrete, with a goal that is close at hand, in plain language. Do not name tools or technology unless this person named them themselves.

You cannot look anything up. Keep the market signal general and checkable: what kinds of roles, demand or initiatives usually exist around this path. Do not name specific organisations, courses, figures or rates.
The quotes are verbatim fragments from the intake and nothing else; if there is no strong second quote, give one.

Reply with valid JSON only, exactly one scenario. Keep the id value exactly as written, it is an internal code:
{"scenario":{"titel":"reuse the title","id":"taakverrijking|leren|zijproject","pitch":"sharpen the pitch","doel":"what you will concretely have achieved in six weeks, one sentence addressed to you","waarom":"one sentence on why this fits","citaten":["verbatim fragment from the intake"],"eersteStap":"what you do this week, one concrete sentence addressed to you","weken":"what happens over six weeks, one sentence","marktsignaal":"one sentence on what usually exists in practice around this path","kosten":"one sentence","kans":"the weak spot of this path, one sentence","kill":"measurable criterion for stopping","waaromNiet":"one sentence"}}`,

  plan: TOON + `

You are a career coach writing the plan for the chosen path. Concrete, in plain language, at the level of a coach seeing someone through the next six weeks. Do not name tools or software unless this person named them themselves.

Six weeks, each with its own theme, two to four actions and a result that is finished by the end of that week. Actions have to be doable in the hours this person actually has.
For at least two weeks also fill an "omdat" field: a short verbatim quote from the intake explaining why that particular week is in there. Only quote what is literally there; if a week has no genuine quote, leave "omdat" off that week.

Depending on the type, also fill the matching block:
- taakverrijking: script, with an opening for the conversation with the manager and two objections with answers. The opening starts from what this person wrote themselves about what should be expanded or learned, in their own words.
- leren: bronnen, three places to start. Only widely known, genuinely existing names; if you are unsure about a name, describe the kind of place and how to find it instead. Invent nothing.
- zijproject: validatie, three tests the idea has to survive, each with the point at which you stop
Always fill berichten: one or two short messages the user can send word for word, for example to a manager, a former colleague or someone in their network.

Reply with valid JSON only:
{"doel":"what exists in six weeks, one sentence","waarom":"two sentences on why this goal fits this person","weken":[{"nr":1,"thema":"two to four words","acties":["14 words at most"],"resultaat":"what is finished by the end of this week","omdat":"a verbatim quote from the intake only, otherwise leave it out"}],"meetpunt":"how you can tell it is working","kill":"when you stop","steun":"who you bring in, or how you keep going alone","berichten":[{"titel":"what this message is for","tekst":"ready-to-send message you can copy, 60 words at most"}],"script":{"opening":"","tegenwerpingen":[{"bezwaar":"","antwoord":""}]},"bronnen":[{"naam":"","wat":"","tijd":""}],"validatie":[{"toets":"","stop":""}]}
Leave out entirely any block that does not apply. Six weeks, no more.`,

  planOpdracht: (s) => `Chosen path: ${s.titel} (${s.id}). ${s.pitch||""} ${s.doel||""} There are roughly ${s.uren||4} hours a week available. Write the plan.`,
  transcriptKop: "This is the full intake:",
  uitwerkingOpdracht: (transcript, k) => "Intake:\n"+transcript+"\n\nThe selected direction to work up:\n"+JSON.stringify(k),
  jsonHerkansing: "\n\nNOTE: your previous answer was unusable. Reply now with ONE valid, complete JSON object and nothing else, nothing before it or after it, no markdown.",
};

/* Fixed headings in the transcript that goes to the model. */
const TRANSCRIPT = {
  overlapKop: "[OVERLAP BETWEEN THE TWO SORTS]",
  overlapGoedLeuk: "Good at and enjoys: ",
  overlapGoedNiet: "Good at but does not enjoy: ",
  geen: "none",
  vlak: "Note: this person barely moved the sliders. Draw no conclusions from that and make no claims about what this person is good at or enjoys on the basis of those sorts.",
  werkweekKop: "[WORKING WEEK]",
  werkweekOver: (u) => `Note: this person structurally works more than their contract, ${u.echt} hours on a ${u.contract} hour contract. So there is no spare capacity in the working week but a shortfall of ${u.over} hours. Do not treat this as someone with too little to do.`,
  schetsKop: "\n\n[EARLIER OBSERVATIONS, JUDGED BY THE USER THEMSELVES]\n",
  schetsJa: "Confirmed as right:",
  schetsNee: "Rejected as wrong (avoid this reading):",
};

/* ---------- interface strings ---------- */
const UI = {
  taalKnop: "Nederlands",
  taalPad: "/",
  taalCode: "nl",

  // intake, general
  railSectie: (n, totaal, naam) => `Section ${n}/${totaal} · ${naam}`,
  sectieVan: (n, totaal, naam) => `Section ${n} of ${totaal} · ${naam}`,
  vraagVan: (n, totaal) => `Question ${n} of ${totaal}`,
  vraagTeller: (n, totaal) => `Question ${n} of ${totaal}`,
  restTijd: (min) => `about ${min} min left`,
  volgende: "Next",
  naarOverzicht: "Review my answers",
  vorige: "Back",
  terug: "Back",
  terugKort: "Back",
  terugStaart: "to the start",
  terugStartAria: "Back to the start page",
  terugRichtingen: "Back to the directions",
  wis: "Delete",
  wisStaart: "my data",
  wisAria: "Delete my data and stop",
  scrollAria: "Scroll down",
  enterKort: "Press Enter to continue",
  enterHint: "Enter continues, Shift + Enter starts a new line.",
  langHint: "Write it the way you would say it. Messy is fine.",
  dezeRol: "in this role",

  // fields
  andersVul: "Type your own",
  anders: "Something else",
  eigenToevoegen: "Add your own topic",
  toevoegen: "Add",
  sleepHint: "Drag by the handle, or use the arrows.",
  vanTien: "of 10",
  leeg: "empty",
  vol: "full",
  pctVanContract: (p) => `${p}% of your contracted hours`,
  spiegelKop: "What you have told us",
  wachtOnderwerpen: "Drawing up topics from your field",

  foutStrip: "Move at least three sliders.",
  foutKeuze: "Pick an option, or type your own.",
  foutLeeg: "This one still needs an answer.",

  // errors coming out of a failed call
  foutTraag: "That took too long. The connection was cut.",
  foutVerbinding: "No connection to the server.",
  foutStatus: (n) => `The connection returned an error (${n}).`,
  foutAi: "AI error",
  foutLeegAi: "empty output from the AI",
  foutOnleesbaar: "unreadable output",
  foutKort: "That did not work.",
  foutPdf: "pdf not built",
  opnieuwProberen: "Try again",
  bezig: "Working…",

  // review
  bijnaKlaar: "Nearly there",
  reviewKop: "Have a look back over your answers",
  reviewOnder: "You can change anything. Click the pencil beside whatever you want to change.",
  reviewKlaar: "That's right, show me the sketch",
  reviewTerug: "Back to the questions",
  overgeslagen: "skipped",
  nietsGeplaatst: "nothing placed",
  nietsAangevinkt: "nothing ticked",
  aanpassen: "edit",
  beginTot: (a, b) => `${a} at the start, ${b} at the end`,

  // matrix
  matrixKop: "Your two sorts, one on top of the other",
  matrixVak: "good at and enjoy",
  matrixBoven: "good at",
  matrixOnder: "not good at",
  matrixLinks: "do not enjoy",
  matrixRechts: "enjoy",
  matrixUitleg: "Every topic sits where you put it. Only where topics overlapped have they been nudged slightly, and only within the same quadrant.",
  matrixBasisKop: "This is what your options are built on",
  matrixBasisTitel: "Use what you are good at and do what you enjoy",
  matrixLeeg: "Nothing lands in this quadrant. That is a finding in itself.",

  // sketch
  schetsEyebrow: "Your situation, as it stands",
  schetsKop: "Where you are now",
  schetsWacht: "Sketching where you are",
  klopt: "That's right",
  kloptNiet: "Not right",
  kloptAria: "Is this observation right?",
  schetsUitleg: "Mark each card as right or not. What you confirm or reject sharpens the next step.",
  schetsVerder: "That's right. Show me my first insight",
  schetsAanpassen: "I want to change something",

  // free insight
  inzichtEyebrow: "Free insight",
  inzichtKop: "What stands out in your answers",
  inzichtVerder: "On to the last four choices",
  inzichtStap1: "Your pattern, in one sentence",
  inzichtStap2: "Your week, from your own answers",
  inzichtStap3: "Where it grates",
  inzichtStap4: "What you did not write down",
  inzichtWachtKern: "Looking for the pattern in your answers",
  inzichtWachtDiepte: "Putting your answers side by side",
  schuurtMet: "grates against",
  urenEchtWerk: (echt, contract) => `<b>${echt}</b> of ${contract} hours of real work`,
  urenRuimte: (n) => `<b>${n}</b> spare hours in your week`,
  urenOver: (n) => `<b>${n}</b> hours over your contract`,
  weekCapRuim: (n) => `Those ${n} hours are not laziness. They are the capacity your plan is going to be built on.`,
  weekCapVol: "Your week is exactly full. No capacity appears on its own, so what comes next starts with what could come out.",
  weekCapOver: "Your week is not too empty but too full. That is a different problem, and what comes next is not about filling capacity but about making it.",
  inzichtNudge: "<b>This is only the pattern so far.</b> The next step turns it into three directions built to fit it, each with a fit score and a six-week plan.",

  // calibration
  kalibKop: "Four short preferences to finish",
  kalibOnder: "No right or wrong answers. They help make the directions fit you.",
  kalibVerder: "Done, carry on",
  keuzeVan: (n, totaal) => `Choice ${n} of ${totaal}`,
  kalibFout: "Make all four choices. Every one of them counts.",

  /* Two places where the weighting looks at a given answer and so has to move
     with the language. patroonDun are the positions in the pattern question that
     mean "I see no pattern". grenzenWoorden is a safety net for sessions saved
     under older wording; the normal route runs through `sleutels`. */
  patroonDun: [2, 3],
  grenzenWoorden: { inkomen:["income"], werkgever:["employer","client"], opvallen:["standing out"] },

  // profile
  profielKop: "What the intake shows",
  bagageKop: "What you already have",
  urenZinRuim: (slack, eigen, drijf) => `Worked out from your answers: roughly ${slack} spare hours in your working week and ${eigen} hours of your own time per week.${drijf}`,
  urenZinVol: (eigen, drijf) => `Worked out from your answers: your working week is exactly full, so no capacity frees up unless something comes out. Outside work you have roughly ${eigen} hours a week left.${drijf}`,
  urenZinOver: (over, eigen, drijf) => `Worked out from your answers: you work roughly ${over} hours a week over your contract, so there is no spare capacity in your working week. Outside work you have roughly ${eigen} hours a week left.${drijf}`,
  drijfveerZin: (d) => ` Your strongest driver is ${String(d).toLowerCase()}.`,

  // the build animation
  bouwKop: "Deskshift is building your directions",
  bouwStappen: ["Building your profile","Working out directions","Weighing them against your limits"],
  bouwSubs: [
    ["reading your answers","looking for patterns","weighing your own words","naming the handbrake"],
    ["testing directions","tying in your strengths","discarding variants","keeping six"],
    ["checking time and limits","weighing your driver","matching strengths","ranking them"]
  ],
  bouwKlaar: "done",
  bouwFout: (m) => `Something went wrong at this step: ${m}`,

  // the four bars under a direction
  balkTijd: "Fits your week",
  balkGrenzen: "Respects your limits",
  balkDrijf: "Serves your driver",
  balkSterkte: "Builds on your strengths",
  balkGeenSortering: "Matches your sorting",
  balkGeenBeeld: "too little placed",

  // directions
  richtingenKop: "Three directions, weighed up",
  richtingenOnder: "The numbers come from your own answers. Look at all three and move back and forth as much as you like, nothing is fixed.",
  pasvorm: "fit",
  pasvormN: (n) => `fit ${n}`,
  overZesWeken: "In six weeks",
  nUur: (n) => `${n} hrs`,
  nWeken: (n) => `${n} weeks`,
  urenPerWeek: "per week",
  looptijd: "to a result",
  looptijdKaal: "in total",
  risico: "risk",
  risicoSchaal: ["","very low","low","moderate","high","very high"],
  bekijkPlan: "See the plan",
  onderbouwing: "The reasoning",
  verbergOnderbouwing: "Hide the reasoning",
  waaromDitPast: "Why this fits",
  zwakkePlek: "Weak spot",
  wanneerStoppen: "When to stop",
  afvallersKop: "Also considered, ruled out",
  vielAfOp: (label, score) => `weakest on ${String(label).toLowerCase()} (${score})`,
  herzienKop: "Not landing?",
  herzienUitleg: "Say what is not right. The directions get worked out again with your correction in them.",
  herzienPlaceholder: "For example: too safe, or too risky, or it leans too heavily on my current job.",
  herzienKnop: "Try again with this correction",

  // decision framework
  frameKop: "The decision framework",
  frameTitel: "Stay, shift or start",
  frameOnder: "Where your answers point at this moment. Not a verdict, a state of play.",
  frameBlijven: "stay",
  frameSchuiven: "shift",
  frameSwitchen: "start",
  frameBlijvenUit: "Get more out of the job you have",
  frameSchuivenUit: "Same job, different centre of gravity",
  frameSwitchenUit: "Build something of your own alongside work",
  frameNiets: "next to nothing",
  frameAdvies: (w) => `Right now your answers point most strongly to <b>${w}</b>.`,

  // paywall
  paywallKlaar: "Your results are ready",
  paywallKopHoog: (n) => `Your best-fitting direction scores ${n} out of 100`,
  paywallKopHoogMeer: (n) => `Your strongest directions score ${n} out of 100`,
  paywallKopLaag: "Three directions, each with the point where it grates",
  paywallGebouwd: (stukjes) => `Built on ${stukjes}, and on what you wrote in your own words. Six directions weighed, three left standing.`,
  paywallGewogen: (n) => `Weighed from ${n} answers, your two sorts and your four choices. Six directions weighed, three left standing.`,
  stukjeOver: (n) => `your ${n} hours of overtime a week`,
  stukjeRuimte: (n) => `your ${n} spare hours in the working week`,
  stukjeAvonden: (n) => `your ${n} free evening${n===1?"":"s"}`,
  stukjeSweet: (s) => `what you are good at and enjoy (${s})`,
  paywallInvest: "You just put a quarter of an hour into yourself. <b>This is what it comes to, one click away.</b>",
  paywallRegel: (n, st) => `Direction ${n}, with a name, a goal and a plan${st?`<i class="pw-bouwt">built on: ${st}</i>`:""}`,
  paywallLijst: [
    "The reasoning behind each direction, and why the others fell away",
    "Your first step, to do this week",
    "A six-week plan as a pdf in your inbox",
    "Stay, shift or start, with your own state of play",
    "Messages you can send straight away",
  ],
  paywallKnop: "Unlock my three directions",
  paywallFomo: "These three directions have just been worked out for you. Pay and they stay on this device for 30 days. Don't, and they get built again from scratch if you come back later.",
  slotcap: "Your three directions are below. Unlock to read them in full.",
  betaalBezig: "Opening secure payment…",
  betaalNietGestart: "Payment could not be started.",
  betaalFout: (m) => `${m} Give it another go in a moment.`,

  betaaldBanner: "<b>Payment went through.</b> You have full access to your results.",
  ontgrendelBezig: "Your directions are being written up in full, just a few seconds.",
  ontgrendeld: "<b>Unlocked.</b> This is what you paid for: your three directions, worked up in full and yours to keep. Take your time and choose whenever you like. Your results stay on this device for 30 days, so you can close the window and come back later.",
  betaaldGeenOpname: `<b>Your payment went through.</b> We could not automatically find your results on this device. That happens when you come back in a different browser from the one you did the intake in. Open this page again in that browser and your results will still be there and will unlock. If that does not work, email <a href="mailto:plan@deskshift.pro" style="color:var(--limeT);font-weight:600">plan@deskshift.pro</a> and we will sort it out.`,
  uitwerkingHerstel: "The reasoning behind your directions could not be fully retrieved. Your access stays exactly as it is.",

  // the plan
  actieEyebrow: "Your plan of action",
  planWacht: "Writing your six-week plan",
  planWachtKlaar: "Opening your six-week plan",
  planAlvast: "A look ahead",
  planZesWeken: "Your six weeks",
  planAlvastUitleg: "This is exactly what goes in the pdf. Tick things off now if you like, it stays in this window.",
  weekKlein: "week",
  klaarAanEind: "Finished by the end",
  inJouwWoorden: "In your words",
  doelKop: "Your goal in six weeks",
  actiesGedaan: (af, alle) => `${af} of ${alle} done`,
  acties: "actions",
  wekenLooptijd: "6 weeks",
  zoWeetJe: "How you'll know it's working",
  wanneerStop: "When to stop",
  wieErbij: "Who you bring in",
  gesprekKop: "The conversation with your manager",
  waarBegin: "Where to start",
  toetsenKop: "Tests before you go further",
  stoppenAls: "Stop if: ",
  berichtenKop: "Ready to send",
  kopieer: "Copy",
  gekopieerd: "Copied",
  bewaarKop: "Keep your plan",
  bewaarTitel: "Keep your plan outside this tab",
  bewaarUitleg: "Week by week, with the actions, the result per week and the point at which you stop. Save it as a pdf or send it to your own email address.",

  // downloading and emailing
  downloadPdf: "Download as pdf",
  mailNaarMij: "Email it to me",
  downloadBezig: "Gathering the plans…",
  downloadFout: "That did not work, try again",
  mailVersturen: "Send",
  mailBezig: "Sending…",
  mailVerzamelen: "Gathering the plans and sending…",
  mailOngeldig: "Enter a valid email address.",
  mailGeenPlan: "Open a plan first.",
  mailGeenRichtingen: "There are no directions yet.",
  mailMislukt: "Sending failed.",
  mailVerstuurdNaar: (adres) => `Sent to ${adres}.`,
  mailNogEens: "Send it again",
  mailGelukt: (adres) => `Your report and plan are on their way to ${adres}. Check your inbox, and your spam folder if it is not there.`,
  mailGeluktAlles: (adres) => `Your report and all three plans are on their way to ${adres}. Check your inbox, and your spam folder if they are not there.`,
  mailPopTitelEen: "Email this plan to yourself",
  mailPopTitelAlles: "Email your results to yourself",
  mailPopAlles: "One email with your profile, your three directions and the full six-week plans. A week later, one short reminder with the week two actions. No newsletter, nothing after that.",
  mailPopEen: "Your report and your six-week plan arrive properly laid out in your inbox. A week later, one short reminder with the week two actions from your own plan. No newsletter, nothing after that.",

  // The prefix a model sometimes puts in front of a quote, stripped before the
  // quote reaches the screen.
  citaatVoor: /^you (?:said|wrote):?\s*/i,
};

/* ---------- mirrors at the section breaks ---------- */
const SPIEGEL = {
  verledenGeen: "You just said that not one evening is genuinely yours. That will count for as much later on as your working hours do.",
  verleden: (a) => `You just said that ${a} evening${+a===1?"":"s"} a week ${+a===1?"is":"are"} genuinely yours. Hold on to that number, it decides later what will fit alongside your job.`,
  talentOver: (u) => `Quick check: your contract says ${u.contract} hours and you estimated ${u.echt} hours of real work. That is ${u.over} hours more, not fewer. Your week is not too empty but too full, and that changes what your results get built on.`,
  talentRuim: (u) => `Quick check: your contract says ${u.contract} hours, you estimated ${u.echt} hours of real work. That gap of ${u.slack} hours is the material your results get built on.`,
  talentVol: "You just estimated that your week is exactly full of real work. That makes where your energy sits all the more important, and that is what this section is about.",
  dromenVlak: "You left the sliders close to the middle. No preference shows up there, so the questions coming up will carry more weight.",
  dromenSweet: (s, n) => `From your two sorts: ${s} land${n===1?"s":""} in the quadrant you are both good at and enjoy. The questions coming up decide what you want to do with that.`,
  dromenLeeg: "Nothing landed in the quadrant you are both good at and enjoy. That is a finding in itself; this section looks for the direction somewhere else.",
};

/* ---------- email ---------- */
const MAIL = {
  onderwerpEen: "Your report and six-week plan",
  onderwerpAlles: "Your report and three directions",
  onderwerpOpvolger: (w) => `Week ${w} of your plan`,
  bijlageMelding: (naam) => `<b>This email has a pdf attached: ${naam}.</b> It holds everything you read below, ready to print or keep.`,
  waarJeStaat: "Where you are now",
  jeProfiel: "Your profile",
  jePlan: "Your plan",
  gekozenRichting: "The direction you chose",
  richtingNr: (n, score) => `Direction ${n}${score?` · fit ${score}`:""}`,
  bagage: "What you already have",
  week: "Week",
  doelKop: "Where you stand in six weeks",
  eersteStap: "Your first step this week",
  zesWeken: "Your six weeks",
  berichtenKop: "Messages you can send straight away",
  contextRijen: [
    ["Why this fits you", "waarom"],
    ["What already exists in practice", "marktsignaal"],
    ["The weak spot, where it could come unstuck", "kans"],
    ["When you would stop", "kill"],
  ],
  voetnoot: "Made with Deskshift, from your own answers. No account, no advertising trackers; we do not keep your data, so keep this email yourself. This is not career, legal or financial advice.",
  opvolgerKop: (w) => `Week ${w} of your plan`,
  opvolgerCitaat: "Why you started this, in your own words",
  opvolgerResultaat: "Finished by the end of this week",
  opvolgerMeetpunt: "How you'll know it's working",
  opvolgerSlot: "This is the only follow-up scheduled to your own report. We will not email you after this.",
};

/* ---------- pdf ---------- */
const PDF = {
  uitkomstLabel: "Deskshift, your results",
  planLabel: "Deskshift, your six-week plan",
  standaardTitel: "Your three directions",
  jePlan: "Your plan",
  patroonKop: "Your pattern, in one sentence",
  eigenWoorden: (c) => `In your own words: “${c}”`,
  weekKop: "Your week, from your own answers",
  weekOver: (u) => `${u.echt} of ${u.contract} hours of real work, so ${u.over} hours over your contract`,
  weekRuim: (u) => `${u.echt} of ${u.contract} hours of real work, ${u.slack} spare hours in your week`,
  schuurtKop: "Where it grates",
  schuurtMet: "grates against",
  onbenoemdKop: "What you did not write down",
  intakeKop: "What the intake shows",
  bagageKop: "WHAT YOU ALREADY HAVE",
  inhoudKop: "What is in this document",
  inhoudRij: (score, pagina) => (score ? `fit ${score}   ·   ` : "") + `page ${pagina}`,
  richtingKaal: (n) => `Direction ${n}`,
  richtingLabel: (n, score) => "Direction " + n + (score ? "  ·  fit " + score : ""),
  doelKop: "Your goal in six weeks",
  meta: (uren, acties) => (uren||"?") + " hrs per week   ·   6 weeks in total   ·   " + acties + " actions",
  week: "Week",
  inJouwWoorden: (c) => "In your words: “" + c + "”",
  klaarAanEind: (r) => "Finished by the end: " + r,
  zoWeetJe: "How you'll know it's working",
  wanneerStop: "When to stop",
  wieErbij: "Who you bring in",
  gesprekKop: "The conversation with your manager",
  waarBegin: "Where to start",
  toetsenKop: "Tests before you go further",
  stoppenAls: "Stop if: ",
  berichtenKop: "Ready to send",
  bestandUitkomst: "deskshift-results",
  bestandPlan: "deskshift-plan",
};

/* ---------- landing page ---------- */
const LANDING = {
  navCta: "Start free",
  eyebrow: "For people who have too little to do and say nothing",
  h1: "Your job fits into three days.<br>Nobody asks what you do with <em>the rest</em>.",
  lead: `<strong class="ds-pop">Deskshift</strong> takes your answers and builds a personal plan for the spare capacity sitting inside your working week, in fifteen minutes.`,
  ctaStart: "Start, the first insight is free",
  ctaHervat: "Pick up where you left off",
  ctaHerstel: "Open your results and plan",
  microPrijs: `Free: your pattern in one sentence, plus your profile. ${PRIJS.tekst}: three directions with a plan. No account.`,
  microOpslag: "Your answers stay on your own device, so you can always carry on where you stopped.",

  mockTag: "what you get",
  mockLabel: "Example · real output from a test run",
  mockQuote: `"Your job is not too much. It is too small."`,
  mockKaartTitel: "Build a second specialism alongside your job",
  mockPasvorm: "your fit",
  mockBalken: [["your week","88%"],["your limits","74%"],["your driver","82%"],["your strengths","69%"]],
  mockDeze: "This week",
  mockActie: "Write one page on the specialism you want to build, and what you need to make a start on it this month.",

  /* The recognition block. Deliberately not a translation of the Dutch "already
     done by Thursday": in the UK and Ireland the tell is a diary that looks busy
     while the actual work is finished, and the language people use for it is
     "capacity", "BAU" and "looking busy". */
  weekKop: "A working week, honestly measured",
  weekDagen: ["Mon","Tue","Wed","Thu","Fri"],
  weekLijn: "this is where it drops off",
  weekCap: "<b>By Thursday the actual work is usually done, and the calendar carries the rest.</b> You clear the inbox for the second time. You sit through a stand-up you could have skipped. You keep the tracker green and nobody asks a thing. That drop is not laziness. It is capacity nobody is filling for you, and it is exactly what this is about.",

  hoeKop: "How it works",
  hoeTitel: "From a vague itch to a plan you can act on",
  hoeOnder: "All of it is built from your answers. The more honest you are, the sharper and the more useful the plan.",
  stappen: [
    ["An intake about your situation","A short intake entirely about you. Not an endless questionnaire. Fifteen minutes on your phone."],
    ["Your sketch, and you correct it","Four observations drawn from your own answers. You mark each one right or wrong. Whatever you reject drops out of everything after it."],
    ["Your free insight","The sharpest pattern, with word-for-word quotes from your own answers and the thing you never wrote down. Before you pay anything."],
    ["Your three directions","Four last preferences, then three directions with a fit score and a six-week plan. No open ending."],
  ],

  citaatKop: "The heart of it",
  citaatTekst: "Your capacity keeps growing. Your remit does not. That gap is not laziness, it is a shortage of challenge.",
  citaatNote: "Deskshift makes that gap visible and puts a plan on it, built from your own answers.",

  credKop: "What this rests on",
  credTitel: "Grounded in research, not in gut feel",
  credOnder: `Rooted in occupational and organisational psychology. <strong class="ds-pop">Deskshift</strong> analyses your answers and nothing else; the intake and the plan are built tightly around them.`,
  cred: [
    ["Job demands-resources","Bakker and Demerouti. A job that asks too little of you produces complaints as real as one that asks too much."],
    ["Job crafting","Wrzesniewski and Dutton. Reshaping the job itself, rather than only working inside it."],
    ["Self-determination theory","Deci and Ryan. Autonomy, competence and connection are what motivation actually runs on."],
    ["Flow","Csikszentmihalyi. Boredom sets in the moment your skill overtakes the challenge in front of it."],
    ["Leisure that means something","Time off that only puts you back on your feet adds little beyond that."],
    ["The right amount of free time","Too little free time creates stress, too much creates emptiness. The second one is the complaint this maps out."],
  ],

  /* The founder paragraph. Same admission, same slightly exposed tone, written
     from scratch: an English rendering of the Dutch sentences read stiff and
     confessional in a way that would put this audience off. */
  makerKop: "Why this exists",
  maker: [
    "Four jobs, the same shape every time. A few months in, the work would thin out and my calendar would go quiet. Not because I couldn't handle it. Because I got through it too quickly.",
    "I never said a word. “I haven't got enough to do” is not a sentence you say out loud at work. So I filled the hours myself, quietly, and nobody noticed.",
    "This is the conversation I wanted to have back then. No expensive coaching programme, no subscription, no diagnosis. One honest intake, and a plan you run yourself.",
  ],

  trustKop: "Your data stays yours",
  trustTitel: "Built to remember nothing about you",
  trust: [
    ["No account.","No email address, no sign-up, no advertising trackers. You start straight away."],
    ["On your own device.","Your answers are kept on this device only, so you can carry on later. If you have paid, your results stay for 30 days, so you can find them again after closing the window. We keep no profile of you."],
    ["Only for your analysis.","To build your insight your answers go to an AI service (Anthropic) and are used for that and nothing else. Not to your employer, not to your colleagues."],
    ["One button wipes everything.","Halfway through as well, and for good."],
  ],

  prijsKop: "What it costs, and what actually lands on your screen",
  prijsOnder1: PRIJS.btwLang,
  prijsOnder2: "For comparison: a single hour with a career coach typically costs more than this whole plan. This is not the finish line, it is the first step towards your next direction.",
  prijsMicro: "You see your pattern before you pay anything.",
  bonKop: "The moment you pay, you get",
  bon: [
    ["Three directions, each with a fit score from your own answers",""],
    ["Why the other directions fell away, one by one",""],
    ["One action you can take this week",""],
    ["A six-week plan, week by week","pdf"],
    ["Ready-written messages to put your direction to your manager or your network",""],
    ["One reminder a week later with the week two actions","email"],
  ],

  faqKop: "Just so you know",
  faq: [
    ["Is this a course, or a coaching programme?","Neither. One session, one plan. No subscription, and nothing you have to remember to cancel."],
    ["Is there AI behind this?","Yes. Deskshift uses AI to analyse your answers and nothing else. No human being reads them. It is not a bare chatbot either: the intake and the plan are built tightly around it, so what comes out is about you rather than about people in general."],
    ["Is this just a quiz?","No. You fill in a real intake and get an insight back from your own answers, in your own words. You correct anything that is off as you go, and every quote is checked against what you actually wrote, so nothing appears that you never said. After that comes a plan you run yourself."],
    ["What if the answer is that I should stay put?","Then we say so, and we show you how. Sometimes the sharpest direction is inside the job you have: one task out, a second specialism in. That becomes a concrete six-week plan too, not \"go and network and have a word with your manager\"."],
    [`What exactly do I get for ${PRIJS.tekst}?`,"Three directions with a fit score, why the others fell away, your first step for this week, and a six-week plan as a pdf. Email it to yourself and one reminder follows a week later with the week two actions. The intake and the insight before that are free."],
    ["Can anyone else see my answers?","No person, no. Your answers sit on your own device and go only to an AI service that processes them to build your insight and your plan. Nowhere else, and not to your employer."],
    ["Do I have to pay right away?","No. The intake and the first insight are free. You only pay if you want to go on to the three directions."],
  ],

  slotTitel: "Fifteen minutes. One honest insight. Free.",
  slotOnder: `If you want your three directions and your plan after that, it is ${PRIJS.tekst}, once.`,

  footMuted: "For people whose job has got too small for them. No cookies, no advertising trackers.",
  // /vragen/ bestaat nog alleen in het Nederlands en wijst daarom naar de
  // Nederlandse pagina; privacy en voorwaarden staan er wel in het Engels.
  footLinks: [["Questions","/en/questions/"],["Privacy notice","/en/privacy"],["Terms","/en/terms"]],
  footDisclaimer: "Deskshift does not give career, medical, legal or financial advice. The choices you make remain your own.",

  mobielCta: "±15 min · free insight",
  mobielKnop: "Start free insight",
  mobielAria: "Quick start",

  privacyPopKop: "Before you start",
  privacyPopTitel: "Your answers stay yours",
  privacyPopLijst: [
    ["No account, no email address."," You start straight away."],
    ["On this device only."," Your answers stay here, so you can carry on later. We keep no profile of you."],
    ["Nobody is reading along."," To build your insight they go anonymously to the Deskshift AI engine and nowhere else, not to your employer and not to your colleagues."],
    ["One button wipes everything,"," halfway through as well."],
  ],
  privacyPopSlot: `So be honest. The more honest you are, the sharper your results. By starting you agree to our <a href="/en/privacy" target="_blank" rel="noopener" style="color:#4A6B1E">privacy notice</a>.`,
  privacyPopKnop: "Understood, let's start",

  sortPopKop: "Two rounds of sorting",
  sortPopTitel: "Careful: two different questions",
  sortPopLijst: [
    ["First:"," what are you <b>good</b> at?"],
    ["Then:"," what do you <b>enjoy</b> doing?"],
  ],
  sortPopSlot: "Being <b>good</b> at something and <b>enjoying</b> it are not the same thing. We lay your two answers on top of each other and look for where they meet. That is where your direction is.",
  sortPopKnop: "Got it",

  exitPopKop: "Stop and wipe",
  exitPopTitel: "Delete all of your answers?",
  exitPopSlot: "This wipes everything you have entered on this device and closes the intake. It cannot be undone.",
  exitPopJa: "Yes, delete everything",
  exitPopNee: "No, I'll carry on",

  mailPopKop: "Keep it",
  mailPopTitel: "Email this plan to yourself",
  mailPopPlaceholder: "you@email.com",
  mailPopKnop: "Send",
  mailPopSluit: "Close",
  mailOkKop: "On its way to your inbox",
  mailOkTitel: "Sent",
  mailOkStandaard: "We have sent your report. Check your inbox, and your spam folder if it is not there.",
  mailOkKnop: "Done",

  richtingenTerug: "Directions",
  testrij: ["Test mode: straight to the results","Test mode: from the sketch","Test mode: walk the intake"],
  testrijUit: "Test mode is on for this device. Turn it off with ?test=0",
};

/* ---------- test mode ---------- */
/* Hidden from visitors, switched on with ?test=1. It lives here so the test
   routes show an English intake rather than a Dutch one. */
const DEMO = {
  ant:{
    leeftijd:33, opleiding:"Bachelor's degree", thuis:"Living with a partner, no children", avonden:4,
    jaren:8, werkgevers:4, patroon:"Yes, in nearly every role",
    functie:"Strategic Partnerships Manager", sector:"Recruitment and contract staffing",
    dagelijks:"Talking to partners about how we work together, building out the business case, and getting sales and legal lined up internally so agreements actually land.",
    contract:40, kantoor:2, rolduur:"2 years",
    leuk:"Setting up new partnerships. The part where nothing exists yet and I get to design the model myself.",
    minder:"Routine account admin and keeping up reports nobody reads.",
    ontwikkelen:"The technical side. Being able to build something myself instead of always having it built for me.",
    autonomie:8,
    echturen:26, moment:"Thursday",
    invulling:"I work up my own ideas, do market research and put prototypes together. Usually in hour-long blocks between meetings.",
    energie:{a:8,b:5},
    benaderd:"Working through partner models, getting a deck sharp, thinking through how to pitch a deal.",
    nieuwsgierig:"AI automation, building workflows, and how small software products find their way to customers.",
    aldoet:"Yes. I build and test my own product ideas, mostly in the hours when the calendar is empty.",
    droom:"Build a product of my own, find customers for it and eventually sell it.",
    droom2:"Taking something from nothing to working. Not one field, the building itself.",
    grenzen:["Anything that touches my employer or client"],
    rangorde:["Extra income","Learning","Less boredom","Being recognised"]
  },
  pos:{
    skill:{ "Analysing":0.82,"Presenting":0.86,"Facilitating":0.74,"Planning":0.70,"Negotiating":0.78,
            "Digging into problems":0.88,"Building things":0.58,"Helping colleagues":0.66,"Meeting new people":0.72,
            "Making the call":0.68,"Checking the detail":0.24,"Documenting":0.22,"Writing":0.62,"Improvising":0.76 },
    energie:{ "Analysing":0.72,"Presenting":0.66,"Facilitating":0.34,"Planning":0.46,"Negotiating":0.74,
              "Digging into problems":0.90,"Building things":0.94,"Helping colleagues":0.58,"Meeting new people":0.80,
              "Making the call":0.62,"Checking the detail":0.14,"Documenting":0.10,"Writing":0.52,"Improvising":0.84 }
  },
  kalib:{ bewijs:"leren", ritme:"sprint", spijt:"tijd", gezelschap:"alleen" }
};

/* ---------- meta, page source only ---------- */
const META = {
  titel: "Deskshift",
  omschrijving: "Deskshift is an online tool for knowledge workers who finish their work in fewer hours than their contract asks for. It turns that spare capacity into a concrete plan, built from their own answers. A free insight first, then a one-off payment for three directions and a six-week plan.",
  ogOmschrijving: "Seven short sections, a free insight straight away, then three weighed paths with a six-week plan.",
  ogAlt: "Deskshift. Your job fits into three days. Nobody asks what you do with the rest.",
  organisatie: "Deskshift takes your own answers and builds a personal plan for the spare capacity inside your working week, for people whose job has got too small for them.",
  besturing: "Any browser",
  aanbod: "One payment, no subscription. Three directions with a fit score and a six-week plan as a pdf.",
};

return { code:"en", htmlLang:"en", pad:"/en", prijs:PRIJS, kaarten:KAARTEN, algemeen:ALGEMEEN,
         rolduur:ROLDUUR, secties:SECTIES, kalib:KALIB, drijf:DRIJF,
         prompts:PROMPTS, transcript:TRANSCRIPT, ui:UI, spiegel:SPIEGEL,
         mail:MAIL, pdf:PDF, landing:LANDING, demo:DEMO, meta:META };
})();
