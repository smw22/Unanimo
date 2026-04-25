-- Join a room by invite code using a security-definer function.
-- This bypasses the participant insert policy safely while still using auth.uid() for the current user.

create or replace function public.join_room_by_code(room_code text)
returns table (
  id uuid,
  code text,
  status public.room_status,
  max_participants int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room public.rooms%rowtype;
  participant_count int;
begin
  if auth.uid() is null then
    raise exception 'User not authenticated';
  end if;

  select r.*
    into target_room
    from public.rooms r
   where r.code = upper(trim(room_code))
   limit 1;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  if target_room.status <> 'waiting' then
    raise exception 'ROOM_NOT_JOINABLE';
  end if;

  select count(*)
    into participant_count
    from public.participants p
   where p.room_id = target_room.id;

  if participant_count >= target_room.max_participants then
    raise exception 'ROOM_FULL';
  end if;

  insert into public.participants (room_id, user_id)
  values (target_room.id, auth.uid())
  on conflict (room_id, user_id) do nothing;

  return query
  select target_room.id,
         target_room.code,
         target_room.status,
         target_room.max_participants;
end;
$$;

grant execute on function public.join_room_by_code(text) to authenticated;
