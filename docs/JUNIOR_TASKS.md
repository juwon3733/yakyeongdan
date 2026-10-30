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

지난 큐 ✅: A 적 도감, B 시즌 1 음악·에스텔 소리, C 밸런스 보고서·카드 순위·--patch 시뮬. (랭킹 틀은 주니어 실패 → Claude가 만듦)

공통 금지(모든 작업에 붙인다): assets/ 아래 그림·json, docs/PROMPTS.md, shots/ 는 열거나 cat 하지 마. grep은 js css tools 안에서만. 긴 출력은 파일로 보내고 tail만.

### 주니어 A — 화면
1. `feat` · **시즌 패스 보상 줄**
   ```
   시즌 화면(js/render/season.js seasonView)의 시즌 패스(지금은 작은 눈금 막대 .spbar)를 보상이 보이는 가로 줄로 바꿔 줘.
   - 30단계를 가로로 스크롤되는 칸 줄로: 칸마다 단계 번호 + 보상(js/data/season.js PASS.reward(n): 별 조각 수, 10단계마다 칭호). 5·10단계 칸은 크게, 10단계는 금테.
   - 받은 칸은 도장(✓), 받을 수 있는 칸은 반짝임(steps 애니메이션), 아직인 칸은 어둡게. 지금 단계로 자동 스크롤.
   - 위에 지금 단계·다음 단계까지 남은 시즌 별(rec.xp % PASS.per / PASS.per) 막대. [보상 받기] 버튼은 그대로(data-claimpass).
   CSS는 css/season.css 끝에. node tools/smoke.mjs(시즌 블록 포함), node tools/text-check.mjs 통과.
   공통 금지: assets/ 아래 그림·json, docs/PROMPTS.md, shots/ 는 열거나 cat 하지 마. grep은 js css tools 안에서만. 긴 출력은 파일로 보내고 tail만.
   ```

### 주니어 B — 소리
1. `feat` · **보스 단계 전환·승리 띠 효과음**
   ```
   tools/compose/sfx.py로 PC-98 FM 효과음 둘을 만들어 등록해 줘.
   - boss_phase: 보스 단계 전환. 낮게 빨려 드는 소리(0.5초) → 쾅 터짐 + 금속성 울림(0.6초), 합쳐 1.1초. js/juice.js phaseFx에서 지금 sfx(hasSfx('boss_enter') ? 'boss_enter' : 'dawn', ...) 줄을 hasSfx('boss_phase')가 있으면 'boss_phase'를 쓰게 그 한 줄만 고친다.
   - win_band: 「승리」 띠가 펼쳐질 때 짧은 금관 팡파르 0.8초. js/juice.js winBurst() 맨 앞에 if (hasSfx('win_band')) sfx('win_band', { vol: .7 }); 한 줄.
   push가 실패하면 2·4·8·16초 쉬고 다시. PR 설명에 소리 길이.
   공통 금지: assets/ 아래 그림·json, docs/PROMPTS.md, shots/ 는 열거나 cat 하지 마. grep은 js css tools 안에서만. 긴 출력은 파일로 보내고 tail만.
   ```

### 주니어 C — 도구
1. `chore` · **핀 강화안 시험(보고만)**
   ```
   밸런스 보고서에서 핀(★3 우편배달부)이 가장 약하다(들어간 파티 격파율 약 23%, 평균 35%). tools/patch-compare.mjs로 강화안 셋을 시험해 줘.
   - tools/patches/finn_a.json: 핀 카드 수치(js/data/cards.js finn.*의 v)만 +1~2.
   - tools/patches/finn_b.json: 핀 패시브 숫자만(js/data/characters.js finn) — 데이터에 숫자로 있는 것만 바꿀 수 있으면, 아니면 maxHp +4로 대신.
   - tools/patches/finn_c.json: a + b 같이.
   각 patch를 --runs 2000으로 돌려 「핀이 든 파티 격파율」「전체 격파율」을 표로 PR 설명에. 목표는 핀 30~35%(★5는 넘지 않게). 가장 나은 안을 추천만 하고 js/data/ 는 고치지 마(결정은 Claude).
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
