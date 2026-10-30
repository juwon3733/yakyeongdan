// 그림 프롬프트 원본 (유일한 원본). GPT 이미지 에이전트(AGENTS.md)와 검사 도구가 같이 쓴다.
// 고친 뒤에는 `node tools/export-prompts.mjs`로 assets/prompts.json, docs/PROMPTS.md를 다시 만든다.
// 캐릭터 외형은 docs/03_characters.md, 적은 docs/04_enemies.md, 그림 목록은 docs/06_art_ui_sound.md를 따른다.

import { CARDS } from './data/cards.js';
import { cardArtKind } from './cardkind.js';

export const STYLE_VERSION = 8; // 8: 모든 그림에 STYLE.handmade(AI 그림 티 줄이기 — 장식 과잉·광택·대칭 자세·같은 얼굴 금지). 7: 7: 캐릭터를 층으로 — 전투 스프라이트는 몸만(이펙트·동반자 없이, 칸을 꽉 채움, 숨쉬기 칸 대신 준비 자세), ★5 오라·동반자(네레아 고래·시온 별 정령)·원거리 투사체는 따로. 6: 6: 기술 이펙트 시트(공용 4종·동료별 시그니처), 스킨은 skin-<id>로 맨 뒤. 5: 전투는 일러스트 대신 저해상도 전투 스프라이트(동료 4×2 시트 8동작, 적 128×128). 4: 여러 장을 한 시트에(칸은 2배 도트라 한 장짜리와 같은 세밀함, 자세 2×2·카드 2×2·적 3×2·아이콘 4×4, tools/slice-sheets.mjs가 자름). 3: 동료마다 다른 얼굴·포즈, 전투 모션 그림(공격·스킬·방어·피격). 2: 그림체 시안 C(세밀한 도트 256×384 4배, ~96색)로 고정, 성인 여성 노출은 적당히

// ── 공통 스타일 ──────────────────────────────────────────
export const STYLE = {
  pixel: '이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.\n\nAuthentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Fine, detailed pixel art (like a premium modern pixel gacha game): crisp pixel clusters, careful pixel shading on hair, eyes, skin and fabric, flat colors with a little dithering, clean dark 1-pixel outlines. Match the attached style reference (style/akane_c.png) in pixel size, detail level and color richness. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.',
  sprite: '이미지를 만들어줘. 전투용 저해상도 도트 스프라이트야.\n\nAuthentic LOW-RESOLUTION pixel-art battle sprites, like premium 16-bit era RPG / Slay-the-Spire-sized battle characters: chunky readable pixels, about 32 colors per sprite, clean dark 1-pixel outline, simple 2-3 tone shading, strong silhouette. Much simpler than the attached detailed illustrations — keep the same person (face, hair, colors, outfit, weapon) but simplified for small size. No anti-aliasing, no blur, no text, no UI.',
  vfx: '이미지를 만들어줘. 게임 기술 이펙트 스프라이트 시트야. 캐릭터는 그리지 마.\n\nPixel-art VFX animation frames for a premium gacha RPG battle: bold, flashy, high-contrast magical effects with bright cores (white/yellow) fading to the accent color, crisp pixel clusters, dithered glow, sparks and particles. ONLY the effect — no characters, no weapons held by anyone, no enemies, no text, no UI. Fully transparent background.',
  distinct: 'Give each character a clearly distinct face — eye shape, brows, mouth, face shape and expression habits that fit their personality — instead of the same generic pretty face. Poses also fit the personality: a natural, specific pose with weight and intent, not a generic glamour pose.',
  character: 'Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) are attractive and stylish in gacha-game fashion with moderate skin exposure: fitted outfits that may show bare shoulders, midriff or legs (short skirts, side slits, thigh-high boots), but the figure and exposure are not emphasized — confident and elegant, never explicit: no cleavage focus, no nudity, no underwear shots, no sexual poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.',
  rarity5: 'This is a top-rarity (5-star) character: give the design the most care — an elaborate signature outfit, a striking weapon or prop, and a magical effect (glow, flames, stars, moonlight or clockwork) that makes the silhouette instantly recognizable. As a top-rarity adult woman she may be more glamorous than other characters: a curvier figure and a deeper neckline that shows some cleavage are fine here — still never explicit: no nudity, no underwear shots, no sexual poses.',
  rarity4: 'This is a 4-star character: one flashy signature prop or accessory, otherwise clean.',
  rarity3: 'This is a 3-star character: simple, friendly and approachable design, still cute or cool.',
  onModel: 'Draw this character ON-MODEL from the attached reference image: the same face, eye color, hairstyle and hair color, outfit, accessories, weapon and age. Do not redesign anything.',
  // AI 그림 티 줄이기: 손으로 찍은 도트처럼 — 장식 과잉·플라스틱 광택·똑같은 예쁜 얼굴·좌우 대칭 정면 자세·흐린 배경 빛 번짐을 피한다
  handmade: 'Make it look HAND-PLACED by a human pixel artist, not AI-generated: a deliberate limited palette with clear color ramps, intentional pixel clusters and clean readable shapes, flat cel shading with one light direction. AVOID the typical AI look: no excess ornament (no gold filigree, tassels, chains and jewels covering everything), no glossy plastic shine or wet-looking highlights, no glowing particles and bokeh filling the background, no soft airbrushed gradients, no perfectly symmetrical front-facing glamour pose, no same-face anime beauty, no extra or fused fingers, no straps or belts that lead nowhere, no nonsense details. Fewer, bigger, cleaner shapes beat many tiny details.',
  keyart: '이미지를 만들어줘. 최고 화질로, 색을 줄이지 말고.\n\nHigh-quality, highly detailed pixel-art style illustration, like the key visual of a premium modern pixel-art game: crisp pixel detail, rich dramatic lighting, clean anime gacha-game faces. Night sky, a tall tower rising from the sea, lanterns and stars. No text, no letters, no logo, no watermark, no UI.',
};

// 종류별 크기. native = 게임 안 원본 도트 크기, w×h = 올릴 PNG 크기(정수배).
export const SPEC = {
  stand:    { w: 1024, h: 1536, native: '256×384', scale: 4, transparent: true,  colors: 256, folder: 'chars', note: '전투 서 있는 전신 · 투명 배경 · 발끝이 아래 끝 근처, 머리 위 여백' },
  portrait: { w: 1024, h: 1536, native: '256×384', scale: 4, transparent: true,  colors: 256, folder: 'chars', note: '허리 위 상반신 · 투명 배경 · 양옆·위 여백, 허리만 아래 끝에 닿음' },
  sprite:   { w: 384,  h: 512,  native: '384×512', scale: 1, transparent: true,  colors: 256, folder: 'sprites', note: '전투용 도트 캐릭터(일러스트보다 굵은 도트) · 전투 스프라이트 시트에서 잘라 냄 · 발이 칸 아래 근처' },
  outfit:   { w: 1024, h: 1536, native: '256×384', scale: 4, transparent: true,  colors: 256, folder: 'chars', note: '두 번째 의상 전신 · 투명 배경' },
  cutin:    { w: 1536, h: 576,  native: '384×144', scale: 4, transparent: false, colors: 256, folder: 'cutins', note: '가로로 긴 얼굴·상체 클로즈업 · 1536×1024로 만든 뒤 가운데 띠를 잘라 냄' },
  duo:      { w: 1536, h: 768,  native: '384×192', scale: 4, transparent: false, colors: 256, folder: 'cutins', note: '인연 듀오 · 두 사람 한 장 · 1536×1024로 만든 뒤 위아래를 잘라 냄' },
  cg:       { w: 1536, h: 864,  native: '—', scale: 0, transparent: false, colors: Infinity, folder: 'cg', note: '★5 전신 CG · 16:9 · 화질 우선, 색 제한 없음' },
  enemy:    { w: 512,  h: 512,  native: '512×512', scale: 1, transparent: true,  colors: 256, folder: 'enemies', note: '일반 적 · 적 시트(foesheet)에서 잘라 냄 · 투명 배경' },
  elite:    { w: 512,  h: 512,  native: '512×512', scale: 1, transparent: true,  colors: 256, folder: 'enemies', note: '강적 · 적 시트(foesheet)에서 잘라 냄 · 투명 배경' },
  boss:     { w: 1024, h: 1536, native: '128×192', scale: 8, transparent: true,  colors: 256, folder: 'enemies', note: '보스 전투 스프라이트(저해상도 도트) · 투명 배경' },
  tower:    { w: 1200, h: 1272, native: '300×318', scale: 4, transparent: true, colors: 64, folder: 'bg', note: '지도 화면의 탑(정면, 세로) · 투명 배경 · 난간·계단·사람 없이 벽만 — 게임이 층 난간과 계단을 위에 그린다' },
  bg:       { w: 1280, h: 720,  native: '640×360', scale: 2, transparent: false, colors: 256, folder: 'bg', note: '배경 16:9 · 사람 없음 · 아래 1/3은 단순하게(캐릭터가 서는 자리)' },
  title:    { w: 1536, h: 864,  native: '—', scale: 0, transparent: false, colors: Infinity, folder: 'title', note: '타이틀 키아트 16:9 · 오른쪽 40%는 메뉴 자리 · 글자 금지' },
  summon:   { w: 1536, h: 864,  native: '—', scale: 0, transparent: false, colors: Infinity, folder: 'summon', note: '소환 화면 밤하늘 16:9' },
  meteor:   { w: 512,  h: 512,  native: '64×64',   scale: 8, transparent: true,  colors: 256, folder: 'summon', note: '별똥별 효과 · 투명 배경' },
  ui:       { w: 128,  h: 128,  native: '32×32',   scale: 4, transparent: true,  colors: 64,  folder: 'ui', note: 'UI 키트 조각(틀·버튼·띠, 9칸 늘이기용) · UI 시트에서 잘라 냄 · 투명 배경' },
  logo:     { w: 1536, h: 512,  native: '192×64',  scale: 8, transparent: true,  colors: 64,  folder: 'ui', note: '「야경단」 도트 로고 · 투명 배경 · 글자 모양이 그림의 전부' },
  icon:     { w: 192,  h: 192,  native: '32×32',   scale: 6, transparent: true,  colors: 64,  folder: 'icons', note: '도구 아이콘 · 아이콘 시트(iconsheet)에서 잘라 냄 · 투명 배경' },
  appicon:  { w: 1024, h: 1024, native: '64×64',   scale: 16, transparent: false, colors: 64, folder: 'app', note: '앱 아이콘(홈 화면·PWA) · 64×64 도트를 16배 · 정사각 꽉 차게, 가운데 80% 안에 주요 모양(둥근 모서리로 잘려도 되게) · node tools/make-icons.mjs가 icons/icon-192·512.png로 만든다' },
  style:    { w: 1024, h: 1536, native: '시안마다 다름', scale: 0, transparent: true, colors: Infinity, folder: 'style', note: '그림체 시안(게임에 안 씀) · 같은 캐릭터를 도트 굵기만 바꿔 4장 · 사용자가 골라 기준 화풍을 정한다' },
  card:     { w: 512,  h: 384,  native: '512×384', scale: 1, transparent: false, colors: 256, folder: 'cards', note: '카드 그림(카드 위쪽 일러스트, 4:3) · 동료마다 공격·방어·스킬·필살 4장을 같은 종류 카드가 같이 씀 · 1536×1024로 만든 뒤 가운데 4:3을 잘라 192×144로 줄이고 4배' },
  fx:       { w: 512,  h: 512,  native: '512×512', scale: 1, transparent: true,  colors: 256, folder: 'fx', note: '기술 이펙트 한 프레임(캐릭터 없이 효과만) · 이펙트 시트에서 잘라 냄 · 프레임을 차례로 돌려 움직인다' },
  // 시트: GPT가 한 장에 여러 개를 그리고, tools/slice-sheets.mjs가 칸마다 잘라 위 종류의 파일로 만든다(npm run art).
  battlesheet: { w: 1536, h: 1024, native: '768×512 (칸 192×256 × 8)', scale: 2, transparent: true, colors: Infinity, folder: 'sheets', note: '전투 스프라이트 4×2 — 위: 서 있기·숨쉬기·공격·스킬 / 아래: 방어·피격·쓰러짐·승리, 칸 384×512' },
  cardsheet: { w: 1024, h: 1024, native: '1024×1024 (칸 512×512 × 4)', scale: 1, transparent: false, colors: Infinity, folder: 'sheets', note: '카드 그림 2×2 — 왼쪽 위 공격·오른쪽 위 방어·왼쪽 아래 스킬·오른쪽 아래 필살, 칸 512×512 중 가운데 512×384만 씀' },
  foesheet:  { w: 1536, h: 1024, native: '768×512 (칸 256×256 × 6)', scale: 2, transparent: true, colors: Infinity, folder: 'sheets', note: '적 3×2, 칸 512×512' },
  fxsheet:  { w: 1536, h: 1024, native: '768×512 (칸 256×256 × 6)', scale: 2, transparent: true, colors: Infinity, folder: 'sheets', note: '이펙트 3×2 — 프레임 순서대로(왼→오, 위→아래), 칸 512×512' },
  iconsheet: { w: 1024, h: 1024, native: '128×128 (칸 32×32 × 16)', scale: 8, transparent: true, colors: Infinity, folder: 'sheets', note: '아이콘 4×4, 칸 256×256' },
};

