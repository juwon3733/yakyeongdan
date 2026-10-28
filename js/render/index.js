import { S } from '../run.js';
import { topbar } from './common.js';
import { titleView } from './title.js';
import { mapView } from './map.js';
import { combatView, combatTopExtra } from './combat.js';
import { rewardView, restView, eventView, removeView, resultView } from './screens.js';
import { sync as syncSound } from '../audio.js';

const VIEWS = { map: mapView, combat: combatView, reward: rewardView, rest: restView, event: eventView, remove: removeView };

export function render(app) {
  const s = S.G ? S.G.screen : 'title';
  app.dataset.screen = s;
  if (s === 'title') app.innerHTML = titleView();
  else if (s === 'result') app.innerHTML = resultView();
  else app.innerHTML = topbar(s === 'combat' ? combatTopExtra() : '') + `<div class="body">${VIEWS[s]()}</div>`;
  syncSound();
}
