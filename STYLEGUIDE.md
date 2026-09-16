# Deskshift visuele stijl

Alle waarden komen uit `index.template.html`, het sjabloon waaruit `bouw.js`
zowel `index.html` als `en/index.html` maakt. Regelnummers verwijzen naar dat
bestand, tenzij anders vermeld.

## Lees dit eerst, anders kopieer je de verkeerde kleuren

Het sjabloon heeft **vier `:root`-blokken** die elkaar overschrijven, allemaal op
topniveau zonder media query. De browser past dus gewoon de volgorde toe: de
laatste declaratie wint.

| Blok | Regel | Rol |
| --- | --- | --- |
| 1 | 37 tot 42 | eerste opzet, grotendeels achterhaald |
| 2 | 526 tot 538 | radii, schaduwen, easing |
| 3 | 641 tot 645 | **de kleuren die je werkelijk ziet** |
| 4 | 1181 | alleen `--spring` |

Neem je blok 1 over, dan krijg je een donkergroen dat niet meer gebruikt wordt
(`#404E3B`) en een gedempt salie-accent (`#7B9669`) in plaats van het heldere
`#BFE35F` dat er nu staat. Hieronder staan overal de **winnende** waarden.

---

## 1. Kleuren

### Tokens, met de winnende declaratie

| Token | Waarde | Herkomst |
| --- | --- | --- |
| `--ink` | `#152A1C` | regel 642 |
| `--petrol` | `#3E5546` | regel 642 |
| `--paper` | `#ECEEE6` | regel 642 |
| `--veld` | `#F4F6EE` | regel 642 |
| `--chalk` | `#FFFFFF` | regel 38 |
| `--slate` | `#5D6C5D` | regel 643 |
| `--line` | `rgba(21,42,28,.13)` | regel 643 |
| `--line-2` | `rgba(64,78,59,.07)` | regel 528 |
| `--lime` | `#BFE35F` | regel 644 |
| `--limeE` | `#8FB23A` | regel 644 |
| `--limeL` | `#D6EBA8` | regel 644 |
| `--limeT` | `#18240F` | regel 644 |
| `--warn` | `#A24E33` | regel 41 |

### Waar elke kleur wordt gebruikt

- **`--paper` `#ECEEE6`** is de paginaachtergrond. `body{background:var(--paper)}`
  op regel 646, en dezelfde waarde staat als `theme-color` op regel 7.
- **`--ink` `#152A1C`** is de standaard tekstkleur (`body`, regel 45) en de vulling
  van donkere vlakken: `.opener` (97), `.preview` (704), `.bigquote` (904),
  `.citaat` (1013), `.prijs-dark` (1031), `.slot-cta` (1060). Op die donkere
  vlakken is de tekst `#fff`.
- **`--petrol` `#3E5546`** is secundaire tekst: `.lead` (55) en `.quote` (244).
  Ook de hoverkleur van de primaire knop (regel 75).
- **`--slate` `#5D6C5D`** is labeltekst: `.mono` (54), `.micro` (686),
  `.week-labels span` (1207).
- **`--lime` `#BFE35F`** is het accent en staat **niet op gewone tekst**. Alleen
  op: de primaire actieknop `.btn-lime` (771), de focusring van invoervelden
  (760), de linkerstreep bij citaten en actieve stappen, en als sheen van 10 tot
  42 procent in achtergrondverlopen.
- **`--limeT` `#18240F`** is de tekstkleur op een lime knop (771) en het vinkje in
  een afgeronde stap (447).
- **`--veld` `#F4F6EE`** is de vulling van invoervelden en lichte kaarten:
  `.kaartje` (213), `.card` (241).
- **`--chalk` `#FFFFFF`** is de vulling van `.trustkaart` (1026) en van
  invoervelden in de latere stijl (759).
- **`--line` en `--line-2`** zijn randen. `--line` voor zichtbare randen,
  `--line-2` voor de bijna onzichtbare `inset`-rand om secties (553).
- **`--warn` `#A24E33`** is uitsluitend fout- en zwakstatus: `.err` (292) en
  `.card.weak` (242).

### Losse kleuren die niet in een token zitten

| Waarde | Waar | Regel |
| --- | --- | --- |
| `#4E6742` | hover primaire knop, oude stijl | 77 |
| `#AFD64C` | hover lime knop | 772 |
| `#404E3B` en `#7B9669` | de twee rechthoeken van het logo | 1274 en 1395 |
| `#8A2B21` | icoon in een waarschuwingsbadge | 1444 |
| `#F3C9C2` | achtergrond van diezelfde badge | 1444 |

