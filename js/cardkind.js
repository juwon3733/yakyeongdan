// 카드 그림 종류: 동료마다 카드 그림 4장(공격·방어·스킬·필살)을 같은 종류 카드가 같이 쓴다.
// 그림 목록(js/asset_prompts.js)과 게임(js/art.js)이 같이 읽는다.
export const CARD_KINDS = ['atk', 'guard', 'skill', 'special'];
export function cardArtKind(d) {
  if (d.rarity === 'r') return 'special';
  if (d.atk) return 'atk';
  if (/방어/.test(String(d.text || ''))) return 'guard';
  return 'skill';
}