// ── 동료 22명 ────────────────────────────────────────────
// sheet: 설정화(전신 정면 + 얼굴 클로즈업). 같은 묶음의 다른 그림은 전부 이 설정화를 기준으로.
// faces: 상반신 표정 3개(normal·smile·serious), cutin: 컷인 연출, outfit: 두 번째 의상,
// fx: 카드 그림에 쓰는 그 동료다운 무기·이펙트. 카드 그림 장면은 js/data/cards.js의 카드(이름·효과·종류)에서 자동으로 만든다.
export const CHARS = {
  sion: { name: '시온', rarity: 5, accent: 'silver-blue and gold',
    sheet: 'a calm, beautiful woman in her late 20s, a star summoner. Very long straight silver-blue hair, gentle pale-blue eyes, a long dark-navy cloak printed with a glowing star map, an elegant gown with an open back under it, gold star ornaments in her hair, tiny glowing star spirits floating around her fingertips.',
    faces: { normal: 'calm, faint smile, one hand raised with small star spirits', smile: 'delighted, talking excitedly about the stars, eyes sparkling', serious: 'focused, cloak spread, star spirits circling her' },
    cutin: 'close-up of her face and raised hand, star spirits bursting outward, a constellation line glowing across the panel',
    outfit: 'second outfit: a white-and-gold observatory robe with a crescent telescope pendant, hair tied loosely with a star ribbon',
    fx: 'glowing star spirits like tiny lantern stars, constellation lines, a starfield swirling from her star-map cloak' },
  lunaria: { name: '루나리아', rarity: 5, accent: 'moon silver and pale violet',
    sheet: 'a graceful dancer woman in her mid 20s. Silver hair reaching her ankles, a crescent-moon hair ornament, a translucent veil, a dancer outfit with an open back and a bare midriff, little bells on her ankles, two folding fans that hold moonlight.',
    faces: { normal: 'serene smile, fan held near her face', smile: 'playful laugh, spinning with her veil flowing', serious: 'graceful but sharp gaze, fans opened like blades' },
    cutin: 'close-up mid-spin, silver hair sweeping across the panel, a huge full moon behind her, moonlight petals',
    outfit: 'second outfit: a deep-indigo evening dance dress with silver moon-phase embroidery and a long trailing scarf',
    fx: 'twin moonlight fans, silver crescent arcs, a translucent veil, ankle bells, the moon (crescent, half, full or new as the card says) huge behind her' },
  akane: { name: '아카네', rarity: 5, accent: 'crimson and gold',
    sheet: 'a confident swordswoman in her mid 20s. Long crimson hair in a high ponytail, gold eyes, a red off-shoulder top with hakama-style armored skirt, two katana with flame-patterned blades, a cocky grin.',
    faces: { normal: 'confident smirk, one hand on a sword hilt', smile: 'fierce grin, thumb pointing at herself', serious: 'drawing both swords, flames licking the blades' },
    cutin: 'close-up of her eyes and crossed burning blades, embers and fire streaks across the panel',
    outfit: 'second outfit: a black-and-red festival kimono worn short with armored gauntlets, a fox mask on the side of her head',
    fx: 'twin katana-like blades with flame patterns, crimson fire trails, burning embers, a high ponytail whipping' },
  eleonore: { name: '엘레오노르', rarity: 5, accent: 'violet and brass',
    sheet: 'an elegant, haughty witch woman in her early 30s. Long black hair with a violet sheen, half-lidded violet eyes, a wide-brimmed witch hat decorated with clock faces, a gothic dress with a high side slit, a staff as tall as a person shaped like a giant clock hand, small brass gears floating around her.',
    faces: { normal: 'composed, slight condescending smile, hand on hat brim', smile: 'amused laugh behind a gloved hand', serious: 'raising the clock-hand staff, glowing clock circles behind her' },
    cutin: 'close-up of her face with a giant glowing clock face behind her, the hands spinning backward',
    outfit: 'second outfit: a clocktower keeper coat in plum and brass, monocle, pocket watches on chains',
    fx: 'a giant clock-hand staff, glowing clock faces, brass gears, violet time ripples, clock hands spinning' },
  nerea: { name: '네레아', rarity: 5, accent: 'sea teal and starlight gold',
    sheet: 'a free-spirited star-whale rider woman in her mid 20s. Waist-length wavy aqua-white hair with small star clips, deep sea-blue eyes, a navy-and-white mariner-style outfit with bare shoulders and a short pleated skirt over thigh-high boots, a long flowing sea-coat embroidered with a whale constellation, a staff shaped like a harpoon with a small star lantern at its tip. A huge translucent star whale made of constellation lines and glowing stars (named Lana) swims in the sky behind her.',
    faces: { normal: 'relaxed smile, hair drifting as if underwater, one hand on the harpoon staff', smile: 'laughing with her eyes closed, a little star fish swimming past', serious: 'raising the harpoon staff, the star whale\'s eye glowing behind her' },
    cutin: 'close-up of her riding on the star whale\'s head, the whale breaching through a sea of stars, a huge spray of starlight water',
    outfit: 'second outfit: a white-and-gold sailor captain coat over a teal swimsuit-style top and shorts, a whale-tail pendant',
    fx: 'a harpoon staff with a star lantern, a giant translucent star whale made of constellations, sprays of glowing starlight water, waves in the night sky' },
  estelle: { name: '에스텔', rarity: 5, accent: 'white-gold and meteor blue',
    sheet: 'a beautiful, graceful knight woman in her early 20s who fell to earth with a meteor (season-1 character). Very long straight platinum-blonde hair flowing like a comet tail with a faint blue glow at the tips, clear sapphire-blue eyes with star-shaped highlights, a gentle but determined face. Elegant white-and-gold knight armor with a fitted bodice, bare shoulders, gold star-shaped pauldrons, a short layered white skirt with gold trim over thigh-high armored boots, a long translucent midnight-blue cape lined with falling-star patterns. She wields a slender silver lance-sword whose tip burns like a small meteor. A few tiny stars orbit her.',
    faces: { normal: 'soft confident smile, one hand on her chest in a knight\'s vow, hair drifting', smile: 'bright happy smile with a little wink, a tiny shooting star passing behind her', serious: 'fierce focused eyes, raising the meteor-tipped lance, cape snapping in the wind' },
    cutin: 'close-up of her diving down from the night sky with the meteor lance pointed forward, hair streaming like a comet tail, a storm of falling stars behind her',
    outfit: 'second outfit: a midnight-blue gown with silver star embroidery and a short white capelet, a star tiara',
    fx: 'a meteor-tipped silver lance, white-gold comet trails, falling stars streaking across the night sky, starlight impact craters' },
  iris: { name: '아이리스', rarity: 4, accent: 'silver and pale blue',
    sheet: 'a cool, quiet swordswoman in her early 20s. Waist-length straight black hair, pale-blue eyes, a long silver coat styled as light armor, a slim longsword, an expressionless but kind face.',
    faces: { normal: 'calm, expressionless, sword at her side', smile: 'small rare smile, looking away', serious: 'sword raised in a ready stance, eyes sharp' },
    cutin: 'close-up of a single clean horizontal sword flash, her eyes narrowed, black hair flowing',
    outfit: 'second outfit: a dark-blue swordsman uniform with a high collar and a white sash',
    fx: 'a slender silver longsword, sharp white slash arcs, a calm cold expression, long black hair flowing with the cut' },
  noel: { name: '노엘', rarity: 4, accent: 'pink and lavender',
    sheet: 'a sleepy sorceress woman in her early 20s. Long wavy pink hair, half-closed light-blue eyes, an off-shoulder robe that looks like pajamas, holding a huge pillow like a staff, a nightcap with a star tip.',
    faces: { normal: 'drowsy, half-asleep, hugging the pillow', smile: 'sleepy happy smile, yawning', serious: 'eyes suddenly wide open, magic circle glowing from the pillow' },
    cutin: 'close-up of her waking eyes snapping open, a shooting-star spell bursting from the pillow',
    outfit: 'second outfit: a cozy lavender sweater dress and a moon-shaped sleep mask on her forehead',
    fx: 'a huge pillow, sleepy half-closed eyes, dreamy pink-lavender magic, shooting stars, floating sheep-shaped clouds and sparkles (never letters)' },
  raven: { name: '레이븐', rarity: 4, accent: 'black and violet',
    sheet: 'a cynical assassin man in his late 20s. Short silver hair, a crow-beak half mask covering the upper face, red eyes visible through the mask, a black feathered coat, a poison-needle device on his wrist.',
    faces: { normal: 'cold, arms crossed, slightly looking down', smile: 'faint crooked smile under the mask', serious: 'raising the wrist needle, feathers scattering' },
    cutin: 'close-up of the crow mask, red eyes glinting, black feathers flying',
    outfit: 'second outfit: a dark-violet long coat with a feather collar and a white crow mask',
    fx: 'a crow-beak half mask, black feathers flying like blades, wrist poison needles, green-violet poison mist' },
  mimimomo: { name: '미미·모모', rarity: 4, accent: 'pink and sky blue',
    sheet: 'twin 12-year-old girls shown together. Mimi: pink bob hair with a ribbon on her RIGHT side. Momo: sky-blue bob hair with a ribbon on her LEFT side. Matching modest sailor-style dresses (knee length, covered shoulders) in mirrored colors, Mimi holds a small dagger, Momo holds an umbrella. Children, drawn modestly and age-appropriately.',
    faces: { normal: 'the twins side by side, Mimi cheerful and Momo calm', smile: 'both laughing, holding hands', serious: 'back to back, dagger and umbrella ready' },
    cutin: 'close-up of both faces mirrored left and right, pink and blue sparkles',
    outfit: 'second outfit: matching modest winter coats with fluffy hoods, one pink and one blue, long skirts and boots',
    fx: 'the twin girls: Mimi (pink hair, right ribbon, small dagger) and Momo (sky-blue hair, left ribbon, umbrella), mirrored symmetric poses, pink and blue sparkles' },
  sebas: { name: '세바스', rarity: 4, accent: 'black and silver',
    sheet: 'a dignified butler man in his 60s, clearly elderly (wrinkles, grey mustache). Slicked-back silver hair, a monocle, a black tailcoat, white gloves, a pocket watch on a chain and a cane that hides a sword.',
    faces: { normal: 'polite bow, hand on chest', smile: 'warm grandfatherly smile, offering a teacup', serious: 'drawing the cane sword, monocle glinting' },
    cutin: 'close-up of the opened pocket watch and the monocle, the sword half drawn',
    outfit: 'second outfit: a white summer butler suit with a silver tray',
    fx: 'an elegant old butler with a monocle, silver tea set, a pocket watch, a cane sword, impeccable white gloves' },
  mariana: { name: '마리아나', rarity: 4, accent: 'gold and deep red',
    sheet: 'a bold pirate queen woman in her late 20s. Long wavy brown hair, a feathered tricorn hat, a corset coat with short pants and tall boots, a gold coin necklace, a flintlock pistol.',
    faces: { normal: 'confident grin, hand on hat', smile: 'laughing loudly, tossing a gold coin', serious: 'aiming the flintlock pistol' },
    cutin: 'close-up of her grin and the pistol muzzle flash, gold coins flying',
    outfit: 'second outfit: a captain\'s long red coat with gold trim over a white blouse, a cutlass',
    fx: 'a pirate queen with a feathered tricorn, a flintlock pistol, gold coins flying, a ship\'s cannon or anchor' },
  tomori: { name: '토모리', rarity: 4, accent: 'yellow and warm orange',
    sheet: 'a cheerful 17-year-old girl, the lighthouse keeper\'s granddaughter. Long chestnut hair in a braid, a yellow raincoat, a modest dress below the knees, rain boots, holding a big glowing lantern. Drawn modestly and age-appropriately.',
    faces: { normal: 'bright smile, lantern raised', smile: 'laughing, waving', serious: 'determined, shining the lantern forward' },
    cutin: 'close-up of her face lit warmly from below by the lantern, a beam of light cutting the dark',
    outfit: 'second outfit: a modest navy sailor-style keeper uniform with a small lighthouse badge and a scarf',
    fx: 'a big warm lantern, a lighthouse beam, a yellow raincoat, warm light pushing shadows away' },
  sigrun: { name: '시그룬', rarity: 4, accent: 'silver and white',
    sheet: 'a noble knight woman in her late 20s. Long blond hair, silver armor with wing ornaments, a white feather cape, a long lance, a dignified expression.',
    faces: { normal: 'upright, lance held vertically', smile: 'small proud smile', serious: 'pointing the lance forward, wings of light behind her' },
    cutin: 'close-up diving from the sky, lance first, white feathers and wind streaks',
    outfit: 'second outfit: a light sky-blue cavalry uniform with a feather-trimmed short cape',
    fx: 'a long silver lance, white feathered wings of light, a white feather cape, diving or soaring through clouds' },
  zeno: { name: '제노', rarity: 4, accent: 'black and dragon gold',
    sheet: 'a silent dark knight man in his late 20s. Long black hair, one eye a golden dragon eye, black armor with dragon scales, a huge greatsword on his back.',
    faces: { normal: 'stoic, arms folded', smile: 'very faint smile, looking down', serious: 'dragon eye glowing, gripping the greatsword' },
    cutin: 'close-up of the golden dragon eye and black flames',
    outfit: 'second outfit: a dark-crimson coat over scale mail with a torn black cape',
    fx: 'a black dragon-scale greatsword, black flames, a dragon silhouette, one golden dragon eye glowing' },
  bertha: { name: '베르타', rarity: 4, accent: 'amber lantern and plum',
    sheet: 'a gentle but sharp retired tower guide, an elderly woman in her early 70s (clearly elderly: wrinkles, kind crow\'s feet). Long silver hair in a neat braided crown, warm hazel eyes behind small round glasses, a tidy plum guide uniform coat with brass buttons and a long skirt, a knitted shawl, a tall cane with a glowing amber lantern hanging from its tip, a ring of old brass keys at her belt.',
    faces: { normal: 'kind smile, both hands resting on the lantern cane', smile: 'laughing warmly, glasses slightly askew', serious: 'pointing the lantern cane forward, eyes sharp behind the glasses, a trail of guiding light' },
    cutin: 'close-up of her glasses glinting and the lantern cane pointing the way, a glowing path of footprints and arrows of light',
    outfit: 'second outfit: her old young-days tower guide uniform in navy with a captain-style cap, shawl kept',
    fx: 'a lantern cane, glowing guiding arrows and footprints of light, an old tower map, brass keys, enemy silhouettes being turned around' },
  brick: { name: '브릭', rarity: 3, accent: 'red and brass',
    sheet: 'an energetic gunner woman in her mid 20s. Short red hair, goggles pushed up on her head, a huge hand cannon bigger than her body, a cropped work top that shows her shoulders and midriff, suspender shorts, work boots.',
    faces: { normal: 'big grin, cannon on shoulder', smile: 'laughing loudly, thumbs up', serious: 'aiming the cannon, goggles down' },
    cutin: 'close-up of the cannon muzzle flash and her grin behind the goggles',
    outfit: 'second outfit: an oil-stained mechanic jumpsuit tied at the waist and a tank top',
    fx: 'a hand cannon bigger than her body, glowing shells, muzzle blasts, goggles on her head, a big grin' },
  marta: { name: '마르타', rarity: 3, accent: 'gold and white',
    sheet: 'a very tall, muscular nun woman in her 30s, about 2 meters tall. Long blond hair in a braid, a nun habit with a high side slit showing her legs, iron gauntlets, a gentle smile.',
    faces: { normal: 'gentle smile, hands together in prayer with gauntlets', smile: 'warm laugh', serious: 'raising an iron fist, a holy light shield behind her' },
    cutin: 'close-up of an iron fist and a glowing holy barrier',
    outfit: 'second outfit: a white battle-nun coat with a big rosary and armored boots',
    fx: 'a very tall muscular nun with iron gauntlets, golden holy light barriers, church bells, a kind smile' },
  finn: { name: '핀', rarity: 3, accent: 'brown and red',
    sheet: 'a lively 14-year-old mail delivery boy. Curly brown hair, a mail cap, a huge mailbag bigger than his body, shorts with long socks, running shoes. Drawn modestly and age-appropriately.',
    faces: { normal: 'bright grin, holding a letter', smile: 'laughing, saluting', serious: 'running at full speed, letters flying' },
    cutin: 'close-up of him sprinting, letters fluttering around',
    outfit: 'second outfit: a winter postal coat with a red scarf',
    fx: 'a big mail bag, letters and parcels flying like darts, a postman cap, dashing over rooftops' },
  laila: { name: '라일라', rarity: 3, accent: 'sky blue and grey',
    sheet: 'a brusque deserter knight woman in her early 20s. Long sky-blue hair tied back, a torn knight cape, a short top and leg wraps, twin daggers.',
    faces: { normal: 'unimpressed, daggers twirling', smile: 'small smirk', serious: 'crouched low, wind swirling' },
    cutin: 'close-up of crossed daggers and wind blades',
    outfit: 'second outfit: a hooded traveling cloak over light leather armor',
    fx: 'twin short daggers, gusts of sky-blue wind, a torn knight\'s cape, fast afterimages' },
  dora: { name: '도라', rarity: 3, accent: 'brown and orange',
    sheet: 'a cheerful 19-year-old blacksmith woman. Long brown hair in a ponytail, tanned arms, a leather apron over a tank top, a big hammer on her shoulder.',
    faces: { normal: 'grin, hammer on shoulder', smile: 'laughing, wiping soot from her cheek', serious: 'hammering a glowing blade, sparks flying' },
    cutin: 'close-up of the hammer striking an anvil, a fountain of sparks',
    outfit: 'second outfit: a festival outfit with a short jacket and a tool belt',
    fx: 'a big smith\'s hammer, sparks, a glowing anvil, red-hot metal and quenching steam' },
  gordon: { name: '고든', rarity: 3, accent: 'white and warm brown',
    sheet: 'a big burly cook man in his 40s. A bushy beard, a white chef uniform, a frying pan and a ladle, a kind face.',
    faces: { normal: 'kind smile, holding a ladle', smile: 'hearty laugh', serious: 'swinging the frying pan' },
    cutin: 'close-up of a frying pan swing and steam',
    outfit: 'second outfit: a night-market apron and a headband',
    fx: 'a frying pan and a ladle, steaming hearty food, a big friendly cook with a beard' },
  fukuro: { name: '후쿠로', rarity: 3, accent: 'brown and lantern orange',
    sheet: 'a mysterious night-market merchant man of unknown age. An owl mask covering his whole face, a huge bundle on his back hung with lanterns and trinkets, a patched robe.',
    faces: { normal: 'bowing like a merchant', smile: 'spreading his arms, offering goods', serious: 'throwing trinkets from his bundle' },
    cutin: 'close-up of the owl mask with glinting eyes and swinging lanterns',
    outfit: 'second outfit: a fancy festival robe with a golden owl mask',
    fx: 'an owl mask, a huge bundle of junk on his back, lucky charms, random trinkets and lanterns flying' },
};

