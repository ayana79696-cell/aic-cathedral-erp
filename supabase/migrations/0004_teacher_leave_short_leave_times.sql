alter table public.leave_requests
  add column if not exists start_time time,
  add column if not exists end_time time;

comment on column public.leave_requests.start_time is 'Start time for short leave requests';
comment on column public.leave_requests.end_time is 'End time for short leave requests';

create index if not exists idx_leave_requests_staff_created
  on public.leave_requests(staff_id, created_at desc);
