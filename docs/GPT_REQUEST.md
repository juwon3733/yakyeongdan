# GPT 그림 요청

전체 목록은 `docs/PROMPTS.md`. 카드 그림은 동료마다 4장(묶음 `cards-<동료 id>` 22개). 아래 글에서 `<묶음 id>`만 바꿔 GPT(이미지 에이전트)에게 보낸다. 한 번에 묶음 1~2개.

```
juwon3733/yakyeongdan 최신 main을 받고 AGENTS.md대로 그림을 만들어서 PR 올려줘.
범위: <묶음 id>

- 프롬프트는 assets/prompts.json에서 같은 id의 prompt를 한 글자도 고치지 말고 그대로 써.
- 동료 묶음은 설정화부터 만들고(올리지 마) 그걸 첨부해서 나머지를 한 대화 안에서 차례로.
- reference_images에 적힌 PNG는 반드시 첨부. 같은 얼굴·머리색·옷·나이로.
- 미성년(미미·모모, 핀, 토모리)은 단정하게. 글자·말풍선 금지.
- 크기는 width×height 정확히(잘라서 nearest-neighbor로), 투명 배경 지키고, node tools/check-assets.mjs 통과시켜.
- PR 본문에 한 장마다 "id — 꼭 보여야 할 것이 어디 있는지" 한 줄. 못 맞춘 건 솔직히.
- 브랜치는 assets/<묶음 id>-<월일시분>, 늘 새 이름. main에 직접 올리지 마.
```

## 매번 보내는 글 (그대로 복사, 고칠 것 없음)

```
juwon3733/yakyeongdan 최신 main을 받고 AGENTS.md대로 다음 그림 묶음을 알아서 골라 만들어 줘.

- `node tools/next-batch.mjs`를 돌려서 나온 「다음 묶음」 하나만 해. 내가 범위를 따로 안 정해.
- 프롬프트는 assets/prompts.json에서 같은 id의 prompt를 한 글자도 고치지 말고 그대로 써.
- reference_images에 적힌 PNG는 전부 첨부해. style/akane_c.png가 그림체 기준이야. 「이미 있음」으로 나온 그림은 다시 만들지 말고 기준으로 첨부만 해.
- 동료 묶음은 설정화부터 만들고(올리지 마) 그걸 첨부해서 나머지를 한 대화 안에서 차례로.
- 미성년(미미·모모, 핀, 토모리)은 단정하게. 글자·말풍선 금지. 크기는 width×height 정확히, 투명 배경, node tools/check-assets.mjs 통과.
- 브랜치는 assets/<묶음 id>-<월일시분>, 늘 새 이름. main에 직접 올리지 마. PR이 안 되면 브랜치 이름만 알려 줘.
- 끝나면 한 장마다 "id — 꼭 보여야 할 것이 어디 있는지" 한 줄, 못 맞춘 건 솔직히.
```

같은 글을 계속 보내면 된다. 검수 대기 중인 묶음(원격에 `assets/<묶음>-*` 브랜치가 있는 것)과 기준 그림이 아직 main에 없는 묶음은 도구가 알아서 건너뛴다. 순서는 `tools/next-batch.mjs`의 `ORDER`(★5부터).

## 예전 추천 순서 (참고)

처음 판에서 바로 보이는 것부터.

| 순서 | 묶음 | 이유 |
|---|---|---|
| 0 | `style-akane` (또는 `style-sion` `style-lunaria` `style-eleonore`) | **그림체 시안**. ★5 한 명을 도트 굵기만 바꿔 4장(A 기준·B 굵게·C 세밀·D 고화질). 사용자가 고른 시안으로 공통 스타일을 고정한 뒤 나머지를 뽑는다. 게임엔 안 씀 |
| 1 | `char-iris` `char-brick` `char-marta` | 처음부터 가진 동료 셋. 매 판 보임 |
| 2 | `bg` | 전투·지도·본부 배경 13장 |
| 3 | `enemy-act1` `boss-lighthouse` `boss-fog_queen` | 1막 적과 보스 둘(판마다 하나) |
| 4 | `title` | 타이틀 키아트(동료 셋 상반신이 있어야 함) |
| 5 | `char-noel` `char-raven` | 첫 10연 확정 후보 |
| 6 | `char-sion` `char-lunaria` `char-akane` `char-eleonore` → `cg-star5` | ★5 넷과 전신 CG |
| 7 | `enemy-act2` `boss-cloud_captain` `boss-storm_whale` `enemy-act3` `boss-dawn` | 2·3막 (「새벽」은 3단계 그림까지) |
| 8 | `summon` `icons` | 소환 화면, 도구 아이콘 |
| 9 | 나머지 `char-…` 11명 → `duo` | 듀오는 두 사람 상반신이 다 있어야 함 |
| 10 | `cards-iris` `cards-brick` `cards-marta` → 나머지 `cards-…` | 카드 그림. 그 동료 `char-…`가 main에 들어온 뒤에. 한 묶음 4장 |
| 11 | `cards-duo-1` ~ `cards-duo-5` | 인연 듀오 카드 50장. 두 사람 `char-…`가 다 있어야 함 |
| 12 | `char-nerea` `char-bertha` → `cards-nerea` `cards-bertha` | 2차 동료(★5 네레아·★4 베르타). 네레아 전신 CG는 `cg-star5`에 같이 들어 있다 |
