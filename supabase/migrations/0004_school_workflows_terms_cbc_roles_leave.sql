alter table public.profiles add column if not exists permissions jsonb not null default '{}'::jsonb;

alter table public.leave_requests add column if not exists request_type text not null default 'leave';
alter table public.leave_requests add column if not exists approval_role text not null default 'hr';
alter table public.leave_requests add column if not exists approved_by uuid;
alter table public.leave_requests add column if not exists decision_note text;
alter table public.leave_requests add column if not exists decided_at timestamptz;

update public.terms
set name = case
  when lower(trim(name)) in ('term 1','term one','term1') then 'Term One'
  when lower(trim(name)) in ('term 2','term two','term2') then 'Term Two'
  when lower(trim(name)) in ('term 3','term three','term3') then 'Term Three'
  else name
end;

alter table public.leave_requests drop constraint if exists leave_requests_request_type_check;
alter table public.leave_requests add constraint leave_requests_request_type_check check (request_type in ('short_leave','off','leave'));
alter table public.leave_requests drop constraint if exists leave_requests_approval_role_check;
alter table public.leave_requests add constraint leave_requests_approval_role_check check (approval_role in ('headteacher','hr'));
create index if not exists leave_requests_approval_idx on public.leave_requests(approval_role,status,created_at desc);
