# Instagram automatisch publiceren met een Routine

Een Routine die vanuit Claude Code op het web wordt aangemaakt kan geen
connectors meebrengen: de sessie die hij start heeft dan geen Composio en kan
dus niet posten. Aanmaken via de Routines-interface op claude.ai kan dat wel,
want daar hang je de connector zelf aan de Routine.

Hieronder staat wat je daar invult. **Zes Routines: drie Nederlandse en drie
Engelse.** De tijdslots zijn per taal hetzelfde, maar de prompt verschilt, want
de twee talen gaan naar een ander account via een andere verbinding.

Waarom gescheiden en niet één prompt die beide talen doet: een Routine die maar
één account kent, kan niet op het verkeerde account posten. Een prompt die per
regel moet kiezen tussen twee accounts kan dat wel, en publiceren is niet terug
te draaien. Die veiligheid is het dubbele aantal Routines waard.

## De zes Routines

| Routine | Cron (UTC) | Fires op | Account | Voor |
| --- | --- | --- | --- | --- |
| Deskshift IG NL dinsdag | `30 5 * * 2` | dinsdag 07:30 Amsterdam | `desk_shift_nl` | 4 en 11 aug |
| Deskshift IG NL donderdag | `30 10 * * 4` | donderdag 12:30 Amsterdam | `desk_shift_nl` | 30 jul, 6 en 13 aug |
| Deskshift IG NL zondag | `30 17 * * 0` | zondag 19:30 Amsterdam | `desk_shift_nl` | 2, 9 en 16 aug |
| Deskshift IG EN dinsdag | `30 5 * * 2` | dinsdag 07:30 Amsterdam | `desk_shift` | 4, 11 en 18 aug |
| Deskshift IG EN donderdag | `30 10 * * 4` | donderdag 12:30 Amsterdam | `desk_shift` | 6 en 13 aug |
| Deskshift IG EN zondag | `30 17 * * 0` | zondag 19:30 Amsterdam | `desk_shift` | 2, 9 en 16 aug |

De tijden staan in UTC en de posts vallen allemaal in de zomertijd, dus twee uur
eraf. Loopt het door tot na 25 oktober, zet er dan een uur bij.

Zet bij alle zes de **Composio-connector** aan, anders kan de sessie niet
publiceren. Laat notificaties aanstaan, dan zie je per keer of het gelukt is.

Een Routine matcht op de **datum**, niet op het veld `tijd`. Dat veld is
documentatie; de cron bepaalt het werkelijke moment. Houd ze daarom gelijk, want
anders belooft de planning iets anders dan er gebeurt. De Engelse post van
18 augustus stond daarom eerst op 12:30 en is naar 07:30 gezet: dat is de enige
dinsdag-cron die er is, en een zevende Routine voor één post is niet de moeite.

Na 16 augustus is het Nederlands op en kunnen die drie uit. Het Engels loopt tot
18 augustus.

## De Nederlandse prompt, voor alle drie hetzelfde

