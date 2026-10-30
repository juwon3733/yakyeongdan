// 적 (docs/04_enemies.md).
//   FOE[id]: name, hp, pal, pat(행동 순환), aim(단일 공격 노림, rules.js AIM_NAME, 없으면 앞줄)
//   그 밖의 표시: noPoisonWhileBlock(방어가 남아 있으면 독이 안 듦), light(등대 불빛)
//   armor: 공격 한 번마다 받는 피해 감소 · acts: 한 턴 행동 수 · turnClock: 내 턴 시작마다 밤 시계 +분
//   phase2: 체력이 at 비율 아래가 되면 한 번 바뀜 { at, msg, clockOnce, ...바꿀 필드(armor·acts·aim·turnClock·pat) }
//   line / lines: 강적·보스 앞 한 줄 대사 (lines면 그중 하나) · burstClock: 내 턴 피해가 RULES.bigTurn 이상이면 밤 시계 +분 (턴당 1번)
//   thorns: 이 적을 친 동료가 받는 피해 · deathBoom: 쓰러질 때 모든 동료 피해
//   ACTS[막]: easy(1층 전투), fights(그 위 전투), elites — 각 항목은 적 id 배열(1~3마리)
//   boss: 그 막 보스 후보 id (판마다 지도를 만들 때 하나를 고른다, js/map.js makeMap → map.boss)
//   phase3: phase2와 같은 모양, 2단계 뒤 at 비율 아래에서 한 번 (depth: 밤의 깊이 그 이상에서만)
//   mistVeil { block, vuln }: 내 턴 시작마다 방어 block, 그 턴 ③이 처음 터지면 장막이 걷혀 방어 0·취약 vuln
//   stagger: 내 턴 피해가 RULES.bigTurn 이상이면 다음 행동 하나를 건너뜀
// 행동: A 공격(v, 횟수) · B 방어 · U 힘 · M 공격+방어 · W 동료에게 상태(약화·취약) · K 저주 카드를 뽑을 더미 위에 · T 밤 시계 +분
//   R 모든 동료 공격 · X 자폭(모든 동료 피해 후 쓰러짐) · G 모든 적 방어 · H 가장 약한 적 회복 · Z 부하 부르기(살아 있는 적이 3 미만일 때)
//   S 카드 훔치기(뽑을 더미에서 1장, 그 적을 쓰러뜨리면 버린 더미로 돌아옴) · N 노림 바꾸기
const A = (v, n = 1) => ({ t: 'atk', v, n }), B = v => ({ t: 'blk', v }), U = v => ({ t: 'buf', v }), M = (v, b) => ({ t: 'mix', v, b });
const W = (s, v) => ({ t: 'deb', s, v }), K = (card, n) => ({ t: 'curse', card, n }), T = v => ({ t: 'time', v });
const R = v => ({ t: 'aoe', v }), X = v => ({ t: 'boom', v }), G = v => ({ t: 'gblk', v }), H = v => ({ t: 'mend', v });
const Z = id => ({ t: 'sum', id }), S = (n = 1) => ({ t: 'steal', n }), N = a => ({ t: 'aim', a });

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
  starking: { h: '#e8ecff', H: '#7a8ad8', e: '#fff6a0', o: '#2a2f6a', O: '#14183a', a: '#ffe08a' },
  starshard: { h: '#fff6c8', H: '#c8b060', e: '#ffffff', o: '#6a5a20', O: '#3a3010', a: '#fff1b0' },
  dawn:   { h: '#ffd0a0', H: '#e08a5a', e: '#ff5a3a', o: '#ffe8d0', O: '#e0b090', a: '#ff8a3a' },
  eel:    { h: '#3a6a8a', H: '#1a3a5a', e: '#fff080', o: '#2a4a6a', O: '#14283e', a: '#fff080' },
  powder: { h: '#5a3a2a', H: '#2a1a10', e: '#ff8040', o: '#8a5a3a', O: '#5a3420', a: '#ff6030' },
  parrot: { h: '#e04040', H: '#a02020', e: '#ffe060', o: '#40a060', O: '#206a3a', a: '#4080e0' },
  jelly:  { h: '#d8c8f8', H: '#9a88c8', e: '#7a5ae0', o: '#c0b0f0', O: '#8a78c0', a: '#f0e8ff' },
  kite:   { h: '#e0c060', H: '#a08030', e: '#3a5a8a', o: '#e06a5a', O: '#a0403a', a: '#ffffff' },
  comet:  { h: '#a0e0ff', H: '#4aa0e0', e: '#ffffff', o: '#3a6aa0', O: '#1e3a6a', a: '#ffe080', skin: '#c0d8f0' },
  gear:   { h: '#b0a080', H: '#706040', e: '#ff8040', o: '#8a8070', O: '#5a5040', a: '#e0b84a', skin: '#c8c0b0' },
  thief:  { h: '#2a2a4a', H: '#14142a', e: '#ffe080', o: '#4a3a6a', O: '#2a2040', a: '#ffe080', skin: '#c0c0d8' },
  queen:  { h: '#d8ccf4', H: '#8e7cc8', e: '#b6ff9a', o: '#4a3878', O: '#2a1e4a', a: '#e8e0ff' },
  mist:   { h: '#c8c4dc', H: '#8a86a8', e: '#b6ff9a', o: '#9a94b8', O: '#6a6488', a: '#e8e4f4', skin: '#d0ccdc' },
  whale:  { h: '#3a5a8a', H: '#1e3458', e: '#ffe680', o: '#5a7ab0', O: '#2a4270', a: '#c8e4ff', skin: '#9ab8dc' },
};

