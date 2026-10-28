// 시드 난수 (mulberry32). 판마다 시드 하나로 지도·달·보상·셔플을 재현한다.
export function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    next,
    int: n => Math.floor(next() * n),
    pick: arr => arr[r.int(arr.length)],
    pickN(arr, n) { const a2 = arr.slice(), out = []; while (out.length < n && a2.length) out.push(a2.splice(r.int(a2.length), 1)[0]); return out; },
    shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = r.int(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; },
    get state() { return a >>> 0; },
  };
  return r;
}
export const newSeed = () => (Math.random() * 2 ** 32) >>> 0;
