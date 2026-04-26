-- Automatically advance room status to voting when all participants submitted proposals.
-- Keeps all clients in sync without requiring a host-only manual action.

create or replace function public.advance_room_to_voting_when_proposals_complete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total_participants int;
  total_proposals int;
begin
  -- Only advance from proposal phase.
  if not exists (
    select 1
    from public.rooms r
    where r.id = new.room_id
      and r.status = 'proposal'
  ) then
    return new;
  end if;

  select count(*)
    into total_participants
    from public.participants p
    where p.room_id = new.room_id;

  select count(*)
    into total_proposals
    from public.proposals pr
    where pr.room_id = new.room_id;

  if total_participants > 0 and total_proposals >= total_participants then
    update public.rooms
      set status = 'voting'
      where id = new.room_id
        and status = 'proposal';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_advance_room_to_voting_on_proposal_insert on public.proposals;
create trigger trg_advance_room_to_voting_on_proposal_insert
  after insert on public.proposals
  for each row execute procedure public.advance_room_to_voting_when_proposals_complete();
