// 전투 화면 프레임 재기: 게임을 가로 화면(1280×720)으로 띄워 첫 전투에 들어가
//   ① 가만히 3초  ② 공격 카드 3장 연달아 쓰기  ③ 턴 끝(적 차례)
// 동안 requestAnimationFrame 간격을 재서 구간마다 평균 fps·95% 프레임 시간·가장 긴 프레임(ms)을 표로 낸다.
// 어느 구간이든 95% 프레임 시간이 33ms(30fps)를 넘으면 종료 코드 1.
// 실행: node tools/fps.mjs   (Playwright 필요)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
const LIMIT_P95 = 33;

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
const browser = await chromium.launch();
const wait = ms => new Promise(r => setTimeout(r, ms));

// 페이지 안에서 rAF 간격 모으기
const startRec = page => page.evaluate(() => {
  const R = window.__fps = { gaps: [], last: 0, on: true };
  const step = t => { if (!R.on) return; if (R.last) R.gaps.push(t - R.last); R.last = t; requestAnimationFrame(step); };
  requestAnimationFrame(step);
});
const stopRec = page => page.evaluate(() => { window.__fps.on = false; return window.__fps.gaps; });

function stats(name, gaps) {
  if (!gaps.length) return { 구간: name, 프레임: 0, '평균 fps': '-', 'p95(ms)': '-', '최장(ms)': '-', p95: Infinity };
  const s = [...gaps].sort((a, b) => a - b);
  const sum = s.reduce((a, b) => a + b, 0);
  const p95 = s[Math.min(s.length - 1, Math.ceil(s.length * 0.95) - 1)];
  return { 구간: name, 프레임: s.length, '평균 fps': (1000 * s.length / sum).toFixed(1), 'p95(ms)': p95.toFixed(1), '최장(ms)': s[s.length - 1].toFixed(1), p95 };
}

const rows = [];
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto(`http://127.0.0.1:${port}/?notut&seed=1`);
  // 타이틀 → 본부 → 출격 → 파티 → 지도 → 첫 전투
  if (await page.$('.titlescr [data-view="base"]')) await page.click('.titlescr [data-view="base"]');
  await page.click('.h2menu [data-view="party"]:not([data-mode])');
  for (const k of ['iris', 'brick', 'marta']) await page.click(`[data-pick="${k}"]`);
  await page.click('[data-start]');
  await page.waitForSelector('[data-node="0,0"]');
  await page.click('[data-node="0,0"]');
  await page.waitForSelector('[data-end]');
  if (await page.$('[data-cmoon="full"]')) await page.click('[data-cmoon="full"]');
  // 재는 동안 전투가 끝나지 않게: 적 체력을 크게
  await page.evaluate(() => { for (const f of window.__yk.S.C.all) { f.max = 999; f.hp = 999; } window.__yk.render(); });
  await wait(2500);   // 전투 들어가기 연출이 끝날 때까지

  // ① 가만히 3초
  await startRec(page);
  await wait(3000);
  rows.push(stats('① 가만히 3초', await stopRec(page)));

  // ② 공격 카드 3장 연달아 (아이리스 「베기」를 손패에 3장 넣고 에너지 채움)
  await page.evaluate(() => {
    const C = window.__yk.S.C;
    for (let i = 0; i < 3; i++) C.hand.push({ uid: 98001 + i, id: 'iris.slash' });
    C.energy = Math.max(C.energy, 3);
    window.__yk.render();
  });
  await wait(600);
  const foeHp = () => page.evaluate(() => window.__yk.S.C.all.reduce((t, f) => t + Math.max(0, f.hp), 0));
  const hp0 = await foeHp();
  await startRec(page);
  for (let i = 0; i < 3; i++) {
    const sel = `[data-play="${98001 + i}"]`;
    if (!(await page.$(sel))) { errors.push(`공격 카드 ${i + 1}장째가 손패에 없음`); break; }
    await page.click(sel);
    if (await page.$('.foe.tg')) await page.click('.foe.tg');
    else if (await page.$(sel)) await page.click(sel);
    await wait(150);
  }
  await wait(2000);   // 마지막 카드 연출까지
  rows.push(stats('② 공격 카드 3장', await stopRec(page)));
  if (await foeHp() >= hp0) errors.push('공격 카드를 썼는데 적 체력이 그대로');

  // ③ 턴 끝 → 적 차례
  await startRec(page);
  await page.click('[data-end]');
  await wait(4000);
  rows.push(stats('③ 턴 끝(적 차례)', await stopRec(page)));
  await page.close();
} catch (e) {
  errors.push(String(e?.stack || e));
} finally {
  await browser.close();
  server.close();
}

if (rows.length) console.table(rows.map(({ p95, ...r }) => r));
for (const e of errors) console.error('FPS 오류:', e);
const slow = rows.filter(r => r.p95 > LIMIT_P95);
for (const r of slow) console.error(`FPS 경고: ${r.구간} 95% 프레임 시간 ${r['p95(ms)']}ms > ${LIMIT_P95}ms`);
if (slow.length || errors.length || rows.length < 3) process.exitCode = 1;
else console.log(`FPS OK: 모든 구간 95% 프레임 시간 ${LIMIT_P95}ms 이하`);