// 인연 듀오 컷인 (처음 8쌍 + 2차 동료 2쌍)
export const DUOS = {
  iris_marta: { pair: ['iris', 'marta'], scene: 'sword and shield: the swordswoman slashing from behind the tall nun\'s raised holy barrier' },
  iris_akane: { pair: ['iris', 'akane'], scene: 'rivals back to back, a silver blade and two burning blades crossing in an X' },
  iris_brick: { pair: ['iris', 'brick'], scene: 'the swordswoman cutting through a cannonball\'s explosion fired by the gunner' },
  brick_mariana: { pair: ['brick', 'mariana'], scene: 'the gunner and the pirate queen firing together from a ship deck' },
  sigrun_laila: { pair: ['sigrun', 'laila'], scene: 'the knight commander and her former subordinate diving together from the clouds' },
  lunaria_sion: { pair: ['lunaria', 'sion'], scene: 'the dancer under a full moon and the summoner under a sky of stars, moonlight and starlight merging' },
  eleonore_sebas: { pair: ['eleonore', 'sebas'], scene: 'the witch and the old butler sharing tea while clock hands spin backward around them' },
  zeno_marta: { pair: ['zeno', 'marta'], scene: 'the dark knight kneeling before the tall nun, golden light and black flames meeting' },
  nerea_tomori: { pair: ['nerea', 'tomori'], scene: 'the star whale following the girl\'s lantern beam across the night sea, the rider waving from its head' },
  estelle_sigrun: { pair: ['estelle', 'sigrun'], scene: 'two lance knights diving side by side from the night sky, a silver wing trail and a white-gold comet trail crossing' },
  estelle_sion: { pair: ['estelle', 'sion'], scene: 'the summoner raising her hand to call star spirits while the meteor knight rides down a falling star beside her' },
  bertha_nerea: { pair: ['bertha', 'nerea'], scene: 'the old guide pointing the way with her lantern cane while the star whale rider sails past on the whale, a path of light between them' },
};

