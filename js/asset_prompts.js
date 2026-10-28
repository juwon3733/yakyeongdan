// 그림 프롬프트 원본 (유일한 원본). GPT 이미지 에이전트(AGENTS.md)와 검사 도구가 같이 쓴다.
// 고친 뒤에는 `node tools/export-prompts.mjs`로 assets/prompts.json, docs/PROMPTS.md를 다시 만든다.
// 캐릭터 외형은 docs/03_characters.md, 적은 docs/04_enemies.md, 그림 목록은 docs/06_art_ui_sound.md를 따른다.

export const STYLE_VERSION = 1;

// ── 공통 스타일 ──────────────────────────────────────────
export const STYLE = {
  pixel: '이미지를 만들어줘. 진짜 도트(픽셀아트)여야 해. 고해상도 일러스트처럼 그리지 마.\n\nAuthentic low-resolution pixel art. No anti-aliasing, no smooth gradients, no blur, no fine details smaller than one pixel. Shading only with flat colors and a little checkerboard dithering. Clean dark 1-pixel outlines. Night mood: deep navy and violet base colors, warm orange lantern light, white and gold starlight. No text, no letters, no numbers, no watermark, no UI, no speech bubbles.',
  character: 'Character design in the style of modern Japanese anime mobile gacha games: large expressive eyes with bright highlights, attractive face, stylish proportions, glossy hair with highlight strands, fashionable outfit with detailed accessories and a clear, appealing silhouette. Female characters mostly have long hair. Adult women (18 and over) may wear slightly alluring gacha-style fashion (fitted clothes, bare shoulders or midriff, short skirts or shorts, side slits, thigh-high boots) — stylish, never explicit, no nudity, no underwear, no suggestive poses. Characters under 18 are drawn modestly and age-appropriately: covered shoulders and midriff, knee-length or longer skirts, no fan-service at all. Adults and teenagers have realistic proportions for their age (adults about 1:7 head-to-body), NOT chibi, NOT baby-faced. Keep it crisp low-resolution pixel art, not a smooth illustration.',
  rarity5: 'This is a top-rarity (5-star) character: give the design the most care — an elaborate signature outfit, a striking weapon or prop, and a magical effect (glow, flames, stars, moonlight or clockwork) that makes the silhouette instantly recognizable.',
  rarity4: 'This is a 4-star character: one flashy signature prop or accessory, otherwise clean.',
  rarity3: 'This is a 3-star character: simple, friendly and approachable design, still cute or cool.',
  onModel: 'Draw this character ON-MODEL from the attached reference image: the same face, eye color, hairstyle and hair color, outfit, accessories, weapon and age. Do not redesign anything.',
  keyart: '이미지를 만들어줘. 최고 화질로, 색을 줄이지 말고.\n\nHigh-quality, highly detailed pixel-art style illustration, like the key visual of a premium modern pixel-art game: crisp pixel detail, rich dramatic lighting, clean anime gacha-game faces. Night sky, a tall tower rising from the sea, lanterns and stars. No text, no letters, no logo, no watermark, no UI.',
};

