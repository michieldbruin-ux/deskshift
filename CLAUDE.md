# Deskshift

Intaketool voor witteboordenwerkers die te snel klaar zijn met hun werk. Twee
talen: Nederlands op `/` en Engels op `/en`. Serverloze functies in `api/`.
Deploy gaat via `main` naar Vercel op deskshift.pro.

## Bouwen: bewerk index.html NIET

`index.html` en `en/index.html` zijn **uitvoer**. Wie ze rechtstreeks bewerkt is
zijn wijziging kwijt bij de eerstvolgende build.

| Wat je wilt wijzigen | Waar |
| --- | --- |
| Een zin, een vraag, een systeemprompt, de prijs | `taal.nl.js` of `taal.en.js` |
| Opmaak, gedrag, de weegformules, de flow | `index.template.html` |
| Hoe de twee bij elkaar komen | `bouw.js` |

Daarna altijd `node bouw.js`, en de uitvoer mee committen.

Wat waar hoort: alle zichtbare tekst en alle systeemprompts staan in de
taalbestanden, de rekenlogica staat in het sjabloon en is voor beide talen
identiek. `bouw.js` weigert te bouwen als de twee taalbestanden niet dezelfde
sleutels hebben of als de intake niet in beide talen dezelfde vragen in dezelfde
volgorde stelt.

Een paar waarden in de taalbestanden zijn **sleutels, geen tekst**, en blijven in
elke taal letterlijk hetzelfde: de `v`-waarden in `KALIB`, de sleutels van
`DRIJF`, `sleutels` bij de grenzenvraag, en in de prompts de woorden
`taakverrijking|leren|zijproject` en `inkomen|leren|erkenning|prikkel`. Daar
rekent de weging op.

De prijs staat per taal op één plek in de front-end: het `PRIJS`-blok bovenin het
taalbestand, gemarkeerd met `[PRIJS]`. Nederlands is 25 euro, Engels is 29 dollar.
**Er is een tweede plek**: `api/checkout.js` heeft per taal een bedrag, een valuta
en een prijs-id. Die twee moeten gelijk lopen, anders betaalt de klant iets anders
dan het scherm zegt. En let op de rangorde: is er een prijs-id, dan is Stripe de
waarheid en is het bedrag in het taalbestand alleen nog wat er op de pagina staat.

Wat **niet** door `bouw.js` gemaakt wordt, en dus met de hand aan beide kanten
bijgewerkt moet worden:

| Nederlands | Engels |
| --- | --- |
| `privacy.html`, `terms.html` | `en/privacy.html`, `en/terms.html` |
| `vragen/` (3 vragen plus index) | `en/questions/` (3 vragen plus index) |

De vraagpagina's zijn per taal een eigen tekst en geen vertaling: de Engelse
slugs volgen wat iemand in het Engels zou zoeken, niet de Nederlandse titel.
Wel gekoppeld met `hreflang`, dus voeg je er een toe, doe dat dan in beide talen
of in geen van beide, en zet het paar ook in `sitemap.xml`.

## Beheerdersmail

`api/adminmail.js` stuurt twee overzichten naar de beheerder. De dagmail gaat
alleen uit als er die dag betaald is, de weekmail gaat elke maandag uit, ook op
nul. De betalingen komen uit Stripe, de afhakers uit `deskshift_meting`.

De cron van Vercel draait op UTC en 07:00 hier is 's zomers 05:00 UTC en 's
winters 06:00. Daarom staan er **twee** cron-regels op hetzelfde pad in
`vercel.json`. De functie slaat de te vroege ronde over, en
`deskshift_adminmail` houdt bij wat al verstuurd is zodat er per periode één
mail uitgaat. Wijzig je die twee regels, houd dan beide kanten in de gaten.

Eigen betalingen tellen niet mee: `ADMIN_NEGEER_MAILS` plus het adres van de
beheerder zelf. Dat werkt alleen voor de betalingen. De meting achter de
afhakers kent geen mailadres en dat blijft zo, dus een eigen intake die bij de
paywall stopt staat gewoon in dat getal.

Zonder `CRON_SECRET` weigert het endpoint alles. Een open endpoint dat mail
verstuurt is erger dan een mail die niet aankomt. Handmatig aanroepen kan met
`?droog=1`: dat rekent alles door en verstuurt niets. Met `?nu=<iso>` reken je
een andere datum door.

## Huisregels voor de teksten

- Nederlands, je-vorm, korte zinnen.
- **Geen gedachtestreepjes.** Nooit. Gebruik een komma, een punt of een dubbele punt.
- Geen coach-jargon, geen uitroeptekens, geen slijmerij.
- Nooit hij, zij, hem of haar over de gebruiker; nooit naar geslacht gokken.
- Uren die binnen de werkweek overblijven zijn geen vrije tijd. Noem het ruimte
  in de werkweek: het blijft betaalde tijd van de werkgever.

