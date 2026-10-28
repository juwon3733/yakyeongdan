// 동료 (docs/03_characters.md). maxHp = 최대 체력(캐릭터마다 다름).
// hooks는 전투 상태 c와 효과 도우미 e를 받는다. 쓰러진 동료의 패시브는 불리지 않는다.
// 훅 안에서 e.guard는 그 동료 자신에게 걸린다.
//   onCombatStart: 첫 턴 시작(방어 초기화 뒤, 카드 뽑기 전)
//   onTurnStart:   매 턴 시작
//   beforeCard:    카드를 쓰기 직전 (card = 카드 정의)
//   preview:       카드에 보일 피해 보너스 (beforeCard가 더할 값을 미리)
export const CHARACTERS = {
  iris: {
    name: '아이리스', role: '검사', rarity: 4, maxHp: 36, col: '#c8d4f0', long: true,
    ds: '베기를 이어서 쓸수록 세진다.',
    pal: { h: '#1c1c2a', H: '#0c0c16', e: '#8ab0ff', o: '#c8d0e8', O: '#8a92b0', a: '#f0f4ff' },
    start: ['iris.slash', 'iris.slash', 'iris.parry', 'iris.issen'],
    passive: { name: '검의 리듬', text: '매 턴 첫 베기 피해 +2.',
      beforeCard: (c, card) => { if (card.slash && !c.irisRhythm) { c.bonus += 2; c.irisRhythm = true; } },
      preview: (c, card) => card.slash && !c.irisRhythm ? 2 : 0,
      onTurnStart: c => { c.irisRhythm = false; } },
  },
  brick: {
    name: '브릭', role: '대포', rarity: 3, maxHp: 34, col: '#ef6352', long: false,
    ds: '장전을 쌓았다가 한 번에 쏜다.',
    pal: { h: '#d0463a', H: '#902a24', e: '#ffd060', o: '#5a4a3a', O: '#3a2e24', a: '#e0b84a' },   // 붉은 단발, 작업복
    start: ['brick.load', 'brick.load', 'brick.fire', 'brick.over'],
    passive: { name: '여분 탄약', text: '전투 시작에 장전 1.',
      onCombatStart: c => { c.loaded += 1; } },
  },
  marta: {
    name: '마르타', role: '수녀', rarity: 3, maxHp: 46, col: '#e0b84a', long: true,
    ds: '막고, 맞으면 되받아친다.',
    pal: { h: '#ecc860', H: '#b08a30', e: '#5a7ab0', o: '#1e1e28', O: '#0e0e16', a: '#f0f0f0' },   // 금발 땋은 장발, 수녀복
    start: ['marta.wall', 'marta.wall', 'marta.fist', 'marta.confess'],
    passive: { name: '수호', text: '전투 시작에 방어 4.',
      onCombatStart: (c, e) => { e.guard(4); } },
  },
  noel: {
    name: '노엘', role: '마술사', rarity: 4, maxHp: 26, col: '#f08ac0', long: true,
    ds: '자는 동안 마력이 쌓인다.',
    pal: { h: '#f08ac0', H: '#b05a88', e: '#a0d0ff', o: '#f0e0f0', O: '#c0a8d0', a: '#ffd0e8' },
    start: ['noel.sleep', 'noel.star', 'noel.pillow', 'noel.deep'],
    passive: { name: '잠버릇', text: '잠든 채로 턴을 시작하면 방어 3.',
      onTurnStart: (c, e) => { if (c.asleep) e.guard(3); } },
  },
  raven: {
    name: '레이븐', role: '암살자', rarity: 4, maxHp: 30, col: '#9a86d8', long: false,
    ds: '독을 쌓고 목을 긋는다.',
    pal: { h: '#d0d4e0', H: '#8a8ea4', e: '#e04a4a', o: '#1e1a28', O: '#0e0c16', a: '#9a86d8' },   // 은색 단발, 검은 깃털 코트
    start: ['raven.needle', 'raven.needle', 'raven.step', 'raven.venom'],
    passive: { name: '독 묻은 깃', text: '전투 시작에 모든 적 독 2.',
      onCombatStart: (c, e) => { e.foeStatusAll('poison', 2); } },
  },
};

// 처음부터 가진 동료. 나머지는 별 소환으로 (js/meta.js). 개발판(DEV)에선 구현된 동료를 전부 고를 수 있다.
export const STARTER_OWNED = ['iris', 'brick', 'marta'];
