# 그림 프롬프트 목록

> 자동 생성 파일. 고치지 말 것. 원본은 `js/asset_prompts.js`, 다시 만들기: `node tools/export-prompts.mjs`.

style_version 1 · 전체 241장 · 묶음 32개

## 묶음

| 묶음 id | 이름 | 장 수 |
|---|---|---|
| `char-sion` | ★★★★★ 시온 | 8 |
| `char-lunaria` | ★★★★★ 루나리아 | 8 |
| `char-akane` | ★★★★★ 아카네 | 8 |
| `char-eleonore` | ★★★★★ 엘레오노르 | 8 |
| `char-iris` | ★★★★ 아이리스 | 8 |
| `char-noel` | ★★★★ 노엘 | 8 |
| `char-raven` | ★★★★ 레이븐 | 8 |
| `char-mimimomo` | ★★★★ 미미·모모 | 8 |
| `char-sebas` | ★★★★ 세바스 | 8 |
| `char-mariana` | ★★★★ 마리아나 | 8 |
| `char-tomori` | ★★★★ 토모리 | 8 |
| `char-sigrun` | ★★★★ 시그룬 | 8 |
| `char-zeno` | ★★★★ 제노 | 8 |
| `char-brick` | ★★★ 브릭 | 8 |
| `char-marta` | ★★★ 마르타 | 8 |
| `char-finn` | ★★★ 핀 | 8 |
| `char-laila` | ★★★ 라일라 | 8 |
| `char-dora` | ★★★ 도라 | 8 |
| `char-gordon` | ★★★ 고든 | 8 |
| `char-fukuro` | ★★★ 후쿠로 | 8 |
| `cg-star5` | ★5 전신 CG | 4 |
| `duo` | 인연 듀오 컷인 (처음 8쌍) | 8 |
| `enemy-act1` | 1막 적 | 6 |
| `enemy-act2` | 2막 적 | 6 |
| `enemy-act3` | 3막 적 | 6 |
| `boss-lighthouse` | 보스 등대지기 | 3 |
| `boss-cloud_captain` | 보스 구름 기사단장 | 3 |
| `boss-dawn` | 보스 새벽 | 3 |
| `bg` | 배경 | 13 |
| `title` | 타이틀 키아트 | 1 |
| `summon` | 별 소환 연출 | 4 |
| `icons` | 도구 아이콘 24 | 24 |

## 종류별 크기

| 종류 | PNG 크기 | 게임 원본 도트 | 투명 | 최대 색 | 메모 |
|---|---|---|---|---|---|
| 서 있는 그림 (`stand`) | 1024×1536 | 128×192 | 예 | 256 | 전투 서 있는 전신 · 투명 배경 · 발끝이 아래 끝 근처, 머리 위 여백 |
| 상반신 (`portrait`) | 1024×1536 | 128×192 | 예 | 256 | 허리 위 상반신 · 투명 배경 · 양옆·위 여백, 허리만 아래 끝에 닿음 |
| 두 번째 의상 (`outfit`) | 1024×1536 | 128×192 | 예 | 256 | 두 번째 의상 전신 · 투명 배경 |
| 컷인 (`cutin`) | 1536×576 | 256×96 | 아니오 | 256 | 가로로 긴 얼굴·상체 클로즈업 · 1536×1024로 만든 뒤 가운데 띠를 잘라 냄 |
| 인연 듀오 컷인 (`duo`) | 1536×768 | 256×128 | 아니오 | 256 | 인연 듀오 · 두 사람 한 장 · 1536×1024로 만든 뒤 위아래를 잘라 냄 |
| ★5 전신 CG (`cg`) | 1536×864 | — | 아니오 | 제한 없음 | ★5 전신 CG · 16:9 · 화질 우선, 색 제한 없음 |
| 일반 적 (`enemy`) | 768×768 | 96×96 | 예 | 256 | 일반 적 · 투명 배경 |
| 강적 (`elite`) | 1024×1024 | 128×128 | 예 | 256 | 강적 · 투명 배경 |
| 보스 (`boss`) | 1024×1536 | 128×192 | 예 | 256 | 보스 · 투명 배경 |
| 배경 (`bg`) | 1280×720 | 320×180 | 아니오 | 256 | 배경 16:9 · 사람 없음 · 아래 1/3은 단순하게(캐릭터가 서는 자리) |
| 타이틀 (`title`) | 1536×864 | — | 아니오 | 제한 없음 | 타이틀 키아트 16:9 · 오른쪽 40%는 메뉴 자리 · 글자 금지 |
| 소환 배경 (`summon`) | 1536×864 | — | 아니오 | 제한 없음 | 소환 화면 밤하늘 16:9 |
| 별똥별 (`meteor`) | 512×512 | 64×64 | 예 | 256 | 별똥별 효과 · 투명 배경 |
| 도구 아이콘 (`icon`) | 192×192 | 24×24 | 예 | 64 | 도구 아이콘 · 투명 배경 · 24×24 도트를 8배 |
| 카드 그림 (`card`) | 512×352 | 64×44 | 아니오 | 128 | 카드 그림 · 1536×1024로 만든 뒤 가운데를 잘라 냄 |

## `char-sion` — ★★★★★ 시온

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a top-rarity (5-star) character: give the design the most care — an elaborate signature outfit, a striking weapon or prop, and a magical effect (glow, flames, stars, moonlight or clockwork) that makes the silhouette instantly recognizable.

