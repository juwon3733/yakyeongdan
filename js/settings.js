// 설정 (docs/06 UI 규칙): 음악·효과음 음량, 화면 흔들림, 애니메이션 줄이기, 글자 크기. localStorage 'yk-settings'.
// 판(#stage)에 클래스로 건다: .bigtext(글자 크게) · .calm(애니메이션 줄이기) · .noshake(흔들림 끔).
const KEY = 'yk-settings';
const prefersCalm = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

// text: 'auto'(작은 화면이면 크게) · 'normal' · 'big'. calm: null이면 기기 설정(prefers-reduced-motion)을 따른다.
// quick: 빠른 사용 — 대상이 하나뿐인 카드는 한 번 눌러 바로 쓴다.
export const SET = { music: .8, sfx: .8, shake: true, calm: null, text: 'auto', quick: true, cutSkip: true };   // cutSkip: 한 번 본 필살 컷인은 건너뜀(기술 연출은 그대로)
try { Object.assign(SET, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* 저장 안 됨 */ }

export function saveSettings() {
  try { localStorage.setItem(KEY, JSON.stringify(SET)); } catch (e) { /* 저장 안 됨 */ }
}
export const calmNow = () => SET.calm ?? prefersCalm();
// 작은 화면 = 판 배율이 1.5배 미만 (폰 가로 844×390이면 약 1.08배)
export const SMALL_SCALE = 1.5;
let scale = 1;
export const bigTextNow = () => SET.text === 'big' || (SET.text === 'auto' && scale < SMALL_SCALE);

export function applySettings(s = scale) {
  scale = s;
  const st = document.getElementById('stage'); if (!st) return;
  st.classList.toggle('bigtext', bigTextNow());
  st.classList.toggle('calm', calmNow());
  st.classList.toggle('noshake', !SET.shake || calmNow());
}
export function setOption(k, v) {
  if (!(k in SET)) return;
  SET[k] = v;
  saveSettings(); applySettings();
}
