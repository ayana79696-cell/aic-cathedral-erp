-- Saved electronic signatures for staff and report-card signing.
create table if not exists public.staff_signatures (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  signature text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staff_id),
  unique (profile_id)
);

create index if not exists staff_signatures_profile_idx on public.staff_signatures(profile_id);
create index if not exists staff_signatures_staff_idx on public.staff_signatures(staff_id);

alter table public.staff_signatures enable row level security;

drop policy if exists "staff signatures select authenticated" on public.staff_signatures;
create policy "staff signatures select authenticated" on public.staff_signatures for select to authenticated using (true);

drop policy if exists "staff signatures insert own" on public.staff_signatures;
create policy "staff signatures insert own" on public.staff_signatures for insert to authenticated with check (profile_id = auth.uid());

drop policy if exists "staff signatures update own" on public.staff_signatures;
create policy "staff signatures update own" on public.staff_signatures for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create or replace function public.touch_staff_signatures_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists staff_signatures_updated_at on public.staff_signatures;
create trigger staff_signatures_updated_at before update on public.staff_signatures
for each row execute function public.touch_staff_signatures_updated_at();

grant select, insert, update on public.staff_signatures to authenticated;
