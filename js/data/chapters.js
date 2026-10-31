// 본편 장 (docs/10_chapters.md). 장마다 새 지역 3막 + 마지막 보스, 장이 높을수록 적이 세다.
//   CHAPTERS[n]: name 장 이름 · acts { 1·2·3: 막 이름 } · pools { 1·2·3: { easy, fights, elites, boss } }(js/data/enemies.js ACTS와 같은 모양)
//     scale { hp 적 체력 배수, str 적 힘 + } · story { start, boss, end } 장면 키(STORY) — 처음 한 번 보고 에피소드 목록에서 다시 보기
//   1장은 처음부터 있던 탑(ACTS·「새벽」). 2·3장 적은 아래에서 FOE에 더한다(그림이 오기 전엔 FOE_PAL 임시 도트).
import { FOE, FOE_PAL, ACTS } from './enemies.js';

const A = (v, n = 1) => ({ t: 'atk', v, n }), B = v => ({ t: 'blk', v }), U = v => ({ t: 'buf', v }), M = (v, b) => ({ t: 'mix', v, b });
const W = (s, v) => ({ t: 'deb', s, v }), T = v => ({ t: 'time', v });
const R = v => ({ t: 'aoe', v }), X = v => ({ t: 'boom', v }), G = v => ({ t: 'gblk', v }), H = v => ({ t: 'mend', v });
const Z = id => ({ t: 'sum', id }), S = (n = 1) => ({ t: 'steal', n });

// ---------- 임시 도트 색 ----------
Object.assign(FOE_PAL, {
  canal:  { h: '#3a8a8a', H: '#1e5a5a', e: '#fff0a0', o: '#2a4a5a', O: '#162a36', a: '#a0f0e0' },
  mask:   { h: '#f0e0f0', H: '#b090b8', e: '#ff5a8a', o: '#5a2a5a', O: '#361636', a: '#ffd060' },
  brass:  { h: '#d0a050', H: '#8a6020', e: '#60e0ff', o: '#6a5030', O: '#3e2e1a', a: '#ffe080', skin: '#c8b090' },
  chapel: { h: '#d8d8f0', H: '#9a9ac0', e: '#ffe8a0', o: '#3a3a6a', O: '#22223e', a: '#c8c8ff' },
  bell:   { h: '#c8a060', H: '#7a5a28', e: '#ffffff', o: '#3a3040', O: '#1e1824', a: '#ffe08a', skin: '#d0c0a0' },
  frost:  { h: '#e0f4ff', H: '#90c0e0', e: '#3a8aff', o: '#5a8ab0', O: '#2e5070', a: '#ffffff' },
  aurora: { h: '#80f0c0', H: '#3aa080', e: '#ff8af0', o: '#2a5a7a', O: '#163a52', a: '#c0a0ff' },
  void:   { h: '#2a1a4a', H: '#140a2a', e: '#ff4a8a', o: '#4a2a7a', O: '#2a164a', a: '#c0a0ff', skin: '#b0a0d0' },
  night:  { h: '#141430', H: '#06061a', e: '#ffe080', o: '#3a3a8a', O: '#1e1e52', a: '#a0b0ff', skin: '#c8c8e8' },
});

