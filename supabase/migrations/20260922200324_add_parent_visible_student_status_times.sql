alter table public.student_leave_requests
  add column if not exists start_time time without time zone,
  add column if not exists end_time time without time zone;

alter table public.student_suspension_requests
  add column if not exists start_time time without time zone,
  add column if not exists end_time time without time zone;

create index if not exists student_leave_requests_student_status_dates_idx
  on public.student_leave_requests(student_id, status, start_date, end_date);

create index if not exists student_suspension_requests_student_status_dates_idx
  on public.student_suspension_requests(student_id, status, start_date, end_date);

-- The parent portal dashboard RPC is extended in production to return
-- only APPROVED leave/suspension records linked to the authenticated
-- parent session, including optional start/end times.
