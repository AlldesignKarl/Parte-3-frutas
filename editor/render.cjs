// Renderiza video.html fotograma a fotograma con Chromium (Playwright).
//   node render.cjs --stills 1.5,8.4,30      -> PNGs de prueba en .cache/stills
//   node render.cjs --workers 4              -> todos los fotogramas en .cache/out
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const DIR = __dirname;
const CACHE = path.join(DIR, '.cache');
const URL = 'file://' + path.join(DIR, 'video.html') + '?frames=' + encodeURIComponent('file://' + path.join(CACHE, 'frames') + '/');

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('pageerror:', e.message));
  await page.goto(URL);
  await page.evaluate(() => window.ready);
  const cdp = await page.context().newCDPSession(page);
  return { page, cdp };
}

async function shot({ page, cdp }, t, fmt) {
  await page.evaluate(t => window.renderFrame(t), t);
  const r = await cdp.send('Page.captureScreenshot', fmt === 'png'
    ? { format: 'png' } : { format: 'jpeg', quality: 94, optimizeForSpeed: true });
  return Buffer.from(r.data, 'base64');
}

(async () => {
  const browser = await chromium.launch();
  const stills = opt('stills');
  if (stills) {
    const out = path.join(CACHE, 'stills'); fs.mkdirSync(out, { recursive: true });
    const P = await openPage(browser);
    for (const s of stills.split(',')) {
      const t = parseFloat(s);
      fs.writeFileSync(path.join(out, `t_${t.toFixed(2)}.png`), await shot(P, t, 'png'));
    }
    await browser.close();
    return;
  }
  const out = path.join(CACHE, 'out'); fs.mkdirSync(out, { recursive: true });
  const meta = { FPS: 30, DUR: 67.0 };
  const total = Math.round(meta.DUR * meta.FPS);
  const from = parseInt(opt('from', '0')), to = parseInt(opt('to', String(total)));
  const workers = parseInt(opt('workers', '4'));
  let next = from, done = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async () => {
    const P = await openPage(browser);
    // cada trabajador avanza en bloques contiguos para aprovechar la caché de imágenes
    while (next < to) {
      const a = next; next = Math.min(to, next + 30);
      for (let f = a; f < Math.min(to, a + 30); f++) {
        const buf = await shot(P, f / meta.FPS, 'jpeg');
        fs.writeFileSync(path.join(out, `f_${String(f).padStart(5, '0')}.jpg`), buf);
        done++;
      }
      process.stdout.write(`\r${done}/${to - from} fotogramas · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
  }));
  console.log('\nlisto');
  await browser.close();
})();
