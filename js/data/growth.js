// 동료 성장 (docs/05_meta.md §13): 레벨 1~20 + 재능 갈래 셋.
//   레벨: 그 동료를 데리고 판을 끝내면 경험치. 레벨마다 최대 체력 +1, 5·10·15·20레벨에 그 동료 공격·방어 카드 +1.
//   재능: 짝수 레벨마다 재능 포인트 1(20레벨에 10). 갈래마다 4칸, 비용 1·1·2·2(합 18)라 다 찍을 수 없다 — 같은 동료도 다르게 키운다. 초기화는 무료.
//   밸런스 기준은 여전히 레벨 1·재능 없음(js/data/rules.js). 키우면 「확실히」 세진다(시뮬: 파티 셋 모두 10레벨이면 「새벽」 격파 약 +15%p, 20레벨이면 약 +30%p).
export const LV_MAX = 20;
// 레벨 L → L+1에 드는 경험치
export const lvNeed = L => 30 + 10 * L;   // 20레벨까지 약 2500 — 한 동료로 25~30판
// 판이 끝나면 데려간 동료마다: 판 20 + 싸움마다 2 + 강적 5 + 막 보스 15 + 「새벽」 격파 40
export const XP_GAIN = { run: 20, fight: 2, elite: 5, boss: 15, win: 40 };
export const LV_HP = 0.5;                     // 레벨마다 최대 체력 (2레벨마다 1, 20레벨에 +9)
export const LV_POWER = [5, 10, 15, 20];      // 이 레벨마다 공격·방어 카드 +1
export const talentPoints = lv => Math.floor(lv / 2);

// 갈래: 칸마다 { id, name, text, cost, fx } — fx는 엔진이 읽는 값(js/run.js growthOf)
export const BRANCHES = [
  { id: 'blade', name: '칼날', col: '#ff7a6a', nodes: [
    { id: 'blade1', name: '날 세우기', text: '공격 카드 피해 +1', cost: 1, fx: { atk: 1 } },
    { id: 'blade2', name: '선제', text: '전투마다 처음 쓰는 공격 카드 피해 +4', cost: 1, fx: { firstAtk: 4 } },
    { id: 'blade3', name: '숙련된 손', text: '공격 카드 피해 +2', cost: 2, fx: { atk: 2 } },
    { id: 'blade4', name: '필살의 각오', text: '레전더리 공격 카드 피해 ×1.25', cost: 2, fx: { legendMul: 1.25 } },
  ] },
  { id: 'guard', name: '방패', col: '#7ab0ff', nodes: [
    { id: 'guard1', name: '단련', text: '최대 체력 +5', cost: 1, fx: { hp: 5 } },
    { id: 'guard2', name: '경계', text: '전투 시작에 방어 6', cost: 1, fx: { startBlock: 6 } },
    { id: 'guard3', name: '굳은 자세', text: '방어 카드 방어 +2', cost: 2, fx: { blk: 2 } },
    { id: 'guard4', name: '불굴', text: '판마다 한 번, 쓰러질 피해를 받으면 체력 1로 버틴다', cost: 2, fx: { undying: 1 } },
  ] },
  { id: 'star', name: '별', col: '#ffd84a', nodes: [
    { id: 'star1', name: '준비성', text: '판 시작에 별빛 +15', cost: 1, fx: { gold: 15 } },
    { id: 'star2', name: '눈치', text: '전투 첫 턴 카드 +1장', cost: 1, fx: { firstDraw: 1 } },
    { id: 'star3', name: '각성의 여운', text: '이 동료 패시브 ③이 터지면 모든 동료 체력 4 회복', cost: 2, fx: { burstHeal: 4 } },
    { id: 'star4', name: '새벽빛', text: '전투 첫 턴 에너지 +1', cost: 2, fx: { firstEnergy: 1 } },
  ] },
];
export const NODES = Object.fromEntries(BRANCHES.flatMap(b => b.nodes.map((n, i) => [n.id, { ...n, branch: b.id, i }])));
// 앞 칸을 배워야 다음 칸
export const needOf = id => { const n = NODES[id]; return n.i ? BRANCHES.find(b => b.id === n.branch).nodes[n.i - 1].id : null; };
