import { S, isDawn } from '../run.js';
import { reachable, nodeTime } from '../map.js';
import { hasRelic } from '../relics.js';
import { MOONS } from '../data/moons.js';
import { CHARACTERS } from '../data/characters.js';
import { RULES, NODE, ACT_NAME, ROW_NAME } from '../data/rules.js';
import { FOE } from '../data/enemies.js';
import { fmt, face, paceOf, charSrc } from './common.js';
import { artURL, battleArt } from '../art.js';
import { endlessHead } from './endless.js';
import { segStart } from '../endless.js';

// 탑 지도: 아래(1층)에서 위(꼭대기)로 오른다. 칸은 글 상자가 아니라 탑 바깥 돌 난간에 놓인 아이콘, 층 사이는 계단.
// 이름·시간은 고를 수 있는 칸에만 작게, 나머지는 커서를 대면(data-tip). 맨 앞 동료의 전투 스프라이트가 계단을 타고 오른다.
// 탑 그림(bg/tower<막>.png)이 있으면 그 그림, 없으면 코드로 칠한 돌벽.
const TW = 300, NS = 40;
let TH = 318;   // 튜토리얼은 위에 도움말 줄이 있어 낮게(mapView)

// 칸 종류 도트 아이콘(16×16, 2배로 그림). 글자 하나 = 한 픽셀, '.'는 비움.
const ICON = {
  fight: { px: [
    '................', '.s............s.', '.ss..........ss.', '..sss......sss..', '...sss....sss...',
    '....sss..sss....', '.....ssssss.....', '......ssss......', '......ssss......', '.....ssssss.....',
    '...gg.ss.ss.gg..', '....gg....gg....', '...ggg....ggg...', '..bb........bb..', '.bb..........bb.', '................'],
    col: { s: '#dfe6f6', g: '#e0b84a', b: '#8a5a3a' } },
  elite: { px: [
    '................', '.p............p.', '.pp..........pp.', '..pp.wwwwww.pp..', '...pwwwwwwwwp...',
    '...wwwwwwwwwww..', '..wwwwwwwwwwwww.', '..ww...ww...ww..', '..ww.r.ww.r.ww..', '..wwwwwwwwwwww..',
    '...wwwww.wwwww..', '....wwwwwwwww...', '....w.w.w.w.w...', '....wwwwwwwww...', '................', '................'],
    col: { p: '#b06ae0', w: '#ece4f4', r: '#e04a6a' } },
  boss: { px: [
    '................', '................', '..g.....g.....g.', '..gg...ggg...gg.', '..ggg.ggggg.ggg.',
    '..ggggggggggggg.', '..ggggggggggggg.', '..gggrgggjgggrg.', '..ggggggggggggg.', '..ggggggggggggg.',
    '...ggggggggggg..', '................', '..rrrrrrrrrrrrr.', '..rrrrrrrrrrrrr.', '................', '................'],
    col: { g: '#e0b84a', r: '#e04a6a', j: '#7ab0d8' } },
  rest: { px: [
    '.......f........', '.......ff.......', '......fff.......', '......ffff......', '.....fffff......',
    '....fffyfff.....', '....ffyyyff.f...', '...fffyyyfff....', '...ffyyyyyff....', '....fyyyyyf.....',
    '.....fffff......', '..ll.......ll...', '...lll...lll....', '.....lllll......', '...lll...lll....', '..ll.......ll...'],
    col: { f: '#ff8a3a', y: '#ffe08a', l: '#8a5a3a' } },
  event: { px: [
    '................', '.....mmmmmm.....', '....mmmmmmmm....', '...mmm....mmm...', '...mm......mm...',
    '...........mm...', '..........mmm...', '.........mmm....', '........mmm.....', '.......mmm......',
    '.......mm.......', '.......mm.......', '................', '.......mm.......', '.......mm.......', '................'],
    col: { m: '#c9d2f0' } },
  shop: { px: [
    '................', '.....d....d.....', '......dddd......', '.......dd.......', '......oooo......',
    '....oooooooo....', '...oooooooooo...', '..oooooggooooo..', '..ooooggggoooo..', '..oooogddgoooo..',
    '..ooooggggoooo..', '..oooooggooooo..', '...oooooooooo...', '....oooooooo....', '................', '................'],
    col: { o: '#e0a050', d: '#7a4a1a', g: '#ffe08a' } },
};
const ICON_SVG = Object.fromEntries(Object.entries(ICON).map(([k, { px, col }]) => {
  const paths = Object.keys(col).map(ch => {
    let d = '';
    px.forEach((row, y) => [...row].forEach((c, x) => { if (c === ch) d += `M${x} ${y}h1v1h-1z`; }));
    return d ? `<path fill="${col[ch]}" d="${d}"/>` : '';
  }).join('');
  return [k, `<svg class="ic" width="32" height="32" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">${paths}</svg>`];
}));

