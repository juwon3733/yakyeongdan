// 도구 24개 (docs/10_details.md §3). 엔진(js/relics.js)은 아래 필드와 훅만 읽는다.
//   tier: start · c 흔함 · u 보통 · r 희귀 · boss
//   수치 필드: blockFront·blockBackFirst·winHealLowest·chain3Draw·eventGuard·winChainHeal·eliteTime·restHealAdd·winGold
//     duoFree·swaps·swapFree·revivePct·pistol·firstEnergy·firstDraw·bond·goldFeather·noDawn·restHealMul
//     timeCardFree·nodeTimeAdd·energy·handSize·hourglass·starMap
//   use: 판마다 한 번 누르는 버튼 ('rewind' 시계 되돌리기, 'moon' 달 바꾸기)
//   onGet: 얻는 순간 ('moonPick' 달 고르기 화면)
export const RELICS = {
  old_watch:     { name: '낡은 회중시계', tier: 'start', text: '판마다 한 번, 밤 시계 20분 되돌리기(누르기).', use: 'rewind', v: 20 },
  lantern:       { name: '야경단 등불', tier: 'start', text: '전투 시작에 앞줄 동료 방어 6.', blockFront: 6 },
  first_aid:     { name: '구급 가방', tier: 'start', text: '전투가 끝날 때 체력이 가장 낮은 동료 체력 4 회복.', winHealLowest: 4 },
  twin_ribbon:   { name: '쌍둥이 리본', tier: 'c', text: '연계가 3칸이 될 때마다 카드 1장.', chain3Draw: 1 },
  salt_pouch:    { name: '소금 주머니', tier: 'c', text: '사건 칸에서 나쁜 결과를 1번 막아 준다.', eventGuard: 1 },
  sea_glass:     { name: '바다 유리', tier: 'c', text: '전투가 끝날 때 남은 연계 1칸당 모든 동료 체력 1.', winChainHeal: 1 },
  compass:       { name: '구리 나침반', tier: 'c', text: '지도에서 강적 칸 시간 -10분.', eliteTime: -10 },
  umbrella:      { name: '우산', tier: 'c', text: '첫 턴 뒷줄 동료 방어 8.', blockBackFirst: 8 },
  scarf:         { name: '따뜻한 목도리', tier: 'c', text: '휴식 칸 쉬기 회복 +10%.', restHealAdd: .1 },
  star_candy:    { name: '별사탕', tier: 'c', text: '전투에서 이기면 별빛 +5.', winGold: 5 },
  star_map:      { name: '별 지도', tier: 'u', text: '지도에서 다음 막 칸 종류가 미리 보인다.', starMap: 1 },
  hourglass:     { name: '깨진 모래시계', tier: 'u', text: '시간 카드를 에너지 1로도 쓸 수 있다(쓸 때 고름).', hourglass: 1 },
  whistle:       { name: '은 호루라기', tier: 'u', text: '듀오 카드 비용 0.', duoFree: 1 },
  banner:        { name: '대열 깃발', tier: 'u', text: '대열 바꾸기가 턴마다 두 번, 방어 감소 없음.', swaps: 2, swapFree: 1 },
  bandage:       { name: '붕대 묶음', tier: 'u', text: '쓰러진 동료가 전투 끝에 체력 1이 아니라 30%로 일어난다.', revivePct: .3 },
  moon_bottle:   { name: '달빛 병', tier: 'u', text: '판마다 한 번, 전투 중 달을 다음 모양으로(누르기).', use: 'moon' },
  pistol:        { name: '장전된 권총', tier: 'u', text: '전투 시작에 무작위 적 피해 8.', pistol: 8 },
  moon_shard:    { name: '달 조각', tier: 'r', text: '얻으면 달 모양을 고른다(판 시작에 가지고 있으면 그때).', onGet: 'moonPick' },
  armband:       { name: '야경단 완장', tier: 'r', text: '첫 턴 에너지 +1, 카드 +1.', firstEnergy: 1, firstDraw: 1 },
  bond_thread:   { name: '인연의 실', tier: 'r', text: '인연이 아닌 두 동료도 연계 3칸에서 이어 쓰면 「합동」 카드(피해 8, 방어 8, 비용 1, 소멸)가 생긴다.', bond: 1 },
  gold_feather:  { name: '금빛 깃털', tier: 'r', text: '동료가 처음 쓰러질 때 체력 10으로 버틴다(판마다 동료당 1번).', goldFeather: 10 },
  dawn_feather:  { name: '새벽의 깃털', tier: 'boss', text: '6시 이후 여명 효과가 없다. 대신 휴식 칸 회복 절반.', noDawn: 1, restHealMul: .5 },
  stopped_tower: { name: '멈춘 시계탑', tier: 'boss', text: '시간 카드 비용 0분. 대신 칸 시간 +5분.', timeCardFree: 1, nodeTimeAdd: 5 },
  star_crown:    { name: '별의 왕관', tier: 'boss', text: '매 턴 에너지 +1. 대신 손패 4장.', energy: 1, handSize: -1 },
};
export const RELIC_TIER_NAME = { start: '시작', c: '흔함', u: '보통', r: '희귀', boss: '보스' };
// 강적·사건·야시장에서 나오는 도구 등급 확률 (흔함 50 / 보통 35 / 희귀 15)
export const RELIC_ODDS = { c: .5, u: .35, r: .15 };
export const START_RELIC = 'old_watch';
