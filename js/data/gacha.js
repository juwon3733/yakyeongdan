// 별 소환·별 조각·별가루 (docs/05_meta.md §1~§5).
export const SUMMON = {
  cost: 10,                // 1회 = 별 조각 10
  tenCost: 100,
  firstGift: 100,          // 첫 실행 선물
  rate5: .04, rate4: .16,  // 나머지 ★3
  softFrom: 40,            // 40번째 뽑기부터 ★5 확률이 매번 +softStep
  softStep: .04,
  hard: 51,                // ★5 없이 50번이면 51번째 확정
  char4Share: .5,          // ★4 중 동료 비율 (나머지는 의상·희귀 도구·카드 묶음)
  char3Share: .3,          // ★3 중 동료 비율 (나머지는 흔한 도구·별가루·대화 조각)
  newFirst: .7,            // 동료가 나오면 아직 없는 동료가 먼저 나올 확률
  beginner: 30,            // 처음 30번 안에 ★5 확정. 처음 얻는 ★5는 ★5 동료 중 직접 고른다
  pickShare5: .5,          // ★5 중 픽업 동료 비율 (놓치면 다음 ★5는 픽업 확정)
  pickShare4: .5,          // ★4 동료 중 픽업 둘 비율
  firstTen: ['noel', 'raven'],   // 첫 10연: ★4 동료 1명 확정 후보
  maxStars: 5,             // 별자리 최대
  dustFullStars: 50,       // 별자리가 꽉 찬 동료 → 별가루
  dustDupItem: 5,          // 겹친 ★3 물건 → 별가루
};
// 동료가 아닌 소환 결과 (§3). 열 것이 없으면 ITEM_DUST만큼 별가루로 바뀐다.
//   costume 가진 동료 하나의 두 번째 의상 · relic 시작 도구 고르기에 들어갈 도구(tier 등급) · pack 동료 카드 묶음(보상 풀에 2장)
//   talk 도감 휴식 대화 하나 · dust 별가루
export const SUMMON_ITEMS = {
  4: [ { kind: 'costume', name: '동료 의상', text: '가진 동료 하나의 두 번째 의상' },
       { kind: 'relic', tier: 'r', name: '레전더리 도구', text: '판을 시작할 때 고를 수 있는 레전더리 도구' },
       { kind: 'pack', name: '카드 묶음', text: '가진 동료 하나의 보상 카드 2장 추가' } ],
  3: [ { kind: 'relic', tier: 'c', name: '레어 도구', text: '판을 시작할 때 고를 수 있는 레어 도구' },
       { kind: 'dust', name: '별가루 10', text: '교환소에서 쓰는 별가루', dust: 10 },
       { kind: 'talk', name: '휴식 대화 조각', text: '도감에서 다시 보는 휴식 대화 하나' } ],
};
export const ITEM_DUST = { costume: 20, pack: 15, relic: 10, talk: 5 };

// 픽업 (§3): 2주마다 ★5 하나와 ★4 둘이 돌아가며 바뀐다. PICKUP_EPOCH(UTC)부터 PICKUP_DAYS일 단위.
export const PICKUPS = [
  { five: 'sion', four: ['noel', 'mariana'] },
  { five: 'lunaria', four: ['tomori', 'sigrun'] },
  { five: 'akane', four: ['zeno', 'mimimomo'] },
  { five: 'eleonore', four: ['sebas', 'raven'] },
  { five: 'nerea', four: ['bertha', 'zeno'] },
];
export const PICKUP_DAYS = 14;
export const PICKUP_EPOCH = Date.UTC(2026, 9, 26);

// 별자리 (§4). 같은 동료가 또 나오면 한 칸씩, 최대 5.
export const STAR_STEPS = [
  { n: 1, text: '두 번째 의상' },
  { n: 2, text: '카드 묶음 1 해금(보상 카드 2장 추가)' },
  { n: 3, text: '시작 카드 1장을 강화판으로' },
  { n: 4, text: '전용 도구 해금(파티에 있으면 강적·야시장에서 나온다)' },
  { n: 5, text: '듀오 컷인 특별판, 이름 옆에 별 테두리' },
];
// 교환소 (§5) 별가루 가격
export const EXCHANGE = {
  char: { 3: 80, 4: 150, 5: 400 },   // 동료 직접 고르기 (가진 동료면 별자리 +1)
  costume: 40, pack: 30, talk: 10,
  relic: { c: 20, r: 60 },           // 시작 도구 고르기에 넣을 도구
};
// 시작 도구 고르기: 판을 이만큼 끝내면 열린다 (시작 도구 셋 + 소환·교환소로 얻은 도구)
export const START_PICK_RUNS = 1;
// 동료 카드 묶음: 보상 풀(시작 카드가 아닌 카드)의 마지막 4장을 2장씩 묶음 1·2로. 열리기 전엔 보상·야시장에 안 나온다.
export const PACK_SIZE = 2, PACK_COUNT = 2;
// 판이 끝나면 받는 별 조각 (§1)
export const SHARDS = {
  actBoss: 10,            // 막 보스 격파마다
  dawnWin: 20,            // 「새벽」 격파
  earlyPer10: 2,          // 6:00 전 10분마다
  earlyMax: 20,
  newDuo: 5,              // 새로 찾은 듀오 (처음 한 번)
  elite: 3,
  lossMin: 5,             // 지면 도달한 층 수 ×1, 최소 5
};