const LAYER = { dim: 0, open: 1, trail: 2, on: 3 };
// r층 j번째 칸의 발 자리(난간 위 가운데). 아래가 1층.
const foot = (r, j, n, rows) => ({ x: Math.round(TW / 2 + (j - (n - 1) / 2) * Math.min(78, (TW - 70) / Math.max(1, n - 1))), y: Math.round(TH - 22 - r * (TH - 74) / (rows - 1)) });

export function mapView() {
  TH = S.G?.tutorial ? 284 : 318;
  const G = S.G, M = G.map, rows = M.rows.length, can = reachable(G.row);
  const P = M.rows.map((row, r) => row.map((_, j) => foot(r, j, row.length, rows)));
  // 지금 자리에서 앞으로 닿을 수 있는 칸(층마다 번호 모음)
  const reach = M.rows.map(() => new Set());
  if (G.row < rows) can.forEach(j => reach[G.row].add(j));
  for (let r = G.row; r < rows - 1; r++) reach[r].forEach(i => (M.edges[r][i] || []).forEach(j => reach[r + 1].add(j)));
  // 계단: 아래 칸 발 → 반쯤 올라 → 옆으로 → 위 칸 발 (꺾인 도트 길)
  const lines = M.edges.slice(0, -1).flatMap((ed, r) => ed.flatMap((to, i) => to.map(j => {
    const a = P[r][i], b = P[r + 1][j], mid = Math.round((a.y - NS + b.y) / 2);
    // trail = 지나온 길(금색), on = 바로 갈 수 있는 길, open = 그 너머로 이어지는 길, dim = 못 가는 길
    const trail = r + 1 < G.row && G.took[r] === i && G.took[r + 1] === j;
    const on = r + 1 === G.row && G.took[r] === i && can.includes(j);
    const open = r >= G.row && reach[r].has(i);
    const cls = trail ? 'trail' : on ? 'on' : open ? 'open' : 'dim';
    return { cls, svg: `<path ${on ? `data-to="${r + 1},${j}" ` : ''}d="M${a.x} ${a.y - NS}C${a.x} ${mid},${b.x} ${mid},${b.x} ${b.y}" class="${cls}"/>` };
  }))).sort((x, y) => LAYER[x.cls] - LAYER[y.cls]).map(l => l.svg).join('');   // 밝은 길이 흐린 길 위에
  // 층마다 난간(돌 선반) + 층 이름
  const ledges = M.rows.map((row, r) => {
    const xs = P[r].map(p => p.x), y = P[r][0].y;
    return `<i class="ledge${r === rows - 1 ? ' top' : ''}" style="left:${Math.min(...xs) - 30}px;width:${Math.max(...xs) - Math.min(...xs) + 60}px;top:${y}px"></i>
      <span class="rowlabel ${r < G.row ? 'past' : r === G.row ? 'here' : ''}" style="top:${y - 14}px">${r === rows - 1 ? (G.endless ? '관문' : '꼭대기') : `${G.endless ? segStart() + r : r + 1}층`}</span>`;
  }).join('');
  const nodes = M.rows.map((row, r) => row.map((t, j) => {
    const p = P[r][j], ok = r === G.row && can.includes(j), cls = r < G.row ? 'past' : ok ? 'now' : 'future';
    const name = t === 'boss' && M.boss && !G.tutorial && !G.endless ? FOE[M.boss].name : NODE[t].name;
    const when = ok ? ` → ${fmt(G.clock + nodeTime(t))}` : '';
    // 고를 수 있는 칸: 난간 아래에 도착 시각만(종류는 아이콘이, 이름·걸리는 시간은 커서를 대면)
    const tag = ok ? `<span class="tag"><b class="pace ${G.tutorial || G.endless ? '' : paceOf(G, G.clock + nodeTime(t), 1)}">${fmt(G.clock + nodeTime(t))}</b></span>`
      : t === 'boss' ? `<span class="tag boss"><b>${name}</b></span>` : '';
    return `<button type="button" class="node k-${t} ${cls} ${G.took[r] === j ? 'took' : ''}" style="left:${p.x - NS / 2}px;top:${p.y - NS}px" data-tip="${name} · +${nodeTime(t)}분${when}" aria-label="${name} +${nodeTime(t)}분" ${ok ? `data-node="${r},${j}"` : 'disabled'}>
      ${ICON_SVG[t] || ''}${tag}</button>`;
  }).join('')).join('');
  // 파티 맨 앞(쓰러지지 않은) 동료의 전투 스프라이트: 지난 칸(1층이면 탑 문 앞)에 서 있다가, 칸을 고르면 계단을 타고 올라간다(main.js mapMove)
  const lead = G.formation.find(p => !G.members[p]?.down) || G.formation[0];
  const from = G.row > 0 && P[G.row - 1]?.[G.took[G.row - 1]];
  const at = from || { x: 62, y: TH };   // 1층: 탑 왼쪽 아래 바닥(칸·시각을 가리지 않게)
  const spr = lead && (battleArt(lead, 'idle') || charSrc(lead));
  const tok = can.length && lead ? `<span class="maptok" style="left:${at.x}px;top:${at.y}px"><img class="px" src="${spr}" alt=""></span>` : '';
  // 대열 칸: 위→아래 = 앞·가운데·뒤 (지도 오른쪽 판)
  const slots = [0, 1, 2].map(fi => {
    const p = G.formation[fi], c = CHARACTERS[p], Mb = G.members[p];
    return `<button type="button" class="slot ${G.fsel === fi ? 'sel' : ''} ${Mb.down ? 'down' : ''}" style="--c:${c.col}" data-slot="${fi}">
      <span class="row">${ROW_NAME[fi]}</span>${face(p)}<span class="nm">${c.name}</span><span class="hp">${Mb.hp}/${Mb.max}</span></button>`;
  }).join('');
  const peek = hasRelic('star_map') && G.nextMap
    ? `<p class="note peek">별 지도 · 다음 막: ${G.nextMap.rows.slice(0, -1).map(row => row.map(t => NODE[t].name).join('·')).join(' / ')}${G.nextMap.boss ? ` / 보스 <b>${FOE[G.nextMap.boss].name}</b>` : ''}</p>` : '';
  const head = G.note ? `<p class="banner ok">${G.note}</p>`
    : G.endless ? `<p class="note">탑은 무너지지 않는다 · 대신 층마다 적이 강해지고, 밤 시계가 흐를수록 여명이 짙어진다</p>`
    : isDawn() ? `<p class="banner">해가 떴다 · 적이 힘 +${RULES.dawnStartStr}으로 시작, 매 턴 +${RULES.dawnStrPerTurn} · ${fmt(RULES.collapse)}에 탑이 무너진다</p>`
    : `<p class="note moon"><b>${MOONS[G.moon].name}</b> ${moonFits(G) ? moonForParty(G) : '이번 파티에는 효과가 없다.'}</p>`;
  const art = !G.endless && artURL(`bg/tower${G.act}.png`);
  return `<div class="mapwrap towermap a${G.endless ? 'e' : G.act}">
      <div class="mapgrid${art ? ' art' : ''}" style="width:${TW}px;height:${TH}px${art ? `;--tower:url('${new URL(art, location.href).href}')` : ''}">
        <i class="towerbody" aria-hidden="true"></i><i class="spire" aria-hidden="true"></i><i class="door" aria-hidden="true"></i>
        <svg class="edges" width="${TW}" height="${TH}" viewBox="0 0 ${TW} ${TH}" aria-hidden="true">${lines}</svg>${ledges}${nodes}${tok}</div>
      <div class="mapside">
        <h2>${G.endless ? endlessHead(G) : ACT_NAME[G.act]}</h2>${head}${peek}
        <div class="formation"><span class="lbl" data-tip="두 칸을 눌러 자리를 바꾼다. 적은 대개 앞줄부터 노린다.">대열</span>${slots}</div>
      </div>
    </div>`;
}

