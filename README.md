# 야경단

매일 밤 0시에 바다 위로 솟는 탑을, 해 뜨기 전 6시까지 꼭대기에 닿아야 하는 3인 파티 덱빌딩 로그라이크. 도트 캐릭터, 웹(가로 화면 우선).

- 밤 시계: 지도 칸과 일부 카드가 시간을 쓴다
- 연계·듀오: 세 동료의 카드가 섞이고, 번갈아 쓰면 두 사람의 듀오 카드가 생긴다 (인연 듀오 44쌍)
- 달: 판마다 달 모양이 달라 카드 효과가 바뀐다
- 별 소환: 판에서 모은 별 조각으로 동료·의상·카드 묶음을 뽑는다 (현금 없음)

## 문서
| 파일 | 내용 |
|---|---|
| [docs/01_overview.md](docs/01_overview.md) | 개요, 핵심 재미, 한 판 흐름 |
| [docs/02_rules.md](docs/02_rules.md) | 전투·밤 시계·연계/듀오·달·지도·보상·도구·사건 규칙과 수치 |
| [docs/03_characters.md](docs/03_characters.md) | 동료 20명(★5 4·★4 9·★3 7), 성급 차이, 카드, 듀오, 휴식 대화 |
| [docs/04_enemies.md](docs/04_enemies.md) | 막별 적·강적·보스 |
| [docs/05_meta.md](docs/05_meta.md) | 별 조각, 별 소환(가챠), 별자리, 교환소, 도감, 난이도 「밤의 깊이」 |
| [docs/06_art_ui_sound.md](docs/06_art_ui_sound.md) | 그림 규칙·목록, 화면, 연출, 소리 |
| [docs/07_tech.md](docs/07_tech.md) | 폴더 구조, 데이터 모양, 시뮬레이션, 저장, CI |
| [docs/08_roadmap.md](docs/08_roadmap.md) | 만드는 순서, 밸런스 목표, 미정 사항 |
| [docs/09_episodes.md](docs/09_episodes.md) | 이야기 원칙, 동료 에피소드 3화씩, 휴식 대화 |
| [docs/PROMPTS.md](docs/PROMPTS.md) | 그림 241장 목록·크기·프롬프트 (자동 생성) |
| [docs/GPT_REQUEST.md](docs/GPT_REQUEST.md) | GPT에 보낼 그림 요청 글, 묶음 추천 순서 |
| [docs/10_details.md](docs/10_details.md) | 카드 희귀도·보상, 저주, 도구 24개, 지도 만들기, 튜토리얼, 숫자 표시 |

## 로컬 실행
빌드 없음. 저장소 폴더에서 정적 서버를 띄운다(ES 모듈이라 파일을 직접 열면 안 됨).

```
npx serve .
# 또는
python3 -m http.server 8000   # → http://localhost:8000
```

- localhost나 주소 끝 `?dev`로 열면 개발판: 동료 5명을 다 고를 수 있다(공개판은 아이리스·브릭·마르타만).
- `?seed=123`으로 지도·달·셔플을 고정할 수 있다.
- 검사: `node tools/smoke.mjs` (Playwright 필요. 가로 1280×720으로 파티 고르기 → 대열 바꾸기 → 전투(노림·전투 중 자리 바꾸기·쓰러짐·동료 고르는 카드) → 보상 → 지도, 세로 화면 안내까지).
- 조작: 카드를 누르고 대상(적 또는 동료)을 누른다. 적을 치는 카드는 한 번 더 눌러도 쓴다. 개발판에선 `window.__yk.S`로 상태를 볼 수 있다.

## 코드 구조
`docs/07_tech.md` 참고. 규칙 데이터는 `js/data/`, 엔진은 `js/run.js`·`map.js`·`combat.js`·`effects.js`, 화면은 `js/render/`.

## 프로토타입
`prototype/index.html` — 처음 만든 한 파일 프로토타입(동료 5명, 3막, 연계·듀오, 달). 브라우저로 열면 바로 된다.