// 종류별 크기. native = 게임 안 원본 도트 크기, w×h = 올릴 PNG 크기(정수배).
export const SPEC = {
  stand:    { w: 1024, h: 1536, native: '128×192', scale: 8, transparent: true,  colors: 256, folder: 'chars', note: '전투 서 있는 전신 · 투명 배경 · 발끝이 아래 끝 근처, 머리 위 여백' },
  portrait: { w: 1024, h: 1536, native: '128×192', scale: 8, transparent: true,  colors: 256, folder: 'chars', note: '허리 위 상반신 · 투명 배경 · 양옆·위 여백, 허리만 아래 끝에 닿음' },
  outfit:   { w: 1024, h: 1536, native: '128×192', scale: 8, transparent: true,  colors: 256, folder: 'chars', note: '두 번째 의상 전신 · 투명 배경' },
  cutin:    { w: 1536, h: 576,  native: '256×96',  scale: 6, transparent: false, colors: 256, folder: 'cutins', note: '가로로 긴 얼굴·상체 클로즈업 · 1536×1024로 만든 뒤 가운데 띠를 잘라 냄' },
  duo:      { w: 1536, h: 768,  native: '256×128', scale: 6, transparent: false, colors: 256, folder: 'cutins', note: '인연 듀오 · 두 사람 한 장 · 1536×1024로 만든 뒤 위아래를 잘라 냄' },
  cg:       { w: 1536, h: 864,  native: '—', scale: 0, transparent: false, colors: Infinity, folder: 'cg', note: '★5 전신 CG · 16:9 · 화질 우선, 색 제한 없음' },
  enemy:    { w: 768,  h: 768,  native: '96×96',   scale: 8, transparent: true,  colors: 256, folder: 'enemies', note: '일반 적 · 투명 배경' },
  elite:    { w: 1024, h: 1024, native: '128×128', scale: 8, transparent: true,  colors: 256, folder: 'enemies', note: '강적 · 투명 배경' },
  boss:     { w: 1024, h: 1536, native: '128×192', scale: 8, transparent: true,  colors: 256, folder: 'enemies', note: '보스 · 투명 배경' },
  bg:       { w: 1280, h: 720,  native: '320×180', scale: 4, transparent: false, colors: 256, folder: 'bg', note: '배경 16:9 · 사람 없음 · 아래 1/3은 단순하게(캐릭터가 서는 자리)' },
  title:    { w: 1536, h: 864,  native: '—', scale: 0, transparent: false, colors: Infinity, folder: 'title', note: '타이틀 키아트 16:9 · 오른쪽 40%는 메뉴 자리 · 글자 금지' },
  summon:   { w: 1536, h: 864,  native: '—', scale: 0, transparent: false, colors: Infinity, folder: 'summon', note: '소환 화면 밤하늘 16:9' },
  meteor:   { w: 512,  h: 512,  native: '64×64',   scale: 8, transparent: true,  colors: 256, folder: 'summon', note: '별똥별 효과 · 투명 배경' },
  icon:     { w: 192,  h: 192,  native: '24×24',   scale: 8, transparent: true,  colors: 64,  folder: 'icons', note: '도구 아이콘 · 투명 배경 · 24×24 도트를 8배' },
  card:     { w: 512,  h: 352,  native: '64×44',   scale: 8, transparent: false, colors: 128, folder: 'cards', note: '카드 그림 · 1536×1024로 만든 뒤 가운데를 잘라 냄' },
};

