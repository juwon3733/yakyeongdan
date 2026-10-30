// 시즌 랭킹 자료. 서버가 아직 없어서 지금은 가짜 자료를 돌려준다 (나중에 Supabase로 바꿈 — 돌려주는 모양은 그대로)
// fetchBoard(board, season) → { board, season, rows: [{ rank, name, score, party: [id, id, id] }], me: { rank, score } }
// board: 'daily'(매일의 밤)·'season_boss'(시즌 보스)·'endless'(끝없는 탑)·'run'(밤 오르기)
import { ROSTER_IDS } from './data/roster.js';

export const BOARDS = [
  { id: 'daily', name: '매일의 밤', unit: '점' },
  { id: 'season_boss', name: '시즌 보스', unit: '점' },
  { id: 'endless', name: '끝없는 탑', unit: '층' },
  { id: 'run', name: '밤 오르기', unit: '점' },
];
const TOP = { daily: 9800, season_boss: 24000, endless: 120, run: 15000 };
const NAMES = ['별지기', '새벽바람', '등불', '달그림자', '파수꾼', '밤까마귀', '은방울', '초승달', '반딧불', '종지기',
  '서리꽃', '푸른등', '길잡이', '자정', '먹구름', '샛별', '호롱', '밤안개', '은하수', '첫눈'];

// 같은 판·시즌이면 같은 가짜 자료 (문자열 → 씨앗)
function rng(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822519) ^ Math.imul(h ^ (h >>> 13), 3266489917); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}

export async function fetchBoard(board, season) {
  if (!TOP[board]) throw new Error(`모르는 랭킹: ${board}`);
  await new Promise(r => setTimeout(r, 250));   // 서버를 기다리는 척
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('offline');
  const r = rng(`${board}:${season || ''}`);
  const names = NAMES.slice().sort(() => r() - .5);
  let score = TOP[board];
  const rows = names.map((name, i) => {
    if (i) score = Math.max(1, Math.round(score * (board === 'endless' ? .94 - r() * .03 : .95 - r() * .04)));
    const pool = ROSTER_IDS.slice(), party = [];
    while (party.length < 3) party.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    return { rank: i + 1, name, score, party };
  });
  const me = { rank: 40 + Math.floor(r() * 300), score: Math.max(1, Math.round(score * (.3 + r() * .4))) };
  return { board, season, rows, me };
}
