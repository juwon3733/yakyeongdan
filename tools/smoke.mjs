// 게임을 띄워 파티 고르기 → 전투 한 판 → 보상 → 지도까지 오류 없이 도는지 본다.
// 실행: node tools/smoke.mjs   (Playwright 필요)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };

const server = http.createServer(async (req, res) => {
  const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  try {
    const body = await readFile(join(ROOT, p || 'index.html'));
    res.writeHead(200, { 'content-type': TYPES[extname(p || 'index.html')] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const errors = [];
const browser = await chromium.launch();
const fail = msg => { console.error('SMOKE FAIL:', msg); process.exitCode = 1; };
try {
  for (const seed of [1, 2, 3]) {
    const page = await browser.newPage({ viewport: { width: 400, height: 900 } });
    page.on('pageerror', e => errors.push(`[seed ${seed}] ${e.message}`));
    const isFont = u => /fonts\.(googleapis|gstatic)\.com/.test(u);
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`[seed ${seed}] ${m.text()}`); });
    page.on('requestfailed', r => { if (!isFont(r.url())) errors.push(`[seed ${seed}] 불러오기 실패 ${r.url()}`); });
    page.on('response', r => { if (r.status() >= 400 && !isFont(r.url())) errors.push(`[seed ${seed}] ${r.status()} ${r.url()}`); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(`http://127.0.0.1:${port}/?seed=${seed}`);
    const party = [['iris', 'brick', 'marta'], ['noel', 'raven', 'iris'], ['brick', 'raven', 'noel']][seed - 1];
    for (const k of party) await page.click(`[data-pick="${k}"]`);
    await page.click('[data-start]');
    await page.waitForSelector('[data-node="0,0"]');
    await page.click('[data-node="0,0"]');
    await page.waitForSelector('[data-end]');
    let screen = 'combat';
    for (let step = 0; step < 400 && screen === 'combat'; step++) {
      const card = await page.$('.card:not(.no)[data-play]');
      if (card) await card.click(); else await page.click('[data-end]');
      screen = await page.evaluate(() => document.querySelector('[data-end]') ? 'combat' : document.querySelector('[data-take]') ? 'reward' : document.querySelector('[data-again]') ? 'result' : 'other');
    }
    if (screen !== 'reward') { fail(`seed ${seed}: 전투 뒤 보상 화면이 아님 (${screen})`); continue; }
    await page.click('[data-take]:not([data-take=""])');
    await page.waitForSelector('[data-node^="1,"]');
    await page.click('[data-deck]');
    await page.click('[data-close]');
    console.log(`seed ${seed}: ${party.join('·')} 전투 → 보상 → 2층 지도 OK`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
if (errors.length) { fail('페이지 오류\n' + errors.join('\n')); }
else if (!process.exitCode) console.log('smoke OK');