// ── 동료 20명 ────────────────────────────────────────────
// sheet: 설정화(전신 정면 + 얼굴 클로즈업). 같은 묶음의 다른 그림은 전부 이 설정화를 기준으로.
// faces: 상반신 표정 3개(normal·smile·serious), cutin: 컷인 연출, outfit: 두 번째 의상, cards: 대표 카드 2장.
export const CHARS = {
  sion: { name: '시온', rarity: 5, accent: 'silver-blue and gold',
    sheet: 'a calm, beautiful woman in her late 20s, a star summoner. Very long straight silver-blue hair, gentle pale-blue eyes, a long dark-navy cloak printed with a glowing star map, an elegant gown with an open back under it, gold star ornaments in her hair, tiny glowing star spirits floating around her fingertips.',
    faces: { normal: 'calm, faint smile, one hand raised with small star spirits', smile: 'delighted, talking excitedly about the stars, eyes sparkling', serious: 'focused, cloak spread, star spirits circling her' },
    cutin: 'close-up of her face and raised hand, star spirits bursting outward, a constellation line glowing across the panel',
    outfit: 'second outfit: a white-and-gold observatory robe with a crescent telescope pendant, hair tied loosely with a star ribbon',
    cards: { 'sion_call': 'summoning a small glowing star spirit from her palm', 'sion_galaxy': 'a river of stars pouring across the night sky toward enemies' } },
  lunaria: { name: '루나리아', rarity: 5, accent: 'moon silver and pale violet',
    sheet: 'a graceful dancer woman in her mid 20s. Silver hair reaching her ankles, a crescent-moon hair ornament, a translucent veil, a dancer outfit with an open back and a bare midriff, little bells on her ankles, two folding fans that hold moonlight.',
    faces: { normal: 'serene smile, fan held near her face', smile: 'playful laugh, spinning with her veil flowing', serious: 'graceful but sharp gaze, fans opened like blades' },
    cutin: 'close-up mid-spin, silver hair sweeping across the panel, a huge full moon behind her, moonlight petals',
    outfit: 'second outfit: a deep-indigo evening dance dress with silver moon-phase embroidery and a long trailing scarf',
    cards: { 'lunaria_crescent': 'dancing under a crescent moon, fans trailing silver arcs', 'lunaria_eclipse': 'a dark eclipse ring behind her as she strikes a pose' } },
  akane: { name: '아카네', rarity: 5, accent: 'crimson and gold',
    sheet: 'a confident swordswoman in her mid 20s. Long crimson hair in a high ponytail, gold eyes, a red off-shoulder top with hakama-style armored skirt, two katana with flame-patterned blades, a cocky grin.',
    faces: { normal: 'confident smirk, one hand on a sword hilt', smile: 'fierce grin, thumb pointing at herself', serious: 'drawing both swords, flames licking the blades' },
    cutin: 'close-up of her eyes and crossed burning blades, embers and fire streaks across the panel',
    outfit: 'second outfit: a black-and-red festival kimono worn short with armored gauntlets, a fox mask on the side of her head',
    cards: { 'akane_slash': 'a crimson diagonal slash trailing fire', 'akane_flame': 'twin blades spinning in a ring of flame' } },
  eleonore: { name: '엘레오노르', rarity: 5, accent: 'violet and brass',
    sheet: 'an elegant, haughty witch woman in her early 30s. Long black hair with a violet sheen, half-lidded violet eyes, a wide-brimmed witch hat decorated with clock faces, a gothic dress with a high side slit, a staff as tall as a person shaped like a giant clock hand, small brass gears floating around her.',
    faces: { normal: 'composed, slight condescending smile, hand on hat brim', smile: 'amused laugh behind a gloved hand', serious: 'raising the clock-hand staff, glowing clock circles behind her' },
    cutin: 'close-up of her face with a giant glowing clock face behind her, the hands spinning backward',
    outfit: 'second outfit: a clocktower keeper coat in plum and brass, monocle, pocket watches on chains',
    cards: { 'eleonore_arrow': 'a glowing second-hand shaped like an arrow flying', 'eleonore_midnight': 'all clock hands pointing to midnight in a silent violet sky' } },
  iris: { name: '아이리스', rarity: 4, accent: 'silver and pale blue',
    sheet: 'a cool, quiet swordswoman in her early 20s. Waist-length straight black hair, pale-blue eyes, a long silver coat styled as light armor, a slim longsword, an expressionless but kind face.',
    faces: { normal: 'calm, expressionless, sword at her side', smile: 'small rare smile, looking away', serious: 'sword raised in a ready stance, eyes sharp' },
    cutin: 'close-up of a single clean horizontal sword flash, her eyes narrowed, black hair flowing',
    outfit: 'second outfit: a dark-blue swordsman uniform with a high collar and a white sash',
    cards: { 'iris_slash': 'a single silver sword slash across the dark', 'iris_issen': 'a blinding one-flash draw cut, a thin line of light' } },
  noel: { name: '노엘', rarity: 4, accent: 'pink and lavender',
    sheet: 'a sleepy sorceress woman in her early 20s. Long wavy pink hair, half-closed light-blue eyes, an off-shoulder robe that looks like pajamas, holding a huge pillow like a staff, a nightcap with a star tip.',
    faces: { normal: 'drowsy, half-asleep, hugging the pillow', smile: 'sleepy happy smile, yawning', serious: 'eyes suddenly wide open, magic circle glowing from the pillow' },
    cutin: 'close-up of her waking eyes snapping open, a shooting-star spell bursting from the pillow',
    outfit: 'second outfit: a cozy lavender sweater dress and a moon-shaped sleep mask on her forehead',
    cards: { 'noel_sleep': 'curled up asleep on a floating pillow, little Z-shaped sparkles (no letters)', 'noel_star': 'a shooting star spell crashing down' } },
  raven: { name: '레이븐', rarity: 4, accent: 'black and violet',
    sheet: 'a cynical assassin man in his late 20s. Short silver hair, a crow-beak half mask covering the upper face, red eyes visible through the mask, a black feathered coat, a poison-needle device on his wrist.',
    faces: { normal: 'cold, arms crossed, slightly looking down', smile: 'faint crooked smile under the mask', serious: 'raising the wrist needle, feathers scattering' },
    cutin: 'close-up of the crow mask, red eyes glinting, black feathers flying',
    outfit: 'second outfit: a dark-violet long coat with a feather collar and a white crow mask',
    cards: { 'raven_needle': 'a thin glowing poison needle flying through the dark', 'raven_feather': 'a storm of black feathers like blades' } },
  mimimomo: { name: '미미·모모', rarity: 4, accent: 'pink and sky blue',
    sheet: 'twin 12-year-old girls shown together. Mimi: pink bob hair with a ribbon on her RIGHT side. Momo: sky-blue bob hair with a ribbon on her LEFT side. Matching modest sailor-style dresses (knee length, covered shoulders) in mirrored colors, Mimi holds a small dagger, Momo holds an umbrella. Children, drawn modestly and age-appropriately.',
    faces: { normal: 'the twins side by side, Mimi cheerful and Momo calm', smile: 'both laughing, holding hands', serious: 'back to back, dagger and umbrella ready' },
    cutin: 'close-up of both faces mirrored left and right, pink and blue sparkles',
    outfit: 'second outfit: matching modest winter coats with fluffy hoods, one pink and one blue, long skirts and boots',
    cards: { 'mimimomo_pierce': 'Mimi lunging with her small dagger, pink sparkle trail', 'mimimomo_guard': 'Momo opening her umbrella as a shield, blue sparkles' } },
  sebas: { name: '세바스', rarity: 4, accent: 'black and silver',
    sheet: 'a dignified butler man in his 60s, clearly elderly (wrinkles, grey mustache). Slicked-back silver hair, a monocle, a black tailcoat, white gloves, a pocket watch on a chain and a cane that hides a sword.',
    faces: { normal: 'polite bow, hand on chest', smile: 'warm grandfatherly smile, offering a teacup', serious: 'drawing the cane sword, monocle glinting' },
    cutin: 'close-up of the opened pocket watch and the monocle, the sword half drawn',
    outfit: 'second outfit: a white summer butler suit with a silver tray',
    cards: { 'sebas_tea': 'a perfect cup of tea on a silver tray, steam curling', 'sebas_watch': 'an opened pocket watch with its hands turning backward' } },
  mariana: { name: '마리아나', rarity: 4, accent: 'gold and deep red',
    sheet: 'a bold pirate queen woman in her late 20s. Long wavy brown hair, a feathered tricorn hat, a corset coat with short pants and tall boots, a gold coin necklace, a flintlock pistol.',
    faces: { normal: 'confident grin, hand on hat', smile: 'laughing loudly, tossing a gold coin', serious: 'aiming the flintlock pistol' },
    cutin: 'close-up of her grin and the pistol muzzle flash, gold coins flying',
    outfit: 'second outfit: a captain\'s long red coat with gold trim over a white blouse, a cutlass',
    cards: { 'mariana_coin': 'gold coins thrown like bullets', 'mariana_cannon': 'a pirate ship broadside firing cannons at night' } },
  tomori: { name: '토모리', rarity: 4, accent: 'yellow and warm orange',
    sheet: 'a cheerful 17-year-old girl, the lighthouse keeper\'s granddaughter. Long chestnut hair in a braid, a yellow raincoat, a modest dress below the knees, rain boots, holding a big glowing lantern. Drawn modestly and age-appropriately.',
    faces: { normal: 'bright smile, lantern raised', smile: 'laughing, waving', serious: 'determined, shining the lantern forward' },
    cutin: 'close-up of her face lit warmly from below by the lantern, a beam of light cutting the dark',
    outfit: 'second outfit: a modest navy sailor-style keeper uniform with a small lighthouse badge and a scarf',
    cards: { 'tomori_lantern': 'a lantern beam pushing back shadows', 'tomori_signal': 'a lighthouse signal flashing across the night sea' } },
  sigrun: { name: '시그룬', rarity: 4, accent: 'silver and white',
    sheet: 'a noble knight woman in her late 20s. Long blond hair, silver armor with wing ornaments, a white feather cape, a long lance, a dignified expression.',
    faces: { normal: 'upright, lance held vertically', smile: 'small proud smile', serious: 'pointing the lance forward, wings of light behind her' },
    cutin: 'close-up diving from the sky, lance first, white feathers and wind streaks',
    outfit: 'second outfit: a light sky-blue cavalry uniform with a feather-trimmed short cape',
    cards: { 'sigrun_dive': 'a knight diving from the clouds with a lance', 'sigrun_rise': 'soaring up with white feathered wings of light' } },
  zeno: { name: '제노', rarity: 4, accent: 'black and dragon gold',
    sheet: 'a silent dark knight man in his late 20s. Long black hair, one eye a golden dragon eye, black armor with dragon scales, a huge greatsword on his back.',
    faces: { normal: 'stoic, arms folded', smile: 'very faint smile, looking down', serious: 'dragon eye glowing, gripping the greatsword' },
    cutin: 'close-up of the golden dragon eye and black flames',
    outfit: 'second outfit: a dark-crimson coat over scale mail with a torn black cape',
    cards: { 'zeno_slash': 'a heavy black greatsword strike with dark flames', 'zeno_roar': 'a shadow of a dragon roaring behind the knight' } },
  brick: { name: '브릭', rarity: 3, accent: 'red and brass',
    sheet: 'an energetic gunner woman in her mid 20s. Short red hair, goggles pushed up on her head, a huge hand cannon bigger than her body, a cropped work top that shows her shoulders and midriff, suspender shorts, work boots.',
    faces: { normal: 'big grin, cannon on shoulder', smile: 'laughing loudly, thumbs up', serious: 'aiming the cannon, goggles down' },
    cutin: 'close-up of the cannon muzzle flash and her grin behind the goggles',
    outfit: 'second outfit: an oil-stained mechanic jumpsuit tied at the waist and a tank top',
    cards: { 'brick_load': 'loading glowing shells into the hand cannon', 'brick_fire': 'a huge cannon blast lighting up the night' } },
  marta: { name: '마르타', rarity: 3, accent: 'gold and white',
    sheet: 'a very tall, muscular nun woman in her 30s, about 2 meters tall. Long blond hair in a braid, a nun habit with a high side slit showing her legs, iron gauntlets, a gentle smile.',
    faces: { normal: 'gentle smile, hands together in prayer with gauntlets', smile: 'warm laugh', serious: 'raising an iron fist, a holy light shield behind her' },
    cutin: 'close-up of an iron fist and a glowing holy barrier',
    outfit: 'second outfit: a white battle-nun coat with a big rosary and armored boots',
    cards: { 'marta_wall': 'a wall of golden holy light', 'marta_fist': 'an iron gauntlet punch' } },
  finn: { name: '핀', rarity: 3, accent: 'brown and red',
    sheet: 'a lively 14-year-old mail delivery boy. Curly brown hair, a mail cap, a huge mailbag bigger than his body, shorts with long socks, running shoes. Drawn modestly and age-appropriately.',
    faces: { normal: 'bright grin, holding a letter', smile: 'laughing, saluting', serious: 'running at full speed, letters flying' },
    cutin: 'close-up of him sprinting, letters fluttering around',
    outfit: 'second outfit: a winter postal coat with a red scarf',
    cards: { 'finn_letter': 'a letter thrown like a dart', 'finn_express': 'a boy dashing across rooftops with a mailbag' } },
  laila: { name: '라일라', rarity: 3, accent: 'sky blue and grey',
    sheet: 'a brusque deserter knight woman in her early 20s. Long sky-blue hair tied back, a torn knight cape, a short top and leg wraps, twin daggers.',
    faces: { normal: 'unimpressed, daggers twirling', smile: 'small smirk', serious: 'crouched low, wind swirling' },
    cutin: 'close-up of crossed daggers and wind blades',
    outfit: 'second outfit: a hooded traveling cloak over light leather armor',
    cards: { 'laila_wind': 'twin dagger slashes riding a gust of wind', 'laila_storm': 'a whirlwind of blade flashes' } },
  dora: { name: '도라', rarity: 3, accent: 'brown and orange',
    sheet: 'a cheerful 19-year-old blacksmith woman. Long brown hair in a ponytail, tanned arms, a leather apron over a tank top, a big hammer on her shoulder.',
    faces: { normal: 'grin, hammer on shoulder', smile: 'laughing, wiping soot from her cheek', serious: 'hammering a glowing blade, sparks flying' },
    cutin: 'close-up of the hammer striking an anvil, a fountain of sparks',
    outfit: 'second outfit: a festival outfit with a short jacket and a tool belt',
    cards: { 'dora_hammer': 'a hammer strike with sparks', 'dora_temper': 'a glowing blade quenched in water with steam' } },
  gordon: { name: '고든', rarity: 3, accent: 'white and warm brown',
    sheet: 'a big burly cook man in his 40s. A bushy beard, a white chef uniform, a frying pan and a ladle, a kind face.',
    faces: { normal: 'kind smile, holding a ladle', smile: 'hearty laugh', serious: 'swinging the frying pan' },
    cutin: 'close-up of a frying pan swing and steam',
    outfit: 'second outfit: a night-market apron and a headband',
    cards: { 'gordon_soup': 'a warm bowl of soup steaming', 'gordon_pan': 'a frying pan bonk' } },
  fukuro: { name: '후쿠로', rarity: 3, accent: 'brown and lantern orange',
    sheet: 'a mysterious night-market merchant man of unknown age. An owl mask covering his whole face, a huge bundle on his back hung with lanterns and trinkets, a patched robe.',
    faces: { normal: 'bowing like a merchant', smile: 'spreading his arms, offering goods', serious: 'throwing trinkets from his bundle' },
    cutin: 'close-up of the owl mask with glinting eyes and swinging lanterns',
    outfit: 'second outfit: a fancy festival robe with a golden owl mask',
    cards: { 'fukuro_junk': 'random trinkets flying through the air', 'fukuro_charm': 'a glowing lucky charm' } },
};