Let op: **het logo staat op de oude paletwaarden.** `#404E3B` en `#7B9669` zijn
de kleuren uit blok 1, niet de huidige `--ink` en `--lime`. Neem je het logo
over, kies dan bewust of je dat zo laat of gelijktrekt.

---

## 2. Typografie

### Laden

Google Fonts, met preconnect, regels 27 tot 29:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@112,600;112,700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

Archivo wordt als variabel lettertype geladen op breedteas 112. Elke regel die
Archivo gebruikt zet daarom ook `font-variation-settings:"wdth" 112`. Laat je dat
weg, dan valt de breedte terug op 100 en wordt de kop smaller.

### Stacks

| Rol | Stack | Regel |
| --- | --- | --- |
| Body | `"IBM Plex Sans",system-ui,sans-serif` | 45 |
| Koppen | `"Archivo",system-ui,sans-serif` | 49 |
| Labels | `"IBM Plex Mono",monospace` | 54 |

### Groottes en gewichten

| Element | Grootte | Gewicht | Line-height | Letter-spacing | Regel |
| --- | --- | --- | --- | --- | --- |
| `body` | `17px` | 400 | `1.55` | standaard | 45 |
| `h1` | `clamp(27px,7.6vw,56px)` | 700 | `1.05` | `-.025em` | 557 |
| `.hero h1` | `clamp(29px,8vw,56px)` | 700 | `1.02` | `-.03em` | 1184, hoogte en spatiëring van 681 |
| `h2` | `clamp(22px,5.2vw,32px)` | 700 | `1.12` | `-.02em` | 558, spatiëring van 49 |
| `h3` | `19px` | 700 | `1.06` | `-.01em` | 52 |
| `.lead` | `clamp(16px,4.3vw,20px)` | 400 | `1.45` | standaard | 559 |
| `.mono` label | `10.5px` | 400 | standaard | `.16em`, uppercase | 560 |
| `.micro` | `13px` | 400 | standaard | standaard | 686 |
| `button` | `16px` | zie knoppen | standaard | standaard | 67 |

Ook hier geldt de cascade. `h1` staat drie keer in het bestand: regel 50, 557 en
681. Regel 557 wint voor een gewone `h1`, regel 1184 voor `.hero h1`.

De `.mono`-kleur is op regel 786 nog een keer gezet op `rgba(21,42,28,.66)` en dat
wint van `var(--slate)` uit regel 560.

---

## 3. Layout en spacing

### Contentbreedte en centreren

```css
.wrap{max-width:720px;padding:22px 18px calc(112px + var(--safe-b))}   /* regel 549 */
@media(min-width:760px){.wrap{padding:40px 24px 120px}}                /* regel 550 */
```

Regel 46 zet `max-width:760px` en `margin:0 auto`. De `margin` blijft gelden, de
breedte wordt door regel 549 overschreven naar **720px**.

De brede donkere banen breken bewust uit die kolom met een vaste truc:

```css
position:relative;left:50%;margin-left:-50vw;width:100vw   /* o.a. regel 904, 1013, 1031, 1060 */
```

De prijssectie daarbinnen heeft een eigen `max-width:900px;margin:0 auto`
(regel 1032).

### Spacing

Er is **geen strikt 8px-raster**. De feitelijke schaal telt over het hele bestand:

| Waarde | Aantal keer |
| --- | --- |
| `gap:12px` | 21 |
| `padding:20px` | 16 |
| `padding:16px` | 14 |
| `padding:22px` | 13 |
| `gap:10px` | 13 |
| `padding:18px` | 12 |
| `padding:12px` | 12 |

Werkbare vuistregel als je dit overneemt: **stappen van 2px binnen componenten
(10, 12, 14, 16, 18, 20, 22) en van 4 tot 8px tussen secties.**

Ritme tussen blokken:

```css
.week-sectie,.hoe,.trust,.maker{padding-top:34px;padding-bottom:26px}  /* regel 1210 */
.citaat,.prijs-dark{margin-top:44px;margin-bottom:44px}                /* regel 1211 */
.slot-cta{margin-top:44px}                                             /* regel 1212 */
```

Secties:

