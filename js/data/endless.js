// 끝없는 탑 (docs/05_meta.md §12): 「새벽」을 한 번 깬 뒤 열린다. 「새벽」 너머로 층이 계속 올라간다.
// 층 묶음(5층) = 지도 4층 + 관문 1층. 관문은 강적, 10층마다 보스(기존 보스 강화판을 돌아가며).
// 층 묶음마다 변칙 규칙 1개가 쌓인다(매일의 밤 규칙 js/data/daily.js 재사용). 수치 밸런스는 이 파일 한 곳.
import { ACTS } from './enemies.js';
import { DAILY_RULES } from './daily.js';

export const ENDLESS = {
  seg: 5,              // 층 묶음 하나의 층 수 (지도 4층 + 관문)
  bossEvery: 10,       // 이 층마다 관문이 보스
  bosses: ['keeper', 'captain', 'dawn'],   // 돌아가며 나오는 보스
  // 적 강화: 체력 배수 = 3막 배수 × (1 + 층 × hpPerFloor), 힘 = 층 × strPerFloor(내림) + 여명 쌓임
  baseHp: { fight: 2.6, elite: 2.9, boss: 3.2 },   // 0층 기준 체력 배수 (3막보다 강적·보스가 조금 약하다: 층마다 커지므로)
  hpPerFloor: .03,
  strPerFloor: .2,
  // 여명 게이지: 끝없는 탑에 들어선 뒤 밤 시계가 dawnMin분 흐를 때마다 적 시작 힘 +1 (시간 카드·칸 시간이 그대로 압박이 된다)
  dawnMin: 45,
  segHeal: .15,       // 새 층 묶음에 들어설 때마다 회복(최대 체력 비율)
  entryHeal: .4,       // 들어설 때 모든 동료 최대 체력의 비율만큼 회복(쓰러진 동료도 일어난다)
  // 새로 시작(「새벽」 판에서 이어 오르지 않고 본부에서 바로): 동료마다 희귀 카드 1장 + 도구 2개 + 별빛
  freshGold: 120, freshRelics: 2,
  // 별 조각: 오른 층 × perFloor (상한 cap) + 탑 위 보스마다 perBoss
  shards: { perFloor: 2, cap: 80, perBoss: 8 },
  rules: DAILY_RULES,  // 층 묶음마다 하나씩 쌓이는 변칙 규칙 (겹치지 않게 돌아간다)
};

// 끝없는 탑의 적 무리: 2·3막 일반 전투·강적을 섞어서. run.js pickElite가 ACTS[G.act]를 보므로 4막 자리에 둔다.
ACTS[4] = {
  easy: ACTS[3].fights,
  fights: [...ACTS[2].fights, ...ACTS[3].fights],
  elites: [...ACTS[2].elites, ...ACTS[3].elites],
  boss: [ENDLESS.bosses[0]],
};

// 관문 층(5의 배수)이 보스인가
export const isBossGate = floor => floor % ENDLESS.bossEvery === 0;
// 그 층 묶음의 보스 (돌아가며)
export const endlessBoss = floor => ENDLESS.bosses[(Math.floor(floor / ENDLESS.bossEvery) - 1 + ENDLESS.bosses.length * 100) % ENDLESS.bosses.length];
// 쌓인 규칙들의 수치 필드를 합친다(곱 필드 *Mul은 곱한다). 매일의 밤 규칙이 있으면 그것도 같이.
export function mergeMods(list) {
  const out = {};
  for (const m of list) for (const [k, v] of Object.entries(m || {})) {
    if (k.endsWith('Mul')) out[k] = (out[k] ?? 1) * v;
    else out[k] = (out[k] || 0) + v;
  }
  return out;
}
