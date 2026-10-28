// 동료 카드·인연 듀오·저주 (docs/03_characters.md, docs/10_details.md).
//
// 카드 필드
//   ch 주인 · name · cost(에너지) · time:1(에너지 대신 밤 시계) · rarity 'c' 흔함 / 'u' 보통 / 'r' 희귀
//   atk:1 공격 · target: 'foe'(적 하나, atk면 기본) · 'all'(모든 적) · 'ally'(동료 고름) · 'none'
//   slash:1 베기 · exhaust:1 소멸 · wake:1 쓰면 노엘이 깸 · sleepOk:1 잠든 채로 씀
//   free(c) 참이면 비용 0 · v 수치 배열 · up 강화판에서 바꿀 필드(v, cost, time, target, text)
//   text 안의 {d0} 피해 · {b0} 방어 · {k0} 장전·마력·독(그믐달 +1) · {n0} 그냥 수 → 화면에서 실제 값으로 바뀐다(v[0])
//   play(c, e, v): c = 전투 상태, e = 효과 도우미(js/effects.js), v = 수치(강화판이면 up.v)
//     c.foe 고른 적 · c.foes 살아 있는 적 · c.block 카드 주인의 방어 · c.loaded · c.mana · c.asleep
//     c.slashes(이번 턴 베기) · c.totalSlashes · c.sheath · c.mirror · c.counter · c.taunt · c.nextEnergy
//     c.retain · c.keep · c.discount · c.late · c.garden
export const CARDS = {
  // 아이리스 — 베기
  'iris.slash':  { ch: 'iris', name: '베기', cost: 1, atk: 1, slash: 1, rarity: 'c', v: [6, 4], up: { v: [9, 4] },
    text: '피해 {d0}. 이번 턴 세 번째 베기부터 +{n1}.', play: (c, e, v) => { e.hit(v[0] + (c.slashes >= 2 ? v[1] : 0) + e.sheath()); e.slash(1); } },
  'iris.parry':  { ch: 'iris', name: '흘려 베기', cost: 1, atk: 1, slash: 1, rarity: 'c', v: [4, 4], up: { v: [5, 5] },
    text: '피해 {d0}, 방어 {b1}. 베기.', play: (c, e, v) => { e.hit(v[0] + e.sheath()); e.guard(v[1]); e.slash(1); } },
  'iris.issen':  { ch: 'iris', name: '일섬', cost: 0, time: 1, atk: 1, slash: 1, rarity: 'u', v: [12], up: { v: [16] },
    text: '피해 {d0}. 베기.', play: (c, e, v) => { e.hit(v[0] + e.sheath()); e.slash(1); } },
  'iris.twin':   { ch: 'iris', name: '연속 베기', cost: 1, atk: 1, slash: 1, rarity: 'c', v: [3], up: { v: [4] },
    text: '피해 {d0}을 두 번. 베기 두 번.', play: (c, e, v) => { e.hit(v[0] + e.sheath()); e.hit(v[0]); e.slash(2); } },
  'iris.sheath': { ch: 'iris', name: '칼집 치기', cost: 0, atk: 1, rarity: 'c', v: [3, 3], up: { v: [3, 5] },
    text: '피해 {d0}. 다음 베기 +{n1}.', play: (c, e, v) => { e.hit(v[0]); c.sheath += v[1]; } },
  'iris.moon':   { ch: 'iris', name: '달빛 칼날', cost: 1, atk: 1, rarity: 'c', v: [8, 6], up: { v: [10, 8] },
    text: '피해 {d0}. 보름달이면 +{n1}.', play: (c, e, v) => e.hit(v[0] + (e.moon === 'full' ? v[1] : 0)) },
  'iris.wind':   { ch: 'iris', name: '바람 가르기', cost: 1, atk: 1, slash: 1, target: 'all', rarity: 'u', v: [5], up: { v: [7] },
    text: '모든 적 피해 {d0}. 베기.', play: (c, e, v) => { e.hitAll(v[0] + e.sheath()); e.slash(1); } },
  'iris.mirror': { ch: 'iris', name: '거울 자세', cost: 1, rarity: 'u', v: [6, 2], up: { v: [8, 3] },
    text: '방어 {b0}. 이번 턴 베기마다 방어 {n1}.', play: (c, e, v) => { e.guard(v[0]); c.mirror += v[1]; } },
  'iris.dance':  { ch: 'iris', name: '검무', cost: 2, atk: 1, slash: 1, rarity: 'r', v: [10], up: { v: [14] },
    text: '피해 {d0}. 베기 두 번으로 친다.', play: (c, e, v) => { e.hit(v[0] + e.sheath()); e.slash(2); } },
  'iris.final':  { ch: 'iris', name: '마지막 일격', cost: 2, atk: 1, rarity: 'r', v: [20], up: { v: [26] }, free: c => c.slashes >= 3,
    text: '피해 {d0}. 이번 턴 베기 3번 이상이면 비용 0.', play: (c, e, v) => e.hit(v[0]) },
  'iris.thousand': { ch: 'iris', name: '천 번 베기', cost: 3, atk: 1, exhaust: 1, rarity: 'r', v: [2], up: { v: [3] },
    text: '피해 = 이번 전투에서 쓴 베기 수 ×{n0}. 소멸.', play: (c, e, v) => e.hit(c.totalSlashes * v[0]) },

  // 브릭 — 장전
  'brick.load':  { ch: 'brick', name: '장전', cost: 1, rarity: 'c', v: [2], up: { v: [3] },
    text: '장전 +{k0}.', play: (c, e, v) => { c.loaded += v[0] + e.dark(); } },
  'brick.fire':  { ch: 'brick', name: '발사', cost: 1, atk: 1, rarity: 'c', v: [5], up: { v: [6] },
    text: '피해 장전×{n0} (장전 없으면 3). 장전 0.', play: (c, e, v) => { e.hit(c.loaded ? c.loaded * v[0] : 3); c.loaded = 0; } },
  'brick.over':  { ch: 'brick', name: '과적재', cost: 0, time: 1, rarity: 'u', v: [5], up: { v: [7] },
    text: '장전 +{k0}.', play: (c, e, v) => { c.loaded += v[0] + e.dark(); } },
  'brick.quick': { ch: 'brick', name: '급히 쏘기', cost: 0, atk: 1, rarity: 'c', v: [3], up: { v: [5] },
    text: '피해 {d0}.', play: (c, e, v) => e.hit(v[0]) },
  'brick.mount': { ch: 'brick', name: '대포 받침', cost: 1, rarity: 'c', v: [1, 6], up: { v: [1, 9] },
    text: '장전 +{k0}, 방어 {b1}.', play: (c, e, v) => { c.loaded += v[0] + e.dark(); e.guard(v[1]); } },
  'brick.smell': { ch: 'brick', name: '화약 냄새', cost: 0, rarity: 'c', v: [1], up: { v: [2] },
    text: '장전 +{k0}, 카드 1장.', play: (c, e, v) => { c.loaded += v[0] + e.dark(); e.draw(1); } },
  'brick.flare': { ch: 'brick', name: '신호탄', cost: 1, target: 'all', rarity: 'u', v: [2, 1], up: { v: [3, 1] },
    text: '모든 적 약화 {n0}, 장전 +{k1}.', play: (c, e, v) => { e.foeStatusAll('weak', v[0]); c.loaded += v[1] + e.dark(); } },
  'brick.shot':  { ch: 'brick', name: '산탄', cost: 1, atk: 1, target: 'all', rarity: 'u', v: [3], up: { v: [4] },
    text: '모든 적 피해 장전×{n0}. 장전 절반 남김.', play: (c, e, v) => { e.hitAll(c.loaded * v[0]); c.loaded = Math.floor(c.loaded / 2); } },
  'brick.recoil':{ ch: 'brick', name: '반동 이동', cost: 1, rarity: 'u', v: [2], up: { v: [3] },
    text: '방어 장전×{n0}. 장전은 남음.', play: (c, e, v) => e.guard(c.loaded * v[0]) },
  'brick.volley':{ ch: 'brick', name: '일제 사격', cost: 2, atk: 1, rarity: 'r', v: [8], up: { v: [10] },
    text: '피해 장전×{n0}. 장전 0.', play: (c, e, v) => { e.hit(c.loaded * v[0]); c.loaded = 0; } },
  'brick.last':  { ch: 'brick', name: '최후의 포탄', cost: 3, atk: 1, exhaust: 1, rarity: 'r', v: [12], up: { cost: 2 },
    text: '피해 장전×{n0}. 장전 0. 소멸.', play: (c, e, v) => { e.hit(c.loaded * v[0]); c.loaded = 0; } },

  // 마르타 — 방어·반격
  'marta.wall':  { ch: 'marta', name: '기도의 벽', cost: 1, rarity: 'c', v: [7], up: { v: [10], target: 'ally', text: '고른 동료 방어 {b0}.' },
    text: '방어 {b0}.', play: (c, e, v) => e.guardTarget(v[0]) },
  'marta.fist':  { ch: 'marta', name: '철권', cost: 1, atk: 1, rarity: 'c', v: [7], up: { v: [10] },
    text: '피해 {d0}.', play: (c, e, v) => e.hit(v[0]) },
  'marta.confess':{ ch: 'marta', name: '고해', cost: 0, time: 1, target: 'ally', rarity: 'u', v: [12, 4], up: { v: [16, 6] },
    text: '마르타 방어 {b0}. 고른 동료 체력 {n1} 회복.', play: (c, e, v) => { e.guard(v[0]); e.heal(v[1]); } },
  'marta.counter':{ ch: 'marta', name: '반격 자세', cost: 1, rarity: 'c', v: [3, 5], up: { v: [5, 7] },
    text: '방어 {b0}. 이번 턴 마르타가 맞을 때마다 {n1} 되돌려 준다.', play: (c, e, v) => { e.guard(v[0]); c.counter += v[1]; } },
  'marta.taunt': { ch: 'marta', name: '대신 맞기', cost: 1, rarity: 'c', v: [8], up: { v: [11] },
    text: '방어 {b0}. 이번 턴 모든 단일 공격이 마르타를 노린다.', play: (c, e, v) => { e.guard(v[0]); c.taunt = 'marta'; } },
  'marta.bless': { ch: 'marta', name: '축복', cost: 1, rarity: 'u', v: [4], up: { v: [7] },
    text: '방어 {b0}. 다음 턴 에너지 +1.', play: (c, e, v) => { e.guard(v[0]); c.nextEnergy += 1; } },
  'marta.bell':  { ch: 'marta', name: '종소리', cost: 1, target: 'all', rarity: 'u', v: [1, 5], up: { v: [2, 5] },
    text: '모든 적 약화 {n0}, 방어 {b1}.', play: (c, e, v) => { e.foeStatusAll('weak', v[0]); e.guard(v[1]); } },
  'marta.judge': { ch: 'marta', name: '심판', cost: 1, atk: 1, rarity: 'u', v: [], up: { cost: 0 },
    text: '지금 마르타의 방어만큼 피해.', play: (c, e) => e.hit(c.block) },
  'marta.martyr':{ ch: 'marta', name: '순교자의 결의', cost: 0, rarity: 'u', v: [5, 15], up: { v: [5, 20] },
    text: '마르타 체력 {n0} 잃고 방어 {b1}.', play: (c, e, v) => { e.loseHp(v[0]); e.guard(v[1]); } },
  'marta.rampart':{ ch: 'marta', name: '성벽', cost: 2, rarity: 'r', v: [16], up: { v: [22] },
    text: '방어 {b0}.', play: (c, e, v) => e.guard(v[0]) },
  'marta.hymn':  { ch: 'marta', name: '철의 성가', cost: 2, exhaust: 1, rarity: 'r', v: [], up: { cost: 1 },
    text: '이번 전투 동안 방어가 턴이 끝나도 절반 남는다. 소멸.', play: c => { c.retain = true; } },
  'marta.sanct': { ch: 'marta', name: '성소', cost: 3, exhaust: 1, rarity: 'r', v: [30], up: { v: [40] },
    text: '방어 {b0}, 다음 턴까지 유지. 소멸.', play: (c, e, v) => { e.guard(v[0]); e.keepBlock(); } },

  // 노엘 — 잠·마력 (잠든 동안 노엘의 공격 카드는 wake·sleepOk 카드만)
  'noel.sleep':  { ch: 'noel', name: '잠들기', cost: 1, rarity: 'c', v: [], up: { cost: 0 },
    text: '잠든다. 잠든 동안 턴 시작마다 마력 +4.', play: c => { c.asleep = true; } },
  'noel.star':   { ch: 'noel', name: '별똥 마법', cost: 1, atk: 1, wake: 1, rarity: 'c', v: [3], up: { v: [4] },
    text: '피해 마력×{n0} (최소 6). 마력 0, 깨어난다.', play: (c, e, v) => { e.hit(Math.max(6, c.mana * v[0])); c.mana = 0; c.asleep = false; } },
  'noel.pillow': { ch: 'noel', name: '베개 방어', cost: 1, rarity: 'c', v: [7, 5], up: { v: [9, 7] },
    text: '방어 {b0}. 잠들어 있으면 +{n1}.', play: (c, e, v) => e.guard(v[0] + (c.asleep ? v[1] : 0)) },
  'noel.deep':   { ch: 'noel', name: '깊은 잠', cost: 0, time: 1, rarity: 'u', v: [5], up: { v: [8] },
    text: '잠든다. 마력 +{k0}.', play: (c, e, v) => { c.asleep = true; c.mana += v[0] + e.dark(); } },
  'noel.yawn':   { ch: 'noel', name: '하품', cost: 0, rarity: 'c', v: [1], up: { v: [2] },
    text: '카드 1장. 마력 +{k0}.', play: (c, e, v) => { e.draw(1); c.mana += v[0] + e.dark(); } },
  'noel.lull':   { ch: 'noel', name: '자장가', cost: 1, target: 'foe', rarity: 'c', v: [2], up: { v: [3] },
    text: '적 약화 {n0} (주는 피해 25% 줄어듦).', play: (c, e, v) => e.foeStatus('weak', v[0]) },
  'noel.walk':   { ch: 'noel', name: '몽유', cost: 1, atk: 1, sleepOk: 1, rarity: 'u', v: [8], up: { v: [11] },
    text: '잠든 채로 피해 {d0}. 깨지 않는다.', play: (c, e, v) => e.hit(v[0]) },
  'noel.talk':   { ch: 'noel', name: '잠꼬대', cost: 0, atk: 1, sleepOk: 1, target: 'none', rarity: 'u', v: [0], up: { v: [2] },
    text: '잠들어 있으면 무작위 적에게 피해 마력+{n0}. 마력은 남는다.', play: (c, e, v) => { if (c.asleep) e.hitRandom(c.mana + v[0]); } },
  'noel.hate':   { ch: 'noel', name: '아침이 싫어', cost: 1, rarity: 'u', v: [0], up: { v: [4] },
    text: '방어 마력+{n0}. 깨지 않는다.', play: (c, e, v) => e.guard(c.mana + v[0]) },
  'noel.late':   { ch: 'noel', name: '늦잠', cost: 0, time: 1, rarity: 'u', v: [], up: { cost: 1, time: 0 },
    text: '다음 턴 시작 마력 2배.', play: c => { c.late = true; } },
  'noel.burst':  { ch: 'noel', name: '꿈 폭발', cost: 2, atk: 1, wake: 1, rarity: 'r', v: [5], up: { v: [6] },
    text: '피해 마력×{n0}. 마력 0, 깨어난다.', play: (c, e, v) => { e.hit(c.mana * v[0]); c.mana = 0; c.asleep = false; } },

  // 레이븐 — 독·출혈
  'raven.needle':{ ch: 'raven', name: '독침', cost: 1, atk: 1, rarity: 'c', v: [3, 2], up: { v: [4, 3] },
    text: '피해 {d0}, 독 {k1}.', play: (c, e, v) => { e.hit(v[0]); e.foeStatus('poison', v[1] + e.dark()); } },
  'raven.step':  { ch: 'raven', name: '그림자 걸음', cost: 1, rarity: 'c', v: [5], up: { v: [7] },
    text: '방어 {b0}, 카드 1장.', play: (c, e, v) => { e.guard(v[0]); e.draw(1); } },
  'raven.venom': { ch: 'raven', name: '맹독', cost: 0, time: 1, target: 'foe', rarity: 'u', v: [2], up: { v: [3] },
    text: '적의 독 {n0}배.', play: (c, e, v) => { c.foe.poison *= v[0]; } },
  'raven.feather':{ ch: 'raven', name: '깃털 비', cost: 1, atk: 1, rarity: 'c', v: [2], up: { v: [3] },
    text: '피해 {d0}을 세 번.', play: (c, e, v) => { e.hit(v[0]); e.hit(v[0]); e.hit(v[0]); } },
  'raven.bleed': { ch: 'raven', name: '출혈', cost: 1, atk: 1, rarity: 'c', v: [4, 3], up: { v: [5, 4] },
    text: '피해 {d0}, 출혈 {n1}.', play: (c, e, v) => { e.hit(v[0]); e.foeStatus('bleed', v[1]); } },
  'raven.smoke': { ch: 'raven', name: '연막', cost: 1, rarity: 'u', v: [10], up: { v: [13] },
    text: '방어 {b0}. 다음 카드 비용 -1.', play: (c, e, v) => { e.guard(v[0]); c.discount += 1; } },
  'raven.crow':  { ch: 'raven', name: '까마귀 눈', cost: 0, target: 'all', rarity: 'u', v: [], up: { text: '독이 있는 모든 적 약화 1, 취약 1.' },
    text: '독이 있는 모든 적 약화 1.', play: (c, e, v, up) => { for (const f of c.foes) if (f.poison > 0) { f.weak += 1; if (up) f.vuln += 1; } } },
  'raven.fog':   { ch: 'raven', name: '독 안개', cost: 1, target: 'all', rarity: 'u', v: [6], up: { v: [8] },
    text: '모든 적 독 {k0}.', play: (c, e, v) => e.foeStatusAll('poison', v[0] + e.dark()) },
  'raven.throat':{ ch: 'raven', name: '목 긋기', cost: 2, atk: 1, rarity: 'r', v: [], up: { cost: 1 },
    text: '적의 독만큼 피해. 독은 남는다.', play: (c, e) => e.hit(c.foe.poison) },
  'raven.garden':{ ch: 'raven', name: '독의 정원', cost: 2, exhaust: 1, rarity: 'r', v: [2], up: { v: [3] },
    text: '이번 전투 턴 시작마다 모든 적 독 +{n0}. 소멸.', play: (c, e, v) => { c.garden += v[0]; } },
  'raven.last':  { ch: 'raven', name: '마지막 깃', cost: 3, exhaust: 1, target: 'all', rarity: 'r', v: [], up: { cost: 2 },
    text: '모든 적의 독×2 피해를 바로 준다(방어 무시). 소멸.', play: (c, e) => { for (const f of c.foes) e.pierce(f, f.poison * 2); } },

  // 저주 (사건·적이 넣는 나쁜 카드). unplayable:1 = 쓸 수 없음. 손패·덱 효과는 combat.js가 읽는다.
  'curse.drowsy':{ ch: 'curse', name: '졸음', cost: 0, unplayable: 1, rarity: 'curse', v: [5], inHandEnd: { time: 5 },
    text: '쓸 수 없음. 손패에 있으면 턴 끝에 밤 시계 +{n0}분.' },
  'curse.fog':   { ch: 'curse', name: '안개', cost: 0, exhaust: 1, target: 'none', rarity: 'curse', v: [2], inHandEnd: { hurt: 2 },
    text: '쓰면 소멸. 안 쓰면 턴 끝에 무작위 동료 피해 {n0}.', play: () => {} },
  'curse.key':   { ch: 'curse', name: '녹슨 열쇠', cost: 1, exhaust: 1, target: 'none', rarity: 'curse', v: [], drawLess: 1,
    text: '손패에 있는 동안 턴 시작에 카드 1장 덜 뽑음. 쓰면 소멸.', play: () => {} },
  'curse.lamp':  { ch: 'curse', name: '깨진 등불', cost: 1, exhaust: 1, target: 'none', rarity: 'curse', v: [3], inHandEnd: { frontBlock: 3 },
    text: '손패에 있으면 턴 끝에 앞줄 동료 방어 -{n0}. 쓰면 소멸.', play: () => {} },
  'curse.lost':  { ch: 'curse', name: '길 잃음', cost: 0, unplayable: 1, rarity: 'curse', v: [10], inDeckWin: { time: 10 },
    text: '쓸 수 없음. 전투가 끝날 때 덱에 있으면 밤 시계 +{n0}분.' },
};
export const CURSES = Object.keys(CARDS).filter(id => CARDS[id].ch === 'curse');