Character reference sheet of 시온 (sion): a calm, beautiful woman in her late 20s, a star summoner. Very long straight silver-blue hair, gentle pale-blue eyes, a long dark-navy cloak printed with a glowing star map, an elegant gown with an open back under it, gold star ornaments in her hair, tiny glowing star spirits floating around her fingertips. Accent colors: silver-blue and gold. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `sion_stand` | `assets/chars/sion_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `sion_normal` | `assets/chars/sion_normal.png` | 1024×1536 투명 | — | — |
| `sion_smile` | `assets/chars/sion_smile.png` | 1024×1536 투명 | `assets/chars/sion_normal.png` | — |
| `sion_serious` | `assets/chars/sion_serious.png` | 1024×1536 투명 | `assets/chars/sion_normal.png` | — |
| `sion_cutin` | `assets/cutins/sion_cutin.png` | 1536×576 | `assets/chars/sion_normal.png` | 얼굴이 가운데 띠 안 |
| `sion_outfit2` | `assets/chars/sion_outfit2.png` | 1024×1536 투명 | `assets/chars/sion_normal.png` | — |
| `sion_call` | `assets/cards/sion_call.png` | 512×352 | `assets/chars/sion_normal.png` | — |
| `sion_galaxy` | `assets/cards/sion_galaxy.png` | 512×352 | `assets/chars/sion_normal.png` | — |

## `char-lunaria` — ★★★★★ 루나리아

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a top-rarity (5-star) character: give the design the most care — an elaborate signature outfit, a striking weapon or prop, and a magical effect (glow, flames, stars, moonlight or clockwork) that makes the silhouette instantly recognizable.

Character reference sheet of 루나리아 (lunaria): a graceful dancer woman in her mid 20s. Silver hair reaching her ankles, a crescent-moon hair ornament, a translucent veil, a dancer outfit with an open back and a bare midriff, little bells on her ankles, two folding fans that hold moonlight. Accent colors: moon silver and pale violet. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `lunaria_stand` | `assets/chars/lunaria_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `lunaria_normal` | `assets/chars/lunaria_normal.png` | 1024×1536 투명 | — | — |
| `lunaria_smile` | `assets/chars/lunaria_smile.png` | 1024×1536 투명 | `assets/chars/lunaria_normal.png` | — |
| `lunaria_serious` | `assets/chars/lunaria_serious.png` | 1024×1536 투명 | `assets/chars/lunaria_normal.png` | — |
| `lunaria_cutin` | `assets/cutins/lunaria_cutin.png` | 1536×576 | `assets/chars/lunaria_normal.png` | 얼굴이 가운데 띠 안 |
| `lunaria_outfit2` | `assets/chars/lunaria_outfit2.png` | 1024×1536 투명 | `assets/chars/lunaria_normal.png` | — |
| `lunaria_crescent` | `assets/cards/lunaria_crescent.png` | 512×352 | `assets/chars/lunaria_normal.png` | — |
| `lunaria_eclipse` | `assets/cards/lunaria_eclipse.png` | 512×352 | `assets/chars/lunaria_normal.png` | — |

## `char-akane` — ★★★★★ 아카네

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a top-rarity (5-star) character: give the design the most care — an elaborate signature outfit, a striking weapon or prop, and a magical effect (glow, flames, stars, moonlight or clockwork) that makes the silhouette instantly recognizable.

Character reference sheet of 아카네 (akane): a confident swordswoman in her mid 20s. Long crimson hair in a high ponytail, gold eyes, a red off-shoulder top with hakama-style armored skirt, two katana with flame-patterned blades, a cocky grin. Accent colors: crimson and gold. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `akane_stand` | `assets/chars/akane_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `akane_normal` | `assets/chars/akane_normal.png` | 1024×1536 투명 | — | — |
| `akane_smile` | `assets/chars/akane_smile.png` | 1024×1536 투명 | `assets/chars/akane_normal.png` | — |
| `akane_serious` | `assets/chars/akane_serious.png` | 1024×1536 투명 | `assets/chars/akane_normal.png` | — |
| `akane_cutin` | `assets/cutins/akane_cutin.png` | 1536×576 | `assets/chars/akane_normal.png` | 얼굴이 가운데 띠 안 |
| `akane_outfit2` | `assets/chars/akane_outfit2.png` | 1024×1536 투명 | `assets/chars/akane_normal.png` | — |
| `akane_slash` | `assets/cards/akane_slash.png` | 512×352 | `assets/chars/akane_normal.png` | — |
| `akane_flame` | `assets/cards/akane_flame.png` | 512×352 | `assets/chars/akane_normal.png` | — |

## `char-eleonore` — ★★★★★ 엘레오노르

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a top-rarity (5-star) character: give the design the most care — an elaborate signature outfit, a striking weapon or prop, and a magical effect (glow, flames, stars, moonlight or clockwork) that makes the silhouette instantly recognizable.

Character reference sheet of 엘레오노르 (eleonore): an elegant, haughty witch woman in her early 30s. Long black hair with a violet sheen, half-lidded violet eyes, a wide-brimmed witch hat decorated with clock faces, a gothic dress with a high side slit, a staff as tall as a person shaped like a giant clock hand, small brass gears floating around her. Accent colors: violet and brass. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `eleonore_stand` | `assets/chars/eleonore_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `eleonore_normal` | `assets/chars/eleonore_normal.png` | 1024×1536 투명 | — | — |
| `eleonore_smile` | `assets/chars/eleonore_smile.png` | 1024×1536 투명 | `assets/chars/eleonore_normal.png` | — |
| `eleonore_serious` | `assets/chars/eleonore_serious.png` | 1024×1536 투명 | `assets/chars/eleonore_normal.png` | — |
| `eleonore_cutin` | `assets/cutins/eleonore_cutin.png` | 1536×576 | `assets/chars/eleonore_normal.png` | 얼굴이 가운데 띠 안 |
| `eleonore_outfit2` | `assets/chars/eleonore_outfit2.png` | 1024×1536 투명 | `assets/chars/eleonore_normal.png` | — |
| `eleonore_arrow` | `assets/cards/eleonore_arrow.png` | 512×352 | `assets/chars/eleonore_normal.png` | — |
| `eleonore_midnight` | `assets/cards/eleonore_midnight.png` | 512×352 | `assets/chars/eleonore_normal.png` | — |

