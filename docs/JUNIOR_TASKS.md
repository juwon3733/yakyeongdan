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

지난 큐: A 글자 잘림·본부 정리·MVP 기준·결과 MVP 연출 ✅, B 별 소환 효과음 ✅, C 글자 잘림 검사(tools/text-check.mjs) ✅. 주니어 C의 피격음 브랜치(feat/j3)는 main에 이미 같은 내용이 있어 안 합침.

### 주니어 A — 화면
1. `feat` · **적 도감**
   ```
   도감(js/render/base.js codexView)에 「적」 칸을 더해 줘. 지금 도감은 카드·듀오만 있다.
   - 만난 적 기록: js/combat.js startCombat에서 적 key를 P.foesSeen(배열, 없으면 만듦)에 넣고 save — 이 한 줄만 combat.js를 고친다.
   - 적 칸: 막별(1막 항구층·2막 구름층·3막 별층·시즌)로 묶은 격자. 만난 적은 그림(js/art.js foeArt, 없으면 js/render/sprites.js sprite 임시 도트)·이름·체력, 안 만난 적은 검은 실루엣 + 「?」.
   - 보스·강적은 칸을 두 배 크기로, 시즌 보스(starking·starshard)는 「시즌 1」 묶음.
   - 칸을 누르면 옆에 행동 패턴(js/data/enemies.js pat)을 아이콘 줄로(전투 의도 아이콘과 같은 모양, js/render/combat.js에서 쓰는 함수를 가져다 씀).
   CSS는 css/screens.css. node tools/smoke.mjs, node tools/text-check.mjs, npm run shots로 codex 확인.
   ```

### 주니어 B — 소리
1. `feat` · **시즌 1 「유성우의 밤」 음악**
   ```
   시즌 1(유성우의 밤, 11/1~11/14) 곡을 tools/compose/songs.py에 PC-98 FM으로 작곡해서 js/audio.js에 연결해 줘.
   - season: 시즌 화면·시즌 소개 곡. 맑고 넓은 밤하늘, 종·벨 소리 반짝임, 느린 6/8, 1분 반복.
   - boss_star: 시즌 보스 「떨어진 별의 왕」 1·2단계. 장엄한 오르간+금관, 떨어지는 하행 아르페지오가 주제. 150 안팎.
   - boss_star3: 같은 주제 3단계(체력 25% 아래, 두 번 행동) — 빠르고 높게, 드럼 두 배.
   - sfx('meteor'): 유성우 규칙 별똥 떨어짐(휘익 하강 + 반짝 터짐 0.4초).
   연결: js/audio.js pickBgm에서 S.view === 'season' → 'season', BOSS_SONG에 starking: 'boss_star'(S.C.all[0].p3면 'boss_star3' — dawn 보스와 같은 방식).
   sfx('meteor')는 연결하지 말고 이름만 등록(전투 연출은 Claude가 붙임). PR 설명에 곡 길이·빠르기.
   ```

### 주니어 C — 도구
1. `feat` · **밸런스 보고서**
   ```
   tools/balance-report.mjs(새로): tools/sim.mjs를 불러 아래 표를 docs/BALANCE.md로 만들어 줘(자동 생성 표시를 맨 위에).
   - 동료 23명 각자 들어간 파티 승률(무작위 파티 n=400) — 높은 순, 평균 ±10%p 밖이면 굵게.
   - ★5 6명: 별자리 0, ★3·★4만 파티 승률도 한 줄(★3·★4만으로 깰 수 있는지 확인용).
   - 시즌 보스 난이도 셋(일반·어려움·악몽) 승률: 무작위 파티, 처음 동료(아이리스·브릭·마르타).
   - 인연 듀오 52쌍 중 쓰인 횟수 0인 것 목록.
   package.json에 "balance": "node tools/balance-report.mjs". 오래 걸리면 --quick(n=100).
   수치는 고치지 마(보고만). 결과 표를 PR 설명에 붙여 줘.
   ```

## Claude 할 일 (관제 — 하나 끝날 때마다 사진 확인 → 테스트 → main)

한 일: 전투 화면·의도·상태 아이콘·카드 틀·HUD·글꼴, 전투 다듬기(BATTLE_PLAN), 동료 23명 전용 필살, 듀오 합동 연출, 패시브 각성, 보스 등장, 승리 자세, 별 소환 연출, 컷인 건너뛰기, 희귀도 레어·에픽·레전더리, 시즌 1(시즌 보스·패스·규칙·에스텔·시즌 소개), 전체 점검(글자·초상화), 밸런스, 에스텔 인연·에피소드, 주니어·GPT 결과 검수·병합.

다음 (차례대로):
1. **시즌 보스전 연출** — 별의 왕 단계 전환(2·3단계) 컷인·하늘 색 바뀜, 유성우 규칙 별똥 떨어짐에 sfx('meteor') 연결(주니어 B 곡 들어오면), 처치 마무리에 에스텔 CG
2. **에스텔 듀오 2쌍 연출 확인** — 하늘의 두 기사(둘이 같이 낙하), 별을 부르는 밤(정령+유성)
3. **보상 등장** — 「승리」 띠와 동시에 카드가 한 장씩 뒤집힘
4. **폰 가로 화면 확인** — 작은 화면 글자·버튼·손패
5. **온라인(Supabase)** — 사용자가 Project URL·anon 키를 주면: 아이디·비번 로그인, 저장 동기화, 랭킹(매일의 밤 → 시즌 보스 → 끝없는 탑), 시즌 끝 보상
6. **새 콘텐츠** — 동료 시련(동료 하나로 정해진 퍼즐 전투), 주간 퍼즐
7. GPT 그림이 올라올 때마다 검수·병합(cg-star5 에스텔 → 카드 → UI 키트 → 듀오 컷인)
