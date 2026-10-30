// 도구 40개 (docs/10_details.md §3). 엔진(js/relics.js)은 아래 필드와 훅만 읽는다.
//   tier: start · c 흔함 · u 보통 · r 희귀 · boss
//   수치 필드: blockFront·blockBackFirst·winHealLowest·chain3Draw·eventGuard·winChainHeal·eliteTime·restHealAdd·winGold
//     duoFree·swaps·swapFree·revivePct·pistol·firstEnergy·firstDraw·bond·goldFeather·noDawn·restHealMul
//     timeCardFree·nodeTimeAdd·energy·handSize·hourglass·starMap
//     frontBlockTurn 매 턴 앞줄 방어 · swapBlock 대열 바꾸면 바꾼 둘 방어 · timeCardBlock 시간 카드 쓰면 주인 방어 · restTime 휴식 칸 시간
//     duoBlock·duoHeal 듀오를 쓰면 두 사람 · duoDraw 듀오가 생기면 카드 · bondStart 인연 짝이 있으면 첫 턴 연계 · chainStart 첫 턴 연계
//     winRewind 이기면 시계 되돌리기 · timeCardAdd 시간 카드 비용 + · rewardLess 보상 카드 수 − · moonEnergy 달이 바뀌면 에너지
//     moonStart { moon, energy·chain·blockAll·poisonAll } 그 달일 때 전투 시작
//   use: 판마다 한 번 누르는 버튼 ('rewind' 시계 되돌리기, 'moon' 달 바꾸기)
//   onGet: 얻는 순간 ('moonPick' 달 고르기 화면)
export const RELICS = {
  old_watch:     { name: '낡은 회중시계', tier: 'start', text: '판마다 한 번, 눌러서 밤 시계 −20분.', use: 'rewind', v: 20 },
  lantern:       { name: '야경단 등불', tier: 'start', text: '전투 시작에 앞줄 동료 방어 6.', blockFront: 6 },
  first_aid:     { name: '구급 가방', tier: 'start', text: '전투가 끝나면 체력이 가장 낮은 동료가 체력 4 회복.', winHealLowest: 4 },
  twin_ribbon:   { name: '쌍둥이 리본', tier: 'c', text: '연계가 3칸이 될 때마다 카드 1장.', chain3Draw: 1 },
  salt_pouch:    { name: '소금 주머니', tier: 'c', text: '사건 칸에서 나쁜 결과를 1번 막아 준다.', eventGuard: 1 },
  sea_glass:     { name: '바다 유리', tier: 'c', text: '전투가 끝나면 남은 연계 1칸마다 모든 동료가 체력 1 회복.', winChainHeal: 1 },
  compass:       { name: '구리 나침반', tier: 'c', text: '강적 칸에 드는 시간 −10분.', eliteTime: -10 },
  umbrella:      { name: '우산', tier: 'c', text: '전투 첫 턴에 뒷줄 동료 방어 8.', blockBackFirst: 8 },
  scarf:         { name: '따뜻한 목도리', tier: 'c', text: '휴식 칸에서 쉬면 회복 +10%.', restHealAdd: .1 },
  star_candy:    { name: '별사탕', tier: 'c', text: '전투에서 이기면 별빛 +5.', winGold: 5 },
  tide_bell:     { name: '밀물 종', tier: 'c', text: '턴마다 앞줄 동료 방어 2.', frontBlockTurn: 2 },
  rope:          { name: '묶음 밧줄', tier: 'c', text: '대열을 바꾸면 바꾼 둘은 방어가 줄지 않고 방어 +3.', swapBlock: 3 },
  crescent_pin:  { name: '초승 브로치', tier: 'c', text: '초승달이면 전투 첫 턴 에너지 +1.', moonStart: { moon: 'crescent', energy: 1 } },
  half_ribbon:   { name: '반달 리본', tier: 'c', text: '반달이면 전투 첫 턴을 연계 1칸으로 시작.', moonStart: { moon: 'half', chain: 1 } },
  full_mirror:   { name: '보름 손거울', tier: 'c', text: '보름달이면 전투 시작에 모든 동료 방어 5.', moonStart: { moon: 'full', blockAll: 5 } },
  new_ink:       { name: '그믐 먹물', tier: 'c', text: '그믐달이면 전투 시작에 모든 적 독 4.', moonStart: { moon: 'new', poisonAll: 4 } },
  star_map:      { name: '별 지도', tier: 'u', text: '다음 막 지도의 칸 종류를 미리 본다.', starMap: 1 },
  hourglass:     { name: '깨진 모래시계', tier: 'u', text: '시간 카드를 에너지 1로도 쓸 수 있다(쓸 때 고른다).', hourglass: 1 },
  whistle:       { name: '은 호루라기', tier: 'u', text: '듀오 카드 비용 0.', duoFree: 1 },
  banner:        { name: '대열 깃발', tier: 'u', text: '대열 바꾸기를 턴마다 두 번. 바꿔도 방어가 줄지 않는다.', swaps: 2, swapFree: 1 },
  bandage:       { name: '붕대 묶음', tier: 'u', text: '전투가 끝나면 쓰러진 동료가 체력 1 대신 30%로 일어난다.', revivePct: .3 },
  moon_bottle:   { name: '달빛 병', tier: 'u', text: '판마다 한 번, 전투 중에 눌러서 달을 다음 모양으로.', use: 'moon' },
  pistol:        { name: '장전된 권총', tier: 'u', text: '전투 시작에 무작위 적에게 피해 8.', pistol: 8 },
  duo_scarf:     { name: '맞춤 목도리', tier: 'u', text: '듀오 카드를 쓰면 두 사람 체력 3 회복.', duoHeal: 3 },
  duo_shield:    { name: '한 쌍의 방패', tier: 'u', text: '듀오 카드를 쓰면 두 사람 방어 5.', duoBlock: 5 },
  sand_pendant:  { name: '모래시계 펜던트', tier: 'u', text: '시간 카드를 쓰면 그 카드 주인 방어 6.', timeCardBlock: 6 },
  last_ticket:   { name: '막차표', tier: 'u', text: '휴식 칸에 드는 시간 −15분.', restTime: -15 },
  red_knot:      { name: '붉은 실 매듭', tier: 'u', text: '파티에 인연 짝이 있으면 전투 첫 턴을 연계 1칸으로 시작.', bondStart: 1 },
  moon_shard:    { name: '달 조각', tier: 'r', text: '얻자마자 달 모양을 고른다. 판을 시작할 때부터 있으면 그때 고른다.', onGet: 'moonPick' },
  armband:       { name: '야경단 완장', tier: 'r', text: '전투 첫 턴 에너지 +1, 카드 +1장.', firstEnergy: 1, firstDraw: 1 },
  bond_thread:   { name: '인연의 실', tier: 'r', text: '인연이 아닌 두 동료도 연계 3칸에서 이어 쓰면 「합동」 카드가 생긴다(피해 8, 방어 8, 비용 1, 소멸).', bond: 1 },
  gold_feather:  { name: '금빛 깃털', tier: 'r', text: '동료마다 판에서 한 번, 쓰러질 때 체력 10으로 버틴다.', goldFeather: 10 },
  watch_chain:   { name: '시곗줄', tier: 'r', text: '전투에서 이기면 밤 시계 −4분.', winRewind: 4 },
  moon_compass:  { name: '달 나침반', tier: 'r', text: '전투 중 달이 바뀔 때마다 에너지 +1.', moonEnergy: 1 },
  twin_star:     { name: '쌍별 펜던트', tier: 'r', text: '듀오 카드가 생기면 카드 1장.', duoDraw: 1 },
  dawn_feather:  { name: '새벽의 깃털', tier: 'boss', text: '6시가 넘어도 여명이 오지 않는다. 대신 휴식 칸 회복이 절반.', noDawn: 1, restHealMul: .5 },
  stopped_tower: { name: '멈춘 시계탑', tier: 'boss', text: '시간 카드 비용 0분. 대신 칸마다 시간 +5분.', timeCardFree: 1, nodeTimeAdd: 5 },
  star_crown:    { name: '별의 왕관', tier: 'boss', text: '턴마다 에너지 +1. 대신 손패가 4장.', energy: 1, handSize: -1 },
  reverse_clock: { name: '거꾸로 도는 시계', tier: 'boss', text: '전투에서 이기면 밤 시계 −6분. 대신 시간 카드 비용 +10분.', winRewind: 6, timeCardAdd: 10 },
  // 보스 전용: from 보스를 쓰러뜨렸을 때만 보스 도구 셋 중 하나로 나온다 (js/map.js takeReward)
  fog_crown:     { name: '안개 왕관', tier: 'boss', from: 'queen', text: '전투 시작에 모든 적 독 6. 대신 휴식 칸 회복이 절반.', poisonAll: 6, restHealMul: .5 },
  whale_song:    { name: '고래의 노래', tier: 'boss', from: 'whale', text: '턴마다 앞줄 동료 방어 4. 대신 칸마다 시간 +3분.', frontBlockTurn: 4, nodeTimeAdd: 3 },
  star_sash:     { name: '별자리 띠', tier: 'boss', text: '전투 첫 턴을 연계 3칸으로 시작. 대신 보상 카드가 한 장 적다.', chainStart: 3, rewardLess: 1 },
  // 전용 도구 20개 (docs/10_details.md §3, 별자리 4). 주인(owner)이 파티에 있고 별자리 4일 때만 보통 등급 자리에 섞여 나온다.
  //   ownerBlock 전투 시작에 주인 방어 · poisonAll/burnAll 전투 시작에 모든 적 독/화상 · napAdd 낮잠 +분
  sig_sion:     { name: '첫 별의 모래', tier: 'sig', owner: 'sion', text: '전투 첫 턴 카드 +1장.', firstDraw: 1 },
  sig_lunaria:  { name: '달빛 방울', tier: 'sig', owner: 'lunaria', text: '휴식 칸에서 쉬면 회복 +10%.', restHealAdd: .1 },
  sig_akane:    { name: '붉은 숫돌', tier: 'sig', owner: 'akane', text: '전투 시작에 모든 적 화상 3.', burnAll: 3 },
  sig_eleonore: { name: '태엽 열쇠', tier: 'sig', owner: 'eleonore', text: '휴식 칸 낮잠으로 되찾는 시간 +15분.', napAdd: 15 },
  sig_iris:     { name: '스승의 숫돌', tier: 'sig', owner: 'iris', text: '전투 시작에 무작위 적에게 피해 6.', pistol: 6 },
  sig_noel:     { name: '깃털 베개', tier: 'sig', owner: 'noel', text: '휴식 칸 낮잠으로 되찾는 시간 +10분.', napAdd: 10 },
  sig_raven:    { name: '독 주머니', tier: 'sig', owner: 'raven', text: '전투 시작에 모든 적 독 3.', poisonAll: 3 },
  sig_mimimomo: { name: '쌍둥이 거울', tier: 'sig', owner: 'mimimomo', text: '연계가 3칸이 될 때마다 카드 1장.', chain3Draw: 1 },
  sig_sebas:    { name: '은 찻주전자', tier: 'sig', owner: 'sebas', text: '전투가 끝나면 체력이 가장 낮은 동료가 체력 5 회복.', winHealLowest: 5 },
  sig_mariana:  { name: '금화 주머니', tier: 'sig', owner: 'mariana', text: '전투에서 이기면 별빛 +8.', winGold: 8 },
  sig_tomori:   { name: '작은 등불', tier: 'sig', owner: 'tomori', text: '전투 첫 턴에 뒷줄 동료 방어 8.', blockBackFirst: 8 },
  sig_sigrun:   { name: '은빛 깃', tier: 'sig', owner: 'sigrun', text: '전투 시작에 시그룬 방어 8.', ownerBlock: 8 },
  sig_zeno:     { name: '용비늘 조각', tier: 'sig', owner: 'zeno', text: '전투 시작에 제노 방어 10.', ownerBlock: 10 },
  sig_brick:    { name: '예비 포탄', tier: 'sig', owner: 'brick', text: '전투 시작에 무작위 적에게 피해 8.', pistol: 8 },
  sig_marta:    { name: '성당 열쇠', tier: 'sig', owner: 'marta', text: '전투 시작에 앞줄 동료 방어 8.', blockFront: 8 },
  sig_finn:     { name: '지름길 지도', tier: 'sig', owner: 'finn', text: '강적 칸에 드는 시간 −10분.', eliteTime: -10 },
  sig_laila:    { name: '바람 깃발', tier: 'sig', owner: 'laila', text: '전투 첫 턴 카드 +1장.', firstDraw: 1 },
  sig_dora:     { name: '모루 방패', tier: 'sig', owner: 'dora', text: '전투 시작에 도라 방어 6.', ownerBlock: 6 },
  sig_gordon:   { name: '큰 도시락', tier: 'sig', owner: 'gordon', text: '전투가 끝나면 체력이 가장 낮은 동료가 체력 6 회복.', winHealLowest: 6 },
  sig_nerea:    { name: '고래 귀걸이', tier: 'sig', owner: 'nerea', text: '전투 시작에 앞줄 동료 방어 8.', blockFront: 8 },
  sig_estelle:  { name: '별똥 브로치', tier: 'sig', owner: 'estelle', text: '전투 시작에 무작위 적에게 피해 10.', pistol: 10 },
  sig_bertha:   { name: '낡은 안내 깃발', tier: 'sig', owner: 'bertha', text: '강적 칸에 드는 시간 −8분.', eliteTime: -8 },
  sig_fukuro:   { name: '행운 고양이', tier: 'sig', owner: 'fukuro', text: '전투에서 이기면 별빛 +6.', winGold: 6 },
};
export const RELIC_TIER_NAME = { start: '시작', c: '레어', u: '에픽', r: '레전더리', boss: '보스', sig: '전용' };
// 강적·사건·야시장에서 나오는 도구 등급 확률 (흔함 50 / 보통 35 / 희귀 15)
export const RELIC_ODDS = { c: .5, u: .35, r: .15 };
export const START_RELIC = 'old_watch';
