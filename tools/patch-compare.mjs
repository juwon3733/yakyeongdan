// patch 전후 승률 비교: 같은 시드로 tools/sim.mjs를 patch 없이/있이 돌려 나란히 출력한다. js/data는 안 고친다.
//   node tools/patch-compare.mjs tools/patches/starter_buff.json
//   node tools/patch-compare.mjs <patch.json> --runs 2000 --seed 1 --trio 300
// 표:
//   처음 동료 격파율   = 처음 동료(아이리스·브릭·마르타) 셋 파티만 따로 --trio 판
//   처음 동료가 낀 판  = 무작위 파티 중 셋 중 하나라도 든 파티
//   바뀐 동료가 든 파티 = patch의 chars + 바뀐 카드 주인(ch) 중 하나라도 든 파티
//   전체 격파율        = 무작위 파티 전부
import { spawn } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTERS } from '../js/data/characters.js';
import { CARDS } from '../js/data/cards.js';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const PATCH = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!PATCH) { console.error('쓰는 법: node tools/patch-compare.mjs <patch.json> [--runs 1000] [--seed 1] [--trio 200]'); process.exit(1); }
const RUNS = +opt('--runs', 1000), SEED = +opt('--seed', 1), TRIO = +opt('--trio', 200);
const STARTERS = ['iris', 'brick', 'marta'];
const SIM = join(dirname(fileURLToPath(import.meta.url)), 'sim.mjs');

const P = JSON.parse(readFileSync(PATCH, 'utf8'));
const changed = new Set(Object.keys(P.chars || {}));
for (const id of Object.keys(P.cards || {})) { const ch = CARDS[id]?.ch; if (ch && CHARACTERS[ch]) changed.add(ch); }

const dir = mkdtempSync(join(tmpdir(), 'patchcmp-'));
function sim(name, extra) {
  const out = join(dir, name + '.json');
  const argv = [SIM, '--quick', '--no-endless', '--seed', String(SEED), '--json', out, ...extra];
  return new Promise((ok, bad) => {
    const p = spawn(process.execPath, argv, { stdio: ['ignore', 'ignore', 'inherit'] });
    p.on('exit', code => code ? bad(new Error(`sim ${name} 실패 (${code})`)) : ok(JSON.parse(readFileSync(out, 'utf8'))));
  });
}
const t0 = Date.now();
const [base, pat, baseTrio, patTrio] = await Promise.all([
  sim('base', ['--runs', String(RUNS)]),
  sim('patch', ['--runs', String(RUNS), '--patch', PATCH]),
  sim('base_trio', ['--runs', String(TRIO), '--party', STARTERS.join(',')]),
  sim('patch_trio', ['--runs', String(TRIO), '--party', STARTERS.join(','), '--patch', PATCH]),
]);
rmSync(dir, { recursive: true, force: true });

const rate = (o, f = () => true) => { const rs = o.parties.filter(([p]) => f(p.split(','))); return [rs.filter(r => r[1]).length, rs.length]; };
const pct = ([w, n]) => n ? `${(100 * w / n).toFixed(1)}% (${w}/${n})` : '-';
const diff = (a, b) => { if (!a[1] || !b[1]) return '-'; const d = 100 * (b[0] / b[1] - a[0] / a[1]); return `${d >= 0 ? '+' : ''}${d.toFixed(1)}%p`; };
const has = list => p => p.some(id => list.includes(id));
const rows = [
  ['처음 동료 격파율 (아이리스·브릭·마르타 파티)', rate(baseTrio), rate(patTrio)],
  ['처음 동료가 낀 파티 격파율', rate(base, has(STARTERS)), rate(pat, has(STARTERS))],
  [`바뀐 동료가 든 파티 격파율 (${[...changed].map(id => CHARACTERS[id].name).join('·') || '없음'})`, rate(base, has([...changed])), rate(pat, has([...changed]))],
  ['바뀐 동료가 없는 파티 격파율', rate(base, p => !has([...changed])(p)), rate(pat, p => !has([...changed])(p))],
  ['전체 격파율', rate(base), rate(pat)],
];
console.log(`patch 비교: ${PATCH} · 시드 ${SEED} · 무작위 파티 ${RUNS}판 · 처음 동료 파티 ${TRIO}판 · ${((Date.now() - t0) / 1000).toFixed(0)}초`);
console.log('');
console.log('| 항목 | patch 없음 | patch 있음 | 차이 |');
console.log('|---|---|---|---|');
for (const [k, a, b] of rows) console.log(`| ${k} | ${pct(a)} | ${pct(b)} | ${diff(a, b)} |`);
