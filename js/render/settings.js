// 설정 창(모달) · 첫 실행 튜토리얼 화면(들어가기·끝·도움말 줄)
import { S } from '../run.js';
import { SET, calmNow, bigTextNow } from '../settings.js';
import { tutTip } from '../tutorial.js';
import { ROSTER } from '../data/roster.js';
import { palOf, esc, charSrc } from './common.js';
import { artURL, battleArt } from '../art.js';
import { canFullscreen, isFullscreen } from '../pwa.js';

const pct = v => `${Math.round(v * 100)}%`;
const seg = (k, opts, cur) => `<span class="seg" role="group">${opts.map(([v, label]) =>
  `<button type="button" class="mini ${String(cur) === String(v) ? 'on' : ''}" data-set="${k}:${v}" aria-pressed="${String(cur) === String(v)}">${label}</button>`).join('')}</span>`;

import { online, me } from '../net.js';
export function settingsModal() {
  const inRun = !!S.G;
  return `<div class="sheet settings" role="dialog" aria-label="설정">
    <div class="shead"><h2>설정</h2><button type="button" class="mini" data-close>닫기</button></div>
    <div class="srow"><label for="set-music">음악</label><input id="set-music" type="range" min="0" max="1" step="0.05" value="${SET.music}" data-vol="music"><output id="out-music">${pct(SET.music)}</output></div>
    <div class="srow"><label for="set-sfx">효과음</label><input id="set-sfx" type="range" min="0" max="1" step="0.05" value="${SET.sfx}" data-vol="sfx"><output id="out-sfx">${pct(SET.sfx)}</output></div>
    <div class="srow" data-tip="대상이 하나뿐인 카드는 한 번 눌러 바로 쓴다"><span class="lb">빠른 사용</span>${seg('quick', [[true, '켬'], [false, '끔']], SET.quick)}</div>
    <div class="srow"><span class="lb">화면 흔들림</span>${seg('shake', [[true, '켬'], [false, '끔']], SET.shake)}</div>
    <div class="srow" data-tip="한 번 본 필살 컷인은 건너뛰고 기술 연출만 본다"><span class="lb">필살 컷인</span>${seg('cutSkip', [[false, '매번'], [true, '처음만']], SET.cutSkip)}</div>
    <div class="srow" data-tip="지금 ${calmNow() ? '줄임' : '그대로'}"><span class="lb">애니메이션 줄이기</span>${seg('calm', [['null', '기기 설정대로'], [true, '줄임'], [false, '그대로']], SET.calm ?? 'null')}</div>
    <div class="srow" data-tip="지금 ${bigTextNow() ? '크게' : '보통'} (자동: 작은 화면이면 크게)"><span class="lb">글자 크기</span>${seg('text', [['auto', '자동'], ['normal', '보통'], ['big', '크게']], SET.text)}</div>
    <div class="srow"><span class="lb">첫 밤</span><button type="button" class="mini" data-tutreplay ${inRun ? 'disabled title="판을 마친 뒤에 다시 볼 수 있다"' : ''}>튜토리얼 다시 하기</button></div>
    ${canFullscreen() ? `<div class="srow"><span class="lb">전체 화면</span><button type="button" class="mini" data-fs>${isFullscreen() ? '전체 화면 끄기' : '전체 화면 켜기'}</button><span class="note small">폰은 홈 화면에 추가하면 앱처럼 켜진다</span></div>` : ''}
    ${netRow()}
    <div class="srow" data-tip="폰을 바꿀 때: 코드를 복사해 새 기기에 붙여 넣는다"><span class="lb">저장 백업</span><button type="button" class="mini ${S.backup?.mode === 'export' ? 'on' : ''}" data-bexport>저장 내보내기</button><button type="button" class="mini ${S.backup?.mode === 'import' ? 'on' : ''}" data-bimport>불러오기</button></div>
    ${backupBox()}
    <div class="srow danger"><span class="lb">저장 지우기</span><button type="button" class="mini" data-wipe ${S.wipeArm ? 'aria-pressed="true"' : ''}>${S.wipeArm ? '한 번 더 누르면 모두 지운다' : '동료·별 조각·기록 지우기'}</button></div>
  </div>`;
}

