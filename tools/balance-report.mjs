// 밸런스 보고서: tools/sim.mjs를 돌려 docs/BALANCE.md 표를 만든다 (수치는 고치지 않고 보고만).
//   node tools/balance-report.mjs           동료마다 약 400판 (전체 약 3067판) · 시즌 보스 난이도마다 400판
//   node tools/balance-report.mjs --quick   동료마다 약 100판
// 본판은 끝없는 탑 없이(--no-endless) 돌린다. 별자리는 0(sim 기본).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTERS } from '../js/data/characters.js';
import { DUOS } from '../js/data/cards.js';

const args = process.argv.slice(2);
const QUICK = args.includes('--quick');
const N = QUICK ? 100 : 400;
const SIM = fileURLToPath(new URL('./sim.mjs', import.meta.url));
const DOC = fileURLToPath(new URL('../docs/BALANCE.md', import.meta.url));
const IDS = Object.keys(CHARACTERS);
const name = id => CHARACTERS[id].name;
const pct = x => Number.isFinite(x) ? (x * 100).toFixed(1) + '%' : '-';
const sim = a => execFileSync(process.execPath, [SIM, ...a], { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'inherit'] });

const t0 = Date.now();
// 1) 본판: 파티 3명이 조합을 돌아가므로 동료마다 약 N판이 되게 전체 판 수를 잡는다
const runs = Math.ceil(N * IDS.length / 3);
const dir = mkdtempSync(join(tmpdir(), 'balance-'));
const jf = join(dir, 'sim.json');
process.stderr.write(`본판 ${runs}판…\n`);
sim(['--runs', String(runs), '--no-endless', '--json', jf]);
const R = JSON.parse(readFileSync(jf, 'utf8'));
rmSync(dir, { recursive: true, force: true });

// 2) 시즌 보스: 무작위 파티 / 처음 동료
const season = party => {
  const out = sim(['--season', '--n', String(N), ...(party ? ['--party', party] : [])]);
  return [...out.matchAll(/시즌 보스 (\S+): 이김 (\d+)% · 평균 ([\d.]+)턴/g)].map(m => ({ tier: m[1], win: m[2] + '%', turns: m[3] }));
};
process.stderr.write('시즌 보스…\n');
const sRand = season(null), sStart = season('iris,brick,marta');
const secs = ((Date.now() - t0) / 1000).toFixed(0);

// ---------- 표 ----------
const L = [];
L.push('<!-- 자동 생성: node tools/balance-report.mjs (npm run balance). 손으로 고치지 말 것 -->');
L.push('# 밸런스 보고서');
L.push('');
L.push(`tools/sim.mjs 봇 결과. 본판 ${R.runs}판(무작위 파티, 끝없는 탑 제외, 별자리 0), 시즌 보스 난이도마다 ${N}판${QUICK ? ' (--quick)' : ''}. 걸린 시간 ${secs}초.`);
L.push(`전체 「새벽」 격파 ${pct(R.winRate)}.`);
L.push('');

// 동료별
const rows = IDS.map(id => ({ id, ...R.chars[id] })).sort((a, b) => b.win - a.win);
const mean = rows.reduce((t, r) => t + r.win, 0) / rows.length;
L.push('## 동료별 (그 동료가 들어간 파티의 「새벽」 격파율)');
L.push('');
L.push(`평균 ${pct(mean)}. 평균 ±10%p 밖은 **굵게**.`);
L.push('');
L.push('| 순위 | 동료 | 성급 | 판 | 격파율 | 평균과 차이 |');
L.push('|---|---|---|---|---|---|');
rows.forEach((r, i) => {
  const d = (r.win - mean) * 100, out = Math.abs(d) > 10, b = s => out ? `**${s}**` : s;
  L.push(`| ${i + 1} | ${b(name(r.id))} | ★${CHARACTERS[r.id].rarity} | ${r.runs} | ${b(pct(r.win))} | ${b((d >= 0 ? '+' : '') + d.toFixed(1) + '%p')} |`);
});
L.push('');

// ★5와 ★3·★4만
L.push('## ★5 (별자리 0)와 ★3·★4만 파티');
L.push('');
L.push('| 구분 | 판 | 격파율 |');
L.push('|---|---|---|');
for (const r of rows.filter(r => CHARACTERS[r.id].rarity === 5)) L.push(`| ★5 ${name(r.id)} 포함 | ${r.runs} | ${pct(r.win)} |`);
const t5 = R.tiers['★5 포함'], t34 = R.tiers['★5 없음'];
if (t5) L.push(`| ★5 한 명 이상 | ${t5.runs} | ${pct(t5.win)} |`);
if (t34) L.push(`| **★3·★4만** | ${t34.runs} | **${pct(t34.win)}** |`);
L.push('');

// 시즌 보스
L.push('## 시즌 보스 난이도');
L.push('');
L.push('| 난이도 | 무작위 파티 | 처음 동료 (아이리스·브릭·마르타) |');
L.push('|---|---|---|');
sRand.forEach((s, i) => L.push(`| ${s.tier} | ${s.win} (평균 ${s.turns}턴) | ${sStart[i] ? `${sStart[i].win} (평균 ${sStart[i].turns}턴)` : '-'} |`));
L.push('');

// 듀오
const played = R.stats.duoPlayed || {}, made = R.stats.duoMade || {};
const keys = Object.keys(DUOS), zero = keys.filter(k => !played[k]);
L.push('## 쓰이지 않은 인연 듀오');
L.push('');
L.push(`${keys.length}쌍 중 쓴 횟수 0: ${zero.length}쌍.`);
L.push('');
if (zero.length) {
  L.push('| 듀오 | 짝 | 생긴 횟수 |');
  L.push('|---|---|---|');
  for (const k of zero) { const [a, b] = k.split('+'); L.push(`| ${DUOS[k].name} | ${name(a)}·${name(b)} | ${made[k] || 0} |`); }
  L.push('');
}

writeFileSync(DOC, L.join('\n'));
console.log(L.join('\n'));
