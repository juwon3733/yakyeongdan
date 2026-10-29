import { artURL } from '../art.js';
import { S } from '../run.js';
import { topbar } from './common.js';
import { titleView, partyView } from './title.js';
import { baseView, summonView, revealView, pick5View, oddsView, exchangeView, matesView, codexView, recordsView } from './base.js';
import { episodesView, epView } from './episodes.js';
import { mapView } from './map.js';
import { combatView, combatTopExtra } from './combat.js';
import { rewardView, restView, eventView, removeView, upgradeView, resultView, shopView, dupeView, bossRelicView, moonView } from './screens.js';
import { sync as syncSound } from '../audio.js';
import { tutIntroView, tutDoneView, tutBar } from './settings.js';
import { dailyView } from './daily.js';
import { P, achCheck, achToasts } from '../meta.js';
import { ROSTER } from '../data/roster.js';

// 판 안의 화면 (위 띠가 있는 것)
const VIEWS = { map: mapView, combat: combatView, reward: rewardView, rest: restView, event: eventView, remove: removeView, upgrade: upgradeView,
  shop: shopView, dupe: dupeView, bossrelic: bossRelicView };
// 판 밖의 화면
const META = { title: titleView, party: partyView, base: baseView, summon: summonView, reveal: revealView, episodes: episodesView, ep: epView,
  pick5: pick5View, odds: oddsView, exchange: exchangeView, mates: matesView, codex: codexView, records: recordsView, tutintro: tutIntroView, daily: dailyView };

function bgImage(G, scr) {
  const run = G && S.view === 'run' && !G.tutorial;
  const f = run ? (scr === 'combat' || scr === 'reward' ? `bg/act${G.act}.png` : scr === 'result' ? null : `bg/map${G.act}.png`)
    : scr === 'base' || scr === 'party' || scr === 'mates' ? 'bg/hq.png' : scr === 'summon' || scr === 'reveal' || scr === 'pick5' ? 'summon/sky.png' : null;
  const u = f && artURL(f);
  return u ? `url("${new URL(u, location.href).href}")` : 'none';   // CSS 변수의 주소는 CSS 파일 기준이라 절대 주소로
}
export function render(app) {
  const G = S.G;
  app.classList.toggle('tut', !!(G?.tutorial && S.view === 'run'));
  if (!G || S.view !== 'run') {
    const v = META[S.view] ? S.view : 'title';
    app.dataset.screen = v;
    app.innerHTML = META[v]();
  } else {
    // 달 조각을 얻으면 지도·보상·야시장 대신 달 고르기부터
    const s = G.moonPick && G.screen !== 'combat' && G.screen !== 'result' ? 'moon' : G.screen;
    app.dataset.screen = s;
    if (s === 'result') app.innerHTML = resultView();
    else if (s === 'tutdone') app.innerHTML = tutDoneView();
    else app.innerHTML = topbar(s === 'combat' ? combatTopExtra() : '') + tutBar() + `<div class="body">${s === 'moon' ? moonView() : VIEWS[s]()}</div>`;
  }
  // 배경 그림(bg/…): 전투·보상은 그 막 전투 배경, 지도·상점·휴식 등은 그 막 지도 배경, 본부·파티는 본부, 소환은 소환 하늘. 그림이 없으면 원래 색
  app.style.setProperty('--bgimg', bgImage(G, app.dataset.screen));
  // 카드 뒷면(숙련도 4): 보상 뒤집기 뒷면 색
  if (P.cardBack && ROSTER[P.cardBack]) app.style.setProperty('--back-c', ROSTER[P.cardBack].col); else app.style.removeProperty('--back-c');
  // 판 밖 화면에서는 수집 업적도 살핀다(판 업적은 결과 화면 grantRun이 살핌)
  if (!G || S.view !== 'run') achCheck();
  showAchToasts();
  syncSound();
}

// 업적 달성 띠: 화면 오른쪽 위에 3초. 한꺼번에 많이 달성하면 둘만 보이고 나머지는 「외 n개」 한 줄로.
function showAchToasts() {
  if (!achToasts.length) return;
  // 결과 화면은 본문에 이번 판 업적을 적어 두므로 띠를 또 띄우면 같은 내용이 본문을 가린다
  if (S.view === 'run' && S.G?.screen === 'result') { achToasts.length = 0; return; }
  const list = achToasts.splice(0), shown = list.length > 3 ? list.slice(0, 2) : list, rest = list.slice(shown.length);
  let box = document.getElementById('achbox');
  if (!box) { box = document.createElement('div'); box.id = 'achbox'; box.setAttribute('aria-live', 'polite'); (document.getElementById('stage') || document.body).appendChild(box); }
  const add = (name, text, r) => {
    const el = document.createElement('div');
    el.className = 'achtoast';
    el.innerHTML = `<span class="ak">업적</span><b></b><small></small><i>별 조각 +${r}</i>`;
    el.querySelector('b').textContent = name; el.querySelector('small').textContent = text;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3400);
  };
  for (const a of shown) add(a.name, a.text, a.r);
  if (rest.length) add(`외 ${rest.length}개 달성`, rest.map(a => a.name).join(' · '), rest.reduce((t, a) => t + a.r, 0));
}