// ---------- 2장 · 잠든 운하 도시: 시계가 멈춰 아침 종이 울리지 않는 도시 ----------
Object.assign(FOE, {
  // 1막 물길 거리
  gondola:  { name: '뱃사공 유령', hp: 32, pal: 'canal', hitSound: 'magic', long: true, pat: [A(11), A(6, 2), B(8)] },
  dancer:   { name: '가면 무희', hp: 28, pal: 'mask', hitSound: 'soft', long: true, aim: 'back', pat: [W('weak', 2), A(8, 2), A(13)] },
  rat:      { name: '운하 쥐', hp: 11, pal: 'canal', hitSound: 'beast', small: true, aim: 'weakest', pat: [A(5), A(3, 2)] },
  lampfish: { name: '등불 물고기', hp: 24, pal: 'canal', hitSound: 'beast', thorns: 2, pat: [A(10), B(7), A(12)] },
  troll:    { name: '다리 문지기', hp: 78, pal: 'brass', hitSound: 'shell', pat: [B(14), A(26), A(9, 2), U(3)],
              lines: ['"다리를 건너려면 통행료다. 시간으로 내라."', '"이 다리는 밤새 아무도 못 건넜다."'] },
  masque:   { name: '가면 무도회 주인', hp: 66, pal: 'mask', hitSound: 'soft', long: true, aim: 'weakest', pat: [Z('dancer'), W('vuln', 2), A(9, 3), A(20)],
              lines: ['"춤을 멈추면 아침이 와 버리잖아요?"', '"가면을 쓰면 밤은 끝나지 않아요."'] },
  floodgate:{ name: '수문장', hp: 104, pal: 'canal', hitSound: 'shell', long: true, crown: true, aim: 'front',
              lines: ['"물길을 닫았다. 아침은 이 도시로 흘러들지 못한다."', '"수문이 열리는 건 내가 쓰러질 때뿐."'],
              phase2: { at: .5, msg: '수문장이 수문을 활짝 열었다! 물살이 모두를 덮친다.', pat: [R(10), A(14), B(12), R(13)] },
              pat: [A(12), B(14), A(7, 3), R(8)] },
  // 2막 태엽 공방
  doll:     { name: '태엽 인형병', hp: 42, pal: 'brass', hitSound: 'shell', pat: [A(15), B(10), A(18)] },
  springcat:{ name: '태엽 고양이', hp: 36, pal: 'brass', hitSound: 'beast', long: true, aim: 'back', pat: [A(5, 4), U(2)] },
  oil:      { name: '기름 덩어리', hp: 40, pal: 'void', hitSound: 'soft', aim: 'weakest', pat: [W('weak', 2), A(14), H(8)] },
  cuckoo:   { name: '뻐꾸기 시계', hp: 34, pal: 'brass', hitSound: 'shell', aim: 'last', pat: [A(11), T(8), A(16)] },
  automaton:{ name: '거인 자동인형', hp: 92, pal: 'brass', hitSound: 'shell', armor: 2, pat: [A(28), B(16), A(10, 3)],
              lines: ['태엽 감기는 소리가 공방을 가득 채운다.', '거인 인형의 눈에 불이 들어온다.'] },
  tinker:   { name: '땜장이 유령', hp: 74, pal: 'chapel', hitSound: 'magic', long: true, pat: [G(10), Z('doll'), A(12, 2), H(14)],
              lines: ['"고쳐 줄게, 다 고쳐 줄게. 멈춘 채로."', '"망가진 건 멈춰 있는 게 제일 예뻐."'] },
  clockknight:{ name: '멈춘 태엽 기사', hp: 128, pal: 'brass', hitSound: 'shell', long: true, crown: true, aim: 'top',
              lines: ['"시간은 멈췄다. 멈춘 시간 안에서 나는 지지 않는다."', '"태엽이 다 풀리기 전에 쓰러뜨려 봐라."'],
              phase2: { at: .5, msg: '멈춘 태엽 기사가 스스로 태엽을 감았다! 두 번씩 움직인다.', acts: 2, pat: [A(12), B(10), A(6, 2)] },
              pat: [A(18), M(14, 12), A(8, 3), U(3)] },
  // 3막 달빛 대성당
  choir:    { name: '성가대 유령', hp: 40, pal: 'chapel', hitSound: 'magic', long: true, pat: [R(7), A(13), B(10)] },
  bellbat:  { name: '종 박쥐', hp: 22, pal: 'bell', hitSound: 'beast', small: true, aim: 'back', pat: [A(6, 2), A(9)] },
  saint:    { name: '유리 성자', hp: 46, pal: 'chapel', hitSound: 'shell', thorns: 3, pat: [B(16), A(19), H(10)] },
  moth:     { name: '달빛 나방', hp: 34, pal: 'chapel', hitSound: 'soft', long: true, aim: 'weakest', pat: [W('vuln', 2), A(7, 3)] },
  organist: { name: '오르간 연주자', hp: 98, pal: 'chapel', hitSound: 'magic', long: true, pat: [R(11), U(3), R(14), A(30)],
              lines: ['오르간의 낮은 음이 바닥을 울린다.', '"마지막 곡이야. 아침 종 대신 내 오르간을 들어."'] },
  gargoyle: { name: '돌 괴수', hp: 104, pal: 'bell', hitSound: 'shell', armor: 3, pat: [B(18), A(32), A(12, 2)],
              lines: ['처마 위의 돌 괴수가 날개를 편다.', '돌 부스러기가 쏟아진다. 괴수가 내려앉는다.'] },
  bellkeeper:{ name: '침묵의 종지기', hp: 166, pal: 'bell', hitSound: 'shell', long: true, crown: true, aim: 'weakest', turnClock: 1,
              lines: ['"종이 울리면 아침이 온다. 그러니 종은 울리지 않는다."', '"이 종은 백 년 동안 침묵했다. 오늘도 그럴 것이다."'],
              phase2: { at: .55, msg: '침묵의 종지기가 깨진 종을 내리쳤다! 울리지 않는 종소리가 모두를 짓누른다.', clockOnce: 5, aim: 'back',
                        pat: [R(12), A(9, 3), W('weak', 2), A(26)] },
              phase3: { at: .15, msg: '종이 흔들린다. 종지기가 마지막 힘으로 종을 붙잡는다.', line: '"…울리지 마라. 아직은."', acts: 2, pat: [A(14), R(10), A(6, 3)] },
              pat: [A(13), M(15, 14), A(6, 4), U(4), A(27)] },
});