## `char-iris` — ★★★★ 아이리스

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a 4-star character: one flashy signature prop or accessory, otherwise clean.

Character reference sheet of 아이리스 (iris): a cool, quiet swordswoman in her early 20s. Waist-length straight black hair, pale-blue eyes, a long silver coat styled as light armor, a slim longsword, an expressionless but kind face. Accent colors: silver and pale blue. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `iris_stand` | `assets/chars/iris_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `iris_normal` | `assets/chars/iris_normal.png` | 1024×1536 투명 | — | — |
| `iris_smile` | `assets/chars/iris_smile.png` | 1024×1536 투명 | `assets/chars/iris_normal.png` | — |
| `iris_serious` | `assets/chars/iris_serious.png` | 1024×1536 투명 | `assets/chars/iris_normal.png` | — |
| `iris_cutin` | `assets/cutins/iris_cutin.png` | 1536×576 | `assets/chars/iris_normal.png` | 얼굴이 가운데 띠 안 |
| `iris_outfit2` | `assets/chars/iris_outfit2.png` | 1024×1536 투명 | `assets/chars/iris_normal.png` | — |
| `iris_slash` | `assets/cards/iris_slash.png` | 512×352 | `assets/chars/iris_normal.png` | — |
| `iris_issen` | `assets/cards/iris_issen.png` | 512×352 | `assets/chars/iris_normal.png` | — |

## `char-noel` — ★★★★ 노엘

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a 4-star character: one flashy signature prop or accessory, otherwise clean.

Character reference sheet of 노엘 (noel): a sleepy sorceress woman in her early 20s. Long wavy pink hair, half-closed light-blue eyes, an off-shoulder robe that looks like pajamas, holding a huge pillow like a staff, a nightcap with a star tip. Accent colors: pink and lavender. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `noel_stand` | `assets/chars/noel_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `noel_normal` | `assets/chars/noel_normal.png` | 1024×1536 투명 | — | — |
| `noel_smile` | `assets/chars/noel_smile.png` | 1024×1536 투명 | `assets/chars/noel_normal.png` | — |
| `noel_serious` | `assets/chars/noel_serious.png` | 1024×1536 투명 | `assets/chars/noel_normal.png` | — |
| `noel_cutin` | `assets/cutins/noel_cutin.png` | 1536×576 | `assets/chars/noel_normal.png` | 얼굴이 가운데 띠 안 |
| `noel_outfit2` | `assets/chars/noel_outfit2.png` | 1024×1536 투명 | `assets/chars/noel_normal.png` | — |
| `noel_sleep` | `assets/cards/noel_sleep.png` | 512×352 | `assets/chars/noel_normal.png` | — |
| `noel_star` | `assets/cards/noel_star.png` | 512×352 | `assets/chars/noel_normal.png` | — |

## `char-raven` — ★★★★ 레이븐

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a 4-star character: one flashy signature prop or accessory, otherwise clean.

Character reference sheet of 레이븐 (raven): a cynical assassin man in his late 20s. Short silver hair, a crow-beak half mask covering the upper face, red eyes visible through the mask, a black feathered coat, a poison-needle device on his wrist. Accent colors: black and violet. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `raven_stand` | `assets/chars/raven_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `raven_normal` | `assets/chars/raven_normal.png` | 1024×1536 투명 | — | — |
| `raven_smile` | `assets/chars/raven_smile.png` | 1024×1536 투명 | `assets/chars/raven_normal.png` | — |
| `raven_serious` | `assets/chars/raven_serious.png` | 1024×1536 투명 | `assets/chars/raven_normal.png` | — |
| `raven_cutin` | `assets/cutins/raven_cutin.png` | 1536×576 | `assets/chars/raven_normal.png` | 얼굴이 가운데 띠 안 |
| `raven_outfit2` | `assets/chars/raven_outfit2.png` | 1024×1536 투명 | `assets/chars/raven_normal.png` | — |
| `raven_needle` | `assets/cards/raven_needle.png` | 512×352 | `assets/chars/raven_normal.png` | — |
| `raven_feather` | `assets/cards/raven_feather.png` | 512×352 | `assets/chars/raven_normal.png` | — |

## `char-mimimomo` — ★★★★ 미미·모모

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a 4-star character: one flashy signature prop or accessory, otherwise clean.

Character reference sheet of 미미·모모 (mimimomo): twin 12-year-old girls shown together. Mimi: pink bob hair with a ribbon on her RIGHT side. Momo: sky-blue bob hair with a ribbon on her LEFT side. Matching modest sailor-style dresses (knee length, covered shoulders) in mirrored colors, Mimi holds a small dagger, Momo holds an umbrella. Children, drawn modestly and age-appropriately. Accent colors: pink and sky blue. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `mimimomo_stand` | `assets/chars/mimimomo_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `mimimomo_normal` | `assets/chars/mimimomo_normal.png` | 1024×1536 투명 | — | — |
| `mimimomo_smile` | `assets/chars/mimimomo_smile.png` | 1024×1536 투명 | `assets/chars/mimimomo_normal.png` | — |
| `mimimomo_serious` | `assets/chars/mimimomo_serious.png` | 1024×1536 투명 | `assets/chars/mimimomo_normal.png` | — |
| `mimimomo_cutin` | `assets/cutins/mimimomo_cutin.png` | 1536×576 | `assets/chars/mimimomo_normal.png` | 얼굴이 가운데 띠 안 |
| `mimimomo_outfit2` | `assets/chars/mimimomo_outfit2.png` | 1024×1536 투명 | `assets/chars/mimimomo_normal.png` | — |
| `mimimomo_pierce` | `assets/cards/mimimomo_pierce.png` | 512×352 | `assets/chars/mimimomo_normal.png` | — |
| `mimimomo_guard` | `assets/cards/mimimomo_guard.png` | 512×352 | `assets/chars/mimimomo_normal.png` | — |

