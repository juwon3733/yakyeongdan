// 그림 프롬프트 원본 (유일한 원본). GPT 이미지 에이전트(AGENTS.md)와 검사 도구가 같이 쓴다.
// 고친 뒤에는 `node tools/export-prompts.mjs`로 assets/prompts.json, docs/PROMPTS.md를 다시 만든다.
// 캐릭터 외형은 docs/03_characters.md, 적은 docs/04_enemies.md, 그림 목록은 docs/06_art_ui_sound.md를 따른다.

import { CARDS, DUOS as CARD_DUOS } from './data/cards.js';

export const STYLE_VERSION = 3; // 3: 손으로 찍은 느낌(AI 티 줄이기 — 장식·반짝이 절제, 셀 음영, 얼굴 구분). 2: 그림체 시안 C(세밀한 도트 256×384 4배, ~96색)로 고정, 성인 여성 노출은 적당히

// ── 공통 스타일 ──────────────────────────────────────────
export const STYLE = {
  pixel: '이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.\n\nAuthentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Fine, detailed pixel art (like a premium modern pixel gacha game): crisp pixel clusters, careful pixel shading on hair, eyes, skin and fabric, flat colors with a little dithering, clean dark 1-pixel outlines. Match the attached style reference (style/akane_c.png) in pixel size, detail level and color richness. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.',
  handmade: 'Make it look HAND-PIXELED by a skilled pixel artist, not AI-generated: deliberate pixel clusters, flat cel shading with only 2-3 hard-edged tones per material (no airbrushed or soft-gradient skin), one consistent light source from the upper left, a clear dark outline around the silhouette. Visual restraint: one signature prop plus at most two or three accessories — NO piles of tassels, bells, chains, beads or jewels, NO floating sparkles or random stars filling the empty space, NO noisy hair strands everywhere; hair is drawn as a few big readable locks. Big simple shapes and a strong silhouette first, small detail only on the face and the signature prop. Give each character a distinct face (eye shape, brows, mouth, face shape) instead of the same generic pretty face, and a natural pose with weight and intent instead of a generic glamour pose.',
  character: 'Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with a few well-chosen accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) are attractive and stylish in gacha-game fashion with moderate skin exposure: fitted outfits that may show bare shoulders, midriff or legs (short skirts, side slits, thigh-high boots), but the figure and exposure are not emphasized — confident and elegant, never explicit: no cleavage focus, no nudity, no underwear shots, no sexual poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.',
  rarity5: 'This is a top-rarity (5-star) character: give the design the most care — a distinctive signature outfit, a striking weapon or prop, and one magical effect (glow, flames, stars, moonlight or clockwork) that makes the silhouette instantly recognizable. As a top-rarity adult woman she may be more glamorous than other characters: a curvier figure and a deeper neckline that shows some cleavage are fine here — still never explicit: no nudity, no underwear shots, no sexual poses.',
  rarity4: 'This is a 4-star character: one flashy signature prop or accessory, otherwise clean.',
  rarity3: 'This is a 3-star character: simple, friendly and approachable design, still cute or cool.',
  onModel: 'Draw this character ON-MODEL from the attached reference image: the same face, eye color, hairstyle and hair color, outfit, accessories, weapon and age. Do not redesign anything.',
  keyart: '이미지를 만들어줘. 최고 화질로, 색을 줄이지 말고.\n\nHigh-quality, highly detailed pixel-art style illustration, like the key visual of a premium modern pixel-art game: crisp pixel detail, rich dramatic lighting, clean anime gacha-game faces. Night sky, a tall tower rising from the sea, lanterns and stars. No text, no letters, no logo, no watermark, no UI.',
};

