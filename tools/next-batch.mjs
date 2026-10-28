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
const STAR5 = ['akane', 'sion', 'lunaria', 'eleonore', 'nerea'];
const FIRST = ['iris', 'brick', 'marta'];
const REST = ['noel', 'raven', 'mimimomo', 'sebas', 'mariana', 'tomori', 'sigrun', 'zeno', 'bertha', 'finn', 'laila', 'dora', 'gordon', 'fukuro'];
const ORDER = [
  'style2-akane', // 그림체 2차 시안(AI 티 줄이기) — 고르기 전엔 다른 묶음보다 먼저
  ...STAR5.map((id) => `char-${id}`),
  'cg-star5',
  ...FIRST.map((id) => `char-${id}`),
  'bg',
  'enemy-act1', 'boss-lighthouse', 'boss-fog_queen',
  'title',
  'enemy-act2', 'boss-cloud_captain', 'boss-storm_whale', 'enemy-act3', 'boss-dawn',
  'summon', 'icons',
  ...REST.map((id) => `char-${id}`),
  'duo',
  ...[...STAR5, ...FIRST, ...REST].map((id) => `cards-${id}`),
  'cards-duo-1', 'cards-duo-2', 'cards-duo-3', 'cards-duo-4', 'cards-duo-5',
  'icons-sig', 'app',
];
for (const b of P.batches) if (!ORDER.includes(b.id) && !b.id.startsWith('style')) ORDER.push(b.id);

const items = (id) => P.items.filter((i) => i.batch === id);
const missing = (id) => items(id).filter((i) => !has(i.file));
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
const inReview = (id) => pending.some((b) => b === id || b.startsWith(id + '-'));

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
if (done.length) console.log(`이미 있음(다시 만들지 말고 기준으로 첨부): ${done.map((i) => i.file).join(', ')}`);
