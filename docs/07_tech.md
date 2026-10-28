# 07. 기술

## 원칙
- 빌드 없는 순수 JS(ES 모듈), HTML 하나 + `js/` + `assets/`. GitHub Pages로 배포.
- 게임 규칙(카드·적·도구·사건)은 **데이터 파일**로, 엔진은 데이터를 읽기만 한다. 수치를 바꾸려고 엔진을 고치지 않는다.
- 그림이 없으면 임시 도트(코드)로 대신 그린다. 그림 파일이 들어오면 자동으로 바뀐다.

## 폴더
```
index.html
css/game.css
js/
  main.js        화면 전환, 저장
  rng.js         시드 난수 (판마다 시드 → 지도·보상·달 재현 가능)
  run.js         한 판 상태: 파티, 덱, 체력, 밤 시계, 달, 도구
  map.js         지도 생성·이동·시간 계산
  combat.js      전투 엔진 (턴, 손패, 의도, 상태, 연계·듀오)
  effects.js     카드 효과 기본 동작(피해, 방어, 상태, 뽑기, 시계)
  render/        화면별 그리기 (map, combat, reward, shop, rest, event, result)
  fx.js          컷인(듀오·보스 등장·2단계 띠), 판 흔들림
  juice.js       손맛·연출: 연출 사건을 순서대로 (카드 날기·타격·숫자·입자·배너·막 사이 장면)
  audio.js       곡·효과음·환경음 (설정 음량)
  settings.js    설정 (음량·흔들림·애니메이션 줄이기·글자 크기, localStorage yk-settings)
  tutorial.js    첫 실행 튜토리얼 (정해진 지도·손패·도움말 줄, 데이터는 data/tutorial.js)
  data/
    characters.js  동료 20명 (성급, 최대 체력, 키워드, 패시브, 색, 말투, 시작 덱)
    cards.js       동료 카드 + 인연 듀오 카드 (듀오가 있는 짝 = 인연 목록)
    enemies.js     적·강적·보스 (체력, 행동 순환, 특수)
    relics.js      도구
    events.js      사건
    episodes.js    동료 에피소드 대본(3화씩)·특별 전투·인연 장면·여는 조건 (재생은 js/episodes.js, 화면은 js/render/episodes.js)
    moons.js       달
    talks.js       휴식 대화
    gacha.js       소환 확률·천장·픽업·별자리·교환소 가격·카드 묶음
    depth.js       밤의 깊이 1~10 규칙
  asset_prompts.js 그림 프롬프트 원본 (→ assets/prompts.json, docs/PROMPTS.md)
assets/ (chars/ cutins/ cg/ enemies/ bg/ title/ summon/ icons/ cards/ audio/, prompts.json)
fonts/  (Galmuri)
tools/
  sim.mjs          자동 플레이 시뮬레이션
  check-assets.mjs 그림 파일명·크기 검사
  export-prompts.mjs
  smoke.mjs        모든 화면을 띄워 오류 검사 (Playwright)
  gen-docs.mjs     docs/04 적 표를 js/data/enemies.js에서 만듦 (--check: CI)
prototype/index.html  처음 프로토타입 (참고용, 손대지 않음)
```

## 카드 데이터 모양 (예)
```js
'iris.slash': {
  ch: 'iris', name: '베기', type: 'attack', cost: 1, tags: ['slash'],
  text: '피해 {6}. 이번 턴 세 번째 베기부터 +{4}.',
  up: { text: '피해 {6}. 이번 턴 세 번째 베기부터 +{3}.' },   // 강화판
  play: (c, card) => { c.hit(6 + (c.slashes >= 2 ? 4 : 0)); c.slashes++; },
}
```
- `cost: 'time'`이면 시간 카드(기본 30분, 달·강화로 바뀜).
- 듀오는 `duo: ['iris','brick']`.
- 텍스트의 `{숫자}`는 힘·약화·연계를 반영해 화면에 실제 값으로 표시.

## 자동 플레이 시뮬레이션 (`tools/sim.mjs`)
- 간단한 봇(매 턴 가장 점수 높은 카드 조합을 고름)이 수천 판을 Node에서 돌린다.
- 뽑는 숫자: 막별 승률, 평균 도착 시각, 동료별·조합별 승률, 듀오 사용 빈도, 카드별 선택률.
- 수치를 바꾸면 돌려서 한 동료·한 카드만 튀지 않는지 본다. CI에서 짧게(200판) 돌려 오류만 잡는다.