```css
.wrap > section{border:0;border-radius:var(--r-lg);
  box-shadow:var(--sh-2),inset 0 0 0 1px var(--line-2);
  padding:24px 18px;margin-bottom:20px}                                /* regel 553 */
@media(min-width:760px){.wrap > section{padding:38px 40px;margin-bottom:30px}}  /* regel 554 */
```

---

## 4. Componenten

### Knoppen

Basis, regel 67:

```css
button{font-family:inherit;font-size:16px;cursor:pointer;border-radius:var(--r)}
```

**Primair, `.btn`:**

```css
.btn{background:var(--ink);color:var(--chalk);border:1px solid var(--ink);
     padding:12px 22px;font-weight:600}          /* regel 68 */
.btn{box-shadow:var(--sh-1)}                     /* regel 565 */
@media(hover:hover) and (pointer:fine){
  .btn:hover{background:var(--petrol);transform:translateY(-1px);box-shadow:var(--sh-2)}
}                                                /* regel 567 */
```

**Accent, `.btn-lime`:** twee declaraties, regel 771 wint.

```css
.btn-lime{background:var(--lime);color:var(--limeT);border:0;font-weight:700}  /* regel 771 */
@media(hover:hover) and (pointer:fine){
  .btn-lime:hover{background:#AFD64C}             /* regel 772 */
}
.btn-lime:hover{transform:translateY(-1px);box-shadow:var(--sh-2)}  /* regel 568 */
```

**Secundair, `.btn-ghost`:**

```css
.btn-ghost{background:transparent;color:var(--ink);border:1px solid var(--line);
           padding:11px 18px;font-weight:500}     /* regel 70 */
```

Hover zit overal achter `@media(hover:hover) and (pointer:fine)`, dertien keer in
het bestand. Op aanraakschermen gebeurt er dus niets.

### Kaarten

| Component | Achtergrond | Rand | Radius | Schaduw | Regel |
| --- | --- | --- | --- | --- | --- |
| `.wrap > section` | geen | `inset 0 0 0 1px var(--line-2)` | `var(--r-lg)` 16px | `var(--sh-2)` | 553 |
| `.kaartje` | `var(--veld)` | `1px solid var(--line-2)` | 14px | geen | 213, 773 |
| `.card` | `var(--veld)` | `1px solid var(--line)` plus `border-left:3px solid var(--ink)` | 14px | geen | 241, 776 |
| `.trustkaart` | `var(--chalk)` | `inset 0 0 0 1px var(--line-2)` | 14px | geen | 1026 |
| `.opener` | `var(--ink)` | geen | 20px | `var(--sh-ink)` | 97, 757 |
| `.preview` | `var(--ink)` | geen | `var(--r-lg)` | `var(--sh-ink)` | 704 |

`.card.weak` wisselt alleen de linkerstreep naar `var(--warn)` (regel 242).

Een gekleurde linkerstreep betekent in deze opmaak iets: dit zijn jouw eigen
woorden (`.quote`, `.spiegel`, `.theory`), dit is de stap waar je nu bent
(`.gang li.bezig`), of dit is de sterkte van een kaart (`.card`). Gebruik hem niet
als versiering.

### Formuliervelden

```css
textarea,input[type=text]{width:100%;padding:12px 13px;font-family:inherit;
  font-size:16px;color:var(--ink);background:var(--veld);
  border:1px solid var(--line);border-radius:var(--r)}     /* regel 107 */

textarea,input[type=text]{background:var(--chalk);border:1px solid var(--line);
  border-radius:12px;padding:14px 15px}                    /* regel 759, wint */

textarea:focus,input[type=text]:focus{border-color:var(--ink);
  box-shadow:0 0 0 3px rgba(191,227,95,.35)}               /* regel 760, wint */
```

Effectief dus: witte vulling, radius 12px, padding 14 op 15, en bij focus een
lime ring van 3px op 35 procent. `font-size:16px` blijft staan en dat is bewust:
onder de 16px zoomt iOS in bij focus.

Foutstatus:

```css
.err{border:1px solid var(--warn);color:var(--warn);padding:12px 14px;
     border-radius:var(--r);margin:12px 0;background:#fff}  /* regel 292 */
```

Toetsenbordfocus, algemeen:

```css
:focus-visible{outline:2px solid var(--ink);outline-offset:3px;border-radius:5px}  /* regel 571 */
```

### Iconen

**Geen library.** Veertien inline SVG's, met de hand geschreven. Geen Lucide,
geen Feather, geen icoonfont.