## `char-sebas` — ★★★★ 세바스

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a 4-star character: one flashy signature prop or accessory, otherwise clean.

Character reference sheet of 세바스 (sebas): a dignified butler man in his 60s, clearly elderly (wrinkles, grey mustache). Slicked-back silver hair, a monocle, a black tailcoat, white gloves, a pocket watch on a chain and a cane that hides a sword. Accent colors: black and silver. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `sebas_stand` | `assets/chars/sebas_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `sebas_normal` | `assets/chars/sebas_normal.png` | 1024×1536 투명 | — | — |
| `sebas_smile` | `assets/chars/sebas_smile.png` | 1024×1536 투명 | `assets/chars/sebas_normal.png` | — |
| `sebas_serious` | `assets/chars/sebas_serious.png` | 1024×1536 투명 | `assets/chars/sebas_normal.png` | — |
| `sebas_cutin` | `assets/cutins/sebas_cutin.png` | 1536×576 | `assets/chars/sebas_normal.png` | 얼굴이 가운데 띠 안 |
| `sebas_outfit2` | `assets/chars/sebas_outfit2.png` | 1024×1536 투명 | `assets/chars/sebas_normal.png` | — |
| `sebas_tea` | `assets/cards/sebas_tea.png` | 512×352 | `assets/chars/sebas_normal.png` | — |
| `sebas_watch` | `assets/cards/sebas_watch.png` | 512×352 | `assets/chars/sebas_normal.png` | — |

## `char-mariana` — ★★★★ 마리아나

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a 4-star character: one flashy signature prop or accessory, otherwise clean.

Character reference sheet of 마리아나 (mariana): a bold pirate queen woman in her late 20s. Long wavy brown hair, a feathered tricorn hat, a corset coat with short pants and tall boots, a gold coin necklace, a flintlock pistol. Accent colors: gold and deep red. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `mariana_stand` | `assets/chars/mariana_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `mariana_normal` | `assets/chars/mariana_normal.png` | 1024×1536 투명 | — | — |
| `mariana_smile` | `assets/chars/mariana_smile.png` | 1024×1536 투명 | `assets/chars/mariana_normal.png` | — |
| `mariana_serious` | `assets/chars/mariana_serious.png` | 1024×1536 투명 | `assets/chars/mariana_normal.png` | — |
| `mariana_cutin` | `assets/cutins/mariana_cutin.png` | 1536×576 | `assets/chars/mariana_normal.png` | 얼굴이 가운데 띠 안 |
| `mariana_outfit2` | `assets/chars/mariana_outfit2.png` | 1024×1536 투명 | `assets/chars/mariana_normal.png` | — |
| `mariana_coin` | `assets/cards/mariana_coin.png` | 512×352 | `assets/chars/mariana_normal.png` | — |
| `mariana_cannon` | `assets/cards/mariana_cannon.png` | 512×352 | `assets/chars/mariana_normal.png` | — |

## `char-tomori` — ★★★★ 토모리

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a 4-star character: one flashy signature prop or accessory, otherwise clean.

Character reference sheet of 토모리 (tomori): a cheerful 17-year-old girl, the lighthouse keeper's granddaughter. Long chestnut hair in a braid, a yellow raincoat, a modest dress below the knees, rain boots, holding a big glowing lantern. Drawn modestly and age-appropriately. Accent colors: yellow and warm orange. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `tomori_stand` | `assets/chars/tomori_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `tomori_normal` | `assets/chars/tomori_normal.png` | 1024×1536 투명 | — | — |
| `tomori_smile` | `assets/chars/tomori_smile.png` | 1024×1536 투명 | `assets/chars/tomori_normal.png` | — |
| `tomori_serious` | `assets/chars/tomori_serious.png` | 1024×1536 투명 | `assets/chars/tomori_normal.png` | — |
| `tomori_cutin` | `assets/cutins/tomori_cutin.png` | 1536×576 | `assets/chars/tomori_normal.png` | 얼굴이 가운데 띠 안 |
| `tomori_outfit2` | `assets/chars/tomori_outfit2.png` | 1024×1536 투명 | `assets/chars/tomori_normal.png` | — |
| `tomori_lantern` | `assets/cards/tomori_lantern.png` | 512×352 | `assets/chars/tomori_normal.png` | — |
| `tomori_signal` | `assets/cards/tomori_signal.png` | 512×352 | `assets/chars/tomori_normal.png` | — |

## `char-sigrun` — ★★★★ 시그룬

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a 4-star character: one flashy signature prop or accessory, otherwise clean.