## 저장
- 브라우저 localStorage. 판 진행(칸 이동마다 자동 저장), 가진 동료·별자리·별 조각·별가루·천장 횟수·도감·기록.
- 소환 결과는 저장된 시드로 굴려 새로고침으로 다시 뽑을 수 없게 한다.
- 저장 데이터에 버전 번호. 규칙이 바뀌면 진행 중인 판은 버리고 해금은 유지.

## 검사 (CI)
- `node tools/check-assets.mjs`, `node tools/export-prompts.mjs --check`, `node tools/smoke.mjs`, `node tools/sim.mjs --quick`.

## 성능·접근성
- 캔버스 대신 DOM + CSS(카드·버튼)와 작은 캔버스(컷인·효과)를 섞는다. 카드 글자를 또렷하게.
- `prefers-reduced-motion`이면 흔들림·컷인 짧게.
- 키보드: 1~5 카드, E 턴 끝, Esc 메뉴.

## 그림 로더 (`js/art.js`)
- `assets/art.json` = 실제로 있는 그림 목록. `node tools/art-index.mjs`(= `npm run art`)가 assets/ 폴더를 훑어 만든다. **그림을 넣거나 빼면 다시 돌릴 것** — CI(`npm run check`)가 `--check`로 맞는지 본다. 게임은 이 목록에 있는 파일만 부르므로 없는 그림을 요청해 404가 쌓이지 않는다.
- 목록이 오면(그림이 하나라도 있으면) 한 번 다시 그린다. 목록에 없으면 임시 도트(`js/render/sprites.js`)·임시 카드 일러스트(`js/render/cardart.js`) 그대로.
- 동료 `charSrc(id, kind)`(`js/render/common.js`): `chars/<id>_stand.png`(전투·파티·본부·타이틀, 두 번째 의상이면 `_outfit2` 먼저), `_normal/_smile/_serious`(얼굴·에피소드). 전투·파티·본부·에피소드·듀오 컷인·카드 얼굴이 다 이걸 쓴다.
- 적 `foeArt(f)`: 전투 데이터 적 키 → `enemies/<파일>.png`(이름 표는 `js/art.js`의 FOE_FILE), 보스 `boss_<id>_1/2`(2단계면 _2).
- 카드 `cardArtFile(d)`: `cards/card_<카드id의 점을 _로>.png`, 인연 듀오 `cards/duocard_<a>_<b>.png`. 강화판(+)은 원래 카드 그림. 저주·인연의 실 합동 카드는 임시 일러스트만.
- 그림 파일(assets/chars, assets/enemies)은 `object-fit: contain`으로 비율을 지키고, 카드 일러스트는 칸을 채운다(손패는 가운데 띠, 큰 카드·확대 보기는 4:3 전부).
- `tools/smoke.mjs`는 그림이 없어도 통과해야 한다(임시 도트).

## 카드 컴포넌트 (`cardHTML`, `js/render/common.js`)
- 위 4:3 일러스트 · 왼쪽 위 비용 보석(시간 카드는 시계 모양) · 이름 띠(동료 색, 듀오는 반반) · 효과 글 · 아래 동료 얼굴·이름·희귀도.
- 테두리 = 희귀도(흔함 은 / 보통 보라 / 희귀 금 + 깜빡이는 안쪽 빛), 듀오 금, 저주 검붉은 깨진 틀. 크기는 CSS 변수 `--ah`(일러스트 높이)와 자리별 너비로만 바꾼다(손패·큰 카드·야시장·덱·동료 화면·확대).
- 임시 일러스트(`js/render/cardart.js`): 원본 96×72에 밤하늘 디더 배경 + 그 동료 임시 도트 + 카드 글에서 고른 이펙트(베기 궤적, 포격, 방패, 독 안개, 화상, 정령, 잠, 회복, 별빛, 카드 뽑기, 공중, 달, 시간 카드 시계 바늘, 공격 대상 실루엣). 카드 id·의상 색마다 한 번만 그려 캐시.
- 확대 보기(`js/cardzoom.js`): 카드를 0.45초 길게 누르거나 오른쪽 클릭 → 크게 + 소멸·시간 카드 설명. 길게 누른 뒤의 클릭은 삼켜서 카드가 쓰이지 않는다.
