// 설정 창(모달) · 첫 실행 튜토리얼 화면(들어가기·끝·도움말 줄)
import { S } from '../run.js';
import { SET, calmNow, bigTextNow } from '../settings.js';
import { tutTip } from '../tutorial.js';
import { ROSTER } from '../data/roster.js';
import { palOf, esc, charSrc } from './common.js';

const pct = v => `${Math.round(v * 100)}%`;
const seg = (k, opts, cur) => `<span class="seg" role="group">${opts.map(([v, label]) =>
  `<button type="button" class="mini ${String(cur) === String(v) ? 'on' : ''}" data-set="${k}:${v}" aria-pressed="${String(cur) === String(v)}">${label}</button>`).join('')}</span>`;

export function settingsModal() {
  const inRun = !!S.G;
  return `<div class="sheet settings" role="dialog" aria-label="설정">
    <div class="shead"><h2>설정</h2><button type="button" class="mini" data-close>닫기</button></div>
    <div class="srow"><label for="set-music">음악</label><input id="set-music" type="range" min="0" max="1" step="0.05" value="${SET.music}" data-vol="music"><output id="out-music">${pct(SET.music)}</output></div>
    <div class="srow"><label for="set-sfx">효과음</label><input id="set-sfx" type="range" min="0" max="1" step="0.05" value="${SET.sfx}" data-vol="sfx"><output id="out-sfx">${pct(SET.sfx)}</output></div>
    <p class="note small">환경음(파도·바람)은 음악 음량을 따른다. 위 띠의 소리 버튼(M 키)은 전체를 켬·작게·끔으로 바꾼다.</p>
    <div class="srow"><span class="lb">빠른 사용</span>${seg('quick', [[true, '켬'], [false, '끔']], SET.quick)}<span class="note small">대상이 하나뿐인 카드는 한 번 눌러 바로 쓴다</span></div>
    <div class="srow"><span class="lb">화면 흔들림</span>${seg('shake', [[true, '켬'], [false, '끔']], SET.shake)}</div>
    <div class="srow"><span class="lb">애니메이션 줄이기</span>${seg('calm', [['null', '기기 설정대로'], [true, '줄임'], [false, '그대로']], SET.calm ?? 'null')}<span class="note small">지금 ${calmNow() ? '줄임' : '그대로'}</span></div>
    <div class="srow"><span class="lb">글자 크기</span>${seg('text', [['auto', '자동'], ['normal', '보통'], ['big', '크게']], SET.text)}<span class="note small">지금 ${bigTextNow() ? '크게' : '보통'} (자동: 작은 화면이면 크게)</span></div>
    <div class="srow"><span class="lb">첫 밤</span><button type="button" class="mini" data-tutreplay ${inRun ? 'disabled title="판을 마치고 다시 보세요"' : ''}>튜토리얼 다시 하기</button></div>
    <div class="srow danger"><span class="lb">저장 지우기</span><button type="button" class="mini" data-wipe ${S.wipeArm ? 'aria-pressed="true"' : ''}>${S.wipeArm ? '한 번 더 누르면 모두 지운다' : '동료·별 조각·기록 지우기'}</button></div>
  </div>`;
}

// 처음 켰을 때: 짧은 첫 밤으로 하는 법을 익힌다
export function tutIntroView() {
  const trio = ['iris', 'brick', 'marta'].map(k => `<img class="px" src="${charSrc(k)}" alt="">`).join('');
  return `<div class="tutintro">
    <div class="sky" aria-hidden="true"><span class="tower"></span><span class="moonbig"></span></div>
    <div class="tbox">
      <h1>야경단</h1>
      <p>매일 밤 0시, 바다 위로 탑이 솟는다. 해 뜨는 6시 전에 꼭대기에 닿아야 도시에 아침이 온다.</p>
      <p class="note">먼저 <b>짧은 첫 밤</b>(약 5분)으로 하는 법을 익힌다. 동료 셋, 칸 넷.</p>
      <div class="trio">${trio}</div>
      <div class="acts"><button type="button" class="primary" data-tutstart>첫 밤 시작</button><button type="button" data-tutskip>건너뛰기</button></div>
      <p class="note small">튜토리얼은 설정에서 다시 할 수 있다.</p>
    </div>
  </div>`;
}

export function tutDoneView() {
  const won = S.G?.tutorial?.won;
  return `<div class="tutintro done">
    <div class="sky" aria-hidden="true"><span class="tower"></span><span class="moonbig"></span></div>
    <div class="tbox">
      <h1>${won ? '첫 밤을 넘겼다' : '첫 밤은 여기까지'}</h1>
      <p>${won ? '작은 보스를 쓰러뜨렸다.' : '이번엔 졌지만 하는 법은 다 봤다.'} 진짜 밤은 막 셋, 꼭대기의 「새벽」까지다.</p>
      <p class="note">첫 선물 <b>별 조각 100</b>이 본부에 있다. 본부의 <b>[별 소환]</b>에서 10연으로 동료를 불러 보자.</p>
      <div class="acts"><button type="button" class="primary" data-tutfinish>본부로</button></div>
    </div>
  </div>`;
}

// 판 위 도움말 줄 (튜토리얼 중)
export function tutBar() {
  const t = tutTip(); if (!S.G?.tutorial) return '';
  return `<div class="tutbar" role="status"><span class="lb">도움말</span><span class="tx">${esc(t)}</span><button type="button" class="mini" data-tutskip title="첫 밤을 그만두고 타이틀로">튜토리얼 그만두기</button></div>`;
}