```
Publiceer de Instagram-post die vandaag gepland staat voor Deskshift.

HARDE REGEL OVER HET ACCOUNT
Publiceren mag uitsluitend op desk_shift_nl, ig_user_id 27843378131945454, via
de Composio-verbinding instagram_amaze-burrow. Nooit op het privéaccount
michieldebruin en nooit op een ander account.

Geef bij ELKE Instagram-aanroep allebei die waarden mee: het expliciete
numerieke ig_user_id en die verbinding. Gebruik nooit "me" als ig_user_id.

Alleen het id meegeven is niet genoeg. De standaardverbinding van Composio is
desk_shift, het Engelse account, en dat zit in een andere Business Manager. Loopt
de aanroep daarlangs, dan kent hij het Nederlandse id niet en krijg je "object
does not exist" op een id dat gewoon bestaat.

Controleer eerst met INSTAGRAM_GET_USER_INFO op dat expliciete id, via die
verbinding, dat username gelijk is aan desk_shift_nl. Klopt dat niet, of geeft
de aanroep een fout, publiceer dan niets en meld wat er terugkwam.

Doe die controle altijd, ook als er vandaag niets gepland blijkt te staan, en
zet in je antwoord letterlijk welke username eruit kwam. Dat is de enige manier
waarop achteraf te zien is of deze Routine bij Instagram kon. Een ronde die
alleen meldt dat er niets gepland stond, zegt daar niets over.

WELKE POST
Haal https://deskshift.pro/social/planning.json op. Krijg je een 403 of een
andere fout van de proxy, haal hem dan op met curl. Lukt ophalen helemaal
niet, publiceer dan niets en meld dat, want zonder de planning weet je niet
wat er vandaag hoort te gebeuren.

Zoek in "posts" de regels waarvan "datum" gelijk is aan de datum van vandaag
in Europe/Amsterdam.

Houd daarvan alleen de regels over met "taal": "nl". Sla elke andere regel over,
ook als er dan niets overblijft. Deze Routine publiceert uitsluitend Nederlands,
want het enige account waar hij op mag posten is desk_shift_nl. Een Engelse
regel hoort op desk_shift en dat account staat hier niet aan. Sla je er een over,
meld dat dan kort in je antwoord.

Blijft er niets over, publiceer dan niets en meld dat er niets Nederlands
gepland stond.

Blijven er meerdere Nederlandse regels over, publiceer ze dan allemaal, een voor
een, en doorloop de stappen hieronder per regel volledig.

CONTROLEER EERST OF HET ER AL STAAT
Haal met INSTAGRAM_GET_IG_USER_MEDIA de laatste vijf berichten op en vergelijk
de captions. Gebruik ig_user_id 27843378131945454 via de verbinding
instagram_amaze-burrow. Staat de caption van vandaag er al tussen, publiceer dan
niets: dubbel posten is niet terug te draaien.

PUBLICEREN
Bij elk van de vier stappen hieronder geldt: ig_user_id 27843378131945454, via de
Composio-verbinding instagram_amaze-burrow. Het staat er per stap nog een keer
bij. Dat is geen herhaling om de herhaling, dat is omdat een stap zonder die
verbinding op het Engelse account uitkomt en publiceren niet terug te draaien is.

1. Maak een container met INSTAGRAM_POST_IG_USER_MEDIA:
   ig_user_id 27843378131945454, verbinding instagram_amaze-burrow
   bij soort "reel": video_url = het veld "bestand", media_type REELS,
     share_to_feed true
   bij soort "post": image_url = het veld "bestand"
   caption: het veld "caption", letterlijk. Er hoort geen # in de caption.
2. Publiceer met INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH, max_wait_seconds 180.
   ig_user_id 27843378131945454, verbinding instagram_amaze-burrow.
   Een reel verwerken duurt ongeveer een minuut, een foto is meteen klaar.
3. Zet met INSTAGRAM_POST_IG_MEDIA_COMMENTS het veld "hashtags" als eerste
   reactie onder de post, via de verbinding instagram_amaze-burrow. Daar horen
   ze, want een caption is via de API niet meer te wijzigen en een reactie wel.
4. Controleer met INSTAGRAM_GET_IG_MEDIA, via de verbinding
   instagram_amaze-burrow, en meld de permalink, plus of caption en hashtags
   goed zijn doorgekomen.

ALS IETS NIET KAN
Geen Composio-connector, of het aanmaken van de container mislukt: publiceer
niets, verzin geen omweg, en meld kort wat er misging. Bij een mislukte
container maak je een nieuwe aan; dezelfde creation_id twee keer publiceren
geeft een fout.
```

## De Engelse prompt, voor alle drie hetzelfde

Zelfde opzet, ander account en een ander filter. Verwissel deze twee prompts
niet: het verschil zit in een handvol cijfers en dat is precies waarom het fout
kan gaan.

