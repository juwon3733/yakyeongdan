// 동료 (docs/03_characters.md). maxHp = 최대 체력(캐릭터마다 다름).
// hooks는 전투 상태 c와 효과 도우미 e를 받는다. 쓰러진 동료의 패시브는 불리지 않는다.
// 훅 안에서 e.guard는 그 동료 자신에게 걸린다.
//   onCombatStart: 첫 턴 시작(방어 초기화 뒤, 카드 뽑기 전)
//   onTurnStart:   매 턴 시작
//   beforeCard:    카드를 쓰기 직전 (card = 카드 정의)
//   preview:       카드에 보일 피해 보너스 (beforeCard가 더할 값을 미리)
//   afterCard:     카드를 쓴 직후 (card, pick)
//   onWin:         전투에서 이긴 뒤 (G, x: { gold, healAll }) — 전투 상태 없이
// 숫자 필드 (엔진이 읽음): timeMinus 시간 카드 −분 · firstTimeEnergy 매 턴 첫 시간 카드 에너지 돌려받음
//   napBonus 낮잠 +분 · fightTime 지도 전투 칸 시간 + · shopDiscount 야시장 할인 · smithExtra 휴식 손질 +장
//   spiritMax 정령 최대 + · spiritPlus 정령 피해 + · keepCard 턴 끝에 손패 남기기 장 수
import { ROSTER } from './roster.js';
const pal = k => ROSTER[k].pal;
export const CHARACTERS = {
  iris: {
    name: '아이리스', role: '검사', rarity: 4, maxHp: 36, col: '#c8d4f0', long: true,
    ds: '베기를 이어서 쓸수록 세진다.',
    pal: { h: '#1c1c2a', H: '#0c0c16', e: '#8ab0ff', o: '#c8d0e8', O: '#8a92b0', a: '#f0f4ff' },
    start: ['iris.slash', 'iris.slash', 'iris.parry', 'iris.issen'],
    passive: { name: '검의 리듬', text: '매 턴 첫 베기 피해 +2.',
      beforeCard: (c, card) => { if (card.slash && !c.irisRhythm) { c.bonus += 2; c.irisRhythm = true; } },
      preview: (c, card) => card.slash && !c.irisRhythm ? 2 : 0,
      onTurnStart: c => { c.irisRhythm = false; } },
  },
  brick: {
    name: '브릭', role: '대포', rarity: 3, maxHp: 32, col: '#ef6352', long: false,
    ds: '장전을 쌓았다가 한 번에 쏜다.',
    pal: { h: '#d0463a', H: '#902a24', e: '#ffd060', o: '#5a4a3a', O: '#3a2e24', a: '#e0b84a' },   // 붉은 단발, 작업복
    start: ['brick.load', 'brick.load', 'brick.fire', 'brick.over'],
    passive: { name: '여분 탄약', text: '전투 시작에 장전 2.',
      onCombatStart: c => { c.loaded += 2; } },
  },
  marta: {
    name: '마르타', role: '수녀', rarity: 3, maxHp: 48, col: '#e0b84a', long: true,
    ds: '막고, 맞으면 되받아친다.',
    pal: { h: '#ecc860', H: '#b08a30', e: '#5a7ab0', o: '#1e1e28', O: '#0e0e16', a: '#f0f0f0' },   // 금발 땋은 장발, 수녀복
    start: ['marta.wall', 'marta.wall', 'marta.fist', 'marta.confess'],
    passive: { name: '수호', text: '전투 시작에 방어 6.',
      onCombatStart: (c, e) => { e.guard(6); } },
  },
  noel: {
    name: '노엘', role: '마술사', rarity: 4, maxHp: 26, col: '#f08ac0', long: true,
    ds: '자는 동안 마력이 쌓인다.',
    pal: { h: '#f08ac0', H: '#b05a88', e: '#a0d0ff', o: '#f0e0f0', O: '#c0a8d0', a: '#ffd0e8' },
    start: ['noel.sleep', 'noel.star', 'noel.pillow', 'noel.deep'],
    passive: { name: '잠버릇', text: '잠든 채로 턴을 시작하면 방어 5.',
      onTurnStart: (c, e) => { if (c.asleep) e.guard(5); } },
  },
  raven: {
    name: '레이븐', role: '암살자', rarity: 4, maxHp: 30, col: '#9a86d8', long: false,
    ds: '독을 쌓고 목을 긋는다.',
    pal: { h: '#d0d4e0', H: '#8a8ea4', e: '#e04a4a', o: '#1e1a28', O: '#0e0c16', a: '#9a86d8' },   // 은색 단발, 검은 깃털 코트
    start: ['raven.needle', 'raven.needle', 'raven.step', 'raven.venom'],
    passive: { name: '독 묻은 깃', text: '전투 시작에 모든 적 독 2.',
      onCombatStart: (c, e) => { e.foeStatusAll('poison', 2); } },
  },
  // ---------- ★5 ----------
  sion: {
    name: '시온', role: '별 소환사', rarity: 5, maxHp: 32, col: '#7ab0d8', long: true, pal: pal('sion'),
    ds: '별 정령을 불러 두면 턴 끝마다 알아서 싸운다.',
    start: ['sion.call', 'sion.call', 'sion.shield', 'sion.link'],
    passive: { name: '별의 길', text: '정령 최대 6. 전투 시작에 정령 1을 데리고 시작.',
      spiritMax: 2,
      onCombatStart: (c, e) => { e.spirit(3, 1); } },
  },
  lunaria: {
    name: '루나리아', role: '달의 무희', rarity: 5, maxHp: 34, col: '#d8d0f8', long: true, pal: pal('lunaria'),
    ds: '전투 중에 달 모양을 바꾼다.',
    start: ['luna.crescent', 'luna.full', 'luna.new', 'luna.step'],
    passive: { name: '월광', text: '전투 시작에 이번 전투의 달을 고른다. 달이 바뀔 때마다 카드 1장, 방어 3.',
      onCombatStart: c => { c.moonPick = true; } },
  },
  akane: {
    name: '아카네', role: '홍련 검성', rarity: 5, maxHp: 36, col: '#ff6a4a', long: true, pal: pal('akane'),
    ds: '베면 불이 붙는다. 아이리스와 베기 횟수를 함께 센다.',
    start: ['akane.slash', 'akane.slash', 'akane.guard', 'akane.inferno'],
    passive: { name: '불꽃 칼날', text: '베기 카드(누구 것이든)를 쓰면 대상에게 화상 2. 화상이 있는 적에게 베기 피해 +2.',
      beforeCard: (c, card) => { if (card.slash && card.target === 'foe' && c.foe?.burn > 0) c.bonus += 2; },
      preview: (c, card) => card.slash && card.target === 'foe' && c.all.some(f => !f.dead && f.burn > 0) ? 2 : 0,
      afterCard: (c, card, pick, e) => { if (card.slash) e.burnTargets(card, pick, 2); } },
  },
  eleonore: {
    name: '엘레오노르', role: '시계탑의 마녀', rarity: 5, maxHp: 30, col: '#b48ae8', long: true, pal: pal('eleonore'),
    ds: '시간 카드를 싸게 쓰고, 밤 시계를 되돌린다.',
    start: ['eleo.second', 'eleo.wall', 'eleo.stop', 'eleo.rewind'],
    passive: { name: '시간의 주인', text: '시간 카드 −10분. 매 턴 처음 쓴 시간 카드는 에너지 1을 돌려준다. 낮잠이 45분을 되찾는다.',
      timeMinus: 10, firstTimeEnergy: 1, napBonus: 15 },
  },
  // ---------- ★4 (나머지) ----------
  mimimomo: {
    name: '미미·모모', role: '쌍둥이', rarity: 4, maxHp: 34, col: '#ffb0a0', long: false, pal: pal('mimimomo'),
    ds: '미미 카드와 모모 카드를 번갈아 쓰면 쌍 효과.',
    start: ['mm.stab', 'mm.block', 'mm.clap', 'mm.hide'],
    passive: { name: '텔레파시', text: '전투 첫 턴을 연계 1칸으로 시작.',
      onCombatStart: c => { c.chain = Math.max(c.chain, 1); } },
  },
  sebas: {
    name: '세바스', role: '집사', rarity: 4, maxHp: 32, col: '#c0c0c0', long: false, pal: pal('sebas'),
    ds: '카드를 많이 뽑고, 밤 시계를 되돌린다.',
    start: ['seb.tea', 'seb.tray', 'seb.cane', 'seb.watch'],
    passive: { name: '완벽한 준비', text: '매 턴 끝에 손패 1장(가장 비싼 카드)을 버리지 않고 남긴다.', keepCard: 1 },
  },
  mariana: {
    name: '마리아나', role: '해적 여왕', rarity: 4, maxHp: 36, col: '#e0a050', long: true, pal: pal('mariana'),
    ds: '별빛(돈)을 써서 세게 친다.',
    start: ['mari.coin', 'mari.loot', 'mari.rum', 'mari.cannon'],
    passive: { name: '선장의 몫', text: '전투에서 이기면 별빛 +5.', onWin: (G, x) => x.gold(5) },
  },
  tomori: {
    name: '토모리', role: '등대지기의 손녀', rarity: 4, maxHp: 28, col: '#f0d040', long: true, pal: pal('tomori'),
    ds: '랜턴으로 적의 다음 공격을 약하게 만든다.',
    start: ['tomo.light', 'tomo.glare', 'tomo.arrow', 'tomo.signal'],
    passive: { name: '등불지기', text: '매 턴, 공격이 가장 센 적의 이번 공격 −10%.',
      onTurnStart: (c, e) => { e.dimStrongest(.1); } },
  },
  sigrun: {
    name: '시그룬', role: '하늘 창기사', rarity: 4, maxHp: 40, col: '#f0e0a0', long: true, pal: pal('sigrun'),
    ds: '날아오르면 받는 피해가 절반, 급강하로 크게 친다.',
    start: ['sig.thrust', 'sig.rise', 'sig.dive', 'sig.feather'],
    passive: { name: '비상', text: '4턴마다 턴 시작에 저절로 공중.',
      onTurnStart: (c, e) => { if (c.turn % 4 === 0) e.fly(); } },
  },
  zeno: {
    name: '제노', role: '용의 피 흑기사', rarity: 4, maxHp: 38, col: '#8a6ae0', long: true, pal: pal('zeno'),
    ds: '자기 체력을 깎아 세게 친다.',
    start: ['zeno.slash', 'zeno.slash', 'zeno.scale', 'zeno.roar'],
    passive: { name: '용혈', text: '제노 체력이 절반 이하면 모든 동료의 공격 피해 +2.',
      beforeCard: (c, card, e) => { if (card.atk && e.low('zeno')) c.bonus += 2; },
      preview: (c, card, e) => card.atk && e.low('zeno') ? 2 : 0 },
  },
  // ---------- ★3 (나머지) ----------
  finn: {
    name: '핀', role: '우편배달부', rarity: 3, maxHp: 34, col: '#7aa0d0', long: false, pal: pal('finn'),
    ds: '핀의 카드는 언제나 연계를 잇는다.',
    start: ['finn.letter', 'finn.letter', 'finn.fast', 'finn.parcel'],
    passive: { name: '지름길', text: '지도에서 전투 칸 시간 −5분. 전투 첫 턴을 연계 1칸으로 시작.', fightTime: -5,
      onCombatStart: c => { c.chain = Math.max(c.chain, 1); } },
  },
  laila: {
    name: '라일라', role: '구름 기사단 탈영병', rarity: 3, maxHp: 32, col: '#9ad0f0', long: true, pal: pal('laila'),
    ds: '카드를 뽑으며 연타한다.',
    start: ['laila.blade', 'laila.blade', 'laila.gust', 'laila.step'],
    passive: { name: '순풍', text: '첫 턴 카드 +2장.', onCombatStart: c => { c.nextDraw += 2; } },
  },
  dora: {
    name: '도라', role: '대장장이', rarity: 3, maxHp: 42, col: '#d08a4a', long: true, pal: pal('dora'),
    ds: '전투 중에 손패 카드를 강화한다.',
    start: ['dora.hammer', 'dora.hammer', 'dora.temper', 'dora.repair'],
    passive: { name: '손질', text: '휴식 칸에서 손질을 고르면 1장 더 강화.', smithExtra: 1 },
  },
  gordon: {
    name: '고든', role: '요리사', rarity: 3, maxHp: 40, col: '#e0d0b0', long: false, pal: pal('gordon'),
    ds: '회복하고 다음 턴을 든든하게.',
    start: ['gord.soup', 'gord.pan', 'gord.pan', 'gord.meat'],
    passive: { name: '야식', text: '전투에서 이기면 모든 동료 체력 1 회복.', onWin: (G, x) => x.healAll(1) },
  },
  fukuro: {
    name: '후쿠로', role: '야시장 상인', rarity: 3, maxHp: 38, col: '#c8a060', long: false, pal: pal('fukuro'),
    ds: '별빛을 벌고 야시장을 싸게 만든다.',
    start: ['fuku.junk', 'fuku.junk', 'fuku.charm', 'fuku.lamp'],
    passive: { name: '단골', text: '야시장 가격 10% 할인. 전투에서 이기면 별빛 +5.', shopDiscount: .1, onWin: (G, x) => x.gold(5) },
  },
};

// 처음부터 가진 동료. 나머지는 별 소환으로 (js/meta.js). 개발판(DEV)에선 구현된 동료를 전부 고를 수 있다.
export const STARTER_OWNED = ['iris', 'brick', 'marta'];
