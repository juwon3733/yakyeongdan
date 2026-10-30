# 일 나누기 (Claude + 주니어 셋)

목표: **부드러운 동작·화려한 스킬 연출**을 중심으로 게임을 덜 허접하고 덜 AI 같게. 판단(연출 방향·그림 검수·화면 확인)은 Claude, 정해진 구현은 주니어.

## 영역 (서로 다른 파일만 만진다 — 합칠 때 충돌 없게)

| 누구 | 파일 | 하는 일 |
|---|---|---|
| **Claude** | `js/juice.js` `js/render/combat.js` `css/fx.css` `js/asset_prompts.js` `assets/` | 전투 화면·연출, 그림 검수·병합, 주니어 PR 화면 확인 |
| **주니어 A — 화면** | `js/render/map.js` `js/render/screens.js` `js/render/base.js` `css/screens.css`(새로) | 전투 밖 화면: 지도·보상·상점·사건·본부 |
| **주니어 B — 소리** | `js/audio.js` `tools/compose/` `assets/audio/` | 효과음·음악 |
| **주니어 C — 도구** | `tools/` (`screens.mjs` `smoke.mjs` `sim.mjs`) `.github/` | 사진·검사 도구, 밸런스 시뮬 |

- `css/game.css`와 `index.html`은 Claude만 고친다. 주니어 A의 CSS는 `css/screens.css`(첫 작업에서 만들고 `index.html`에 한 줄 추가).
- 같은 주니어에게도 한 번에 하나씩. PR이 합쳐진 뒤 다음 걸 넣는다.
- 합치기 전에 Claude에게 "PR 봐 줘" → 브랜치를 받아 `npm run shots`로 화면 확인.

## 주니어 큐 (위에서부터, 큐에 그대로 붙여 넣기)

지난 큐 ✅: A 적 도감, B 시즌 1 음악(season·boss_star·boss_star3·meteor), C 밸런스 보고서 + 카드 순위.

공통 금지(모든 작업에 붙인다): assets/ 아래 그림·json, docs/PROMPTS.md, shots/ 는 열거나 cat 하지 마. grep은 js css tools 안에서만. 긴 출력은 파일로 보내고 tail만.

### 주니어 A — 화면
1. `feat` · **시즌 랭킹 화면 틀**
   ```
   시즌 화면(js/render/season.js)의 「시즌 랭킹 — 온라인 연결 뒤 열린다」 자리를 실제 랭킹 화면 틀로 만들어 줘. 서버는 아직 없다(Claude가 나중에 Supabase로 붙임).
   - js/ranking.js(새로): export async function fetchBoard(board, season) — 지금은 가짜 자료(이름 20개·점수·파티 3명 id)를 돌려준다. board: 'daily'·'season_boss'·'endless'·'run'. 내 순위 { rank, score } 도 같이(가짜).
   - 시즌 화면 오른쪽 아래 [랭킹] 버튼 → S.view = 'ranking' 화면(js/render/ranking.js 새로, js/render/index.js에 등록): 위에 탭 넷(매일의 밤·시즌 보스·끝없는 탑·밤 오르기), 1~3위는 큰 칸(금·은·동 테두리 + 파티 얼굴 셋, common.js face()), 4위부터 줄, 맨 아래 고정 줄에 내 순위.
   - 불러오는 동안 「불러오는 중」, 실패하면 「온라인에 연결되지 않았다」 한 줄.
   CSS는 css/screens.css. node tools/smoke.mjs, node tools/text-check.mjs 통과.
   공통 금지: assets/ 아래 그림·json, docs/PROMPTS.md, shots/ 는 열거나 cat 하지 마. grep은 js css tools 안에서만. 긴 출력은 파일로 보내고 tail만.
   ```

