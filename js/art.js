// 그림 로더. assets/art.json(= tools/art-index.mjs가 만든 "실제로 있는 그림" 목록)에 있는 파일만 쓰고,
// 없으면 null을 돌려준다. 부르는 쪽은 null이면 임시 도트(js/render/sprites.js, js/render/cardart.js)를 그린다.
// 파일 이름 규칙은 js/asset_prompts.js·AGENTS.md와 같다.
let INDEX = new Set();
export const artReady = (typeof fetch === 'function' && typeof location !== 'undefined' && location.protocol !== 'file:'
  ? fetch('assets/art.json').then(r => (r.ok ? r.json() : [])).catch(() => [])
  : Promise.resolve([])).then(list => { INDEX = new Set(Array.isArray(list) ? list : []); return INDEX.size; });

export const hasArt = file => INDEX.has(file);
export const artURL = file => (INDEX.has(file) ? `assets/${file}` : null);
export const artCount = () => INDEX.size;

// 동료 그림: kind = stand(전투 서 있는 그림) | normal | smile | serious (상반신) | cutin
// 두 번째 의상을 입었으면 서 있는 그림은 _outfit2를 먼저 본다.
export function charArt(id, kind = 'stand', outfit = false) {
  if (kind === 'cutin') return artURL(`cutins/${id}_cutin.png`);
  if (kind === 'stand') return (outfit && artURL(`chars/${id}_outfit2.png`)) || artURL(`chars/${id}_stand.png`);
  return artURL(`chars/${id}_${kind}.png`) || artURL(`chars/${id}_normal.png`);
}

// 적 그림: 전투 데이터의 적 키 → 그림 파일 이름 (js/asset_prompts.js ENEMIES·BOSSES)
const FOE_FILE = {
  ghost: 'sea_ghost', crab: 'crab_soldier', pirate: 'dock_pirate', gull: 'gulls', anchor: 'anchor_giant', witch: 'fog_witch',
  eel: 'lamp_eel', powder: 'powder_sailor', parrot: 'captain_parrot', smuggler: 'smuggler_boss',
  cloud: 'cloud_spirit', feather: 'feather_knight', sheep: 'thunder_sheep', vane: 'vane_soldier', bird: 'thunderbird', vaneL: 'twin_vanes', vaneR: 'twin_vanes',
  jelly: 'mist_jelly', kite: 'kite_knight', puff: 'puff_bomber', trumpet: 'storm_trumpeter',
  statue: 'star_statue', cat: 'shadow_cat', archer: 'meteor_archer', angel: 'clock_angel', rider: 'meteor_rider', shadow: 'moon_shadow',
  comet: 'tail_comet', gear: 'gear_knight', thief: 'star_thief', sage: 'constellation_sage',
  tut_ghost: 'sea_ghost', tut_gull: 'gulls',
};
const BOSS_FILE = { keeper: 'lighthouse', captain: 'cloud_captain', dawn: 'dawn' };
export function foeArt(f) {
  const b = BOSS_FILE[f.key];
  if (b) return (f.p2 && artURL(`enemies/boss_${b}_2.png`)) || artURL(`enemies/boss_${b}_1.png`);
  return FOE_FILE[f.key] ? artURL(`enemies/${FOE_FILE[f.key]}.png`) : null;
}

// 카드 그림: 동료 카드 cards/card_<id>.png (점 등은 _), 인연 듀오 cards/duocard_<a>_<b>.png. 강화판(+)은 원래 카드 그림.
const fileId = id => id.replace(/[^a-z0-9]+/gi, '_');
export function cardArtFile(d) {
  if (d.ch === 'curse' || d.bond) return null;
  if (d.ch === 'duo') return `cards/duocard_${d.a}_${d.b}.png`;
  return `cards/card_${fileId(String(d.id).replace(/\+$/, ''))}.png`;
}
