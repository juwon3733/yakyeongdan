// 온라인 (supabase/schema.sql): 아이디·비번 로그인, 저장 올리기·받기, 랭킹 기록·불러오기. SDK 없이 REST로.
//   아이디는 <id>@yakyeongdan.game 이메일로 바꿔 가입한다(이메일 확인 끔). 세션은 localStorage 'yk-net'.
//   NET(js/data/net_config.js)이 비어 있으면 online() = false — 모든 함수가 조용히 아무것도 안 한다.
import { NET } from './data/net_config.js';

const KEY = 'yk-net';
const mail = id => `${id.toLowerCase()}@yakyeongdan.game`;
export const online = () => !!(NET.url && NET.anon);
export const ID_RULE = /^[A-Za-z0-9가-힣_]{2,12}$/;

let ses = null;
try { ses = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { ses = null; }
const keep = s => { ses = s; try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch { /* 저장 막힘 */ } };
export const me = () => ses ? { id: ses.uid, name: ses.name } : null;

async function call(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
  const h = { apikey: NET.anon, 'Content-Type': 'application/json', ...headers };
  if (auth && ses?.access) h.Authorization = `Bearer ${ses.access}`;
  const r = await fetch(NET.url + path, { method, headers: h, body: body == null ? undefined : JSON.stringify(body) });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch { j = t; }
  if (!r.ok) throw new Error((j && (j.msg || j.message || j.error_description || j.error)) || `HTTP ${r.status}`);
  return j;
}
function take(j, name) {
  keep({ uid: j.user.id, name, access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000 });
}
// 만료 1분 전이면 새 토큰
async function fresh() {
  if (!ses) return false;
  if (Date.now() < ses.exp - 60000) return true;
  try { const j = await call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', auth: false, body: { refresh_token: ses.refresh } }); take(j, ses.name); return true; }
  catch { keep(null); return false; }
}

// 가입: 계정 → 프로필(아이디). 이미 있는 아이디면 서버가 거절한다
export async function signUp(id, pw) {
  if (!online()) throw new Error('온라인에 연결되지 않았다');
  if (!ID_RULE.test(id)) throw new Error('아이디는 2~12자(한글·영문·숫자·_)');
  if ((pw || '').length < 6) throw new Error('비밀번호는 6자 이상');
  const j = await call('/auth/v1/signup', { method: 'POST', auth: false, body: { email: mail(id), password: pw } });
  if (!j?.access_token) throw new Error('가입은 됐지만 로그인하지 못했다(이메일 확인이 켜져 있는지 확인)');
  take(j, id);
  await call('/rest/v1/profiles', { method: 'POST', body: { id: ses.uid, username: id }, headers: { Prefer: 'return=minimal' } });
  return me();
}
export async function signIn(id, pw) {
  if (!online()) throw new Error('온라인에 연결되지 않았다');
  const j = await call('/auth/v1/token?grant_type=password', { method: 'POST', auth: false, body: { email: mail(id), password: pw } });
  take(j, id);
  return me();
}
export function signOut() { keep(null); }

// 저장: 이 기기 저장(문자열 그대로)을 올리고 받는다. 받은 쪽을 쓸지는 부르는 쪽(main.js)이 정한다
export async function pushSave(data) {
  if (!online() || !(await fresh())) return false;
  await call('/rest/v1/saves', { method: 'POST', body: { user_id: ses.uid, data, updated_at: new Date().toISOString() }, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
  return true;
}
export async function pullSave() {
  if (!online() || !(await fresh())) return null;
  const rows = await call(`/rest/v1/saves?user_id=eq.${ses.uid}&select=data,updated_at`);
  return rows?.[0] || null;
}

// 랭킹: 점수는 클수록 좋게(js/ranking.js myRecord와 같은 규칙)
export async function submitScore(season, board, score, detail = {}) {
  if (!online() || !(await fresh())) return false;
  await call('/rest/v1/rpc/submit_score', { method: 'POST', body: { p_season: season, p_board: board, p_score: score, p_detail: detail, p_lower: false } });
  return true;
}
export async function topScores(season, board, n = 50) {
  const q = `season=eq.${encodeURIComponent(season)}&board=eq.${board}&order=score.desc,created_at.asc&limit=${n}&select=username,score,detail,user_id`;
  return await call(`/rest/v1/scores?${q}`, { auth: false });
}
export async function myRank(season, board, score) {
  const r = await fetch(`${NET.url}/rest/v1/scores?season=eq.${encodeURIComponent(season)}&board=eq.${board}&score=gt.${score}&select=user_id`,
    { headers: { apikey: NET.anon, Prefer: 'count=exact', Range: '0-0' } });
  const n = +(r.headers.get('content-range') || '').split('/')[1];
  return Number.isFinite(n) ? n + 1 : null;
}
