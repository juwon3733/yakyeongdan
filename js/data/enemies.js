// 적 (docs/04_enemies.md).
//   FOE[id]: name, hp, pal, pat(행동 순환), aim(단일 공격 노림, rules.js AIM_NAME, 없으면 앞줄)
//   그 밖의 표시: noPoisonWhileBlock(방어가 남아 있으면 독이 안 듦), light(등대 불빛)
//   armor: 공격 한 번마다 받는 피해 감소 · acts: 한 턴 행동 수 · turnClock: 내 턴 시작마다 밤 시계 +분
//   phase2: 체력이 at 비율 아래가 되면 한 번 바뀜 { at, msg, clockOnce, ...바꿀 필드(armor·acts·aim·turnClock·pat) }
//   line: 보스 앞 한 줄 대사
//   ACTS[막]: easy(1층 전투), fights(그 위 전투), elites, boss — 각 항목은 적 id 배열(1~3마리)
// 행동: A 공격(v, 횟수) · B 방어 · U 힘 · M 공격+방어 · W 동료에게 상태(약화·취약) · K 저주 카드를 뽑을 더미 위에 · T 밤 시계 +분
const A = (v, n = 1) => ({ t: 'atk', v, n }), B = v => ({ t: 'blk', v }), U = v => ({ t: 'buf', v }), M = (v, b) => ({ t: 'mix', v, b });
const W = (s, v) => ({ t: 'deb', s, v }), K = (card, n) => ({ t: 'curse', card, n }), T = v => ({ t: 'time', v });

export const FOE_PAL = {
  sea:    { h: '#6ad0e0', H: '#2a8aa0', e: '#ffffff', o: '#2a5a7a', O: '#163a52', a: '#a8f0ff' },
  crab:   { h: '#d05a3a', H: '#8a2a1a', e: '#ffe080', o: '#a0402a', O: '#601e10', a: '#f0c0a0' },
  pirate: { h: '#3a2a1a', H: '#1a120a', e: '#e0e0e0', o: '#6a2a2a', O: '#3a1414', a: '#e0b84a' },
  gull:   { h: '#f0f0f4', H: '#b0b0c0', e: '#202020', o: '#d8d8e4', O: '#9090a8', a: '#ffb040' },
  witch:  { h: '#c8c0e0', H: '#7a70a0', e: '#a0ff80', o: '#3a2a5a', O: '#22163a', a: '#a0ff80' },
  keeper: { h: '#e8e8e8', H: '#a0a0a0', e: '#ffe060', o: '#2a3a4a', O: '#18222e', a: '#ffe060' },
  cloud:  { h: '#e8f0ff', H: '#a0b0d0', e: '#5a8ae0', o: '#c0d0f0', O: '#8090b8', a: '#ffffff' },
  knight: { h: '#c8c0a0', H: '#8a8060', e: '#3a5a8a', o: '#e0e0e8', O: '#9a9aa8', a: '#e0b84a' },
  star:   { h: '#1a1a3a', H: '#0a0a1e', e: '#ffe080', o: '#3a3a7a', O: '#22224a', a: '#ffe080', skin: '#c0c0d8' },
  cat:    { h: '#141418', H: '#08080a', e: '#a0ff80', o: '#202028', O: '#101014', a: '#a0ff80', skin: '#c0c0d8' },
  dawn:   { h: '#ffd0a0', H: '#e08a5a', e: '#ff5a3a', o: '#ffe8d0', O: '#e0b090', a: '#ff8a3a' },
};

