// 랭킹 (docs/SEASON_PLAN.md). 서버(Supabase)가 붙기 전에는 「내 기록」만 보여 준다.
//   fetchBoard(board, season) → { online, rows: [{ rank, name, score, text, party: [id×3] }], me: { score, text, rank? } }
//   board: 'daily' 매일의 밤(빠른 시각) · 'season_boss' 시즌 보스(높은 난이도·적은 턴) · 'endless' 끝없는 탑(높은 층) · 'run' 밤 오르기(빠른 시각)
//   개발판 ?fakerank 는 가짜 20줄로 화면을 확인한다.
import { P, dailyToday } from './meta.js';
import { seasonNow, seasonRec } from './season.js';
import { ROSTER_IDS } from './data/roster.js';

export const BOARDS = [
  { id: 'daily', name: '매일의 밤' },
  { id: 'season_boss', name: '시즌 보스' },
  { id: 'endless', name: '끝없는 탑' },
  { id: 'run', name: '밤 오르기' },
];
const fmt = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

// 내 기록(이 기기). 점수는 클수록 좋게 맞춘다(서버 정렬과 같은 규칙)
export function myRecord(board) {
  if (board === 'daily') {
    const d = P.daily?.[dailyToday().key];
    return d?.best != null ? { score: 1000 - d.best, text: `오늘 ${fmt(d.best)} 격파` } : null;
  }
  if (board === 'season_boss') {
    const s = seasonNow(); if (!s?.open) return null;
    const rec = seasonRec(s.id);
    for (let i = s.tiers.length - 1; i >= 0; i--) {
      const t = s.tiers[i], best = rec.best[t.id];
      if (best != null) return { score: (i + 1) * 1000 - best, text: `${t.name} ${best}턴` };
    }
    return null;
  }
  if (board === 'endless') return P.rec?.endlessBest ? { score: P.rec.endlessBest, text: `${P.rec.endlessBest}층` } : null;
  if (board === 'run') return P.best != null ? { score: 1000 - P.best, text: `${fmt(P.best)} 도착 · ${P.wins}번 격파` } : null;
  return null;
}

const NAMES = ['별지기', '새벽까마귀', '등불', '밤바다', '유성', '탑지기', '은빛창', '달그림자', '시계공', '고래노래',
  '붉은포', '안개길', '첫별', '종소리', '바람깃', '모래시계', '푸른불', '긴밤', '별조각', '야경꾼'];
function fake(board) {
  const rows = NAMES.map((name, i) => {
    const party = [0, 1, 2].map(k => ROSTER_IDS[(i * 7 + k * 5) % ROSTER_IDS.length]);
    const text = board === 'endless' ? `${40 - i}층` : board === 'season_boss' ? `악몽 ${6 + Math.floor(i / 3)}턴` : `${fmt(240 + i * 6)} 격파`;
    return { rank: i + 1, name, score: 1000 - i, text, party };
  });
  return { online: true, rows, me: { ...(myRecord(board) || { score: 0, text: '기록 없음' }), rank: 37 } };
}

export async function fetchBoard(board) {
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('fakerank')) {
    await new Promise(r => setTimeout(r, 300));
    return fake(board);
  }
  // 서버가 붙으면 여기서 불러온다(Supabase scores 표, supabase/schema.sql)
  return { online: false, rows: [], me: myRecord(board) };
}