// ── 적 ───────────────────────────────────────────────────
export const ENEMIES = {
  act1: {
    sea_ghost: '바다 유령 — a translucent sea ghost made of seaweed and mist with glowing lantern eyes',
    crab_soldier: '게 갑옷병 — a soldier wearing a huge crab shell as armor, claws as weapons',
    dock_pirate: '부두 해적 — a sneaky dock pirate with a bandana and a hook, a cutlass',
    gulls: '갈매기 떼 — a flock of three mischievous seagulls with glowing eyes',
    lamp_eel: '등불 장어 — a long eel with a glowing lantern lure, crackling with small sparks',
    powder_sailor: '화약통 수병 — a stubby sailor whose body is a gunpowder barrel, a lit fuse on top of the head',
    captain_parrot: '선장 앵무새 — a bossy red parrot in a tiny captain hat, squawking orders',
    mistling: '안개 그림자 — a small wisp of lavender sea fog shaped like a veiled girl-silhouette with glowing green eyes, summoned by the Fog Witch Queen',
  },
  act1_elite: {
    anchor_giant: '닻 거인 — a huge rusty giant built from an anchor and chains',
    fog_witch: '안개 마녀 — an elegant adult witch woman wrapped in sea fog, a lantern on a long pole, a gacha-style outfit',
    smuggler_boss: '밀수꾼 두목 — a broad-shouldered smuggler chief with a long coat full of stolen cards and trinkets, an eyepatch',
  },
  act2: {
    cloud_spirit: '구름 정령 — a puffy cloud spirit with a stormy face',
    feather_knight: '깃털 기사 — a small knight in feather armor with a winged helmet',
    thunder_sheep: '천둥 양 — a fluffy sheep crackling with lightning',
    vane_soldier: '바람개비 병사 — a soldier with a pinwheel shield spinning in the wind',
    mist_jelly: '안개 해파리 — a floating pale violet jellyfish made of mist, healing glow in its tentacles',
    kite_knight: '연 기사 — a small knight riding a diamond-shaped kite with a long ribbon tail',
    puff_bomber: '뭉게 자폭병 — a round angry cloud puff with a fuse, about to burst',
  },
  act2_elite: {
    thunderbird: '번개새 — a large bird of crackling lightning',
    twin_vanes: '쌍둥이 풍향계 — two living weathervanes, a rooster and a fish, back to back (one image with both)',
    storm_trumpeter: '폭풍 나팔수 — a cloud-knight herald blowing a huge brass trumpet that spills storm clouds',
  },
  act3: {
    star_statue: '별 조각상 — a stone statue embedded with glowing stars',
    shadow_cat: '그림자 고양이 — a sleek shadow cat with starry eyes',
    meteor_archer: '유성 사수 — an archer whose arrows are tiny meteors',
    clock_angel: '시계태엽 천사 — a clockwork angel with gear wings, a clock face for a halo',
    tail_comet: '꼬리별 — a small grinning comet with a long sparkling tail',
    gear_knight: '톱니 기사 — a knight whose armor is covered in spinning spiked gears',
    star_thief: '별 도둑 — a nimble masked thief with a sack of stolen stars',
  },
  act3_elite: {
    meteor_rider: '유성 기수 — a rider on a flaming meteor steed, a crowned helmet',
    moon_shadow: '달의 그림자 — a shadowy figure shaped by moonlight, crescent blades',
    constellation_sage: '성좌 마법사 — an adult woman astronomer-mage in a star-chart robe, a gacha-style outfit, drawing constellation lines with a wand',
  },
};

export const BOSSES = {
  star_king: { name: '떨어진 별의 왕', beast: false, p1: 'season-1 boss "The Fallen Star King": a tall regal adult man who fell from the night sky, long white-blue hair floating like a comet tail, a cracked golden star crown, a deep-navy royal coat embroidered with constellations, a scepter tipped with a burning star, small star shards orbiting him', p2: 'second phase: the crown blazes, a rain of falling stars pours around him, the coat torn open showing a glowing star core in his chest', p3: 'third phase "Fall": he becomes a falling meteor himself — body wreathed in white-gold fire, hair streaming upward, the crown shattered, descending with a burning trail', cutin: 'close-up of the fallen star king raising his star scepter, a meteor shower streaking behind him, eyes like cold stars' },
  lighthouse: { name: '등대지기', p1: 'a huge burly old lighthouse keeper with a white beard, a raincoat, carrying a rotating lighthouse lamp that shoots a beam of light', p2: 'second phase: the lamp splits into two beams, his coat torn by the wind, eyes glowing', cutin: 'close-up of the old keeper and the blinding lighthouse beam sweeping across' },
  cloud_captain: { name: '구름 기사단장', p1: 'an adult woman knight commander in heavy cloud-white armor, long silver hair, a long lance, a plumed helmet', p2: 'second phase: she has thrown off the heavy armor, now in a sleek fitted battle suit, silver hair loose, lance crackling with wind', cutin: 'close-up of her casting off the heavy armor, plates flying, silver hair whipping' },
  fog_queen: { name: '안개 마녀 여왕', p1: 'act-1 alternate boss: the queen of the sea-fog witches — an elegant tall adult woman with very long flowing lavender hair that dissolves into mist at the tips, pale green glowing eyes, a crown of frosted sea-glass and pearls, a fitted gown of layered translucent fog-silk with bare shoulders and a high slit, a lantern-scepter whose green flame drips fog, a veil of mist curtaining around her like a stage', p2: 'second phase: she raises the scepter high, the mist veil tears open into swirling fog-shadow silhouettes around her, her hair whipping upward, eyes blazing green, the crown glowing', cutin: 'close-up of her half-veiled face, one green eye visible through parting fog, a sly smile, pearls and sea-glass catching the lantern light' },
  storm_whale: { name: '폭풍 고래', beast: true, p1: 'act-2 alternate boss: a colossal sky whale swimming through a sea of clouds, deep navy hide with glowing pale-blue constellation-like markings, a crackling thundercloud riding on its back like a mane, small clock-gear barnacles along its jaw, huge calm golden eye (draw the head and front half large, the tail fading into cloud)', p2: 'second phase "eye of the storm": the whale rears up as a cyclone wraps around it, lightning arcing between its markings, the thundercloud mane blazing white, rain and wind lines', cutin: 'extreme close-up of the giant golden eye reflecting the tiny night-watch party, lightning crackling across the navy hide' },
  dawn: { name: '새벽', p1: 'the master of the tower: an adult woman with long white hair and gold eyes, a sky-blue dress the color of a sunrise, holding a giant clock hand as a weapon, faint sunlight behind her', p2: 'second phase "the sun rises": her dress blazes with sunrise orange and gold, a halo of dawn light, the clock hand glowing', cutin: 'close-up of her golden eyes as the sun rises behind her, the night sky splitting', p3: 'third phase "high noon" (only on deep difficulty): she soars above the tower with the full sun behind her like great wings of light, white hair turned to gold flame, the clock hand now a blazing spear, the dress pure white and gold, overwhelming radiance but the same face' },
};

// ── 배경 ─────────────────────────────────────────────────
export const BGS = {
  act1: '1막 항구층 전투 배경 — a flooded harbor dock inside the tower at night, rusty cranes, fog, floating lanterns on dark sea water',
  act2: '2막 구름층 전투 배경 — a bridge above the clouds, a pinwheel tower, lightning in a grey-violet sky',
  act3: '3막 별층 전투 배경 — a glass floor over a sea of stars, celestial machinery and giant clock gears, dark blue and gold',
  hq: '본부 — the cozy night-watch headquarters inside an old lighthouse building: a round room, a long table, lanterns, maps on the walls, a staircase',
  map1: '1막 지도 배경 — the lower part of the tower rising from a night harbor, seen from outside',
  map2: '2막 지도 배경 — the middle of the tower piercing the clouds',
  map3: '3막 지도 배경 — the top of the tower among stars, the horizon faintly brightening',
  ep_clocktower: '에피소드 장소: 시계탑 — inside an old clocktower, huge gears and a giant clock face from behind',
  ep_convent: '에피소드 장소: 수녀원 — a small seaside convent at night, a chapel with candles',
  ep_nightmarket: '에피소드 장소: 야시장 — a harbor night market street with paper lanterns and stalls',
  ep_lighthouse: '에피소드 장소: 등대 — the top of a real lighthouse on the shore, the lamp room',
  ep_kitchen: '에피소드 장소: 본부 부엌 — the headquarters kitchen with a big pot of soup steaming',
  ep_harbor: '에피소드 장소: 항구 거리 — a sloped harbor town street at night, the tower visible far out at sea',
};

// ── 도구 아이콘 40 ───────────────────────────────────────
// ── 동료 전용 도구 아이콘 20 (별자리 4, docs/10) ─────────────────
export const SIG_RELICS = {
  sig_sion: '첫 별의 모래 — a tiny glass vial of glittering star sand',
  sig_lunaria: '달빛 방울 — a small silver bell shaped like a crescent moon',
  sig_akane: '붉은 숫돌 — a red whetstone with ember sparks',
  sig_eleonore: '태엽 열쇠 — an ornate brass wind-up key with a clock motif',
  sig_iris: '스승의 숫돌 — an old grey whetstone wrapped in a faded cloth band',
  sig_noel: '깃털 베개 — a small fluffy pink feather pillow',
  sig_raven: '독 주머니 — a black leather pouch with a green poison drop mark',
  sig_mimimomo: '쌍둥이 거울 — two small hand mirrors, pink and sky blue, back to back',
  sig_sebas: '은 찻주전자 — a polished silver teapot with steam',
  sig_mariana: '금화 주머니 — a bulging pouch spilling gold coins',
  sig_tomori: '작은 등불 — a small yellow hand lantern',
  sig_sigrun: '은빛 깃 — a single silver-white feather plume',
  sig_zeno: '용비늘 조각 — a black dragon scale with a golden edge',
  sig_brick: '예비 포탄 — a spare cannonball with a red stripe',
  sig_marta: '성당 열쇠 — a heavy iron chapel key with a cross-shaped bow',
  sig_finn: '지름길 지도 — a folded paper map with a red dotted shortcut line',
  sig_laila: '바람 깃발 — a small torn sky-blue pennant fluttering',
  sig_dora: '모루 방패 — a tiny anvil-shaped shield',
  sig_gordon: '큰 도시락 — a big stacked lunch box tied with cloth',
  sig_nerea: '고래 귀걸이 — a teal earring shaped like a small whale tail',
  sig_estelle: '별똥 브로치 — a white-gold star-shaped brooch with a tiny blue comet tail',
  sig_bertha: '낡은 안내 깃발 — a small faded guide pennant on a short pole',
  sig_fukuro: '행운 고양이 — a small beckoning lucky cat charm with an owl mask',
};

