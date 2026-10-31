// 다음에 그릴 그림 묶음을 고른다. GPT 이미지 에이전트가 "알아서 다음 거" 할 때 쓴다.
//   node tools/next-batch.mjs          → 다음 묶음 id와 아직 없는 그림 목록
//   node tools/next-batch.mjs --all    → 남은 묶음 전체 순서
// 이미 main에 있는 그림(assets/…)은 건너뛰고, 원격에 올라가 검수 대기 중인 assets/<묶음>-* 브랜치가 있으면 그 묶음도 건너뛴다.
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const P = JSON.parse(readFileSync(new URL('../assets/prompts.json', import.meta.url)));
const ROOT = new URL('../assets/', import.meta.url);
const has = (f) => existsSync(new URL(f, ROOT));

// 그리는 순서(사용자가 정함: ★5부터). 앞 묶음이 있어야 그릴 수 있는 묶음은 need에 적는다.
const STAR5 = ['estelle', 'akane', 'sion', 'lunaria', 'eleonore', 'nerea'];   // 시즌 동료 에스텔이 맨 앞(11/1 시즌 시작 전에 그림이 필요)
const FIRST = ['iris', 'brick', 'marta'];
const REST = ['noel', 'raven', 'mimimomo', 'sebas', 'mariana', 'tomori', 'sigrun', 'zeno', 'bertha', 'finn', 'laila', 'dora', 'gordon', 'fukuro'];
const ORDER = [
  // 퀄리티 계획(docs/QUALITY_PLAN.md): 늘 보이는 카드 그림 → UI 키트·로고 → 타이틀부터
  'char-estelle', 'pose-estelle', 'cg-star5',   // 시즌 1 동료(11/1 시작) 먼저 — CG는 소환 등장에 쓴다
  // 본편 2·3장(js/data/chapters.js): 적 → 보스 → 배경 (그림 전엔 임시 도트·1장 배경)
  'enemy-ch2_act1', 'enemy-ch2_act2', 'enemy-ch2_act3', 'boss-floodgate', 'boss-clockknight', 'boss-bellkeeper', 'bg-ch2',
  'enemy-ch3_act1', 'enemy-ch3_act2', 'enemy-ch3_act3', 'boss-frostkeeper', 'boss-warden', 'boss-firstnight', 'bg-ch3',
  ...[...STAR5, ...FIRST, ...REST].map((id) => `cards-${id}`), 'ui-kit', 'logo', 'title', 'boss-star_king',
  'tower',       // 지도 탑 — 지도 화면이 코드로 칠한 돌벽 대신 그림 탑이 된다
  'title',       // 타이틀 도트 키아트(key_px) — 첫 화면의 매끈한 애니 그림이 가장 AI 티가 난다
  'fx-common',   // 공용 타격 이펙트 — 모든 공격이 바로 화려해진다
  ...STAR5.flatMap((id) => [`char-${id}`, `pose-${id}`, `fx-${id}`, `cards-${id}`, `aura-${id}`, `pet-${id}`]),   // 몸·이펙트·오라·동반자는 층마다 따로(docs/BATTLE_PLAN.md)   // 전투 스프라이트·이펙트는 서 있는 그림 바로 뒤에
  'cg-star5',
  ...FIRST.map((id) => `char-${id}`),
  'bg',
  'enemy-act1', 'boss-lighthouse', 'boss-fog_queen',
  'enemy-act2', 'boss-cloud_captain', 'boss-storm_whale', 'enemy-act3', 'boss-dawn',
  'summon', 'icons',
  ...REST.map((id) => `char-${id}`),
  ...[...FIRST, ...STAR5, ...REST].map((id) => `cards-${id}`),
  ...[...FIRST, ...REST].flatMap((id) => [`pose-${id}`, `fx-${id}`]),
  'proj', 'foepose-act1', 'foepose-act2', 'foepose-act3',
  'duo',
  'icons-sig', 'app',
];
for (const b of P.batches) if (!ORDER.includes(b.id) && !b.id.startsWith('style') && !b.id.startsWith('skin-')) ORDER.push(b.id);
for (const b of P.batches) if (b.id.startsWith('skin-')) ORDER.push(b.id);   // 스킨은 맨 뒤

