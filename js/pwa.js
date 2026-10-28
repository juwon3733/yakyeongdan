// 폰에서 앱처럼 (docs/07 「폰·오프라인」): 서비스 워커 등록·새 버전 알림, 첫 로딩 화면(소리 미리 받기),
// 전체 화면, 전투 중 화면 꺼짐 방지, 노치(safe-area) 여백, 터치 다듬기(확대·길게 누르기 메뉴·선택 막기), 알림 띠.
// 화면 그리기·규칙과는 따로 논다. main.js가 bootDone()·syncWake()·insets()만 부른다.

// ---------- 알림 띠 (판 바깥, 오른쪽 아래) ----------
let toastEl = null;
export function toast(text, btn, onClick, ms = 0) {
  toastEl?.remove();
  const el = document.createElement('div');
  el.className = 'yk-toast'; el.setAttribute('role', 'status');
  el.innerHTML = `<span></span>${btn ? '<button type="button" class="mini primary"></button>' : ''}<button type="button" class="mini x" aria-label="닫기">×</button>`;
  el.querySelector('span').textContent = text;
  if (btn) { const b = el.querySelector('.primary'); b.textContent = btn; b.onclick = () => { el.remove(); onClick?.(); }; }
  el.querySelector('.x').onclick = () => el.remove();
  document.body.append(el); toastEl = el;
  if (ms) setTimeout(() => el.remove(), ms);
  return el;
}

// ---------- 서비스 워커 ----------
const qs = new URLSearchParams(location.search);
export const swReady = (async () => {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:' || qs.has('nosw')) return null;
  try {
    const reg = await navigator.serviceWorker.register('sw.js');
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (askedReload && !reloading) { reloading = true; location.reload(); } });
    // 캐시로 먼저 보여 준 파일보다 새 파일이 있음 (sw.js networkFirst)
    navigator.serviceWorker.addEventListener('message', e => { if (e.data?.type === 'update') askUpdate(() => location.reload()); });
    // sw.js 자체가 바뀜: 새 워커가 기다리는 중
    const waiting = w => askUpdate(() => { askedReload = true; w.postMessage('skipWaiting'); });
    if (reg.waiting && navigator.serviceWorker.controller) waiting(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) waiting(w); });
    });
    // 오래 켜 둔 화면: 한 시간마다 새 버전 확인
    setInterval(() => reg.update().catch(() => {}), 3600e3);
    return reg;
  } catch (e) { return null; }
})();
let askedReload = false;
function askUpdate(go) { toast('새 버전이 있어요', '새로고침', go); }

// ---------- 첫 로딩 화면: 게임이 뜨면 소리를 미리 받고(진행 막대) 걷는다 ----------
// index.html의 #boot와 그 아래 인라인 스크립트(window.ykBoot: 실패 안내·다시 시도)와 짝.
export async function bootDone() {
  const B = window.ykBoot; if (B) B.ready = true;
  const box = document.getElementById('boot'); if (!box) return;
  const bar = document.getElementById('boot-bar'), msg = document.getElementById('boot-msg'), skip = document.getElementById('boot-skip');
  let done = false;
  const finish = () => { if (done) return; done = true; box.classList.add('out'); setTimeout(() => box.remove(), 260); };
  skip.onclick = finish;
  const skipT = setTimeout(() => { skip.hidden = false; }, 2500);
  let files = [];
  try {
    const m = await (await fetch('assets/audio/manifest.json')).json();
    files = [...Object.keys(m.bgm || {}).map(k => `bgm_${k}.mp3`), ...(m.sfx || []).map(n => `sfx_${n}.wav`), ...(Array.isArray(m.amb) ? m.amb : Object.keys(m.amb || {})).map(k => `amb_${k}.mp3`)];
  } catch (e) { /* 목록을 못 받으면 소리는 쓸 때 받는다 */ }
  let n = 0;
  const step = () => { n++; bar.style.width = `${30 + Math.round(70 * n / Math.max(1, files.length))}%`; msg.textContent = `소리 받는 중… ${n}/${files.length}`; };
  msg.textContent = files.length ? `소리 받는 중… 0/${files.length}` : '준비 완료';
  bar.style.width = '30%';
  const queue = files.slice();
  const worker = async () => { while (queue.length && !done) { const f = queue.shift(); try { const r = await fetch(`assets/audio/${f}`); await r.arrayBuffer(); } catch (e) { /* 오프라인 등: 그냥 넘어간다 */ } step(); } };
  await Promise.race([Promise.all([worker(), worker(), worker(), worker()]), new Promise(r => setTimeout(r, 20000))]);
  clearTimeout(skipT);
  bar.style.width = '100%';
  finish();
}

