// js/asset_prompts.js(원본)에서 assets/prompts.json(에이전트용)과 docs/PROMPTS.md(사람용)를 만든다.
// 사용: node tools/export-prompts.mjs          → 두 파일을 다시 쓴다
//       node tools/export-prompts.mjs --check  → 원본과 어긋나 있으면 실패 (CI)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = await import(pathToFileURL(path.join(root, 'js/asset_prompts.js')).href);
const { batches, items } = P.assetList();

const json = JSON.stringify({
  generated_from: 'js/asset_prompts.js',
  style_version: P.STYLE_VERSION,
  rules: 'AGENTS.md를 따른다. 프롬프트는 고치지 말고 그대로 쓴다.',
  batches: batches.map((b) => ({ ...b, items: items.filter((i) => i.batch === b.id).map((i) => i.id) })),
  items,
}, null, 2) + '\n';

const kindName = { stand: '서 있는 그림', portrait: '상반신', outfit: '두 번째 의상', cutin: '컷인', duo: '인연 듀오 컷인', cg: '★5 전신 CG', enemy: '일반 적', elite: '강적', boss: '보스', bg: '배경', title: '타이틀', summon: '소환 배경', meteor: '별똥별', icon: '도구 아이콘', card: '카드 그림', sprite: '전투 스프라이트', fx: '기술 이펙트', fxsheet: '이펙트 시트', battlesheet: '전투 스프라이트 시트', cardsheet: '카드 시트', foesheet: '적 시트', iconsheet: '아이콘 시트' };
const md = [];
md.push('# 그림 프롬프트 목록');
md.push('');
md.push('> 자동 생성 파일. 고치지 말 것. 원본은 `js/asset_prompts.js`, 다시 만들기: `node tools/export-prompts.mjs`.');
md.push('');
md.push(`style_version ${P.STYLE_VERSION} · GPT가 그릴 그림 ${items.length}장(시트 포함, 잘라 내면 ${items.filter((i) => !i.cells).length + items.reduce((n, i) => n + (i.cells?.length || 0), 0)}장) · 묶음 ${batches.length}개`);
md.push('');
md.push('## 묶음');
md.push('');
md.push('| 묶음 id | 이름 | 장 수 |');
md.push('|---|---|---|');
for (const b of batches) md.push(`| \`${b.id}\` | ${b.title} | ${items.filter((i) => i.batch === b.id).length} |`);
md.push('');
md.push('## 종류별 크기');
md.push('');
md.push('| 종류 | PNG 크기 | 게임 원본 도트 | 투명 | 최대 색 | 메모 |');
md.push('|---|---|---|---|---|---|');
for (const [k, s] of Object.entries(P.SPEC)) md.push(`| ${kindName[k] || k} (\`${k}\`) | ${s.w}×${s.h} | ${s.native} | ${s.transparent ? '예' : '아니오'} | ${s.colors === Infinity ? '제한 없음' : s.colors} | ${s.note} |`);
md.push('');
for (const b of batches) {
  md.push(`## \`${b.id}\` — ${b.title}`);
  md.push('');
  if (b.reference_sheet_prompt) {
    md.push('<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>\n');
    md.push('```');
    md.push(b.reference_sheet_prompt);
    md.push('```');
    md.push('</details>');
    md.push('');
  }
  md.push('| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |');
  md.push('|---|---|---|---|---|');
  for (const i of items.filter((x) => x.batch === b.id)) {
    md.push(`| \`${i.id}\` | \`assets/${i.file}\`${i.cells ? ` → ${i.cells.map((c) => '`' + c.file.split('/')[1] + '`').join(' ')}` : ''} | ${i.width}×${i.height}${i.transparent ? ' 투명' : ''} | ${(i.reference_images || []).map((r) => '`assets/' + r + '`').join(' ') || '—'} | ${i.must_show || '—'} |`);
  }
  md.push('');
}
const mdText = md.join('\n');

const targets = [[path.join(root, 'assets/prompts.json'), json], [path.join(root, 'docs/PROMPTS.md'), mdText]];
if (process.argv.includes('--check')) {
  const bad = targets.filter(([f, t]) => !fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== t);
  if (bad.length) {
    console.error('프롬프트 파일이 원본과 달라요. `node tools/export-prompts.mjs`를 돌리고 커밋하세요:\n' + bad.map(([f]) => '  ' + path.relative(root, f)).join('\n'));
    process.exit(1);
  }
  console.log(`프롬프트 동기화 OK (${items.length}장)`);
} else {
  for (const [f, t] of targets) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, t); }
  console.log(`썼어요: assets/prompts.json, docs/PROMPTS.md (${items.length}장, 묶음 ${batches.length}개)`);
}
