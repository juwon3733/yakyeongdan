// docs/04_enemies.md의 적 표를 데이터(js/data/enemies.js)에서 만든다.
//   node tools/gen-docs.mjs          → 문서의 자동 생성 구간을 다시 쓴다
//   node tools/gen-docs.mjs --check  → 문서가 데이터와 같은지만 본다 (다르면 실패, CI)
// 자동 생성 구간은 <!-- gen:enemies --> … <!-- /gen:enemies --> 사이. 그 밖의 글(보스 설명·그림 규칙 등)은 손으로 쓴다.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { FOE, ACTS } from '../js/data/enemies.js';
import { CARDS } from '../js/data/cards.js';
import { AFFIX, AFFIX_RULE } from '../js/data/affixes.js';
import { AIM_NAME, ACT_NAME } from '../js/data/rules.js';

const DOC = fileURLToPath(new URL('../docs/04_enemies.md', import.meta.url));
const START = '<!-- gen:enemies -->', END = '<!-- /gen:enemies -->';
const ST = { weak: '약화', vuln: '취약' };

// 행동 하나 → 글 (js/combat.js 의도 글과 같은 말)
function act(it) {
  switch (it.t) {
    case 'atk': return `공격 ${it.v}${it.n > 1 ? '×' + it.n : ''}`;
    case 'blk': return `방어 ${it.v}`;
    case 'buf': return `힘 +${it.v}`;
    case 'mix': return `공격 ${it.v}+방어 ${it.b}`;
    case 'deb': return `${ST[it.s] || it.s} ${it.v}`;
    case 'curse': return `저주 「${CARDS[it.card]?.name || it.card}」 ${it.n}장`;
    case 'time': return `밤 시계 +${it.v}분`;
    case 'aoe': return `**모두 공격 ${it.v}**`;
    case 'boom': return `**자폭 ${it.v}**(모두)`;
    case 'gblk': return `**모든 적 방어 ${it.v}**`;
    case 'mend': return `**적 회복 ${it.v}**`;
    case 'sum': return `**부르기: ${FOE[it.id]?.name || it.id}**`;
    case 'steal': return `**카드 훔치기**`;
    case 'aim': return `**노림 바꿈: ${AIM_NAME[it.a] || it.a}**`;
    default: return it.t;
  }
}
const cycle = pat => pat.map(act).join(' → ');
const aimOf = f => AIM_NAME[f.aim || 'front'] || f.aim;
// 특징: 데이터의 특수 필드
function traits(f) {
  const t = [];
  if (f.noPoisonWhileBlock) t.push('방어가 남아 있는 동안 독이 안 듦');
  if (f.armor) t.push(`갑옷 ${f.armor}(공격마다 피해 -${f.armor})`);
  if (f.acts > 1) t.push(`한 턴 ${f.acts}번 행동`);
  if (f.turnClock) t.push(`내 턴마다 밤 시계 +${f.turnClock}분`);
  if (f.thorns) t.push(`**가시 ${f.thorns}**`);
  if (f.deathBoom) t.push(`쓰러질 때 모든 동료 피해 ${f.deathBoom}`);
  if (f.light) t.push(`불빛(비춘 동료 카드 비용 +1)${f.light.double ? `, 체력 ${Math.round(f.light.double * 100)}% 아래면 불빛 둘` : ''}`);
  if (f.small) t.push('작은 적');
  if (f.mistVeil) t.push(`**안개 장막**(내 턴마다 방어 ${f.mistVeil.block}, ③이 터지면 걷혀 방어 0·취약 ${f.mistVeil.vuln})`);
  if (f.stagger) t.push('**비틀거림**(내 턴 피해 100+면 다음 행동 건너뜀)');
  if (f.burstClock) t.push(`한 턴 피해 100+면 밤 시계 +${f.burstClock}분`);
  if (f.phase2) {
    const p = f.phase2, ch = [];
    if (p.armor != null && p.armor !== f.armor) ch.push(`갑옷 ${p.armor}`);
    if (p.acts) ch.push(`행동 ×${p.acts}`);
    if (p.aim) ch.push(`노림 ${AIM_NAME[p.aim] || p.aim}`);
    if (p.clockOnce) ch.push(`밤 시계 +${p.clockOnce}분 한 번`);
    if (p.turnClock) ch.push(`이후 매 턴 +${p.turnClock}분`);
    if (p.pat) ch.push(`순환 ${cycle(p.pat)}`);
    t.push(`체력 ${Math.round(p.at * 100)}%에서 2단계: ${ch.join(', ')}`);
  }
  if (f.phase3) {
    const p = f.phase3, ch = [];
    if (p.clockOnce) ch.push(`밤 시계 +${p.clockOnce}분 한 번`);
    if (p.turnClock) ch.push(`이후 매 턴 +${p.turnClock}분`);
    if (p.burstClock === 0) ch.push('100+ 벌칙 없음');
    if (p.pat) ch.push(`순환 ${cycle(p.pat)}`);
    t.push(`밤의 깊이 ${p.depth}+, 체력 ${Math.round(p.at * 100)}%에서 3단계: ${ch.join(', ')}`);
  }
  return t.join(' · ');
}
const row = id => { const f = FOE[id]; return `| ${f.name} | ${f.hp} | ${cycle(f.pat)} | ${aimOf(f)} | ${traits(f)} |`; };
const HEAD = '| 이름 | 체력 | 행동 순환 | 노림 | 특징 |\n|---|---|---|---|---|';
const uniq = groups => [...new Set(groups.flat())];
const names = g => g.map(id => FOE[id].name).join('+');

