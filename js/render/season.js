// 시즌 화면 (js/season.js): 시즌 이름·남은 날, 시즌 보스(난이도 셋·기록·첫 클리어 보상), 시즌 규칙, 무료 시즌 패스, 랭킹(온라인 연결 뒤)
import { S } from '../run.js';
import { P } from '../meta.js';
import { seasonNow, seasonRec, passLevel, tierOpen } from '../season.js';
import { PASS } from '../data/season.js';
import { FOE } from '../data/enemies.js';
import { foeArt, bossCutin } from '../art.js';
import { esc } from './common.js';
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
  const marks = Array.from({ length: PASS.tiers }, (_, k) => k + 1).map(n => `<i class="${n <= lv ? 'on' : ''} ${rec.got.includes(n) ? 'got' : ''} ${n % 5 ? '' : 'big'}"></i>`).join('');
  return `<div class="seasonscr" style="--c:${s.col}">
    ${head}
    <div class="sshead"><small>시즌 ${s.no} · ${s.left}일 남음</small><b>${esc(s.name)}</b><span>${esc(s.tagline)}</span></div>
    <div class="sbody">
      <div class="sboss"><img class="art" src="${art}" alt=""><div class="sbtx"><small>시즌 보스</small><b>${esc(boss.name)}</b></div></div>
      <div class="sside">
        ${result}
        <div class="stiers">${tiers}</div>
        <div class="srule"><b>시즌 규칙 「${esc(s.rule.name)}」</b> ${esc(s.rule.text)} <small>(밤 오르기·매일의 밤에도)</small></div>
        <div class="spass"><div class="sph"><b>시즌 패스</b><span>${lv}/${PASS.tiers}단계</span><small>${into}/${PASS.per}</small></div>
          <div class="spbar">${marks}</div>
          <button type="button" class="${can ? 'primary' : ''}" data-claimpass ${can ? '' : 'disabled'}>보상 받기</button>${S.seasonMsg ? `<small class="smsg">${esc(S.seasonMsg)}</small>` : ''}</div>
        <div class="srank"><b>시즌 랭킹</b> <small>온라인 연결 뒤 열린다 (밤 오르기·끝없는 탑·시즌 보스·매일의 밤)</small></div>
      </div>
    </div>
  </div>`;
}