Character reference sheet of 시그룬 (sigrun): a noble knight woman in her late 20s. Long blond hair, silver armor with wing ornaments, a white feather cape, a long lance, a dignified expression. Accent colors: silver and white. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `sigrun_stand` | `assets/chars/sigrun_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `sigrun_normal` | `assets/chars/sigrun_normal.png` | 1024×1536 투명 | — | — |
| `sigrun_smile` | `assets/chars/sigrun_smile.png` | 1024×1536 투명 | `assets/chars/sigrun_normal.png` | — |
| `sigrun_serious` | `assets/chars/sigrun_serious.png` | 1024×1536 투명 | `assets/chars/sigrun_normal.png` | — |
| `sigrun_cutin` | `assets/cutins/sigrun_cutin.png` | 1536×576 | `assets/chars/sigrun_normal.png` | 얼굴이 가운데 띠 안 |
| `sigrun_outfit2` | `assets/chars/sigrun_outfit2.png` | 1024×1536 투명 | `assets/chars/sigrun_normal.png` | — |
| `sigrun_dive` | `assets/cards/sigrun_dive.png` | 512×352 | `assets/chars/sigrun_normal.png` | — |
| `sigrun_rise` | `assets/cards/sigrun_rise.png` | 512×352 | `assets/chars/sigrun_normal.png` | — |

## `char-zeno` — ★★★★ 제노

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a 4-star character: one flashy signature prop or accessory, otherwise clean.

Character reference sheet of 제노 (zeno): a silent dark knight man in his late 20s. Long black hair, one eye a golden dragon eye, black armor with dragon scales, a huge greatsword on his back. Accent colors: black and dragon gold. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `zeno_stand` | `assets/chars/zeno_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `zeno_normal` | `assets/chars/zeno_normal.png` | 1024×1536 투명 | — | — |
| `zeno_smile` | `assets/chars/zeno_smile.png` | 1024×1536 투명 | `assets/chars/zeno_normal.png` | — |
| `zeno_serious` | `assets/chars/zeno_serious.png` | 1024×1536 투명 | `assets/chars/zeno_normal.png` | — |
| `zeno_cutin` | `assets/cutins/zeno_cutin.png` | 1536×576 | `assets/chars/zeno_normal.png` | 얼굴이 가운데 띠 안 |
| `zeno_outfit2` | `assets/chars/zeno_outfit2.png` | 1024×1536 투명 | `assets/chars/zeno_normal.png` | — |
| `zeno_slash` | `assets/cards/zeno_slash.png` | 512×352 | `assets/chars/zeno_normal.png` | — |
| `zeno_roar` | `assets/cards/zeno_roar.png` | 512×352 | `assets/chars/zeno_normal.png` | — |

## `char-brick` — ★★★ 브릭

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a 3-star character: simple, friendly and approachable design, still cute or cool.

Character reference sheet of 브릭 (brick): an energetic gunner woman in her mid 20s. Short red hair, goggles pushed up on her head, a huge hand cannon bigger than her body, a cropped work top that shows her shoulders and midriff, suspender shorts, work boots. Accent colors: red and brass. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `brick_stand` | `assets/chars/brick_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `brick_normal` | `assets/chars/brick_normal.png` | 1024×1536 투명 | — | — |
| `brick_smile` | `assets/chars/brick_smile.png` | 1024×1536 투명 | `assets/chars/brick_normal.png` | — |
| `brick_serious` | `assets/chars/brick_serious.png` | 1024×1536 투명 | `assets/chars/brick_normal.png` | — |
| `brick_cutin` | `assets/cutins/brick_cutin.png` | 1536×576 | `assets/chars/brick_normal.png` | 얼굴이 가운데 띠 안 |
| `brick_outfit2` | `assets/chars/brick_outfit2.png` | 1024×1536 투명 | `assets/chars/brick_normal.png` | — |
| `brick_load` | `assets/cards/brick_load.png` | 512×352 | `assets/chars/brick_normal.png` | — |
| `brick_fire` | `assets/cards/brick_fire.png` | 512×352 | `assets/chars/brick_normal.png` | — |

## `char-marta` — ★★★ 마르타

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a 3-star character: simple, friendly and approachable design, still cute or cool.

Character reference sheet of 마르타 (marta): a very tall, muscular nun woman in her 30s, about 2 meters tall. Long blond hair in a braid, a nun habit with a high side slit showing her legs, iron gauntlets, a gentle smile. Accent colors: gold and white. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `marta_stand` | `assets/chars/marta_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `marta_normal` | `assets/chars/marta_normal.png` | 1024×1536 투명 | — | — |
| `marta_smile` | `assets/chars/marta_smile.png` | 1024×1536 투명 | `assets/chars/marta_normal.png` | — |
| `marta_serious` | `assets/chars/marta_serious.png` | 1024×1536 투명 | `assets/chars/marta_normal.png` | — |
| `marta_cutin` | `assets/cutins/marta_cutin.png` | 1536×576 | `assets/chars/marta_normal.png` | 얼굴이 가운데 띠 안 |
| `marta_outfit2` | `assets/chars/marta_outfit2.png` | 1024×1536 투명 | `assets/chars/marta_normal.png` | — |
| `marta_wall` | `assets/cards/marta_wall.png` | 512×352 | `assets/chars/marta_normal.png` | — |
| `marta_fist` | `assets/cards/marta_fist.png` | 512×352 | `assets/chars/marta_normal.png` | — |

## `char-finn` — ★★★ 핀

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a 3-star character: simple, friendly and approachable design, still cute or cool.