// ---------- 전체 화면 ----------
const docEl = document.documentElement;
export const canFullscreen = () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
export const isFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
export const isStandalone = () => matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
export async function toggleFullscreen() {
  try {
    if (isFullscreen()) { await (document.exitFullscreen || document.webkitExitFullscreen).call(document); return false; }
    const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
    await req.call(docEl, { navigationUI: 'hide' });
    try { await screen.orientation?.lock?.('landscape'); } catch (e) { /* 잠글 수 없는 기기 */ }
    return true;
  } catch (e) { return isFullscreen(); }
}
// 터치 기기에서 처음 한 번: 전체 화면 권하기 (홈 화면 앱으로 켰으면 안 함)
const touch = matchMedia('(pointer: coarse)').matches;
function offerFullscreen() {
  let asked = false;
  try { asked = sessionStorage.getItem('yk-fsask') === '1'; } catch (e) { /* 저장 안 됨 */ }
  if (asked || !touch || !canFullscreen() || isStandalone() || isFullscreen() || toastEl?.isConnected) return;
  try { sessionStorage.setItem('yk-fsask', '1'); } catch (e) { /* 저장 안 됨 */ }
  toast('전체 화면으로 하면 더 크게 보여요', '전체 화면', () => toggleFullscreen(), 9000);
}

// ---------- 전투 중 화면 꺼짐 방지 (지원하면, 실패는 무시) ----------
let want = false, lock = null, asking = false;
export function syncWake(on) {
  want = !!on;
  if (!('wakeLock' in navigator)) return;
  if (want && !lock && !asking && document.visibilityState === 'visible') {
    asking = true;
    navigator.wakeLock.request('screen').then(l => { lock = l; l.addEventListener('release', () => { lock = null; }); if (!want) l.release().catch(() => {}); })
      .catch(() => {}).finally(() => { asking = false; });
  } else if (!want && lock) { lock.release().catch(() => {}); lock = null; }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncWake(want); });

// ---------- 노치(safe-area) 여백: main.js fit()이 판 자리를 잡을 때 뺀다 ----------
const probe = document.createElement('div');
probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
document.body.append(probe);
export function insets() {
  const s = getComputedStyle(probe);
  return { t: parseFloat(s.paddingTop) || 0, r: parseFloat(s.paddingRight) || 0, b: parseFloat(s.paddingBottom) || 0, l: parseFloat(s.paddingLeft) || 0 };
}

// ---------- 터치 다듬기: 두 번 눌러 확대·손가락 둘 확대·길게 누르기 메뉴·글자 선택 막기 (입력 칸은 그대로) ----------
const editable = t => !!t?.closest?.('input, textarea, [contenteditable]');
addEventListener('contextmenu', e => { if (!editable(e.target)) e.preventDefault(); });
addEventListener('selectstart', e => { if (!editable(e.target)) e.preventDefault(); });
addEventListener('dblclick', e => { if (!editable(e.target)) e.preventDefault(); }, { passive: false });
addEventListener('gesturestart', e => e.preventDefault());   // iOS 손가락 둘 확대
addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
// 두 번 눌러 확대와 누름 지연(300ms)은 css의 touch-action:manipulation이 막는다

setTimeout(offerFullscreen, 1500);