export const FOE = {
  // 1막 항구층
  ghost:   { name: '바다 유령', hp: 28, pal: 'sea', hitSound: 'magic', long: true, pat: [A(11), A(7, 2), A(13)] },
  crab:    { name: '게 갑옷병', hp: 34, pal: 'crab', hitSound: 'shell', noPoisonWhileBlock: true, pat: [B(8), A(13), M(9, 5)] },
  pirate:  { name: '부두 해적', hp: 26, pal: 'pirate', hitSound: 'soft', aim: 'back', pat: [A(9), U(2), A(4, 3)] },
  gull:    { name: '갈매기', hp: 10, pal: 'gull', hitSound: 'beast', aim: 'back', small: true, pat: [A(6)] },
  eel:     { name: '등불 장어', hp: 30, pal: 'eel', hitSound: 'beast', long: true, thorns: 2, pat: [A(10), A(4, 2), B(7)] },
  powder:  { name: '화약통 수병', hp: 22, pal: 'powder', hitSound: 'soft', pat: [A(7), U(3), X(14)] },
  parrot:  { name: '선장 앵무새', hp: 20, pal: 'parrot', hitSound: 'beast', small: true, aim: 'back', pat: [Z('gull'), A(7), A(3, 2)] },
  anchor:  { name: '닻 거인', hp: 70, pal: 'pirate', hitSound: 'shell', pat: [A(24), B(10), A(11, 2), U(3)],
             lines: ['"쿵. 쿵. …여기는 지나갈 수 없다."', '"사슬이 끊어질 때까지 붙잡아 주지."'] },
  witch:   { name: '안개 마녀', hp: 58, pal: 'witch', hitSound: 'magic', long: true, aim: 'weakest', pat: [W('weak', 2), A(15), K('curse.fog', 2), A(9, 2)],
             lines: ['"길을 잃는 건 순식간이란다."', '"안개 속에선 누가 누군지 모르지."'] },
  smuggler:{ name: '밀수꾼 두목', hp: 64, pal: 'pirate', hitSound: 'soft', aim: 'last', pat: [S(1), G(8), A(19), A(8, 2)],
             lines: ['"그 패, 좋아 보이는데. 잠깐 빌리지."', '"탑에서 파는 건 다 내 물건이야."'] },
  keeper:  { name: '등대지기', hp: 95, pal: 'keeper', hitSound: 'soft', long: true, crown: true, aim: 'light',
             lines: ['"불빛이 닿는 곳이 네 자리다."', '"오늘 밤도 올라왔나. 불을 켜 두마."', '"그림자에 숨어 봐야 소용없다. 불은 돌거든."'],
             light: { double: .5 },   // 불빛이 비춘 동료: 그 동료 카드 비용 +1, 단일 공격은 그 동료를 노림. 체력 절반이면 불빛 둘
             pat: [A(9), M(11, 8), A(6, 3), U(3)] },
  // 1막 보스 변형 (판 시드로 등대지기와 둘 중 하나): 안개 마녀 여왕 — 저주·약한 동료 노림, 「안개 장막」
  queen:   { name: '안개 마녀 여왕', hp: 92, pal: 'queen', hitSound: 'magic', long: true, crown: true, aim: 'weakest',
             lines: ['"안개가 짙은 밤엔 다들 길을 잃지. 너희도."', '"내 딸들이 신세를 졌다지? 이번엔 내가 상대해 주마."', '"장막 너머가 보이니? …보일 리가 없지."'],
             phase2: { at: .5, msg: '안개 마녀 여왕이 왕관을 높이 들었다. 안개 그림자가 몰려온다.', aim: 'back',
                       pat: [Z('mistling'), R(8), A(17), K('curse.fog', 1)] },
             pat: [K('curse.fog', 2), A(13), W('weak', 2), A(7, 2)] },
  mistling:{ name: '안개 그림자', hp: 14, pal: 'mist', hitSound: 'magic', long: true, small: true, aim: 'back', pat: [A(6), W('weak', 1)] },
  // 2막 구름층
  cloud:   { name: '구름 정령', hp: 44, pal: 'cloud', hitSound: 'magic', long: true, pat: [A(13, 2), B(10), A(28)] },
  feather: { name: '깃털 기사', hp: 50, pal: 'knight', hitSound: 'shell', pat: [A(24), M(15, 7), U(3)] },
  sheep:   { name: '천둥 양', hp: 46, pal: 'cloud', hitSound: 'beast', aim: 'weakest', pat: [A(9, 3), A(24)] },
  vane:    { name: '바람개비 병사', hp: 42, pal: 'knight', hitSound: 'shell', aim: 'last', pat: [A(17), A(13)] },
  jelly:   { name: '안개 해파리', hp: 38, pal: 'jelly', hitSound: 'soft', long: true, aim: 'weakest', pat: [H(8), A(15), A(8, 2)] },
  kite:    { name: '연 기사', hp: 40, pal: 'kite', hitSound: 'shell', pat: [A(16), N('back'), A(23), N('front')] },
  puff:    { name: '뭉게 자폭병', hp: 26, pal: 'cloud', hitSound: 'magic', pat: [B(6), A(13), X(24)] },
  bird:    { name: '번개새', hp: 84, pal: 'knight', hitSound: 'beast', long: true, aim: 'back', pat: [A(12, 3), U(3), A(35)],
             lines: ['번개새가 날개를 펴자 공기가 찌릿하다.', '하늘이 갈라지는 소리. 번개새가 내려앉는다.'] },
  trumpet: { name: '폭풍 나팔수', hp: 78, pal: 'knight', hitSound: 'shell', long: true, pat: [Z('puff'), R(10), U(3), A(23)],
             lines: ['"나팔 소리가 들리면 구름이 모인다!"', '"숨 한 번이면 폭풍 하나다!"'] },
  vaneL:   { name: '풍향계 동', hp: 45, pal: 'cloud', hitSound: 'shell', aim: 'weakest', pat: [A(16), B(12)], line: '삐걱, 삐걱. 두 풍향계가 서로를 등지고 돈다.' },
  vaneR:   { name: '풍향계 서', hp: 45, pal: 'cloud', hitSound: 'shell', aim: 'weakest', pat: [B(12), A(16)] },
  captain: { name: '구름 기사단장', hp: 120, pal: 'knight', hitSound: 'shell', long: true, crown: true, armor: 1, aim: 'front',
             lines: ['"구름 기사단의 이름으로. 여기서 돌아가라."', '"높이 오를수록 떨어지는 것도 아프다."', '"…시그룬은 결국 너희 편에 섰군."'],
             phase2: { at: .5, msg: '구름 기사단장이 갑옷을 벗어던졌다! 피해 감소가 사라지고 매 턴 두 번 움직인다.', armor: 0, acts: 2, aim: 'cycle',
                      pat: [A(10), A(4, 2), M(8, 8), U(2)] },
             pat: [M(12, 10), A(7, 3), U(3), A(20)] },
  // 2막 보스 변형 (판 시드로 구름 기사단장과 둘 중 하나): 폭풍 고래 — 밤 시계 압박·모두 공격, 터지는 턴에 비틀거림
  whale:   { name: '폭풍 고래', hp: 136, pal: 'whale', hitSound: 'beast', long: true, crown: true, aim: 'front',
             lines: ['구름 바다가 갈라지고, 번개를 두른 거대한 고래가 떠오른다.', '노랫소리 같은 울음이 탑 전체를 흔든다.', '고래 등의 폭풍이 밤 시계 바늘을 밀어낸다.'],
             phase2: { at: .5, msg: '폭풍 고래가 폭풍의 눈으로 들어갔다! 매 턴 밤 시계 +1분, 모두를 휩쓴다.', turnClock: 1, aim: 'weakest',
                       pat: [R(11), A(10, 2), A(20), R(15)] },
             pat: [R(10), A(23), A(9, 2), A(7, 3)] },
  // 3막 별층
  statue:  { name: '별 조각상', hp: 46, pal: 'star', hitSound: 'shell', pat: [B(15), A(16)] },
  cat:     { name: '그림자 고양이', hp: 40, pal: 'cat', hitSound: 'beast', long: true, aim: 'back', pat: [A(5, 4), U(3)] },
  archer:  { name: '유성 사수', hp: 48, pal: 'star', hitSound: 'soft', long: true, aim: 'back', pat: [A(9, 2), A(18)] },
  angel:   { name: '시계태엽 천사', hp: 40, pal: 'star', hitSound: 'shell', aim: 'last', pat: [A(10), T(10)] },
  comet:   { name: '꼬리별', hp: 30, pal: 'comet', hitSound: 'magic', aim: 'back', pat: [A(6, 2), A(8), X(18)] },
  gear:    { name: '톱니 기사', hp: 52, pal: 'gear', hitSound: 'shell', thorns: 3, pat: [M(10, 10), A(16)] },
  thief:   { name: '별 도둑', hp: 36, pal: 'thief', hitSound: 'soft', long: true, aim: 'last', pat: [S(1), A(9), T(8)] },
  rider:   { name: '유성 기수', hp: 100, pal: 'star', hitSound: 'beast', crown: true, pat: [A(8, 3), M(14, 14), U(4)],
             lines: ['"달려라! 새벽보다 먼저!"', '불타는 말발굽 소리가 유리 바닥을 울린다.'] },
  shadow:  { name: '달의 그림자', hp: 90, pal: 'cat', hitSound: 'magic', long: true, aim: 'weakest', pat: [A(12), W('vuln', 2), A(6, 3)],
             lines: ['"너희 그림자, 내가 가져가도 될까."', '달빛이 비틀리며 사람 모양이 된다.'] },
  sage:    { name: '성좌 마법사', hp: 92, pal: 'thief', hitSound: 'magic', long: true, crown: true, pat: [G(10), R(8), Z('comet'), A(20)],
             lines: ['"별자리는 내가 이어. 너희 자리는 없어."', '"떨어지는 별은 다 내 거야."'] },
  dawn:    { name: '새벽', hp: 176, pal: 'dawn', hitSound: 'magic', long: true, crown: true, aim: 'dawn', turnClock: 1, burstClock: 3,
             lines: ['"왜 매일 밤 올라오는 거야? …그냥 아침이 오게 두면 되잖아."', '"또 너희구나. 오늘은 몇 시에 왔어?"', '"밤은 끝나게 돼 있어. 너희가 뭘 하든."'],
             phase2: { at: .5, msg: '해가 뜬다. 밤 시계 +5분.', clockOnce: 5, turnClock: 1 },
             // 밤의 깊이 5 이상에서만: 체력 20% 아래 「한낮」 3단계
             phase3: { at: .2, depth: 5, msg: '한낮. 「새벽」이 해를 등에 지고 날아올랐다. 매 턴 모두 공격, 밤 시계 +2분. 대신 한 턴 100+ 벌칙은 사라진다.',
                       line: '"…아직도 서 있어? 그럼 끝까지 보여 줄게. 한낮을."', clockOnce: 3, turnClock: 2, burstClock: 0, aim: 'dawn',
                       pat: [R(9), A(13), A(5, 4), R(12), U(3)] },
             pat: [A(11), A(5, 4), M(14, 14), U(4), A(24)] },
  // 시즌 1 보스 (js/data/season.js): 떨어진 별의 왕 — 별 조각 부르기·모두 공격, 2단계 별비, 3단계 추락
  starking: { name: '떨어진 별의 왕', hp: 330, pal: 'starking', hitSound: 'magic', long: true, crown: true, aim: 'weakest',
             lines: ['"떨어졌다고 왕이 아닌 줄 아느냐."', '"밤을 지킨다고? 이 밤하늘은 원래 내 자리다."', '"올라오너라. 여기선 너희 발밑까지 다 보인다."'],
             phase2: { at: .6, msg: '떨어진 별의 왕이 왕관을 들어 올렸다. 별비가 쏟아진다.', aim: 'back', pat: [R(8), Z('starshard'), A(7, 3), U(3)] },
             phase3: { at: .25, msg: '추락. 별의 왕 둘레의 빛이 한 점으로 뭉친다.', line: '"…함께 떨어지자. 이 탑 아래로."', acts: 2, pat: [A(16), R(10), A(5, 4)] },
             pat: [A(14), Z('starshard'), R(7), M(12, 12), A(6, 3)] },
  starshard: { name: '별 조각', hp: 14, pal: 'starshard', hitSound: 'magic', small: true, deathBoom: 3, pat: [A(4), A(2, 2)] },
  // 첫 실행 튜토리얼 (js/data/tutorial.js): 약하게
  tut_ghost: { name: '아기 바다 유령', hp: 24, pal: 'sea', hitSound: 'magic', long: true, pat: [A(4), A(2, 2), A(5)] },
  tut_gull:  { name: '갈매기', hp: 10, pal: 'gull', hitSound: 'beast', aim: 'back', small: true, pat: [A(3)] },
  tut_lamp:  { name: '떠도는 등불', hp: 60, pal: 'keeper', hitSound: 'magic', crown: true, line: '"작은 불빛이라고 얕보지 마."',
               pat: [A(6), B(6), A(3, 2), A(7)] },
};

