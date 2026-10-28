// 동료 카드와 인연 듀오 (docs/03_characters.md).
// play(c, e): c = 전투 상태(c.foe, c.loaded, c.mana, c.asleep, c.slashes, c.counter, c.block),
//             e = 효과 도우미(hit, guard, heal, draw, full(ch), dark(), moon)
//   e.guard: 카드 주인(듀오는 둘 중 앞에 선 사람)에게 방어. e.heal: target:'ally' 카드면 고른 동료, 아니면 카드 주인.
//   c.block: 카드 주인의 지금 방어.
// time:1 = 에너지 대신 밤 시계 비용, reward:1 = 보상에서 주로 나오는 카드, target:'ally' = 받을 동료를 고른다
export const CARDS = {
  'iris.slash':  { ch: 'iris', name: '베기', cost: 1, atk: 1, slash: 1, text: '피해 6. 이번 턴 세 번째 베기부터 +4.', play: (c, e) => { e.hit(6 + (c.slashes >= 2 ? 4 : 0) + e.full('iris')); c.slashes++; } },
  'iris.parry':  { ch: 'iris', name: '흘려 베기', cost: 1, atk: 1, slash: 1, text: '피해 4, 방어 4. 베기로 친다.', play: (c, e) => { e.hit(4 + (c.slashes >= 2 ? 4 : 0) + e.full('iris')); e.guard(4); c.slashes++; } },
  'iris.issen':  { ch: 'iris', name: '일섬', cost: 0, time: 1, atk: 1, slash: 1, text: '피해 12.', play: (c, e) => { e.hit(12 + e.full('iris')); c.slashes++; } },
  'iris.twin':   { ch: 'iris', name: '연속 베기', cost: 1, atk: 1, slash: 1, reward: 1, text: '피해 3을 두 번. 베기 두 번으로 친다.', play: (c, e) => { e.hit(3 + e.full('iris')); e.hit(3 + (c.slashes >= 1 ? 4 : 0)); c.slashes += 2; } },
  'iris.moon':   { ch: 'iris', name: '달빛 칼날', cost: 1, atk: 1, reward: 1, text: '피해 8. 보름달이면 +6.', play: (c, e) => { e.hit(8 + (e.moon === 'full' ? 6 : 0)); } },
  'iris.dance':  { ch: 'iris', name: '검무', cost: 2, atk: 1, slash: 1, reward: 1, text: '피해 10. 베기 횟수 +2.', play: (c, e) => { e.hit(10 + e.full('iris')); c.slashes += 2; } },

  'brick.load':  { ch: 'brick', name: '장전', cost: 1, text: '장전 +2.', play: (c, e) => { c.loaded += 2 + e.dark(); } },
  'brick.fire':  { ch: 'brick', name: '발사', cost: 1, atk: 1, text: '피해 장전×5 (장전 없으면 3). 장전 0.', play: (c, e) => { e.hit(c.loaded ? c.loaded * 5 : 3); c.loaded = 0; } },
  'brick.quick': { ch: 'brick', name: '급히 쏘기', cost: 0, atk: 1, text: '피해 3.', play: (c, e) => e.hit(3) },
  'brick.over':  { ch: 'brick', name: '과적재', cost: 0, time: 1, reward: 1, text: '장전 +5.', play: (c, e) => { c.loaded += 5 + e.dark(); } },
  'brick.mount': { ch: 'brick', name: '대포 받침', cost: 1, reward: 1, text: '장전 +1, 방어 6.', play: (c, e) => { c.loaded += 1 + e.dark(); e.guard(6); } },
  'brick.volley':{ ch: 'brick', name: '일제 사격', cost: 2, atk: 1, reward: 1, text: '피해 장전×8. 장전 0.', play: (c, e) => { e.hit(c.loaded * 8); c.loaded = 0; } },

  'marta.wall':  { ch: 'marta', name: '기도의 벽', cost: 1, text: '방어 7.', play: (c, e) => e.guard(7 + e.full('marta')) },
  'marta.fist':  { ch: 'marta', name: '철권', cost: 1, atk: 1, text: '피해 7.', play: (c, e) => e.hit(7 + e.full('marta')) },
  'marta.counter':{ ch: 'marta', name: '반격 자세', cost: 1, text: '방어 3. 이번 턴 마르타가 맞을 때마다 5 되돌려 준다.', play: (c, e) => { e.guard(3 + e.full('marta')); c.counter += 5; } },
  'marta.rampart':{ ch: 'marta', name: '성벽', cost: 2, reward: 1, text: '방어 16.', play: (c, e) => e.guard(16 + e.full('marta')) },
  'marta.judge': { ch: 'marta', name: '심판', cost: 1, atk: 1, reward: 1, text: '지금 방어만큼 피해.', play: (c, e) => e.hit(c.block) },
  'marta.confess':{ ch: 'marta', name: '고해', cost: 0, time: 1, reward: 1, target: 'ally', text: '마르타 방어 12. 고른 동료 체력 4 회복.', play: (c, e) => { e.guard(12 + e.full('marta')); e.heal(4); } },

  'noel.sleep':  { ch: 'noel', name: '잠들기', cost: 1, text: '잠든다. 잠든 동안 턴 시작마다 마력 +3.', play: c => { c.asleep = true; } },
  'noel.star':   { ch: 'noel', name: '별똥 마법', cost: 1, atk: 1, text: '피해 마력×3 (최소 4). 마력 0, 깨어난다.', play: (c, e) => { e.hit(Math.max(4, c.mana * 3)); c.mana = 0; c.asleep = false; } },
  'noel.pillow': { ch: 'noel', name: '베개 방어', cost: 1, text: '방어 6. 잠들어 있으면 +5.', play: (c, e) => e.guard(6 + (c.asleep ? 5 : 0)) },
  'noel.yawn':   { ch: 'noel', name: '하품', cost: 0, text: '카드 1장 뽑기. 마력 +1.', play: (c, e) => { e.draw(1); c.mana += 1; } },
  'noel.deep':   { ch: 'noel', name: '깊은 잠', cost: 0, time: 1, reward: 1, text: '잠든다. 마력 +5.', play: (c, e) => { c.asleep = true; c.mana += 5 + e.dark(); } },
  'noel.burst':  { ch: 'noel', name: '꿈 폭발', cost: 2, atk: 1, reward: 1, text: '피해 마력×5. 마력 0, 깨어난다.', play: (c, e) => { e.hit(c.mana * 5); c.mana = 0; c.asleep = false; } },
  'noel.lull':   { ch: 'noel', name: '자장가', cost: 1, reward: 1, text: '적 약화 2턴 (주는 피해 25% 줄어듦).', play: c => { c.foe.weak += 2; } },

  'raven.needle':{ ch: 'raven', name: '독침', cost: 1, atk: 1, text: '피해 3, 독 3.', play: (c, e) => { e.hit(3); c.foe.poison += 3 + e.dark(); } },
  'raven.step':  { ch: 'raven', name: '그림자 걸음', cost: 1, text: '방어 5. 카드 1장 뽑기.', play: (c, e) => { e.guard(5); e.draw(1); } },
  'raven.throat':{ ch: 'raven', name: '목 긋기', cost: 2, atk: 1, text: '적의 독만큼 피해 (독은 남는다).', play: (c, e) => e.hit(c.foe.poison) },
  'raven.fog':   { ch: 'raven', name: '독 안개', cost: 1, reward: 1, text: '독 6.', play: (c, e) => { c.foe.poison += 6 + e.dark(); } },
  'raven.venom': { ch: 'raven', name: '맹독', cost: 0, time: 1, reward: 1, text: '적의 독 2배.', play: c => { c.foe.poison *= 2; } },
  'raven.feather':{ ch: 'raven', name: '깃털 비', cost: 1, atk: 1, reward: 1, text: '피해 2를 세 번.', play: (c, e) => { e.hit(2); e.hit(2); e.hit(2); } },
};