export function build() {
  const out = [START, '<!-- tools/gen-docs.mjs가 js/data/enemies.js에서 만든다. 직접 고치지 않는다. -->', ''];
  for (const a of [1, 2, 3]) {
    const A = ACTS[a];
    out.push(`### ${ACT_NAME[a]}`, '', '**일반 적**', '', HEAD, ...uniq([...A.easy, ...A.fights]).map(row), '');
    const common = new Set(uniq([...A.easy, ...A.fights]));   // 강적과 같이 나오는 일반 적은 위 표에
    out.push('**강적**', '', HEAD, ...uniq(A.elites).filter(id => !common.has(id)).map(row), '');
    out.push('**보스**', '', HEAD, ...uniq([A.boss]).map(row), '');
    const summ = uniq([...uniq([...A.easy, ...A.fights, ...A.elites]), ...[A.boss].flat()].map(id => [...FOE[id].pat, ...(FOE[id].phase2?.pat || [])].filter(x => x.t === 'sum').map(x => x.id)))
      .filter(id => !uniq([...A.easy, ...A.fights, ...A.elites]).includes(id));
    if (summ.length) out.push('**불려 나오는 적**', '', HEAD, ...summ.map(row), '');
    out.push(`무리 — 1층(쉬운 전투): ${A.easy.map(names).join(' · ')}`, '',
      `무리 — 그 위 전투: ${A.fights.map(names).join(' · ')}`, '',
      `무리 — 강적: ${A.elites.map(names).join(' · ')}`, '');
  }
  // 노림별 적 목록
  const by = {};
  for (const a of [1, 2, 3]) for (const id of uniq([...ACTS[a].easy, ...ACTS[a].fights, ...ACTS[a].elites, [ACTS[a].boss].flat()])) {
    const f = FOE[id]; const k = f.pat.some(p => p.t === 'aim') ? 'shift' : f.aim || 'front';
    (by[k] ||= []).push(f.name);
  }
  out.push('### 노림별', '', '| 노림 | 적 |', '|---|---|',
    ...Object.entries(by).map(([k, l]) => `| ${k === 'shift' ? '바뀜(행동으로 앞↔뒤)' : AIM_NAME[k] || k} | ${l.join(', ')} |`), '');
  // 속성 (js/data/affixes.js)
  const R = AFFIX_RULE;
  out.push('### 속성', '',
    `강적 전투는 첫 적에 속성 ${R.elite}개(밤의 깊이 「강적 속성 2개」 단계부터 ${R.eliteDeep}개). 일반 전투는 ${Object.entries(R.fight).filter(([, p]) => p).map(([a, p]) => `${a}막 ${Math.round(p * 100)}%`).join(' · ')} 확률로 작은 적이 아닌 하나에 1개. 보스·튜토리얼·에피소드 특별 전투에는 붙지 않는다.`, '',
    `속성 하나마다 이기면 별빛 +${R.gold}, 레전더리 카드 확률 +${Math.round(R.rare * 100)}%p. 이름 앞에 수식어가 붙는다(예: 「단단한 닻 거인」).`, '',
    '| 수식어 | 효과 |', '|---|---|', ...Object.values(AFFIX).map(a => `| ${a.pre} | ${a.text} |`), '', END);
  return out.join('\n');
}

const doc = await readFile(DOC, 'utf8');
const i = doc.indexOf(START), j = doc.indexOf(END);
if (i < 0 || j < 0) { console.error(`docs/04_enemies.md에 ${START} … ${END} 구간이 없다`); process.exit(1); }
const next = doc.slice(0, i) + build() + doc.slice(j + END.length);
if (process.argv.includes('--check')) {
  if (next !== doc) { console.error('docs/04_enemies.md 적 표가 데이터와 다르다. node tools/gen-docs.mjs 를 돌려라.'); process.exit(1); }
  console.log('docs/04 적 표 OK');
} else if (next !== doc) { await writeFile(DOC, next); console.log('docs/04_enemies.md 적 표를 다시 만들었다'); }
else console.log('docs/04 적 표 그대로');
