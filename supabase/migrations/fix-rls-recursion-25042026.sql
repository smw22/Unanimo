-- Fix recursive RLS policy evaluation on public.participants
-- Error addressed: "infinite recursion detected in policy for relation participants"

-- Ensure room capacity check can count all participants regardless of caller RLS visibility
create or replace function public.check_room_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
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

-- Security-definer helpers avoid self-referencing participants policies
create or replace function public.is_room_host(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rooms r
    where r.id = target_room_id
      and r.host_id = auth.uid()
  );
$$;

create or replace function public.is_room_participant(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.participants p
    where p.room_id = target_room_id
      and p.user_id = auth.uid()
  );
$$;

-- Rooms
drop policy if exists "rooms_select_members" on public.rooms;
create policy "rooms_select_members"
on public.rooms
for select
using (
  host_id = auth.uid()
  or public.is_room_participant(id)
);

-- Participants
drop policy if exists "participants_select_room_members" on public.participants;
create policy "participants_select_room_members"
on public.participants
for select
using (
  public.is_room_participant(room_id)
  or public.is_room_host(room_id)
);

drop policy if exists "participants_delete_self_or_host" on public.participants;
create policy "participants_delete_self_or_host"
on public.participants
for delete
using (
  user_id = auth.uid()
  or public.is_room_host(room_id)
);
