// Genereert de content voor week 2 tot 4: verticale video's voor TikTok en
// Instagram Reels, plus vierkante posts voor de Instagram-tijdlijn.
// Alles uit één gedeelde structuur, zodat de huisstijl niet uit elkaar loopt.
import fs from 'fs';
import path from 'path';

const WORTEL = '/home/user/deskshift/content';
const UIT = 0.16; // een regel is precies weg wanneer de volgende opkomt

// ---------------------------------------------------------------------------
// De content. Per item: platform, week, nummer, slug en de tekst met timing.
// De kantelwoorden staan als punch, de zachtere nadruk als accent.
// ---------------------------------------------------------------------------
const ITEMS = [
  // ===================== TIKTOK, week 2 =====================
  { platform:'tiktok', week:2, nr:1, slug:'onderbenut', duur:11.5, regels:[
    { t:0.0, tekst:'Je zegt het tegen niemand.' },
    { t:1.0, tekst:'Dat je klaar bent.' },
    { t:1.9, tekst:'Want dan lijk je ondankbaar.' },
    { t:3.2, tekst:'Of lui.' },
    { t:4.2, tekst:'Je bent geen van beide.' },
    { t:5.4, tekst:'Je bent onderbenut.', punch:'onderbenut' },
    { t:6.7, tekst:'Deskshift zet dat op papier.', klein:true },
    { t:8.0, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},

  { platform:'tiktok', week:2, nr:2, slug:'overleg', duur:11, regels:[
    { t:0.0, tekst:'Je agenda zit vol.' },
    { t:0.9, tekst:'Met overleg.' },
    { t:1.7, tekst:'Niet met werk.' },
    { t:2.9, tekst:'Dat is geen drukte.' },
    { t:3.9, tekst:'Dat is opvulling.', punch:'opvulling' },
    { t:5.1, tekst:'Voor uren die je overhoudt.', klein:true },
    { t:6.4, tekst:'Deskshift kijkt wat er echt in past.', klein:true },
    { t:7.8, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},

  { platform:'tiktok', week:2, nr:3, slug:'vijf-jaar', duur:11, regels:[
    { t:0.0, tekst:'Over vijf jaar.' },
    { t:0.9, tekst:'Waar wil je goed in zijn?' },
    { t:2.2, tekst:'Niet welke functie.' },
    { t:3.4, tekst:'Welke vaardigheid.', punch:'vaardigheid' },
    { t:4.7, tekst:'Daar begint een richting.' },
    { t:6.0, tekst:'Deskshift maakt er een plan van.', klein:true },
    { t:7.5, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},

  // ===================== TIKTOK, week 3 =====================
  { platform:'tiktok', week:3, nr:1, slug:'schuiven', duur:11.5, regels:[
    { t:0.0, tekst:'Je hoeft niet op te zeggen.', klein:true },
    { t:1.2, tekst:'Niet meteen.' },
    { t:2.2, tekst:'Soms is het één taak eruit.', klein:true },
    { t:3.6, tekst:'En één vakgebied erbij.', klein:true },
    { t:5.0, tekst:'Dat heet schuiven.', punch:'schuiven' },
    { t:6.3, tekst:'Deskshift rekent uit wat past.', klein:true },
    { t:7.8, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},

  { platform:'tiktok', week:3, nr:2, slug:'collega-vraagt', duur:12, regels:[
    { t:0.0, tekst:'Waar halen collega’s je voor?', klein:true },
    { t:1.4, tekst:'Iets dat niet in je functie staat.', klein:true },
    { t:2.9, tekst:'Daar zit je talent.', punch:'talent' },
    { t:4.2, tekst:'Alleen staat het nergens.' },
    { t:5.4, tekst:'Op geen enkel papier.' },
    { t:6.6, tekst:'Deskshift zet het er wel op.', klein:true },
    { t:8.1, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},

  { platform:'tiktok', week:3, nr:3, slug:'te-weinig', duur:11.5, regels:[
    { t:0.0, tekst:'Te veel werk sloopt je.' },
    { t:1.2, tekst:'Dat weet iedereen.' },
    { t:2.4, tekst:'Te weinig uitdaging ook.', punch:'ook' },
    { t:3.9, tekst:'Daar praat niemand over.' },
    { t:5.2, tekst:'Er bestaat ook bijna niets voor.', klein:true },
    { t:6.7, tekst:'Daarom bestaat Deskshift.', klein:true },
    { t:8.0, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},

  // ===================== TIKTOK, week 4 =====================
  { platform:'tiktok', week:4, nr:1, slug:'leegte', duur:11, regels:[
    { t:0.0, tekst:'Je hebt tijd over.' },
    { t:0.9, tekst:'En toch geen rust.' },
    { t:2.1, tekst:'Want de tijd doet niets.' },
    { t:3.4, tekst:'Ruimte zonder richting is leegte.', klein:true, punch:'leegte' },
    { t:5.2, tekst:'Deskshift geeft die richting.', klein:true },
    { t:6.6, tekst:'In vijftien minuten.' },
    { t:7.8, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},

  { platform:'tiktok', week:4, nr:2, slug:'gesprek', duur:12, regels:[
    { t:0.0, tekst:'Je durft het niet te vragen.', klein:true },
    { t:1.3, tekst:'Ander werk.' },
    { t:2.2, tekst:'Meer uitdaging.' },
    { t:3.2, tekst:'Het klinkt zo snel als klagen.', klein:true, punch:'klagen' },
    { t:5.0, tekst:'Dus zeg je niets.' },
    { t:6.2, tekst:'Deskshift schrijft dat gesprek uit.', klein:true },
    { t:8.0, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},

  { platform:'tiktok', week:4, nr:3, slug:'vijftien-minuten', duur:10.5, regels:[
    { t:0.0, tekst:'Vijftien minuten.' },
    { t:0.9, tekst:'Geen account.' },
    { t:1.7, tekst:'Geen mailadres.' },
    { t:2.7, tekst:'Eén eerlijk inzicht.' },
    { t:3.9, tekst:'Over jouw week.' },
    { t:4.9, tekst:'Gratis.', punch:'Gratis' },
    { t:6.1, tekst:'Daarna kies je zelf.' },
    { t:7.3, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},

  // ============ INSTAGRAM REELS, verticaal, week 2 tot 4 ============
  { platform:'instagram', week:2, nr:1, slug:'reel-dinsdag', duur:11, regels:[
    { t:0.0, tekst:'Je bent op dinsdag klaar.', klein:true },
    { t:1.1, tekst:'Met je hele week.' },
    { t:2.1, tekst:'Niemand vraagt ernaar.' },
    { t:3.3, tekst:'En jij zegt niets.', punch:'niets' },
    { t:4.6, tekst:'Dat is zonde van drie dagen.', klein:true },
    { t:6.1, tekst:'Deskshift maakt er iets van.', klein:true },
    { t:7.6, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},

  { platform:'instagram', week:2, nr:2, slug:'reel-uitgegroeid', duur:11.5, regels:[
    { t:0.0, tekst:'Je bent niet vastgelopen.', klein:true },
    { t:1.2, tekst:'Je bent uitgegroeid.', punch:'uitgegroeid' },
    { t:2.7, tekst:'Dat is een ander probleem.', klein:true },
    { t:4.0, tekst:'Met een ander antwoord.', klein:true },
    { t:5.3, tekst:'Deskshift zoekt dat antwoord.', klein:true },
    { t:6.8, tekst:'Uit jouw eigen woorden.', klein:true },
    { t:8.1, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},

  { platform:'instagram', week:3, nr:1, slug:'reel-schuiven', duur:11, regels:[
    { t:0.0, tekst:'Je hoeft niet weg.' },
    { t:1.0, tekst:'Je moet schuiven.', punch:'schuiven' },
    { t:2.4, tekst:'Eén taak eruit.' },
    { t:3.4, tekst:'Eén vakgebied erbij.' },
    { t:4.6, tekst:'Dat kan binnen je baan.', klein:true },
    { t:6.0, tekst:'Deskshift rekent uit wat past.', klein:true },
    { t:7.5, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},

  { platform:'instagram', week:3, nr:2, slug:'reel-onbenutte-tijd', duur:11.5, regels:[
    { t:0.0, tekst:'Die uren waarin je wacht.', klein:true },
    { t:1.2, tekst:'Dat is geen vrije tijd.', klein:true },
    { t:2.5, tekst:'Het is onbenutte tijd.', punch:'onbenutte' },
    { t:4.0, tekst:'Van jou.' },
    { t:5.0, tekst:'En van je werkgever.' },
    { t:6.2, tekst:'Deskshift maakt er een plan van.', klein:true },
    { t:8.0, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},

  { platform:'instagram', week:4, nr:1, slug:'reel-zonder-risico', duur:12, regels:[
    { t:0.0, tekst:'Geen geld nodig.' },
    { t:0.9, tekst:'Geen risico.' },
    { t:1.7, tekst:'Niemand die meekijkt.' },
    { t:2.9, tekst:'Wat ga je doen?', punch:'doen' },
    { t:4.4, tekst:'Dat antwoord is bruikbaar.', klein:true },
    { t:5.8, tekst:'Deskshift maakt het concreet.', klein:true },
    { t:7.4, tekst:'In een plan van zes weken.', klein:true },
    { t:8.6, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},

  { platform:'instagram', week:4, nr:2, slug:'reel-vijftien-minuten', duur:11, regels:[
    { t:0.0, tekst:'Vijftien minuten.' },
    { t:0.9, tekst:'Geen account.' },
    { t:1.7, tekst:'Geen mailadres.' },
    { t:2.7, tekst:'Eén eerlijk inzicht.' },
    { t:4.0, tekst:'Over jouw werkweek.' },
    { t:5.2, tekst:'Gratis.', punch:'Gratis' },
    { t:6.4, tekst:'Daarna kies je zelf.' },
    { t:7.6, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},

  // ============ INSTAGRAM POSTS, vierkant, week 2 tot 4 ============
  { platform:'instagram', week:2, nr:3, slug:'post-verveling', vierkant:true, hoog:1080, donker:false,
    label:'Wat niemand hardop zegt',
    kop:'Verveling op werk is geen <u>luxeprobleem</u>.',
    onder:'Te weinig uitdaging vreet net zo hard als te veel werk. Er bestaat alleen bijna geen hulp voor.' },

  { platform:'instagram', week:3, nr:3, slug:'post-leegte', vierkant:true, hoog:1080, donker:true,
    label:'Uit de intake',
    kop:'Ruimte zonder richting <u>is leegte</u>.',
    onder:'Tijd over hebben geeft geen rust zolang die tijd niets doet.' },

  { platform:'instagram', week:4, nr:3, slug:'post-te-snel-klaar', vierkant:true, hoog:1080, donker:false,
    label:'Uit de intake',
    kop:'Te snel klaar zegt iets over de <u>functie</u>. Niet over jou.',
    onder:'Vier banen, hetzelfde patroon. Dat is geen karakterfout.' },

  // =========================================================================
  // ENGELS. Voor desk_shift op Instagram en het Engelse TikTok-account.
  //
  // Geen vertaling van de Nederlandse regels. Dezelfde gedachte, opnieuw
  // geschreven voor een Engelstalige kenniswerker van 25 tot 35. Britse
  // spelling, korte zinnen, geen gedachtestreepjes, geen uitroeptekens.
  //
  // Twee dingen bewust anders dan een vertaling:
  //  - "te snel klaar" is er in het Engels uit. "Finish early" leest dubbelzinnig,
  //    dezelfde reden waarom die zin ook van de landingspagina af is.
  //  - Uren die binnen de werkweek overblijven heten hier "unused hours" en nooit
  //    "time off": het blijft betaalde tijd van de werkgever.
  // =========================================================================

  // ===================== TIKTOK EN, week 2 =====================
  { taal:'en', platform:'tiktok', week:2, nr:1, slug:'underused', duur:11.5, regels:[
    { t:0.0, tekst:'You tell no one.' },
    { t:1.0, tekst:'That you are done.' },
    { t:1.9, tekst:'It would sound ungrateful.', klein:true },
    { t:3.2, tekst:'Or lazy.' },
    { t:4.2, tekst:'You are neither.' },
    { t:5.4, tekst:'You are underused.', punch:'underused' },
    { t:6.7, tekst:'Deskshift puts it in writing.', klein:true },
    { t:8.0, slot:true, tekst:'Free insight.\nLink in bio.' } ]},

  { taal:'en', platform:'tiktok', week:2, nr:2, slug:'meetings', duur:11, regels:[
    { t:0.0, tekst:'Your calendar is full.' },
    { t:0.9, tekst:'Of meetings.' },
    { t:1.7, tekst:'Not of work.' },
    { t:2.9, tekst:'That is not busy.' },
    { t:3.9, tekst:'That is filler.', punch:'filler' },
    { t:5.1, tekst:'For hours you have spare.', klein:true },
    { t:6.4, tekst:'Deskshift works out what fits.', klein:true },
    { t:7.8, slot:true, tekst:'Free insight.\nLink in bio.' } ]},

  { taal:'en', platform:'tiktok', week:2, nr:3, slug:'five-years', duur:11, regels:[
    { t:0.0, tekst:'In five years.' },
    { t:0.9, tekst:'What do you want to be good at?', klein:true },
    { t:2.2, tekst:'Not which job title.' },
    { t:3.4, tekst:'Which skill.', punch:'skill' },
    { t:4.7, tekst:'That is where it starts.' },
    { t:6.0, tekst:'Deskshift turns it into a plan.', klein:true },
    { t:7.5, slot:true, tekst:'Free insight.\nLink in bio.' } ]},

  // ===================== TIKTOK EN, week 3 =====================
  { taal:'en', platform:'tiktok', week:3, nr:1, slug:'shifting', duur:11.5, regels:[
    { t:0.0, tekst:'You do not have to quit.', klein:true },
    { t:1.2, tekst:'Not yet.' },
    { t:2.2, tekst:'Sometimes it is one task out.', klein:true },
    { t:3.6, tekst:'And one new field in.', klein:true },
    { t:5.0, tekst:'That is shifting.', punch:'shifting' },
    { t:6.3, tekst:'Deskshift works out what fits.', klein:true },
    { t:7.8, slot:true, tekst:'Free insight.\nLink in bio.' } ]},

  { taal:'en', platform:'tiktok', week:3, nr:2, slug:'colleagues-ask', duur:12, regels:[
    { t:0.0, tekst:'What do colleagues come to you for?', klein:true },
    { t:1.4, tekst:'Something outside your job description.', klein:true },
    { t:2.9, tekst:'That is your talent.', punch:'talent' },
    { t:4.2, tekst:'Only it is written down nowhere.', klein:true },
    { t:5.4, tekst:'On no piece of paper.' },
    { t:6.6, tekst:'Deskshift puts it on paper.', klein:true },
    { t:8.0, slot:true, tekst:'Free insight.\nLink in bio.' } ]},

  { taal:'en', platform:'tiktok', week:3, nr:3, slug:'too-little', duur:11, regels:[
    { t:0.0, tekst:'Too much work wears you down.', klein:true },
    { t:1.4, tekst:'So does too little.' },
    { t:2.6, tekst:'Nobody talks about the second one.', klein:true },
    { t:4.1, tekst:'And there is barely any help.', klein:true },
    { t:5.5, tekst:'So we built some.', punch:'built' },
    { t:6.9, tekst:'Fifteen minutes, your own words.', klein:true },
    { t:8.2, slot:true, tekst:'Free insight.\nLink in bio.' } ]},

  // ===================== TIKTOK EN, week 4 =====================
  { taal:'en', platform:'tiktok', week:4, nr:1, slug:'emptiness', duur:11, regels:[
    { t:0.0, tekst:'Time without direction.' },
    { t:1.1, tekst:'Is not rest.' },
    { t:2.1, tekst:'It is emptiness.', punch:'emptiness' },
    { t:3.4, tekst:'Hours to spare, and no peace.', klein:true },
    { t:4.8, tekst:'Because the hours do nothing.', klein:true },
    { t:6.2, tekst:'Deskshift gives them somewhere to go.', klein:true },
    { t:7.7, slot:true, tekst:'Free insight.\nLink in bio.' } ]},

  { taal:'en', platform:'tiktok', week:4, nr:2, slug:'the-conversation', duur:11, regels:[
    { t:0.0, tekst:'Asking for different work.', klein:true },
    { t:1.3, tekst:'Sounds like complaining.' },
    { t:2.5, tekst:'So you say nothing.', punch:'nothing' },
    { t:3.8, tekst:'For a year.' },
    { t:4.9, tekst:'Deskshift writes that conversation out.', klein:true },
    { t:6.4, tekst:'In your own words.' },
    { t:7.7, slot:true, tekst:'Free insight.\nLink in bio.' } ]},

  { taal:'en', platform:'tiktok', week:4, nr:3, slug:'fifteen-minutes', duur:10.5, regels:[
    { t:0.0, tekst:'Fifteen minutes.' },
    { t:1.0, tekst:'No account.' },
    { t:1.9, tekst:'No payment.' },
    { t:3.0, tekst:'Free.', punch:'Free' },
    { t:4.2, tekst:'One honest read on your week.', klein:true },
    { t:5.6, tekst:'Then you choose.' },
    { t:7.0, slot:true, tekst:'Free insight.\nLink in bio.' } ]},

  // ===================== INSTAGRAM EN, reels =====================
  { taal:'en', platform:'instagram', week:2, nr:1, slug:'reel-tuesday', duur:11, regels:[
    { t:0.0, tekst:'It is Tuesday.' },
    { t:0.9, tekst:'You are done.' },
    { t:1.9, tekst:'Three days left.' },
    { t:3.1, tekst:'Nobody fills them for you.', klein:true },
    { t:4.5, tekst:'And you say nothing.', punch:'nothing' },
    { t:5.9, tekst:'Deskshift asks the question.', klein:true },
    { t:7.3, slot:true, tekst:'Free insight.\nLink in bio.' } ]},

  { taal:'en', platform:'instagram', week:2, nr:2, slug:'reel-outgrown', duur:11, regels:[
    { t:0.0, tekst:'You are not stuck.' },
    { t:1.1, tekst:'You have outgrown it.', punch:'outgrown' },
    { t:2.5, tekst:'That is a different problem.', klein:true },
    { t:3.9, tekst:'With a different answer.' },
    { t:5.2, tekst:'Deskshift looks for it in your own words.', klein:true },
    { t:6.9, slot:true, tekst:'Free insight.\nLink in bio.' } ]},

  { taal:'en', platform:'instagram', week:3, nr:1, slug:'reel-shift', duur:11, regels:[
    { t:0.0, tekst:'You do not have to leave.', klein:true },
    { t:1.2, tekst:'You have to shift.', punch:'shift' },
    { t:2.5, tekst:'One task out.' },
    { t:3.4, tekst:'One field in.' },
    { t:4.4, tekst:'Often inside the job you have.', klein:true },
    { t:5.9, tekst:'Deskshift works out what fits your week.', klein:true },
    { t:7.6, slot:true, tekst:'Free insight.\nLink in bio.' } ]},

  { taal:'en', platform:'instagram', week:3, nr:2, slug:'reel-unused-hours', duur:11.5, regels:[
    { t:0.0, tekst:'The hours you spend waiting.', klein:true },
    { t:1.4, tekst:'Are not time off.', punch:'not' },
    { t:2.7, tekst:'They are unused hours.' },
    { t:4.0, tekst:'Yours, and your employer’s.', klein:true },
    { t:5.4, tekst:'Deskshift turns them into a plan.', klein:true },
    { t:7.0, slot:true, tekst:'Free insight.\nLink in bio.' } ]},

  { taal:'en', platform:'instagram', week:4, nr:1, slug:'reel-no-risk', duur:11, regels:[
    { t:0.0, tekst:'No money needed.' },
    { t:1.0, tekst:'No risk.' },
    { t:1.9, tekst:'What would you do?', punch:'do' },
    { t:3.3, tekst:'That answer is usable.' },
    { t:4.6, tekst:'Deskshift makes it concrete.', klein:true },
    { t:6.0, tekst:'A plan of six weeks.' },
    { t:7.3, slot:true, tekst:'Free insight.\nLink in bio.' } ]},

  { taal:'en', platform:'instagram', week:4, nr:2, slug:'reel-fifteen-minutes', duur:10.5, regels:[
    { t:0.0, tekst:'Fifteen minutes.' },
    { t:1.0, tekst:'No account.' },
    { t:1.9, tekst:'Free.', punch:'Free' },
    { t:3.1, tekst:'One honest read on your working week.', klein:true },
    { t:4.8, tekst:'Then you choose if you go on.', klein:true },
    { t:6.4, slot:true, tekst:'Free insight.\nLink in bio.' } ]},

  // ============ INSTAGRAM EN, vierkante posts ============
  { taal:'en', platform:'instagram', week:2, nr:3, slug:'post-boredom', vierkant:true, hoog:1080, donker:false,
    label:'What nobody says out loud',
    kop:'Being bored at work is not a <u>luxury problem</u>.',
    onder:'Too little challenge wears you down as fast as too much work. There is just almost no help for it.' },

  { taal:'en', platform:'instagram', week:3, nr:3, slug:'post-emptiness', vierkant:true, hoog:1080, donker:true,
    label:'From the intake',
    kop:'Time without direction <u>is emptiness</u>.',
    onder:'Hours to spare give you no peace while those hours do nothing.' },

  { taal:'en', platform:'instagram', week:4, nr:3, slug:'post-the-job', vierkant:true, hoog:1080, donker:false,
    label:'From the intake',
    kop:'Running out of work says something about the <u>job</u>. Not about you.',
    onder:'Four jobs, the same shape every time. That is not a character flaw.' },

  // ===== NL, week 5 tot 13: vier per week, maandag een foto 4:5 =====
  { platform:'instagram', week:5, nr:1, slug:'post-nieuw-werk', vierkant:true, donker:false,
    label:'Uit de intake',
    kop:'Je hebt geen nieuwe baan nodig. Je hebt <u>nieuw werk</u> nodig.',
    onder:'Dat is een kleinere ingreep dan opzeggen, en vaak binnen de functie die je al hebt.' },
  { platform:'instagram', week:6, nr:1, slug:'post-niemand-komt', vierkant:true, donker:true,
    label:'Wat niemand hardop zegt',
    kop:'Niemand komt je week <u>vullen</u>.',
    onder:'Die uren blijven leeg tot jij er iets van maakt. Ze zijn niet vrij, ze zijn onbenut.' },
  { platform:'instagram', week:7, nr:1, slug:'post-zes-weken', vierkant:true, donker:false,
    label:'Hoe het werkt',
    kop:'Het plan is <u>zes weken</u>. Geen vijf jaar.',
    onder:'Een richting die je maandag kunt beginnen, in plaats van een droom voor later.' },
  { platform:'instagram', week:7, nr:2, slug:'vrijdagmiddag', duur:10.4, regels:[
    { t:0.0, tekst:'Het is vrijdag half drie.' },
    { t:1.18, tekst:'Je werk is af.' },
    { t:2.32, tekst:'Je blijft online.', punch:'online' },
    { t:3.42, tekst:'Niet omdat het moet.' },
    { t:4.56, tekst:'Maar omdat weggaan opvalt.', klein:true },
    { t:5.7, tekst:'Deskshift benoemt dat.', klein:true },
    { t:6.8, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:7, nr:3, slug:'langzamer', duur:10.7, regels:[
    { t:0.0, tekst:'Je antwoordt langzamer dan je kunt.', klein:true },
    { t:1.22, tekst:'Zodat het lijkt alsof het tijd kost.', klein:true },
    { t:2.48, tekst:'Dat is geen luiheid.' },
    { t:3.62, tekst:'Dat is verstoppen.', punch:'verstoppen' },
    { t:4.72, tekst:'En het kost je een jaar.', klein:true },
    { t:5.94, tekst:'Deskshift rekent het door.', klein:true },
    { t:7.08, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:7, nr:4, slug:'woensdag-leeg', duur:10.8, regels:[
    { t:0.0, tekst:'Je lijstje is woensdag leeg.', klein:true },
    { t:1.18, tekst:'De week duurt nog twee dagen.', klein:true },
    { t:2.4, tekst:'Die twee dagen zijn niet vrij.', klein:true },
    { t:3.62, tekst:'Het is betaalde tijd.', punch:'betaalde' },
    { t:4.76, tekst:'Van jou en je werkgever.', klein:true },
    { t:5.94, tekst:'Deskshift maakt er een plan van.', klein:true },
    { t:7.16, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:8, nr:1, slug:'post-al-antwoord', vierkant:true, donker:true,
    label:'Uit de intake',
    kop:'Je weet het antwoord al. Het staat alleen <u>nergens</u>.',
    onder:'Vijftien minuten vragen, en dan ligt het er. In je eigen woorden.' },
  { platform:'instagram', week:8, nr:2, slug:'meer-vragen', duur:9.5, regels:[
    { t:0.0, tekst:'Om meer werk vragen.' },
    { t:1.14, tekst:'Dat klinkt als opscheppen.', klein:true },
    { t:2.28, tekst:'Dus vraag je het niet.' },
    { t:3.46, tekst:'En blijft het zoals het is.', klein:true },
    { t:4.68, tekst:'Deskshift zoekt de woorden wel.', klein:true },
    { t:5.86, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:8, nr:3, slug:'bang', duur:10.8, regels:[
    { t:0.0, tekst:'Je bent niet bang dat je het niet aankunt.', klein:true },
    { t:1.35, tekst:'Je bent bang dat ze zien' },
    { t:2.57, tekst:'hoe weinig het is.', punch:'weinig' },
    { t:3.71, tekst:'Dat is geen falen.' },
    { t:4.85, tekst:'Dat is een verkeerd rooster.', klein:true },
    { t:6.03, tekst:'Deskshift zet het op papier.', klein:true },
    { t:7.21, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:8, nr:4, slug:'reflex', duur:9.4, regels:[
    { t:0.0, tekst:'Druk, zeg je.' },
    { t:1.1, tekst:'Het is een reflex geworden.', klein:true },
    { t:2.28, tekst:'Je hoort het jezelf zeggen.', klein:true },
    { t:3.46, tekst:'En je weet dat het niet klopt.', klein:true },
    { t:4.72, tekst:'Deskshift vraagt door.', klein:true },
    { t:5.82, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:9, nr:1, slug:'post-geen-test', vierkant:true, donker:false,
    label:'Hoe het werkt',
    kop:'Geen persoonlijkheidstest. <u>Je eigen week</u> op papier.',
    onder:'Geen type, geen kleur, geen dier. Wat je doet, wat er overblijft, wat erin past.' },
  { platform:'instagram', week:9, nr:2, slug:'liever-overwerkt', duur:9.3, regels:[
    { t:0.0, tekst:'Liever overwerkt lijken.', klein:true },
    { t:1.1, tekst:'Dan onbenut zijn.', punch:'onbenut' },
    { t:2.2, tekst:'Dat is een dure ruil.' },
    { t:3.38, tekst:'Je betaalt hem in jaren.', klein:true },
    { t:4.56, tekst:'Deskshift laat de rekening zien.', klein:true },
    { t:5.74, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:9, nr:3, slug:'niemand-vraagt', duur:9.5, regels:[
    { t:0.0, tekst:'Niemand vraagt wat je vandaag deed.', klein:true },
    { t:1.22, tekst:'Dat voelt als vrijheid.', klein:true },
    { t:2.36, tekst:'Twee maanden lang.' },
    { t:3.46, tekst:'Daarna voelt het als niets.', punch:'niets' },
    { t:4.64, tekst:'Deskshift kijkt wat er wel past.', klein:true },
    { t:5.86, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:9, nr:4, slug:'goed-is-probleem', duur:9.5, regels:[
    { t:0.0, tekst:'Je bent goed in je werk.', klein:true },
    { t:1.22, tekst:'Dat is precies het probleem.', punch:'probleem' },
    { t:2.4, tekst:'Wie goed is, wordt niet gevraagd.', klein:true },
    { t:3.62, tekst:'Die wordt overgeslagen.', klein:true },
    { t:4.72, tekst:'Deskshift draait dat om.', klein:true },
    { t:5.86, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:10, nr:1, slug:'post-een-project', vierkant:true, donker:true,
    label:'Uit de intake',
    kop:'De vaardigheid die je wil is <u>een project</u> ver.',
    onder:'Niet een opleiding, niet een nieuwe baan. Een project dat in je week past.' },
  { platform:'instagram', week:10, nr:2, slug:'leren-stopte', duur:9.3, regels:[
    { t:0.0, tekst:'Je salaris steeg door.' },
    { t:1.14, tekst:'Je leren stopte.', punch:'stopte' },
    { t:2.24, tekst:'Dat verschil zie je niet.', klein:true },
    { t:3.42, tekst:'Tot je van baan wil.', klein:true },
    { t:4.6, tekst:'Deskshift maakt het zichtbaar.', klein:true },
    { t:5.74, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:10, nr:3, slug:'cv-groeit', duur:9.4, regels:[
    { t:0.0, tekst:'Je cv groeit.' },
    { t:1.1, tekst:'Je vakmanschap niet.', punch:'vakmanschap' },
    { t:2.2, tekst:'Dat zijn twee dingen.' },
    { t:3.34, tekst:'En er is er maar een van jou.', klein:true },
    { t:4.65, tekst:'Deskshift kiest de tweede.', klein:true },
    { t:5.79, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:10, nr:4, slug:'weggepromoveerd', duur:9.5, regels:[
    { t:0.0, tekst:'Ze promoveerden je weg.', klein:true },
    { t:1.14, tekst:'Van het werk dat je leuk vond.', klein:true },
    { t:2.4, tekst:'Dat was bedoeld als beloning.', klein:true },
    { t:3.58, tekst:'Het voelt als verlies.', punch:'verlies' },
    { t:4.72, tekst:'Deskshift zoekt de weg terug.', klein:true },
    { t:5.9, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:11, nr:1, slug:'post-eerst-gratis', vierkant:true, donker:false,
    label:'Hoe het werkt',
    kop:'Eerst het inzicht. <u>Daarna kies je</u>.',
    onder:'Het eerste inzicht kost niets. Wat je daarna doet, beslis je zelf.' },
  { platform:'instagram', week:11, nr:2, slug:'functietitel', duur:9.3, regels:[
    { t:0.0, tekst:'Je functietitel veranderde.', klein:true },
    { t:1.1, tekst:'Je werk niet.' },
    { t:2.2, tekst:'Dat is geen loopbaan.', klein:true },
    { t:3.34, tekst:'Dat is een label.', punch:'label' },
    { t:4.48, tekst:'Deskshift kijkt naar de inhoud.', klein:true },
    { t:5.66, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:11, nr:3, slug:'manager-denkt', duur:9.5, regels:[
    { t:0.0, tekst:'Je manager hoort niets van je.', klein:true },
    { t:1.22, tekst:'Dus denkt hij dat het goed gaat.', klein:true },
    { t:2.48, tekst:'Stilte leest als tevreden.', klein:true },
    { t:3.62, tekst:'Dat is de fout.', punch:'fout' },
    { t:4.76, tekst:'Deskshift geeft je de woorden.', klein:true },
    { t:5.94, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:11, nr:4, slug:'laat-maar-weten', duur:9.5, regels:[
    { t:0.0, tekst:'Laat maar weten als je meer wilt.', klein:true },
    { t:1.26, tekst:'Die zin gebruikt niemand ooit.', klein:true },
    { t:2.44, tekst:'Want meer van wat?' },
    { t:3.58, tekst:'Daar zit het probleem.', klein:true },
    { t:4.72, tekst:'Deskshift maakt het concreet.', klein:true },
    { t:5.86, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:12, nr:1, slug:'post-stilte', vierkant:true, donker:true,
    label:'Wat niemand hardop zegt',
    kop:'Stilte kost je <u>een jaar</u>.',
    onder:'Niets zeggen voelt veilig. Het is de duurste keuze die je maakt.' },
  { platform:'instagram', week:12, nr:2, slug:'benoemen', duur:9.5, regels:[
    { t:0.0, tekst:'Je kunt niet om iets vragen' },
    { t:1.22, tekst:'wat je niet kunt benoemen.', klein:true },
    { t:2.4, tekst:'Daarom blijft het bij een gevoel.', klein:true },
    { t:3.62, tekst:'Vijftien minuten vragen.', klein:true },
    { t:4.72, tekst:'Daarna heeft het een naam.', punch:'naam' },
    { t:5.9, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:12, nr:3, slug:'overtreft', duur:9.2, regels:[
    { t:0.0, tekst:'Je beoordeling zegt:' },
    { t:1.1, tekst:'overtreft de verwachting.', klein:true },
    { t:2.2, tekst:'Jij weet waarom.', punch:'waarom' },
    { t:3.3, tekst:'De verwachting was te laag.', klein:true },
    { t:4.48, tekst:'Deskshift stelt hem bij.', klein:true },
    { t:5.62, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:12, nr:4, slug:'opzeggen-duur', duur:9.4, regels:[
    { t:0.0, tekst:'Opzeggen kan altijd nog.', klein:true },
    { t:1.14, tekst:'Het is de dure versie.', klein:true },
    { t:2.32, tekst:'Van een kleinere ingreep.', punch:'kleinere' },
    { t:3.46, tekst:'Die ingreep bestaat.' },
    { t:4.56, tekst:'Deskshift zoekt hem in jouw week.', klein:true },
    { t:5.78, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},
  { platform:'instagram', week:13, nr:1, slug:'post-geen-luiheid', vierkant:true, donker:false,
    label:'Uit de intake',
    kop:'Dit is geen luiheid. Het is een <u>verkeerd rooster</u>.',
    onder:'Je doet je werk goed en het is op. Dat zegt iets over de functie.' },
  { platform:'instagram', week:13, nr:2, slug:'twee-uur', duur:9.5, regels:[
    { t:0.0, tekst:'Twee uur per week.' },
    { t:1.14, tekst:'Dat is genoeg om te beginnen.', klein:true },
    { t:2.36, tekst:'Niet om alles om te gooien.', klein:true },
    { t:3.58, tekst:'Wel om iets te leren.', punch:'leren' },
    { t:4.76, tekst:'Deskshift plant die twee uur.', klein:true },
    { t:5.94, slot:true, tekst:'Gratis inzicht.\nLink in bio.' } ]},

  // ===== EN, week 5 tot 13: vier per week, maandag een foto 4:5 =====
  { platform:'instagram', taal:'en', week:5, nr:1, slug:'post-new-work', vierkant:true, donker:false,
    label:'From the intake',
    kop:'You do not need a new job. You need <u>new work</u>.',
    onder:'A smaller fix than quitting, and often inside the role you already have.' },
  { platform:'instagram', taal:'en', week:6, nr:1, slug:'post-nobody-fills', vierkant:true, donker:true,
    label:'What nobody says out loud',
    kop:'Nobody is coming to <u>fill your week</u>.',
    onder:'Those hours stay empty until you do something with them. Not time off. Unused.' },
  { platform:'instagram', taal:'en', week:7, nr:1, slug:'post-six-weeks', vierkant:true, donker:false,
    label:'How it works',
    kop:'The plan is <u>six weeks</u>. Not five years.',
    onder:'A direction you can start on Monday, instead of a dream for later.' },
  { platform:'instagram', taal:'en', week:7, nr:3, slug:'reel-friday', duur:10.5, regels:[
    { t:0.0, tekst:'It is Friday, half past two.', klein:true },
    { t:1.22, tekst:'Your work is done.' },
    { t:2.36, tekst:'You stay online.', punch:'online' },
    { t:3.46, tekst:'Not because you have to.', klein:true },
    { t:4.64, tekst:'Because leaving gets noticed.', klein:true },
    { t:5.78, tekst:'Deskshift names that.', klein:true },
    { t:6.88, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
  { platform:'instagram', taal:'en', week:7, nr:4, slug:'reel-slower', duur:10.7, regels:[
    { t:0.0, tekst:'You reply slower than you can.', klein:true },
    { t:1.22, tekst:'So it looks like it took time.', klein:true },
    { t:2.48, tekst:'That is not laziness.' },
    { t:3.62, tekst:'That is hiding.', punch:'hiding' },
    { t:4.72, tekst:'And it costs you a year.', klein:true },
    { t:5.94, tekst:'Deskshift does the maths.', klein:true },
    { t:7.08, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
  { platform:'instagram', taal:'en', week:8, nr:1, slug:'post-already-know', vierkant:true, donker:true,
    label:'From the intake',
    kop:'You already know the answer. It is just <u>written nowhere</u>.',
    onder:'Fifteen minutes of questions and there it is, in your own words.' },
  { platform:'instagram', taal:'en', week:8, nr:2, slug:'reel-wednesday', duur:10.8, regels:[
    { t:0.0, tekst:'Your list is empty by Wednesday.', klein:true },
    { t:1.22, tekst:'The week has two days left.', klein:true },
    { t:2.44, tekst:'Those days are not time off.', klein:true },
    { t:3.66, tekst:'They are paid hours.', punch:'paid' },
    { t:4.8, tekst:'Yours and your employer.', klein:true },
    { t:5.94, tekst:'Deskshift turns them into a plan.', klein:true },
    { t:7.16, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
  { platform:'instagram', taal:'en', week:8, nr:3, slug:'reel-asking', duur:9.3, regels:[
    { t:0.0, tekst:'Asking for more work.' },
    { t:1.14, tekst:'It sounds like bragging.', klein:true },
    { t:2.28, tekst:'So you do not ask.' },
    { t:3.46, tekst:'And nothing moves.', klein:true },
    { t:4.56, tekst:'Deskshift finds the words.', klein:true },
    { t:5.7, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
  { platform:'instagram', taal:'en', week:8, nr:4, slug:'reel-afraid', duur:10.8, regels:[
    { t:0.0, tekst:'You are not afraid you cannot cope.', klein:true },
    { t:1.26, tekst:'You are afraid they will see' },
    { t:2.48, tekst:'how little there is.', punch:'little' },
    { t:3.62, tekst:'That is not failure.' },
    { t:4.76, tekst:'That is a badly built week.', klein:true },
    { t:5.98, tekst:'Deskshift puts it on paper.', klein:true },
    { t:7.16, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
  { platform:'instagram', taal:'en', week:9, nr:1, slug:'post-not-a-test', vierkant:true, donker:false,
    label:'How it works',
    kop:'No personality test. <u>Your own week</u> on paper.',
    onder:'No type, no colour, no animal. What you do, what is left, what fits.' },
  { platform:'instagram', taal:'en', week:9, nr:2, slug:'reel-rather', duur:9.4, regels:[
    { t:0.0, tekst:'You would rather look overworked.', klein:true },
    { t:1.18, tekst:'Than be underused.', punch:'underused' },
    { t:2.28, tekst:'That is an expensive trade.', klein:true },
    { t:3.46, tekst:'You pay for it in years.', klein:true },
    { t:4.68, tekst:'Deskshift shows the bill.', klein:true },
    { t:5.82, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
  { platform:'instagram', taal:'en', week:9, nr:3, slug:'reel-nobody-asks', duur:9.5, regels:[
    { t:0.0, tekst:'Nobody asks what you did today.', klein:true },
    { t:1.22, tekst:'That feels like freedom.', klein:true },
    { t:2.36, tekst:'For about two months.' },
    { t:3.5, tekst:'Then it feels like nothing.', punch:'nothing' },
    { t:4.68, tekst:'Deskshift looks for what fits.', klein:true },
    { t:5.86, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
  { platform:'instagram', taal:'en', week:9, nr:4, slug:'reel-good', duur:9.4, regels:[
    { t:0.0, tekst:'You are good at your job.', klein:true },
    { t:1.22, tekst:'That is exactly the problem.', punch:'problem' },
    { t:2.4, tekst:'People who cope get skipped.', klein:true },
    { t:3.58, tekst:'Not asked. Skipped.', klein:true },
    { t:4.68, tekst:'Deskshift turns that around.', klein:true },
    { t:5.82, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
  { platform:'instagram', taal:'en', week:10, nr:1, slug:'post-one-project', vierkant:true, donker:true,
    label:'From the intake',
    kop:'The skill you want is <u>one project</u> away.',
    onder:'Not a degree, not a new employer. A project that fits the week you have.' },
  { platform:'instagram', taal:'en', week:10, nr:2, slug:'reel-learning', duur:9.3, regels:[
    { t:0.0, tekst:'Your salary kept climbing.', klein:true },
    { t:1.14, tekst:'Your learning stopped.', punch:'stopped' },
    { t:2.24, tekst:'You cannot see that gap.', klein:true },
    { t:3.42, tekst:'Until you want to move.', klein:true },
    { t:4.6, tekst:'Deskshift makes it visible.', klein:true },
    { t:5.74, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
  { platform:'instagram', taal:'en', week:10, nr:3, slug:'reel-cv', duur:9.4, regels:[
    { t:0.0, tekst:'Your CV is growing.' },
    { t:1.14, tekst:'Your craft is not.', punch:'craft' },
    { t:2.28, tekst:'Those are two things.' },
    { t:3.42, tekst:'Only one of them is yours.', klein:true },
    { t:4.64, tekst:'Deskshift picks the second.', klein:true },
    { t:5.78, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
  { platform:'instagram', taal:'en', week:10, nr:4, slug:'reel-promoted', duur:9.5, regels:[
    { t:0.0, tekst:'They promoted you away.', klein:true },
    { t:1.14, tekst:'From the work you liked.', klein:true },
    { t:2.32, tekst:'It was meant as a reward.', klein:true },
    { t:3.54, tekst:'It reads as a loss.', punch:'loss' },
    { t:4.72, tekst:'Deskshift looks for the way back.', klein:true },
    { t:5.94, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
  { platform:'instagram', taal:'en', week:11, nr:1, slug:'post-free-first', vierkant:true, donker:false,
    label:'How it works',
    kop:'The insight first. <u>Then you choose</u>.',
    onder:'The first read costs nothing. What happens after that is your call.' },
  { platform:'instagram', taal:'en', week:11, nr:2, slug:'reel-title', duur:9.3, regels:[
    { t:0.0, tekst:'Your job title changed.', klein:true },
    { t:1.14, tekst:'Your work did not.' },
    { t:2.28, tekst:'That is not a career.', klein:true },
    { t:3.46, tekst:'That is a label.', punch:'label' },
    { t:4.6, tekst:'Deskshift reads the content.', klein:true },
    { t:5.74, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
  { platform:'instagram', taal:'en', week:11, nr:3, slug:'reel-silence', duur:9.4, regels:[
    { t:0.0, tekst:'Your manager hears nothing.', klein:true },
    { t:1.14, tekst:'So they assume it is fine.', klein:true },
    { t:2.36, tekst:'Silence reads as content.', klein:true },
    { t:3.5, tekst:'That is the mistake.', punch:'mistake' },
    { t:4.64, tekst:'Deskshift gives you the words.', klein:true },
    { t:5.82, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
  { platform:'instagram', taal:'en', week:11, nr:4, slug:'reel-let-me-know', duur:9.5, regels:[
    { t:0.0, tekst:'Let me know if you want more.', klein:true },
    { t:1.26, tekst:'Nobody ever uses that line.', klein:true },
    { t:2.44, tekst:'Because more of what?' },
    { t:3.58, tekst:'That is the whole problem.', klein:true },
    { t:4.76, tekst:'Deskshift makes it concrete.', klein:true },
    { t:5.9, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
  { platform:'instagram', taal:'en', week:12, nr:1, slug:'post-silence-costs', vierkant:true, donker:true,
    label:'What nobody says out loud',
    kop:'Silence costs you <u>a year</u>.',
    onder:'Saying nothing feels safe. It is the most expensive choice you make.' },
  { platform:'instagram', taal:'en', week:12, nr:2, slug:'reel-name-it', duur:9.4, regels:[
    { t:0.0, tekst:'You cannot ask for something' },
    { t:1.18, tekst:'you cannot name.', klein:true },
    { t:2.28, tekst:'So it stays a feeling.', klein:true },
    { t:3.46, tekst:'Fifteen minutes of questions.', klein:true },
    { t:4.6, tekst:'Then it has a name.', punch:'name' },
    { t:5.78, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
  { platform:'instagram', taal:'en', week:12, nr:3, slug:'reel-exceeds', duur:9.1, regels:[
    { t:0.0, tekst:'Your review says:' },
    { t:1.1, tekst:'exceeds expectations.', klein:true },
    { t:2.15, tekst:'You know why.', punch:'why' },
    { t:3.25, tekst:'The expectation was too low.', klein:true },
    { t:4.43, tekst:'Deskshift raises it.', klein:true },
    { t:5.53, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
  { platform:'instagram', taal:'en', week:12, nr:4, slug:'reel-quitting', duur:9.4, regels:[
    { t:0.0, tekst:'You can always quit.', klein:true },
    { t:1.14, tekst:'It is the expensive version.', klein:true },
    { t:2.32, tekst:'Of a much smaller fix.', punch:'smaller' },
    { t:3.5, tekst:'That fix exists.' },
    { t:4.6, tekst:'Deskshift finds it in your week.', klein:true },
    { t:5.82, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
  { platform:'instagram', taal:'en', week:13, nr:1, slug:'post-not-lazy', vierkant:true, donker:false,
    label:'From the intake',
    kop:'This is not laziness. It is a <u>badly built week</u>.',
    onder:'You do the work well and it runs out. That says something about the role.' },
  { platform:'instagram', taal:'en', week:13, nr:2, slug:'reel-two-hours', duur:9.3, regels:[
    { t:0.0, tekst:'Two hours a week.' },
    { t:1.14, tekst:'Enough to start something.', klein:true },
    { t:2.28, tekst:'Not enough to blow it up.', klein:true },
    { t:3.5, tekst:'Enough to learn.', punch:'learn' },
    { t:4.6, tekst:'Deskshift schedules those hours.', klein:true },
    { t:5.74, slot:true, tekst:'Free insight.\nLink in bio.' } ]},
];

// ---------------------------------------------------------------------------
// Bestandsnaam waarop je kunt sorteren en plannen.
// ---------------------------------------------------------------------------
function naam(it) {
  const p = it.platform === 'tiktok' ? 'tt' : 'ig';
  const w = 'w' + String(it.week).padStart(2, '0');
  const t = it.taal === 'en' ? 'en-' : '';
  return `${t}${p}-${w}-p${it.nr}-${it.slug}`;
}
const taalVan = it => (it.taal === 'en' ? 'en' : 'nl');

// ---------------------------------------------------------------------------
// Verticale video, dezelfde motor als tiktok-1/2/3.
// ---------------------------------------------------------------------------
function bouwVideo(it) {
  const regels = it.regels.map((r, i) => {
    const volgende = it.regels[i + 1];
    if (!volgende) { const c = { ...r }; delete c.uit; return c; }
    return { ...r, uit: +(volgende.t - UIT).toFixed(3) };
  });
  return `<!doctype html>
<html lang="${taalVan(it)}">
<head>
<meta charset="utf-8">
<title>Deskshift ${it.platform} week ${it.week} post ${it.nr}, ${it.slug}</title>
<!--
  Losstaand bestand voor een opname, verticaal 9:16 (1080x1920). Open het en het
  speelt vanzelf af. Met ?regie start het niet zelf, dan kan record-video.js per
  frame precies het beeld op een tijdstip opvragen.
-->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@112,700;112,800&display=swap" rel="stylesheet">
<style>
  :root{--ink:#404E3B;--sage:#7B9669;--paper:#E6E6E6;--wit:#FFFFFF}
  *{box-sizing:border-box;margin:0}
  html,body{height:100%;background:#000;overflow:hidden}
  body{display:flex;align-items:center;justify-content:center}
  #doek{width:1080px;height:1920px;flex:0 0 auto;position:relative;overflow:hidden;
    background:var(--paper);transform-origin:center center}
  #doek.naarDonker{animation:bgDonker .5s cubic-bezier(.4,0,.2,1) both}
  @keyframes bgDonker{from{background-color:#E6E6E6}to{background-color:#404E3B}}
  /* Veilige zone, SYMMETRISCH. TikTok en Reels zetten rechts een knoppenbalk van
     ongeveer 200 beeldpunten en onderin de caption over de video heen. Die
     rechtermarge van 216 is dus nodig, en de linkermarge moet daaraan gelijk
     zijn. Anders loopt de kolom van 72 tot 864 en ligt het midden op 468 in
     plaats van 540, en staat alle tekst zichtbaar links van het midden. Dat was
     tot 30 juli 2026 zo. De kolom is nu 648 breed in plaats van 792, vandaar de
     kleinere letter: anders breken korte regels alsnog. */
  .regel{position:absolute;left:216px;right:216px;top:45%;transform:translateY(-50%);
    text-align:center;font-family:"Archivo","Helvetica Neue",Arial,sans-serif;
    font-variation-settings:"wdth" 112;font-weight:800;letter-spacing:-.025em;line-height:1.06;
    font-size:92px;color:var(--ink)}
  .regel.klein{font-size:70px;line-height:1.14;letter-spacing:-.02em}
  .regel.slot{color:var(--wit)}
  .w{display:inline-block;opacity:0;will-change:opacity,transform}
  .w.in{animation:wIn .42s cubic-bezier(.22,.61,.36,1) both}
  .sp{display:inline-block;width:.28em}
  .w.punch{color:var(--sage)}
  .w.punch.in{animation:wPunch .48s cubic-bezier(.34,1.56,.64,1) both}
  .w.accent{color:var(--sage)}
  @keyframes wIn{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
  @keyframes wPunch{0%{opacity:0;transform:scale(.85) translateY(14px)}62%{opacity:1;transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}
  .regel.uit{animation:regelUit .16s cubic-bezier(.4,0,1,1) both}
  @keyframes regelUit{from{opacity:1;transform:translateY(-50%)}to{opacity:0;transform:translateY(calc(-50% - 14px))}}
  .merk{display:flex;align-items:center;justify-content:center;gap:18px;margin-top:52px;
    font-size:56px;font-weight:700;letter-spacing:-.01em;color:var(--wit)}
  .merk .licht{font-weight:500;color:#BAC8B1}
  .merk svg{display:block;width:1.15em;height:1.15em;flex:0 0 auto}
</style>
</head>
<body>
<div id="doek"></div>
<script>
(function(){
  var doek = document.getElementById("doek");
  var REGELS = ${JSON.stringify(regels, null, 2).replace(/\n/g, '\n  ')};
  var DUUR = ${it.duur};
  var STAP=0.085, IN_DUUR=0.42, PUNCH_DUUR=0.48, UIT_DUUR=0.16, BG_DUUR=0.5;
  var IN_EASE="cubic-bezier(.22,.61,.36,1)", PUNCH_EASE="cubic-bezier(.34,1.56,.64,1)", UIT_EASE="cubic-bezier(.4,0,1,1)";
  function kaal(s){ return s.replace(/[^\\p{L}\\p{N}]/gu,"").toLowerCase(); }
  var bgOp = null;
  REGELS.forEach(function(r){
    var el=document.createElement("div");
    el.className="regel"+(r.klein?" klein":"")+(r.slot?" slot":"");
    el.dataset.in=r.t; if(r.uit!=null) el.dataset.uit=r.uit;
    if(r.slot) bgOp=r.t;
    var n=0;
    r.tekst.split("\\n").forEach(function(stuk,si){
      if(si>0) el.appendChild(document.createElement("br"));
      stuk.split(" ").forEach(function(woord,wi){
        if(wi>0){ var sp=document.createElement("span"); sp.className="sp"; el.appendChild(sp); }
        var w=document.createElement("span"); w.className="w";
        if(r.punch && kaal(woord)===kaal(r.punch)) w.className+=" punch";
        else if(r.accent && kaal(woord)===kaal(r.accent)) w.className+=" accent";
        w.textContent=woord; w.dataset.in=(r.t+n*STAP).toFixed(3);
        el.appendChild(w); n++;
      });
    });
    if(r.slot){
      var merk=document.createElement("span"); merk.className="merk w";
      merk.innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true">'+
        '<rect x="0" y="10" width="62" height="32" fill="#FFFFFF"></rect>'+
        '<rect x="38" y="58" width="62" height="32" fill="#7B9669"></rect></svg>'+
        '<span>Desk<span class="licht">shift</span></span>';
      merk.dataset.in=(r.t+n*STAP+0.12).toFixed(3);
      el.appendChild(merk);
    }
    doek.appendChild(el);
  });
  var regels=[].slice.call(doek.querySelectorAll(".regel"));
  var woorden=[].slice.call(doek.querySelectorAll(".w"));
  function start(){
    woorden.forEach(function(w){ setTimeout(function(){ w.classList.add("in"); }, parseFloat(w.dataset.in)*1000); });
    regels.forEach(function(el){ if(el.dataset.uit==null) return;
      setTimeout(function(){ el.classList.add("uit"); }, parseFloat(el.dataset.uit)*1000); });
    if(bgOp!=null) setTimeout(function(){ doek.classList.add("naarDonker"); }, bgOp*1000);
  }
  function bevries(el,naam,duur,easing,positie){
    el.style.animation="none"; void el.offsetWidth;
    el.style.animation=naam+" "+duur+"s "+easing+" "+(-positie)+"s 1 both paused";
  }
  window.zetFrame=function(t){
    woorden.forEach(function(w){
      w.classList.remove("in");
      var inT=parseFloat(w.dataset.in), punch=w.classList.contains("punch");
      var duur=punch?PUNCH_DUUR:IN_DUUR, naam=punch?"wPunch":"wIn", ease=punch?PUNCH_EASE:IN_EASE;
      if(t<inT){ w.style.animation="none"; w.style.opacity=0; return; }
      w.style.opacity=""; bevries(w,naam,duur,ease,Math.min(t-inT,duur));
    });
    regels.forEach(function(el){
      el.classList.remove("uit");
      var uitA=el.dataset.uit;
      if(uitA==null){ el.style.animation="none"; el.style.opacity=""; return; }
      var uitT=parseFloat(uitA);
      if(t<uitT){ el.style.animation="none"; el.style.opacity=""; }
      else if(t<uitT+UIT_DUUR){ el.style.opacity=""; bevries(el,"regelUit",UIT_DUUR,UIT_EASE,t-uitT); }
      else { el.style.animation="none"; el.style.opacity=0; }
    });
    doek.classList.remove("naarDonker");
    if(bgOp==null||t<bgOp){ doek.style.animation="none"; doek.style.backgroundColor="#E6E6E6"; }
    else if(t<bgOp+BG_DUUR){ doek.style.backgroundColor=""; bevries(doek,"bgDonker",BG_DUUR,"cubic-bezier(.4,0,.2,1)",t-bgOp); }
    else { doek.style.animation="none"; doek.style.backgroundColor="#404E3B"; }
  };
  window.videoDuur=DUUR;
  function schaal(){ var s=Math.min(1, window.innerWidth/1080, window.innerHeight/1920);
    doek.style.transform="scale("+s+")"; }
  schaal(); window.addEventListener("resize", schaal);
  var regie=/(\\?|&)regie\\b/.test(window.location.search);
  window.klaarVoorRegie=false;
  function gereed(){ if(regie){ window.zetFrame(0); window.klaarVoorRegie=true; } else { start(); } }
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(function(){ setTimeout(gereed,60); });
    setTimeout(function(){ if(!regie && !document.querySelector(".w.in")) start(); }, 2500);
  } else { setTimeout(gereed,200); }
})();
</script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Vierkante post voor de Instagram-tijdlijn, in dezelfde opmaak als de twee
// die er al staan: klein labeltje bovenaan, grote kop, merk linksonder.
// ---------------------------------------------------------------------------
function bouwPost(it) {
  const hoog = it.hoog || 1350;
  const donker = !!it.donker;
  return `<!doctype html>
<html lang="${taalVan(it)}">
<head>
<meta charset="utf-8">
<title>Deskshift instagram week ${it.week} post ${it.nr}, ${it.slug}</title>
<!-- Vierkant 1080x1080 voor de Instagram-tijdlijn. Statisch beeld, geen animatie. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@112,700;112,800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{--ink:#404E3B;--sage:#7B9669;--paper:#E6E6E6;--wit:#FFFFFF;--limeL:#BAC8B1}
  *{box-sizing:border-box;margin:0}
  html,body{height:100%;background:#000;overflow:hidden}
  body{display:flex;align-items:center;justify-content:center}
  /* 4:5 en niet vierkant: 1080x1350 pakt in de tijdlijn merkbaar meer
     schermruimte dan 1080x1080, en Instagram schaalt het niet weg. */
  #doek{width:1080px;height:${hoog}px;flex:0 0 auto;position:relative;overflow:hidden;
    transform-origin:center center;padding:${hoog >= 1350 ? 104 : 88}px 92px;display:flex;flex-direction:column;
    justify-content:space-between;
    background:${donker ? 'var(--ink)' : 'var(--paper)'};
    color:${donker ? 'var(--wit)' : 'var(--ink)'}}
  .label{font-family:"IBM Plex Mono",monospace;font-size:26px;letter-spacing:.16em;
    text-transform:uppercase;color:${donker ? 'var(--limeL)' : 'var(--sage)'}}
  .kop{font-family:"Archivo",sans-serif;font-variation-settings:"wdth" 112;font-weight:800;
    font-size:104px;line-height:1.05;letter-spacing:-.03em;max-width:18ch}
  .kop u{text-decoration:none;
    background:linear-gradient(var(--sage),var(--sage)) 0 99%/100% 7% no-repeat;
    padding-bottom:.06em}
  .voet{display:flex;align-items:center;gap:16px;font-family:"Archivo",sans-serif;
    font-variation-settings:"wdth" 112;font-weight:700;font-size:40px;letter-spacing:-.01em}
  .voet .licht{font-weight:500;color:${donker ? 'var(--limeL)' : 'var(--sage)'}}
  .voet svg{display:block;width:1.15em;height:1.15em;flex:0 0 auto}
</style>
</head>
<body>
<div id="doek">
  <div class="label">${it.label}</div>
  <div class="kop">${it.kop}</div>
  <div class="voet">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <rect x="0" y="10" width="62" height="32" fill="${donker ? '#FFFFFF' : '#404E3B'}"></rect>
      <rect x="38" y="58" width="62" height="32" fill="#7B9669"></rect>
    </svg>
    <span>Desk<span class="licht">shift</span></span>
  </div>
</div>
<script>
(function(){
  var doek=document.getElementById("doek");
  function schaal(){ var s=Math.min(1, window.innerWidth/1080, window.innerHeight/${hoog});
    doek.style.transform="scale("+s+")"; }
  schaal(); window.addEventListener("resize", schaal);
  // Laat een opname weten dat het lettertype er is.
  window.klaarVoorRegie=false;
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(function(){ setTimeout(function(){ window.klaarVoorRegie=true; },80); }); }
  else { setTimeout(function(){ window.klaarVoorRegie=true; },300); }
})();
</script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
for (const map of ['bron', 'instagram', 'tiktok']) {
  fs.mkdirSync(path.join(WORTEL, map), { recursive: true });
}

const overzicht = [];
for (const it of ITEMS) {
  const basis = naam(it);
  const html = it.vierkant ? bouwPost(it) : bouwVideo(it);
  const bron = path.join(WORTEL, 'bron', basis + '.html');
  fs.writeFileSync(bron, html);
  overzicht.push({
    platform: it.platform, week: it.week, nr: it.nr, slug: it.slug,
    soort: it.vierkant ? ('post 1080x' + (it.hoog || 1350)) : 'video 1080x1920',
    duur: it.vierkant ? null : it.duur,
    bron, doel: path.join(WORTEL, it.platform, basis + (it.vierkant ? '.png' : '.mp4')),
  });
}
fs.writeFileSync(path.join(WORTEL, 'overzicht.json'), JSON.stringify(overzicht, null, 2));

const vid = overzicht.filter(o => o.duur != null);
console.log('bronbestanden gemaakt: ' + overzicht.length);
console.log('  video’s : ' + vid.length + ' (' + vid.reduce((a, o) => a + o.duur, 0).toFixed(1) + 's totaal)');
console.log('  posts   : ' + (overzicht.length - vid.length));
for (const p of ['instagram', 'tiktok']) {
  const n = overzicht.filter(o => o.platform === p).length;
  console.log('  ' + p + ': ' + n);
}
