// 임시 도트 (그림 파일이 없을 때). 12×16 템플릿을 팔레트로 칠한다.
const K = '#141018';
const TPL = [
  '...kkkkkk...', '..khhhhhhk..', '.khhhhhhhhk.', '.khHhhhhHhk.',
  'khhsssssshhk', 'khsewssewshk', 'khseesseeshk', 'khssssssssHk',
  '.kHksssssH..', '..koaooaok..', '.kooaooaook.', 'ksoooooooosk',
  'ksOooooooOsk', '.kOOOaaOOOk.', '..kok..kok..', '..kkk..kkk..',
];
const cache = new Map();
export function sprite(pal, long, crown) {
  const key = JSON.stringify([pal, long, crown]);
  if (cache.has(key)) return cache.get(key);
  const rows = TPL.map(r => r.split(''));
  rows[8][11] = '.';
  if (long) for (let y = 7; y <= 12; y++) { rows[y][0] = 'H'; rows[y][11] = 'H'; }
  const off = crown ? 2 : 0, Z = 4;
  const c = document.createElement('canvas'); c.width = 12 * Z; c.height = (16 + off) * Z;
  const g = c.getContext('2d');
  const P = Object.assign({ k: K, s: pal.skin || '#f6d5c0', w: '#ffffff' }, pal);
  const put = (ch, x, y) => { if (ch !== '.') { g.fillStyle = P[ch]; g.fillRect(x * Z, y * Z, Z, Z); } };
  if (crown) ['..a.a..a.a..', '..aaaaaaaa..'].forEach((r, y) => [...r].forEach((ch, x) => put(ch, x, y)));
  rows.forEach((r, y) => r.forEach((ch, x) => put(ch, x, y + off)));
  const url = c.toDataURL();
  cache.set(key, url);
  return url;
}
export function moonImg(phase) {
  const key = 'moon:' + phase;
  if (cache.has(key)) return cache.get(key);
  const Z = 3, c = document.createElement('canvas'); c.width = 15 * Z; c.height = 15 * Z;
  const g = c.getContext('2d');
  for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) {
    if (x * x + y * y > 42) continue;
    const lit = phase === 'full' ? true : phase === 'half' ? x >= 0 : phase === 'crescent' ? (x + 4) ** 2 + y * y > 36 : false;
    g.fillStyle = lit ? '#e8ecff' : x * x + y * y > 30 ? '#5a6090' : '#1e2046';
    g.fillRect((x + 7) * Z, (y + 7) * Z, Z, Z);
  }
  const url = c.toDataURL();
  cache.set(key, url);
  return url;
}
