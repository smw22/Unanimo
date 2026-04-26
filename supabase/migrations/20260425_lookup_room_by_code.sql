-- Allow authenticated users to resolve a room by invite code without exposing member-only room reads.
-- This is used only for join-by-code, while room membership and room data remain protected by RLS.

create or replace function public.lookup_room_by_code(room_code text)
returns table (
  id uuid,
  code text,
  status public.room_status,
  max_participants int
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.code, r.status, r.max_participants
  from public.rooms r
  where r.code = upper(trim(room_code))
  limit 1;
$$;

grant execute on function public.lookup_room_by_code(text) to authenticated;