Character reference sheet of 핀 (finn): a lively 14-year-old mail delivery boy. Curly brown hair, a mail cap, a huge mailbag bigger than his body, shorts with long socks, running shoes. Drawn modestly and age-appropriately. Accent colors: brown and red. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `finn_stand` | `assets/chars/finn_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `finn_normal` | `assets/chars/finn_normal.png` | 1024×1536 투명 | — | — |
| `finn_smile` | `assets/chars/finn_smile.png` | 1024×1536 투명 | `assets/chars/finn_normal.png` | — |
| `finn_serious` | `assets/chars/finn_serious.png` | 1024×1536 투명 | `assets/chars/finn_normal.png` | — |
| `finn_cutin` | `assets/cutins/finn_cutin.png` | 1536×576 | `assets/chars/finn_normal.png` | 얼굴이 가운데 띠 안 |
| `finn_outfit2` | `assets/chars/finn_outfit2.png` | 1024×1536 투명 | `assets/chars/finn_normal.png` | — |
| `finn_letter` | `assets/cards/finn_letter.png` | 512×352 | `assets/chars/finn_normal.png` | — |
| `finn_express` | `assets/cards/finn_express.png` | 512×352 | `assets/chars/finn_normal.png` | — |

## `char-laila` — ★★★ 라일라

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a 3-star character: simple, friendly and approachable design, still cute or cool.

Character reference sheet of 라일라 (laila): a brusque deserter knight woman in her early 20s. Long sky-blue hair tied back, a torn knight cape, a short top and leg wraps, twin daggers. Accent colors: sky blue and grey. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `laila_stand` | `assets/chars/laila_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `laila_normal` | `assets/chars/laila_normal.png` | 1024×1536 투명 | — | — |
| `laila_smile` | `assets/chars/laila_smile.png` | 1024×1536 투명 | `assets/chars/laila_normal.png` | — |
| `laila_serious` | `assets/chars/laila_serious.png` | 1024×1536 투명 | `assets/chars/laila_normal.png` | — |
| `laila_cutin` | `assets/cutins/laila_cutin.png` | 1536×576 | `assets/chars/laila_normal.png` | 얼굴이 가운데 띠 안 |
| `laila_outfit2` | `assets/chars/laila_outfit2.png` | 1024×1536 투명 | `assets/chars/laila_normal.png` | — |
| `laila_wind` | `assets/cards/laila_wind.png` | 512×352 | `assets/chars/laila_normal.png` | — |
| `laila_storm` | `assets/cards/laila_storm.png` | 512×352 | `assets/chars/laila_normal.png` | — |

## `char-dora` — ★★★ 도라

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a 3-star character: simple, friendly and approachable design, still cute or cool.

Character reference sheet of 도라 (dora): a cheerful 19-year-old blacksmith woman. Long brown hair in a ponytail, tanned arms, a leather apron over a tank top, a big hammer on her shoulder. Accent colors: brown and orange. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `dora_stand` | `assets/chars/dora_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `dora_normal` | `assets/chars/dora_normal.png` | 1024×1536 투명 | — | — |
| `dora_smile` | `assets/chars/dora_smile.png` | 1024×1536 투명 | `assets/chars/dora_normal.png` | — |
| `dora_serious` | `assets/chars/dora_serious.png` | 1024×1536 투명 | `assets/chars/dora_normal.png` | — |
| `dora_cutin` | `assets/cutins/dora_cutin.png` | 1536×576 | `assets/chars/dora_normal.png` | 얼굴이 가운데 띠 안 |
| `dora_outfit2` | `assets/chars/dora_outfit2.png` | 1024×1536 투명 | `assets/chars/dora_normal.png` | — |
| `dora_hammer` | `assets/cards/dora_hammer.png` | 512×352 | `assets/chars/dora_normal.png` | — |
| `dora_temper` | `assets/cards/dora_temper.png` | 512×352 | `assets/chars/dora_normal.png` | — |

## `char-gordon` — ★★★ 고든

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a 3-star character: simple, friendly and approachable design, still cute or cool.

Character reference sheet of 고든 (gordon): a big burly cook man in his 40s. A bushy beard, a white chef uniform, a frying pan and a ladle, a kind face. Accent colors: white and warm brown. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `gordon_stand` | `assets/chars/gordon_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `gordon_normal` | `assets/chars/gordon_normal.png` | 1024×1536 투명 | — | — |
| `gordon_smile` | `assets/chars/gordon_smile.png` | 1024×1536 투명 | `assets/chars/gordon_normal.png` | — |
| `gordon_serious` | `assets/chars/gordon_serious.png` | 1024×1536 투명 | `assets/chars/gordon_normal.png` | — |
| `gordon_cutin` | `assets/cutins/gordon_cutin.png` | 1536×576 | `assets/chars/gordon_normal.png` | 얼굴이 가운데 띠 안 |
| `gordon_outfit2` | `assets/chars/gordon_outfit2.png` | 1024×1536 투명 | `assets/chars/gordon_normal.png` | — |
| `gordon_soup` | `assets/cards/gordon_soup.png` | 512×352 | `assets/chars/gordon_normal.png` | — |
| `gordon_pan` | `assets/cards/gordon_pan.png` | 512×352 | `assets/chars/gordon_normal.png` | — |

## `char-fukuro` — ★★★ 후쿠로

<details><summary>설정화 프롬프트 (저장소에 올리지 않음)</summary>

```
이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.

Authentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.

Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.

This is a 3-star character: simple, friendly and approachable design, still cute or cool.

Character reference sheet of 후쿠로 (fukuro): a mysterious night-market merchant man of unknown age. An owl mask covering his whole face, a huge bundle on his back hung with lanterns and trinkets, a patched robe. Accent colors: brown and lantern orange. Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.
```
</details>

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `fukuro_stand` | `assets/chars/fukuro_stand.png` | 1024×1536 투명 | — | 전신, 오른쪽을 향한 전투 자세, 무기 |
| `fukuro_normal` | `assets/chars/fukuro_normal.png` | 1024×1536 투명 | — | — |
| `fukuro_smile` | `assets/chars/fukuro_smile.png` | 1024×1536 투명 | `assets/chars/fukuro_normal.png` | — |
| `fukuro_serious` | `assets/chars/fukuro_serious.png` | 1024×1536 투명 | `assets/chars/fukuro_normal.png` | — |
| `fukuro_cutin` | `assets/cutins/fukuro_cutin.png` | 1536×576 | `assets/chars/fukuro_normal.png` | 얼굴이 가운데 띠 안 |
| `fukuro_outfit2` | `assets/chars/fukuro_outfit2.png` | 1024×1536 투명 | `assets/chars/fukuro_normal.png` | — |
| `fukuro_junk` | `assets/cards/fukuro_junk.png` | 512×352 | `assets/chars/fukuro_normal.png` | — |
| `fukuro_charm` | `assets/cards/fukuro_charm.png` | 512×352 | `assets/chars/fukuro_normal.png` | — |

