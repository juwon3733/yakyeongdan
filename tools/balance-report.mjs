// 밸런스 보고서: tools/sim.mjs를 돌려 docs/BALANCE.md 표를 만든다 (수치는 고치지 않고 보고만).
//   node tools/balance-report.mjs           동료마다 약 400판 (전체 약 3067판) · 시즌 보스 난이도마다 400판
//   node tools/balance-report.mjs --quick   동료마다 약 100판
// 처음 동료(아이리스·브릭·마르타) 고정 파티 본판도 400판(--quick 100판) 따로 돌린다.
// 본판은 끝없는 탑 없이(--no-endless) 돌린다. 별자리는 0(sim 기본).
// 본편 장: 장 1·2·3 × (키우기 전 / 레벨 10 / 레벨 20 / 레벨 20 + 별자리 6) 무작위 파티 300판(--quick 100판)씩.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTERS } from '../js/data/characters.js';
import { DUOS, cardData } from '../js/data/cards.js';
import { CHAPTERS } from '../js/data/chapters.js';
import { FOE } from '../js/data/enemies.js';

const args = process.argv.slice(2);
const QUICK = args.includes('--quick');
const N = QUICK ? 100 : 400;
const SIM = fileURLToPath(new URL('./sim.mjs', import.meta.url));
const DOC = fileURLToPath(new URL('../docs/BALANCE.md', import.meta.url));
const IDS = Object.keys(CHARACTERS);
const STARTERS = 'iris,brick,marta';
const MIN_PLAYS = 30;   // 카드별 표: 쓴 횟수가 이보다 적은 카드는 뺀다
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
// 처음 동료 셋 파티 본판 (★3·★4만으로 깰 수 있는지 기준선)
process.stderr.write(`처음 동료 본판 ${N}판…\n`);
const jf2 = join(dir, 'start.json');
sim(['--runs', String(N), '--no-endless', '--party', STARTERS, '--json', jf2]);
const RS = JSON.parse(readFileSync(jf2, 'utf8'));
// 본편 장: 장 × 키운 정도마다 마지막 보스 격파율과 어디서 졌나
const CH_N = QUICK ? 100 : 300;
const GROWS = [
  { key: 'base', label: '키우기 전', a: [] },
  { key: 'lv10', label: '레벨 10', a: ['--grow', '10'] },
  { key: 'lv20', label: '레벨 20', a: ['--grow', '20'] },
  { key: 'lv20s6', label: '레벨 20 + 별자리 6', a: ['--grow', '20', '--star', '6'] },
];
// 목표 (수치 고칠 때 기준): [장, 키운 정도, 하한, 상한]
const CH_GOALS = [[1, 'base', 0.30, 0.40], [2, 'lv10', 0.40, 0.50], [3, 'lv20', 0.35, 0.45]];
const CH = {};
for (const ch of [1, 2, 3]) for (const g of GROWS) {
  process.stderr.write(`${ch}장 ${g.label} ${CH_N}판…
`);
  const f = join(dir, `ch${ch}_${g.key}.json`);
  sim(['--runs', String(CH_N), '--no-endless', '--chapter', String(ch), ...g.a, '--json', f]);
  const j = JSON.parse(readFileSync(f, 'utf8'));
  (CH[ch] ||= {})[g.key] = { runs: j.runs, win: j.winRate, deathAt: j.stats.deathAt || {} };
}
rmSync(dir, { recursive: true, force: true });

// 2) 시즌 보스: 무작위 파티 / 처음 동료
const season = party => {
  const out = sim(['--season', '--n', String(N), ...(party ? ['--party', party] : [])]);
  return [...out.matchAll(/시즌 보스 (\S+): 이김 (\d+)% · 평균 ([\d.]+)턴/g)].map(m => ({ tier: m[1], win: m[2] + '%', turns: m[3] }));
};
process.stderr.write('시즌 보스…\n');
const sRand = season(null), sStart = season(STARTERS);
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
L.push(`| **처음 동료 (아이리스·브릭·마르타) 고정** | ${RS.runs} | **${pct(RS.winRate)}** |`);
L.push('');
L.push(`처음 동료 셋만으로 본판 ${RS.runs}판 「새벽」 격파 ${pct(RS.winRate)} (전체 ${pct(R.winRate)}와 ${((RS.winRate - R.winRate) * 100 >= 0 ? '+' : '') + ((RS.winRate - R.winRate) * 100).toFixed(1)}%p) — ★3·★4만으로 깰 수 있는지 기준선.`);
L.push('');