export const FOE = {
  // 1막 항구층
  ghost:   { name: '바다 유령', hp: 28, pal: 'sea', long: true, pat: [A(10), A(6, 2), A(12)] },
  crab:    { name: '게 갑옷병', hp: 34, pal: 'crab', noPoisonWhileBlock: true, pat: [B(8), A(12), M(8, 5)] },
  pirate:  { name: '부두 해적', hp: 26, pal: 'pirate', aim: 'back', pat: [A(8), U(2), A(4, 3)] },
  gull:    { name: '갈매기', hp: 10, pal: 'gull', aim: 'back', small: true, pat: [A(5)] },
  anchor:  { name: '닻 거인', hp: 70, pal: 'pirate', pat: [A(18), B(10), A(8, 2), U(3)] },
  witch:   { name: '안개 마녀', hp: 58, pal: 'witch', long: true, aim: 'weakest', pat: [W('weak', 2), A(12), K('curse.fog', 2), A(7, 2)] },
  keeper:  { name: '등대지기', hp: 95, pal: 'keeper', long: true, crown: true, aim: 'light', line: '"불빛이 닿는 곳이 네 자리다."',
             light: { double: .5 },   // 불빛이 비춘 동료: 그 동료 카드 비용 +1, 단일 공격은 그 동료를 노림. 체력 절반이면 불빛 둘
             pat: [A(8), M(10, 8), A(5, 3), U(3)] },
  // 2막 구름층
  cloud:   { name: '구름 정령', hp: 44, pal: 'cloud', long: true, pat: [A(8, 2), B(10), A(18)] },
  feather: { name: '깃털 기사', hp: 50, pal: 'knight', pat: [A(16), M(10, 7), U(3)] },
  sheep:   { name: '천둥 양', hp: 46, pal: 'cloud', aim: 'weakest', pat: [A(6, 3), A(16)] },
  vane:    { name: '바람개비 병사', hp: 42, pal: 'knight', aim: 'last', pat: [A(12), A(8)] },
  bird:    { name: '번개새', hp: 84, pal: 'knight', long: true, aim: 'back', pat: [A(8, 3), U(3), A(24)] },
  vaneL:   { name: '풍향계 동', hp: 45, pal: 'cloud', aim: 'weakest', pat: [A(12), B(12)] },
  vaneR:   { name: '풍향계 서', hp: 45, pal: 'cloud', aim: 'weakest', pat: [B(12), A(12)] },
  captain: { name: '구름 기사단장', hp: 120, pal: 'knight', long: true, crown: true, armor: 1, aim: 'front',
             line: '"구름 기사단의 이름으로. 여기서 돌아가라."',
             phase2: { at: .5, msg: '구름 기사단장이 갑옷을 벗어던졌다! 피해 감소가 사라지고 매 턴 두 번 움직인다.', armor: 0, acts: 2, aim: 'cycle',
                      pat: [A(10), A(4, 2), M(8, 8), U(2)] },
             pat: [M(12, 10), A(7, 3), U(3), A(20)] },
  // 3막 별층
  statue:  { name: '별 조각상', hp: 46, pal: 'star', pat: [B(15), A(16)] },
  cat:     { name: '그림자 고양이', hp: 40, pal: 'cat', long: true, aim: 'back', pat: [A(5, 4), U(3)] },
  archer:  { name: '유성 사수', hp: 48, pal: 'star', long: true, aim: 'back', pat: [A(9, 2), A(18)] },
  angel:   { name: '시계태엽 천사', hp: 40, pal: 'star', aim: 'last', pat: [A(10), T(10)] },
  rider:   { name: '유성 기수', hp: 100, pal: 'star', crown: true, pat: [A(8, 3), M(14, 14), U(4)] },
  shadow:  { name: '달의 그림자', hp: 90, pal: 'cat', long: true, aim: 'weakest', pat: [A(12), W('vuln', 2), A(6, 3)] },
  dawn:    { name: '새벽', hp: 170, pal: 'dawn', long: true, crown: true, aim: 'dawn', turnClock: 2,
             line: '"왜 매일 밤 올라오는 거야? …그냥 아침이 오게 두면 되잖아."',
             phase2: { at: .5, msg: '해가 뜬다. 밤 시계 +10분, 이제 매 턴 +5분.', clockOnce: 10, turnClock: 5 },
             pat: [A(11), A(5, 4), M(14, 14), U(4), A(24)] },
  // 첫 실행 튜토리얼 (js/data/tutorial.js): 약하게
  tut_ghost: { name: '아기 바다 유령', hp: 16, pal: 'sea', long: true, pat: [A(4), A(2, 2), A(5)] },
  tut_gull:  { name: '갈매기', hp: 8, pal: 'gull', aim: 'back', small: true, pat: [A(3)] },
  tut_lamp:  { name: '떠도는 등불', hp: 40, pal: 'keeper', crown: true, line: '"작은 불빛이라고 얕보지 마."',
               pat: [A(6), B(6), A(3, 2), A(7)] },
};

export const ACTS = {
  1: { easy: [['ghost'], ['crab'], ['gull', 'gull', 'gull']],
       fights: [['ghost'], ['crab'], ['pirate', 'pirate'], ['gull', 'gull', 'gull'], ['ghost', 'gull']],
       elites: [['anchor'], ['witch']], boss: ['keeper'] },
  2: { easy: [['cloud'], ['feather']],
       fights: [['cloud'], ['feather'], ['sheep'], ['vane'], ['cloud', 'vane']],
       elites: [['bird'], ['vaneL', 'vaneR']], boss: ['captain'] },
  3: { easy: [['statue'], ['cat']],
       fights: [['statue'], ['cat'], ['archer'], ['angel'], ['angel', 'cat']],
       elites: [['rider'], ['shadow']], boss: ['dawn'] },
};
