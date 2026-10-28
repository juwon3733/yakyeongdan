// 매일의 밤 화면 · 업적 도감 탭 · 최근 판 기록 (docs/05_meta.md §1·§9·§11)
import { S } from '../run.js';
import { ROSTER } from '../data/roster.js';
import { CHARACTERS } from '../data/characters.js';
import { MOONS } from '../data/moons.js';
import { ACHIEVEMENTS, ACH_GROUP } from '../data/achievements.js';
import { DAILY_SHARDS } from '../data/daily.js';
import { MASTERY_XP } from '../data/mastery.js';
import { P, owns, dailyToday, mastery } from '../meta.js';
import { stars, fmt, esc, charSrc } from './common.js';
import { moonImg } from './sprites.js';

const ACT = { 1: '1막', 2: '2막', 3: '3막' };
const head = () => `<div class="bhead"><button type="button" class="mini" data-view="base">‹ 본부</button><span class="wallet"><b>별 조각 ${P.shards}</b> · 별가루 ${P.dust}</span></div>`;

export function dailyView() {
  const D = dailyToday(), picked = (S.dpicked || []).filter(k => D.cands.includes(k));
  const mates = D.cands.map(k => {
    const r = ROSTER[k], c = CHARACTERS[k], on = picked.includes(k);
    return `<button type="button" class="mate dmate r${r.rarity} ${on ? 'on' : ''}" style="--c:${r.col}" data-dpick="${k}" aria-pressed="${on}" title="${esc(`${c.passive.name}: ${c.passive.text}`)}">
      <img class="px" src="${charSrc(k)}" alt=""><span class="tx"><span class="nm">${r.name}</span> <span class="stars">${stars(r.rarity)}</span>
      <span class="rl">${r.role} · 체력 ${c.maxHp}${owns(k) ? '' : ' · <b class="borrow">빌린 동료</b>'}</span></span></button>`;
  }).join('');
  const rec = D.rec;
  const past = Object.entries(P.daily).filter(([k]) => k !== D.key).sort((a, b) => b[0] < a[0] ? -1 : 1).slice(0, 7)
    .map(([k, v]) => `<tr><td>${k.slice(5).replace('-', '/')}</td><td>${v.won ? `격파 ${fmt(v.best)}` : `실패 · ${v.tries}번`}</td></tr>`).join('');
  return `<div class="dailyscr">
    <div class="dleft">${head()}
      <h2>매일의 밤 <small class="note">${D.key.replace(/-/g, '.')}</small></h2>
      <div class="drule"><span class="chip">오늘의 규칙</span><b>${esc(D.rule.name)}</b><p>${esc(D.rule.text)}</p></div>
      <p class="note"><img class="px moon" src="${moonImg(D.moon)}" alt=""> 달 <b>${MOONS[D.moon].name}</b> · ${esc(MOONS[D.moon].text)}</p>
      <p class="note">지도·달·보상이 날짜로 정해진다. 오늘 누구나 같은 밤을 오른다. 동료 후보 여섯 중 셋을 고른다(없는 동료는 빌려 온다).</p>
      <div class="pick dpick">${mates}</div>
    </div>
    <div class="dright">
      <h2>오늘 기록</h2>
      <p class="dbest">${rec?.won ? `<b>${fmt(rec.best)}</b> 도착 · 오늘 격파 완료` : rec ? `아직 못 깼다 · ${rec.tries}번 도전` : '아직 도전 안 함'}</p>
      <p class="note">${rec?.won ? '다시 올라 더 빠른 도착을 노릴 수 있다(보상은 하루 한 번).' : `처음 깨면 별 조각 <b>+${DAILY_SHARDS}</b>.`}</p>
      <button type="button" class="primary go" data-dailystart ${picked.length === 3 ? '' : 'disabled'}>오늘 밤 오르기 (${picked.length}/3)</button>
      <h3 class="sub">지난 날</h3>
      <table class="odds big">${past || '<tr><td class="note">아직 없다</td><td></td></tr>'}</table>
      <p class="note small">매일의 밤을 깬 날 ${P.life.dailyWins}일</p>
    </div></div>`;
}

// 도감 「업적」 탭
export function achTab() {
  const done = new Set(P.achDone);
  const groups = Object.entries(ACH_GROUP).map(([g, gn]) => {
    const L = ACHIEVEMENTS.filter(a => a.g === g);
    return `<h3 class="sub">${gn} <small>${L.filter(a => done.has(a.id)).length}/${L.length}</small></h3><div class="achgrid">${L.map(a =>
      `<div class="ach ${done.has(a.id) ? 'on' : ''}"><b>${esc(a.name)}</b><small>${esc(a.text)}</small><i>별 조각 ${a.r}</i></div>`).join('')}</div>`;
  }).join('');
  return `<p class="note">달성 ${done.size}/${ACHIEVEMENTS.length}. 처음 달성하면 별 조각을 준다.</p>${groups}`;
}

// 기록 화면: 최근 판 20개
export function historyBlock() {
  const rows = P.history.map(h => {
    const party = h.party.map(k => `<img class="px hface" src="${charSrc(k, 'face')}" alt="${esc(ROSTER[k]?.name || k)}" title="${esc(ROSTER[k]?.name || k)}">`).join('');
    const end = h.endless != null ? `<b class="won">끝없는 탑 ${h.endless}층</b>` : h.won ? `<b class="won">${fmt(h.clock)} 도착</b>` : `${ACT[h.act] || ''} ${h.floors}칸 · ${h.why === 'collapse' ? '7시 붕괴' : '쓰러짐'}`;
    const tags = [h.daily ? '매일' : '', h.depth ? `깊이 ${h.depth}` : ''].filter(Boolean).map(t => `<span class="chip">${t}</span>`).join('');
    const d = new Date(h.t);
    return `<tr><td class="dim">${d.getMonth() + 1}/${d.getDate()}</td><td class="hparty">${party}</td><td>${MOONS[h.moon]?.name || ''}</td><td>${end}</td>
      <td>MVP ${esc(ROSTER[h.mvp]?.name || '')}</td><td>${h.best ? `최고 한 턴 ${h.best}` : ''}</td><td>${tags}</td></tr>`;
  }).join('');
  return `<h3 class="sub">최근 판 ${P.history.length}/20</h3><div class="histwrap"><table class="odds hist">${rows || '<tr><td class="note">아직 없다</td></tr>'}</table></div>`;
}

// 동료 화면 숙련도 줄
export function masteryLine(k) {
  const lv = mastery(k), xp = P.mxp[k] || 0, next = MASTERY_XP[lv];
  return `<p class="note mxline">숙련도 <b>${lv}</b>/5 ${'◆'.repeat(lv)}${'◇'.repeat(5 - lv)} · 점수 ${xp}${next != null ? ` (다음 단계 ${next})` : ' · 최고 단계'}</p>`;
}