// 카드별
const cards = Object.entries(R.cards || {}).filter(([, c]) => c.plays >= MIN_PLAYS).map(([id, c]) => ({ id, ...c })).sort((a, b) => b.win - a.win || b.runs - a.runs);
const owner = id => { const ch = cardData(id)?.ch; return CHARACTERS[ch]?.name || (ch === 'curse' ? '저주' : ch || '-'); };
const cardTable = list => {
  L.push('| 순위 | 카드 | 동료 | 덱에 있던 판 | 쓴 횟수 | 격파율 | 전체와 차이 |');
  L.push('|---|---|---|---|---|---|---|');
  list.forEach((c, i) => { const d = (c.win - R.winRate) * 100; L.push(`| ${i + 1} | ${cardData(c.id)?.name || c.id} (\`${c.id}\`) | ${owner(c.id)} | ${c.runs} | ${c.plays} | ${pct(c.win)} | ${(d >= 0 ? '+' : '') + d.toFixed(1)}%p |`); });
  L.push('');
};
L.push('## 카드별 (본판이 끝났을 때 그 카드가 덱에 있던 판의 「새벽」 격파율)');
L.push('');
L.push(`쓴 횟수 ${MIN_PLAYS}번 미만은 뺌 (${cards.length}장 대상). 강화한 카드는 원래 카드로 셈. 시작 카드는 그 동료가 낀 판 전체에 들어가므로 동료 격파율에 가깝다.`);
L.push('');
L.push('### 높은 10장');
L.push('');
cardTable(cards.slice(0, 10));
L.push('### 낮은 10장');
L.push('');
cardTable(cards.slice(-10).reverse());

// 시즌 보스
L.push('## 시즌 보스 난이도');
L.push('');
L.push('| 난이도 | 무작위 파티 | 처음 동료 (아이리스·브릭·마르타) |');
L.push('|---|---|---|');
sRand.forEach((s, i) => L.push(`| ${s.tier} | ${s.win} (평균 ${s.turns}턴) | ${sStart[i] ? `${sStart[i].win} (평균 ${sStart[i].turns}턴)` : '-'} |`));
L.push('');

// 본편 장
{
  const goal = (ch, k) => CH_GOALS.find(([c, g]) => c === ch && g === k);
  const miss = (ch, k, w) => { const g = goal(ch, k); return g && (w < g[2] || w > g[3]); };
  L.push('## 본편 장 (마지막 보스 격파율)');
  L.push('');
  L.push(`무작위 파티 ${CH_N}판씩, 끝없는 탑 제외. 레벨 L은 파티 모두 그 레벨 + 재능, 별자리 6은 힘만. 목표 칸은 [목표 …], 목표 밖이면 **굵게**.`);
  L.push('');
  L.push(`| 장 | 마지막 보스 | ${GROWS.map(g => g.label).join(' | ')} |`);
  L.push(`|---|---|${GROWS.map(() => '---').join('|')}|`);
  for (const ch of [1, 2, 3]) {
    const fin = CHAPTERS[ch].final, bossName = FOE[fin]?.name || fin;
    const cells = GROWS.map(g => {
      const r = CH[ch][g.key], s = pct(r.win), gl = goal(ch, g.key);
      const t = miss(ch, g.key, r.win) ? `**${s}**` : s;
      return gl ? `${t} [목표 ${gl[2] * 100}~${gl[3] * 100}%]` : t;
    });
    L.push(`| ${CHAPTERS[ch].name} | ${bossName} | ${cells.join(' | ')} |`);
  }
  L.push('');
  L.push('목표: ' + CH_GOALS.map(([c, k, lo, hi]) => {
    const w = CH[c][k].win, s = `${c}장 ${GROWS.find(g => g.key === k).label} ${lo * 100}~${hi * 100}% → ${pct(w)}`;
    return miss(c, k, w) ? `**${s} (목표 밖)**` : s;
  }).join(' · ') + '.');
  L.push('');
  L.push('어디서 졌나 (장마다 목표 기준 단계, 진 판 중 비율 상위 3):');
  L.push('');
  for (const ch of [1, 2, 3]) {
    const k = CH_GOALS.find(([c]) => c === ch)?.[1] || 'base', r = CH[ch][k], lost = r.runs - Math.round(r.win * r.runs);
    const top = Object.entries(r.deathAt).sort((a, b) => b[1] - a[1]).slice(0, 3);
    L.push(`- ${CHAPTERS[ch].name} (${GROWS.find(g => g.key === k).label}): ${top.length ? top.map(([k, v]) => `${k} ${pct(v / lost)}`).join(' · ') : '-'}`);
  }
  L.push('');
}

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
