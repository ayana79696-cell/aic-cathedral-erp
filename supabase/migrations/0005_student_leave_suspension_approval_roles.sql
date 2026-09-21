create table if not exists public.student_approval_roles (
  id uuid primary key default gen_random_uuid(),
  request_type text not null check (request_type in ('leave','suspension')),
  role public.user_role not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique(request_type, role)
);

create table if not exists public.student_leave_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  leave_type text not null default 'other',
  start_date date not null,
  end_date date not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  requested_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  decision_note text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists public.student_suspension_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  suspension_type text not null default 'disciplinary' check (suspension_type in ('disciplinary','temporary','other')),
  start_date date not null,
  end_date date not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  requested_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  decision_note text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists student_leave_student_date_idx on public.student_leave_requests(student_id,start_date,end_date);
create index if not exists student_leave_status_idx on public.student_leave_requests(status,created_at desc);
create index if not exists student_suspension_student_date_idx on public.student_suspension_requests(student_id,start_date,end_date);
create index if not exists student_suspension_status_idx on public.student_suspension_requests(status,created_at desc);

insert into public.student_approval_roles(request_type,role,enabled)
values ('leave','super_admin',true),('leave','admin',true),('suspension','super_admin',true),('suspension','admin',true)
on conflict (request_type,role) do nothing;

alter table public.student_approval_roles enable row level security;
alter table public.student_leave_requests enable row level security;
alter table public.student_suspension_requests enable row level security;

grant select,insert,update,delete on public.student_approval_roles to authenticated;
grant select,insert,update on public.student_leave_requests to authenticated;
grant select,insert,update on public.student_suspension_requests to authenticated;

drop policy if exists student_approval_roles_select on public.student_approval_roles;
drop policy if exists student_approval_roles_write on public.student_approval_roles;
drop policy if exists student_leave_select on public.student_leave_requests;
drop policy if exists student_leave_insert on public.student_leave_requests;
drop policy if exists student_leave_update on public.student_leave_requests;
drop policy if exists student_suspension_select on public.student_suspension_requests;
drop policy if exists student_suspension_insert on public.student_suspension_requests;
drop policy if exists student_suspension_update on public.student_suspension_requests;

create policy student_approval_roles_select on public.student_approval_roles for select to authenticated using (true);
create policy student_approval_roles_write on public.student_approval_roles for all to authenticated
using (public.current_role() = 'super_admin'::public.user_role)
with check (public.current_role() = 'super_admin'::public.user_role);

create policy student_leave_select on public.student_leave_requests for select to authenticated using (
 requested_by=(select auth.uid()) or public.current_role()=any(array['super_admin','admin']::public.user_role[])
 or exists(select 1 from public.student_approval_roles ar where ar.request_type='leave' and ar.enabled and ar.role=public.current_role())
);
create policy student_leave_insert on public.student_leave_requests for insert to authenticated with check (
 requested_by=(select auth.uid()) and public.current_role()=any(array['super_admin','admin','headteacher','deputy_headteacher','class_teacher','subject_teacher']::public.user_role[])
);
create policy student_leave_update on public.student_leave_requests for update to authenticated using (
 public.current_role()='super_admin'::public.user_role or
 exists(select 1 from public.student_approval_roles ar where ar.request_type='leave' and ar.enabled and ar.role=public.current_role()) or
 requested_by=(select auth.uid())
) with check (
 public.current_role()='super_admin'::public.user_role or
 exists(select 1 from public.student_approval_roles ar where ar.request_type='leave' and ar.enabled and ar.role=public.current_role()) or
 requested_by=(select auth.uid())
);

create policy student_suspension_select on public.student_suspension_requests for select to authenticated using (
 requested_by=(select auth.uid()) or public.current_role()=any(array['super_admin','admin']::public.user_role[])
 or exists(select 1 from public.student_approval_roles ar where ar.request_type='suspension' and ar.enabled and ar.role=public.current_role())
);
create policy student_suspension_insert on public.student_suspension_requests for insert to authenticated with check (
 requested_by=(select auth.uid()) and public.current_role()=any(array['super_admin','admin','headteacher','deputy_headteacher','class_teacher']::public.user_role[])
);
create policy student_suspension_update on public.student_suspension_requests for update to authenticated using (
 public.current_role()='super_admin'::public.user_role or
 exists(select 1 from public.student_approval_roles ar where ar.request_type='suspension' and ar.enabled and ar.role=public.current_role()) or
 requested_by=(select auth.uid())
) with check (
 public.current_role()='super_admin'::public.user_role or
 exists(select 1 from public.student_approval_roles ar where ar.request_type='suspension' and ar.enabled and ar.role=public.current_role()) or
 requested_by=(select auth.uid())
);

create or replace function public.touch_student_status_request_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end;
$$;

drop trigger if exists student_leave_updated_at on public.student_leave_requests;
drop trigger if exists student_suspension_updated_at on public.student_suspension_requests;

create trigger student_leave_updated_at before update on public.student_leave_requests
for each row execute function public.touch_student_status_request_updated_at();

create trigger student_suspension_updated_at before update on public.student_suspension_requests
for each row execute function public.touch_student_status_request_updated_at();