- Interface-iconen: `viewBox="0 0 24 24"`, tien stuks, meestal
  `width="20" height="20"`, `fill="none"`, lijnen met `stroke-width="1.8"` en
  `stroke-linecap="round"`. Voorbeeld op regel 1455.
- Het merkteken: `viewBox="0 0 100 100"`, twee rechthoeken, `21px` in de kop en
  `18px` in de voet (regels 1274 en 1395).
- De bevestigingsanimatie: `viewBox="0 0 80 80"`, `stroke-width="5"` en `"6"`
  (regels 1473 en 1474).

Kleur wordt per SVG hardgecodeerd, niet geërfd van `currentColor`.

---

## 5. Overig

### Schaduwen

```css
--sh-1:0 1px 2px rgba(31,42,26,.05), 0 1px 3px rgba(31,42,26,.05);      /* regel 529 */
--sh-2:0 2px 6px rgba(31,42,26,.05), 0 8px 20px rgba(31,42,26,.07);     /* regel 530 */
--sh-3:0 12px 34px rgba(31,42,26,.11), 0 3px 10px rgba(31,42,26,.06);   /* regel 531 */
--sh-ink:0 14px 36px rgba(31,42,26,.20);                                /* regel 532 */
```

Gebruik: `--sh-1` op knoppen in rust, `--sh-2` op secties en op knoppen bij hover,
`--sh-3` op zwevende elementen, `--sh-ink` alleen onder donkere vlakken.

### Radii

```css
--r:8px;      /* regel 527 */
--r-lg:16px;  /* regel 527 */
```

Losse waarden die daarnaast voorkomen: `12px` op invoervelden (759), `14px` op
kaarten (773, 776, 1026), `20px` op `.opener` (757), `50%` op sliderknoppen.

### Overgangen

```css
--ease:cubic-bezier(.23,1,.32,1);      /* regel 536, standaard */
--spring:cubic-bezier(.34,1.25,.5,1);  /* regel 1181, alleen waar iets mag doorveren */
```

Veelgebruikte duren: `.12s` en `.15s` voor invoer, `.2s` voor kleur, `.25s` tot
`.36s` voor kaarten en modalen, `.5s` voor onthullen bij scrollen, `.75s` voor de
hero-entree, `.9s` voor het weekgrid.

**Alles wat beweegt heeft een uitzondering.** `@media (prefers-reduced-motion:reduce)`
komt tweeëntwintig keer voor. Neem dat mee, het is geen detail.

### Breakpoints

Mobiel eerst, desktop is de afgeleide. Geen vaste schaal, wel deze set:

| Query | Aantal keer |
| --- | --- |
| `@media(min-width:760px)` | 7 |
| `@media(max-width:560px)` | 5 |
| `@media(min-width:920px)` | 4 |
| `@media(min-width:620px)` | 4 |
| `@media(min-width:820px)` | 3 |
| `@media(min-width:640px)` | 3 |
| `@media(max-width:520px)` | 3 |
| `@media(hover:hover) and (pointer:fine)` | 13 |
| `@media (prefers-reduced-motion:reduce)` | 22 |

Wil je dit opschonen bij hergebruik: **560, 760 en 920** dekken vrijwel alles.

### Favicon en merkelementen

```html
<meta name="theme-color" content="#ECEEE6">                                    <!-- regel 7 -->
<link rel="icon" type="image/svg+xml" href="/brand/deskshift-favicon.svg">     <!-- regel 24 -->
<link rel="icon" type="image/png" sizes="32x32" href="/brand/deskshift-favicon-32.png">  <!-- regel 25 -->
<link rel="apple-touch-icon" href="/brand/deskshift-appicoon-180.png">         <!-- regel 26 -->
```

Het woordmerk is tekst, geen afbeelding: `Desk` in `--ink` plus `shift` in een
lichtere tint, met het tweerechthoekige teken ervoor. Zie regel 1274.

---

## Wat je bij hergebruik als eerste opruimt

1. **Voeg de vier `:root`-blokken samen tot één.** De huidige stapeling is
   historie, geen ontwerp, en kost iedere lezer tijd.
2. **Trek het logo gelijk met het palet** of leg vast dat het bewust afwijkt.
3. **Kies één invoerstijl.** Nu staan regel 107 en regel 759 naast elkaar en wint
   de tweede stilzwijgend.
4. **Breng de breakpoints terug tot drie.**
5. **Laat `prefers-reduced-motion` staan.** Dat is het enige onderdeel hier dat je
   niet mag wegsnijden bij het versimpelen.
