// 게임을 가로 화면으로 띄워 파티 고르기 → 대열 바꾸기 → 전투(노림·대열 바꾸기·쓰러짐) → 보상 → 지도까지 오류 없이 도는지 본다.
// 그리고 한 판은 1막 보스(등대지기)까지 끝까지 간다(개발용 치트로 체력 크게): 적 여럿·저주·강화·수 표시·상태·불빛 확인.
// 한 판은 0시부터 「새벽」까지 끝까지(개발용 치트: 전투를 바로 이김) → 결과 → 본부 → 별 소환 10연.
// 따로: 구름 기사단장 2단계, 「새벽」 밤 시계, 7시 붕괴.
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
const seen = { aim: false, swap: false, down: false, ally: false, mapSwap: false, multi: false, curse: false, upgrade: false, num: false, status: false, light: false, act1: false,
  fullRun: false, shop: false, bossRelic: false, summon: false, phase: false, dawnClock: false, collapse: false };

// 전투가 아닌 화면 한 걸음 (지도·보상·휴식·사건·야시장·보스 도구·달 고르기·카드 고르기)
async function advance(page, tag) {
  if (await page.$('[data-moon]')) { await page.click('[data-moon]'); return true; }
  const screen = await page.evaluate(() => window.__yk.S.G.screen);
  if (screen === 'reward') await page.click('[data-take]:not([data-take=""])');
  else if (screen === 'map') { const n = await page.$('[data-node]:not([disabled])'); if (!n) { fail(`${tag}: 갈 수 있는 칸이 없음`); return false; } await n.click(); }
  else if (screen === 'rest') await page.click('[data-rest="heal"]');
  else if (screen === 'event') await page.click('[data-opt]:not([disabled])');
  else if (screen === 'remove') await page.click('[data-rm]');
  else if (screen === 'upgrade') await page.click('[data-up]');
  else if (screen === 'dupe') await page.click('[data-dupe]');
  else if (screen === 'shop') {
    seen.shop = true;
    const buy = await page.$('[data-buycard]:not(.no)');
    if (buy) await buy.click();
    await page.click('[data-leave]');
  }
  else if (screen === 'bossrelic') { seen.bossRelic = true; await page.click('[data-brelic]'); }
  else { fail(`${tag}: 모르는 화면 ${screen}`); return false; }
  return true;
}
async function openParty(page) { await page.click('[data-view="party"]'); }

