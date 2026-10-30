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

지난 큐 ✅: A 적 도감·시즌 패스 줄, B 시즌 음악·에스텔 소리·보스 단계/승리 띠 소리, C 밸런스 보고서·카드 순위·--patch 시뮬. (랭킹 틀·핀 강화는 Claude가 함)

공통 금지(모든 작업에 붙인다): assets/ 아래 그림·json, docs/PROMPTS.md, shots/ 는 열거나 cat 하지 마. grep은 js css tools 안에서만. 긴 출력은 파일로 보내고 tail만.

### 주니어 A — 화면
1. `feat` · **덱 보기 다듬기**
   ```
   판 중 [덱] 모달(js/render/screens.js deckModal)을 게임답게: 지금은 카드가 줄줄이 나열된다.
   - 위에 거르기 버튼: 전체 · 동료별(파티 셋 얼굴) · 종류별(공격·방어·스킬·저주). S.deckFilter에 기억, 다시 열어도 유지.
   - 같은 카드는 한 장으로 묶고 오른쪽 위에 ×개수 도장, 강화된 카드는 따로.
   - 카드에 마우스를 대면 지금 손패 확대처럼 크게(js/cardzoom.js 쓰는 법을 따름).
   - 위쪽 도구 줄은 그대로.
   CSS는 css/screens.css. node tools/smoke.mjs(덱 열기 포함), node tools/text-check.mjs 통과.
   공통 금지: assets/ 아래 그림·json, docs/PROMPTS.md, shots/ 는 열거나 cat 하지 마. grep은 js css tools 안에서만. 긴 출력은 파일로 보내고 tail만.
   ```

### 주니어 B — 소리
1. `feat` · **에피소드·휴식 환경음**
   ```
   tools/compose/ambience.py로 환경음 4개를 만들어(16초 반복, 다른 amb_와 같은 방식) js/audio.js pickAmb에 연결해 줘.
   - amb_harbor_town: 항구 거리(잔잔한 파도 + 멀리 종소리) — 에피소드 장소 harbor
   - amb_convent: 수녀원(촛불 타는 소리 + 낮은 오르간 울림) — convent
   - amb_clock: 시계탑(큰 톱니 째깍 + 바람) — clock
   - amb_campfire: 모닥불 타닥 소리 — 판 안 휴식 화면(G.screen === 'rest')
   연결: 지금 pickAmb는 에피소드(S.view === 'ep')면 null. S.ep.bg가 harbor·convent·clock이면 위 소리, 나머지는 null 그대로. 휴식이면 amb_campfire.
   push가 실패하면 2·4·8·16초 쉬고 다시. PR 설명에 소리 길이.
   공통 금지: assets/ 아래 그림·json, docs/PROMPTS.md, shots/ 는 열거나 cat 하지 마. grep은 js css tools 안에서만. 긴 출력은 파일로 보내고 tail만.
   ```

### 주니어 C — 도구
1. `feat` · **화면 바뀜 검사(사진 비교)**
   ```
   tools/shot-diff.mjs(새로): npm run shots로 찍은 shots/*.png를 지난번 기준(shots/base/*.png, 없으면 지금 것을 기준으로 저장)과 픽셀 비교해서, 화면마다 바뀐 비율(%)을 표로 출력하고 바뀐 곳을 빨갛게 칠한 사진을 shots/diff/에 저장.
   - 애니메이션 때문에 조금씩 다르니 2% 미만은 「같음」으로.
   - --update 로 기준을 지금 사진으로 바꾼다.
   - PNG 읽기·쓰기는 tools/png.mjs(이미 있음)를 쓴다. 다른 패키지 설치 금지.
   - package.json에 "shotdiff": "node tools/shot-diff.mjs".
   사진은 열어 보지 말고 표만 PR 설명에.
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
