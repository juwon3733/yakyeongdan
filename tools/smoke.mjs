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
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };

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
  migrate: false, pick5: false, exchange: false, metaScreens: false, depth: false, chooseUi: false, daily: false, affix: false, ach: false, history: false,
  fullRun: false, shop: false, bossRelic: false, summon: false, phase: false, dawnClock: false, collapse: false,
  ep1: false, epFight: false, epUnlock: false, moonPick: false, spirit: false, bonds: false,
  tutorial: false, drag: false, settings: false, wipe: false, amb: false, epClock: false, quick: false, qaTop: false, pwa: false, backup: false };

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
  // seed 4·5: M4 새 동료 (루나리아 달 고르기, 시온 정령, 쌍둥이, 인연 줄)
  for (const seed of [1, 2, 3, 4, 5]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(`[seed ${seed}] ${e.message}`));
    const isFont = u => /fonts\.(googleapis|gstatic)\.com/.test(u);
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`[seed ${seed}] ${m.text()}`); });
    page.on('requestfailed', r => { if (!isFont(r.url())) errors.push(`[seed ${seed}] 불러오기 실패 ${r.url()}`); });
    page.on('response', r => { if (r.status() >= 400 && !isFont(r.url())) errors.push(`[seed ${seed}] ${r.status()} ${r.url()}`); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(`http://127.0.0.1:${port}/?notut&seed=${seed}`);
    const party = [['iris', 'brick', 'marta'], ['noel', 'raven', 'marta'], ['brick', 'raven', 'noel'], ['lunaria', 'sion', 'mimimomo'], ['akane', 'iris', 'finn']][seed - 1];
    await openParty(page);
    for (const k of party) await page.click(`[data-pick="${k}"]`);
    if (await page.$('.bond')) seen.bonds = true;
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
    if (await page.$('[data-cmoon="full"]')) { await page.click('[data-cmoon="full"]'); if (await page.evaluate(() => window.__yk.S.G.moon) === 'full' && !(await page.$('[data-cmoon]'))) seen.moonPick = true; }
    if (party.includes('sion') && await page.evaluate(() => window.__yk.S.C.spirits.length > 0)) seen.spirit = true;
    // 쓰러짐 확인용 (seed 1): 앞줄 동료 체력 1, 한 명이 쓰러질 때까지 카드 없이 턴만 넘긴다
    if (seed === 1) {
      await page.evaluate(() => { const G = window.__yk.S.G; G.members[G.formation[0]].hp = 1; });
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
    await page.goto(`http://127.0.0.1:${port}/?notut&seed=7`);
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
    await page.goto(`http://127.0.0.1:${port}/?notut&seed=21`);
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
    // 10연에서 ★5가 나왔으면 처음 ★5라 고르기 화면부터
    if (await page.$('[data-view="pick5"]')) { await page.click('[data-view="pick5"]'); await page.click('[data-choose5]'); }
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
    if (c0 > 100 && c1 > c0) seen.dawnClock = true; else fail(`「새벽」 밤 시계가 안 돎 ${c0} → ${c1}`);
    await page.evaluate(() => { window.__yk.win(); });
    await page.evaluate(() => { const G = window.__yk.S.G; G.screen = 'map'; G.clock = 415; window.__yk.render(); });
    const n = await page.$('[data-node]:not([disabled])'); if (n) await n.click();
    const why = await page.evaluate(() => window.__yk.S.G.screen === 'result' && window.__yk.S.G.why);
    if (why === 'collapse') seen.collapse = true; else fail(`7시가 지나도 탑이 안 무너짐 (${why})`);
    await page.close();
  }
  // 에피소드: 판을 끝내면 1화가 열리고 → 본부 [에피소드] → 1화를 끝까지 넘기기(별 조각 +10). 2화 특별 전투 → 이겨서 끝까지.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(`[ep] ${e.message}`));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`[ep] ${m.text()}`); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(`http://127.0.0.1:${port}/?notut&seed=5`);
    await page.evaluate(() => window.__yk.reset());
    await openParty(page);
    for (const k of ['iris', 'brick', 'marta']) await page.click(`[data-pick="${k}"]`);
    await page.click('[data-start]');
    await page.waitForSelector('[data-node="0,0"]');
    // 바로 지게 해서 결과 화면 → 1화가 열림
    await page.evaluate(() => { const S = window.__yk.S; S.G.clock = 420; window.__yk.render(); });
    const n0 = await page.$('[data-node]:not([disabled])'); if (n0) await n0.click();
    if (await page.$('.epnew') && await page.evaluate(() => window.__yk.P().epProg.iris?.runs === 1)) seen.epUnlock = true;
    else fail('판이 끝났는데 1화가 안 열림');
    await page.click('[data-home]');
    await page.click('[data-view="episodes"]');
    const before = await page.evaluate(() => window.__yk.P().shards);
    await page.click('[data-ep="iris:0"]');
    for (let k = 0; k < 80 && await page.$('[data-epnext]'); k++) await page.click('[data-epnext]');
    const r1 = await page.evaluate(() => ({ ph: window.__yk.S.ep.phase, sh: window.__yk.P().shards, seen: !!window.__yk.P().epSeen['iris:0'] }));
    if (r1.ph === 'end' && r1.seen && r1.sh === before + 10) { seen.ep1 = true; console.log('ep: 아이리스 1화를 끝까지 넘김 (별 조각 +10)'); }
    else fail(`1화를 끝까지 못 넘김 ${JSON.stringify(r1)}`);
    await page.click('[data-eplog]'); await page.click('[data-close]');
    // 2화 특별 전투
    await page.evaluate(() => window.__yk.epUnlock('iris'));
    await page.click('[data-view="episodes"]');
    await page.click('[data-ep="iris:1"]');
    await page.click('[data-epskip]');
    await page.click('[data-epfight]');
    const inFight = await page.evaluate(() => window.__yk.S.G?.screen === 'combat' && !!window.__yk.S.G.episode);
    await playOne(page);
    await page.evaluate(() => window.__yk.win());
    await page.click('[data-epskip]');
    const r2 = await page.evaluate(() => ({ view: window.__yk.S.view, ph: window.__yk.S.ep.phase, G: !!window.__yk.S.G }));
    if (inFight && r2.view === 'ep' && r2.ph === 'end' && !r2.G) { seen.epFight = true; console.log('ep: 아이리스 2화 특별 전투 → 이겨서 끝까지'); }
    else fail(`특별 전투가 이상함 ${JSON.stringify({ inFight, ...r2 })}`);
    await page.close();
  }
  // 판 바깥 (M5): 예전 저장(v1) 이어받기 → 초심자 ★5 고르기 → 교환소 → 동료·도감·기록·확률 화면 → 밤의 깊이 1로 시작
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(`[meta] ${e.message}`));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`[meta] ${m.text()}`); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(`http://127.0.0.1:${port}/?notut&seed=7`);
    const mig = await page.evaluate(() => {
      const P = window.__yk.loadV1({ v: 1, owned: { iris: { stars: 0 }, brick: { stars: 0 }, marta: { stars: 0 }, noel: { stars: 2 } }, shards: 40, dust: 3, items: ['흔한 도구'],
        pulls: 12, pity5: 12, pity4: 0, firstTen: true, got5: false, seenDuos: ['iris+marta'], runs: 2, wins: 0, best: null, sseed: 7, epProg: {}, epSeen: {}, bondOpen: [], bondSeen: [] });
      return { v: P.v, noel: P.owned.noel?.stars, dust: P.dust, rec: !!P.rec, packs: typeof P.packs };
    });
    if (mig.v === 3 && mig.noel === 2 && mig.dust === 3 && mig.rec && mig.packs === 'object') seen.migrate = true; else fail(`v1 저장 이어받기 실패 ${JSON.stringify(mig)}`);
    // 초심자: 30번 안에 ★5 → 고르기 화면
    await page.evaluate(() => { window.__yk.shards(300); window.__yk.S.view = 'summon'; window.__yk.render(); });
    for (let k = 0; k < 3 && !(await page.evaluate(() => window.__yk.P().pick5)); k++) {
      await page.click('[data-summon="10"]'); await page.click('[data-revealall]');
      if (await page.$('[data-view="summon"].primary')) await page.click('[data-view="summon"].primary');
    }
    if (await page.evaluate(() => window.__yk.P().pick5)) {
      if (await page.$('[data-view="pick5"]')) await page.click('[data-view="pick5"]');
      await page.click('[data-choose5="akane"]');
      const ok5 = await page.evaluate(() => ({ owned: !!window.__yk.P().owned.akane, left: window.__yk.P().pick5 }));
      if (ok5.owned && ok5.left === 0 && await page.$('.got.g5')) { seen.pick5 = true; console.log('meta: 초심자 ★5 → 아카네를 직접 고름'); }
      else fail(`초심자 ★5 고르기 실패 ${JSON.stringify(ok5)}`);
    } else fail('30번 안에 ★5가 안 나옴');
    // 교환소: 별가루로 ★3 동료 하나, 시작 도구 하나
    await page.evaluate(() => { window.__yk.dust(200); window.__yk.S.view = 'exchange'; window.__yk.render(); });
    const d0 = await page.evaluate(() => window.__yk.P().dust);
    await page.click('[data-ex="char:dora"]');
    await page.click('[data-ex="relic:umbrella"]');
    const ex = await page.evaluate(() => ({ dora: !!window.__yk.P().owned.dora, umb: window.__yk.P().startRelics.includes('umbrella'), dust: window.__yk.P().dust }));
    if (ex.dora && ex.umb && ex.dust === d0 - 80 - 20 && await page.$('.exmsg')) { seen.exchange = true; console.log('meta: 교환소 → 도라 · 우산'); }
    else fail(`교환소 구매 실패 ${JSON.stringify({ d0, ...ex })}`);
    // 동료 화면: 별자리 4로 두고 의상 갈아입기, 도감 탭 전부, 기록, 확률
    await page.evaluate(() => { window.__yk.stars('iris', 5); window.__yk.S.view = 'mates'; window.__yk.render(); });
    await page.click('[data-mate="iris"]');
    await page.click('[data-costume="iris:1"]');
    const cos = await page.evaluate(() => window.__yk.P().costume.iris === 1 && document.querySelectorAll('.steps li.on').length === 5);
    await page.evaluate(() => { window.__yk.S.view = 'codex'; window.__yk.render(); });
    for (const t of ['mates', 'duos', 'cards', 'foes', 'talks']) await page.click(`[data-ctab="${t}"]`);
    await page.click('[data-ctab="duos"]');
    if (await page.$('[data-replay]')) await page.click('[data-replay]');
    await page.evaluate(() => { window.__yk.S.view = 'records'; window.__yk.render(); window.__yk.S.view = 'odds'; window.__yk.render(); });
    if (cos && await page.$('table.odds')) seen.metaScreens = true; else fail(`동료·도감·기록 화면 확인 실패 (의상 ${cos})`);
    // 밤의 깊이: 한 번 이겼다고 치고 깊이 1 + 시작 도구 우산으로 출발 → 별자리 3 강화 시작 카드, 별자리 4 전용 도구 후보
    await page.evaluate(() => { window.__yk.wins(1); window.__yk.S.view = 'party'; window.__yk.S.picked = []; window.__yk.render(); });
    for (const k of ['iris', 'brick', 'marta']) await page.click(`[data-pick="${k}"]`);
    await page.click('[data-depth="1"]');
    await page.click('[data-srelic="umbrella"]');
    await page.click('[data-start]');
    const run = await page.evaluate(() => { const G = window.__yk.S.G; return { depth: G.depth, relic: G.relics[0], up: G.deck.some(id => id.startsWith('iris.') && id.endsWith('+')), sigs: G.sigs, chip: !!document.querySelector('.depthchip') }; });
    await page.evaluate(() => window.__yk.fight(['anchor'], 'elite'));
    const hp = await page.evaluate(() => { const f = window.__yk.S.C.all[0]; return [f.hp, f.max, f.affixes.includes('giant')]; });
    // 강적에는 속성이 하나 붙는다. 「거대한」이면 체력이 1.4배라 비교에서 뺀다.
    if (run.depth === 1 && run.relic === 'umbrella' && run.up && run.sigs.includes('iris') && run.chip && (hp[2] || hp[1] === Math.round(70 * 1.15 * (await page.evaluate(async () => (await import('/js/data/rules.js')).RULES.foeHpMul[1].elite))))) { seen.depth = true; console.log(`meta: 밤의 깊이 1로 출발 (강적 체력 ${hp[1]}), 시작 도구 우산, 강화 시작 카드`); }
    else fail(`밤의 깊이 시작 실패 ${JSON.stringify({ ...run, hp })}`);
    // 도라 담금질 직접 고르기 · 세바스 남기기 고르기
    await page.evaluate(() => { window.__yk.S.view = 'party'; window.__yk.S.G = null; window.__yk.S.C = null; window.__yk.S.picked = []; window.__yk.render(); });
    await page.click('[data-depth="0"]');
    for (const k of ['dora', 'sebas', 'iris']) await page.click(`[data-pick="${k}"]`);
    await page.click('[data-start]');
    await page.evaluate(() => {
      window.__yk.fight(['ghost'], 'fight');
      const C = window.__yk.S.C;
      C.energy = 9; C.hand = ['dora.temper', 'iris.slash', 'iris.parry', 'seb.tray', 'seb.cane'].map((id, k) => ({ uid: 9000 + k, id }));
      window.__yk.render();
    });
    await page.click('[data-play="9000"]'); if (await page.$('[data-play="9000"]')) await page.click('[data-play="9000"]');
    const ch = await page.evaluate(() => window.__yk.S.C.choose?.kind);
    if (await page.$('[data-temper="9002"]')) await page.click('[data-temper="9002"]');
    const tp = await page.evaluate(() => ({ choose: window.__yk.S.C.choose, id: window.__yk.S.C.hand.find(h => h.uid === 9002)?.id }));
    await page.click('[data-play="9001"]');
    if (await page.$('[data-keepmark]')) await page.click('[data-keepmark]');
    await page.evaluate(() => { window.__yk.S.C.pending = null; window.__yk.render(); });
    await page.click('[data-end]');
    const kept = await page.evaluate(() => window.__yk.S.C ? window.__yk.S.C.hand.some(h => h.uid === 9001) : null);
    if (ch === 'temper' && !tp.choose && tp.id === 'iris.parry+' && kept) { seen.chooseUi = true; console.log('meta: 도라 담금질 고르기 · 세바스 남기기 고르기'); }
    else fail(`담금질·남기기 고르기 실패 ${JSON.stringify({ ch, tp, kept })}`);
    // 적 속성: 숨은(첫 턴 못 고름)·분열(쓰러지면 둘)·수호(다른 적 방어) + 칩·오라
    await page.evaluate(() => window.__yk.axFight(['anchor', 'pirate'], ['hidden', 'split', 'guard'], 'elite'));
    const ax1 = await page.evaluate(() => { const f = window.__yk.S.C.all[0], b = document.querySelector('.foe[data-fi="0"]');
      return { name: f.name, noPick: !b.hasAttribute('data-foe'), chips: document.querySelectorAll('.foe[data-fi="0"] .chip.ax').length, aura: b.classList.contains('affixed') }; });
    await page.evaluate(() => { window.__yk.S.C.pending = null; window.__yk.render(); });
    await page.click('[data-end]');
    const ax2 = await page.evaluate(async () => { const C = window.__yk.S.C; if (!C) return null; const f = C.all[0], m = await import('/js/combat.js');
      const r = { hidden: f.hidden, guarded: C.all[1].dead || C.all[1].block > 0 };
      f.hp = 0; m.killCheck(f); window.__yk.render(); r.n = C.all.length; r.small = C.all.slice(2).every(g => g.small && g.name.startsWith('작은')); return r; });
    if (/숨은/.test(ax1.name) && ax1.noPick && ax1.chips === 3 && ax1.aura && ax2 && !ax2.hidden && ax2.guarded && ax2.n === 4 && ax2.small) { seen.affix = true; console.log(`affix: ${ax1.name} · 숨음 첫 턴 · 수호 방어 · 분열 → 작은 둘`); }
    else fail(`적 속성 실패 ${JSON.stringify({ ax1, ax2 })}`);
    await page.close();
  }
  // 매일의 밤 → 오늘의 시드·규칙으로 출발 → 이겨서 결과(첫 격파 별 조각 +15, 업적 띠, 숙련도) → 기록 화면 최근 판 · 도감 업적 탭
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(`[daily] ${e.message}`));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`[daily] ${m.text()}`); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(`http://127.0.0.1:${port}/?notut`);
    await page.evaluate(() => { window.__yk.reset(); window.__yk.S.view = 'base'; window.__yk.render(); });
    await page.click('[data-view="daily"]');
    const cands = await page.$$eval('[data-dpick]', b => b.map(x => x.dataset.dpick));
    for (const k of cands.slice(0, 3)) await page.click(`[data-dpick="${k}"]`);
    await page.click('[data-dailystart]');
    const st = await page.evaluate(() => { const G = window.__yk.S.G; return { daily: G.daily?.key, mods: !!G.mods, chip: !!document.querySelector('.dailychip'), party: G.party.length }; });
    // 이긴 판으로 끝낸다
    await page.evaluate(() => { const G = window.__yk.S.G; G.won = true; G.why = 'win'; G.bossKills = 3; G.clock = 330; G.bestTurn = { dmg: 120, bursts: [], act: 3 }; G.bigTurns = 1; G.screen = 'result'; window.__yk.render(); });
    const r = await page.evaluate(() => { const P = window.__yk.P(); return { d: Object.values(P.daily)[0], wins: P.life.dailyWins, ach: P.achDone.length, hist: P.history.length, mx: Object.values(P.mxp).length,
      line: [...document.querySelectorAll('.shards td')].some(td => /매일의 밤/.test(td.textContent)), toast: !!document.querySelector('.achtoast'), meta: !!document.querySelector('.metanote') }; });
    if (st.daily && st.mods && st.chip && st.party === 3 && r.d?.won && r.d.best === 330 && r.wins === 1 && r.line && r.meta) { seen.daily = true; console.log(`daily: ${st.daily} 매일의 밤 격파 (첫 격파 별 조각 줄, 숙련도 ${r.mx}명)`); }
    else fail(`매일의 밤 실패 ${JSON.stringify({ st, r })}`);
    if (r.ach >= 3 && r.toast) { seen.ach = true; console.log(`ach: 업적 ${r.ach}개 달성 · 띠 표시`); } else fail(`업적 달성 실패 ${JSON.stringify(r)}`);
    await page.click('[data-home]');
    await page.click('[data-view="records"]');
    const hrows = await page.$$eval('.odds.hist tr', t => t.length);
    await page.click('[data-view="base"]');
    await page.click('[data-view="codex"]');
    await page.click('[data-ctab="ach"]');
    const achOn = await page.$$eval('.ach.on', a => a.length);
    if (r.hist === 1 && hrows === 1 && achOn === r.ach) { seen.history = true; console.log('history: 기록 화면 최근 판 1개 · 도감 업적 탭'); }
    else fail(`판 기록/업적 탭 실패 ${JSON.stringify({ hist: r.hist, hrows, achOn })}`);
    await page.close();
  }
  // M8: 첫 실행 튜토리얼 끝까지 (끌어 놓기 · 대열 · 사건 · 손패 맞춘 듀오 · 작은 보스 → 본부 [별 소환] 안내)
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(`tutorial: ${e.message}`));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(`http://127.0.0.1:${port}/`);
    const ev = f => page.evaluate(f);
    const where = () => ev(() => window.__yk.S.G?.screen || window.__yk.S.view);
    if (await where() !== 'tutintro' || !(await page.$('[data-tutstart]'))) fail('처음 켰을 때 튜토리얼 들어가기 화면이 아님');
    await page.click('[data-tutstart]');
    const tip0 = await ev(() => document.querySelector('.tutbar .tx')?.textContent || '');
    await page.click('[data-node="0,0"]');
    // 끌어 놓기: 첫 카드를 적 위에 놓는다 (손패가 덱에서 날아와 자리 잡은 뒤)
    await page.waitForFunction(() => document.querySelector('.hand .card[data-play]') && !document.querySelector('.hand .card.jdraw'));
    const c = await page.$('.hand .card[data-play]:not(.no)'), f = await page.$('.foe[data-foe]');
    const cb = await c.boundingBox(), fb = await f.boundingBox();
    const hp0 = await ev(() => window.__yk.S.C.all[0].hp);
    await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2); await page.mouse.down();
    await page.mouse.move(cb.x + cb.width / 2, cb.y - 30, { steps: 3 });
    await page.mouse.move(fb.x + fb.width / 2, fb.y + fb.height / 2, { steps: 6 });
    await page.mouse.up();
    const dragged = await ev(() => ({ hp: window.__yk.S.C?.all[0].hp, hand: window.__yk.S.C?.hand.length }));
    if (!(dragged.hp < hp0 && dragged.hand === 4)) fail(`카드 끌어 놓기 실패 ${JSON.stringify({ hp0, dragged })}`);
    else seen.drag = true;
    for (let k = 0; k < 40 && await where() === 'combat'; k++) if (!(await playOne(page))) await page.click('[data-end]');
    await page.click('[data-take]');
    const f0 = await ev(() => window.__yk.S.G.formation.join());
    await page.click('[data-slot="0"]'); await page.click('[data-slot="2"]');
    const f1 = await ev(() => window.__yk.S.G.formation.join());
    await page.click('[data-node="1,0"]');
    const evId = await ev(() => window.__yk.S.G.event?.def.id);
    await page.click('[data-opt="1"]');
    await page.click('[data-node="2,0"]');
    const hand = await ev(() => window.__yk.S.C.hand.slice(0, 3).map(h => h.id).join());
    for (const u of await ev(() => window.__yk.S.C.hand.slice(0, 3).map(h => h.uid))) {
      await page.click(`[data-play="${u}"]`);
      if (await page.$('.foe.tg')) await page.click('.foe.tg'); else if (await page.$(`[data-play="${u}"]`)) await page.click(`[data-play="${u}"]`);
    }
    const duo = await ev(() => window.__yk.S.C?.hand.some(h => h.id === 'duo:iris+marta'));
    for (let k = 0; k < 40 && await where() === 'combat'; k++) if (!(await playOne(page))) await page.click('[data-end]');
    if (await where() === 'reward') await page.click('[data-take]');
    await page.click('[data-node="3,0"]');
    const boss = await ev(() => window.__yk.S.C?.kind === 'boss' && window.__yk.S.C.all[0].key === 'tut_lamp');
    for (let k = 0; k < 80 && await where() === 'combat'; k++) if (!(await playOne(page))) await page.click('[data-end]');
    if (await where() === 'combat') await ev(() => window.__yk.win());
    const done = await where();
    await page.click('[data-tutfinish]');
    const fin = await ev(() => ({ view: window.__yk.S.view, tut: window.__yk.P().tutDone, runs: window.__yk.P().runs, shards: window.__yk.P().shards, hint: !!document.querySelector('button.hint[data-view="summon"]') }));
    const ok = tip0.startsWith('①') && f0 !== f1 && evId === 'child' && hand === 'brick.load,iris.issen,marta.wall' && duo && boss && done === 'tutdone'
      && fin.view === 'base' && fin.tut && fin.runs === 0 && fin.shards === 100 && fin.hint;
    if (ok) { seen.tutorial = true; console.log('tutorial: 첫 밤 끝까지 (끌어 놓기, 대열, 사건, 듀오 「검과 방패」, 작은 보스 → 본부 [별 소환] 안내)'); }
    else fail(`튜토리얼 실패 ${JSON.stringify({ tip0: tip0.slice(0, 3), f0, f1, evId, hand, duo, boss, done, fin })}`);
    // 다시 켜면 튜토리얼 없이 타이틀
    await page.reload();
    if (await where() !== 'title') fail('튜토리얼을 끝낸 뒤에도 들어가기 화면이 나옴');
    // 설정: 음량 · 흔들림 · 애니메이션 줄이기 · 글자 크기 → 저장 → 다시 켜도 그대로
    await page.click('[data-settings]');
    await page.fill('#set-music', '0.3'); await page.dispatchEvent('#set-music', 'input');
    await page.click('[data-set="shake:false"]'); await page.click('[data-set="calm:true"]'); await page.click('[data-set="text:big"]');
    const st = await ev(() => ({ s: JSON.parse(localStorage.getItem('yk-settings')), cls: document.getElementById('stage').className }));
    await page.click('[data-close]');
    await page.reload();
    const st2 = await ev(() => document.getElementById('stage').className);
    if (st.s.music === 0.3 && st.s.shake === false && st.s.calm === true && st.s.text === 'big' && /bigtext/.test(st.cls) && /calm/.test(st.cls) && /noshake/.test(st.cls) && /bigtext/.test(st2)) {
      seen.settings = true; console.log('settings: 음악 30%, 흔들림 끔, 애니메이션 줄임, 글자 크게 → 다시 켜도 유지');
    } else fail(`설정 실패 ${JSON.stringify({ st, st2 })}`);
    // 저장 지우기(두 번 눌러야) → 튜토리얼 들어가기로
    await page.click('[data-settings]');
    await page.click('[data-wipe]');
    const armed = await ev(() => !!document.querySelector('[data-wipe][aria-pressed="true"]') && window.__yk.P().tutDone);
    await page.click('[data-wipe]');
    const wiped = await ev(() => ({ view: window.__yk.S.view, tut: window.__yk.P().tutDone }));
    if (armed && wiped.view === 'tutintro' && !wiped.tut) seen.wipe = true; else fail(`저장 지우기 실패 ${JSON.stringify({ armed, wiped })}`);
    // 건너뛰기 → 타이틀, 환경음은 판 밖에서 파도
    await page.click('[data-tutskip]');
    const amb = await ev(() => window.__yk.audio?.().amb);
    if (await where() === 'title' && amb === 'sea') seen.amb = true; else fail(`건너뛰기·환경음 실패 ${JSON.stringify({ where: await where(), amb })}`);
    // 에피소드 특별 전투: 위 띠에 밤 시계가 없다
    await ev(() => { window.__yk.epUnlock('iris'); window.__yk.ep('iris', 1); });
    if (await page.$('[data-epskip]')) await page.click('[data-epskip]');
    if (await page.$('[data-epfight]')) {
      await page.click('[data-epfight]');
      const top = await ev(() => ({ clock: !!document.querySelector('.topbar .clock'), tag: !!document.querySelector('.topbar .eptag'), amb: window.__yk.audio?.().amb }));
      if (!top.clock && top.tag) seen.epClock = true; else fail(`특별 전투 위 띠 ${JSON.stringify(top)}`);
    } else fail('에피소드 2화 특별 전투까지 못 감');
    await page.close();
  }
  // docs/11 상위 과제: 빠른 사용(한 번 눌러 바로 쓰기, 끄면 두 번), 시간 페이스 표시, 사건·휴식 무대, 결과 진행 막대
  {
    const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
    page.on('pageerror', e => errors.push(`[qa-top] ${e.message}`));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(`http://127.0.0.1:${port}/?notut&seed=6`);
    const ev = f => page.evaluate(f);
    await openParty(page);
    for (const k of ['iris', 'brick', 'marta']) await page.click(`[data-pick="${k}"]`);
    await page.click('[data-start]'); await page.waitForSelector('[data-node="0,0"]');
    const pace = await ev(() => !!document.querySelector('.topbar .chip.pace') && !!document.querySelector('.night u') && !!document.querySelector('.node .m b.pace'));
    const rig = () => ev(() => { window.__yk.fight(['ghost'], 'fight'); const C = window.__yk.S.C; C.energy = 9; C.hand = ['iris.slash', 'iris.slash'].map((id, k) => ({ uid: 9100 + k, id })); window.__yk.render(); });
    await rig();
    await page.click('[data-play="9100"]');
    const once = await ev(() => !window.__yk.S.C.hand.some(h => h.uid === 9100) && window.__yk.S.C.pending == null);
    await page.click('[data-settings]'); await page.click('[data-set="quick:false"]'); await page.click('[data-close]');
    await page.click('[data-play="9101"]');
    const twice = await ev(() => window.__yk.S.C.pending === 9101 && window.__yk.S.C.hand.some(h => h.uid === 9101));
    await page.click('[data-settings]'); await page.click('[data-set="quick:true"]'); await page.click('[data-close]');
    if (once && twice) seen.quick = true; else fail(`빠른 사용 ${JSON.stringify({ once, twice })}`);
    await ev(() => window.__yk.win());
    if (await page.$('[data-take]')) await page.click('[data-take]');
    const scenes = [];
    for (const k of ['event', 'rest']) { await page.evaluate(k2 => window.__yk.node(k2), k); scenes.push(await ev(() => !!document.querySelector('.scene .sport') && !!document.querySelector('.scene .sbox'))); }
    await ev(() => { const Y = window.__yk, G = Y.S.G; Y.S.C = null; G.won = true; G.why = 'win'; G.screen = 'result'; Y.render(); });
    const bar = await ev(() => !!document.querySelector('.runbar .fill') && !!document.querySelector('.countup'));
    if (pace && scenes.every(Boolean) && bar) { seen.qaTop = true; console.log('qa-top: 빠른 사용(켬 한 번 · 끔 두 번), 시간 페이스, 사건·휴식 무대, 결과 진행 막대'); }
    else fail(`qa-top ${JSON.stringify({ pace, scenes, bar })}`);
    await page.close();
  }
  {
    // 폰·오프라인 (js/pwa.js): manifest·아이콘, 서비스 워커 등록, 첫 로딩 화면이 걷힘, 저장 내보내기 → 지우기 → 불러오기 왕복
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', e => errors.push(`[pwa] ${e.message}`));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await page.goto(`http://127.0.0.1:${port}/?notut`);
    const ev = f => page.evaluate(f);
    const man = await ev(async () => {
      const l = document.querySelector('link[rel=manifest]'), m = await (await fetch(l.href)).json();
      const ok = await Promise.all(m.icons.map(i => fetch(new URL(i.src, l.href)).then(r => r.ok)));
      return { name: m.name, orient: m.orientation, display: m.display, icons: ok.length > 0 && ok.every(Boolean) };
    });
    const sw = await ev(() => Promise.race([navigator.serviceWorker.ready.then(r => !!r.active), new Promise(r => setTimeout(() => r(false), 10000))]));
    await page.waitForSelector('#boot', { state: 'detached', timeout: 30000 });
    if (man.name === '야경단' && man.orient === 'landscape' && man.icons && sw) { seen.pwa = true; console.log('pwa: manifest(가로·아이콘) · 서비스 워커 활성 · 첫 로딩 화면 걷힘'); }
    else fail(`pwa ${JSON.stringify({ man, sw })}`);
    // 저장 백업
    await ev(() => window.__yk.shards(123));
    const before = await ev(() => window.__yk.P().shards);
    await page.click('[data-settings]'); await page.click('[data-bexport]');
    const code = await page.inputValue('#backup-code');
    await page.click('[data-close]');
    await ev(() => window.__yk.reset());
    const wiped = await ev(() => window.__yk.P().shards);
    await page.click('[data-settings]'); await page.click('[data-bimport]');
    await page.fill('#backup-in', 'YK2-AAAA-00000000'); await page.click('[data-bapply]');
    const bad = await ev(() => document.querySelector('.backup .bmsg.err')?.textContent || '');
    await page.fill('#backup-in', code.slice(0, -3)); await page.click('[data-bapply]');
    const cut = await ev(() => document.querySelector('.backup .bmsg.err')?.textContent || '');
    await page.fill('#backup-in', code); await page.click('[data-bapply]');
    const armed = await ev(() => !!document.querySelector('[data-bapply][aria-pressed="true"]'));
    await page.click('[data-bapply]');
    const after = await ev(() => ({ shards: window.__yk.P().shards, open: !document.getElementById('modal').hidden }));
    if (/^YK\d+-/.test(code) && wiped !== before && bad && cut && armed && after.shards === before && !after.open) { seen.backup = true; console.log(`backup: 내보내기(${code.length}자) → 지우기 → 잘못된 코드·잘린 코드 거절 → 두 번 눌러 불러오기, 별 조각 ${before} 되찾음`); }
    else fail(`저장 백업 ${JSON.stringify({ code: code.slice(0, 12), before, wiped, bad, cut, armed, after })}`);
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
