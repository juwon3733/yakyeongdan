# GPT 그림 요청

전체 471장, 묶음 56개(`docs/PROMPTS.md`). 그중 스킬 카드 그림이 270장(동료 카드 226 + 인연 듀오 44, 묶음 `cards-<동료 id>` 20개 + `cards-duo-1`~`4`). 아래 글에서 `<묶음 id>`만 바꿔 GPT(이미지 에이전트)에게 보낸다. 한 번에 묶음 1~2개.

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

## 추천 순서

처음 판에서 바로 보이는 것부터.

| 순서 | 묶음 | 이유 |
|---|---|---|
| 1 | `char-iris` `char-brick` `char-marta` | 처음부터 가진 동료 셋. 매 판 보임 |
| 2 | `bg` | 전투·지도·본부 배경 13장 |
| 3 | `enemy-act1` `boss-lighthouse` | 1막 적과 보스 |
| 4 | `title` | 타이틀 키아트(동료 셋 상반신이 있어야 함) |
| 5 | `char-noel` `char-raven` | 첫 10연 확정 후보 |
| 6 | `char-sion` `char-lunaria` `char-akane` `char-eleonore` → `cg-star5` | ★5 넷과 전신 CG |
| 7 | `enemy-act2` `boss-cloud_captain` `enemy-act3` `boss-dawn` | 2·3막 |
| 8 | `summon` `icons` | 소환 화면, 도구 아이콘 |
| 9 | 나머지 `char-…` 11명 → `duo` | 듀오는 두 사람 상반신이 다 있어야 함 |
| 10 | `cards-iris` `cards-brick` `cards-marta` → 나머지 `cards-…` | 스킬 카드 그림. 그 동료 `char-…`가 main에 들어온 뒤에. 한 묶음 9~13장 |
| 11 | `cards-duo-1` ~ `cards-duo-4` | 인연 듀오 카드 44장. 두 사람 `char-…`가 다 있어야 함 |