// 이 달이 이번 파티에 쓸모가 있나: 이름이 적힌 동료가 파티에 있거나, 동료와 상관없는 효과(시간·듀오)면 쓸모 있음
function moonFits(G) {
  const m = MOONS[G.moon]; if (!m) return true;
  const named = Object.values(CHARACTERS).filter(c => m.text.includes(c.name.split('·')[0]));
  return !named.length || m.timeCost || m.duoNeed || named.some(c => G.party.some(p => CHARACTERS[p] === c));
}

// 달 설명은 이번 파티에 있는 동료 이야기만(「시온 정령 피해 +1」처럼 없는 동료 줄이 섞여 나오던 것). 동료 이름이 없는 줄은 모두에게 해당
function moonForParty(G) {
  const names = Object.values(CHARACTERS).map(c => c.name), mine = (G.party || G.formation).map(p => CHARACTERS[p]?.name);
  return MOONS[G.moon].text.split(/(?<=\.)\s*/).filter(t => { const who = names.filter(n => t.includes(n)); return !who.length || who.some(n => mine.includes(n)); })
    .map(t => { const m = /^(.*?)(\s*[+−-]\d+분?\.)$/.exec(t); if (!m || !m[1].includes(', ')) return t;   // 「노엘 마력, 레이븐 독, 브릭 장전 +1.」
      return m[1].split(', ').filter(x => { const w = names.find(n => x.startsWith(n)); return !w || mine.includes(w); }).join(', ') + m[2]; })
    .map(t => t.replace(/([가-힣]+(?:·[가-힣]+)+)(의|이|가)?/g, (all, list, j) => { const keep = list.split('·').filter(n => !names.includes(n) || mine.includes(n)); return keep.length ? keep.join('·') + (j || '') : all; })).join(' ');
}
