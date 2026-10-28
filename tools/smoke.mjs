// 게임을 가로 화면으로 띄워 파티 고르기 → 대열 바꾸기 → 전투(노림·대열 바꾸기·쓰러짐) → 보상 → 지도까지 오류 없이 도는지 본다.
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
const seen = { aim: false, swap: false, down: false, ally: false, mapSwap: false };

// 카드 한 장 쓰기: 누르고 → 대상(동료/적) 누르기, 대상이 없으면 카드를 한 번 더
async function playOne(page) {
  const card = await page.$('.card:not(.no):not(.down)[data-play]');
  if (!card) return false;
  const uid = await card.getAttribute('data-play');
  await card.click();
  if (await page.$('.pm.tg')) { seen.ally = true; await page.click('.pm.tg'); }
  else if (await page.$('.foe.tg')) await page.click('.foe.tg');
  else if (await page.$(`[data-play="${uid}"]`)) await page.click(`[data-play="${uid}"]`);
  return true;
}
const screenOf = page => page.evaluate(() => document.querySelector('[data-end]') ? 'combat' : document.querySelector('[data-take]') ? 'reward' : document.querySelector('[data-again]') ? 'result' : 'other');

try {
  for (const seed of [1, 2, 3]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(`[seed ${seed}] ${e.message}`));
    const isFont = u => /fonts\.(googleapis|gstatic)\.com/.test(u);
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`[seed ${seed}] ${m.text()}`); });
    page.on('requestfailed', r => { if (!isFont(r.url())) errors.push(`[seed ${seed}] 불러오기 실패 ${r.url()}`); });
    page.on('response', r => { if (r.status() >= 400 && !isFont(r.url())) errors.push(`[seed ${seed}] ${r.status()} ${r.url()}`); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(`http://127.0.0.1:${port}/?seed=${seed}`);
    const party = [['iris', 'brick', 'marta'], ['noel', 'raven', 'marta'], ['brick', 'raven', 'noel']][seed - 1];
    for (const k of party) await page.click(`[data-pick="${k}"]`);
    await page.click('[data-start]');
    await page.waitForSelector('[data-node="0,0"]');

    // 지도에서 대열 바꾸기: 앞(0) ↔ 뒤(2)
    const f0 = await page.evaluate(() => window.__yk.S.G.formation.join());
    await page.click('[data-slot="0"]'); await page.click('[data-slot="2"]');
    const f1 = await page.evaluate(() => window.__yk.S.G.formation.join());
    if (f0 === f1) fail(`seed ${seed}: 지도에서 대열이 안 바뀜`); else seen.mapSwap = true;

    // 동료를 고르는 카드 확인용: 마르타 「고해」를 덱에 여러 장
    if (party.includes('marta')) await page.evaluate(() => { window.__yk.S.G.deck.push('marta.confess', 'marta.confess', 'marta.confess'); });
    await page.click('[data-node="0,0"]');
    await page.waitForSelector('[data-end]');
    // 쓰러짐 확인용 (seed 1): 모든 동료 체력 1, 한 명이 쓰러질 때까지 카드 없이 턴만 넘긴다
    if (seed === 1) {
      await page.evaluate(() => { const G = window.__yk.S.G; for (const p of G.party) G.members[p].hp = 1; });
      for (let t = 0; t < 8 && !(await page.$('.pm.down')); t++) await page.click('[data-end]');
      if (await page.$('.pm.down') && await page.$('.card.down')) seen.down = true;
      await page.evaluate(() => { const G = window.__yk.S.G; for (const p of G.party) if (!G.members[p].down) G.members[p].hp = G.members[p].max; });
    }
    let screen = await screenOf(page);
    for (let step = 0; step < 500 && screen === 'combat'; step++) {
      if (await page.$('.pm.aimed')) seen.aim = true;
      const sw = await page.$('.swap:not([disabled])');
      if (sw && !seen.swap) {
        const a = await page.evaluate(() => window.__yk.S.G.formation.join());
        await sw.click();
        const b = await page.evaluate(() => window.__yk.S.G.formation.join());
        if (a !== b) seen.swap = true;
      }
      if (!(await playOne(page))) await page.click('[data-end]');
      screen = await screenOf(page);
    }
    if (screen !== 'reward') { fail(`seed ${seed}: 전투 뒤 보상 화면이 아님 (${screen})`); await page.close(); continue; }
    const hpOk = await page.evaluate(() => Object.values(window.__yk.S.G.members).every(m => !m.down && m.hp >= 1));
    if (!hpOk) fail(`seed ${seed}: 전투 뒤 쓰러진 동료가 일어나지 않음`);
    await page.click('[data-take]:not([data-take=""])');
    await page.waitForSelector('[data-node^="1,"]');
    await page.click('[data-deck]');
    await page.click('[data-close]');
    console.log(`seed ${seed}: ${party.join('·')} 대열 → 전투 → 보상 → 2층 지도 OK`);
    await page.close();
  }
  // 세로 폰: 돌려 달라는 안내
  const pp = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await pp.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await pp.goto(`http://127.0.0.1:${port}/`);
  if (!(await pp.isVisible('#rotate'))) fail('세로 화면에서 "가로로 돌려 주세요"가 안 보임');
  await pp.close();
} finally {
  await browser.close();
  server.close();
}
for (const [k, v] of Object.entries(seen)) if (!v) fail(`한 번도 확인 못 함: ${k}`);
if (errors.length) { fail('페이지 오류\n' + errors.join('\n')); }
else if (!process.exitCode) console.log('smoke OK', seen);
