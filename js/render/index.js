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

// 판 안의 화면 (위 띠가 있는 것)
const VIEWS = { map: mapView, combat: combatView, reward: rewardView, rest: restView, event: eventView, remove: removeView, upgrade: upgradeView,
  shop: shopView, dupe: dupeView, bossrelic: bossRelicView };
// 판 밖의 화면
const META = { title: titleView, party: partyView, base: baseView, summon: summonView, reveal: revealView, episodes: episodesView, ep: epView,
  pick5: pick5View, odds: oddsView, exchange: exchangeView, mates: matesView, codex: codexView, records: recordsView, tutintro: tutIntroView };

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
  syncSound();
}
