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

### 주니어 A — 화면
1. `feat` · **보상·상점 카드 크게 보기**
   ```
   보상 화면(js/render/screens.js의 보상)과 상점(야시장)에서 카드에 마우스를 대면 1.6배로 커지고(옆 카드는 비켜남),
   희귀(r-r) 카드는 금빛이 테두리를 따라 도는 반짝임을 넣어 줘. CSS는 css/screens.css를 새로 만들어 넣고
   index.html에 <link rel="stylesheet" href="css/screens.css"> 한 줄 추가(affix.css 다음). css/game.css는 고치지 마.
   전투 손패(.bottom .hand)에는 영향 없게 .hand.big 범위로만. 끝나면 node tools/smoke.mjs, npm run shots로 reward.png·shop.png 확인.
   ```
2. `feat` · **지도 노드 꾸미기**
   ```
   지도(js/render/map.js)의 칸이 글자 상자라 밋밋해. 칸 종류(전투·강적·보스·휴식·사건·상점)마다 도트 아이콘(인라인 SVG나 CSS 도트,
   16×16을 2배)과 색 테두리를 넣고, 지금 갈 수 있는 칸은 천천히 떠오르듯 깜빡이게. 지나온 길은 금색 점선.
   CSS는 css/screens.css에. node tools/smoke.mjs, npm run shots로 map.png 확인.
   ```
3. `feat` · **보상 등장 연출**
   ```
   전투 승리 후 보상 카드 3장이 뒤집혀 나오는 연출(js/juice.js dealReward가 .cardback을 붙였다 뗌)에 맞춰,
   보상 화면 배경을 살짝 어둡게 하고 카드 뒤로 빛줄기(css 회전 그라디언트)가 돌게 해 줘. js/juice.js는 고치지 말고 css/screens.css로만.
   ```

### 주니어 B — 소리
1. `feat` · **피격·방어·처치 효과음 종류별로**
   ```
   js/audio.js의 hurt·block·kill 소리가 하나씩이야. 적 종류(js/data/enemies.js의 pal: ghost·crab·cloud·star 등)마다
   맞는 소리를 3~4갈래로 나눠 tools/compose/sfx.py로 만들고(sfx_hit_<종류>.wav), sfx('hit', { kind })처럼 부를 수 있게.
   js/juice.js는 Claude가 연결하니 audio.js에 함수만 만들어 두고 PR 설명에 부르는 법을 적어 줘.
   ```
2. `feat` · **필살 컷인 효과음**
   ```
   희귀 카드·듀오 필살 컷인(0.9초) 때 나는 소리를 새로: 0~0.2초 빨려 드는 소리 → 0.7초 쾅. sfx('special')로.
   tools/compose/sfx.py로 만들고 audio.js에 등록만.
   ```
3. `feat` · **막마다 전투 음악 변주**
   ```
   1·2·3막 전투 음악이 같은 곡이면 막마다 악기·템포를 바꾼 변주를 만들어 줘(PC-98 FM 느낌 유지). 곡 구조는 js/audio.js를 보고.
   ```

### 주니어 C — 도구
1. `feat` · **적 차례 연속 사진**
   ```
   tools/screens.mjs에 적 차례 장면도 추가: 턴 끝을 누른 뒤 0.08초 간격 8장(shots/foe_seq_*.png).
   또 피해 숫자 확인용으로 공격 카드(베기 같은 atk 카드)를 쓰는 연속 6장(shots/atk_seq_*.png)도. 찍는 게 느리면 page.clock으로 시간을 멈춰 가며 찍어.
   ```
2. `feat` · **사진 모아 보기**
   ```
   npm run shots가 끝나면 shots/index.html(사진을 한 화면에 격자로, 연속 사진은 한 줄로)을 만들어 줘. 브라우저로 열어 한눈에 보게.
   ```
3. `chore` · **CI에서 사진 남기기**
   ```
   .github/workflows/ci.yml에서 smoke 다음에 npm run shots를 돌리고 shots/를 actions/upload-artifact로 올려 줘(보관 7일).
   그러면 PR마다 화면 사진을 내려받아 볼 수 있어.
   ```

## Claude 할 일 (차례대로)
1. **전투 화면 정리** — 대열 글자(뒤·가운데·앞)·⇄ 버튼·체력 글자가 어수선해서 프로토타입처럼 보이는 것 정리. 체력은 발밑 막대, 이름은 마우스를 대면.
2. **적 차례 연출** — 적이 의도 아이콘을 들어 올리고 → 돌진 → 맞은 동료 피격 자세·피해 숫자, 여러 적이면 차례로 이어지게.
3. **카드 쓰기 연출 단계 나누기** — 카드가 날아가 사라지는 동안 시전자 앞에 카드 문양이 떠오르고, 그 뒤 이펙트. 필살은 컷인 → 암전 → 이펙트 → 히트스톱.
4. 그림 검수·병합(GPT 묶음), 주니어 PR 화면 확인.