## `cg-star5` — ★5 전신 CG

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `star5_sion` | `assets/cg/star5_sion.png` | 1536×864 | `assets/chars/sion_normal.png` `assets/chars/sion_stand.png` | — |
| `star5_lunaria` | `assets/cg/star5_lunaria.png` | 1536×864 | `assets/chars/lunaria_normal.png` `assets/chars/lunaria_stand.png` | — |
| `star5_akane` | `assets/cg/star5_akane.png` | 1536×864 | `assets/chars/akane_normal.png` `assets/chars/akane_stand.png` | — |
| `star5_eleonore` | `assets/cg/star5_eleonore.png` | 1536×864 | `assets/chars/eleonore_normal.png` `assets/chars/eleonore_stand.png` | — |

## `duo` — 인연 듀오 컷인 (처음 8쌍)

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `duo_iris_marta` | `assets/cutins/duo_iris_marta.png` | 1536×768 | `assets/chars/iris_normal.png` `assets/chars/marta_normal.png` | 두 사람 얼굴 둘 다 |
| `duo_iris_akane` | `assets/cutins/duo_iris_akane.png` | 1536×768 | `assets/chars/iris_normal.png` `assets/chars/akane_normal.png` | 두 사람 얼굴 둘 다 |
| `duo_iris_brick` | `assets/cutins/duo_iris_brick.png` | 1536×768 | `assets/chars/iris_normal.png` `assets/chars/brick_normal.png` | 두 사람 얼굴 둘 다 |
| `duo_brick_mariana` | `assets/cutins/duo_brick_mariana.png` | 1536×768 | `assets/chars/brick_normal.png` `assets/chars/mariana_normal.png` | 두 사람 얼굴 둘 다 |
| `duo_sigrun_laila` | `assets/cutins/duo_sigrun_laila.png` | 1536×768 | `assets/chars/sigrun_normal.png` `assets/chars/laila_normal.png` | 두 사람 얼굴 둘 다 |
| `duo_lunaria_sion` | `assets/cutins/duo_lunaria_sion.png` | 1536×768 | `assets/chars/lunaria_normal.png` `assets/chars/sion_normal.png` | 두 사람 얼굴 둘 다 |
| `duo_eleonore_sebas` | `assets/cutins/duo_eleonore_sebas.png` | 1536×768 | `assets/chars/eleonore_normal.png` `assets/chars/sebas_normal.png` | 두 사람 얼굴 둘 다 |
| `duo_zeno_marta` | `assets/cutins/duo_zeno_marta.png` | 1536×768 | `assets/chars/zeno_normal.png` `assets/chars/marta_normal.png` | 두 사람 얼굴 둘 다 |

## `enemy-act1` — 1막 적

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `sea_ghost` | `assets/enemies/sea_ghost.png` | 768×768 투명 | — | — |
| `crab_soldier` | `assets/enemies/crab_soldier.png` | 768×768 투명 | — | — |
| `dock_pirate` | `assets/enemies/dock_pirate.png` | 768×768 투명 | — | — |
| `gulls` | `assets/enemies/gulls.png` | 768×768 투명 | — | — |
| `anchor_giant` | `assets/enemies/anchor_giant.png` | 1024×1024 투명 | — | — |
| `fog_witch` | `assets/enemies/fog_witch.png` | 1024×1024 투명 | — | — |

## `enemy-act2` — 2막 적

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `cloud_spirit` | `assets/enemies/cloud_spirit.png` | 768×768 투명 | — | — |
| `feather_knight` | `assets/enemies/feather_knight.png` | 768×768 투명 | — | — |
| `thunder_sheep` | `assets/enemies/thunder_sheep.png` | 768×768 투명 | — | — |
| `vane_soldier` | `assets/enemies/vane_soldier.png` | 768×768 투명 | — | — |
| `thunderbird` | `assets/enemies/thunderbird.png` | 1024×1024 투명 | — | — |
| `twin_vanes` | `assets/enemies/twin_vanes.png` | 1024×1024 투명 | — | — |

## `enemy-act3` — 3막 적

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `star_statue` | `assets/enemies/star_statue.png` | 768×768 투명 | — | — |
| `shadow_cat` | `assets/enemies/shadow_cat.png` | 768×768 투명 | — | — |
| `meteor_archer` | `assets/enemies/meteor_archer.png` | 768×768 투명 | — | — |
| `clock_angel` | `assets/enemies/clock_angel.png` | 768×768 투명 | — | — |
| `meteor_rider` | `assets/enemies/meteor_rider.png` | 1024×1024 투명 | — | — |
| `moon_shadow` | `assets/enemies/moon_shadow.png` | 1024×1024 투명 | — | — |

## `boss-lighthouse` — 보스 등대지기

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `boss_lighthouse_1` | `assets/enemies/boss_lighthouse_1.png` | 1024×1536 투명 | — | — |
| `boss_lighthouse_2` | `assets/enemies/boss_lighthouse_2.png` | 1024×1536 투명 | `assets/enemies/boss_lighthouse_1.png` | — |
| `boss_lighthouse_cutin` | `assets/cutins/boss_lighthouse_cutin.png` | 1536×576 | `assets/enemies/boss_lighthouse_1.png` | — |

