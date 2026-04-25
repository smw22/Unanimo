-- Add proposal as a room status for the proposal-writing phase.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'room_status'
      and e.enumlabel = 'proposal'
  ) then
    alter type public.room_status add value 'proposal' after 'waiting';
  end if;
end$$;