// 종류별 크기. native = 게임 안 원본 도트 크기, w×h = 올릴 PNG 크기(정수배).
export const SPEC = {
  stand:    { w: 1024, h: 1536, native: '256×384', scale: 4, transparent: true,  colors: 256, folder: 'chars', note: '전투 서 있는 전신 · 투명 배경 · 발끝이 아래 끝 근처, 머리 위 여백' },
  portrait: { w: 1024, h: 1536, native: '256×384', scale: 4, transparent: true,  colors: 256, folder: 'chars', note: '허리 위 상반신 · 투명 배경 · 양옆·위 여백, 허리만 아래 끝에 닿음' },
  outfit:   { w: 1024, h: 1536, native: '256×384', scale: 4, transparent: true,  colors: 256, folder: 'chars', note: '두 번째 의상 전신 · 투명 배경' },
  cutin:    { w: 1536, h: 576,  native: '384×144', scale: 4, transparent: false, colors: 256, folder: 'cutins', note: '가로로 긴 얼굴·상체 클로즈업 · 1536×1024로 만든 뒤 가운데 띠를 잘라 냄' },
  duo:      { w: 1536, h: 768,  native: '384×192', scale: 4, transparent: false, colors: 256, folder: 'cutins', note: '인연 듀오 · 두 사람 한 장 · 1536×1024로 만든 뒤 위아래를 잘라 냄' },
  cg:       { w: 1536, h: 864,  native: '—', scale: 0, transparent: false, colors: Infinity, folder: 'cg', note: '★5 전신 CG · 16:9 · 화질 우선, 색 제한 없음' },
  enemy:    { w: 768,  h: 768,  native: '192×192', scale: 4, transparent: true,  colors: 256, folder: 'enemies', note: '일반 적 · 투명 배경' },
  elite:    { w: 1024, h: 1024, native: '256×256', scale: 4, transparent: true,  colors: 256, folder: 'enemies', note: '강적 · 투명 배경' },
  boss:     { w: 1024, h: 1536, native: '256×384', scale: 4, transparent: true,  colors: 256, folder: 'enemies', note: '보스 · 투명 배경' },
  bg:       { w: 1280, h: 720,  native: '640×360', scale: 2, transparent: false, colors: 256, folder: 'bg', note: '배경 16:9 · 사람 없음 · 아래 1/3은 단순하게(캐릭터가 서는 자리)' },
  title:    { w: 1536, h: 864,  native: '—', scale: 0, transparent: false, colors: Infinity, folder: 'title', note: '타이틀 키아트 16:9 · 오른쪽 40%는 메뉴 자리 · 글자 금지' },
  summon:   { w: 1536, h: 864,  native: '—', scale: 0, transparent: false, colors: Infinity, folder: 'summon', note: '소환 화면 밤하늘 16:9' },
  meteor:   { w: 512,  h: 512,  native: '64×64',   scale: 8, transparent: true,  colors: 256, folder: 'summon', note: '별똥별 효과 · 투명 배경' },
  icon:     { w: 192,  h: 192,  native: '24×24',   scale: 8, transparent: true,  colors: 64,  folder: 'icons', note: '도구 아이콘 · 투명 배경 · 24×24 도트를 8배' },
  appicon:  { w: 1024, h: 1024, native: '64×64',   scale: 16, transparent: false, colors: 64, folder: 'app', note: '앱 아이콘(홈 화면·PWA) · 64×64 도트를 16배 · 정사각 꽉 차게, 가운데 80% 안에 주요 모양(둥근 모서리로 잘려도 되게) · node tools/make-icons.mjs가 icons/icon-192·512.png로 만든다' },
  style:    { w: 1024, h: 1536, native: '시안마다 다름', scale: 0, transparent: true, colors: Infinity, folder: 'style', note: '그림체 시안(게임에 안 씀) · 같은 캐릭터를 도트 굵기만 바꿔 4장 · 사용자가 골라 기준 화풍을 정한다' },
  card:     { w: 768,  h: 576,  native: '192×144', scale: 4, transparent: false, colors: 256, folder: 'cards', note: '스킬 카드 그림(카드 위쪽 일러스트, 4:3) · 그 동료가 기술을 쓰는 장면 · 1536×1024로 만든 뒤 가운데 4:3을 잘라 192×144로 줄이고 4배' },
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

// ── 카드 그림 장면 (js/data/cards.js에서 자동) ───────────
const fileId = (cardId) => cardId.replace(/[^a-z0-9]+/gi, '_');
// 카드 글의 {d0}·{b1}·{k0}·{n1} 자리를 수치로 채운다.
function cardText(d) {
  return String(d.text || '').replace(/\{[dbkn](\d)\}/g, (_, i) => (d.v && d.v[i] != null ? d.v[i] : '?')).replace(/[.\s]+$/, '');
}
function cardPose(d) {
  const t = String(d.text || '');
  const out = [];
  if (d.time) out.push('a time-bending move: glowing clock faces and clock hands swirling behind, the night sky brightening slightly');
  if (d.atk && d.target === 'all') out.push('a wide sweeping attack hitting several enemies (enemies only as dark silhouettes on the right)');
  else if (d.atk) out.push('attacking toward the right, the target only as a dark silhouette, impact flash');
  if (/방어/.test(t) && !d.atk) out.push('a strong defensive pose, a glowing barrier or shield');
  if (/회복/.test(t)) out.push('healing an ally with warm light');
  if (/독/.test(t)) out.push('poison mist or poison sparkles');
  if (/화상/.test(t)) out.push('flames and burning embers');
  if (/정령/.test(t)) out.push('little star spirits');
  if (/장전/.test(t)) out.push('loading or firing glowing shells');
  if (/잠/.test(t)) out.push('sleepy dream magic');
  if (/카드 \d장|뽑/.test(t)) out.push('cards or papers fanning out');
  if (/별빛/.test(t)) out.push('gold coins and starlight');
  if (/공중/.test(t)) out.push('high in the air above clouds');
  if (/달/.test(t)) out.push('a big moon behind');
  if (/고래|물보라/.test(t)) out.push('the giant star whale made of constellations, sprays of starlight water');
  if (/행동을/.test(t)) out.push('a guiding lantern light turning enemy silhouettes around, glowing arrows');
  if (!out.length) out.push('a confident skill-casting pose with the character\'s signature effect');
  if (d.exhaust) out.push('a one-time all-out move, the most dramatic version');
  return out.join('; ');
}
const RARITY_CARD = {
  c: 'Common card: a clean, simple pose.',
  u: 'Uncommon card: a stylish dynamic pose with a stronger effect.',
  r: 'Rare card: the most dramatic angle and the biggest, most beautiful effect.',
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

export function assetList() {
  const out = [];
  const batches = [];
  for (const [id, c] of Object.entries(CHARS)) {
    const batch = `char-${id}`;
    const base = join(STYLE.pixel, STYLE.handmade, STYLE.character, rarityStyle(c.rarity));
    const who = `${c.name} (${id}): ${c.sheet} Accent colors: ${c.accent}.`;
    batches.push({ id: batch, title: `${'★'.repeat(c.rarity)} ${c.name}`,
      reference_sheet_prompt: join(base, `Character reference sheet of ${who} Full body front view plus a face close-up, plain background. Native resolution about 384x256, upscaled with nearest-neighbor.`) });
    const ref = [`chars/${id}_normal.png`];
    out.push(item('stand', `${id}_stand`, batch, `${id}_stand.png`,
      join(base, STYLE.onModel, `${who}\nFull-body battle stance, standing at a slight three-quarter angle facing RIGHT (toward enemies), weapon ready. Fully transparent background, nothing behind the character. Feet near the bottom edge, empty margin above the head. Native resolution 256x384 pixels, upscaled exactly 4x with nearest-neighbor to 1024x1536. Up to about 96 colors, careful pixel shading on hair, eyes and fabric.`),
      { must_show: '전신, 오른쪽을 향한 전투 자세, 무기' }));
    for (const [face, expr] of Object.entries(c.faces)) {
      out.push(item('portrait', `${id}_${face}`, batch, `${id}_${face}.png`,
        join(base, STYLE.onModel, `${who}\nWaist-up portrait facing slightly to the side. Expression and pose: ${expr}. Fully transparent background with nothing behind the character. Head, hair and arms stay inside the image with empty margin on the left, right and top; only the waist touches the bottom edge. Native resolution 256x384 pixels, upscaled exactly 4x with nearest-neighbor to 1024x1536. Up to about 96 colors, careful pixel shading on hair, eyes and fabric.`),
        { followup_prompt: `Same character, same style. Waist-up portrait, transparent background. Expression and pose: ${expr}.`, reference_images: face === 'normal' ? [] : ref }));
    }
    out.push(item('cutin', `${id}_cutin`, batch, `${id}_cutin.png`,
      join(base, STYLE.onModel, `${who}\nDramatic cut-in panel for a special move: ${c.cutin}. Wide horizontal composition, the face and action inside the middle horizontal band (the top and bottom will be cropped to 1536x576). Speed lines made of pixels, strong accent colors (${c.accent}).`),
      { reference_images: ref, must_show: '얼굴이 가운데 띠 안' }));
    out.push(item('outfit', `${id}_outfit2`, batch, `${id}_outfit2.png`,
      join(base, STYLE.onModel, `${who}\nSame person, same face and hair, but in a ${c.outfit}. Full-body standing pose facing slightly right, transparent background. Native resolution 256x384 pixels, upscaled exactly 4x to 1024x1536.`),
      { reference_images: ref }));
  }

  // 스킬 카드 그림: 동료 카드 전부. 그 동료가 그 기술을 쓰는 장면.
  for (const [id, c] of Object.entries(CHARS)) {
    const batch = `cards-${id}`;
    const list = Object.entries(CARDS).filter(([, d]) => d.ch === id);
    batches.push({ id: batch, title: `${'★'.repeat(c.rarity)} ${c.name} 카드 ${list.length}장` });
    const base = join(STYLE.pixel, STYLE.handmade, STYLE.character, rarityStyle(c.rarity), STYLE.onModel);
    for (const [cardId, d] of list) {
      const who = d.sub === 'mimi' ? 'Mimi (the pink-haired twin) alone' : d.sub === 'momo' ? 'Momo (the sky-blue-haired twin) alone' : d.sub === 'both' ? 'both twins Mimi and Momo together' : c.name;
      out.push(item('card', `card_${fileId(cardId)}`, batch, `card_${fileId(cardId)}.png`,
        join(base, `Skill card illustration. Card: 「${d.name}」 (Korean title; NEVER write any text in the image). Effect: ${cardText(d)}.\nShow ${who === c.name ? c.name : `${who} (${c.name})`}, ON-MODEL from the attached references, performing this exact skill: ${cardPose(d)}. Visual motifs for this character: ${c.fx}. Accent colors: ${c.accent}.\n${RARITY_CARD[d.rarity] || ''}\nComposition: the character and the skill effect fill the frame, face clearly visible and attractive, dynamic angle, simple dark night background. Keep everything important inside the central 4:3 area: make it 1536x1024, it will be cropped to the center 4:3, reduced to 192x144 pixels and upscaled 4x to 768x576 — use big readable shapes.`),
        { reference_images: [`chars/${id}_normal.png`, `chars/${id}_stand.png`], must_show: `${c.name} 얼굴, 「${d.name}」 효과` }));
    }
  }

  // 인연 듀오 카드 그림(두 사람이 함께 기술을 쓰는 장면), 11장씩 묶음
  const duoList = Object.entries(CARD_DUOS);
  for (let n = 0; n * 11 < duoList.length; n++) {
    const batch = `cards-duo-${n + 1}`;
    const part = duoList.slice(n * 11, n * 11 + 11);
    batches.push({ id: batch, title: `인연 듀오 카드 ${n * 11 + 1}~${n * 11 + part.length}` });
    for (const [key, d] of part) {
      const [a, b] = key.split('+');
      const A = CHARS[a], B = CHARS[b];
      out.push(item('card', `duocard_${a}_${b}`, batch, `duocard_${a}_${b}.png`,
        join(STYLE.pixel, STYLE.handmade, STYLE.character, STYLE.onModel, `Duo skill card illustration. Card: 「${d.name}」 (Korean title; NEVER write any text in the image). Effect: ${cardText(d)}.\nShow ${A.name} and ${B.name} together, both ON-MODEL from the attached references, combining their skills in one move: ${cardPose(d)}. ${A.name}'s motifs: ${A.fx}. ${B.name}'s motifs: ${B.fx}. Accent colors: ${A.accent} meeting ${B.accent}.\nComposition: both faces clearly visible, a dramatic shared pose, the two effects merging in the middle. Keep everything inside the central 4:3 area: make it 1536x1024, it will be cropped to the center 4:3, reduced to 192x144 pixels and upscaled 4x to 768x576.`),
        { reference_images: [`chars/${a}_normal.png`, `chars/${b}_normal.png`], must_show: '두 사람 얼굴 둘 다' }));
    }
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

  // 2차 그림체 시안(AI 티 줄이기): 아카네를 손으로 찍은 느낌으로 3장. 고른 것이 새 기준이 된다(게임에 안 씀).
  const STYLE2 = {
    e: ['세밀·절제(256×384 4배, 48색)', 'Native resolution 256x384 pixels, upscaled exactly 4x with nearest-neighbor to 1024x1536. At most 48 colors.'],
    f: ['중간 도트(128×192 8배, 32색)', 'Native resolution 128x192 pixels, upscaled exactly 8x with nearest-neighbor to 1024x1536. At most 32 colors. Every pixel counts: clean clusters like a classic hand-made 16-bit era sprite, but with modern gacha-game face and fashion.'],
    g: ['또렷한 셀 도트(160×240 6배 정도, 40색)', 'Native resolution about 170x256 pixels, upscaled exactly 6x with nearest-neighbor to 1020x1536 (pad to 1024x1536). At most 40 colors. Strong 1-pixel dark outlines inside and around the figure, flat cel colors, very clean shapes.'],
  };
  {
    const id = 'akane', c = CHARS[id], batch = 'style2-akane';
    batches.push({ id: batch, title: `그림체 2차 시안 ${c.name} — AI 티 줄이기 (3장, 게임에 안 씀)` });
    const who = `${c.name} (${id}): ${c.sheet} Accent colors: ${c.accent}.`;
    for (const [v, [label, res]] of Object.entries(STYLE2)) {
      out.push(item('style', `style2_${id}_${v}`, batch, `${id}_${v}.png`,
        join(STYLE.pixel.replace(/Match the attached style reference[^.]*\./, 'Use the attached image only to keep the same person (face, hair, colors, outfit idea); simplify its busy ornaments.'), STYLE.handmade, STYLE.character, STYLE.rarity5, `${who}\nFull-body battle stance, standing at a slight three-quarter angle facing RIGHT, katana ready, one flame effect along the blade. Fully transparent background. ${res}\nThis is style test 「${v.toUpperCase()}」 — the three tests of this batch show the SAME character and pose, only the pixel size and color count change.`),
        { must_show: `2차 시안 ${v.toUpperCase()} — ${label}`, reference_images: ['chars/akane_stand.png'] }));
    }
  }

  // ★5 전신 CG
  batches.push({ id: 'cg-star5', title: '★5 전신 CG' });
  for (const [id, c] of Object.entries(CHARS).filter(([, c]) => c.rarity === 5)) {
    out.push(item('cg', `star5_${id}`, 'cg-star5', `star5_${id}.png`,
      join(STYLE.keyart, STYLE.character, STYLE.onModel, `Full-body splash art of ${c.name}: ${c.sheet} Her most dramatic signature pose with her magical effect at full power (${c.cutin}). 16:9 composition (1536x864), the character fills the frame, night sky and tower background.`),
      { reference_images: [`chars/${id}_normal.png`, `chars/${id}_stand.png`] }));
  }

  // 인연 듀오 컷인
  batches.push({ id: 'duo', title: `인연 듀오 컷인 ${Object.keys(DUOS).length}쌍` });
  for (const [id, d] of Object.entries(DUOS)) {
    const [a, b] = d.pair;
    out.push(item('duo', `duo_${id}`, 'duo', `duo_${id}.png`,
      join(STYLE.pixel, STYLE.handmade, STYLE.character, STYLE.onModel, `Duo cut-in of ${CHARS[a].name} and ${CHARS[b].name}: ${d.scene}. Both characters ON-MODEL from the attached references, faces clearly visible. Wide horizontal composition; the top and bottom will be cropped to 1536x768. Speed lines made of pixels.`),
      { reference_images: [`chars/${a}_normal.png`, `chars/${b}_normal.png`], must_show: '두 사람 얼굴 둘 다' }));
  }

  // 적
  for (const act of ['act1', 'act2', 'act3']) {
    const batch = `enemy-${act}`;
    batches.push({ id: batch, title: `${act.slice(-1)}막 적` });
    for (const [id, desc] of Object.entries(ENEMIES[act])) {
      out.push(item('enemy', id, batch, `${id}.png`, join(STYLE.pixel, `Enemy sprite: ${desc}. Facing LEFT (toward the party). Cute-but-menacing gacha-game monster design. Fully transparent background. Native resolution 192x192 pixels, upscaled exactly 4x to 768x768.`)));
    }
    for (const [id, desc] of Object.entries(ENEMIES[act + '_elite'])) {
      out.push(item('elite', id, batch, `${id}.png`, join(STYLE.pixel, /woman/.test(desc) ? STYLE.character : '', `Elite enemy sprite: ${desc}. Bigger and more imposing than normal enemies. Facing LEFT. Fully transparent background. Native resolution 256x256 pixels, upscaled exactly 4x to 1024x1024.`)));
    }
  }
  for (const [id, b] of Object.entries(BOSSES)) {
    const batch = `boss-${id}`;
    batches.push({ id: batch, title: `보스 ${b.name}` });
    const human = join(STYLE.pixel, b.beast ? '' : STYLE.character);
    out.push(item('boss', `boss_${id}_1`, batch, `boss_${id}_1.png`, join(human, `Boss sprite, ${b.name}: ${b.p1}. Facing LEFT, imposing. Fully transparent background. Native resolution 256x384 pixels, upscaled exactly 4x to 1024x1536.`)));
    out.push(item('boss', `boss_${id}_2`, batch, `boss_${id}_2.png`, join(human, STYLE.onModel, `Boss sprite, ${b.name}, ${b.p2}. Same person as the attached first-phase sprite. Facing LEFT. Fully transparent background. 1024x1536.`), { reference_images: [`enemies/boss_${id}_1.png`] }));
    if (b.p3) out.push(item('boss', `boss_${id}_3`, batch, `boss_${id}_3.png`, join(human, STYLE.onModel, `Boss sprite, ${b.name}, ${b.p3}. Same person as the attached first-phase sprite. Facing LEFT. Fully transparent background. 1024x1536.`), { reference_images: [`enemies/boss_${id}_1.png`] }));
    out.push(item('cutin', `boss_${id}_cutin`, batch, `boss_${id}_cutin.png`, join(human, STYLE.onModel, `Boss cut-in: ${b.cutin}. Wide horizontal composition, face in the middle band (cropped to 1536x576).`), { reference_images: [`enemies/boss_${id}_1.png`] }));
  }

  // 배경·타이틀·소환·아이콘
  batches.push({ id: 'bg', title: '배경' });
  for (const [id, desc] of Object.entries(BGS)) {
    out.push(item('bg', `bg_${id}`, 'bg', `${id}.png`, join(STYLE.pixel, `Background: ${desc}. No people. Wide 16:9 view; keep the lower third simple so characters can stand in front. Native resolution 640x360 pixels, full color, limited palette of about 64 colors, upscaled exactly 2x with nearest-neighbor to 1280x720.`)));
  }
  batches.push({ id: 'title', title: '타이틀 키아트' });
  out.push(item('title', 'title_key', 'title', 'key.png',
    join(STYLE.keyart, STYLE.character, STYLE.onModel, `Title key art: three night-watch members standing back to back on a ledge of a tower rising from the night sea — the swordswoman Iris (center), the gunner Brick (left) and the tall nun Marta (right), ON-MODEL from the attached references. Lanterns, stars, a crescent moon. Keep the right 40% of the image darker and simpler for the menu. 16:9 (1536x864).`),
    { reference_images: ['chars/iris_normal.png', 'chars/brick_normal.png', 'chars/marta_normal.png'] }));
  batches.push({ id: 'summon', title: '별 소환 연출' });
  out.push(item('summon', 'summon_sky', 'summon', 'sky.png', join(STYLE.keyart, 'Summon screen: the rooftop of the night-watch lighthouse headquarters under a vast starry night sky, a telescope and railing in the foreground, empty center of the sky where shooting stars will fall. No people. 16:9 (1536x864).')));
  const meteors = { 3: 'white', 4: 'violet', 5: 'gold, the biggest and brightest with sparkles' };
  for (const [r, col] of Object.entries(meteors)) {
    out.push(item('meteor', `meteor_${r}`, 'summon', `meteor_${r}.png`, join(STYLE.pixel, `A single shooting star effect, ${col}, falling diagonally from top-right to bottom-left with a pixel trail. Fully transparent background. Native 64x64, upscaled 8x to 512x512.`)));
  }
  batches.push({ id: 'app', title: '앱 아이콘' });
  out.push(item('appicon', 'app_icon', 'app', 'icon.png', join(STYLE.pixel, 'App icon for the game 「야경단」 (Night Watch): a tall dark tower rising from the night sea with a single warm lantern glowing at its top, a gold crescent moon, a few stars, deep navy sky. Bold, simple silhouette that still reads at 48x48. Fill the whole square edge to edge with the night background (no transparent corners, no border, no text); keep the tower and moon inside the central 80%. Native resolution 64x64 pixels, upscaled exactly 16x with nearest-neighbor to 1024x1024.')));
  batches.push({ id: 'icons', title: '도구 아이콘 40' });
  const icon = (batch, id, desc) => out.push(item('icon', `relic_${id}`, batch, `relic_${id}.png`, join(STYLE.pixel, `A single item icon: ${desc}. Centered, readable at 24x24 pixels, bold outline, fully transparent background. Native resolution 24x24 pixels, upscaled exactly 8x to 192x192.`)));
  for (const [id, desc] of Object.entries(RELICS)) icon('icons', id, desc);
  batches.push({ id: 'icons-sig', title: `동료 전용 도구 아이콘 ${Object.keys(SIG_RELICS).length}` });
  for (const [id, desc] of Object.entries(SIG_RELICS)) icon('icons-sig', id, desc);
  return { batches, items: out };
}