### 주니어 B — 소리
1. `feat` · **에스텔 소리**
   ```
   시즌 1 동료 에스텔(별똥 기사, 창검)의 소리를 tools/compose/sfx.py로 만들어 등록해 줘(PC-98 FM).
   - atk_estelle: 에스텔 공격(다른 동료 atk_<id>와 같은 방식, 이름만 맞으면 js/juice.js가 알아서 쓴다). 창이 바람을 가르는 휘익 + 맑은 금속 찌르기, 0.3초.
   - burst_estelle: 패시브 ③ 「유성우」 터질 때. 높은 곳에서 별 여러 개가 연달아 떨어져 터지는 소리 0.9초. js/juice.js에서 e.kind === 'burst' && e.who === 'estelle'일 때 sfx('burst_estelle') — 그 한 줄만 juice.js를 고친다(없으면 기존 소리).
   - pass_claim: 시즌 패스 보상 받기 딩동 + 짧은 상승 아르페지오 0.6초. js/main.js 'claimpass' 처리에서 받은 게 있을 때 sfx('pass_claim').
   push가 실패하면 2·4·8·16초 쉬고 다시. PR 설명에 소리 길이.
   공통 금지: assets/ 아래 그림·json, docs/PROMPTS.md, shots/ 는 열거나 cat 하지 마. grep은 js css tools 안에서만. 긴 출력은 파일로 보내고 tail만.
   ```

### 주니어 C — 도구
1. `feat` · **수치 바꿔 보기 시뮬(--patch)**
   ```
   tools/sim.mjs에 --patch <파일.json>을 더해 줘: 데이터 파일을 고치지 않고 시뮬 안에서만 수치를 바꿔 승률을 비교한다.
   - patch 형식: { "cards": { "iris.slash": { "v": [8] }, "finn.letter": { "cost": 0 } }, "chars": { "iris": { "maxHp": 40 } } } — 불러온 CARDS·CHARACTERS 객체에 덮어쓴다(깊은 병합).
   - tools/patch-compare.mjs(새로): 같은 시드로 patch 없이/있이 두 번 돌려 「처음 동료(아이리스·브릭·마르타) 격파율」「바뀐 동료가 든 파티 격파율」「전체 격파율」을 나란히 출력.
   - 시험용 patch 하나를 tools/patches/starter_buff.json으로: 아이리스·브릭·마르타 기본 카드(slash·guard·shot 등 시작 덱 카드) 수치 +1씩. 결과 표를 PR 설명에.
   js/data/ 파일은 고치지 마(수치 결정은 Claude).
   공통 금지: assets/ 아래 그림·json, docs/PROMPTS.md, shots/ 는 열거나 cat 하지 마. grep은 js css tools 안에서만. 긴 출력은 파일로 보내고 tail만.
   ```

## Claude 할 일 (관제 — 하나 끝날 때마다 사진 확인 → 테스트 → main)

한 일: 전투 화면·의도·상태 아이콘·카드 틀·HUD·글꼴, 전투 다듬기(BATTLE_PLAN), 동료 23명 전용 필살, 듀오 합동 연출, 패시브 각성, 보스 등장, 승리 자세, 별 소환 연출, 컷인 건너뛰기, 희귀도 레어·에픽·레전더리, 시즌 1(시즌 보스·패스·규칙·에스텔·시즌 소개), 전체 점검(글자·초상화), 밸런스, 에스텔 인연·에피소드, 주니어·GPT 결과 검수·병합.

다음 (차례대로):
1. ✅ 시즌 보스 단계 전환 연출, 승리 띠 연출, 그림 화질(2배 해상도·평균 축소), 에스텔 강화
1-1. **처음 동료 강화** — 처음 셋만 16.3%(전체 33%): 주니어 C의 --patch로 시험 후 수치 결정
2. **에스텔 듀오 2쌍 연출 확인** — 하늘의 두 기사(둘이 같이 낙하), 별을 부르는 밤(정령+유성)
3. **보상 등장** — 「승리」 띠와 동시에 카드가 한 장씩 뒤집힘
4. **폰 가로 화면 확인** — 작은 화면 글자·버튼·손패
5. **온라인(Supabase)** — 사용자가 Project URL·anon 키를 주면: 아이디·비번 로그인, 저장 동기화, 랭킹(매일의 밤 → 시즌 보스 → 끝없는 탑), 시즌 끝 보상
6. **새 콘텐츠** — 동료 시련(동료 하나로 정해진 퍼즐 전투), 주간 퍼즐
7. GPT 그림이 올라올 때마다 검수·병합(cg-star5 에스텔 → 카드 → UI 키트 → 듀오 컷인)
