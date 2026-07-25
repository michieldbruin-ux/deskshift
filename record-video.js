// record-video.js
// Neemt video-1.html op en schrijft deskshift-video1.mp4 in dezelfde map.
//
// Gebruik:  node record-video.js                    (video-1.html)
//           node record-video.js tiktok-1.html      (een ander bestand)
//           node record-video.js alles              (alle vier achter elkaar)
//
// De uitvoernaam volgt de bron: video-1.html wordt deskshift-video1.mp4,
// tiktok-1.html wordt deskshift-tiktok1.mp4.
//
// Nodig:
//   - npm install puppeteer puppeteer-screen-recorder   (staan in package.json)
//   - ffmpeg op je PATH, met x264. Op macOS: brew install ffmpeg
//     Controleren met: ffmpeg -encoders | grep libx264
//
// Hoe dit werkt, en waarom niet met een schermrecorder:
//   Een recorder die het browservenster filmt levert beelden aan zodra de pagina
//   verandert, niet op een vast ritme. Tijdens een fade komen er veel beelden en
//   tijdens een stilstaand stuk bijna geen. Zet je die allemaal achter elkaar op
//   30 per seconde, dan rekt en krimpt de timing en klopt de video niet meer.
//   Daarom zetten we hier per frame zelf de klok: video-1.html wordt geopend met
//   ?regie, en voor elk frame vragen we exact het beeld op dat tijdstip. Zo staat
//   iedere regel op de seconde waar hij hoort. De losse beelden gaan daarna in
//   een keer door ffmpeg.

const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync, spawnSync } = require("child_process");
const puppeteer = require("puppeteer");

const BREEDTE = 1080;
const HOOGTE = 1920;
const FPS = 30;
// Renderen op tweemaal de eindmaat en daarna netjes terugschalen. Dat heet
// supersampling: randen van letters worden over vier keer zoveel beeldpunten
// berekend en na het verkleinen is de tekst merkbaar scherper dan wanneer je
// direct op 1080 rastert. Op 1 zetten maakt het sneller maar zachter.
const SCHAAL = 2;

// Welke bestanden er zijn, en hoe lang de opname per bestand duurt. De TikTok-
// bestanden geven hun duur zelf door via window.videoDuur; staat die er niet,
// dan valt hij terug op de waarde hier.
const BEKEND = {
  "video-1.html":  { doel: "deskshift-video1.mp4",  seconden: 24 },
  "tiktok-1.html": { doel: "deskshift-tiktok1.mp4", seconden: 11 },
  "tiktok-2.html": { doel: "deskshift-tiktok2.mp4", seconden: 10.5 },
  "tiktok-3.html": { doel: "deskshift-tiktok3.mp4", seconden: 12.5 },
};

function ffmpegAanwezig() {
  try {
    const uit = execFileSync("ffmpeg", ["-hide_banner", "-encoders"], { encoding: "utf8" });
    if (!/libx264/.test(uit)) {
      console.error("ffmpeg is gevonden, maar zonder libx264. Die is nodig voor mp4.");
      console.error("Op macOS: brew install ffmpeg");
      return false;
    }
    return true;
  } catch (e) {
    console.error("ffmpeg niet gevonden op je PATH. Die is nodig om mp4 te schrijven.");
    console.error("Op macOS: brew install ffmpeg");
    return false;
  }
}

// Chromium: puppeteer gebruikt normaal zijn eigen download. Staat die er niet,
// dan pakken we een browser die al op het systeem staat.
function browserPad() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const kandidaten = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/opt/pw-browsers/chromium/chrome-linux/chrome",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
  ];
  for (const p of kandidaten) { if (fs.existsSync(p)) return p; }
  return null; // dan probeert puppeteer zijn eigen browser
}

