// 끝없는 탑 화면 조각: 위 띠 칩 · 결과 화면 · 기록 화면 줄 (js/endless.js, js/data/endless.js)
import { S } from '../run.js';
import { ROSTER } from '../data/roster.js';
import { CHARACTERS } from '../data/characters.js';
import { ENDLESS, isBossGate } from '../data/endless.js';
import { endlessFloor, dawnStacks, endlessRules, endlessStr } from '../endless.js';
import { P, grantEndless, endlessOpen, mvpOf } from '../meta.js';
import { SUMMON } from '../data/gacha.js';
import { fmt, face, esc, charSrc } from './common.js';

// 위 띠: 페이스 칩 대신 층·적 강화·쌓인 규칙
export function endlessChip(G) {
  const fl = endlessFloor(), hp = Math.round(fl * ENDLESS.hpPerFloor * 100);
  const rules = endlessRules().map(r => `「${r.name}」 ${r.text}`).join('\n');
  const tip = `끝없는 탑 ${fl}층. 적 체력 +${hp}%, 시작 힘 +${endlessStr()} (층 ${Math.floor(fl * ENDLESS.strPerFloor)} + 여명 ${dawnStacks()}: 들어선 뒤 밤 시계 ${ENDLESS.dawnMin}분마다 +1).\n탑은 무너지지 않는다. 쌓인 규칙:\n${rules}`;
  return `<span class="chip endchip" data-tip="${esc(tip)}">탑 위 <b>${fl}</b>층 · 힘 +${endlessStr()}</span><span class="chip endrules" data-tip="${esc(rules)}">규칙 ${endlessRules().length}</span>`;
}
// 지도 머리: 층 묶음 이름
export function endlessHead(G) {
  const gate = G.endless.seg * ENDLESS.seg;
  return `끝없는 탑 · ${gate - ENDLESS.seg + 1}~${gate}층 <small class="note">${isBossGate(gate) ? '관문: 보스' : '관문: 강적'}</small>`;
}

// 결과 (끝없는 탑이 끝났을 때)
export function endlessResultView() {
  const G = S.G, E = G.endless, R = grantEndless(G);
  const mvp = mvpOf(G);
  const mc = CHARACTERS[mvp], st = G.stats[mvp];
  const rules = endlessRules().map(r => `<span class="chip" title="${esc(r.text)}">${esc(r.name)}</span>`).join('') || '<span class="note">없음</span>';
  const ach = R.ach?.length ? `<p class="note"><span class="chip">업적</span> ${R.ach.map(a => esc(a.name)).join(', ')} <b>+${R.ach.reduce((t, a) => t + a.r, 0)}</b></p>` : '';
  return `<div class="resultscr endresult">
    <div class="mvp" style="--c:${mc.col}"><img class="px mvpart" src="${charSrc(mvp)}" alt=""><span class="nm">MVP · ${mc.name}</span><span class="note">피해 ${st.dmg} · 방어 ${st.block}${st.heal ? ` · 회복 ${st.heal}` : ''}</span></div>
    <div class="rinfo">
      <h2 style="font-size:20px">끝없는 탑에서 멈췄다</h2>
      <p class="clockbig endfloor">${E.floor}<small>층</small></p>
      <p class="note">${R.newBest ? '<b class="newt">최고 기록</b> · ' : ''}최고 ${R.best}층 · 이 조합 최고 ${R.combo}층 · 탑 위 보스 ${E.bosses}번 · 밤 시계 ${fmt(G.clock)}</p>
      <p class="note">${E.fresh ? '본부에서 새로 올랐다' : '새벽을 넘어 이어 올랐다'} · 쌓인 규칙 ${rules}</p>
      ${G.bestTurn?.dmg ? `<p class="note">최고의 한 턴 <b>${G.bestTurn.dmg}</b></p>` : ''}
      ${ach}
      <table class="shards">${R.lines.map(([t, v], i) => `<tr style="--i:${i}"><td>${t}</td><td>+${v}</td></tr>`).join('')}<tr class="sum" style="--i:${R.lines.length}"><td>얻은 별 조각${E.floor * ENDLESS.shards.perFloor > ENDLESS.shards.cap ? ` <small>(층 상한 ${ENDLESS.shards.cap})</small>` : ''}</td><td>+<b class="countup" data-to="${R.total}">${R.total}</b></td></tr></table>
      <p class="note">지금 별 조각 <b>${P.shards}</b> · ${P.shards >= SUMMON.tenCost ? '<b class="ok10">10연 소환을 할 수 있다</b>' : `10연까지 ${SUMMON.tenCost - P.shards}`}</p>
      <div class="acts"><button type="button" class="primary" data-home>본부로</button><button type="button" data-view="party" data-mode="endless">끝없는 탑 다시</button></div>
    </div></div>`;
}

// 「새벽」 격파 결과 화면의 [더 오르기]
export const climbOnButton = G => G.won && !G.endless && !G.daily && endlessOpen()
  ? `<button type="button" class="endgo" data-endless title="새벽 너머로 계속 오른다. 탑은 무너지지 않지만 층마다 적이 강해지고 규칙이 쌓인다.">더 오르기 · 끝없는 탑</button>` : '';

// 본부 메뉴 버튼
export const endlessMenu = () => endlessOpen()
  ? `<button type="button" data-view="party" data-mode="endless">끝없는 탑 <small>최고 ${P.rec.endlessBest || 0}층</small></button>` : '';

// 기록 화면: 끝없는 탑
export function endlessRecords() {
  if (!endlessOpen()) return '';
  const rows = Object.entries(P.rec.endlessCombo || {}).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([k, v]) => `<tr><td>${k.split('+').map(id => ROSTER[id]?.name || id).join(' · ')}</td><td>${v}층</td></tr>`).join('');
  return `<h3 class="sub">끝없는 탑</h3><p class="note">최고 <b>${P.rec.endlessBest || 0}</b>층 · 탑 위 보스 ${P.rec.endlessBosses || 0}번</p>
    ${rows ? `<table class="odds big">${rows}</table>` : ''}`;
}