## Publiceren op social media

**Twee accounts, en de taal bepaalt welke.**

| | |
| --- | --- |
| Nederlandse content | `desk_shift_nl`, ig_user_id **`27843378131945454`**, verbinding `instagram_amaze-burrow` |
| Engelse content | `desk_shift`, ig_user_id **`37664874506459107`**, verbinding `instagram_aoul-mastax` |
| Verboden | `michieldebruin` (privéaccount) en elk ander account |

Een Engelse post op het Nederlandse account is niet terug te draaien: een caption
is via de API niet te wijzigen en een bericht verwijderen kan ook niet.

**Het id alleen is niet genoeg, de verbinding hoort erbij.** De twee accounts
zitten in een andere Business Manager, en een aanroep loopt via de
inloggegevens van de Composio-verbinding. Vraag je het Nederlandse id op via de
Engelse verbinding, dan krijg je "object does not exist" op een id dat prima
bestaat. Wijs dus altijd allebei aan: het `ig_user_id` en de verbinding.

Sinds 28 juli 2026 is `desk_shift` de **standaardverbinding**. Een aanroep
zonder expliciete verbinding komt dus op het Engelse account uit, precies
andersom dan het daarvoor was. Leun er niet op, in geen van beide richtingen.

`17841439417364814` staat in de paginabron van `desk_shift` maar is het id
**niet**. De Graph API geeft daarop "object does not exist". Vul het nergens in.

Regels bij het publiceren:

1. Geef **altijd** het expliciete numerieke `ig_user_id` mee. **Gebruik nooit
   `"me"`.** Dat lost op naar de standaardverbinding, en zodra er een tweede
   Instagram-account aan Composio hangt kan dat het privéaccount zijn. Dat is
   het enige realistische pad waarlangs een post op het verkeerde account belandt.
2. Controleer vóór het publiceren met `INSTAGRAM_GET_USER_INFO` op dat expliciete
   id dat `username` gelijk is aan `desk_shift_nl`. Klopt dat niet, stop dan en
   vraag het na.
3. Publiceren is onomkeerbaar en publiek: doe het alleen op een uitdrukkelijk
   verzoek voor die specifieke post, niet op eigen initiatief.
4. Een caption is via de API niet aan te passen of te verwijderen. Een reactie
   wel. Zet hashtags daarom in de eerste reactie (maximaal vier) en houd de
   caption vrij van `#`.

De media moeten publiek staan: de Graph API haalt het bestand zelf op van een
HTTPS-URL zonder querystring, uploaden kan niet. Daarvoor staat `social/`, dat
Vercel meeserveert. `content/instagram/` is renderuitvoer en gitignored, dus
onbereikbaar voor Instagram.

## Content

- `content/bron/*.html` zijn de bronnen, `node render-content.js` maakt de mp4's
  en png's. `content/CONTENTPLAN.md` en `contentplan.csv` zijn de planning.
- Video's zijn 1080x1920, posts 1080x1080. Tekst blijft binnen de veilige zone
  (links 72px, rechts 216px), anders valt hij achter de knoppenbalk van TikTok
  en Reels.

## Testen

Geen testsuite in de repo. Werk verifiëren met Puppeteer tegen de gebouwde
`index.html` en `en/index.html`, met een stub op `/api/chat` en `/api/mail`.
Serveer ze over http en niet via `file://`: localStorage werkt daar niet, en
zonder localStorage komt de testmodus niet aan. Chromium staat op
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Meet op 390px eerst:
mobiel is de maat, desktop is de afgeleide.

Let op bij het stubben: de prompt van `P_ANALYSE` bevat "vat deze persoon samen
voor een eerste gesprek" en die van `P_UITWERKING` "een eerste gespreksverslag".
Matchen op `eerste gesprek` raakt dus beide, en in het Engels raakt
`first conversation` net zo goed `written summary` niet, maar staat de
uitwerkingsprompt wel vóór de analyseprompt in de tekst. Toets in een stub altijd
eerst op de uitwerking.

Een stub moet sterktes teruggeven in de taal van de sortering. Doet hij dat niet,
dan vindt `sterkteScore` ze niet terug en zakt de pasvorm om een reden die niets
met de app te maken heeft.

## Testmodus

Verborgen voor bezoekers. Zet aan met `?test=1` op dit toestel, uit met
`?test=0`. Drie routes: direct naar de uitkomst, vanaf de schets, of door de
hele intake.
