// record-video.js
// Neemt video-1.html op en schrijft deskshift-video1.mp4 in dezelfde map.
//
// Gebruik:  node record-video.js
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

const BRON = path.join(__dirname, "video-1.html");
const DOEL = path.join(__dirname, "deskshift-video1.mp4");
const BREEDTE = 1080;
const HOOGTE = 1920;
const FPS = 30;
const SECONDEN = 24; // de animatie loopt tot 22s, daarna blijft het slotbeeld staan

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

(async () => {
  if (!fs.existsSync(BRON)) {
    console.error("video-1.html staat niet in deze map: " + __dirname);
    process.exit(1);
  }
  if (!ffmpegAanwezig()) process.exit(1);

  const totaal = Math.round(SECONDEN * FPS);
  const map = fs.mkdtempSync(path.join(os.tmpdir(), "deskshift-frames-"));
  const exe = browserPad();

  console.log("Browser      : " + (exe || "de eigen browser van puppeteer"));
  console.log("Bron         : " + BRON);
  console.log("Formaat      : " + BREEDTE + "x" + HOOGTE + " op " + FPS + " fps");
  console.log("Beelden       : " + totaal + " (" + SECONDEN + " seconden)");

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: exe || undefined,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--window-size=" + BREEDTE + "," + HOOGTE,
    ],
    defaultViewport: { width: BREEDTE, height: HOOGTE, deviceScaleFactor: 1 },
  });

  try {
    const pagina = await browser.newPage();
    await pagina.setViewport({ width: BREEDTE, height: HOOGTE, deviceScaleFactor: 1 });
    await pagina.goto("file://" + BRON + "?regie", { waitUntil: "load" });

    // Wachten tot het lettertype binnen is, anders staat het eerste stuk in een
    // terugvalletter en zie je de tekst halverwege verspringen.
    await pagina.waitForFunction("window.klaarVoorRegie === true", { timeout: 15000 });

    for (let f = 0; f < totaal; f++) {
      const t = f / FPS;
      await pagina.evaluate((tijd) => window.zetFrame(tijd), t);
      await pagina.screenshot({
        path: path.join(map, String(f).padStart(5, "0") + ".png"),
        clip: { x: 0, y: 0, width: BREEDTE, height: HOOGTE },
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
      "-c:v", "libx264",
      "-preset", "slow",
      "-crf", "18",
      "-pix_fmt", "yuv420p",     // nodig zodat elke speler en elk platform hem aankan
      "-movflags", "+faststart", // begint sneller met spelen bij online plaatsing
      DOEL,
    ], { stdio: "inherit" });
    if (r.status !== 0) { console.error("ffmpeg gaf een fout terug."); process.exit(1); }

    if (!fs.existsSync(DOEL)) {
      console.error("Klaar, maar er staat geen bestand op " + DOEL);
      process.exit(1);
    }
    const mb = (fs.statSync(DOEL).size / 1048576).toFixed(2);
    console.log("Klaar        : " + DOEL + " (" + mb + " MB)");
  } finally {
    try { if (browser.isConnected()) await browser.close(); } catch (e) {}
    fs.rmSync(map, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error("Opnemen mislukt: " + (e && e.message ? e.message : e));
  process.exit(1);
});
