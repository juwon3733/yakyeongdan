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
  beginner: 30,            // 처음 30번 안에 ★5 확정 (고르기는 나중)
  firstTen: ['noel', 'raven'],   // 첫 10연: ★4 동료 1명 확정 후보
  maxStars: 5,             // 별자리 최대
  dustFullStars: 50,       // 별자리가 꽉 찬 동료 → 별가루
  dustDupItem: 5,          // 겹친 ★3 물건 → 별가루
};
// 동료가 아닌 소환 결과 (M1.5에서는 이름만 남는 자리표시. 효과는 M5에서)
export const SUMMON_ITEMS = {
  4: [ { kind: 'costume', name: '동료 의상', text: '가진 동료의 두 번째 의상 (그림이 오면 갈아입기)' },
       { kind: 'relic', name: '희귀 도구', text: '판 시작 도구 고르기에 들어갈 희귀 도구' },
       { kind: 'pack', name: '카드 묶음', text: '동료 보상 풀에 카드 2장 추가' } ],
  3: [ { kind: 'relic', name: '흔한 도구', text: '판 시작 도구 고르기에 들어갈 흔한 도구' },
       { kind: 'dust', name: '별가루 10', text: '교환소에서 쓰는 별가루', dust: 10 },
       { kind: 'talk', name: '휴식 대화 조각', text: '휴식 칸 대화 하나가 열린다' } ],
};
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
