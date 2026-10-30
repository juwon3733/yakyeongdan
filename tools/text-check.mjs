// 글자 넘침·겹침 검사: 타이틀·본부·파티·지도·전투·보상·상점·결과·소환·에피소드 화면을 1280×720으로 돌며
// 글자가 든 요소 중 ① scrollWidth > clientWidth+1(가로로 넘침) ② 글자가 다른 글자 요소와 겹침 을 찾아
// 「화면 · 선택자 · 글」로 출력한다. 하나라도 있으면 종료 코드 1.
// 실행: node tools/text-check.mjs   (npm run text, Playwright 필요) — 서버 띄우는 방식은 tools/screens.mjs와 같다.
// 일부러 겹쳐 둔 것(부채꼴 손패의 서로 다른 카드끼리, 업적 알림, 숨긴·투명한 요소, 화면 밖)은 세지 않는다.
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

const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];   // 페이지 오류·화면 이동 실패
const found = [];    // { screen, kind, sel, text, other? }

// 브라우저 안에서 도는 검사. 글자가 바로 들어 있는(공백 아닌 글자 노드를 자식으로 가진) 보이는 요소만 본다.
function inspect() {
  const vw = innerWidth, vh = innerHeight;
  const SKIP = '#achbox, #boot'; // 잠깐 떴다 사라지는 업적 알림은 일부러 화면 위에 덮는다
  const visible = el => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false;
    }
    return true;
  };
  const sel = el => {
    const parts = [];
    for (let e = el; e && e !== document.body && parts.length < 4; e = e.parentElement) {
      let s = e.tagName.toLowerCase();
      if (e.id) { parts.unshift(s + '#' + e.id); break; }
      const cls = [...e.classList].filter(c => !/^j[a-z]/.test(c)).slice(0, 2); // 연출용 j… 클래스는 빼고
      if (cls.length) s += '.' + cls.join('.');
      const data = [...e.attributes].find(a => a.name.startsWith('data-'));
      if (data) s += `[${data.name}${data.value ? `="${data.value.slice(0, 20)}"` : ''}]`;
      parts.unshift(s);
    }
    return parts.join(' > ');
  };
  const items = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|svg|SVG)$/.test(el.tagName)) continue;
    if (el.closest(SKIP)) continue;
    const texts = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
    if (!texts.length || !visible(el)) continue;
    const rects = [];
    for (const t of texts) {
      const r = document.createRange(); r.selectNodeContents(t);
      for (const q of r.getClientRects()) if (q.width > 1 && q.height > 1) rects.push(q);
    }
    // 스크롤·overflow로 잘린 조상 바깥은 안 보이니 그만큼 잘라 낸다(스크롤 목록 아래로 숨은 칸이 겹침으로 잡히지 않게)
    for (let e = el.parentElement; e && e !== document.documentElement && rects.length; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
      const c = e.getBoundingClientRect();
      for (let k = rects.length - 1; k >= 0; k--) {
        const q = rects[k], l = Math.max(q.left, c.left), t = Math.max(q.top, c.top), r = Math.min(q.right, c.right), b = Math.min(q.bottom, c.bottom);
        if (r - l > 1 && b - t > 1) rects[k] = new DOMRect(l, t, r - l, b - t); else rects.splice(k, 1);
      }
    }
    if (!rects.length) continue;
    if (rects.every(q => q.right < 0 || q.bottom < 0 || q.left > vw || q.top > vh)) continue;
    items.push({ el, rects, text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) });
  }
  const out = [];
  // ① 가로 넘침
  for (const it of items) {
    const el = it.el, cs = getComputedStyle(el);
    if (cs.display === 'inline' || cs.display === 'contents') continue; // 인라인은 clientWidth가 0
    if (el.scrollWidth > el.clientWidth + 1) out.push({ kind: '넘침', sel: sel(el), text: it.text, detail: `${el.scrollWidth}>${el.clientWidth}` });
  }
  // ② 겹침: 서로 다른 글자 요소의 글자 상자가 2px 넘게 겹치면. 조상·자손 관계거나, 서로 다른 카드(부채꼴 손패)면 뺀다.
  const card = el => el.closest('.card');
  // 글자 상자(Range)는 글꼴의 위아래 여백까지 잡아 줄 간격이 좁으면 위아래 줄이 살짝 겹쳐 보인다 →
  // 세로로는 작은 쪽 높이의 35%가 넘게 겹칠 때만 겹침으로 친다.
  // 부채꼴 손패처럼 기운 카드 안에서는 글자 상자가 (글자 폭 × sin 기운 각)만큼 위아래로 부푼다 → 그만큼 더 봐준다
  const tilt = el => { const m = el && getComputedStyle(el).transform.match(/^matrix\(([^,]+),\s*([^,]+)/); return m ? Math.abs(+m[2]) / Math.hypot(+m[1], +m[2]) : 0; };
  const hit = (a, b, s = 0) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 &&
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) - Math.min(a.width, b.width) * s > Math.max(2, Math.min(a.height, b.height) * 0.35);
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const A = items[i], B = items[j];
    if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
    const ca = card(A.el), cb = card(B.el);
    if (ca && cb && ca !== cb) continue;
    const s = ca && ca === cb ? tilt(ca) : 0;
    if (A.rects.some(a => B.rects.some(b => hit(a, b, s)))) out.push({ kind: '겹침', sel: sel(A.el), text: A.text, other: `${sel(B.el)} 「${B.text}」` });
  }
  return out;
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const ev = f => page.evaluate(f);
  const park = () => page.mouse.move(2, 360);
  const check = async (name, wait = 900) => {
    await park();
    await sleep(wait);
    const r = await ev(inspect);
    for (const f of r) found.push({ screen: name, ...f });
    console.log(`${name}: ${r.length ? r.length + '건' : '깨끗함'}`);
  };
  // 한 화면이 실패해도 나머지는 계속 본다
  const step = async (name, fn) => { try { await fn(); } catch (e) { errors.push(`${name}: ${e.message.split('\n')[0]}`); console.log(`${name}: 못 감 (${e.message.split('\n')[0]})`); } };

  await page.goto(`http://127.0.0.1:${port}/?notut&seed=4`);
  await page.waitForSelector('#boot', { state: 'detached', timeout: 30000 });
  await ev(() => window.__yk.reset?.());
  await step('타이틀', () => check('타이틀', 1000));
  await step('본부', async () => { await page.click('.titlescr [data-view="base"]'); await check('본부'); });
  await step('파티', async () => {
    await page.click('.h2menu [data-view="party"]:not([data-mode])');
    for (const k of ['iris', 'brick', 'marta']) await page.click(`[data-pick="${k}"]`);
    await check('파티');
  });
  await step('지도', async () => {
    await page.click('[data-start]');
    await page.waitForSelector('[data-node="0,0"]');
    await check('지도', 3000);
  });
  await step('전투', async () => {
    await page.click('[data-node="0,0"]');
    await page.waitForSelector('[data-end]');
    await page.waitForFunction(() => document.querySelector('.hand .card[data-play]') && !document.querySelector('.hand .card.jdraw'));
    await check('전투', 1200);
  });
  await step('보상', async () => {
    await ev(() => window.__yk.win());
    await page.waitForSelector('[data-take]');
    await check('보상', 1500);
  });
  await step('상점', async () => {
    await page.click('[data-take]:not([data-take=""])');
    await page.waitForSelector('[data-node^="1,"]');
    if (await ev(() => window.__yk.node('shop')) !== 'shop') throw new Error('상점에 못 들어감');
    await check('상점');
  });
  await step('결과', async () => {
    await page.click('[data-leave]');
    await ev(() => { const Y = window.__yk, G = Y.S.G; Y.S.C = null; G.won = true; G.why = 'win'; G.bossKills = 3; G.clock = 330; G.act = 3; G.screen = 'result'; Y.render(); });
    await page.waitForSelector('[data-home]');
    await check('결과', 1500);
  });
  await step('소환', async () => {
    await page.click('[data-home]');
    await ev(() => { window.__yk.shards(300); window.__yk.S.view = 'summon'; window.__yk.render(); });
    await page.waitForSelector('[data-summon="10"]');
    await check('소환');
  });
  await step('소환 결과', async () => {
    await page.click('[data-summon="10"]');
    await page.click('[data-revealall]');
    await check('소환 결과', 1500);
  });
  await step('에피소드 목록', async () => {
    await ev(() => { window.__yk.epUnlock('iris'); window.__yk.S.view = 'episodes'; window.__yk.render(); });
    await page.waitForSelector('[data-ep="iris:0"]');
    await check('에피소드 목록');
  });
  await step('에피소드', async () => {
    await page.click('[data-ep="iris:0"]');
    await page.waitForSelector('[data-epnext]');
    await check('에피소드', 1200);
  });
  await step('시즌 랭킹', async () => {
    await ev(() => { window.__yk.S.view = 'ranking'; window.__yk.render(); });
    await page.waitForSelector('.rktop.m1');
    await check('시즌 랭킹');
  });
  await page.close();
} finally {
  await browser.close();
  server.close();
}

if (found.length) {
  console.log(`\n글자 문제 ${found.length}건`);
  for (const f of found) console.log(`[${f.screen}] ${f.kind} ${f.sel}${f.detail ? ` (${f.detail})` : ''}\n    「${f.text}」${f.other ? `\n    ↔ ${f.other}` : ''}`);
}
if (errors.length) console.error('\n화면을 다 못 돎\n' + errors.join('\n'));
if (found.length || errors.length) process.exitCode = 1;
else console.log('\ntext OK');
