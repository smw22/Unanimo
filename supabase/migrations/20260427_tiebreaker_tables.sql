create table public.tiebreakers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','countdown','armed','finished','aborted')),
  green_at timestamptz,                 -- when screen turns red (server time, source of truth)
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  winner_participant_id uuid references public.participants(id),
  winner_proposal_id uuid references public.proposals(id)
);

create table public.tiebreaker_participants (
  tiebreaker_id uuid not null references public.tiebreakers(id) on delete cascade,
  participant_id uuid not null references public.participants(id),
  proposal_id uuid not null references public.proposals(id),
  primary key (tiebreaker_id, participant_id)
);

create table public.tiebreaker_attempts (
  id uuid primary key default gen_random_uuid(),
  tiebreaker_id uuid not null references public.tiebreakers(id) on delete cascade,
  participant_id uuid not null references public.participants(id),
  proposal_id uuid not null references public.proposals(id),
  reaction_ms integer,                  -- null when false_start
  false_start boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tiebreaker_id, participant_id)
);

-- Enable realtime on all three tables
alter publication supabase_realtime add table public.tiebreakers;
alter publication supabase_realtime add table public.tiebreaker_participants;
alter publication supabase_realtime add table public.tiebreaker_attempts;