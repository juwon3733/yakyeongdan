-- 야경단 온라인 (docs/SEASON_PLAN.md). Supabase 대시보드 → SQL Editor에 통째로 붙여 넣고 Run.
-- 로그인은 아이디·비밀번호: 게임이 아이디를 <아이디>@yakyeongdan.game 메일 주소로 바꿔 Supabase Auth에 넣는다
-- (Authentication → Providers → Email에서 「Confirm email」을 끈다).

-- 프로필: 아이디(닉네임)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null check (username ~ '^[A-Za-z0-9가-힣_]{2,12}$'),
  created_at timestamptz default now()
);
-- 저장: 진행(P) 통째로
create table if not exists public.saves (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);
-- 기록: 시즌·랭킹 종류마다 한 사람 한 줄(더 좋은 기록이면 덮어씀)
--   board: run(밤 오르기, 작을수록 좋음 = 도착 분) · endless(층) · sboss_<난이도>(턴, 작을수록) · daily_<날짜>(분)
create table if not exists public.scores (
  season text not null,
  board text not null,
  user_id uuid not null references auth.users on delete cascade,
  username text not null,
  score integer not null,
  detail jsonb default '{}'::jsonb,
  verified boolean default false,
  created_at timestamptz default now(),
  primary key (season, board, user_id)
);
create index if not exists scores_board on public.scores (season, board, score);

alter table public.profiles enable row level security;
alter table public.saves enable row level security;
alter table public.scores enable row level security;

-- 프로필: 누구나 읽기, 내 것만 쓰기
create policy "profiles read" on public.profiles for select using (true);
create policy "profiles own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles own update" on public.profiles for update using (auth.uid() = id);
-- 저장: 내 것만
create policy "saves own" on public.saves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- 기록: 누구나 읽기(랭킹), 내 것만 쓰기
create policy "scores read" on public.scores for select using (true);
create policy "scores own" on public.scores for insert with check (auth.uid() = user_id);
create policy "scores own update" on public.scores for update using (auth.uid() = user_id);

-- 서버 시간 (시즌·매일 경계 판정)
create or replace function public.server_now() returns timestamptz language sql stable as $$ select now() $$;

-- 기록 올리기: 더 좋은 기록일 때만 바꾼다(작을수록 좋은 랭킹 lower=true)
create or replace function public.submit_score(p_season text, p_board text, p_score integer, p_detail jsonb, p_lower boolean)
returns void language plpgsql security definer set search_path = public as $$
declare uname text;
begin
  select username into uname from profiles where id = auth.uid();
  if uname is null then raise exception 'no profile'; end if;
  insert into scores (season, board, user_id, username, score, detail)
    values (p_season, p_board, auth.uid(), uname, p_score, p_detail)
  on conflict (season, board, user_id) do update
    set score = excluded.score, detail = excluded.detail, created_at = now(), verified = false
    where (p_lower and excluded.score < scores.score) or (not p_lower and excluded.score > scores.score);
end $$;
