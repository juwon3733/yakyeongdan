// 달 (docs/02_rules.md §5). 엔진은 timeCost·duoNeed·boost·darkBonus·spiritBonus·twinMul·rewindBonus를 읽는다.
export const MOONS = {
  crescent: { name: '초승달', text: '시간 카드가 15분만 든다. 세바스 시간 되돌리기 +5분.', timeCost: 15, rewindBonus: 5 },
  half:     { name: '반달',   text: '연계 1칸만 차도 듀오 카드가 생긴다. 미미·모모 쌍 효과 2배.', duoNeed: 1, twinMul: 2 },
  full:     { name: '보름달', text: '아이리스·마르타의 피해와 방어 +2. 시온 정령 피해 +1.', boost: { iris: 2, marta: 2 }, spiritBonus: 1 },
  new:      { name: '그믐달', text: '노엘 마력, 레이븐 독, 브릭 장전 +1.', darkBonus: 1 },
};
