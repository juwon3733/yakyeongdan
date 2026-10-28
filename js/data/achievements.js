// 업적 (docs/05_meta.md §1 「도감·업적 첫 달성」). 처음 달성하면 별 조각 r.
// test(P): 판 바깥 저장(js/meta.js의 P)만 본다. 판 하나에서 일어난 일은 grantRun이 P.life(평생 기록)와 P.life.facts(한 번이라도 있었던 일)에 남긴다.
// 분류: play 플레이 · collect 수집 · depth 밤의 깊이 · daily 매일의 밤
import { MASTERY_XP } from './mastery.js';
const owned = P => Object.keys(P.owned).length;
const owned5 = (P, R) => Object.keys(P.owned).filter(k => R[k]?.rarity === 5).length;
const fact = k => P => (P.life.facts || []).includes(k);
const epSeen = P => Object.keys(P.epSeen).length;
const maxStars = P => Math.max(0, ...Object.values(P.owned).map(o => o.stars || 0));
const mxMax = (P, lv) => Object.values(P.mxp || {}).filter(x => x >= lv).length;

export const ACH_GROUP = { play: '플레이', collect: '수집', depth: '밤의 깊이', daily: '매일의 밤', endless: '끝없는 탑' };

export const ACHIEVEMENTS = [
  // 플레이
  { id: 'first_run', g: 'play', name: '첫 밤', text: '판을 한 번 끝낸다.', r: 5, test: P => P.runs >= 1 },
  { id: 'act1', g: 'play', name: '등대를 지나', text: '막 보스를 처음 쓰러뜨린다.', r: 5, test: P => P.life.bossKills >= 1 },
  { id: 'act2', g: 'play', name: '구름 위로', text: '2막 보스를 쓰러뜨린다.', r: 10, test: fact('act2') },
  { id: 'dawn', g: 'play', name: '새벽을 넘다', text: '「새벽」을 처음 쓰러뜨린다.', r: 20, test: P => P.wins >= 1 },
  { id: 'wins5', g: 'play', name: '익숙한 탑', text: '「새벽」을 5번 쓰러뜨린다.', r: 15, test: P => P.wins >= 5 },
  { id: 'wins20', g: 'play', name: '매일 밤의 야경단', text: '「새벽」을 20번 쓰러뜨린다.', r: 30, test: P => P.wins >= 20 },
  { id: 'early', g: 'play', name: '해 뜨기 전에', text: '6:00 전에 꼭대기에 닿는다.', r: 10, test: P => P.best != null && P.best < 360 },
  { id: 'early5', g: 'play', name: '다섯 시의 야경단', text: '5:00 전에 꼭대기에 닿는다.', r: 25, test: P => P.best != null && P.best < 300 },
  { id: 'late', g: 'play', name: '아슬아슬', text: '해가 뜬 뒤에 「새벽」을 쓰러뜨린다.', r: 10, test: fact('lateWin') },
  { id: 't100', g: 'play', name: '터지는 턴', text: '한 턴에 피해 100.', r: 5, test: P => P.life.bestTurn >= 100 },
  { id: 't200', g: 'play', name: '불꽃놀이', text: '한 턴에 피해 200.', r: 15, test: P => P.life.bestTurn >= 200 },
  { id: 't300', g: 'play', name: '밤하늘이 갈라진다', text: '한 턴에 피해 300.', r: 30, test: P => P.life.bestTurn >= 300 },
  { id: 'big5', g: 'play', name: '쉬지 않는 폭죽', text: '한 판에서 피해 100+ 턴을 5번.', r: 15, test: fact('big5') },
  { id: 'duo1', g: 'play', name: '맞잡은 손', text: '인연 듀오를 처음 쓴다.', r: 5, test: P => P.seenDuos.length >= 1 },
  { id: 'duo3run', g: 'play', name: '세 쌍의 인연', text: '한 판에서 서로 다른 듀오 3쌍을 쓴다.', r: 10, test: fact('duo3') },
  { id: 'elite3', g: 'play', name: '강적 사냥꾼', text: '한 판에서 강적을 3번 이긴다.', r: 10, test: fact('elite3') },
  { id: 'thin', g: 'play', name: '가벼운 가방', text: '덱 12장 이하로 「새벽」을 쓰러뜨린다.', r: 20, test: fact('thinWin') },
  { id: 'thick', g: 'play', name: '두꺼운 가방', text: '덱 30장 이상으로 「새벽」을 쓰러뜨린다.', r: 15, test: fact('thickWin') },
  { id: 'relic10', g: 'play', name: '도구 상자', text: '한 판에서 도구를 10개 모은다.', r: 10, test: fact('relic10') },
  { id: 'rich', g: 'play', name: '야시장의 큰손', text: '판이 끝날 때 별빛 300 이상.', r: 10, test: fact('rich') },
  { id: 'nodown', g: 'play', name: '아무도 쓰러지지 않았다', text: '동료가 한 번도 쓰러지지 않고 「새벽」을 쓰러뜨린다.', r: 20, test: fact('noDownWin') },
  { id: 'star3', g: 'play', name: '별 셋의 자존심', text: '★3 동료만으로 「새벽」을 쓰러뜨린다.', r: 20, test: fact('star3Win') },
  { id: 'no5', g: 'play', name: '평범한 야경단', text: '★5 없이 「새벽」을 쓰러뜨린다.', r: 10, test: fact('no5Win') },
  { id: 'moons', g: 'play', name: '네 개의 달', text: '달 네 모양에서 모두 이긴다.', r: 20, test: P => Object.values(P.rec.moons).filter(v => v > 0).length >= 4 },
  { id: 'combos5', g: 'play', name: '여러 얼굴', text: '서로 다른 조합 5개로 이긴다.', r: 15, test: P => Object.keys(P.rec.combo).length >= 5 },
  // 수집
  { id: 'own5', g: 'collect', name: '다섯 명의 야경단', text: '동료 5명.', r: 5, test: P => owned(P) >= 5 },
  { id: 'own10', g: 'collect', name: '열 명의 야경단', text: '동료 10명.', r: 10, test: P => owned(P) >= 10 },
  { id: 'own15', g: 'collect', name: '북적이는 본부', text: '동료 15명.', r: 15, test: P => owned(P) >= 15 },
  { id: 'own20', g: 'collect', name: '모두 모였다', text: '동료 20명 전부.', r: 30, test: P => owned(P) >= 20 },
  { id: 'five1', g: 'collect', name: '갈라진 하늘', text: '★5 동료를 처음 만난다.', r: 10, need: 'R', test: (P, R) => owned5(P, R) >= 1 },
  { id: 'five4', g: 'collect', name: '네 개의 별', text: '★5 동료 4명 모두.', r: 30, need: 'R', test: (P, R) => owned5(P, R) >= 4 },
  { id: 'stars5', g: 'collect', name: '별자리 완성', text: '한 동료의 별자리 5.', r: 20, test: P => maxStars(P) >= 5 },
  { id: 'duos10', g: 'collect', name: '인연 수첩', text: '인연 듀오 10쌍을 찾는다.', r: 10, test: P => P.seenDuos.length >= 10 },
  { id: 'duos22', g: 'collect', name: '인연의 그물', text: '인연 듀오 22쌍을 찾는다.', r: 20, test: P => P.seenDuos.length >= 22 },
  { id: 'duos44', g: 'collect', name: '모든 인연', text: '인연 듀오 44쌍을 모두 찾는다.', r: 30, test: P => P.seenDuos.length >= 44 },
  { id: 'ep10', g: 'collect', name: '이야기 한 다발', text: '에피소드 10화를 본다.', r: 10, test: P => epSeen(P) >= 10 },
  { id: 'ep30', g: 'collect', name: '본부의 이야기꾼', text: '에피소드 30화를 본다.', r: 20, test: P => epSeen(P) >= 30 },
  { id: 'ep60', g: 'collect', name: '모두의 이야기', text: '에피소드 60화를 모두 본다.', r: 30, test: P => epSeen(P) >= 60 },
  { id: 'pulls100', g: 'collect', name: '별을 세는 밤', text: '별 소환 100번.', r: 10, test: P => P.pulls >= 100 },
  { id: 'foes30', g: 'collect', name: '탑의 주민들', text: '적 30종을 만난다.', r: 10, test: P => P.foesSeen.length >= 30 },
  { id: 'cards100', g: 'collect', name: '손에 익은 카드', text: '서로 다른 카드 100종을 쓴다.', r: 15, test: P => P.cardsUsed.length >= 100 },
  { id: 'talks20', g: 'collect', name: '휴식 시간', text: '휴식 대화 20개를 본다.', r: 10, test: P => P.talksSeen.length >= 20 },
  { id: 'mx3', g: 'collect', name: '단짝', text: '한 동료의 숙련도 3.', r: 10, test: P => mxMax(P, MASTERY_XP[2]) >= 1 },
  { id: 'mx5', g: 'collect', name: '등을 맡긴 사이', text: '한 동료의 숙련도 5.', r: 20, test: P => mxMax(P, MASTERY_XP[4]) >= 1 },
  { id: 'mx5x5', g: 'collect', name: '야경단의 기둥들', text: '동료 다섯의 숙련도 5.', r: 30, test: P => mxMax(P, MASTERY_XP[4]) >= 5 },
  // 밤의 깊이
  { id: 'd1', g: 'depth', name: '조금 더 깊은 밤', text: '밤의 깊이 1을 깬다.', r: 5, test: P => P.rec.depthBest >= 1 },
  { id: 'd3', g: 'depth', name: '깊은 밤', text: '밤의 깊이 3을 깬다.', r: 10, test: P => P.rec.depthBest >= 3 },
  { id: 'd5', g: 'depth', name: '한밤중', text: '밤의 깊이 5를 깬다.', r: 15, test: P => P.rec.depthBest >= 5 },
  { id: 'd7', g: 'depth', name: '가장 어두운 시각', text: '밤의 깊이 7을 깬다.', r: 20, test: P => P.rec.depthBest >= 7 },
  { id: 'd10', g: 'depth', name: '끝없는 밤의 끝', text: '밤의 깊이 10을 깬다.', r: 30, test: P => P.rec.depthBest >= 10 },
  // 매일의 밤
  { id: 'daily1', g: 'daily', name: '오늘의 밤', text: '매일의 밤을 처음 깬다.', r: 10, test: P => P.life.dailyWins >= 1 },
  { id: 'daily7', g: 'daily', name: '일주일의 야경단', text: '매일의 밤을 7번 깬다.', r: 20, test: P => P.life.dailyWins >= 7 },
  { id: 'daily30', g: 'daily', name: '한 달의 야경단', text: '매일의 밤을 30번 깬다.', r: 30, test: P => P.life.dailyWins >= 30 },
  // 끝없는 탑
  { id: 'end10', g: 'endless', name: '새벽 너머', text: '끝없는 탑 10층에 닿는다.', r: 10, test: P => (P.rec.endlessBest || 0) >= 10 },
  { id: 'end20', g: 'endless', name: '구름보다 높이', text: '끝없는 탑 20층에 닿는다.', r: 20, test: P => (P.rec.endlessBest || 0) >= 20 },
  { id: 'end30', g: 'endless', name: '별보다 높이', text: '끝없는 탑 30층에 닿는다.', r: 30, test: P => (P.rec.endlessBest || 0) >= 30 },
  { id: 'endboss3', g: 'endless', name: '탑 위의 보스', text: '끝없는 탑에서 보스를 모두 3번 쓰러뜨린다.', r: 15, test: P => (P.rec.endlessBosses || 0) >= 3 },
  { id: 'end3star', g: 'endless', name: '별 셋의 뚝심', text: '★3 동료만으로 끝없는 탑 10층에 닿는다.', r: 20, test: fact('endless3star') },
];