```
Publiceer de Instagram-post die vandaag gepland staat voor Deskshift Engels.

HARDE REGEL OVER HET ACCOUNT
Publiceren mag uitsluitend op desk_shift, ig_user_id 37664874506459107, via de
Composio-verbinding instagram_aoul-mastax. Nooit op desk_shift_nl, nooit op het
privéaccount michieldebruin, nooit op een ander account.

Geef bij ELKE Instagram-aanroep allebei die waarden mee: het expliciete
numerieke ig_user_id en die verbinding. Gebruik nooit "me" als ig_user_id.

Alleen het id meegeven is niet genoeg. De twee Deskshift-accounts zitten in een
andere Business Manager, en een aanroep loopt via de inloggegevens van de
verbinding. Gaat hij langs de verkeerde, dan krijg je "object does not exist" op
een id dat gewoon bestaat.

Controleer eerst met INSTAGRAM_GET_USER_INFO op dat expliciete id, via die
verbinding, dat username gelijk is aan desk_shift. Klopt dat niet, of geeft de
aanroep een fout, publiceer dan niets en meld wat er terugkwam.

Doe die controle altijd, ook als er vandaag niets gepland blijkt te staan, en
zet in je antwoord letterlijk welke username eruit kwam. Dat is de enige manier
waarop achteraf te zien is of deze Routine bij Instagram kon. Een ronde die
alleen meldt dat er niets gepland stond, zegt daar niets over.

WELKE POST
Haal https://deskshift.pro/social/planning.json op. Krijg je een 403 of een
andere fout van de proxy, haal hem dan op met curl. Lukt ophalen helemaal
niet, publiceer dan niets en meld dat, want zonder de planning weet je niet
wat er vandaag hoort te gebeuren.

Zoek in "posts" de regels waarvan "datum" gelijk is aan de datum van vandaag
in Europe/Amsterdam.

Houd daarvan alleen de regels over met "taal": "en". Sla elke andere regel over,
ook als er dan niets overblijft. Deze Routine publiceert uitsluitend Engels,
want het enige account waar hij op mag posten is desk_shift. Een Nederlandse
regel hoort op desk_shift_nl en dat account staat hier niet aan. Sla je er een
over, meld dat dan kort in je antwoord.

Blijft er niets over, publiceer dan niets en meld dat er niets Engels gepland
stond.

Blijven er meerdere Engelse regels over, publiceer ze dan allemaal, een voor
een, en doorloop de stappen hieronder per regel volledig.

CONTROLEER EERST OF HET ER AL STAAT
Haal met INSTAGRAM_GET_IG_USER_MEDIA de laatste vijf berichten op en vergelijk
de captions. Gebruik ig_user_id 37664874506459107 via de verbinding
instagram_aoul-mastax. Staat de caption van vandaag er al tussen, publiceer dan
niets: dubbel posten is niet terug te draaien.

PUBLICEREN
Bij elk van de vier stappen hieronder geldt: ig_user_id 37664874506459107, via de
Composio-verbinding instagram_aoul-mastax. Het staat er per stap nog een keer
bij. Dat is geen herhaling om de herhaling, dat is omdat een stap zonder die
verbinding op het Nederlandse account uitkomt en publiceren niet terug te
draaien is.

1. Maak een container met INSTAGRAM_POST_IG_USER_MEDIA:
   ig_user_id 37664874506459107, verbinding instagram_aoul-mastax
   bij soort "reel": video_url = het veld "bestand", media_type REELS,
     share_to_feed true
   bij soort "post": image_url = het veld "bestand"
   caption: het veld "caption", letterlijk. Er hoort geen # in de caption.
2. Publiceer met INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH, max_wait_seconds 180.
   ig_user_id 37664874506459107, verbinding instagram_aoul-mastax.
   Een reel verwerken duurt ongeveer een minuut, een foto is meteen klaar.
3. Zet met INSTAGRAM_POST_IG_MEDIA_COMMENTS het veld "hashtags" als eerste
   reactie onder de post, via de verbinding instagram_aoul-mastax. Daar horen
   ze, want een caption is via de API niet meer te wijzigen en een reactie wel.
4. Controleer met INSTAGRAM_GET_IG_MEDIA, via de verbinding
   instagram_aoul-mastax, en meld de permalink, plus of caption en hashtags
   goed zijn doorgekomen.

ALS IETS NIET KAN
Geen Composio-connector, of het aanmaken van de container mislukt: publiceer
niets, verzin geen omweg, en meld kort wat er misging. Bij een mislukte
container maak je een nieuwe aan; dezelfde creation_id twee keer publiceren
geeft een fout.
```

## Waarom het zo is opgezet

De planning staat in `planning.json` en niet in de prompt, zodat je een caption
of een datum kunt wijzigen zonder de Routines aan te raken. Het bestand wordt
door Vercel meegeserveerd, dus de Routine kan er altijd bij.

**De Routine leest de gepubliceerde versie, niet de versie in de repo.** Een
wijziging in `planning.json` doet dus niets tot hij live staat. Loopt de Routine
op iets vast wat in de repo allang klopt, kijk dan eerst of wat op
`deskshift.pro/social/planning.json` staat gelijk is aan wat je hier ziet.

Op 28 juli 2026 was dat niet zo. De Routine vond het veld `taal` niet, terwijl
`main` toen al zeventien regels had die het allemaal hadden. Wat live stond was
een oudere versie met acht regels en zonder dat veld. De repo was dus niet het
probleem, de productiedeploy op Vercel had `main` niet opgepakt. Dat is de
eerste plek om te kijken als de planning zich anders gedraagt dan het bestand
dat je voor je hebt.

De controle op de laatste berichten zit erin omdat een Routine soms twee keer
kan afgaan. Dubbel posten valt niet terug te draaien, een overgeslagen post wel.

Het filter op `"taal": "nl"` zit erin omdat de planning sinds de Engelse content
regels van beide talen op dezelfde datum heeft staan. Zonder dat filter pakt de
Routine ze allebei en zet hij de Engelse caption op het Nederlandse account. De
eerste datum waarop dat speelt is zondag 2 augustus 2026: daar staan een
Nederlandse en een Engelse regel op hetzelfde tijdslot.

De verbinding staat er sinds 28 juli 2026 expliciet bij. Tot die dag hing er maar
één Instagram-account aan Composio en was desk_shift_nl vanzelf de standaard.
Sinds desk_shift erbij kwam is dat omgedraaid en is het Engelse account de
standaard. Een prompt die alleen het Nederlandse id noemt loopt sindsdien vast.

Let op: deze prompt staat hier alleen ter documentatie. De Routines op claude.ai
hebben hun eigen kopie. Wijzig je hier iets, werk dan alle zes de Routines bij,
anders draait er nog de oude tekst.

Twee dingen kwamen uit de eerste proefronde op 28 juli 2026. Het ophalen van de
planning liep vast op een 403 van de proxy en lukte wel met curl, dus dat
vangnet staat nu in de prompt. En de ronde meldde alleen dat er niets gepland
stond, zonder de accountcontrole te noemen, waardoor achteraf niet te zien was
of hij bij Instagram kon. Daarom moet die controle nu altijd gebeuren en altijd
in het antwoord staan, ook op een lege dag.
