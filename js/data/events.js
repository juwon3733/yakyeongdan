// 사건 (docs/02_rules.md §12, 12개 + 덤 2개). 판마다 같은 사건은 한 번만.
//   text: 글 또는 x => 글 · opts[].t: 글 또는 x => 글 · opts[].can(x): false면 못 고름 · opts[].f(x): 고르면
//   f가 true를 돌려주면 다음 층으로 넘어가지 않고 다른 화면(카드 지우기·복제)으로 간다.
// x = 사건 도우미 (js/map.js eventApi):
//   heal(n)·loseHp(n)·maxHp(n) 모든 동료 · front 앞줄 동료 · loseHpOne(id, n) · addTime(m)·rewind(m)
//   addRandomCard()·addCurse()·removeCard()·dupeCard()·upgradeRandom(filter) · gold(n)·haveGold
//   relic()·relicOrCurse() · moonNext() · canSkip·skipFloor() · chance(p) · has(동료 id) · mate(이 사건의 동료) · eliteName
import { CHARACTERS } from './characters.js';

const MATE_TALK = {
  iris: '아이리스가 칼날을 닦다 말고 중얼거린다. "…요즘 베기가 무뎌. 봐 줄래?"',
  brick: '브릭이 대포를 끌어안고 한숨을 쉰다. "이 녀석, 오늘따라 장전이 뻑뻑해."',
  marta: '마르타가 철장갑을 벗고 손을 본다. "다들 저보다 먼저 다치면 어쩌죠."',
  noel: '노엘이 눈을 반쯤 뜬다. "…꿈에서 별을 셌는데, 하나가 모자랐어."',
  raven: '레이븐이 가면을 만지작거린다. "…독이 너무 순해졌어. 손 좀 봐야겠군."',
};

export const EVENTS = [
  { id: 'chest', title: '떠내려온 상자', text: '파도에 밀려온 상자가 계단에 걸려 있다. 자물쇠는 녹슬었다.',
    opts: [ { t: '연다: 무작위 카드 1장 (30%로 저주도 1장)', f: x => { x.addRandomCard(); if (x.chance(.3)) x.addCurse(); } },
            { t: '그냥 간다', f: () => {} } ] },
  { id: 'child', title: '길 잃은 아이의 등불', text: '작은 등불을 든 아이가 계단참에 앉아 울고 있다. 아래층으로 가는 길을 잃었다고.',
    opts: [ { t: '데려다준다: 밤 시계 +30분, 도구 하나', f: x => { x.addTime(30); x.relic(); } },
            { t: '길만 알려 준다: 별빛 +20', f: x => x.gold(20) } ] },
  { id: 'clocksmith', title: '시계 수리공', text: '톱니를 늘어놓은 노인이 손짓한다. "멈춘 시간도 고쳐 주지. 값은 별빛으로."',
    opts: [ { t: '별빛 50으로 밤 시계 40분 되찾기', can: x => x.haveGold >= 50, f: x => { x.gold(-50); x.rewind(40); } },
            { t: '시간 카드 1장 강화 (공짜)', can: x => x.hasTimeCard, f: x => x.upgradeRandom(d => d.time) },
            { t: '지나간다', f: () => {} } ] },
  { id: 'mirror', title: '거울 복도', text: '끝없이 이어지는 거울. 비친 카드 한 장이 손에 잡힐 것 같다. 대신 거울이 앞줄 동료의 피를 원한다.',
    opts: [ { t: x => `카드 1장 복제: ${x.frontName} 체력 8 잃음`, f: x => { x.loseHpOne(x.front, 8); return x.dupeCard(); } },
            { t: '지나간다', f: () => {} } ] },
  { id: 'moonwell', title: '달 우물', text: '달빛이 고인 우물. 물을 저으면 하늘의 달 모양이 따라 바뀐다.',
    opts: [ { t: x => `젓는다: 달을 다음 모양으로 (지금 ${x.moonName})`, f: x => x.moonNext() },
            { t: '지나간다', f: () => {} } ] },
  { id: 'cat', title: '졸린 고양이', text: '계단 한가운데 고양이가 둥글게 말려 자고 있다.',
    opts: [ { t: x => x.has('noel') ? '쓰다듬는다: 노엘이 옆에 누워 버린다 (「깊은 잠」 강화)' : '쓰다듬는다: 모든 동료 체력 +3',
              f: x => { if (x.has('noel')) x.upgradeRandom(d => d.id === 'noel.deep'); else x.heal(3); } },
            { t: '지나간다', f: () => {} } ] },
  { id: 'graffiti', title: '탑의 낙서', text: x => `벽에 지난 야경단의 메모가 남아 있다. "이번 층 강적: <b>${x.eliteName}</b>. 조심해."`,
    opts: [ { t: '기억해 둔다', f: () => {} } ] },
  { id: 'meteor', title: '별똥 비', text: '탑 바깥으로 별똥이 비처럼 쏟아진다. 주우러 나가면 시간이 든다.',
    opts: [ { t: '줍는다: 밤 시계 +20분, 별빛 +40', f: x => { x.addTime(20); x.gold(40); } },
            { t: '지나간다', f: () => {} } ] },
  { id: 'elevator', title: '고장 난 엘리베이터', text: '덜컹거리는 엘리베이터. 타면 다음 층을 건너뛰지만, 내릴 때 크게 부딪칠 것이다.',
    opts: [ { t: '탄다: 다음 층을 건너뜀, 모든 동료 체력 -10', can: x => x.canSkip, f: x => { x.loseHp(10); x.skipFloor(); } },
            { t: '걸어서 간다', f: () => {} } ] },
  { id: 'grave', title: '무명 묘비', text: '이름 없는 묘비 앞에 카드 한 장을 내려놓을 수 있다.',
    opts: [ { t: '덱에서 카드 한 장 지우기', f: x => x.removeCard() },
            { t: '지나간다', f: () => {} } ] },
  { id: 'lottery', title: '노점 경품 뽑기', text: '가면 쓴 노점상이 뽑기 통을 흔든다. "한 번에 별빛 30!"',
    opts: [ { t: '뽑는다: 별빛 30, 무작위 도구 (50%로 저주)', can: x => x.haveGold >= 30, f: x => { x.gold(-30); x.relicOrCurse(); } },
            { t: '지나간다', f: () => {} } ] },
  { id: 'worry', title: '동료의 고민', text: x => MATE_TALK[x.mate] || `${CHARACTERS[x.mate].name}이(가) 할 말이 있는 눈치다.`,
    opts: [ { t: x => `들어 준다: ${CHARACTERS[x.mate].name} 카드 1장 강화`, f: x => x.upgradeRandom(d => d.ch === x.mate) },
            { t: '나중에', f: () => {} } ] },
  // 덤
  { id: 'trader', title: '시간 상인', text: '모래시계를 든 상인이 말을 건다. "밤 한 조각, 사고 팔지."',
    opts: [ { t: '30분을 판다: 모든 동료 체력 +8, 시계 +30분', f: x => { x.heal(8); x.addTime(30); } },
            { t: '30분을 산다: 모든 동료 체력 -4, 시계 -30분', f: x => { x.loseHp(4); x.rewind(30); } } ] },
  { id: 'well', title: '탑의 우물', text: '달빛이 고인 우물. 물을 마시거나, 바닥에 가라앉은 무언가를 건질 수 있다.',
    opts: [ { t: '물을 마신다: 모든 동료 체력 +6', f: x => x.heal(6) },
            { t: '건져 본다: 무작위 카드 1장', f: x => { x.addRandomCard(); } } ] },
];
