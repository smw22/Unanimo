-- =========================================
-- UNANIMO SCHEMA (rebuild baseline)
-- =========================================
-- Notes:
-- - Uses auth.users as source of truth for authentication
-- - public.profiles extends auth user data
-- - Room code is generated automatically
-- - RLS enforces membership-based access
-- =========================================

-- ---------- Extensions ----------
create extension if not exists pgcrypto;

-- ---------- Types ----------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'room_status') then
    create type public.room_status as enum ('waiting', 'proposal', 'voting', 'finished', 'closed');
  end if;
end$$;

-- ---------- Utility functions ----------

-- Generate short invite code (e.g. XK92)
create or replace function public.generate_room_code(code_length int default 4)
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out_code text := '';
  i int := 0;
begin
  while i < code_length loop
    out_code := out_code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    i := i + 1;
  end loop;
  return out_code;
end;
$$;

-- Set updated_at automatically
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- Profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  avatar_url text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_length check (char_length(username) >= 3)
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- ---------- Rooms ----------
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  code text not null unique,
  status public.room_status not null default 'waiting',
  max_participants int not null default 10 check (max_participants > 0 and max_participants <= 50),
  is_anonymous boolean not null default false,
  is_time_limited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  winner_proposal_id uuid
);

drop trigger if exists trg_rooms_updated_at on public.rooms;
create trigger trg_rooms_updated_at
before update on public.rooms
for each row execute procedure public.set_updated_at();

-- Auto-generate room code on insert if missing
create or replace function public.set_room_code()
returns trigger
language plpgsql
as $$
declare
  candidate text;
  exists_code boolean;
begin
  if new.code is not null and length(trim(new.code)) > 0 then
    new.code := upper(trim(new.code));
    return new;
  end if;

  loop
    candidate := public.generate_room_code(4);
    select exists(select 1 from public.rooms r where r.code = candidate) into exists_code;
    exit when not exists_code;
  end loop;

  new.code := candidate;
  return new;
end;
$$;

drop trigger if exists trg_rooms_set_code on public.rooms;
create trigger trg_rooms_set_code
before insert on public.rooms
for each row execute procedure public.set_room_code();

-- ---------- Participants ----------
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

---------- Room Capacity Check Trigger ----------
create or replace function public.check_room_capacity()
returns trigger
language plpgsql
as $$
declare
  current_count int;
  max_cap int;
begin
  select count(*), r.max_participants
    into current_count, max_cap
    from public.participants p
    join public.rooms r on r.id = p.room_id
   where p.room_id = new.room_id
   group by r.max_participants;

  if current_count >= max_cap then
    raise exception 'Room is full (max % participants)', max_cap;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_room_capacity on public.participants;
create trigger trg_check_room_capacity
  before insert on public.participants
  for each row execute procedure public.check_room_capacity();

-- ---------- Proposals ----------
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0 and char_length(content) <= 200),
  created_at timestamptz not null default now(),
  unique (room_id, participant_id)
);

-- ---------- Votes ----------
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (proposal_id, participant_id)
);

-- Add winner FK now that proposals exists
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rooms_winner_proposal_id_fkey'
  ) then
    alter table public.rooms
      add constraint rooms_winner_proposal_id_fkey
      foreign key (winner_proposal_id)
      references public.proposals(id)
      on delete set null;
  end if;
end$$;

-- ---------- Indexes ----------
create index if not exists idx_rooms_host_id on public.rooms(host_id);
create index if not exists idx_rooms_status on public.rooms(status);
create index if not exists idx_rooms_code on public.rooms(code);

create index if not exists idx_participants_room_id on public.participants(room_id);
create index if not exists idx_participants_user_id on public.participants(user_id);

create index if not exists idx_proposals_room_id on public.proposals(room_id);
create index if not exists idx_proposals_participant_id on public.proposals(participant_id);

create index if not exists idx_votes_proposal_id on public.votes(proposal_id);
create index if not exists idx_votes_participant_id on public.votes(participant_id);

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.participants enable row level security;
alter table public.proposals enable row level security;
alter table public.votes enable row level security;

-- Profiles
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
on public.profiles
for select
using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Rooms
drop policy if exists "rooms_select_members" on public.rooms;
create policy "rooms_select_members"
on public.rooms
for select
using (
  host_id = auth.uid()
  or exists (
    select 1
    from public.participants p
    where p.room_id = rooms.id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "rooms_insert_host_self" on public.rooms;
create policy "rooms_insert_host_self"
on public.rooms
for insert
with check (host_id = auth.uid());

drop policy if exists "rooms_update_host_only" on public.rooms;
create policy "rooms_update_host_only"
on public.rooms
for update
using (host_id = auth.uid())
with check (host_id = auth.uid());

-- Participants
drop policy if exists "participants_select_room_members" on public.participants;
create policy "participants_select_room_members"
on public.participants
for select
using (
  exists (
    select 1
    from public.participants me
    where me.room_id = participants.room_id
      and me.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.rooms r
    where r.id = participants.room_id
      and r.host_id = auth.uid()
  )
);

drop policy if exists "participants_insert_self" on public.participants;
create policy "participants_insert_self"
on public.participants
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.rooms r
    where r.id = participants.room_id
      and r.status = 'waiting'
  )
);

drop policy if exists "participants_delete_self_or_host" on public.participants;
create policy "participants_delete_self_or_host"
on public.participants
for delete
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.rooms r
    where r.id = participants.room_id
      and r.host_id = auth.uid()
  )
);

-- Proposals
drop policy if exists "proposals_select_room_members" on public.proposals;
create policy "proposals_select_room_members"
on public.proposals
for select
using (
  exists (
    select 1
    from public.participants me
    where me.room_id = proposals.room_id
      and me.user_id = auth.uid()
  )
);

drop policy if exists "proposals_insert_owner_participant" on public.proposals;
create policy "proposals_insert_owner_participant"
on public.proposals
for insert
with check (
  exists (
    select 1
    from public.participants p
    where p.id = participant_id
      and p.room_id = proposals.room_id
      and p.user_id = auth.uid()
  )
);

-- Votes
drop policy if exists "votes_select_room_members" on public.votes;
create policy "votes_select_room_members"
on public.votes
for select
using (
  exists (
    select 1
    from public.proposals pr
    join public.participants me on me.room_id = pr.room_id
    where pr.id = votes.proposal_id
      and me.user_id = auth.uid()
  )
);

drop policy if exists "votes_insert_owner_participant" on public.votes;
create policy "votes_insert_owner_participant"
on public.votes
for insert
with check (
  exists (
    select 1
    from public.participants p_self
    join public.proposals pr on pr.id = votes.proposal_id
    where p_self.id = votes.participant_id
      and p_self.user_id = auth.uid()
      and p_self.room_id = pr.room_id
  )
);

-- ---------- Realtime ----------
-- Make sure these tables are in the realtime publication
do $$
begin
  begin
    alter publication supabase_realtime add table public.rooms;
  exception when duplicate_object then
    null;
  end;
  begin
    alter publication supabase_realtime add table public.participants;
  exception when duplicate_object then
    null;
  end;
  begin
    alter publication supabase_realtime add table public.proposals;
  exception when duplicate_object then
    null;
  end;
  begin
    alter publication supabase_realtime add table public.votes;
  exception when duplicate_object then
    null;
  end;
end$$;