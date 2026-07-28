# Instagram automatisch publiceren met een Routine

Een Routine die vanuit Claude Code op het web wordt aangemaakt kan geen
connectors meebrengen: de sessie die hij start heeft dan geen Composio en kan
dus niet posten. Aanmaken via de Routines-interface op claude.ai kan dat wel,
want daar hang je de connector zelf aan de Routine.

Hieronder staat wat je daar invult. Drie Routines, omdat de drie tijdslots
verschillen. De prompt is voor alle drie identiek: die zoekt zelf op welke post
bij de datum van vandaag hoort.

## De drie Routines

| Routine | Cron (UTC) | Fires op | Voor |
| --- | --- | --- | --- |
| Deskshift IG dinsdag | `30 5 * * 2` | dinsdag 07:30 Amsterdam | post 4 en 7 |
| Deskshift IG donderdag | `30 10 * * 4` | donderdag 12:30 Amsterdam | post 2, 5 en 8 |
| Deskshift IG zondag | `30 17 * * 0` | zondag 19:30 Amsterdam | post 3, 6 en 9 |

De tijden staan in UTC en de posts vallen allemaal in de zomertijd, dus twee uur
eraf. Loopt het door tot na 25 oktober, zet er dan een uur bij.

Zet bij alle drie de **Composio-connector** aan, anders kan de sessie niet
publiceren. Laat notificaties aanstaan, dan zie je per keer of het gelukt is.

Na 16 augustus zijn de negen posts geweest en kunnen de Routines uit.

## De prompt, voor alle drie hetzelfde

```
Publiceer de Instagram-post die vandaag gepland staat voor Deskshift.

HARDE REGEL OVER HET ACCOUNT
Publiceren mag uitsluitend op desk_shift_nl, ig_user_id 27843378131945454.
Nooit op het privéaccount michieldebruin en nooit op een ander account. Geef
altijd dat expliciete numerieke id mee en gebruik nooit "me" als ig_user_id,
want dat lost op naar de standaardverbinding van Composio en dat kan een ander
account zijn. Controleer eerst met INSTAGRAM_GET_USER_INFO op dat expliciete id
dat username gelijk is aan desk_shift_nl. Klopt dat niet, publiceer dan niets.

WELKE POST
Haal https://deskshift.pro/social/planning.json op. Zoek in "posts" de regels
waarvan "datum" gelijk is aan de datum van vandaag in Europe/Amsterdam.

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
de captions. Staat de caption van vandaag er al tussen, publiceer dan niets:
dubbel posten is niet terug te draaien.

PUBLICEREN
1. Maak een container met INSTAGRAM_POST_IG_USER_MEDIA:
   ig_user_id 27843378131945454
   bij soort "reel": video_url = het veld "bestand", media_type REELS,
     share_to_feed true
   bij soort "post": image_url = het veld "bestand"
   caption: het veld "caption", letterlijk. Er hoort geen # in de caption.
2. Publiceer met INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH, max_wait_seconds 180.
   Een reel verwerken duurt ongeveer een minuut, een foto is meteen klaar.
3. Zet met INSTAGRAM_POST_IG_MEDIA_COMMENTS het veld "hashtags" als eerste
   reactie onder de post. Daar horen ze, want een caption is via de API niet
   meer te wijzigen en een reactie wel.
4. Controleer met INSTAGRAM_GET_IG_MEDIA en meld de permalink, plus of caption
   en hashtags goed zijn doorgekomen.

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

De controle op de laatste berichten zit erin omdat een Routine soms twee keer
kan afgaan. Dubbel posten valt niet terug te draaien, een overgeslagen post wel.

Het filter op `"taal": "nl"` zit erin omdat de planning sinds de Engelse content
regels van beide talen op dezelfde datum heeft staan. Zonder dat filter pakt de
Routine ze allebei en zet hij de Engelse caption op het Nederlandse account. De
eerste datum waarop dat speelt is zondag 2 augustus 2026: daar staan een
Nederlandse en een Engelse regel op hetzelfde tijdslot.

Let op: deze prompt staat hier alleen ter documentatie. De Routines op claude.ai
hebben hun eigen kopie. Wijzig je hier iets, werk dan alle drie de Routines bij,
anders draait er nog de oude tekst.
