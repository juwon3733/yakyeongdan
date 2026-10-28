// 사건 (docs/02_rules.md §12). f(x): x = 사건 도우미(heal, loseHp, addTime, rewind, maxHp, addRandomCard, removeCard).
// f가 true를 돌려주면 다음 층으로 넘어가지 않고 다른 화면(카드 지우기)으로 간다.
export const EVENTS = [
  { title: '시간 상인', text: '모래시계를 든 상인이 말을 건다. "밤 한 조각, 사고 팔지."',
    opts: [ { t: '30분을 판다: 체력 +15, 시계 +30분', f: x => { x.heal(15); x.addTime(30); } },
            { t: '30분을 산다: 체력 -8, 시계 -30분', f: x => { x.loseHp(8); x.rewind(30); } } ] },
  { title: '떠도는 별 조각', text: '계단참에 별 조각이 굴러다닌다. 손에 쥐면 무언가를 덜어 가거나 보태 준다.',
    opts: [ { t: '덱에서 카드 한 장 지우기', f: x => x.removeCard() },
            { t: '최대 체력 +6', f: x => { x.maxHp(6); } } ] },
  { title: '탑의 우물', text: '달빛이 고인 우물. 물을 마시거나, 바닥에 가라앉은 무언가를 건질 수 있다.',
    opts: [ { t: '물을 마신다: 체력 +12', f: x => x.heal(12) },
            { t: '건져 본다: 무작위 카드 1장', f: x => { x.addRandomCard(); } } ] },
];
