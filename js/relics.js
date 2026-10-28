// 도구 읽기 도우미. 수치는 js/data/relics.js.
import { S } from './run.js';
import { RELICS, RELIC_ODDS } from './data/relics.js';

export const hasRelic = id => !!S.G?.relics.includes(id);
// 가진 도구들의 수치 필드 합 (없으면 0)
export const relicSum = field => (S.G?.relics || []).reduce((t, id) => t + (RELICS[id][field] || 0), 0);
// 곱 필드 (없으면 1)
export const relicMul = field => (S.G?.relics || []).reduce((t, id) => t * (RELICS[id][field] ?? 1), 1);
export const relicFlag = field => (S.G?.relics || []).some(id => RELICS[id][field]);

// 등급 확률로 아직 없는 도구 하나 (없으면 null). tiers를 주면 그 등급에서만.
// 전용 도구(별자리 4)는 주인이 파티에 있고 열렸을 때(G.sigs) 보통 등급 자리에 섞인다.
const sigOk = id => { const d = RELICS[id], G = S.G; return d.tier === 'sig' && G.party.includes(d.owner) && (G.sigs || []).includes(d.owner); };
export function rollRelic(rng, tiers, exclude = []) {
  const have = new Set([...S.G.relics, ...exclude]);
  const free = t => Object.keys(RELICS).filter(id => (RELICS[id].tier === t || (t === 'u' && sigOk(id))) && !have.has(id));
  if (tiers) { const pool = tiers.flatMap(free); return pool.length ? rng.pick(pool) : null; }
  let x = rng.next(), t = 'c';
  for (const [k, w] of Object.entries(RELIC_ODDS)) { if (x < w) { t = k; break; } x -= w; }
  const order = [t, 'c', 'u', 'r'];
  for (const k of order) { const p = free(k); if (p.length) return rng.pick(p); }
  return null;
}