// ---------- 3장 · 별바다 끝: 밤이 처음 태어난 곳 ----------
Object.assign(FOE, {
  // 1막 얼음 등대섬
  wisp:     { name: '서리 도깨비불', hp: 38, pal: 'frost', hitSound: 'magic', long: true, aim: 'back', pat: [A(9, 2), W('weak', 2), A(16)] },
  icecrab:  { name: '얼음 게', hp: 48, pal: 'frost', hitSound: 'shell', noPoisonWhileBlock: true, pat: [B(15), A(19), M(12, 8)] },
  owl:      { name: '눈부엉이', hp: 30, pal: 'frost', hitSound: 'beast', small: true, aim: 'weakest', pat: [A(8, 2), A(12)] },
  seal:     { name: '얼음바다 물범', hp: 44, pal: 'frost', hitSound: 'soft', pat: [A(16), H(10), A(10, 2)] },
  iceknight:{ name: '얼음 기사', hp: 112, pal: 'frost', hitSound: 'shell', armor: 2, pat: [B(16), A(30), A(11, 3)],
              lines: ['"이 섬의 불은 꺼진 지 오래다."', '얼음 갑옷이 삐걱이며 칼을 든다.'] },
  yetiwitch:{ name: '눈보라 마녀', hp: 96, pal: 'frost', hitSound: 'magic', long: true, aim: 'weakest', pat: [R(10), W('vuln', 2), Z('wisp'), A(24)],
              lines: ['"얼어붙으면 밤도 끝나지 않지."', '눈보라가 휘몰아친다.'] },
  frostkeeper:{ name: '얼어붙은 등대지기', hp: 100, pal: 'frost', hitSound: 'shell', long: true, crown: true, aim: 'light',
              lines: ['"불을 켜려 했다. 백 년 동안. 얼음이 먼저 왔다."', '"너희도 얼음이 되어라. 그러면 춥지 않다."'],
              light: { double: .5 },
              phase2: { at: .5, msg: '얼어붙은 등대지기의 등불에 푸른 불이 붙었다!', pat: [R(9), A(9, 2), M(14, 10), A(20)] },
              pat: [A(12), M(13, 10), A(6, 3), U(2)] },
  // 2막 오로라 협곡
  sprite:   { name: '오로라 요정', hp: 36, pal: 'aurora', hitSound: 'magic', long: true, aim: 'back', pat: [A(7, 3), H(10), A(15)] },
  golem:    { name: '수정 골렘', hp: 60, pal: 'aurora', hitSound: 'shell', armor: 2, pat: [B(18), A(24), A(10, 2)] },
  ray:      { name: '하늘 가오리', hp: 46, pal: 'aurora', hitSound: 'soft', long: true, pat: [R(8), A(18), A(9, 2)] },
  echo:     { name: '메아리 그림자', hp: 40, pal: 'void', hitSound: 'magic', aim: 'last', pat: [S(1), A(14), A(7, 2)] },
  drake:    { name: '폭풍 비룡', hp: 124, pal: 'aurora', hitSound: 'beast', long: true, aim: 'back', pat: [A(14, 3), U(4), A(40)],
              lines: ['협곡 위로 거대한 날개 그림자가 지나간다.', '번개가 비늘을 타고 흐른다.'] },
  twinlight:{ name: '쌍둥이 오로라', hp: 64, pal: 'aurora', hitSound: 'magic', long: true, twinRage: 6, pat: [A(18), B(12), R(9)],
              line: '초록 빛과 보라 빛이 서로를 감싸며 내려온다.' },
  warden:   { name: '오로라 파수꾼', hp: 176, pal: 'aurora', hitSound: 'magic', long: true, crown: true, aim: 'top',
              lines: ['"하늘 커튼 너머는 아무도 못 간다."', '"빛이 춤추는 동안 나는 쓰러지지 않는다."'],
              phase2: { at: .5, msg: '오로라 파수꾼이 하늘 커튼을 펼쳤다! 매 턴 모두 회복하고 강해진다.', pat: [H(16), R(13), U(3), A(30)] },
              pat: [A(16), R(10), A(8, 3), B(16), A(26)] },
  // 3막 첫 밤의 왕좌
  shade:    { name: '밤그림자', hp: 50, pal: 'void', hitSound: 'magic', long: true, aim: 'weakest', pat: [A(11, 2), W('weak', 2), A(20)] },
  voidstar: { name: '빈 별', hp: 44, pal: 'night', hitSound: 'magic', small: true, deathBoom: 6, pat: [A(10), A(14)] },
  sleeper:  { name: '잠꾸러기 꿈', hp: 54, pal: 'night', hitSound: 'soft', long: true, pat: [T(10), H(12), A(22)] },
  darkknight:{ name: '그믐 기사', hp: 62, pal: 'void', hitSound: 'shell', pat: [M(16, 12), A(26), U(3)] },
  eclipse:  { name: '일식', hp: 140, pal: 'night', hitSound: 'magic', long: true, burstClock: 3, pat: [R(12), A(16, 2), B(20), A(38)],
              lines: ['달이 해를 가린다. 빛이 사라진다.', '"빛은 언제나 가려진다."'] },
  nightmare:{ name: '악몽', hp: 128, pal: 'void', hitSound: 'magic', long: true, aim: 'weakest', pat: [W('vuln', 3), A(12, 3), S(1), A(32)],
              lines: ['"잠들면 내 차례야."', '흐릿한 형체가 웃는다. 얼굴이 계속 바뀐다.'] },
  firstnight:{ name: '첫 밤', hp: 176, pal: 'night', hitSound: 'magic', long: true, crown: true, aim: 'dawn', turnClock: 1, burstClock: 3,
              lines: ['"나는 처음으로 내려앉은 밤. 한 번도 쉬어 본 적이 없다."', '"너희가 모든 밤을 지켜 왔구나. 그럼 나도 지켜 다오. 마지막까지."'],
              phase2: { at: .6, msg: '첫 밤이 별을 모두 끌어내렸다. 하늘이 비었다.', clockOnce: 5, aim: 'back', pat: [R(13), A(10, 3), Z('voidstar'), A(30)] },
              phase3: { at: .18, msg: '첫 밤이 숨을 고른다. 아주 오래 참아 온 숨이다.', line: '"…이제 쉬어도 될까."', acts: 2, pat: [A(16), R(12), A(7, 4)] },
              pat: [A(13), A(5, 4), M(15, 14), U(3), A(26)] },
});

