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

## Claude 할 일 (차례대로 — 하나 끝날 때마다 사진 확인 → 테스트 → main)
지금 화면에서 가장 허접해 보이는 것부터. 기준: 슬레이 더 스파이어·카오스 제로 나이트메어 전투 화면.

1. ✅ 전투 화면 정리, 대상 화살표, 적 차례 연출, 카드 쓰기 연출, 동작 부드럽게, 필살 효과음 연결
2. ✅ **적 의도 아이콘** — 「공격 3 → 앞줄」 글자 대신 칼·방패·화살 도트 아이콘 + 큰 숫자(×횟수), 노림 얼굴은 작게. 센 공격은 붉게 떨림
3. ✅ **상태 아이콘** — 가시·화상·독·출혈·약화·취약·방어 칩(글자 상자)을 작은 도트 아이콘 + 숫자로, 체력 막대 아래 한 줄
4. **손패 카드 틀 다시** — 종이색 칩 대신 밤 테마 틀(동료 색 테두리·금속 모서리), 비용 보석 크게, 이름 띠 글자 또렷하게, 희귀도는 테두리 빛으로만
5. **에너지·턴 끝 버튼** — 노란 네모 칸 대신 빛나는 구슬(남은 수), 턴 끝은 큰 둥근 도장 버튼, 누르면 눌리는 맛
6. **위 띠(HUD)** — 글자 버튼(설정·소리·덱)을 도트 아이콘으로, 밤 시계는 시계 모양 + 시간, 연계는 칸 3개 빛
7. **전투 시작·끝 연출** — 시작: 동료가 왼쪽에서 걸어 들어오고 적이 안개에서 나타남. 승리: 적이 빛으로 부서지고 동료 승리 자세, 「승리」 띠
8. **적 처치 연출** — 쓰러질 때 흰 번쩍 → 조각으로 흩어짐 + 이펙트, 마지막 적은 슬로 모션
9. **필살 연출 다듬기** — 컷인 → 암전 → 이펙트 크게 → 히트스톱이 한 박자로, 듀오는 둘이 같이
10. **턴 띠·숫자 다듬기** — 「적의 차례」「1턴」 띠를 짧고 굵게, 피해 합계 표시 정리
11. **폰 가로 화면 확인** — 작은 화면에서 글자·버튼 크기, 손패 겹침

