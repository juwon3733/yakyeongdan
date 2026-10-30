// 동료 숙련도 1~5: 그 동료를 데리고 판을 할수록 오른다. 보상은 꾸미기뿐(성능 없음).
// 점수: 판을 끝냄 +1, 2막 보스 격파 +1, 「새벽」 격파 +2. 단계 n에 필요한 점수 = MASTERY_XP[n-1].
export const MASTERY_XP = [1, 4, 9, 16, 25];
export const MASTERY_GAIN = { run: 1, act2: 1, win: 2 };
// {name}은 동료 이름. kind: frame 초상 테두리 · title 칭호 · back 카드 뒷면 · gold 금 테두리
export const MASTERY_REWARDS = [
  { lv: 1, kind: 'frame', text: '초상 테두리 (동료 색)' },
  { lv: 2, kind: 'title', title: '{name}의 동행', text: '칭호 {name}의 동행' },
  { lv: 3, kind: 'title', title: '{name}의 단짝', text: '칭호 {name}의 단짝' },
  { lv: 4, kind: 'back', text: '{name} 카드 뒷면 (보상 카드 뒤집기)' },
  { lv: 5, kind: 'gold', title: '{name}의 야경단원', text: '금 테두리 · 칭호 {name}의 야경단원' },
];
export const masteryLv = xp => MASTERY_XP.filter(t => (xp || 0) >= t).length;