// 인연 듀오 컷인 (처음 8쌍)
export const DUOS = {
  iris_marta: { pair: ['iris', 'marta'], scene: 'sword and shield: the swordswoman slashing from behind the tall nun\'s raised holy barrier' },
  iris_akane: { pair: ['iris', 'akane'], scene: 'rivals back to back, a silver blade and two burning blades crossing in an X' },
  iris_brick: { pair: ['iris', 'brick'], scene: 'the swordswoman cutting through a cannonball\'s explosion fired by the gunner' },
  brick_mariana: { pair: ['brick', 'mariana'], scene: 'the gunner and the pirate queen firing together from a ship deck' },
  sigrun_laila: { pair: ['sigrun', 'laila'], scene: 'the knight commander and her former subordinate diving together from the clouds' },
  lunaria_sion: { pair: ['lunaria', 'sion'], scene: 'the dancer under a full moon and the summoner under a sky of stars, moonlight and starlight merging' },
  eleonore_sebas: { pair: ['eleonore', 'sebas'], scene: 'the witch and the old butler sharing tea while clock hands spin backward around them' },
  zeno_marta: { pair: ['zeno', 'marta'], scene: 'the dark knight kneeling before the tall nun, golden light and black flames meeting' },
};

// ── 적 ───────────────────────────────────────────────────
export const ENEMIES = {
  act1: {
    sea_ghost: '바다 유령 — a translucent sea ghost made of seaweed and mist with glowing lantern eyes',
    crab_soldier: '게 갑옷병 — a soldier wearing a huge crab shell as armor, claws as weapons',
    dock_pirate: '부두 해적 — a sneaky dock pirate with a bandana and a hook, a cutlass',
    gulls: '갈매기 떼 — a flock of three mischievous seagulls with glowing eyes',
  },
  act1_elite: {
    anchor_giant: '닻 거인 — a huge rusty giant built from an anchor and chains',
    fog_witch: '안개 마녀 — an elegant adult witch woman wrapped in sea fog, a lantern on a long pole, a gacha-style outfit',
  },
  act2: {
    cloud_spirit: '구름 정령 — a puffy cloud spirit with a stormy face',
    feather_knight: '깃털 기사 — a small knight in feather armor with a winged helmet',
    thunder_sheep: '천둥 양 — a fluffy sheep crackling with lightning',
    vane_soldier: '바람개비 병사 — a soldier with a pinwheel shield spinning in the wind',
  },
  act2_elite: {
    thunderbird: '번개새 — a large bird of crackling lightning',
    twin_vanes: '쌍둥이 풍향계 — two living weathervanes, a rooster and a fish, back to back (one image with both)',
  },
  act3: {
    star_statue: '별 조각상 — a stone statue embedded with glowing stars',
    shadow_cat: '그림자 고양이 — a sleek shadow cat with starry eyes',
    meteor_archer: '유성 사수 — an archer whose arrows are tiny meteors',
    clock_angel: '시계태엽 천사 — a clockwork angel with gear wings, a clock face for a halo',
  },
  act3_elite: {
    meteor_rider: '유성 기수 — a rider on a flaming meteor steed, a crowned helmet',
    moon_shadow: '달의 그림자 — a shadowy figure shaped by moonlight, crescent blades',
  },
};