// 카드 한 장 쓰기: 누르고 → 대상(동료/적) 누르기, 대상이 없으면 카드를 한 번 더
async function playOne(page) {
  const card = await page.$('.card:not(.no):not(.down)[data-play]');
  if (!card) return false;
  const uid = await card.getAttribute('data-play');
  await card.click();
  if (await page.$('.pm.tg')) { seen.ally = true; await page.click('.pm.tg'); }
  else if (await page.$('.foe.tg')) { const fs = await page.$$('.foe.tg'); await fs[fs.length - 1].click(); }
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
    await openParty(page);
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
  // 1막 끝까지: 개발용 치트(체력 크게)로 등대지기까지. 적 여럿·저주·강화·수 표시·상태·불빛도 여기서 본다.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(`[act1] ${e.message}`));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`[act1] ${m.text()}`); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(`http://127.0.0.1:${port}/?seed=7`);
    await openParty(page);
    for (const k of ['iris', 'marta', 'raven']) await page.click(`[data-pick="${k}"]`);
    await page.click('[data-start]');
    await page.waitForSelector('[data-node="0,0"]');
    await page.evaluate(() => {
      const G = window.__yk.S.G;
      for (const p of G.party) { G.members[p].max = 400; G.members[p].hp = 400; }
      G.deck.push('iris.wind', 'raven.fog', 'curse.fog', 'curse.drowsy', 'curse.key', 'curse.lamp', 'curse.lost');
      G.screen = 'rest'; window.__yk.render();
    });
    // 손질(강화)
    await page.click('[data-rest="smith"]');
    await page.click('[data-up]');
    if (await page.evaluate(() => window.__yk.S.G.deck.some(id => id.endsWith('+')))) seen.upgrade = true;
    // 갈매기 셋과 먼저 한 판 (적 여럿)
    await page.evaluate(() => window.__yk.fight(['gull', 'gull', 'gull']));
    const look = async () => {
      if ((await page.$$('.foe.sm')).length >= 3) seen.multi = true;
      if (await page.$('.card.curse')) seen.curse = true;
      if (await page.$('.card .bd b.up, .card .bd b.dn')) seen.num = true;
      if (await page.$('.foe .st .chip')) seen.status = true;
      if (await page.$('.pm.lit')) seen.light = true;
    };
    for (let step = 0; step < 6000; step++) {
      const sc = await page.evaluate(() => { const S = window.__yk.S; return S.G.screen + ':' + S.G.act; });
      const [screen, act] = sc.split(':');
      if (act === '2') { seen.act1 = true; break; }
      if (screen === 'result') { fail('act1: 판이 끝나 버림 ' + await page.evaluate(() => window.__yk.S.G.why)); break; }
      if (screen === 'combat') {
        await look();
        if (!(await playOne(page))) await page.click('[data-end]');
      } else if (!(await advance(page, 'act1'))) break;
    }
    if (seen.act1) console.log('act1: 1막 보스 「등대지기」까지 깨고 2막 지도 OK');
    else fail('1막을 끝까지 못 감');
    await page.close();
  }
  // 한 판 끝까지: 0시 → 「새벽」 격파 → 결과 → 본부 → 별 소환
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(`[full] ${e.message}`));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`[full] ${m.text()}`); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(`http://127.0.0.1:${port}/?seed=21`);
    await openParty(page);
    for (const k of ['iris', 'brick', 'noel']) await page.click(`[data-pick="${k}"]`);
    await page.click('[data-start]');
    await page.waitForSelector('[data-node="0,0"]');
    await page.evaluate(() => { const G = window.__yk.S.G; G.gold = 999; for (const p of G.party) { G.members[p].max = 999; G.members[p].hp = 999; } });
    for (let step = 0; step < 400; step++) {
      const screen = await page.evaluate(() => window.__yk.S.G.screen);
      if (screen === 'result') break;
      if (screen === 'combat') {
        await playOne(page);
        if (await page.evaluate(() => window.__yk.S.G.screen === 'combat')) await page.evaluate(() => window.__yk.win());
        await page.evaluate(() => window.__yk.render());
      } else if (!(await advance(page, 'full'))) break;
      // 시간이 너무 흐르면 7시 붕괴로 끝나 버리니 되돌린다 (끝까지 가는 것을 보려는 점검)
      await page.evaluate(() => { const G = window.__yk.S.G; if (G.clock > 300) G.clock = 300; });
    }
    const r = await page.evaluate(() => ({ won: window.__yk.S.G.won, act: window.__yk.S.G.act, shards: window.__yk.P().shards }));
    if (r.won && await page.$('[data-home]')) { seen.fullRun = true; console.log(`full: 0시 → 「새벽」 격파 → 결과 (별 조각 ${r.shards})`); }
    else fail(`한 판을 끝까지 못 감 ${JSON.stringify(r)}`);
    await page.click('[data-home]');
    await page.click('[data-view="summon"]');
    await page.click('[data-summon="10"]');
    await page.click('[data-revealall]');
    const got = await page.evaluate(() => { const P = window.__yk.P(); return { owned: Object.keys(P.owned), pulls: P.pulls }; });
    if (got.pulls === 10 && (got.owned.includes('noel') || got.owned.includes('raven')) && await page.$('.got')) { seen.summon = true; console.log(`summon: 10연 → ${got.owned.join('·')}`); }
    else fail(`별 소환 결과가 이상함 ${JSON.stringify(got)}`);
    await page.click('[data-view="summon"]');
    // 구름 기사단장 2단계 · 「새벽」 밤 시계 · 7시 붕괴
    await page.click('[data-view="base"]'); await page.click('[data-view="party"]');
    await page.evaluate(() => { window.__yk.S.picked = []; window.__yk.render(); });
    for (const k of ['iris', 'brick', 'marta']) await page.click(`[data-pick="${k}"]`);
    await page.click('[data-start]');
    await page.evaluate(() => { const G = window.__yk.S.G; for (const p of G.party) { G.members[p].max = 999; G.members[p].hp = 999; } });
    await page.evaluate(() => { window.__yk.fight(['captain'], 'boss'); const f = window.__yk.S.C.all[0]; f.hp = 71; window.__yk.render(); });
    for (let k = 0; k < 30 && !(await page.evaluate(() => window.__yk.S.C?.all[0].p2)); k++) {
      if (!(await playOne(page))) await page.click('[data-end]');
      if (await page.evaluate(() => window.__yk.S.G.screen !== 'combat')) break;
    }
    const ph = await page.evaluate(() => { const f = window.__yk.S.C?.all[0]; return f && { p2: f.p2, acts: f.acts, armor: f.armor }; });
    if (ph && ph.p2 && ph.acts === 2 && ph.armor === 0) seen.phase = true; else fail(`기사단장 2단계가 안 됨 ${JSON.stringify(ph)}`);
    const c0 = await page.evaluate(() => { window.__yk.S.G.clock = 100; window.__yk.fight(['dawn'], 'boss'); return window.__yk.S.G.clock; });
    await page.click('[data-end]');
    const c1 = await page.evaluate(() => window.__yk.S.G.clock);
    if (c0 === 110 && c1 >= 120) seen.dawnClock = true; else fail(`「새벽」 밤 시계가 안 돎 ${c0} → ${c1}`);
    await page.evaluate(() => { window.__yk.win(); });
    await page.evaluate(() => { const G = window.__yk.S.G; G.screen = 'map'; G.clock = 415; window.__yk.render(); });
    const n = await page.$('[data-node]:not([disabled])'); if (n) await n.click();
    const why = await page.evaluate(() => window.__yk.S.G.screen === 'result' && window.__yk.S.G.why);
    if (why === 'collapse') seen.collapse = true; else fail(`7시가 지나도 탑이 안 무너짐 (${why})`);
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