// 다시 그릴 묶음(assets/redraw.json: { 묶음 id: 이 시각(월일시분) 이후 브랜치만 인정 }): 그림이 있어도 전부 남은 것으로 친다.
//   Claude가 새 그림을 병합하면 그 묶음을 redraw.json에서 뺀다
let REDRAW = {};
try { REDRAW = JSON.parse(readFileSync(new URL('../assets/redraw.json', import.meta.url), 'utf8')); } catch { /* 없음 */ }
// 다시 그리기(redraw.json)는 그림이 이미 있으니 맨 뒤로(사용자: 저화질이라도 있으니 다른 것부터)
{ const late = [...new Set(ORDER.filter((id) => REDRAW[id]))]; for (let k = ORDER.length - 1; k >= 0; k--) if (REDRAW[ORDER[k]]) ORDER.splice(k, 1); ORDER.push(...late); }
const items = (id) => P.items.filter((i) => i.batch === id);
const missing = (id) => REDRAW[id] ? items(id) : items(id).filter((i) => !has(i.file));
// 첨부해야 하는 그림(reference_images)이 아직 없으면 그 묶음은 못 그린다(같은 묶음 안에서 만들 것은 빼고).
const blocked = (id) => {
  const own = new Set(items(id).map((i) => i.file));
  const need = new Set(missing(id).flatMap((i) => i.reference_images || []).filter((f) => !own.has(f) && !has(f)));
  return [...need];
};

let pending = [];
try {
  pending = execSync('git ls-remote --heads origin "assets/*"', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split('\n').map((l) => l.split('refs/heads/assets/')[1]).filter(Boolean);
} catch { /* 원격을 못 보면 대기 중 브랜치는 모름 */ }
// 프롬프트를 바꿔 다시 그려야 하는 묶음: 이 시각(월일시분) 이전 브랜치는 검수 대기로 치지 않는다(옛 그림은 안 씀)
const REDO_AFTER = { 'boss-bellkeeper': '10311330', 'aura-akane': '10300110', 'aura-sion': '10300110', 'aura-lunaria': '10300110', 'aura-eleonore': '10300110', 'aura-nerea': '10300110' };
const stampOf = (b) => (/-(\d{4})-(\d{4})$/.exec(b) || []).slice(1).join('');
const inReview = (id) => pending.some((b) => (b === id || b.startsWith(id + '-')) && !((REDO_AFTER[id] || REDRAW[id]) && stampOf(b) && stampOf(b) <= (REDO_AFTER[id] || REDRAW[id])));

const todo = ORDER.filter((id) => P.batches.some((b) => b.id === id) && missing(id).length);
if (process.argv.includes('--all')) {
  for (const id of todo) console.log(`${id}\t남은 ${missing(id).length}장${inReview(id) ? '\t(검수 대기 브랜치 있음)' : ''}${blocked(id).length ? `\t(먼저 필요: ${blocked(id).join(', ')})` : ''}`);
  process.exit(0);
}
const next = todo.find((id) => !inReview(id) && !blocked(id).length);
if (!next) { console.log(todo.length ? '지금 그릴 수 있는 묶음 없음(검수 대기 중이거나 먼저 필요한 그림이 아직 main에 없음).' : '모든 그림 완료.'); process.exit(0); }
console.log(`다음 묶음: ${next}`);
console.log(`그릴 그림 ${missing(next).length}장: ${missing(next).map((i) => i.id).join(', ')}`);
const done = items(next).filter((i) => has(i.file));
// 그림 도구는 한 번에 5장까지만 첨부된다: 그림체 기준 1장 + reference_images 먼저, 남는 칸만큼 「이미 있음」을 기준으로
const MAX_REF = 5;
const room = Math.max(0, MAX_REF - 1 - Math.max(0, ...missing(next).map((i) => (i.reference_images || []).length)));
if (done.length) console.log(`이미 있음(다시 만들지 말 것): ${done.map((i) => i.file).join(', ')}`);
if (done.length && room) console.log(`그중 기준으로 첨부할 것(${room}장까지): ${done.slice(0, room).map((i) => i.file).join(', ')}`);
console.log(`첨부(그림마다 최대 ${MAX_REF}장): 그 그림의 reference_images 전부(그림체 기준 그림이 이미 들어 있다 — 동료는 style/akane_c.png, 적·보스·배경은 게임 그림)${done.length && room ? ' + 위 기준' : ''}. 5장을 넘기지 말 것.`);