export const BOSSES = {
  lighthouse: { name: '등대지기', p1: 'a huge burly old lighthouse keeper with a white beard, a raincoat, carrying a rotating lighthouse lamp that shoots a beam of light', p2: 'second phase: the lamp splits into two beams, his coat torn by the wind, eyes glowing', cutin: 'close-up of the old keeper and the blinding lighthouse beam sweeping across' },
  cloud_captain: { name: '구름 기사단장', p1: 'an adult woman knight commander in heavy cloud-white armor, long silver hair, a long lance, a plumed helmet', p2: 'second phase: she has thrown off the heavy armor, now in a sleek fitted battle suit, silver hair loose, lance crackling with wind', cutin: 'close-up of her casting off the heavy armor, plates flying, silver hair whipping' },
  dawn: { name: '새벽', p1: 'the master of the tower: an adult woman with long white hair and gold eyes, a sky-blue dress the color of a sunrise, holding a giant clock hand as a weapon, faint sunlight behind her', p2: 'second phase "the sun rises": her dress blazes with sunrise orange and gold, a halo of dawn light, the clock hand glowing', cutin: 'close-up of her golden eyes as the sun rises behind her, the night sky splitting' },
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

// ── 도구 아이콘 24 ───────────────────────────────────────
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
};

// ── 목록 만들기 ──────────────────────────────────────────
const join = (...xs) => xs.filter(Boolean).join('\n\n');
const rarityStyle = (r) => STYLE['rarity' + r];