// 인연 듀오: 인연 짝의 카드를 연계 중에 이어 쓰면 손에 생긴다(비용 1, 소멸). 키는 동료 id를 정렬해 '+'로 잇는다.
export const DUOS = {
  'brick+iris':  { name: '포탄 베기', atk: 1, text: '피해 장전×4+8. 장전은 남는다.', play: (c, e) => e.hit(c.loaded * 4 + 8) },
  'iris+marta':  { name: '검과 방패', atk: 1, text: '피해 {d0}, 방어 {b1}.', v: [10, 10], play: (c, e, v) => { e.hit(v[0]); e.guard(v[1]); } },
  'iris+noel':   { name: '꿈의 칼날', atk: 1, text: '피해 마력×3+6.', play: (c, e) => e.hit(c.mana * 3 + 6) },
  'iris+raven':  { name: '쌍그림자', atk: 1, text: '피해 {d0}을 세 번, 독 {k1}.', v: [5, 2], play: (c, e, v) => { e.hit(v[0]); e.hit(v[0]); e.hit(v[0]); e.foeStatus('poison', v[1] + e.dark()); } },
  'brick+marta': { name: '성당 포격', text: '장전 +{k0}, 방어 {b1}.', v: [3, 8], play: (c, e, v) => { c.loaded += v[0] + e.dark(); e.guard(v[1]); } },
  'brick+noel':  { name: '별똥 포탄', atk: 1, text: '피해 (장전+마력)×4. 둘 다 0.', play: (c, e) => { e.hit((c.loaded + c.mana) * 4); c.loaded = 0; c.mana = 0; c.asleep = false; } },
  'brick+raven': { name: '독탄', target: 'all', text: '모든 적 독 {k0}, 장전 +{k1}.', v: [8, 1], play: (c, e, v) => { e.foeStatusAll('poison', v[0] + e.dark()); c.loaded += v[1] + e.dark(); } },
  'marta+noel':  { name: '자장가 기도', target: 'ally', text: '고른 동료 체력 {n0} 회복, 방어 {b1}.', v: [6, 6], play: (c, e, v) => { e.heal(v[0]); e.guard(v[1]); } },
  'marta+raven': { name: '참회의 독', text: '방어 (가장 높은 적 독+6).', play: (c, e) => e.guard(Math.max(0, ...c.foes.map(f => f.poison)) + 6) },
  'noel+raven':  { name: '악몽', target: 'foe', text: '적의 독 2배, 약화 1.', play: (c, e) => { c.foe.poison *= 2; e.foeStatus('weak', 1); } },
};
export const duoKey = (a, b) => [a, b].sort().join('+');
export const BOND = { name: '합동', atk: 1, text: '피해 {d0}, 방어 {b1}.', v: [8, 8], play: (c, e, v) => { e.hit(v[0]); e.guard(v[1]); } };

// 카드 정의 (강화판 'id+'면 up을 덮어씀). 듀오·저주도 같은 모양으로.
const cache = new Map();
export function cardData(id) {
  if (cache.has(id)) return cache.get(id);
  let d;
  if (id.startsWith('bond:')) {
    // 인연의 실(도구): 인연이 아닌 짝의 「합동」 카드
    const [a, b] = id.slice(5).split('+');
    d = { ...BOND, id, ch: 'duo', bond: true, a, b, cost: 1, exhaust: 1, rarity: 'duo' };
  } else if (id.startsWith('duo:')) {
    const k = id.slice(4), D = DUOS[k], [a, b] = k.split('+');
    d = { ...D, id, ch: 'duo', a, b, cost: 1, exhaust: 1, rarity: 'duo', v: D.v || [] };
  } else {
    const up = id.endsWith('+'), base = CARDS[up ? id.slice(0, -1) : id];
    if (!base) return null;
    d = up ? { ...base, ...base.up, id, up: true, name: base.name + '+' } : { ...base, id, up: false };
  }
  if (!d.target) d.target = d.atk ? 'foe' : 'none';
  cache.set(id, d);
  return d;
}
export const canUpgrade = id => !id.endsWith('+') && !!CARDS[id]?.up;
