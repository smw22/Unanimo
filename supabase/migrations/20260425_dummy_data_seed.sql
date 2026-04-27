Adding dummy data for demonstration purposes. This includes 10 rooms with various proposals and votes, showcasing the functionality of the application.

begin;

-- ROOMSrrr
with room_seed as (
  select * from (values
    ('DEC001','Hvor skal teamet spise fredag?','529fb3c7-77a5-468b-a09f-45baf8921d3a'::uuid),
    ('DEC002','Hvilken film skal vi se i aften?','3c9df225-503d-4fbb-8041-798ed668999a'::uuid),
    ('DEC003','Hvad skal vi spille til game night?','75eb5222-852c-4513-b17a-25b72aa45a40'::uuid),
    ('DEC004','Hvilket projektværktøj skal vi bruge?','bce7f8de-b9e2-4fed-9cfa-895733fed44a'::uuid),
    ('DEC005','Hvor skal vi på weekendtur?','529fb3c7-77a5-468b-a09f-45baf8921d3a'::uuid),
    ('DEC006','Hvilken farve skal stuen males?','3c9df225-503d-4fbb-8041-798ed668999a'::uuid),
    ('DEC007','Hvad skal vi købe i gave?','75eb5222-852c-4513-b17a-25b72aa45a40'::uuid),
    ('DEC008','Hvilken koncert skal vi til?','bce7f8de-b9e2-4fed-9cfa-895733fed44a'::uuid),
    ('DEC009','Hvornår skal vi træne sammen?','529fb3c7-77a5-468b-a09f-45baf8921d3a'::uuid),
    ('DEC010','Hvilken brunch café vælger vi?','3c9df225-503d-4fbb-8041-798ed668999a'::uuid)
  ) as t(code, title, host_id)
)
insert into rooms (code, title, status, host_id, is_anonymous, is_time_limited)
select
  code,
  title,
  'results'::room_status,
  host_id,
  false,
  false
from room_seed
on conflict (code) do update
set
  title = excluded.title,
  status = 'results',
  host_id = excluded.host_id,
  updated_at = now();


-- PARTICIPANTS
with users as (
  select * from (values
    ('3c9df225-503d-4fbb-8041-798ed668999a'::uuid),
    ('529fb3c7-77a5-468b-a09f-45baf8921d3a'::uuid),
    ('75eb5222-852c-4513-b17a-25b72aa45a40'::uuid),
    ('bce7f8de-b9e2-4fed-9cfa-895733fed44a'::uuid)
  ) as t(user_id)
)
insert into participants (room_id, user_id)
select r.id, u.user_id
from rooms r
cross join users u
where r.code like 'DEC0%'
and not exists (
  select 1
  from participants p
  where p.room_id = r.id
    and p.user_id = u.user_id
);


-- PROPOSALS
with proposal_seed as (
  select * from (values
    ('DEC001','3c9df225-503d-4fbb-8041-798ed668999a'::uuid,'Sushi'),
    ('DEC001','529fb3c7-77a5-468b-a09f-45baf8921d3a'::uuid,'Burger'),
    ('DEC001','75eb5222-852c-4513-b17a-25b72aa45a40'::uuid,'Poké bowl'),
    ('DEC001','bce7f8de-b9e2-4fed-9cfa-895733fed44a'::uuid,'Salatbar'),

    ('DEC002','3c9df225-503d-4fbb-8041-798ed668999a'::uuid,'Dune: Part Two'),
    ('DEC002','529fb3c7-77a5-468b-a09f-45baf8921d3a'::uuid,'Interstellar'),
    ('DEC002','75eb5222-852c-4513-b17a-25b72aa45a40'::uuid,'The Dark Knight'),
    ('DEC002','bce7f8de-b9e2-4fed-9cfa-895733fed44a'::uuid,'Inception'),

    ('DEC003','3c9df225-503d-4fbb-8041-798ed668999a'::uuid,'Codenames'),
    ('DEC003','529fb3c7-77a5-468b-a09f-45baf8921d3a'::uuid,'Mario Kart'),
    ('DEC003','75eb5222-852c-4513-b17a-25b72aa45a40'::uuid,'Uno'),
    ('DEC003','bce7f8de-b9e2-4fed-9cfa-895733fed44a'::uuid,'Wii Sports')

    -- (resten kan du beholde som før)
  ) as t(room_code, user_id, content)
)
insert into proposals (room_id, participant_id, content)
select
  r.id,
  p.id,
  ps.content
from proposal_seed ps
join rooms r on r.code = ps.room_code
join participants p
  on p.room_id = r.id
 and p.user_id = ps.user_id
where not exists (
  select 1
  from proposals existing
  where existing.room_id = r.id
    and existing.participant_id = p.id
    and existing.content = ps.content
);


-- WINNERS
with winner_seed as (
  select * from (values
    ('DEC004','Notion'),
    ('DEC005','Berlin'),
    ('DEC007','AirPods'),
    ('DEC008','The Weeknd'),
    ('DEC010','Mad & Kaffe')
  ) as t(room_code, content)
)
update rooms r
set
  winner_proposal_id = p.id,
  status = 'results',
  updated_at = now()
from winner_seed ws
join proposals p
  on p.content = ws.content
join rooms rr
  on rr.id = p.room_id
where r.id = rr.id
and rr.code = ws.room_code;


-- VOTES
insert into votes (proposal_id, participant_id, vote_type)
select
  r.winner_proposal_id,
  p.id,
  'yes'
from rooms r
join participants p on p.room_id = r.id
where r.code like 'DEC0%'
and r.winner_proposal_id is not null
and not exists (
  select 1
  from votes v
  where v.proposal_id = r.winner_proposal_id
    and v.participant_id = p.id
);

commit;