export const RELICS = {
  old_watch: '낡은 회중시계 — an old brass pocket watch',
  lantern: '야경단 등불 — a night-watch lantern',
  first_aid: '구급 가방 — a small first-aid bag',
  twin_ribbon: '쌍둥이 리본 — two ribbons, pink and blue, tied together',
  salt_pouch: '소금 주머니 — a small salt pouch',
  sea_glass: '바다 유리 — a piece of smooth sea glass',
  compass: '구리 나침반 — a copper compass',
  umbrella: '우산 — a folded umbrella',
  scarf: '따뜻한 목도리 — a warm knitted scarf',
  star_candy: '별사탕 — star-shaped candies',
  star_map: '별 지도 — a rolled star map',
  hourglass: '깨진 모래시계 — a cracked hourglass',
  whistle: '은 호루라기 — a silver whistle',
  banner: '대열 깃발 — a small formation flag',
  bandage: '붕대 묶음 — a bundle of bandages',
  moon_bottle: '달빛 병 — a bottle of moonlight',
  pistol: '장전된 권총 — a loaded flintlock pistol',
  moon_shard: '달 조각 — a glowing crescent moon shard',
  armband: '야경단 완장 — a night-watch armband',
  bond_thread: '인연의 실 — a glowing red thread tied in a knot',
  gold_feather: '금빛 깃털 — a golden feather',
  dawn_feather: '새벽의 깃털 — a sunrise-colored feather',
  stopped_tower: '멈춘 시계탑 — a tiny stopped clocktower',
  star_crown: '별의 왕관 — a crown of stars',
  tide_bell: '밀물 종 — a small brass bell with sea foam',
  rope: '묶음 밧줄 — a coiled rope tied in a sailor knot',
  crescent_pin: '초승 브로치 — a silver crescent moon brooch',
  half_ribbon: '반달 리본 — a ribbon shaped like a half moon',
  full_mirror: '보름 손거울 — a round hand mirror reflecting a full moon',
  new_ink: '그믐 먹물 — a small bottle of black ink with no moon reflection',
  duo_scarf: '맞춤 목도리 — two matching scarves knotted together',
  duo_shield: '한 쌍의 방패 — two small shields overlapping',
  sand_pendant: '모래시계 펜던트 — a tiny hourglass on a chain',
  last_ticket: '막차표 — a last-train ticket stub',
  red_knot: '붉은 실 매듭 — a red string tied in a bow',
  watch_chain: '시곗줄 — a gold watch chain without the watch',
  moon_compass: '달 나침반 — a compass whose needle is a crescent moon',
  twin_star: '쌍별 펜던트 — a pendant with two stars side by side',
  reverse_clock: '거꾸로 도는 시계 — a clock face with hands spinning backward',
  star_sash: '별자리 띠 — a sash embroidered with a constellation',
};

// ── 목록 만들기 ──────────────────────────────────────────
const join = (...xs) => xs.filter(Boolean).join('\n\n');
const rarityStyle = (r) => STYLE['rarity' + r];

// 그림체 기준 그림(사용자가 고른 시안 C). 시안 묶음 말고는 모든 그림에 첨부한다.
export const STYLE_REF = 'style/akane_c.png';

function item(kind, id, batch, file, prompt, extra = {}) {
  const s = SPEC[kind];
  if (kind !== 'style') extra = { ...extra, reference_images: [...(extra.reference_images || []), STYLE_REF] };
  return { id, kind, batch, file: `${s.folder}/${file}`, width: s.w, height: s.h, transparent: s.transparent,
    max_colors: s.colors === Infinity ? null : s.colors, native: s.native, note: s.note, prompt, ...extra };
}

// 시트 한 장 + 잘라 낼 칸들. cells: [[종류, id, 파일, 열, 행, 칸 안에서 쓸 영역(없으면 칸 전체)], …]
// 잘라 낸 그림(outputs)은 GPT가 그리지 않고 tools/slice-sheets.mjs가 만든다. 검사 도구는 outputs도 같이 본다.
const outputs = [];
function sheet(kind, id, batch, file, prompt, grid, cells, extra = {}) {
  const s = SPEC[kind], [cols, rows] = grid, cw = s.w / cols, ch = s.h / rows;
  const it = item(kind, id, batch, file, prompt, extra);
  it.cells = cells.map(([k, cid, cfile, col, row, area]) => {
    const [ax, ay, aw, ah] = area || [0, 0, cw, ch], t = SPEC[k];
    const o = { id: cid, kind: k, batch, file: `${t.folder}/${cfile}`, width: t.w, height: t.h, transparent: t.transparent,
      max_colors: t.colors === Infinity ? null : t.colors, native: t.native, note: t.note, from: it.file };
    outputs.push(o);
    return { file: o.file, x: col * cw + ax, y: row * ch + ay, w: aw, h: ah, native: t.native.split('×').map(Number), out: [t.w, t.h] };
  });
  return it;
}