// 인연 듀오: 인연 짝의 카드를 연계 중에 이어 쓰면 손에 생긴다. 키는 동료 id를 정렬해 '+'로 잇는다.
export const DUOS = {
  'brick+iris':  { name: '포탄 베기', text: '피해 장전×4+8. 장전은 남는다.', play: (c, e) => e.hit(c.loaded * 4 + 8) },
  'iris+marta':  { name: '검과 방패', text: '피해 10, 방어 10.', play: (c, e) => { e.hit(10); e.guard(10); } },
  'iris+noel':   { name: '꿈의 칼날', text: '피해 마력×3+6.', play: (c, e) => e.hit(c.mana * 3 + 6) },
  'iris+raven':  { name: '쌍그림자', text: '피해 5를 세 번, 독 2.', play: (c, e) => { e.hit(5); e.hit(5); e.hit(5); c.foe.poison += 2; } },
  'brick+marta': { name: '성당 포격', text: '장전 +3, 방어 8.', play: (c, e) => { c.loaded += 3; e.guard(8); } },
  'brick+noel':  { name: '별똥 포탄', text: '피해 (장전+마력)×4. 둘 다 0.', play: (c, e) => { e.hit((c.loaded + c.mana) * 4); c.loaded = 0; c.mana = 0; c.asleep = false; } },
  'brick+raven': { name: '독탄', text: '독 8, 장전 +1.', play: c => { c.foe.poison += 8; c.loaded += 1; } },
  'marta+noel':  { name: '자장가 기도', target: 'ally', text: '고른 동료 체력 6 회복, 방어 6.', play: (c, e) => { e.heal(6); e.guard(6); } },
  'marta+raven': { name: '참회의 독', text: '방어 (독+6).', play: (c, e) => e.guard(c.foe.poison + 6) },
  'noel+raven':  { name: '악몽', text: '적의 독 2배, 약화 1턴.', play: c => { c.foe.poison *= 2; c.foe.weak += 1; } },
};
export const duoKey = (a, b) => [a, b].sort().join('+');
