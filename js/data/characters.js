// 동료 (docs/03_characters.md). maxHp = 최대 체력(캐릭터마다 다름).
// 패시브 (docs/12_signature.md): lines = [[종류 trait①/keyword②/burst③, ③의 이름, 글]]. ③ 폭발은 e.burst(id, 이름)로 알린다.
// 규칙 일부는 엔진이 동료 id로 직접 본다(combat.js·effects.js에 「동료 이름 ①②③」 주석): 아이리스 연계, 브릭 지원 포격,
// 마르타 철의 성녀, 노엘 잠든 턴, 레이븐 흑우, 시온 천구, 루나리아 만월야, 아카네 홍련 개화, 엘레오노르 멈춘 자정,
// 미미·모모 거울 세계, 세바스 완벽한 응대, 마리아나 약탈의 밤, 토모리 등대 불빛, 시그룬 노림 빠지기, 제노 버티기,
// 핀 합동·속달, 라일라 순풍·폭풍, 도라 명장, 고든 만찬, 후쿠로 대박, 네레아 물보라·대해일, 베르타 안내·옛길.
// hooks는 전투 상태 c와 효과 도우미 e를 받는다. 쓰러진 동료의 패시브는 불리지 않는다.
// 훅 안에서 e.guard는 그 동료 자신에게 걸린다.
//   onCombatStart: 첫 턴 시작(방어 초기화 뒤, 카드 뽑기 전)
//   onTurnStart:   매 턴 시작
//   beforeCard:    카드를 쓰기 직전 (card = 카드 정의)
//   preview:       카드에 보일 피해 보너스 (beforeCard가 더할 값을 미리)
//   afterCard:     카드를 쓴 직후 (card, pick)
//   onKill:        적이 쓰러질 때 (f)
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
    start: ['iris.slash', 'iris.slash', 'iris.edge', 'iris.issen'],
    passive: { name: '검의 리듬',
      lines: [['trait', '', '아이리스 카드끼리 이어 써도 연계가 끊기지 않는다.'], ['keyword', '', '매 턴 첫 베기 피해 +6.'],
        ['burst', '무한일섬', '한 턴에 베기 3번째부터 베기 피해 2배.']],
      beforeCard: (c, card, e) => {
        if (!e.isSlash(card)) return;
        if (!c.irisRhythm) { c.bonus += 6; c.irisRhythm = true; }
        if (c.slashes >= 2) { c.cardMul *= 2; e.burst('iris', '무한일섬'); }
      },
      preview: (c, card) => card.slash && !c.irisRhythm ? 6 : 0,
      onTurnStart: c => { c.irisRhythm = false; } },
  },
  brick: {
    name: '브릭', role: '대포', rarity: 3, maxHp: 32, col: '#ef6352', long: false,
    ds: '장전을 쌓았다가 한 번에 쏜다.',
    pal: { h: '#d0463a', H: '#902a24', e: '#ffd060', o: '#5a4a3a', O: '#3a2e24', a: '#e0b84a' },   // 붉은 단발, 작업복
    start: ['brick.load', 'brick.load', 'brick.fire', 'brick.over'],
    passive: { name: '여분 탄약',
      lines: [['trait', '', '다른 동료 공격에 장전 1을 실어 보낸다: 그 공격 피해 +6 (턴당 1번). 전투 시작에 장전 1.'],
        ['burst', '전탄', '장전 6 이상에서 발사·일제 사격·최후의 포탄을 쓰면 모든 적에게.']],
      onCombatStart: c => { c.loaded += 1; },
      beforeCard: (c, card, e) => { c.fullLoad = !!card.fire && c.loaded >= 6; if (c.fullLoad) e.burst('brick', '전탄'); } },
  },
  marta: {
    name: '마르타', role: '수녀', rarity: 3, maxHp: 48, col: '#e0b84a', long: true,
    ds: '막고, 맞으면 되받아친다.',
    pal: { h: '#ecc860', H: '#b08a30', e: '#5a7ab0', o: '#1e1e28', O: '#0e0e16', a: '#f0f0f0' },   // 금발 땋은 장발, 수녀복
    start: ['marta.wall', 'marta.wall', 'marta.fist', 'marta.confess'],
    passive: { name: '수호',
      lines: [['trait', '', '적의 노림을 자기에게 끌어오고(대신 맞기), 방어를 공격으로 바꾼다(심판). 전투 시작에 방어 8.'],
        ['burst', '철의 성녀', '방어 30 이상으로 턴을 끝내면 그 방어가 다음 턴까지 남고, 이번 적 턴 반격이 모든 적에게.']],
      onCombatStart: (c, e) => { e.guard(8); } },
  },
  noel: {
    name: '노엘', role: '마술사', rarity: 4, maxHp: 26, col: '#f08ac0', long: true,
    ds: '자는 동안 마력이 쌓인다.',
    pal: { h: '#f08ac0', H: '#b05a88', e: '#a0d0ff', o: '#f0e0f0', O: '#c0a8d0', a: '#ffd0e8' },
    start: ['noel.sleep', 'noel.star', 'noel.pillow', 'noel.deep'],
    passive: { name: '잠버릇',
      lines: [['trait', '', '잠든 턴에 노엘 카드를 한 장도 안 쓰면 다음 턴 시작 마력 2배.'], ['keyword', '', '잠든 채로 턴을 시작하면 방어 5.'],
        ['burst', '몽중 무쌍', '마력 20 이상이면 별똥 마법·꿈 폭발이 깨우지 않고 마력을 절반만 쓴다.']],
      onTurnStart: (c, e) => { if (c.asleep) e.guard(5); } },
  },
  raven: {
    name: '레이븐', role: '암살자', rarity: 4, maxHp: 30, col: '#9a86d8', long: false,
    ds: '독을 쌓고 목을 긋는다.',
    pal: { h: '#d0d4e0', H: '#8a8ea4', e: '#e04a4a', o: '#1e1a28', O: '#0e0c16', a: '#9a86d8' },   // 은색 단발, 검은 깃털 코트
    start: ['raven.needle', 'raven.needle', 'raven.step', 'raven.venom'],
    passive: { name: '독 묻은 깃',
      lines: [['trait', '', '독 걸린 적이 쓰러지면 그 독의 3분의 1이 남은 적 모두에게 옮겨 간다.'], ['keyword', '', '레이븐 카드로 거는 독 +1.'],
        ['burst', '흑우', '독 40 이상인 적은 독이 줄지 않고, 독 피해를 두 번 받는다.']],
      onKill: (c, f) => { const n = Math.floor(f.poison / 3); if (n > 0) for (const g of c.foes) g.poison += n; } },
  },
  // ---------- ★5 ----------
  sion: {
    name: '시온', role: '별 소환사', rarity: 5, maxHp: 32, col: '#7ab0d8', long: true, pal: pal('sion'),
    ds: '별 정령을 불러 두면 턴 끝마다 알아서 싸운다.',
    start: ['sion.call', 'sion.call', 'sion.shield', 'sion.link'],
    passive: { name: '별의 길',
      lines: [['trait', '', '내 턴이 끝난 뒤에도 싸우는 정령을 둔다. 정령 최대 6, 전투 시작에 정령 1.'],
        ['keyword', '', '정령을 부를 때마다 이번 전투 모든 정령 피해 +1 (최대 +2).'],
        ['burst', '천구', '정령이 6마리(최대)면 턴 끝에 모든 정령이 두 번 행동.']],
      spiritMax: 2,
      onCombatStart: (c, e) => { e.spirit(3, 1); } },
  },
  lunaria: {
    name: '루나리아', role: '달의 무희', rarity: 5, maxHp: 34, col: '#d8d0f8', long: true, pal: pal('lunaria'),
    ds: '전투 중에 달 모양을 바꾼다.',
    start: ['luna.crescent', 'luna.full', 'luna.new', 'luna.step'],
    passive: { name: '월광',
      lines: [['trait', '', '전투 중에 달을 바꾼다(파티 전체 효과가 바뀜). 전투 시작에 이번 전투의 달을 고른다.'],
        ['keyword', '', '달이 바뀔 때마다 카드 1장, 방어 3, 무작위 적 피해 7.'],
        ['burst', '만월야', '한 턴에 달을 3번 바꾸면 그 턴 끝까지 네 달 효과가 모두 걸리고, 그 뒤 달을 바꿀 때마다 모든 적 피해 12.']],
      onCombatStart: c => { c.moonPick = true; } },
  },
  akane: {
    name: '아카네', role: '홍련 검성', rarity: 5, maxHp: 38, col: '#ff6a4a', long: true, pal: pal('akane'),
    ds: '베면 불이 붙는다. 아이리스와 베기 횟수를 함께 센다.',
    start: ['akane.slash', 'akane.slash', 'akane.guard', 'akane.inferno'],
    passive: { name: '불꽃 칼날',
      lines: [['trait', '', '화상을 터뜨리는 건 아카네뿐(잔불·홍련 개화).'],
        ['keyword', '', '누구의 베기든 대상에게 화상 5. 화상이 있는 적에게 베기 피해 +5.'],
        ['burst', '홍련 개화', '대상 화상이 8 이상이면 베기가 맞을 때마다 화상만큼 바로 피해(화상은 남음).']],
      beforeCard: (c, card, e) => { if (e.isSlash(card) && card.target === 'foe' && c.foe?.burn > 0) c.bonus += 5; },
      preview: (c, card) => card.slash && card.target === 'foe' && c.all.some(f => !f.dead && f.burn > 0) ? 5 : 0,
      afterCard: (c, card, pick, e) => { if (e.isSlash(card)) e.burnTargets(card, pick, 5); } },
  },
  eleonore: {
    name: '엘레오노르', role: '시계탑의 마녀', rarity: 5, maxHp: 30, col: '#b48ae8', long: true, pal: pal('eleonore'),
    ds: '시간 카드를 싸게 쓰고, 밤 시계를 되돌린다.',
    start: ['eleo.second', 'eleo.minute', 'eleo.stop', 'eleo.rewind'],
    passive: { name: '시간의 주인',
      lines: [['trait', '', '밤 시계를 되돌리고 적의 턴을 건너뛰게 한다. 시간 카드 −5분, 낮잠이 40분을 되찾는다.'],
        ['keyword', '', '매 턴 처음 쓴 시간 카드는 에너지 1을 돌려준다.'],
        ['burst', '멈춘 자정', '한 턴에 시간 카드 2장째를 쓰면 밤 시계 5분을 되돌리고, 그 턴 남은 시간 카드 0분 (전투당 1번).']],
      timeMinus: 5, firstTimeEnergy: 1, napBonus: 10 },
  },
  nerea: {
    name: '네레아', role: '별 고래 기수', rarity: 5, maxHp: 34, col: '#5ad0d8', long: true, pal: pal('nerea'),
    ds: '별 고래와 함께 싸운다. 고래가 클수록 턴 끝 물보라가 세다.',
    start: ['nerea.harpoon', 'nerea.harpoon', 'nerea.song', 'nerea.tide'],
    passive: { name: '별 고래 라나',
      lines: [['trait', '', '별 고래가 함께 싸운다: 내 턴이 끝날 때마다 물보라(모든 적 피해 고래 크기×3). 크기는 전투마다 1에서 시작해 네레아 카드로 커진다(최대 8).'],
        ['keyword', '', '고래가 커질 때마다 앞줄 동료 방어 2.'],
        ['burst', '대해일', '고래 크기 7 이상이면 턴 끝 물보라가 두 번, 물보라마다 모든 적 약화 1.']],
      onCombatStart: c => { c.whale = 1; } },
  },
  // 시즌 1 「유성우의 밤」 동료 (js/data/season.js)
  estelle: {
    name: '에스텔', role: '별똥 기사', rarity: 5, maxHp: 36, col: '#f2c46a', long: true, pal: pal('estelle'),
    ds: '카드를 쓸수록 유성이 쌓이고, 쌓인 유성이 공격을 세게 하고 하늘에서 떨어진다.',
    start: ['este.slash', 'este.slash', 'este.guard', 'este.fall'],
    passive: { name: '유성의 맹세',
      lines: [['trait', '', '전투를 유성 2로 시작. 내 턴이 시작될 때 유성이 2 이상이면 별똥이 떨어져 무작위 적에게 유성×4 피해.'],
        ['keyword', '', '에스텔 카드를 쓸 때마다 유성 +1(최대 6). 에스텔 공격 카드 피해 +유성.'],
        ['burst', '유성우', '유성이 6이 되는 순간 모든 적 피해 20, 유성은 4로.']],
      onCombatStart: c => { c.comet = 2; },
      onTurnStart: (c, e) => { if ((c.comet || 0) >= 2) e.hitRandom(c.comet * 4); },
      beforeCard: (c, card) => { if (card.ch === 'estelle' && card.atk) c.bonus += c.comet || 0; },
      preview: (c, card) => card.ch === 'estelle' && card.atk ? c.comet || 0 : 0,
      afterCard: (c, card, pick, e) => {
        if (card.ch !== 'estelle') return;
        c.comet = Math.min(6, (c.comet || 0) + 1);
        if (c.comet >= 6) { e.burst('estelle', '유성우'); e.hitAll(20); c.comet = 4; }
      } },
  },
  // ---------- ★4 (나머지) ----------
  mimimomo: {
    name: '미미·모모', role: '쌍둥이', rarity: 4, maxHp: 34, col: '#ffb0a0', long: false, pal: pal('mimimomo'),
    ds: '미미 카드와 모모 카드를 번갈아 쓰면 쌍 효과.',
    start: ['mm.stab', 'mm.block', 'mm.clap', 'mm.hide'],
    passive: { name: '텔레파시',
      lines: [['trait', '', '미미 카드와 모모 카드는 연계에서 서로 다른 동료. 전투 첫 턴 연계 1칸.'], ['keyword', '', '쌍 효과 +4.'],
        ['burst', '거울 세계', '한 턴에 쌍이 2번 나면 그 턴 남은 쌍둥이 카드는 모두 쌍이고 쌍 효과 2배.']],
      onCombatStart: c => { c.chain = Math.max(c.chain, 1); } },
  },
  sebas: {
    name: '세바스', role: '집사', rarity: 4, maxHp: 32, col: '#c0c0c0', long: false, pal: pal('sebas'),
    ds: '카드를 많이 뽑고, 밤 시계를 되돌린다.',
    start: ['seb.tea', 'seb.tray', 'seb.cane', 'seb.watch'],
    passive: { name: '완벽한 준비',
      lines: [['trait', '', '매 턴 끝에 손패 1장을 골라 다음 턴으로 남긴다.'], ['keyword', '', '남긴 카드는 다음 턴 비용 −1.'],
        ['burst', '완벽한 응대', '턴 끝 손패가 6장 이상이면 전부 남기고, 다음 턴 다른 동료 카드 비용 −1.']],
      keepCard: 1 },
  },
  mariana: {
    name: '마리아나', role: '해적 여왕', rarity: 4, maxHp: 36, col: '#e0a050', long: true, pal: pal('mariana'),
    ds: '별빛(돈)을 써서 세게 친다.',
    start: ['mari.coin', 'mari.loot', 'mari.rum', 'mari.cannon'],
    passive: { name: '선장의 몫',
      lines: [['trait', '', '별빛을 화력으로 바꾼다.'], ['keyword', '', '전투에서 이기면 별빛 +5, 마리아나 카드로 적을 쓰러뜨리면 +5.'],
        ['burst', '약탈의 밤', '별빛이 30 이상이면 별빛 쓰는 카드가 별빛을 쓰지 않고 최대 효과.']],
      onWin: (G, x) => x.gold(5),
      onKill: (c, f, e) => { if (c.actor === 'mariana') e.gold(5); } },
  },
  tomori: {
    name: '토모리', role: '등대지기의 손녀', rarity: 4, maxHp: 28, col: '#f0d040', long: true, pal: pal('tomori'),
    ds: '랜턴으로 적의 다음 공격을 약하게 만든다.',
    start: ['tomo.light', 'tomo.flash', 'tomo.arrow', 'tomo.signal'],
    passive: { name: '등불지기',
      lines: [['trait', '', '적의 노림을 바꾼다.'], ['keyword', '', '매 턴, 공격이 가장 센 적의 이번 공격 −15%.'],
        ['burst', '등대 불빛', '한 턴에 노림을 2번 바꾸면 그 적들 이번 공격 −50%, 이번 턴 그 적들에게 주는 피해 2배.']],
      onTurnStart: (c, e) => { e.dimStrongest(.15); } },
  },
  sigrun: {
    name: '시그룬', role: '하늘 창기사', rarity: 4, maxHp: 40, col: '#f0e0a0', long: true, pal: pal('sigrun'),
    ds: '날아오르면 받는 피해가 절반, 급강하로 크게 친다.',
    start: ['sig.rise', 'sig.dive', 'sig.sky', 'sig.feather'],
    passive: { name: '비상',
      lines: [['trait', '', '공중이면 단일 공격의 대상이 되지 않는다.'], ['keyword', '', '2턴마다 턴 시작에 저절로 공중.'],
        ['burst', '발키리', '공중에서 한 턴에 급강하 계열 2장째를 쓰면 착지하지 않고, 그 턴 급강하 피해 +50%.']],
      onTurnStart: (c, e) => { if (c.turn % 2 === 0) e.fly(); },
      beforeCard: (c, card, e) => {
        if (!card.dive) return;
        if (c.air && ++c.diveStreak >= 2 && !c.valkyrie) { c.valkyrie = true; e.burst('sigrun', '발키리'); }
        if (c.valkyrie) c.cardMul *= 1.5;
      } },
  },
  zeno: {
    name: '제노', role: '용의 피 흑기사', rarity: 4, maxHp: 38, col: '#8a6ae0', long: true, pal: pal('zeno'),
    ds: '자기 체력을 깎아 세게 친다.',
    start: ['zeno.slash', 'zeno.slash', 'zeno.scale', 'zeno.roar'],
    passive: { name: '용혈',
      lines: [['trait', '', '스스로 다쳐서 강해진다.'], ['keyword', '', '제노 체력이 절반 이하면 모든 동료의 공격 피해 +3.'],
        ['burst', '흑룡', '이번 전투에 잃은 체력이 20 이상이면 제노 공격에 잃은 체력 ×0.3 추가 피해, 그리고 이번 전투 한 번 체력 1에서 버틴다.']],
      beforeCard: (c, card, e) => {
        if (card.atk && e.low('zeno')) c.bonus += 3;
        const l = e.lostCombat('zeno');
        if (card.atk && c.actor === 'zeno' && l >= 20) { c.bonus += Math.floor(l * .3); e.burst('zeno', '흑룡'); }
      },
      preview: (c, card, e) => (card.atk && e.low('zeno') ? 3 : 0) + (card.ch === 'zeno' && card.atk && e.lostCombat('zeno') >= 20 ? Math.floor(e.lostCombat('zeno') * .3) : 0) },
  },
  bertha: {
    name: '베르타', role: '은퇴한 탑 안내인', rarity: 4, maxHp: 30, col: '#d8b070', long: true, pal: pal('bertha'),
    ds: '적의 행동 순서를 넘기거나 되돌린다.',
    start: ['bertha.lantern', 'bertha.skip', 'bertha.back', 'bertha.book'],
    passive: { name: '사십 년의 길',
      lines: [['trait', '', '적의 행동 순서를 바꾼다: 다음 행동으로 넘기거나 바로 전 행동으로 되돌린다(안내).'],
        ['keyword', '', '행동을 바꾼 적은 취약 1.'],
        ['burst', '옛길', '한 턴에 행동을 2번 바꾸면 카드 2장, 에너지 1, 이번 턴 그 적들에게 주는 피해 +50%.']] },
  },
  // ---------- ★3 (나머지) ----------
  finn: {
    name: '핀', role: '우편배달부', rarity: 3, maxHp: 36, col: '#7aa0d0', long: false, pal: pal('finn'),
    ds: '핀의 카드는 언제나 연계를 잇는다.',
    start: ['finn.letter', 'finn.letter', 'finn.fast', 'finn.parcel'],
    passive: { name: '지름길',
      lines: [['trait', '', '핀 카드는 연계에서 누구 카드로든 친다. 핀 카드를 사이에 두고 인연이 없는 두 동료 카드를 이어 쓰면 「합동」 카드(전투당 1번). 지도 전투 칸 −5분.'],
        ['burst', '속달', '연계 3칸이 찬 뒤 서로 다른 동료 카드를 2장 더 이어 쓰면 카드 2장, 이번 턴 모든 공격 +2.']],
      fightTime: -5 },
  },
  laila: {
    name: '라일라', role: '구름 기사단 탈영병', rarity: 3, maxHp: 32, col: '#9ad0f0', long: true, pal: pal('laila'),
    ds: '카드를 뽑으며 연타한다.',
    start: ['laila.blade', 'laila.gust', 'laila.read', 'laila.empty'],
    passive: { name: '순풍',
      lines: [['trait', '', '비용 0으로 카드를 쓸 때 매 턴 처음 2번은 카드 1장. 첫 턴 카드 +1장.'],
        ['burst', '폭풍', '한 턴에 비용 0 카드 5장째부터 비용 0 카드를 쓸 때마다 무작위 적 피해 4.']],
      onCombatStart: c => { c.nextDraw += 1; } },
  },
  dora: {
    name: '도라', role: '대장장이', rarity: 3, maxHp: 42, col: '#d08a4a', long: true, pal: pal('dora'),
    ds: '전투 중에 손패 카드를 강화한다.',
    start: ['dora.hammer', 'dora.hammer', 'dora.temper', 'dora.repair'],
    passive: { name: '손질',
      lines: [['trait', '', '전투 중에 카드를 강화한다(담금질). 휴식 칸 손질은 1장 더.'],
        ['burst', '명장', '한 전투에 담금질 3번째부터 「++」(강화판 수치 +50%)가 된다.']],
      smithExtra: 1 },
  },
  gordon: {
    name: '고든', role: '요리사', rarity: 3, maxHp: 40, col: '#e0d0b0', long: false, pal: pal('gordon'),
    ds: '회복하고 다음 턴을 든든하게.',
    start: ['gord.soup', 'gord.pan', 'gord.pan', 'gord.meat'],
    passive: { name: '야식',
      lines: [['trait', '', '쓰러진 동료를 전투 중에 일으킨다(비상식량). 전투에서 이기면 모든 동료 체력 2 회복.'],
        ['burst', '만찬', '회복이 최대 체력을 넘으면 넘친 만큼 방어로. 한 턴에 회복 15 이상이면 이번 전투 모든 동료 공격 +1.']],
      onWin: (G, x) => x.healAll(2) },
  },
  fukuro: {
    name: '후쿠로', role: '야시장 상인', rarity: 3, maxHp: 38, col: '#c8a060', long: false, pal: pal('fukuro'),
    ds: '별빛을 벌고 야시장을 싸게 만든다.',
    start: ['fuku.junk', 'fuku.junk', 'fuku.fake', 'fuku.charm'],
    passive: { name: '단골',
      lines: [['trait', '', '무작위(도박) 카드를 쓴다. 야시장 10% 할인, 전투에서 이기면 별빛 +5.'],
        ['burst', '대박', '한 턴에 무작위 카드 2장째는 최대값으로 두 번 일어난다.']],
      shopDiscount: .1, onWin: (G, x) => x.gold(5) },
  },
};

// 패시브 글 (docs/12_signature.md): ① 특색 · ② 키워드 · ③ 「이름」 폭발. 화면은 text(한 줄) 또는 lines(줄마다)를 쓴다.
for (const c of Object.values(CHARACTERS)) {
  const p = c.passive;
  if (p.lines) p.text = p.lines.map(([k, n, t]) => `${k === 'burst' ? '폭발 · ' : ''}${n ? `${n}: ` : ''}${t}`).join(' ');
  const b = p.lines?.find(l => l[0] === 'burst');
  p.short = b ? `· 폭발 ${b[1]}` : p.text;   // 파티 고르기 칸처럼 좁은 곳: ③ 이름만 (전체 글은 title)
}

// 처음부터 가진 동료. 나머지는 별 소환으로 (js/meta.js). 개발판(DEV)에선 구현된 동료를 전부 고를 수 있다.
export const STARTER_OWNED = ['iris', 'brick', 'marta'];
