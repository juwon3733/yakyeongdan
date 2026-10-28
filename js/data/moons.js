// 달 (docs/02_rules.md §5). 엔진은 timeCost·duoNeed·boost·darkBonus만 읽는다.
export const MOONS = {
  crescent: { name: '초승달', text: '시간 카드가 15분만 든다.', timeCost: 15 },
  half:     { name: '반달',   text: '연계 1칸만 차도 듀오 카드가 생긴다.', duoNeed: 1 },
  full:     { name: '보름달', text: '아이리스·마르타의 피해와 방어 +2.', boost: { iris: 2, marta: 2 } },
  new:      { name: '그믐달', text: '노엘 마력, 레이븐 독, 브릭 장전 +1.', darkBonus: 1 },
};
