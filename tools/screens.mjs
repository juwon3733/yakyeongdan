// 화면 사진: 타이틀·파티·지도·전투·보상·상점·결과를 1280×720으로 찍어 shots/에 저장한다.
// 전투에서는 카드 한 장 쓰는 순간을 0.1초 간격 6장(shots/combat_seq_1~6.png),
// 공격 카드(atk)를 쓰는 순간 0.1초 간격 6장(shots/atk_seq_1~6.png, 피해 숫자 확인용),
// 턴 끝을 누른 뒤 적 차례를 0.08초 간격 8장(shots/foe_seq_1~8.png).
// 실행: node tools/screens.mjs   (npm run shots, Playwright 필요) — 서버 띄우는 방식은 tools/smoke.mjs와 같다.
import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'shots');
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
await mkdir(OUT, { recursive: true });

const errors = [];
const browser = await chromium.launch();
const fail = msg => { console.error('SCREENS FAIL:', msg); process.exitCode = 1; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const ev = f => page.evaluate(f);
  const cdp = await page.context().newCDPSession(page);
  const screen = () => ev(() => window.__yk.S.G?.screen || window.__yk.S.view);
  // 연출(등장·날아오기)이 가라앉을 틈을 두고 찍는다
  // 마우스가 카드·칩 위에 남으면 확대 카드·도움말이 화면을 가리니 빈 가장자리로 치운다
  const park = () => page.mouse.move(2, 360);
  const shot = async (name, wait = 600) => {
    await park();
    await sleep(wait);
    await page.screenshot({ path: join(OUT, `${name}.png`) });
    console.log(`shots/${name}.png (${await screen()})`);
  };

  await page.goto(`http://127.0.0.1:${port}/?notut&seed=4`);
  await page.waitForSelector('#boot', { state: 'detached', timeout: 30000 });
  await shot('title', 800);

  await page.click('[data-view="party"]');
  for (const k of ['iris', 'brick', 'marta']) await page.click(`[data-pick="${k}"]`);
  await shot('party');

  await page.click('[data-start]');
  await page.waitForSelector('[data-node="0,0"]');
  await shot('map');

  await page.click('[data-node="0,0"]');
  await page.waitForSelector('[data-end]');
  await page.waitForFunction(() => document.querySelector('.hand .card[data-play]') && !document.querySelector('.hand .card.jdraw'));
  await shot('combat', 800);

  // page.screenshot은 한 장에 0.1초가 넘게 걸려 간격이 밀린다 → CDP로 바로 찍어 메모리에 두고, 파일은 다 찍은 뒤에 쓴다
  const burst = async (name, n, gap, note = '') => {
    const t0 = Date.now(), frames = [];
    for (let i = 0; i < n; i++) {
      const at = t0 + i * gap - Date.now();
      if (at > 0) await sleep(at);
      const t = Date.now() - t0;
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
      frames.push({ t, data });
    }
    for (const [i, f] of frames.entries()) await writeFile(join(OUT, `${name}_${i + 1}.png`), Buffer.from(f.data, 'base64'));
    console.log(`shots/${name}_1~${n}.png (${note}찍은 때 ${frames.map(f => f.t).join('·')}ms)`);
    if (frames.some((f, i) => f.t > i * gap + gap * .6)) console.warn(`  ! 찍는 데 오래 걸려 ${gap / 1000}초 간격이 밀림`);
  };
  // 카드 한 장 쓰기: 누르고 → 대상(동료/적) 누르기, 대상이 없으면 카드를 한 번 더. 그 카드가 손패에서 빠졌는지 돌려준다.
  const play = async (card, name, note) => {
    const uid = await card.getAttribute('data-play');
    await card.click();
    if (await page.$('.pm.tg')) await page.click('.pm.tg');
    else if (await page.$('.foe.tg')) { const fs = await page.$$('.foe.tg'); await fs[fs.length - 1].click(); }
    else if (await page.$(`[data-play="${uid}"]`)) await page.click(`[data-play="${uid}"]`);
    await park();
    await burst(name, 6, 100, `카드 ${uid}${note ? ' ' + note : ''}, `);
    if (await page.evaluate(u => window.__yk.S.C?.hand.some(h => String(h.uid) === u), uid)) fail(`카드 ${uid}가 쓰이지 않음`);
  };
  // 연출이 끝나고 손패가 다시 눌릴 수 있을 때까지
  const settle = async () => {
    await page.waitForFunction(() => !window.__yk.S.C || (document.querySelector('[data-end]:not([disabled])') && !document.querySelector('.hand .card.jdraw')), null, { timeout: 15000 });
    await sleep(900);
  };

  // 마지막 누름 직후부터 0.1초 간격으로 6장.
  const card = await page.$('.hand .card:not(.no):not(.down)[data-play]');
  if (!card) fail('전투에서 쓸 수 있는 카드가 없음');
  else await play(card, 'combat_seq');

  // 피해 숫자 확인: 공격 카드(카드 정의에 atk가 있는 것)를 한 장 쓴다
  await settle();
  const atkUid = await ev(async () => {
    const { cardDef, usable } = await import('/js/combat.js');
    const C = window.__yk.S.C;
    const h = C && C.hand.find(h => cardDef(h).atk && usable(h));
    return h ? String(h.uid) : null;
  });
  const atkCard = atkUid && await page.$(`.hand .card[data-play="${atkUid}"]`);
  if (!atkCard) console.warn('  ! 손패에 쓸 수 있는 공격 카드가 없어 atk_seq를 건너뜀');
  else await play(atkCard, 'atk_seq', '공격');

  // 적 차례: 턴 끝을 누른 직후부터 0.08초 간격으로 8장
  await settle();
  if (!await page.$('[data-end]:not([disabled])')) fail('턴 끝 단추를 누를 수 없음');
  else {
    const turn = await ev(() => window.__yk.S.C?.turn);
    await page.click('[data-end]');
    await park();
    await burst('foe_seq', 8, 80, `턴 ${turn} 끝, `);
  }
  await settle();

  await ev(() => window.__yk.win());
  await page.waitForSelector('[data-take]');
  await shot('reward');

  await page.click('[data-take]:not([data-take=""])');
  await page.waitForSelector('[data-node^="1,"]');
  if (await ev(() => window.__yk.node('shop')) !== 'shop') fail('상점에 못 들어감');
  await shot('shop');

  await page.click('[data-leave]');
  await ev(() => { const Y = window.__yk, G = Y.S.G; Y.S.C = null; G.won = true; G.why = 'win'; G.bossKills = 3; G.clock = 330; G.act = 3; G.screen = 'result'; Y.render(); });
  await page.waitForSelector('[data-home]');
  await shot('result', 1200);
  await page.close();
} finally {
  await browser.close();
  server.close();
}
if (errors.length) fail('페이지 오류\n' + errors.join('\n'));
else if (!process.exitCode) console.log('screens OK →', OUT);