export const CHAPTERS = {
  1: { id: 1, name: '1장 · 등대의 탑', short: '등대의 탑', col: '#ffb070',
       acts: { 1: '1막 · 항구층', 2: '2막 · 구름층', 3: '3막 · 별층' }, pools: ACTS, final: 'dawn',
       scale: { hp: 1, str: 0 }, story: { start: 'ch1_start', boss: 'ch1_boss', end: 'ch1_end' },
       blurb: '밤마다 탑을 올라 새벽을 넘긴다.' },
  2: { id: 2, name: '2장 · 잠든 운하 도시', short: '잠든 운하 도시', col: '#7ad0c8',
       acts: { 1: '1막 · 물길 거리', 2: '2막 · 태엽 공방', 3: '3막 · 달빛 대성당' },
       pools: {
         1: { easy: [['gondola'], ['lampfish'], ['rat', 'rat', 'rat']],
              fights: [['gondola'], ['dancer', 'rat'], ['lampfish', 'rat'], ['gondola', 'dancer'], ['rat', 'rat', 'rat', 'rat'], ['lampfish', 'dancer'], ['gondola', 'rat', 'rat']],
              elites: [['troll'], ['masque']], boss: ['floodgate'] },
         2: { easy: [['doll'], ['cuckoo'], ['springcat']],
              fights: [['doll'], ['springcat', 'cuckoo'], ['oil'], ['doll', 'cuckoo'], ['oil', 'springcat'], ['doll', 'doll'], ['cuckoo', 'cuckoo', 'springcat']],
              elites: [['automaton'], ['tinker']], boss: ['clockknight'] },
         3: { easy: [['choir'], ['saint'], ['bellbat', 'bellbat']],
              fights: [['choir'], ['saint'], ['moth', 'bellbat'], ['choir', 'moth'], ['bellbat', 'bellbat', 'bellbat', 'bellbat'], ['saint', 'bellbat'], ['choir', 'saint']],
              elites: [['organist'], ['gargoyle']], boss: ['bellkeeper'] },
       }, final: 'bellkeeper', scale: { hp: 1.1, str: 0 }, story: { start: 'ch2_start', boss: 'ch2_boss', end: 'ch2_end' },
       blurb: '시계가 멈춰 아침 종이 울리지 않는 도시.' },
  3: { id: 3, name: '3장 · 별바다 끝', short: '별바다 끝', col: '#a0b0ff',
       acts: { 1: '1막 · 얼음 등대섬', 2: '2막 · 오로라 협곡', 3: '3막 · 첫 밤의 왕좌' },
       pools: {
         1: { easy: [['wisp'], ['seal'], ['owl', 'owl']],
              fights: [['wisp'], ['icecrab'], ['owl', 'owl', 'owl'], ['seal', 'owl'], ['wisp', 'icecrab'], ['seal', 'wisp'], ['owl', 'owl', 'owl', 'owl']],
              elites: [['iceknight'], ['yetiwitch']], boss: ['frostkeeper'] },
         2: { easy: [['sprite'], ['echo'], ['ray']],
              fights: [['golem'], ['sprite', 'echo'], ['ray'], ['golem', 'sprite'], ['ray', 'echo'], ['sprite', 'sprite', 'sprite'], ['golem', 'echo']],
              elites: [['drake'], ['twinlight', 'twinlight']], boss: ['warden'] },
         3: { easy: [['shade'], ['darkknight'], ['voidstar', 'voidstar']],
              fights: [['shade'], ['darkknight'], ['sleeper'], ['shade', 'voidstar'], ['darkknight', 'sleeper'], ['voidstar', 'voidstar', 'voidstar'], ['shade', 'darkknight']],
              elites: [['eclipse'], ['nightmare']], boss: ['firstnight'] },
       }, final: 'firstnight', scale: { hp: 1.15, str: 0 }, story: { start: 'ch3_start', boss: 'ch3_boss', end: 'ch3_end' },
       blurb: '밤이 처음 태어난 곳. 한 번도 쉬어 본 적 없는 밤.' },
};
export const CHAPTER_MAX = 3;
export const chapterOf = G => CHAPTERS[G?.chapter || 1] || CHAPTERS[1];
export const actName = (G, act = G?.act) => G?.endless ? '끝없는 탑' : chapterOf(G).acts[act] || '';

