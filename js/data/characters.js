// 동료 (docs/03_characters.md). maxHp = 최대 체력(캐릭터마다 다름).
// hooks는 전투 상태 c와 효과 도우미 e를 받는다. 쓰러진 동료의 패시브는 불리지 않는다.
// 훅 안에서 e.guard는 그 동료 자신에게 걸린다.
//   onCombatStart: 첫 턴 시작(방어 초기화 뒤, 카드 뽑기 전)
//   onTurnStart:   매 턴 시작
//   beforeCard:    카드를 쓰기 직전 (card = 카드 정의)
export const CHARACTERS = {
  iris: {
    name: '아이리스', role: '검사', rarity: 4, maxHp: 36, col: '#c8d4f0', long: true,
    ds: '베기를 이어서 쓸수록 세진다.',
    pal: { h: '#1c1c2a', H: '#0c0c16', e: '#8ab0ff', o: '#c8d0e8', O: '#8a92b0', a: '#f0f4ff' },
    start: ['iris.slash', 'iris.slash', 'iris.parry', 'iris.issen'],
    passive: { name: '검의 리듬', text: '매 턴 첫 베기 피해 +2.',
      beforeCard: (c, card) => { if (card.slash && c.slashes === 0 && !c.irisRhythm) { c.bonus += 2; c.irisRhythm = true; } },
      onTurnStart: c => { c.irisRhythm = false; } },
  },
  brick: {
    name: '브릭', role: '대포', rarity: 3, maxHp: 34, col: '#ef6352', long: false,
    ds: '장전을 쌓았다가 한 번에 쏜다.',
    pal: { h: '#d0463a', H: '#902a24', e: '#ffd060', o: '#3a3030', O: '#201818', a: '#e0b84a' },
    start: ['brick.load', 'brick.load', 'brick.fire', 'brick.quick'],
    passive: { name: '여분 탄약', text: '전투 시작에 장전 1.',
      onCombatStart: c => { c.loaded += 1; } },
  },
  marta: {
    name: '마르타', role: '수녀', rarity: 3, maxHp: 46, col: '#e0b84a', long: true,
    ds: '막고, 맞으면 되받아친다.',
    pal: { h: '#24242e', H: '#121218', e: '#5a7ab0', o: '#1e1e28', O: '#0e0e16', a: '#f0f0f0' },
    start: ['marta.wall', 'marta.wall', 'marta.fist', 'marta.counter'],
    passive: { name: '수호', text: '전투 시작에 방어 4.',
      onCombatStart: (c, e) => { e.guard(4); } },
  },
  noel: {
    name: '노엘', role: '마술사', rarity: 4, maxHp: 26, col: '#f08ac0', long: true,
    ds: '자는 동안 마력이 쌓인다.',
    pal: { h: '#f08ac0', H: '#b05a88', e: '#a0d0ff', o: '#f0e0f0', O: '#c0a8d0', a: '#ffd0e8' },
    start: ['noel.sleep', 'noel.star', 'noel.pillow', 'noel.yawn'],
    passive: { name: '잠버릇', text: '잠든 채로 턴을 시작하면 방어 3.',
      onTurnStart: (c, e) => { if (c.asleep) e.guard(3); } },
  },
  raven: {
    name: '레이븐', role: '암살자', rarity: 4, maxHp: 30, col: '#9a86d8', long: false,
    ds: '독을 쌓고 목을 긋는다.',
    pal: { h: '#2a2a38', H: '#141420', e: '#e04a4a', o: '#2a2238', O: '#16121e', a: '#9a86d8' },
    start: ['raven.needle', 'raven.needle', 'raven.step', 'raven.throat'],
    passive: { name: '독 묻은 깃', text: '전투 시작에 적 독 2.',
      onCombatStart: c => { c.foe.poison += 2; } },
  },
};

// 처음부터 가진 동료. 나머지는 별 소환으로 (M5). 개발판(DEV)에선 전부 고를 수 있다.
export const STARTER_OWNED = ['iris', 'brick', 'marta'];

// 아직 구현 안 된 동료 미리보기 (고를 수 없음)
export const PREVIEW = [
  { name: '미미·모모', role: '쌍둥이', rarity: 4, col: '#ffb0a0', long: false, pal: { h: '#ffb0a0', H: '#c07a6a', e: '#5a5ab0', o: '#ffffff', O: '#c8c8d8', a: '#ff8a8a' } },
  { name: '시온', role: '별 소환사', rarity: 5, col: '#7ab0d8', long: true, pal: { h: '#9ab8e0', H: '#5a78a8', e: '#e0e8ff', o: '#2a3a6a', O: '#18224a', a: '#e0c860' } },
  { name: '세바스', role: '집사', rarity: 4, col: '#c0c0c0', long: false, pal: { h: '#d8d8d8', H: '#9a9a9a', e: '#3a3a3a', o: '#1a1a1a', O: '#0a0a0a', a: '#ffffff' } },
];
