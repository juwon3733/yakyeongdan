// 시즌 (docs/SEASON_PLAN.md · js/data/season.js): 지금 시즌, 시즌 보스 판, 무료 시즌 패스, 시즌 탑 규칙.
// 진행은 P.seasons[시즌 id] = { xp, got: [받은 단계], best: { 난이도: 최소 턴 }, clear: { 난이도: true } }
import { S, newRun } from './run.js';
import { startCombat } from './combat.js';
import { P, save, runOptions } from './meta.js';
import { SEASONS, PASS, SEASON_RUN } from './data/season.js';
import { CARDS } from './data/cards.js';
import { FOE } from './data/enemies.js';
import { rollRelic } from './relics.js';

const DAY = 86400000;
// 지금 시즌(없으면 가장 가까운 다음 시즌을 「곧」으로). 개발판은 ?season=s1 으로 미리 열 수 있다
export function seasonNow(now = Date.now()) {
  const force = typeof location !== 'undefined' && new URLSearchParams(location.search).get('season');
  for (const s of SEASONS) {
    const a = Date.parse(s.start), b = a + s.days * DAY;
    if (force === s.id || (now >= a && now < b)) return { ...s, open: true, left: Math.max(1, Math.ceil((b - now) / DAY)) };
  }
  const next = SEASONS.find(s => Date.parse(s.start) > now);
  return next ? { ...next, open: false, inDays: Math.ceil((Date.parse(next.start) - now) / DAY) } : null;
}
export const seasonOn = () => !!seasonNow()?.open;
export function seasonRec(id = seasonNow()?.id) {
  P.seasons ||= {};
  return P.seasons[id] ||= { xp: 0, got: [], best: {}, clear: {} };
}
// 판 끝(js/meta.js grantRun): 시즌 별 — 판 30, 막 보스마다 20, 「새벽」 50, 끝없는 탑 층마다 5
export function passXp(G) {
  const s = seasonNow(); if (!s?.open || !G) return 0;
  const xp = 30 + (G.bossKills || 0) * 20 + (G.won ? 50 : 0) + (G.endless ? (G.floor || 0) * 5 : 0);
  seasonRec(s.id).xp += xp;
  return xp;
}
export const passLevel = rec => Math.min(PASS.tiers, Math.floor((rec?.xp || 0) / PASS.per));
// 받을 수 있는 단계 받기(한꺼번에)
export function claimPass() {
  const s = seasonNow(); if (!s?.open) return 0;
  const rec = seasonRec(s.id), lv = passLevel(rec); let got = 0;
  for (let n = 1; n <= lv; n++) if (!rec.got.includes(n)) {
    const r = PASS.reward(n); P.shards += r.shards || 0; got += r.shards || 0;
    if (r.title) { P.titlesSeason ||= []; P.titlesSeason.push(`${s.name} · ${r.title}`); }
    rec.got.push(n);
  }
  save(); return got;
}
// 난이도는 앞 단계를 깨야 열린다
export const tierOpen = (rec, i) => i === 0 || !!rec.clear[seasonNow().tiers[i - 1].id];

// 시즌 보스 판: 고른 셋의 시작 덱 + 동료마다 레전더리 2장 + 도구 2개 → 바로 보스. 시즌 규칙도 붙는다
export function startSeasonBoss(party, ti) {
  const s = seasonNow(); if (!s?.open) return false;
  const tier = s.tiers[ti]; if (!tier || !tierOpen(seasonRec(s.id), ti)) return false;
  newRun(party, undefined, runOptions(party, 0));
  const G = S.G;
  G.season = { id: s.id, tier: tier.id, ti };
  G.seasonRule = s.rule.id;
  for (const p of party) {
    const leg = Object.keys(CARDS).filter(id => CARDS[id].ch === p && CARDS[id].rarity === 'r');   // 시즌 보스 판은 안 열린 카드 묶음도 빌려 준다
    for (let k = 0; k < SEASON_RUN.legends && leg.length; k++) G.deck.push(leg.splice(G.rng.int(leg.length), 1)[0]);
  }
  for (let k = 0; k < SEASON_RUN.relics; k++) { const r = rollRelic(G.rng, ['u', 'r']); if (r) G.relics.push(r); }
  startCombat([s.boss], 'boss');
  for (const f of S.C.all) { f.max = f.hp = Math.round((FOE[f.key]?.hp || f.hp) * tier.hp);   // 막 배율 없이 시즌 보스 그대로
     if (tier.atk) f.str = (f.str || 0) + Math.round((tier.atk - 1) * 6); }
  return true;
}
// 시즌 보스 판이 끝나면(main.js after): 기록·첫 클리어 보상 → 시즌 화면
export function seasonBossDone() {
  const G = S.G, sv = G?.season; if (!sv) return;
  const s = seasonNow(), rec = seasonRec(sv.id), tier = s?.tiers[sv.ti];
  const out = { won: !!sv.won, turns: sv.turns, tier: tier?.name, first: 0, best: false };
  if (sv.won && tier) {
    if (!rec.clear[tier.id]) { rec.clear[tier.id] = true; P.shards += tier.first; out.first = tier.first; }
    if (rec.best[tier.id] == null || sv.turns < rec.best[tier.id]) { rec.best[tier.id] = sv.turns; out.best = true; }
  }
  rec.xp += sv.won ? 60 : 20;
  save();
  S.G = null; S.C = null; S.view = 'season'; S.seasonOut = out;
}
