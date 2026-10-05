-- Run this script in Supabase Dashboard > SQL Editor.
-- A single shared row stores the team's workboard. Authenticated users can read and update it.
create table if not exists public.workboard_state (
  id text primary key check (id = 'shared'),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.workboard_state enable row level security;

drop policy if exists "Authenticated users can read shared workboard" on public.workboard_state;
create policy "Authenticated users can read shared workboard"
  on public.workboard_state for select to authenticated using (true);

drop policy if exists "Authenticated users can create shared workboard" on public.workboard_state;
create policy "Authenticated users can create shared workboard"
  on public.workboard_state for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update shared workboard" on public.workboard_state;
create policy "Authenticated users can update shared workboard"
  on public.workboard_state for update to authenticated using (true) with check (true);

grant select, insert, update on public.workboard_state to authenticated;

-- Enable Realtime for the shared row (safe to run more than once).
do $$
begin
  alter publication supabase_realtime add table public.workboard_state;
exception when duplicate_object then null;
end $$;
