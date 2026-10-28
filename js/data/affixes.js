// 적 속성 (docs/04_enemies.md 「속성」, docs/13 3단계). 같은 적도 속성이 붙으면 다르게 싸운다.
// 강적 전투: 첫 적(무리면 맨 앞)에 속성 1개, 밤의 깊이 affix2 단계부터 2개.
// 2막 이후 일반 전투: chance 확률로 작은 적이 아닌 하나에 1개. 튜토리얼·에피소드 특별 전투·보스에는 붙지 않는다.
// 엔진(js/combat.js)은 아래 필드만 읽는다.
//   block 전투 시작 방어(최대 체력 비율) · firstActs 첫 턴 행동 수 더 · split 쓰러지면 작은 둘(체력 비율)
//   drain 동료에게 준 피해의 비율만큼 회복 · thorns 가시 더 · guard 다른 적들 적 차례 시작 방어
//   haste 행동한 턴마다 힘 + · hidden 첫 턴 동안 단일 대상으로 고를 수 없음 · curse 전투 시작 저주 카드
//   clock 적 차례마다 밤 시계 +분 · hp 체력 배수 · regen 적 차례 시작 회복 · enrage 체력 절반 아래면 한 번 힘 +
export const AFFIX = {
  hard:   { pre: '단단한',   col: '#9ab8d8', block: .3,      text: '전투를 방어(최대 체력의 30%)를 두르고 시작한다.' },
  swift:  { pre: '빠른',     col: '#7ae0f0', firstActs: 1,   text: '첫 턴에 한 번 더 움직인다.' },
  split:  { pre: '분열하는', col: '#b48ae8', split: .35,     text: '쓰러지면 작은 둘(최대 체력의 35%)로 갈라진다.' },
  vamp:   { pre: '흡혈',     col: '#e05a7a', drain: .5,      text: '동료에게 준 피해의 절반만큼 체력을 회복한다.' },
  spiked: { pre: '가시 돋친', col: '#c0d070', thorns: 3,     text: '이 적을 친 동료가 3 피해를 받는다(가시가 있으면 더).' },
  guard:  { pre: '수호하는', col: '#e0c060', guard: 6,       text: '적 차례가 시작될 때 다른 적들에게 방어 6.' },
  haste:  { pre: '가속하는', col: '#ff8a5a', haste: 2,       text: '움직일 때마다 힘 +2.' },
  hidden: { pre: '숨은',     col: '#6a6a9a', hidden: true,   text: '첫 턴에는 고를 수 없다(모든 적 공격·무작위 공격은 맞는다).' },
  cursed: { pre: '저주받은', col: '#8a3a5a', curse: 'curse.fog', text: '전투가 시작되면 뽑을 더미 위에 저주 「안개」 1장.' },
  thief:  { pre: '시간 도둑', col: '#f0d040', clock: 3,      text: '적 차례마다 밤 시계 +3분.' },
  giant:  { pre: '거대한',   col: '#d0a070', hp: 1.4,        text: '체력 1.4배.' },
  regen:  { pre: '재생하는', col: '#7dff9a', regen: 5,       text: '적 차례가 시작될 때 체력 5 회복.' },
  enrage: { pre: '성난',     col: '#ff5a3a', enrage: 5,      text: '체력이 절반 아래로 내려가면 한 번 힘 +5.' },
};
// 속성 붙이기 규칙. fight[막] = 일반 전투에서 하나에 붙을 확률. gold·rare = 속성 하나마다 보상 별빛 +, 희귀 카드 확률 +
export const AFFIX_RULE = { fight: { 1: 0, 2: .25, 3: .35 }, elite: 1, eliteDeep: 2, gold: 6, rare: .04 };