// ---------- 장 이야기 (에피소드 화면으로 재생, js/episodes.js openStory) ----------
const N = t => ['', t];
export const STORY = {
  ch1_start: { title: '1장 · 등대의 탑', bg: 'harbor', lines: [
    N('항구 끝의 오래된 탑. 해가 지면 탑 안에 밤이 고이고, 고인 밤은 아침이 오는 걸 막는다.'),
    ['marta', '오늘 밤도 탑에 불이 켜졌어요. 올라가야겠네요.'],
    ['brick', '야경단 출동! 맨 위까지 올라가서 「새벽」을 넘기면 끝이지?'],
    ['iris', '…매일 밤이다.'],
    ['marta', '그러니까 매일 밤 같이 가요. 그게 야경단이니까.'],
  ] },
  ch1_boss: { title: '꼭대기의 「새벽」', bg: 'roof', lines: [
    N('탑 꼭대기. 붉은 빛을 두른 「새벽」이 기다리고 있다.'),
    ['iris', '저게 「새벽」.'],
    ['brick', '저걸 넘겨야 진짜 아침이 오는 거지? 좋아, 한 방에 가자고!'],
  ] },
  ch1_end: { title: '등대 불빛 너머', bg: 'roof', lines: [
    N('「새벽」이 물러나고, 탑 꼭대기의 등대에 아침 햇살이 들어온다.'),
    ['marta', '해가 떴어요. 오늘도 해냈네요.'],
    N('등대 불빛이 멀리 바다 건너를 비춘다. 저 멀리 도시 하나는 아직 어둡다.'),
    ['iris', '…저기는 아직 밤이다.'],
    ['brick', '운하 도시잖아! 저기는 종이 울려야 아침이 오는데, 요즘 종소리를 못 들었어.'],
    ['marta', '그럼 다음엔 저기로 가요. 밤이 안 끝나는 곳이 있으면, 야경단이 가야죠.'],
  ] },
  ch2_start: { title: '2장 · 잠든 운하 도시', bg: 'harbor', lines: [
    N('물길이 거미줄처럼 얽힌 운하 도시. 시계탑 바늘은 자정에서 멈췄고, 사람들은 깨지 않는 잠에 빠져 있다.'),
    ['brick', '조용하다… 배도 안 다니고, 불도 다 꺼졌어.'],
    ['marta', '아침 종이 백 년째 안 울렸대요. 종지기가 종을 붙잡고 놓지 않는다고.'],
    ['iris', '물길부터 열자. 수문이 닫혀 있다.'],
  ] },
  ch2_boss: { title: '대성당의 종', bg: 'convent', lines: [
    N('달빛 대성당 꼭대기. 금이 간 거대한 종 앞에 종지기가 서 있다.'),
    ['marta', '종을 울리면 이 도시에도 아침이 와요.'],
    ['iris', '…울리게 하자.'],
  ] },
  ch2_end: { title: '아침 종', bg: 'convent', lines: [
    N('종지기가 손을 놓자, 금 간 종이 처음으로 흔들린다. 깊고 긴 종소리가 도시를 깨운다.'),
    ['brick', '울렸다! 진짜 울렸어!'],
    N('창문마다 불이 켜지고, 멈춘 시계 바늘이 움직이기 시작한다.'),
    ['marta', '종소리가 바다 건너까지 가요. 저쪽 끝에서… 뭔가 대답하네요.'],
    ['iris', '별바다 끝. 밤이 처음 내려앉은 곳이다.'],
    ['brick', '처음 밤? 그럼 거기만 아침이 오면 끝이겠네. 가자!'],
  ] },
  ch3_start: { title: '3장 · 별바다 끝', bg: 'dream', lines: [
    N('얼음과 별빛만 있는 바다의 끝. 하늘에는 별이 너무 많고, 해가 뜬 적이 없다.'),
    ['marta', '추워요… 그런데 이상하게 무섭지는 않네요.'],
    ['iris', '여기 밤은 지쳐 있다.'],
    ['brick', '지친 밤? 그럼 우리가 좀 쉬게 해 주자고.'],
  ] },
  ch3_boss: { title: '첫 밤의 왕좌', bg: 'dream', lines: [
    N('별로 만든 왕좌. 그 위에 처음으로 내려앉은 밤, 「첫 밤」이 앉아 있다.'),
    ['marta', '한 번도 쉬지 못하고 모든 밤을 지켜 왔대요.'],
    ['iris', '그럼 오늘은 우리가 지킨다. 끝까지.'],
  ] },
  ch3_end: { title: '처음 오는 아침', bg: 'roof', lines: [
    N('「첫 밤」이 왕좌에서 내려와 길게 숨을 내쉰다. 별바다 끝에 처음으로 해가 걸린다.'),
    ['marta', '이제 쉬어도 돼요. 밤은 우리가 지킬게요.'],
    N('「첫 밤」이 웃는 것 같다. 그리고 아주 조용해진다.'),
    ['brick', '근데 밤은 또 오잖아?'],
    ['iris', '그래서 야경단이 있다.'],
    ['marta', '네. 내일 밤도, 같이 가요.'],
  ] },
};