export const ACTS = {
  1: { easy: [['ghost'], ['crab'], ['gull', 'gull', 'gull'], ['eel']],
       fights: [['ghost'], ['crab'], ['pirate', 'pirate'], ['gull', 'gull', 'gull'], ['ghost', 'gull'], ['eel'], ['powder', 'pirate'],
                ['parrot', 'gull'], ['eel', 'gull'], ['crab', 'powder']],
       elites: [['anchor'], ['witch'], ['smuggler', 'pirate']], boss: ['keeper', 'queen'] },
  2: { easy: [['cloud'], ['feather'], ['kite']],
       fights: [['cloud'], ['feather'], ['sheep'], ['vane'], ['cloud', 'vane'], ['jelly', 'feather'], ['kite'], ['puff', 'puff'],
                ['kite', 'jelly'], ['sheep', 'puff']],
       elites: [['bird'], ['vaneL', 'vaneR'], ['trumpet']], boss: ['captain', 'whale'] },
  3: { easy: [['statue'], ['cat'], ['gear']],
       fights: [['statue'], ['cat'], ['archer'], ['angel'], ['angel', 'cat'], ['comet', 'comet'], ['gear'], ['thief', 'cat'],
                ['statue', 'comet'], ['gear', 'thief']],
       elites: [['rider'], ['shadow'], ['sage']], boss: ['dawn'] },
};

