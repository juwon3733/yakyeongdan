// 시즌 (docs/SEASON_PLAN.md). 2주 한 시즌. 시즌 날짜는 한국 시간 기준(서버가 붙으면 서버 시계로).
//   rule: 시즌 동안 밤 오르기·시즌 보스에 붙는 탑 규칙(js/combat.js seasonTurn)
//   boss: 시즌 보스 적 id (js/data/enemies.js), tiers: 난이도(체력 배수·첫 클리어 별 조각)
//   pass: 무료 시즌 패스 — 판을 하면 시즌 별(xp)이 오르고 단계마다 보상
export const SEASONS = [
  { id: 's1', no: 1, name: '유성우의 밤', start: '2026-11-01T00:00:00+09:00', days: 14, col: '#9fb4ff',
    tagline: '별이 비처럼 떨어지는 밤, 탑 꼭대기 너머에서 무언가가 내려왔다.',
    rule: { id: 'meteor', name: '유성우', text: '내 턴이 시작될 때마다 별똥이 떨어져 무작위 적에게 피해 4. 가끔은 동료에게도 2.' },
    boss: 'starking',
    tiers: [
      { id: 'normal', name: '일반', hp: 1, first: 100 },
      { id: 'hard', name: '어려움', hp: 1.6, first: 150, atk: 1.25 },
      { id: 'night', name: '악몽', hp: 2.4, first: 250, atk: 1.5 },
    ] },
];
// 시즌 패스: 30단계, 단계마다 xp 100. 판 결과로 얻는 시즌 별(js/season.js passXp)
export const PASS = { tiers: 30, per: 100,
  reward: n => n % 10 === 0 ? { shards: 100, title: `시즌 별 ${n}` } : n % 5 === 0 ? { shards: 50 } : { shards: 20 } };
// 시즌 보스 판: 동료마다 레전더리 카드 2장 + 도구 2개를 들고 바로 보스 앞
export const SEASON_RUN = { legends: 2, relics: 2 };