## `boss-cloud_captain` — 보스 구름 기사단장

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `boss_cloud_captain_1` | `assets/enemies/boss_cloud_captain_1.png` | 1024×1536 투명 | — | — |
| `boss_cloud_captain_2` | `assets/enemies/boss_cloud_captain_2.png` | 1024×1536 투명 | `assets/enemies/boss_cloud_captain_1.png` | — |
| `boss_cloud_captain_cutin` | `assets/cutins/boss_cloud_captain_cutin.png` | 1536×576 | `assets/enemies/boss_cloud_captain_1.png` | — |

## `boss-dawn` — 보스 새벽

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `boss_dawn_1` | `assets/enemies/boss_dawn_1.png` | 1024×1536 투명 | — | — |
| `boss_dawn_2` | `assets/enemies/boss_dawn_2.png` | 1024×1536 투명 | `assets/enemies/boss_dawn_1.png` | — |
| `boss_dawn_cutin` | `assets/cutins/boss_dawn_cutin.png` | 1536×576 | `assets/enemies/boss_dawn_1.png` | — |

## `bg` — 배경

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `bg_act1` | `assets/bg/act1.png` | 1280×720 | — | — |
| `bg_act2` | `assets/bg/act2.png` | 1280×720 | — | — |
| `bg_act3` | `assets/bg/act3.png` | 1280×720 | — | — |
| `bg_hq` | `assets/bg/hq.png` | 1280×720 | — | — |
| `bg_map1` | `assets/bg/map1.png` | 1280×720 | — | — |
| `bg_map2` | `assets/bg/map2.png` | 1280×720 | — | — |
| `bg_map3` | `assets/bg/map3.png` | 1280×720 | — | — |
| `bg_ep_clocktower` | `assets/bg/ep_clocktower.png` | 1280×720 | — | — |
| `bg_ep_convent` | `assets/bg/ep_convent.png` | 1280×720 | — | — |
| `bg_ep_nightmarket` | `assets/bg/ep_nightmarket.png` | 1280×720 | — | — |
| `bg_ep_lighthouse` | `assets/bg/ep_lighthouse.png` | 1280×720 | — | — |
| `bg_ep_kitchen` | `assets/bg/ep_kitchen.png` | 1280×720 | — | — |
| `bg_ep_harbor` | `assets/bg/ep_harbor.png` | 1280×720 | — | — |

## `title` — 타이틀 키아트

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `title_key` | `assets/title/key.png` | 1536×864 | `assets/chars/iris_normal.png` `assets/chars/brick_normal.png` `assets/chars/marta_normal.png` | — |

## `summon` — 별 소환 연출

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `summon_sky` | `assets/summon/sky.png` | 1536×864 | — | — |
| `meteor_3` | `assets/summon/meteor_3.png` | 512×512 투명 | — | — |
| `meteor_4` | `assets/summon/meteor_4.png` | 512×512 투명 | — | — |
| `meteor_5` | `assets/summon/meteor_5.png` | 512×512 투명 | — | — |

## `icons` — 도구 아이콘 24

| id | 파일 | 크기 | 첨부 | 꼭 보여야 할 것 |
|---|---|---|---|---|
| `relic_old_watch` | `assets/icons/relic_old_watch.png` | 192×192 투명 | — | — |
| `relic_lantern` | `assets/icons/relic_lantern.png` | 192×192 투명 | — | — |
| `relic_first_aid` | `assets/icons/relic_first_aid.png` | 192×192 투명 | — | — |
| `relic_twin_ribbon` | `assets/icons/relic_twin_ribbon.png` | 192×192 투명 | — | — |
| `relic_salt_pouch` | `assets/icons/relic_salt_pouch.png` | 192×192 투명 | — | — |
| `relic_sea_glass` | `assets/icons/relic_sea_glass.png` | 192×192 투명 | — | — |
| `relic_compass` | `assets/icons/relic_compass.png` | 192×192 투명 | — | — |
| `relic_umbrella` | `assets/icons/relic_umbrella.png` | 192×192 투명 | — | — |
| `relic_scarf` | `assets/icons/relic_scarf.png` | 192×192 투명 | — | — |
| `relic_star_candy` | `assets/icons/relic_star_candy.png` | 192×192 투명 | — | — |
| `relic_star_map` | `assets/icons/relic_star_map.png` | 192×192 투명 | — | — |
| `relic_hourglass` | `assets/icons/relic_hourglass.png` | 192×192 투명 | — | — |
| `relic_whistle` | `assets/icons/relic_whistle.png` | 192×192 투명 | — | — |
| `relic_banner` | `assets/icons/relic_banner.png` | 192×192 투명 | — | — |
| `relic_bandage` | `assets/icons/relic_bandage.png` | 192×192 투명 | — | — |
| `relic_moon_bottle` | `assets/icons/relic_moon_bottle.png` | 192×192 투명 | — | — |
| `relic_pistol` | `assets/icons/relic_pistol.png` | 192×192 투명 | — | — |
| `relic_moon_shard` | `assets/icons/relic_moon_shard.png` | 192×192 투명 | — | — |
| `relic_armband` | `assets/icons/relic_armband.png` | 192×192 투명 | — | — |
| `relic_bond_thread` | `assets/icons/relic_bond_thread.png` | 192×192 투명 | — | — |
| `relic_gold_feather` | `assets/icons/relic_gold_feather.png` | 192×192 투명 | — | — |
| `relic_dawn_feather` | `assets/icons/relic_dawn_feather.png` | 192×192 투명 | — | — |
| `relic_stopped_tower` | `assets/icons/relic_stopped_tower.png` | 192×192 투명 | — | — |
| `relic_star_crown` | `assets/icons/relic_star_crown.png` | 192×192 투명 | — | — |
