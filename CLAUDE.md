# Deskshift

Nederlandse intaketool voor witteboordenwerkers die te snel klaar zijn met hun
werk. Eén bestand: `index.html`, met inline stijl en script. Serverloze functies
in `api/`. Deploy gaat via `main` naar Vercel op deskshift.pro.

## Huisregels voor de teksten

- Nederlands, je-vorm, korte zinnen.
- **Geen gedachtestreepjes.** Nooit. Gebruik een komma, een punt of een dubbele punt.
- Geen coach-jargon, geen uitroeptekens, geen slijmerij.
- Nooit hij, zij, hem of haar over de gebruiker; nooit naar geslacht gokken.
- Uren die binnen de werkweek overblijven zijn geen vrije tijd. Noem het ruimte
  in de werkweek: het blijft betaalde tijd van de werkgever.

## Publiceren op social media

**Instagram gaat uitsluitend naar `desk_shift_nl`.**

| | |
| --- | --- |
| Toegestaan | `desk_shift_nl`, ig_user_id **`27843378131945454`** |
| Verboden | `michieldebruin` (privéaccount) en elk ander account |

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

Geen testsuite in de repo. Werk verifiëren met Puppeteer tegen `index.html`,
met een stub op `/api/chat` en `/api/mail`. Chromium staat op
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Meet op 390px eerst:
mobiel is de maat, desktop is de afgeleide.

Let op bij het stubben: de prompt van `P_ANALYSE` bevat "vat deze persoon samen
voor een eerste gesprek" en die van `P_UITWERKING` "een eerste gespreksverslag".
Matchen op `eerste gesprek` raakt dus beide.

## Testmodus

Verborgen voor bezoekers. Zet aan met `?test=1` op dit toestel, uit met
`?test=0`. Drie routes: direct naar de uitkomst, vanaf de schets, of door de
hele intake.