// ③ 폭발 대응 (docs/12_signature.md §4): 막지 않고 언제 터뜨릴지 고민하게. 수치 밸런스는 위 FOE 표가 아니라 여기 한 곳.
//   huntBurst: 그 턴 ③이 터진 동료를 노림 · heavyTime: 그 턴 피해가 over 이상이면 밤 시계 +add 더
//   twinRage: 짝(같은 필드를 가진 적)이 쓰러지면 남은 쪽 힘 + · phase2.aim 'top' + duel: 가장 많이 친 동료를 노리고, 그 동료에게 맞으면 반격
Object.assign(FOE.witch, { huntBurst: true });
Object.assign(FOE.angel, { heavyTime: { over: 60, add: 5 } });
Object.assign(FOE.vaneL, { twinRage: 5 });
Object.assign(FOE.vaneR, { twinRage: 5 });
// 안개 마녀 여왕: ③을 먼저 터뜨려 장막을 걷고 몰아칠지, 아껴 둘지. 폭풍 고래: 터지는 턴을 만들면 한 번 비틀거린다(대신 시계가 계속 돈다).
Object.assign(FOE.queen, { mistVeil: { block: 12, vuln: 2 } });
Object.assign(FOE.whale, { stagger: true });
Object.assign(FOE.captain.phase2, { aim: 'top', duel: 5, msg: '구름 기사단장이 갑옷을 벗어던졌다! 「도전」: 가장 많이 친 동료를 노리고, 그 동료에게 맞으면 반격한다. 매 턴 두 번 움직인다.' });