// 온라인 계정(js/net.js): 서버 설정 전엔 안내만, 로그인 전엔 아이디·비번, 로그인 뒤엔 저장 올리기·받기
function netRow() {
  const N = S.net || {}, msg = N.msg ? `<p class="bmsg ${N.err ? 'err' : ''}" role="status">${esc(N.msg)}</p>` : '';
  if (!online()) return '<div class="srow"><span class="lb">온라인 계정</span><span class="note small">서버 연결 준비 중 — 열리면 아이디로 로그인해 랭킹·저장 동기화</span></div>';
  const u = me();
  if (u) return `<div class="srow"><span class="lb">온라인 계정</span><b class="netid">${esc(u.name)}</b><button type="button" class="mini" data-netpush ${N.busy ? 'disabled' : ''}>저장 올리기</button><button type="button" class="mini ${N.pullArm ? 'primary' : ''}" data-netpull ${N.busy ? 'disabled' : ''}>${N.pullArm ? '한 번 더: 서버 저장으로 덮어쓰기' : '저장 받기'}</button><button type="button" class="mini" data-netout>로그아웃</button></div>${msg}`;
  return `<div class="srow netin"><span class="lb">온라인 계정</span><input id="net-id" placeholder="아이디" maxlength="12" autocomplete="username" value="${esc(N.id || '')}"><input id="net-pw" type="password" placeholder="비밀번호(6자 이상)" autocomplete="current-password"><button type="button" class="mini primary" data-netin ${N.busy ? 'disabled' : ''}>로그인</button><button type="button" class="mini" data-netup ${N.busy ? 'disabled' : ''}>가입</button></div>${msg}`;
}
// 저장 백업 칸: 내보내기(코드 + 복사) / 불러오기(붙여 넣기 + 두 번 눌러 적용)
function backupBox() {
  const B = S.backup; if (!B) return '';
  const msg = B.msg ? `<p class="bmsg ${B.err ? 'err' : ''}" role="status">${esc(B.msg)}</p>` : '';
  if (B.mode === 'export') return `<div class="backup">
    <textarea id="backup-code" readonly rows="3" data-bout>${esc(B.code)}</textarea>
    <div class="acts"><button type="button" class="mini primary" data-bcopy>코드 복사</button><span class="note small">지금까지의 동료·별 조각·기록·설정이 들어 있다 (진행 중인 판은 빠짐)</span></div>${msg}</div>`;
  return `<div class="backup">
    <textarea id="backup-in" rows="3" placeholder="여기에 저장 코드(YK…)를 붙여 넣기" data-bin>${esc(B.text || '')}</textarea>
    <div class="acts"><button type="button" class="mini ${B.arm ? 'primary' : ''}" data-bapply ${B.arm ? 'aria-pressed="true"' : ''}>${B.arm ? '한 번 더 누르면 지금 저장을 덮어쓴다' : '이 코드로 불러오기'}</button></div>${msg}</div>`;
}

// 처음 켰을 때: 짧은 첫 밤으로 하는 법을 익힌다
export function tutIntroView() {
  // 첫 화면: 큰 글 상자 + 코드로 그린 사각 탑·네모 달 대신 — 항구 배경(1막 지도 그림)에 셋이 바닥에 서고, 왼쪽에 제목과 한 줄, 글자 메뉴
  const bg = artURL('bg/map1.png'), key = artURL('title/key_px.png') || bg;
  const trio = ['brick', 'iris', 'marta'].map(k => `<img class="px" src="${battleArt(k, 'idle') || charSrc(k)}" alt="">`).join('');
  return `<div class="tutintro t2">
    ${key ? `<img class="px tbg" src="${key}" alt="" aria-hidden="true">` : ''}
    ${artURL('title/key_px.png') ? '' : `<div class="trio2">${trio}</div>`}
    <div class="tmenu">
      <h1>${artURL('ui/logo.png') ? `<img class="px tlogo" src="${artURL('ui/logo.png')}" alt="야경단">` : '<span>야</span><span>경</span><span>단</span>'}</h1>
      <button type="button" class="primary" data-tutstart>첫 밤 시작</button>
      <button type="button" data-tutskip>건너뛰기</button>
    </div>
  </div>`;
}

export function tutDoneView() {
  const won = S.G?.tutorial?.won;
  return `<div class="tutintro done">
    <div class="sky" aria-hidden="true"><span class="tower"></span><span class="moonbig"></span></div>
    <div class="tbox">
      <h1>${won ? '첫 밤을 넘겼다' : '첫 밤은 여기까지'}</h1>
      <p>${won ? '작은 보스를 쓰러뜨렸다.' : '이번엔 졌지만 하는 법은 다 봤다.'} 진짜 밤은 막 셋, 꼭대기의 새벽까지다.</p>
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