function item(kind, id, batch, file, prompt, extra = {}) {
  const s = SPEC[kind];
  return { id, kind, batch, file: `${s.folder}/${file}`, width: s.w, height: s.h, transparent: s.transparent,
    max_colors: s.colors === Infinity ? null : s.colors, native: s.native, note: s.note, prompt, ...extra };
}

export function assetList() {
  const out = [];
  const batches = [];
  for (const [id, c] of Object.entries(CHARS)) {
    const batch = `char-${id}`;
    const base = join(STYLE.pixel, STYLE.character, rarityStyle(c.rarity));
    const who = `${c.name} (${id}): ${c.sheet} Accent colors: ${c.accent}.`;
    batches.push({ id: batch, title: `${'★'.repeat(c.rarity)} ${c.name}`,
      reference_sheet_prompt: join(base, `Character reference sheet of ${who} Full body front view plus a face close-up, plain background. Native resolution about 256x170, upscaled with nearest-neighbor.`) });
    const ref = [`chars/${id}_normal.png`];
    out.push(item('stand', `${id}_stand`, batch, `${id}_stand.png`,
      join(base, STYLE.onModel, `${who}\nFull-body battle stance, standing at a slight three-quarter angle facing RIGHT (toward enemies), weapon ready. Fully transparent background, nothing behind the character. Feet near the bottom edge, empty margin above the head. Native resolution 128x192 pixels, upscaled exactly 8x with nearest-neighbor to 1024x1536.`),
      { must_show: '전신, 오른쪽을 향한 전투 자세, 무기' }));
    for (const [face, expr] of Object.entries(c.faces)) {
      out.push(item('portrait', `${id}_${face}`, batch, `${id}_${face}.png`,
        join(base, STYLE.onModel, `${who}\nWaist-up portrait facing slightly to the side. Expression and pose: ${expr}. Fully transparent background with nothing behind the character. Head, hair and arms stay inside the image with empty margin on the left, right and top; only the waist touches the bottom edge. Native resolution 128x192 pixels, upscaled exactly 8x with nearest-neighbor to 1024x1536.`),
        { followup_prompt: `Same character, same style. Waist-up portrait, transparent background. Expression and pose: ${expr}.`, reference_images: face === 'normal' ? [] : ref }));
    }
    out.push(item('cutin', `${id}_cutin`, batch, `${id}_cutin.png`,
      join(base, STYLE.onModel, `${who}\nDramatic cut-in panel for a special move: ${c.cutin}. Wide horizontal composition, the face and action inside the middle horizontal band (the top and bottom will be cropped to 1536x576). Speed lines made of pixels, strong accent colors (${c.accent}).`),
      { reference_images: ref, must_show: '얼굴이 가운데 띠 안' }));
    out.push(item('outfit', `${id}_outfit2`, batch, `${id}_outfit2.png`,
      join(base, STYLE.onModel, `${who}\nSame person, same face and hair, but in a ${c.outfit}. Full-body standing pose facing slightly right, transparent background. Native resolution 128x192 pixels, upscaled exactly 8x to 1024x1536.`),
      { reference_images: ref }));
    for (const [cid, scene] of Object.entries(c.cards)) {
      out.push(item('card', cid, batch, `${cid}.png`,
        join(STYLE.pixel, `Small card illustration for ${c.name}'s skill card: ${scene}. ${c.name} may appear small and ON-MODEL from the attached reference. Simple strong composition readable at a tiny size. Accent colors: ${c.accent}. Make it 1536x1024; it will be cropped to the center and reduced to 64x44 pixels, so keep the subject in the middle and big.`),
        { reference_images: ref }));
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
  batches.push({ id: 'duo', title: '인연 듀오 컷인 (처음 8쌍)' });
  for (const [id, d] of Object.entries(DUOS)) {
    const [a, b] = d.pair;
    out.push(item('duo', `duo_${id}`, 'duo', `duo_${id}.png`,
      join(STYLE.pixel, STYLE.character, STYLE.onModel, `Duo cut-in of ${CHARS[a].name} and ${CHARS[b].name}: ${d.scene}. Both characters ON-MODEL from the attached references, faces clearly visible. Wide horizontal composition; the top and bottom will be cropped to 1536x768. Speed lines made of pixels.`),
      { reference_images: [`chars/${a}_normal.png`, `chars/${b}_normal.png`], must_show: '두 사람 얼굴 둘 다' }));
  }

  // 적
  for (const act of ['act1', 'act2', 'act3']) {
    const batch = `enemy-${act}`;
    batches.push({ id: batch, title: `${act.slice(-1)}막 적` });
    for (const [id, desc] of Object.entries(ENEMIES[act])) {
      out.push(item('enemy', id, batch, `${id}.png`, join(STYLE.pixel, `Enemy sprite: ${desc}. Facing LEFT (toward the party). Cute-but-menacing gacha-game monster design. Fully transparent background. Native resolution 96x96 pixels, upscaled exactly 8x to 768x768.`)));
    }
    for (const [id, desc] of Object.entries(ENEMIES[act + '_elite'])) {
      out.push(item('elite', id, batch, `${id}.png`, join(STYLE.pixel, /woman/.test(desc) ? STYLE.character : '', `Elite enemy sprite: ${desc}. Bigger and more imposing than normal enemies. Facing LEFT. Fully transparent background. Native resolution 128x128 pixels, upscaled exactly 8x to 1024x1024.`)));
    }
  }
  for (const [id, b] of Object.entries(BOSSES)) {
    const batch = `boss-${id}`;
    batches.push({ id: batch, title: `보스 ${b.name}` });
    const human = join(STYLE.pixel, STYLE.character);
    out.push(item('boss', `boss_${id}_1`, batch, `boss_${id}_1.png`, join(human, `Boss sprite, ${b.name}: ${b.p1}. Facing LEFT, imposing. Fully transparent background. Native resolution 128x192 pixels, upscaled exactly 8x to 1024x1536.`)));
    out.push(item('boss', `boss_${id}_2`, batch, `boss_${id}_2.png`, join(human, STYLE.onModel, `Boss sprite, ${b.name}, ${b.p2}. Same person as the attached first-phase sprite. Facing LEFT. Fully transparent background. 1024x1536.`), { reference_images: [`enemies/boss_${id}_1.png`] }));
    out.push(item('cutin', `boss_${id}_cutin`, batch, `boss_${id}_cutin.png`, join(human, STYLE.onModel, `Boss cut-in: ${b.cutin}. Wide horizontal composition, face in the middle band (cropped to 1536x576).`), { reference_images: [`enemies/boss_${id}_1.png`] }));
  }

  // 배경·타이틀·소환·아이콘
  batches.push({ id: 'bg', title: '배경' });
  for (const [id, desc] of Object.entries(BGS)) {
    out.push(item('bg', `bg_${id}`, 'bg', `${id}.png`, join(STYLE.pixel, `Background: ${desc}. No people. Wide 16:9 view; keep the lower third simple so characters can stand in front. Native resolution 320x180 pixels, full color, limited palette of about 32 colors, upscaled exactly 4x with nearest-neighbor to 1280x720.`)));
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
  batches.push({ id: 'icons', title: '도구 아이콘 24' });
  for (const [id, desc] of Object.entries(RELICS)) {
    out.push(item('icon', `relic_${id}`, 'icons', `relic_${id}.png`, join(STYLE.pixel, `A single item icon: ${desc}. Centered, readable at 24x24 pixels, bold outline, fully transparent background. Native resolution 24x24 pixels, upscaled exactly 8x to 192x192.`)));
  }
  return { batches, items: out };
}