async function neemOp(bestand) {
  const BRON = path.join(__dirname, bestand);
  const info = BEKEND[bestand] || {};
  const DOEL = path.join(__dirname, info.doel || bestand.replace(/\.html?$/i, "") + ".mp4");

  if (!fs.existsSync(BRON)) {
    console.error(bestand + " staat niet in deze map: " + __dirname);
    return false;
  }

  const map = fs.mkdtempSync(path.join(os.tmpdir(), "deskshift-frames-"));
  const exe = browserPad();

  console.log("");
  console.log("Bron         : " + bestand);
  console.log("Browser      : " + (exe || "de eigen browser van puppeteer"));
  console.log("Formaat      : " + BREEDTE + "x" + HOOGTE + " op " + FPS + " fps, gerenderd op " + (BREEDTE*SCHAAL) + "x" + (HOOGTE*SCHAAL));

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: exe || undefined,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      "--force-device-scale-factor=" + SCHAAL,
      "--window-size=" + BREEDTE + "," + HOOGTE,
    ],
    defaultViewport: { width: BREEDTE, height: HOOGTE, deviceScaleFactor: SCHAAL },
  });

  try {
    const pagina = await browser.newPage();
    await pagina.setViewport({ width: BREEDTE, height: HOOGTE, deviceScaleFactor: SCHAAL });
    await pagina.goto("file://" + BRON + "?regie", { waitUntil: "load" });

    // Wachten tot het lettertype binnen is, anders staat het eerste stuk in een
    // terugvalletter en zie je de tekst halverwege verspringen.
    await pagina.waitForFunction("window.klaarVoorRegie === true", { timeout: 15000 });

    // Het bestand geeft zijn eigen duur door; anders de waarde uit BEKEND.
    const eigen = await pagina.evaluate(() => (typeof window.videoDuur === "number" ? window.videoDuur : null));
    const seconden = eigen != null ? eigen : (info.seconden || 12);
    const totaal = Math.round(seconden * FPS);
    console.log("Beelden      : " + totaal + " (" + seconden + " seconden)");

    for (let f = 0; f < totaal; f++) {
      const t = f / FPS;
      await pagina.evaluate((tijd) => window.zetFrame(tijd), t);
      await pagina.screenshot({
        path: path.join(map, String(f).padStart(5, "0") + ".png"),
        clip: { x: 0, y: 0, width: BREEDTE, height: HOOGTE }, // in css-pixels; de schaal verdubbelt de beeldpunten
      });
      if (f % 60 === 0) {
        const pct = Math.round((f / totaal) * 100);
        process.stdout.write("\r  beelden maken: " + pct + "%   ");
      }
    }
    process.stdout.write("\r  beelden maken: 100%   \n");
    await browser.close();

    console.log("  ffmpeg: samenvoegen naar mp4");
    const r = spawnSync("ffmpeg", [
      "-y", "-v", "error",
      "-framerate", String(FPS),
      "-i", path.join(map, "%05d.png"),
      // Terugschalen van 2x naar de eindmaat met lanczos: scherpere randen dan de
      // standaard bicubic, zonder halo's.
      "-vf", "scale=" + BREEDTE + ":" + HOOGTE + ":flags=lanczos",
      "-c:v", "libx264",
      "-preset", "veryslow",     // meer rekentijd, kleiner bestand bij gelijke kwaliteit
      "-crf", "12",              // lager is scherper; ruime marge voor de hercodering van TikTok en Instagram
      "-tune", "animation",      // vlakke kleurvlakken met harde randen, precies dit
      "-pix_fmt", "yuv420p",     // nodig zodat elke speler en elk platform hem aankan
      "-movflags", "+faststart", // begint sneller met spelen bij online plaatsing
      DOEL,
    ], { stdio: "inherit" });
    if (r.status !== 0) { console.error("ffmpeg gaf een fout terug."); return false; }

    if (!fs.existsSync(DOEL)) {
      console.error("Klaar, maar er staat geen bestand op " + DOEL);
      return false;
    }
    const mb = (fs.statSync(DOEL).size / 1048576).toFixed(2);
    console.log("Klaar        : " + path.basename(DOEL) + " (" + mb + " MB)");
    return true;
  } finally {
    try { if (browser.isConnected()) await browser.close(); } catch (e) {}
    fs.rmSync(map, { recursive: true, force: true });
  }
}

(async () => {
  if (!ffmpegAanwezig()) process.exit(1);

  const arg = process.argv[2];
  const lijst = !arg ? ["video-1.html"]
    : arg === "alles" ? Object.keys(BEKEND)
    : [arg];

  let mis = 0;
  for (const bestand of lijst) {
    const gelukt = await neemOp(bestand);
    if (!gelukt) mis++;
  }
  console.log("");
  if (mis) { console.error(mis + " van " + lijst.length + " mislukt."); process.exit(1); }
  console.log(lijst.length === 1 ? "Klaar." : "Alle " + lijst.length + " video's staan klaar.");
})().catch((e) => {
  console.error("Opnemen mislukt: " + (e && e.message ? e.message : e));
  process.exit(1);
});
