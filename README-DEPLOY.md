# Deskshift live zetten met Claude Code, GitHub en Vercel

Dit bestand kun je letterlijk aan Claude Code voeren ("lees README-DEPLOY.md en voer de stappen uit") of zelf stap voor stap volgen.

## Wat je hebt

```
deploy/
  index.html      <- de hele tool (frontend)
  api/chat.js     <- serverless function die de Anthropic API veilig aanroept
  vercel.json     <- configuratie voor Vercel
```

De front-end praat niet meer rechtstreeks met Anthropic. Hij roept `/api/chat` aan, en die functie stuurt het verzoek met jouw API-sleutel door. De sleutel staat straks alleen in Vercel's environment variables, nooit in de HTML of in Git.

## Stap 1: repo aanmaken en pushen

In de map met deze drie bestanden:

```bash
git init
git add .
git commit -m "Eerste versie Deskshift"
gh repo create deskshift --private --source=. --remote=origin --push
```

Heb je de GitHub CLI (`gh`) niet ingelogd, doe dat eerst met `gh auth login`, of maak de repo handmatig aan op github.com en volg de instructies die GitHub daar toont voor "push an existing repository".

Kies gerust `--private` zolang je nog niet live bent. Zet hem later op `public` of houd hem privé, dat maakt voor Vercel niet uit.

## Stap 2: koppelen aan Vercel

1. Ga naar vercel.com, log in met je GitHub-account
2. "Add New Project" → kies de zojuist aangemaakte repo `deskshift`
3. Vercel herkent automatisch dat `index.html` de site is en dat `api/chat.js` een serverless function is. Je hoeft niets aan de buildinstellingen te wijzigen
4. Klik nog niet op deploy, eerst de environment variable instellen (volgende stap), anders moet je opnieuw deployen

## Stap 3: environment variable instellen

Dit is de belangrijkste stap. Zonder dit werkt de tool niet.

1. In het Vercel-project: Settings → Environment Variables
2. Naam: `ANTHROPIC_API_KEY`
3. Waarde: jouw Anthropic API-sleutel (te vinden of aan te maken via console.anthropic.com, onder API Keys)
4. Omgeving: Production, Preview en Development allemaal aanvinken
5. Save, en dan pas op "Deploy" klikken, of een nieuwe commit pushen zodat Vercel opnieuw bouwt

## Stap 4: testen

Open de tijdelijke Vercel-URL die je krijgt (iets als `deskshift.vercel.app`). Doorloop de intake tot aan een van de AI-stappen, bijvoorbeeld het gratis inzicht. Werkt dat, dan staat de sleutel goed.

Krijg je een foutmelding "Serverconfiguratie ontbreekt", dan mist de environment variable nog, of moet je opnieuw deployen nadat je hem hebt toegevoegd.

## Stap 5: eigen domein koppelen

1. In het Vercel-project: Settings → Domains → voeg `deskshift.pro` toe
2. Vercel toont welke DNS-records je moet instellen (meestal een A-record of CNAME)
3. Ga naar je domeinregistrar (waar je deskshift.pro hebt gekocht), open het DNS-beheer, en voeg de records toe die Vercel toont
4. DNS-wijzigingen kunnen enkele minuten tot een paar uur duren voor ze overal doorkomen

## Later: updates doorvoeren

Elke keer dat je iets aan de tool verandert:

```bash
git add .
git commit -m "omschrijving van de wijziging"
git push
```

Vercel bouwt automatisch een nieuwe versie zodra je naar de hoofdbranch pusht. Geen losse uploadstap nodig.

## Wat je NOOIT moet doen

- De API-sleutel in `index.html` of in `api/chat.js` zetten en committen. Als dat per ongeluk gebeurt: sleutel meteen intrekken in console.anthropic.com en een nieuwe aanmaken, ook als je de commit weer verwijdert. Git-geschiedenis is niet betrouwbaar te wissen zodra iets gepusht is.
- De repo public zetten terwijl de sleutel nog ergens in de bestanden staat.
- Testen op de definitieve `deskshift.pro`-URL voordat de environment variable staat. Test eerst op de tijdelijke Vercel-URL.
