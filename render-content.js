// render-content.js
// Rendert alles in content/bron/ naar content/instagram/ en content/tiktok/.
//
// Gebruik:  node render-content.js            (alles wat nog niet klaar is)
//           node render-content.js --opnieuw  (ook wat er al staat)
//
// Nodig: puppeteer en ffmpeg met libx264. Zie record-video.js voor details.
//
// Kwaliteit staat op het maximum dat zin heeft:
//   - Video's worden gerenderd op 2160x3840 en teruggeschaald naar 1080x1920 met
//     lanczos. Letterranden worden zo over vier keer zoveel beeldpunten berekend
//     (supersampling), wat merkbaar scherper is dan direct op 1080 rasteren.
//   - Vierkante posts gaan zelfs op 3240x3240 en dan terug naar 1080x1080. Een
//     stilstaand beeld mag die extra rekentijd hebben.
//   - crf 10 met preset veryslow en tune animation: ruime marge, zodat de
//     hercodering van TikTok en Instagram er niets zichtbaars van afhaalt.
//
// Waarom niet met een schermrecorder: zie de uitleg in record-video.js. Kort:
// die levert beelden zodra de pagina verandert en niet op een vast ritme, en dan
// rekt en krimpt de timing. Hier zet het script per frame zelf de klok.

const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync, spawnSync } = require("child_process");
const puppeteer = require("puppeteer");

const WORTEL = path.join(__dirname, "content");
const FPS = 30;
const SCHAAL_VIDEO = 2;
const SCHAAL_POST = 3;
const CRF = "10";

function ffmpegAanwezig() {
  try {
    const uit = execFileSync("ffmpeg", ["-hide_banner", "-encoders"], { encoding: "utf8" });
    if (!/libx264/.test(uit)) {
      console.error("ffmpeg gevonden, maar zonder libx264. Op macOS: brew install ffmpeg");
      return false;
    }
    return true;
  } catch (e) {
    console.error("ffmpeg niet gevonden op je PATH. Op macOS: brew install ffmpeg");
    return false;
  }
}

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
  return null;
}

// Een vierkante post: één beeld, ruim gerenderd en netjes teruggeschaald.
// De maat van een post staat in het veld "soort", bijvoorbeeld "post 1080x1350".
// Niet meer hardgecodeerd vierkant: 4:5 pakt in de tijdlijn meer schermruimte,
// en zonder deze uitlezing werd de onderkant van zo'n beeld afgesneden.
function postMaat(item) {
  const m = /(\d{3,4})\s*[x×]\s*(\d{3,4})/.exec(item.soort || "");
  if (m) return { b: parseInt(m[1], 10), h: parseInt(m[2], 10) };
  return { b: 1080, h: 1080 };
}

async function rendersPost(browser, item) {
  const { b: breed, h: hoog } = postMaat(item);
  const pagina = await browser.newPage();
  try {
    await pagina.setViewport({ width: breed, height: hoog, deviceScaleFactor: SCHAAL_POST });
    await pagina.goto("file://" + item.bron, { waitUntil: "load" });
    await pagina.waitForFunction("window.klaarVoorRegie === true", { timeout: 15000 });
    const tijdelijk = item.doel.replace(/\.png$/, "-groot.png");
    await pagina.screenshot({ path: tijdelijk, clip: { x: 0, y: 0, width: breed, height: hoog } });
    const r = spawnSync("ffmpeg", [
      "-y", "-v", "error", "-i", tijdelijk,
      "-vf", "scale=" + breed + ":" + hoog + ":flags=lanczos",
      item.doel,
    ], { stdio: "inherit" });
    fs.rmSync(tijdelijk, { force: true });
    if (r.status !== 0 || !fs.existsSync(item.doel)) return false;
    return true;
  } finally {
    await pagina.close();
  }
}

// Een verticale video: frame voor frame, met de klok in eigen hand.
async function rendersVideo(browser, item) {
  const B = 1080, H = 1920;
  const map = fs.mkdtempSync(path.join(os.tmpdir(), "deskshift-frames-"));
  const pagina = await browser.newPage();
  try {
    await pagina.setViewport({ width: B, height: H, deviceScaleFactor: SCHAAL_VIDEO });
    await pagina.goto("file://" + item.bron + "?regie", { waitUntil: "load" });
    await pagina.waitForFunction("window.klaarVoorRegie === true", { timeout: 15000 });

    const eigen = await pagina.evaluate(() => (typeof window.videoDuur === "number" ? window.videoDuur : null));
    const seconden = eigen != null ? eigen : item.duur;
    const totaal = Math.round(seconden * FPS);

    for (let f = 0; f < totaal; f++) {
      await pagina.evaluate((tijd) => window.zetFrame(tijd), f / FPS);
      await pagina.screenshot({
        path: path.join(map, String(f).padStart(5, "0") + ".png"),
        clip: { x: 0, y: 0, width: B, height: H },
      });
    }
    await pagina.close();

    const r = spawnSync("ffmpeg", [
      "-y", "-v", "error",
      "-framerate", String(FPS),
      "-i", path.join(map, "%05d.png"),
      "-vf", "scale=" + B + ":" + H + ":flags=lanczos",
      "-c:v", "libx264",
      "-preset", "veryslow",
      "-crf", CRF,
      "-tune", "animation",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      item.doel,
    ], { stdio: "inherit" });
    if (r.status !== 0 || !fs.existsSync(item.doel)) return false;
    return true;
  } finally {
    try { if (!pagina.isClosed()) await pagina.close(); } catch (e) {}
    fs.rmSync(map, { recursive: true, force: true });
  }
}

(async () => {
  if (!ffmpegAanwezig()) process.exit(1);
  const lijstPad = path.join(WORTEL, "overzicht.json");
  if (!fs.existsSync(lijstPad)) {
    console.error("content/overzicht.json ontbreekt. Maak eerst de bronbestanden.");
    process.exit(1);
  }
  const items = JSON.parse(fs.readFileSync(lijstPad, "utf8"));
  const opnieuw = process.argv.includes("--opnieuw");
  const todo = items.filter((i) => opnieuw || !fs.existsSync(i.doel));

  console.log("Te renderen   : " + todo.length + " van " + items.length);
  console.log("Video's       : 1080x1920, gerenderd op " + (1080 * SCHAAL_VIDEO) + "x" + (1920 * SCHAAL_VIDEO) + ", crf " + CRF);
  console.log("Posts         : maat uit het veld soort, gerenderd op " + SCHAAL_POST + "x en teruggeschaald met lanczos");
  if (!todo.length) { console.log("Niets te doen."); return; }

  const exe = browserPad();
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: exe || undefined,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
  });

  let klaar = 0, mis = 0;
  try {
    for (const item of todo) {
      const naam = path.basename(item.doel);
      process.stdout.write("  " + String(klaar + mis + 1).padStart(2) + "/" + todo.length + "  " + naam + " ... ");
      const gelukt = item.duur == null ? await rendersPost(browser, item) : await rendersVideo(browser, item);
      if (gelukt) {
        const kb = Math.round(fs.statSync(item.doel).size / 1024);
        console.log("klaar (" + kb + " KB)");
        klaar++;
      } else {
        console.log("MISLUKT");
        mis++;
      }
    }
  } finally {
    await browser.close();
  }
  console.log("");
  console.log("Gereed: " + klaar + (mis ? ", mislukt: " + mis : ""));
  if (mis) process.exit(1);
})().catch((e) => {
  console.error("Renderen mislukt: " + (e && e.message ? e.message : e));
  process.exit(1);
});
