// 시즌 화면 (js/season.js): 시즌 이름·남은 날, 시즌 보스(난이도 셋·기록·첫 클리어 보상), 시즌 규칙, 무료 시즌 패스, 랭킹(온라인 연결 뒤)
import { S } from '../run.js';
import { P } from '../meta.js';
import { seasonNow, seasonRec, passLevel, tierOpen } from '../season.js';
import { PASS } from '../data/season.js';
import { FOE } from '../data/enemies.js';
import { foeArt, bossCutin, artURL } from '../art.js';
import { ROSTER } from '../data/roster.js';
import { esc, charSrc } from './common.js';
import { sprite } from './sprites.js';
import { FOE_PAL } from '../data/enemies.js';

export function seasonView() {
  const s = seasonNow();
  const head = `<div class="bhead"><button type="button" class="mini" data-view="base">‹ 본부</button><span class="wallet"><b>별 조각 ${P.shards}</b></span></div>`;
  if (!s) return `<div class="seasonscr">${head}<h2>시즌</h2><p class="note">다음 시즌을 준비하고 있다.</p></div>`;
  if (!s.open) return `<div class="seasonscr">${head}<div class="sshead" style="--c:${s.col}"><small>시즌 ${s.no}</small><b>${esc(s.name)}</b><span>${s.inDays}일 뒤 시작</span></div><p class="note">${esc(s.tagline)}</p></div>`;
  const rec = seasonRec(s.id), boss = FOE[s.boss], lv = passLevel(rec), into = (rec.xp || 0) % PASS.per;
  const art = bossCutin(s.boss) || foeArt({ key: s.boss }) || sprite(FOE_PAL[boss.pal], true, true);
  const out = S.seasonOut;
  const result = out ? `<div class="sres ${out.won ? 'won' : 'lost'}"><b>${out.won ? `${out.tier} 격파 · ${out.turns}턴` : `${out.tier} 실패`}</b>${out.first ? `<span>첫 클리어 별 조각 +${out.first}</span>` : ''}${out.best ? '<span>최고 기록!</span>' : ''}</div>` : '';
  const tiers = s.tiers.map((t, i) => {
    const open = tierOpen(rec, i), clear = !!rec.clear[t.id], best = rec.best[t.id];
    return `<button type="button" class="stier ${clear ? 'clear' : ''}" ${open ? `data-view="party" data-mode="season" data-tier="${i}"` : 'disabled'}>
      <b>${t.name}</b><small>${open ? (best != null ? `최고 ${best}턴` : `첫 클리어 +${t.first}`) : '앞 단계를 깨면'}</small></button>`;
  }).join('');
  const can = lv > 0 && Array.from({ length: lv }, (_, k) => k + 1).some(n => !rec.got.includes(n));
  const tierN = Math.min(PASS.tiers, lv + 1), maxed = lv >= PASS.tiers;
  const cells = Array.from({ length: PASS.tiers }, (_, k) => k + 1).map(n => {
    const r = PASS.reward(n), got = rec.got.includes(n), ready = n <= lv && !got;
    const st = got ? 'done' : ready ? 'ready' : n === lv + 1 ? 'next' : 'lock';
    const sz = n % 10 === 0 ? 'big gold' : n % 5 === 0 ? 'big' : '';
    return `<li class="spc ${st} ${sz}" title="${n}단계 · 별 조각 ${r.shards}${r.title ? ` · 칭호 「${esc(r.title)}」` : ''}"><small>${n}</small><b>✦${r.shards}</b>${r.title ? '<em>칭호</em>' : ''}${got ? '<i class="stamp">✓</i>' : ''}</li>`;
  }).join('');
  return `<div class="seasonscr" style="--c:${s.col}">
    ${head}
    <div class="sshead"><small>시즌 ${s.no} · ${s.left}일 남음</small><b>${esc(s.name)}</b><span>${esc(s.tagline)}</span></div>
    <div class="sbody">
      <div class="sboss"><img class="art" src="${art}" alt=""><div class="sbtx"><small>시즌 보스</small><b>${esc(boss.name)}</b></div></div>
      <div class="sside">
        ${result}
        <div class="stiers">${tiers}</div>
        <div class="srule"><b>시즌 규칙 · ${esc(s.rule.name)}</b> ${esc(s.rule.text)} <small>(밤 오르기·매일의 밤에도)</small></div>
        <div class="spass"><div class="sph"><b>시즌 패스</b><span>${lv}/${PASS.tiers}단계</span><small>${maxed ? '모두 달성' : `${tierN}단계까지 시즌 별 ${PASS.per - into}`}</small></div>
          <div class="spxp"><i style="width:${maxed ? 100 : Math.round(into / PASS.per * 100)}%"></i><small>${maxed ? 'MAX' : `${into}/${PASS.per}`}</small></div>
          <ol class="sprow">${cells}</ol>
          <button type="button" class="${can ? 'primary' : ''}" data-claimpass ${can ? '' : 'disabled'}>보상 받기</button>${S.seasonMsg ? `<small class="smsg">${esc(S.seasonMsg)}</small>` : ''}</div>
        <button type="button" class="srank" data-view="ranking"><b>시즌 랭킹</b> <small>매일의 밤·시즌 보스·끝없는 탑·밤 오르기 ›</small></button>
      </div>
    </div>
  </div>`;
}

// 시즌 첫 소개(시즌마다 한 번, 본부에서): 시즌 동료·시즌 보스·규칙. P.seasonIntro = 본 시즌 id
export function seasonIntroModal() {
  const s = seasonNow(); if (!s?.open) return '';
  const ch = ROSTER[s.chara], boss = FOE[s.boss];
  const bart = bossCutin(s.boss) || foeArt({ key: s.boss }) || sprite(FOE_PAL[boss.pal], true, true);
  const cg = artURL(`cg/star5_${s.chara}.png`), cart = cg || charSrc(s.chara);
  return `<div class="box sintro" role="dialog" aria-label="시즌 ${s.no} 시작" style="--c:${s.col}">
    <div class="sih"><small>시즌 ${s.no} 시작 · ${s.left}일 남음</small><b>${esc(s.name)}</b><span>${esc(s.tagline)}</span></div>
    <div class="sipan">
      <div class="sic cha ${cg ? 'cg' : ''}" style="--cc:${ch.col}"><img class="art" src="${cart}" alt=""><div class="sit"><small>시즌 동료 · 픽업 소환</small><b>${esc(ch.name)} <i class="stars">${'★'.repeat(ch.rarity)}</i></b><span>${esc(ch.role)}</span></div></div>
      <div class="sic boss"><img class="art" src="${bart}" alt=""><div class="sit"><small>시즌 보스</small><b>${esc(boss.name)}</b><span>일반 · 어려움 · 악몽</span></div></div>
    </div>
    <p class="sirule"><b>시즌 규칙 「${esc(s.rule.name)}」</b> ${esc(s.rule.text)}</p>
    <div class="sibtn"><button type="button" class="primary" data-sintro="season">시즌 보기</button><button type="button" data-sintro="summon">소환하러</button><button type="button" data-close>닫기</button></div>
  </div>`;
}

// 그린 뒤: 시즌 패스 줄을 받을 칸(없으면 다음 단계)이 가운데 오게 스크롤
export function seasonScroll(root) {
  const row = root.querySelector('.sprow'); if (!row) return;
  const c = row.querySelector('.spc.ready') || row.querySelector('.spc.next') || row.lastElementChild;
  if (c) row.scrollLeft = c.offsetLeft - (row.clientWidth - c.offsetWidth) / 2;
}