export function assetList() {
  const out = [];
  const batches = [];
  outputs.length = 0;
  for (const [id, c] of Object.entries(CHARS)) {
    const batch = `char-${id}`;
    const base = join(STYLE.pixel, STYLE.handmade, STYLE.distinct, STYLE.character, rarityStyle(c.rarity));
    const who = `${c.name} (${id}): ${c.sheet} Accent colors: ${c.accent}.`;
    batches.push({ id: batch, title: `${'★'.repeat(c.rarity)} ${c.name}`,
      reference_sheet_prompt: join(base, `Character reference sheet of ${who} Full body front view plus a face close-up, plain background. Native resolution about 384x256, upscaled with nearest-neighbor.`) });
    const ref = [`chars/${id}_normal.png`];
    out.push(item('stand', `${id}_stand`, batch, `${id}_stand.png`,
      join(base, STYLE.onModel, `${who}\nFull-body battle stance, standing at a slight three-quarter angle facing RIGHT (toward enemies), weapon ready. Fully transparent background, nothing behind the character. Feet near the bottom edge, empty margin above the head. Native resolution 256x384 pixels, upscaled exactly 4x with nearest-neighbor to 1024x1536. Up to about 96 colors, careful pixel shading on hair, eyes and fabric.`),
      { must_show: '전신, 오른쪽을 향한 전투 자세, 무기' }));
    for (const [face, expr] of Object.entries(c.faces)) {
      // 웃음·진지 표정은 아직 게임에서 안 써서 나중 묶음(extra-<id>)으로
      out.push(item('portrait', `${id}_${face}`, face === 'normal' ? batch : `extra-${id}`, `${id}_${face}.png`,
        join(base, STYLE.onModel, `${who}\nWaist-up portrait facing slightly to the side. Expression and pose: ${expr}. Fully transparent background with nothing behind the character. Head, hair and arms stay inside the image with empty margin on the left, right and top; only the waist touches the bottom edge. Native resolution 256x384 pixels, upscaled exactly 4x with nearest-neighbor to 1024x1536. Up to about 96 colors, careful pixel shading on hair, eyes and fabric.`),
        { followup_prompt: `Same character, same style. Waist-up portrait, transparent background. Expression and pose: ${expr}.`, reference_images: face === 'normal' ? [] : ref }));
    }
    batches.push({ id: `extra-${id}`, title: `${c.name} 나중(웃음·진지 표정·컷인)` });
    out.push(item('cutin', `${id}_cutin`, `extra-${id}`, `${id}_cutin.png`,
      join(base, STYLE.onModel, `${who}\nDramatic cut-in panel for a special move: ${c.cutin}. Wide horizontal composition, the face and action inside the middle horizontal band (the top and bottom will be cropped to 1536x576). Speed lines made of pixels, strong accent colors (${c.accent}).`),
      { reference_images: ref, must_show: '얼굴이 가운데 띠 안' }));
    out.push(item('outfit', `${id}_outfit2`, `skin-${id}`, `${id}_outfit2.png`,
      join(base, STYLE.onModel, `${who}\nSame person, same face and hair, but in a ${c.outfit}. Full-body standing pose facing slightly right, transparent background. Native resolution 256x384 pixels, upscaled exactly 4x to 1024x1536.`),
      { reference_images: ref }));
  }

  // 전투 스프라이트: 동료마다 시트 한 장(4×2)에 8동작. 전투 화면은 일러스트 대신 이 저해상도 도트를 쓴다(js/art.js battleArt).
  const FRAMES = [
    ['idle', 'IDLE: standing in a ready battle stance'],
    ['windup', 'WINDUP: the anticipation just before her attack — body coiled, weight on the back foot, weapon pulled back'],
    ['attack', 'ATTACK: the peak of her basic attack, lunging or striking toward the RIGHT with her weapon fully extended (no slash trail or effect — drawn separately)'],
    ['skill', 'SKILL: a strong casting pose (hand, weapon or staff raised), NO glow or magic effect drawn — effects are drawn separately'],
    ['guard', 'GUARD: bracing defensively, knees bent, weapon or arm raised in front like a shield (no barrier effect)'],
    ['hurt', 'HURT: just got hit, recoiling back to the LEFT, wincing, no blood'],
    ['down', 'DOWN: knocked out, kneeling or collapsed on the ground, eyes closed, no blood'],
    ['win', 'VICTORY: a confident, stylish win pose fitting her personality'],
  ];
  for (const [id, c] of Object.entries(CHARS)) {
    const batch = `pose-${id}`;
    batches.push({ id: batch, title: `${'★'.repeat(c.rarity)} ${c.name} 전투 스프라이트 — 몸만 (시트 1장 → 8동작)` });
    const who = `${c.name} (${id}): ${c.sheet} Accent colors: ${c.accent}.`;
    out.push(sheet('battlesheet', `${id}_body`, batch, `${id}_body.png`, join(STYLE.sprite, STYLE.handmade, STYLE.distinct, rarityStyle(c.rarity), `${who}
A battle sprite sheet of this ONE character: eight poses on one 1536x1024 canvas, split into eight equal cells of 384x512 (4 columns x 2 rows), reading order left to right, top to bottom. Keep an empty transparent margin of about 6% inside every cell edge — no part of a figure or effect may touch or cross a cell edge (the sheet is cut exactly on the cell lines). No borders, no grid lines, no gutters, no labels or text.
${FRAMES.map(([, t], i) => `- Cell ${i + 1} — ${t.replace('${c.fx}', c.fx)}`).join('\n')}
All eight cells are the SAME sprite redrawn by one pixel artist: identical face, hair shape, outfit details, palette and outline in every cell — only the pose changes.
BODY ONLY: draw just the character and what she holds or wears. NO magic effects, NO glow, NO sparkles or particles, NO slash trails, NO companion creature, pet or familiar, NO projectiles, NO ground shadow — the game draws those as separate layers.
In every cell: exactly the same character size and proportions (adult about 1:6.5 head-to-body, NOT chibi), the figure as LARGE as the cell allows (about 70-80% of the cell height; draw it smaller if a long weapon, ponytail or cape would otherwise reach a cell edge — the game evens out the size, but nothing may touch an edge), feet on the same line near the bottom of the cell, facing RIGHT toward the enemies (except HURT recoiling), the whole body and effect inside its own cell. Fully transparent background. Native resolution 192x256 pixels per cell (768x512 for the whole sheet), upscaled exactly 2x with nearest-neighbor.`),
      [4, 2], FRAMES.map(([f], i) => ['sprite', `${id}_sp_${f}`, `${id}_${f}.png`, i % 4, Math.floor(i / 4)]),
      { fit: 'union', must_show: '4×2: 서기·준비·공격·스킬 / 방어·피격·쓰러짐·승리, 몸만(이펙트·동반자 없음), 칸 높이 70~80%(무기가 길면 더 작게, 칸 경계에 닿지 않는 게 먼저), 칸마다 같은 크기·발 위치', reference_images: [`chars/${id}_stand.png`, `chars/${id}_normal.png`] }));
  }

  // 카드 그림: 동료마다 종류별 4장(공격·방어·스킬·필살). 같은 종류 카드가 같이 쓴다(js/cardkind.js). 인연 듀오 카드는 임시 일러스트.
  const KIND_SCENE = {
    atk: ['공격', 'attacking toward the right with her weapon, the target only as a dark silhouette, a bright impact flash'],
    guard: ['방어', 'a strong defensive pose protecting her allies, a glowing barrier or shield in her accent color'],
    skill: ['스킬', 'casting her signature power, the effect swirling around her'],
    special: ['필살', 'her most dramatic all-out signature move, the effect at full power filling the frame'],
  };
  for (const [id, c] of Object.entries(CHARS)) {
    const batch = `cards-${id}`;
    batches.push({ id: batch, title: `${'★'.repeat(c.rarity)} ${c.name} 카드 그림 (시트 1장 → 4장)` });
    const base = join(STYLE.pixel, STYLE.handmade, STYLE.distinct, STYLE.character, rarityStyle(c.rarity), STYLE.onModel);
    const mine = Object.values(CARDS).filter((d) => d.ch === id);
    const names = (k) => mine.filter((d) => cardArtKind(d) === k).map((d) => `「${d.name}」`).slice(0, 5).join(', ');
    const pos = { atk: ['Top-left', 0, 0], guard: ['Top-right', 1, 0], skill: ['Bottom-left', 0, 1], special: ['Bottom-right', 1, 1] };
    out.push(sheet('cardsheet', `${id}_cards`, batch, `${id}_cards.png`, join(base, `Four flashy skill card illustrations of ${c.name} on one 1024x1024 canvas, split into four equal square cells of 512x512 (2x2). Keep an empty transparent margin of about 6% inside every cell edge — no part of a figure or effect may touch or cross a cell edge (the sheet is cut exactly on the cell lines). No borders, no grid lines, no gutters, NO text anywhere (card titles below are Korean and must NOT be written).
${Object.entries(KIND_SCENE).map(([k, [label, scene]]) => `- ${pos[k][0]} cell — ${label.toUpperCase()} (${label === '필살' ? 'rare' : label} cards${names(k) ? ` such as ${names(k)}` : ''}): ${c.name} ${scene}.`).join('\n')}
${c.name} is ON-MODEL from the attached references in every cell. Visual motifs: ${c.fx}. Accent colors: ${c.accent}. Each cell is a complete, spectacular scene with its own dark night background, the face clearly visible and attractive, dynamic angle, big readable shapes. Keep everything important inside the middle 512x384 band of each cell — the top 64 and bottom 64 pixels of every cell will be cut off. Fine, detailed pixel art: native resolution 256x256 pixels per cell (512x512 for the whole sheet), upscaled exactly 2x with nearest-neighbor.`),
      [2, 2], Object.entries(pos).map(([k, [, col, row]]) => ['card', `${id}_card_${k}`, `${id}_${k}.png`, col, row, [0, 64, 512, 384]]),
      { reference_images: [`chars/${id}_normal.png`, `chars/${id}_stand.png`], must_show: `2×2: 공격·방어 / 스킬·필살, 칸마다 ${c.name} 얼굴과 화려한 기술` }));
  }

  // 그림체 시안: ★5 한 명을 도트 굵기만 다르게 4장. 사용자가 고른 시안이 STYLE의 기준이 된다(게임에 안 씀).
  const STYLE_VARIANTS = {
    a: ['기준(128×192 도트 8배)', 'Native resolution 256x384 pixels, upscaled exactly 4x with nearest-neighbor to 1024x1536. Up to about 96 colors, careful pixel shading on hair, eyes and fabric. Up to about 48 colors.'],
    b: ['굵은 도트(64×96 도트 16배)', 'Very chunky retro pixel art: native resolution only 64x96 pixels, upscaled exactly 16x with nearest-neighbor to 1024x1536. About 24 colors. Big readable pixel clusters, iconic shapes.'],
    c: ['세밀한 도트(256×384 도트 4배)', 'Fine, detailed pixel art: native resolution 256x384 pixels, upscaled exactly 4x with nearest-neighbor to 1024x1536. Up to about 96 colors, careful pixel shading on hair, eyes and fabric, still no anti-aliasing.'],
    d: ['고화질 픽셀 일러스트(색 제한 없음)', 'Premium high-detail pixel-art illustration like a modern HD pixel gacha game splash: crisp pixel detail, rich lighting and glow effects, no color limit, still visibly pixel-based (no smooth airbrush).'],
  };
  for (const [id, c] of Object.entries(CHARS).filter(([, c]) => c.rarity === 5)) {
    const batch = `style-${id}`;
    batches.push({ id: batch, title: `그림체 시안 ${c.name} (4장, 게임에 안 씀)` });
    const who = `${c.name} (${id}): ${c.sheet} Accent colors: ${c.accent}.`;
    for (const [v, [label, res]] of Object.entries(STYLE_VARIANTS)) {
      out.push(item('style', `style_${id}_${v}`, batch, `${id}_${v}.png`,
        join(v === 'd' ? STYLE.keyart : STYLE.pixel, STYLE.character, STYLE.rarity5, `${who}\nFull-body battle stance, standing at a slight three-quarter angle facing RIGHT, weapon and signature magic effect visible, the most attractive version of this character. Fully transparent background. ${res}\nThis is style test 「${v.toUpperCase()}」 — the four tests of this batch must show the SAME character design and pose, only the pixel resolution/detail changes.`),
        { must_show: `시안 ${v.toUpperCase()} — ${label}`, reference_images: v === 'a' ? [] : [`style/${id}_a.png`] }));
    }
  }

  // ★5 전신 CG
  batches.push({ id: 'cg-star5', title: '★5 전신 CG' });
  for (const [id, c] of Object.entries(CHARS).filter(([, c]) => c.rarity === 5)) {
    out.push(item('cg', `star5_${id}`, 'cg-star5', `star5_${id}.png`,
      join(STYLE.keyart, STYLE.handmade, STYLE.character, STYLE.onModel, `Full-body splash art of ${c.name}: ${c.sheet} Her most dramatic signature pose with her magical effect at full power (${c.cutin}). 16:9 composition (1536x864), the character fills the frame, night sky and tower background.`),
      { reference_images: [`chars/${id}_normal.png`, `chars/${id}_stand.png`] }));
  }

  // 인연 듀오 컷인
  batches.push({ id: 'duo', title: `인연 듀오 컷인 ${Object.keys(DUOS).length}쌍` });
  for (const [id, d] of Object.entries(DUOS)) {
    const [a, b] = d.pair;
    out.push(item('duo', `duo_${id}`, 'duo', `duo_${id}.png`,
      join(STYLE.pixel, STYLE.handmade, STYLE.distinct, STYLE.character, STYLE.onModel, `Duo cut-in of ${CHARS[a].name} and ${CHARS[b].name}: ${d.scene}. Both characters ON-MODEL from the attached references, faces clearly visible. Wide horizontal composition; the top and bottom will be cropped to 1536x768. Speed lines made of pixels.`),
      { reference_images: [`chars/${a}_normal.png`, `chars/${b}_normal.png`], must_show: '두 사람 얼굴 둘 다' }));
  }

  // 적: 막마다 일반 적 + 강적을 3×2 시트(6마리씩)로
  for (const act of ['act1', 'act2', 'act3']) {
    const batch = `enemy-${act}`;
    batches.push({ id: batch, title: `${act.slice(-1)}막 적 (시트 → 한 마리씩)` });
    const list = [...Object.entries(ENEMIES[act]).map(([id, d]) => ['enemy', id, d]), ...Object.entries(ENEMIES[act + '_elite']).map(([id, d]) => ['elite', id, d])];
    for (let n = 0; n * 6 < list.length; n++) {
      const part = list.slice(n * 6, n * 6 + 6);
      out.push(sheet('foesheet', `${act}_foes_${n + 1}`, batch, `${act}_foes_${n + 1}.png`, join(STYLE.pixel, STYLE.handmade, part.some(([, , d]) => /woman/.test(d)) ? STYLE.character : '',
        `An enemy sprite sheet on one 1536x1024 canvas, split into six equal square cells of 512x512 (3 columns x 2 rows), reading order left to right, top to bottom. Keep an empty transparent margin of about 6% inside every cell edge — no part of a figure or effect may touch or cross a cell edge (the sheet is cut exactly on the cell lines). No borders, no grid lines, no gutters, no labels or text. One enemy per cell, the whole body inside its cell, feet near the bottom of the cell, all facing LEFT (toward the party). Cute-but-menacing gacha-game monster designs.
${part.map(([k, , d], i) => `- Cell ${i + 1}: ${k === 'elite' ? 'ELITE (bigger and more imposing, fills more of the cell): ' : ''}${d}`).join('\n')}
${part.length < 6 ? `Cells ${part.length + 1}-6 stay completely empty (transparent).\n` : ''}Fully transparent background. Low-resolution battle sprites (chunkier pixels than character illustrations, like premium 16-bit era RPG battle sprites, about 64 colors each, clean dark outline): native resolution 256x256 pixels per cell (768x512 for the whole sheet), upscaled exactly 2x with nearest-neighbor.`),
        [3, 2], part.map(([k, id], i) => [k, id, `${id}.png`, i % 3, Math.floor(i / 3)]),
        { must_show: `3×2 칸에 ${part.map(([, id]) => id).join('·')}` }));
    }
  }  // 적 자세: 적마다 공격·피격 2칸(위 줄 공격, 아래 줄 피격), 3마리씩 한 시트. 기존 적 그림을 기준으로 첨부해 같은 모습·같은 크기로
  for (const act of ['act1', 'act2', 'act3']) {
    const batch = `foepose-${act}`;
    batches.push({ id: batch, title: `${act.slice(-1)}막 적 공격·피격 자세 (시트 → 적마다 2칸)` });
    const list = [...Object.entries(ENEMIES[act]), ...Object.entries(ENEMIES[act + '_elite'])];
    for (let n = 0; n * 3 < list.length; n++) {
      const part = list.slice(n * 3, n * 3 + 3);
      out.push(sheet('foesheet', `${act}_foepose_${n + 1}`, batch, `${act}_foepose_${n + 1}.png`, join(STYLE.pixel, STYLE.handmade, STYLE.onModel,
        `Battle poses for ${part.length} enemies, ON-MODEL from the attached enemy sprites (same design, colors, pixel size and body size as the attached sprite — only the pose changes). One 1536x1024 canvas split into six equal square cells of 512x512 (3 columns x 2 rows). Column N is enemy N. TOP row = ATTACK pose (lunging or striking toward the LEFT at the party, mouth/claws/weapon forward). BOTTOM row = HURT pose (recoiling back to the RIGHT, flinching, eyes squeezed). Keep about 6% empty margin inside every cell edge. No effects, no text, no borders. All facing LEFT.
${part.map(([, d], i) => `- Column ${i + 1}: ${d}`).join('\n')}
${part.length < 3 ? `Columns ${part.length + 1}-3 stay completely empty (transparent).\n` : ''}Fully transparent background. Native 256x256 pixels per cell, upscaled exactly 2x with nearest-neighbor.`),
        [3, 2], part.flatMap(([id], i) => [['enemy', `${id}_attack`, `${id}_attack.png`, i, 0], ['enemy', `${id}_hurt`, `${id}_hurt.png`, i, 1]]),
        { must_show: `열마다 적 하나(위 공격·아래 피격): ${part.map(([id]) => id).join('·')}`, reference_images: part.map(([id]) => `enemies/${id}.png`) }));
    }
  }

  for (const [id, b] of Object.entries(BOSSES)) {
    const batch = `boss-${id}`;
    batches.push({ id: batch, title: `보스 ${b.name}` });
    const human = join(STYLE.sprite, STYLE.handmade, b.beast ? '' : STYLE.character);
    out.push(item('boss', `boss_${id}_1`, batch, `boss_${id}_1.png`, join(human, `Boss sprite, ${b.name}: ${b.p1}. Facing LEFT, imposing, a big low-resolution battle sprite. Fully transparent background. Native resolution 128x192 pixels, upscaled exactly 8x with nearest-neighbor to 1024x1536.`)));
    out.push(item('boss', `boss_${id}_2`, batch, `boss_${id}_2.png`, join(human, STYLE.onModel, `Boss sprite, ${b.name}, ${b.p2}. Same person as the attached first-phase sprite, same pixel size. Facing LEFT. Fully transparent background. Native 128x192, upscaled 8x to 1024x1536.`), { reference_images: [`enemies/boss_${id}_1.png`] }));
    if (b.p3) out.push(item('boss', `boss_${id}_3`, batch, `boss_${id}_3.png`, join(human, STYLE.onModel, `Boss sprite, ${b.name}, ${b.p3}. Same person as the attached first-phase sprite, same pixel size. Facing LEFT. Fully transparent background. Native 128x192, upscaled 8x to 1024x1536.`), { reference_images: [`enemies/boss_${id}_1.png`] }));
    out.push(item('cutin', `boss_${id}_cutin`, batch, `boss_${id}_cutin.png`, join(STYLE.pixel, STYLE.handmade, b.beast ? '' : STYLE.character, STYLE.onModel, `Boss cut-in: ${b.cutin}. Wide horizontal composition, face in the middle band (cropped to 1536x576).`), { reference_images: [`enemies/boss_${id}_1.png`] }));
  }

  // 배경·타이틀·소환·아이콘
  // 기술 이펙트: 공용 4종(6프레임) + 동료마다 시그니처 이펙트(공격 3프레임 / 스킬 3프레임). 프레임을 차례로 돌려 터뜨린다(js/juice.js playFx).
  const fxCells = (name, n) => Array.from({ length: n }, (_, i) => ['fx', `fx_${name}_${i + 1}`, `${name}_${i + 1}.png`, i % 3, Math.floor(i / 3)]);
  const fxSheet = (batch, id, prompt, cells, must) => out.push(sheet('fxsheet', id, batch, `${id}.png`, join(STYLE.vfx, STYLE.handmade, prompt + `
One 1536x1024 canvas split into six equal square cells of 512x512 (3 columns x 2 rows), reading order left to right, top to bottom. Keep about 6% empty margin inside every cell edge; nothing touches a cell edge. No borders, no grid lines, no labels. Each effect centered in its cell. Native resolution 256x256 pixels per cell (768x512 for the whole sheet), upscaled exactly 2x with nearest-neighbor.`), [3, 2], cells, { must_show: must }));
  const COMMON_FX = {
    slash: 'a sword SLASH hit: a wide crescent slash arc (white core, pale blue edge) appearing, flashing brightest, then breaking into sparks and fading',
    explode: 'an EXPLOSION hit: a small bright flash, expanding fireball with smoke ring, debris and embers, then dissipating smoke',
    pierce: 'a PIERCE hit: a sharp spear thrust streak from the left with a star-shaped impact flash, shock ring, then fading sparks',
    magic: 'a MAGIC hit: a glowing rune circle snapping open, a burst of light orbs and stars, then sparkling dust fading',
  };
  batches.push({ id: 'fx-common', title: '공용 타격 이펙트 4종 (시트 4장 → 6프레임씩)' });
  for (const [name, desc] of Object.entries(COMMON_FX)) fxSheet('fx-common', `fx_${name}`, `Six animation frames of ${desc}. Frame 1 is the very start (small), frame 3-4 the peak (biggest, brightest), frame 6 almost gone.`, fxCells(name, 6), `3×2 프레임: ${name} 시작→절정→사라짐`);
  for (const [id, c] of Object.entries(CHARS)) {
    batches.push({ id: `fx-${id}`, title: `${c.name} 시그니처 이펙트 (시트 1장 → 공격 3·스킬 3프레임)` });
    fxSheet(`fx-${id}`, `fx_${id}`, `${c.name}'s signature skill effects (her motifs: ${c.fx}; accent colors ${c.accent}). Top row = her ATTACK HIT effect landing on an enemy, 3 frames: impact start, peak burst, fading. Bottom row = her SKILL AURA effect around her body (empty space in the middle where she stands), 3 frames: forming, full power, fading. Make them spectacular and unmistakably hers.`,
      [...[0, 1, 2].map((i) => ['fx', `fx_${id}_atk_${i + 1}`, `${id}_atk_${i + 1}.png`, i, 0]), ...[0, 1, 2].map((i) => ['fx', `fx_${id}_skill_${i + 1}`, `${id}_skill_${i + 1}.png`, i, 1])],
      '위 3칸 공격 타격 이펙트, 아래 3칸 스킬 오라, 캐릭터 없이 이펙트만');
  }

  // 캐릭터 층(docs/BATTLE_PLAN.md): 몸과 따로 움직이는 오라·동반자·투사체. 몸 스프라이트 위아래에 겹쳐 그린다(js/juice.js).
  // 오라는 동료마다 모양·자리가 다르다(같은 고리 모양 금지). 게임은 자리(발밑·등 뒤·머리 위)에 맞춰 몸보다 작게 붙인다(js/juice.js AURA_AT).
  const AURA = {
    akane: 'a LOW BED OF FLAMES on the ground: crimson-and-gold fire tongues licking upward from a wide flat base, embers and sparks floating up; wide at the bottom, empty and transparent in the upper half. Placed at her feet.',
    sion: 'a slowly turning CONSTELLATION CHART halo: a flat round star map of thin glowing lines connecting 7-9 bright star nodes, faint blue nebula dust, like a sacred disk. Placed behind her shoulders.',
    lunaria: 'a large pale CRESCENT MOON with soft silver glow and two thin moonlight veil ribbons drifting from its tips, a few falling silver petals. Placed above and behind her head.',
    eleonore: 'a giant translucent violet CLOCK FACE magic circle: roman numerals, two clock hands that move a little each frame, small brass gears turning at its rim. Placed behind her back.',
    nerea: 'rising sea-water BUBBLES and tiny glowing star-fish drifting upward from a small ring of rippling starlit water on the ground; narrow column, mostly empty above. Placed at her feet.',
  };
  for (const [id, shape] of Object.entries(AURA)) {
    const c = CHARS[id];
    batches.push({ id: `aura-${id}`, title: `★5 ${c.name} 오라 (시트 1장 → 6프레임 반복)` });
    fxSheet(`aura-${id}`, `aura_${id}`, `${c.name}'s idle AURA, drawn on its own (no character). Shape: ${shape} Accent colors ${c.accent}. Six frames of a seamless LOOP (frame 6 flows back into frame 1), gentle motion between frames. Make the SHAPE unmistakable — NOT a generic ring of sparkles. Keep it elegant and not too dense.`,
      fxCells(`${id}_aura`, 6), `3×2 반복 6프레임, 모양: ${shape.split(':')[0]}`);
  }
  const PETS = {
    nerea: 'her STAR WHALE companion: a small translucent whale made of constellations (deep blue body, glowing star markings, a starlight water trail)',
    sion: 'her STAR SPIRIT companions: three tiny lantern-like star spirits with cute faces and glowing tails, flying as a group',
  };
  for (const [id, pet] of Object.entries(PETS)) {
    const c = CHARS[id];
    batches.push({ id: `pet-${id}`, title: `★5 ${c.name} 동반자 (시트 1장 → 대기 3·공격 3프레임)` });
    fxSheet(`pet-${id}`, `pet_${id}`, `${c.name}'s companion, drawn on its own: ${pet}. ONLY the companion — no human character. Facing RIGHT. Top row = IDLE floating loop, 3 frames (gently bobbing, frame 3 loops back to frame 1). Bottom row = ATTACK, 3 frames: rearing back, charging forward to the right, hitting with a burst of starlight. Same size in every cell.`,
      [...[0, 1, 2].map((i) => ['fx', `pet_${id}_idle_${i + 1}`, `${id}_pet_idle_${i + 1}.png`, i, 0]), ...[0, 1, 2].map((i) => ['fx', `pet_${id}_atk_${i + 1}`, `${id}_pet_atk_${i + 1}.png`, i, 1])],
      '위 3칸 대기(반복), 아래 3칸 공격, 동반자만(사람 없음), 오른쪽을 봄');
  }
  const PROJ = {
    brick: 'a glowing cannon shell with a fiery trail', mariana: 'a flintlock bullet with gold sparks and a smoke trail', fukuro: 'a thrown lucky-charm bundle tumbling with trinkets',
    sion: 'a shooting star with a constellation-line trail', noel: 'a dreamy pink-lavender star with a sheep-cloud puff trail', lunaria: 'a spinning silver crescent-moon blade',
    eleonore: 'a spinning glowing clock hand with violet time ripples', tomori: 'a warm lantern-light orb with a beam trail', nerea: 'a starlight harpoon with a water-spray trail',
  };
  const projIds = Object.keys(PROJ);
  batches.push({ id: 'proj', title: `원거리 투사체 ${projIds.length}종 (시트 ${Math.ceil(projIds.length / 2)}장 → 3프레임씩)` });
  for (let n = 0; n * 2 < projIds.length; n++) {
    const pair = projIds.slice(n * 2, n * 2 + 2);
    fxSheet('proj', `proj_${n + 1}`, `Ranged PROJECTILES flying to the RIGHT, each animated in 3 frames (a short flicker loop while flying). ${pair.map((id, r) => `${r ? 'Bottom' : 'Top'} row = ${CHARS[id].name}'s projectile: ${PROJ[id]} (accent colors ${CHARS[id].accent})`).join('. ')}.${pair.length < 2 ? ' The bottom row stays completely empty (transparent).' : ''} Each projectile horizontal, pointing right, centered in its cell, about half the cell wide.`,
      pair.flatMap((id, r) => [0, 1, 2].map((i) => ['fx', `proj_${id}_${i + 1}`, `${id}_proj_${i + 1}.png`, i, r])),
      `한 줄에 투사체 하나씩 3프레임, 오른쪽을 향함: ${pair.join('·')}`);
  }

  batches.push({ id: 'bg', title: '배경' });
  for (const [id, desc] of Object.entries(BGS)) {
    out.push(item('bg', `bg_${id}`, 'bg', `${id}.png`, join(STYLE.pixel, STYLE.handmade, `Background: ${desc}. No people. Wide 16:9 view; keep the lower third simple so characters can stand in front. Native resolution 640x360 pixels, full color, limited palette of about 64 colors, upscaled exactly 2x with nearest-neighbor to 1280x720.`)));
  }
  // 지도 화면의 탑: 막마다 한 장. 게임(js/render/map.js)이 이 위에 층 난간·계단·칸 아이콘을 얹는다
  batches.push({ id: 'tower', title: '지도 탑 (막마다 1장)' });
  const TOWERS = {
    1: 'the lower part of the tower: weathered grey-violet harbor stone, iron rings and old ropes, barnacles and dripping sea water at the base, warm orange lantern windows, a big arched wooden door at the bottom center',
    2: 'the middle of the tower above the clouds: pale blue-grey stone, wind-worn, small pinwheels and fluttering cloth banners on the sides, wisps of cloud drifting across, cool white-blue windows, an arched opening at the bottom center',
    3: 'the top of the tower among the stars: deep navy stone with inlaid gold star patterns and small clock gears, glowing golden windows, a sharp golden spire, an arched opening at the bottom center',
  };
  for (const [n, desc] of Object.entries(TOWERS)) {
    out.push(item('tower', `tower${n}`, 'tower', `tower${n}.png`, join(STYLE.pixel, STYLE.handmade, `A single tall stone TOWER seen straight from the front (orthographic, no perspective), ${desc}. The tower body is centered and about 76% of the canvas width, rising from the bottom edge; the top 16% is its pointed roof. FLAT front wall with a few small windows spread evenly — NO balconies, NO ledges, NO stairs, NO doors except the one at the bottom, NO people (the game draws floor ledges, stairs and icons on top). Fully transparent background around the tower. Native resolution 300x318 pixels, about 48 colors, chunky readable pixels, upscaled exactly 4x with nearest-neighbor to 1200x1272.`)));
  }
  batches.push({ id: 'title', title: '타이틀 키아트' });
  // v7: 매끈한 애니 일러스트(AI 티) 대신 게임과 같은 도트 — 파일 이름을 key_px.png로 바꿔 다시 그린다(js/render/title.js가 먼저 찾음)
  out.push(item('title', 'title_key', 'title', 'key_px.png',
    join(STYLE.pixel, STYLE.handmade, STYLE.character, STYLE.distinct, STYLE.onModel, `TRUE PIXEL ART title key art, draw it at 384x216 native resolution and upscale exactly 4x with nearest-neighbor to 1536x864; visible square pixels everywhere, limited palette of about 64 colors, NOT a smooth painted anime illustration. Title key art: three night-watch members standing back to back on a ledge of a tower rising from the night sea — the swordswoman Iris (center), the gunner Brick (left) and the tall nun Marta (right), ON-MODEL from the attached references. Lanterns, stars, a crescent moon. Keep the right 40% of the image darker and simpler for the menu. 16:9 (1536x864).`),
    { reference_images: ['chars/iris_normal.png', 'chars/brick_normal.png', 'chars/marta_normal.png'] }));
  batches.push({ id: 'summon', title: '별 소환 연출' });
  out.push(item('summon', 'summon_sky', 'summon', 'sky.png', join(STYLE.keyart, STYLE.handmade, 'Summon screen: the rooftop of the night-watch lighthouse headquarters under a vast starry night sky, a telescope and railing in the foreground, empty center of the sky where shooting stars will fall. No people. 16:9 (1536x864).')));
  const meteors = { 3: 'white', 4: 'violet', 5: 'gold, the biggest and brightest with sparkles' };
  for (const [r, col] of Object.entries(meteors)) {
    out.push(item('meteor', `meteor_${r}`, 'summon', `meteor_${r}.png`, join(STYLE.pixel, STYLE.handmade, `A single shooting star effect, ${col}, falling diagonally from top-right to bottom-left with a pixel trail. Fully transparent background. Native 64x64, upscaled 8x to 512x512.`)));
  }
  batches.push({ id: 'app', title: '앱 아이콘' });
  out.push(item('appicon', 'app_icon', 'app', 'icon.png', join(STYLE.pixel, STYLE.handmade, 'App icon for the game 「야경단」 (Night Watch): a tall dark tower rising from the night sea with a single warm lantern glowing at its top, a gold crescent moon, a few stars, deep navy sky. Bold, simple silhouette that still reads at 48x48. Fill the whole square edge to edge with the night background (no transparent corners, no border, no text); keep the tower and moon inside the central 80%. Native resolution 64x64 pixels, upscaled exactly 16x with nearest-neighbor to 1024x1024.')));
  // 아이콘: 4×4 시트(16개씩)
  const iconSheets = (batch, title, entries) => {
    batches.push({ id: batch, title: `${title} ${entries.length} (시트 → 한 개씩)` });
    for (let n = 0; n * 16 < entries.length; n++) {
      const part = entries.slice(n * 16, n * 16 + 16);
      out.push(sheet('iconsheet', `${batch}_${n + 1}`, batch, `${batch}_${n + 1}.png`, join(STYLE.pixel, STYLE.handmade,
        `An item icon sheet on one 1024x1024 canvas, split into sixteen equal square cells of 256x256 (4x4), reading order left to right, top to bottom. Keep an empty transparent margin of about 6% inside every cell edge — no part of a figure or effect may touch or cross a cell edge (the sheet is cut exactly on the cell lines). No borders, no grid lines, no gutters, no labels or text. One icon per cell, centered, readable at small size, bold dark outline, consistent style across all icons.
${part.map(([, d], i) => `- Cell ${i + 1}: ${d}`).join('\n')}
${part.length < 16 ? `Cells ${part.length + 1}-16 stay completely empty (transparent).\n` : ''}Fully transparent background. Native resolution 32x32 pixels per cell (128x128 for the whole sheet), upscaled exactly 8x with nearest-neighbor.`),
        [4, 4], part.map(([id], i) => ['icon', `relic_${id}`, `relic_${id}.png`, i % 4, Math.floor(i / 4)]),
        { must_show: `4×4 칸에 아이콘 ${part.length}개` }));
    }
  };
  iconSheets('icons', '도구 아이콘', Object.entries(RELICS));
  iconSheets('icons-sig', '동료 전용 도구 아이콘', Object.entries(SIG_RELICS));
  // UI 키트: CSS 네모 대신 그린 틀·버튼·띠(9칸 늘이기). 게임은 assets/ui/<이름>.png가 있으면 border-image로 쓴다(css/ui.css).
  const UI = [
    ['frame', 'a PANEL FRAME for 9-slice stretching: dark navy translucent center (flat, no pattern), a 2-pixel dark outline, a thin gold inner line, and small ornate gold corner pieces (stars/moon motif) in the four corners; the edges between corners are plain and uniform so they can stretch'],
    ['frame_hi', 'the same panel frame but highlighted: brighter gold edges and corner gems glowing'],
    ['frame_rose', 'the same panel frame in a crimson-rose color scheme (for danger / enemy panels)'],
    ['btn', 'a BUTTON for 9-slice stretching: a raised navy-blue plate with a 2-pixel dark outline, a light top bevel and dark bottom bevel, small rivets in the corners, plain uniform edges'],
    ['btn_hi', 'the same button hovered: slightly brighter with a thin gold rim'],
    ['btn_down', 'the same button pressed: bevel inverted, shifted down 1 pixel, darker'],
    ['btn_gold', 'a PRIMARY BUTTON: the same shape in rich gold with a warm glow, dark outline'],
    ['ribbon', 'a TITLE RIBBON banner for 9-slice stretching: a deep-red cloth band with folded tails on both ends, gold trim lines along the top and bottom, plain uniform middle'],
    ['tab', 'a small TAB label plate: dark navy with a gold top edge, rounded only by pixel steps'],
    ['divider', 'a thin horizontal DIVIDER line with a small gold star ornament in the middle, fading at both ends'],
    ['chip', 'a small pill-shaped STAT CHIP background: dark with a 1-pixel light outline, plain middle for 9-slice'],
    ['bar', 'an empty HP BAR frame: dark trough with a 1-pixel outline and tiny end caps, plain middle for 9-slice'],
    ['coin', 'a STAR SHARD currency icon: a glowing pale-gold four-pointed star crystal'],
    ['help', 'a round HELP button icon: a navy disc with a gold rim and a white question mark'],
    ['lock', 'a small LOCK icon: an old brass padlock'],
    ['seal', 'a round wax-SEAL style stamp: crimson wax with a crescent moon imprint, for the end-turn button'],
  ];
  batches.push({ id: 'ui-kit', title: 'UI 키트 (시트 1장 → 틀·버튼·띠·아이콘 16개)' });
  out.push(sheet('iconsheet', 'ui_kit', 'ui-kit', 'ui_kit.png', join(STYLE.pixel,
    `A pixel-art GAME UI KIT sheet for a night-themed gacha RPG (navy, gold, crimson; moon and star motifs), on one 1024x1024 canvas split into sixteen equal square cells of 256x256 (4x4), reading order left to right, top to bottom. Each cell holds ONE piece, EXACTLY CENTERED in its cell both horizontally and vertically (equal empty margin on the left and right, equal on the top and bottom, about 8% of the cell), filling the rest of the cell. Frames and buttons are drawn as a wide rectangle that spans almost the whole cell width — never a small piece sitting in one corner of the cell, never cut off by the cell edge. All four corners of a frame are the SAME ornament mirrored, not four different ones. No text, no letters, no labels, no grid lines.
${UI.map(([, d], i) => `- Cell ${i + 1}: ${d}`).join('\n')}
Frames, buttons, ribbon, chip and bar must be perfectly symmetric with plain, uniform straight edges between the corners (they will be stretched with 9-slice scaling). Fully transparent background. Native resolution 32x32 pixels per cell (128x128 for the whole sheet), upscaled exactly 8x with nearest-neighbor.`),
    [4, 4], UI.map(([id], i) => ['ui', `ui_${id}`, `${id}.png`, i % 4, Math.floor(i / 4)]),
    { must_show: '4×4: 틀3·버튼4·띠·탭·구분선·칩·막대·별조각·도움말·자물쇠·도장, 글자 없음, 가장자리 곧고 대칭' }));
  batches.push({ id: 'logo', title: '「야경단」 도트 로고' });
  out.push(item('logo', 'ui_logo', 'logo', 'logo.png', join(STYLE.pixel,
    `Pixel-art GAME LOGO of the Korean title 「야경단」 (three Hangul syllables 야 경 단, written correctly and clearly readable). Chunky bold pixel letters in warm gold with a dark navy outline and a soft lantern-glow highlight, a small crescent moon tucked against the first syllable and a few tiny stars around; a subtle night-watch lantern motif. Only the logo — no other text, no background. Wide horizontal layout. Fully transparent background. Native resolution 192x64 pixels, upscaled exactly 8x with nearest-neighbor to 1536x512.`)));
  // 스킨(두 번째 의상)은 나중에 — 맨 뒤
  for (const [id, c] of Object.entries(CHARS)) batches.push({ id: `skin-${id}`, title: `${c.name} 스킨(두 번째 의상) — 나중` });
  return { batches, items: out, outputs: [...outputs] };
}
