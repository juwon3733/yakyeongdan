// 서비스 워커: 오프라인으로도 하게 (docs/07 「폰·오프라인」).
// - 코드(html·js·css·json): 먼저 네트워크(3초 기다림), 안 되면 캐시. 늦게 온 새 파일이 캐시와 다르면 화면에 「새 버전이 있어요」.
// - 소리·그림·아이콘: 캐시에 있으면 캐시(파일 이름이 안 바뀌는 것들). 처음 받을 때 캐시에 넣는다.
// - 글꼴(Google Fonts): 캐시를 먼저 쓰고 뒤에서 새로 받아 둔다.
// 빌드가 없어서 파일 목록을 따로 두지 않는다: 껍데기만 설치 때 받고, 나머지는 처음 불릴 때 캐시에 쌓인다.
// 이 파일(캐시 규칙)을 바꾸면 CACHE 이름을 올린다 → 옛 캐시를 지우고, 열린 화면에 「새 버전이 있어요」가 뜬다.
const CACHE = 'yk-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'css/game.css', 'js/main.js', 'js/pwa.js', 'icons/icon-192.png', 'icons/icon-512.png'];
const STATIC = /\/(assets\/(audio|chars|cards|cutins|cg|enemies|bg|title|summon|icons|app)|icons|fonts)\//;
const WAIT_MS = 3000;

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.allSettled(SHELL.map(f => c.add(f)));
    // 있는 그림(assets/art.json 목록)은 미리 받아 둔다
    try {
      const r = await fetch('assets/art.json', { cache: 'no-cache' });
      if (r.ok) {
        const list = await r.clone().json();
        await c.put('assets/art.json', r);
        if (Array.isArray(list)) await Promise.allSettled(list.map(f => c.add(`assets/${f}`)));
      }
    } catch (err) { /* 오프라인 설치: 껍데기만 */ }
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k.startsWith('yk-')) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (STATIC.test(url.pathname)) e.respondWith(cacheFirst(req));
    else e.respondWith(networkFirst(req, e));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(staleWhileRevalidate(req, e));
});

async function cacheFirst(req) {
  const c = await caches.open(CACHE);
  const hit = await c.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok && res.status === 200) c.put(req, res.clone()).catch(() => {});
  return res;
}

async function staleWhileRevalidate(req, e) {
  const c = await caches.open(CACHE);
  const hit = await c.match(req);
  const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()).catch(() => {}); return res; });
  if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
  return net;
}

// 주소 뒤 ?seed 등은 무시하고, 화면 열기(navigate)는 index.html 한 곳에 둔다
const keyOf = req => (req.mode === 'navigate' ? new URL('index.html', self.registration.scope).href : req.url.split('?')[0]);
// 리다이렉트된 응답을 그대로 화면 열기에 쓰면 사파리가 거부한다 → 새 응답으로 감싼다
async function clean(res) {
  if (!res.redirected) return res;
  return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers });
}
let told = false;
async function tellUpdate() {
  if (told) return; told = true;
  for (const cl of await self.clients.matchAll({ type: 'window' })) cl.postMessage({ type: 'update' });
}
async function same(a, b) {
  const [x, y] = await Promise.all([a.arrayBuffer(), b.arrayBuffer()]);
  if (x.byteLength !== y.byteLength) return false;
  const u = new Uint8Array(x), v = new Uint8Array(y);
  for (let i = 0; i < u.length; i++) if (u[i] !== v[i]) return false;
  return true;
}

async function networkFirst(req, e) {
  const c = await caches.open(CACHE);
  const key = keyOf(req);
  const cached = await c.match(key);
  const prev = cached?.clone();   // 화면에 cached를 내주면 본문이 쓰이므로, 비교용으로 미리 떼어 둔다
  let late = false;
  const net = (req.mode === 'navigate' ? fetch(req) : fetch(req, { cache: 'no-cache' })).then(async res => {
    if (!res.ok || res.type !== 'basic') return res;
    const good = await clean(res);
    // 캐시로 먼저 보여 준 뒤 늦게 온 파일이 다르면: 새 버전이 있다
    if (late && prev && !(await same(prev, good.clone()).catch(() => true))) tellUpdate();
    await c.put(key, good.clone());
    return good;
  });
  if (!cached) return net;
  const first = await Promise.race([net.catch(() => null), new Promise(r => setTimeout(() => r(null), WAIT_MS))]);
  if (first) return first;
  late = true;
  e.waitUntil(net.catch(() => {}));
  return cached;
}
