alter table public.student_leave_requests
  add column if not exists approver_signature text,
  add column if not exists approver_name text;

alter table public.student_suspension_requests
  add column if not exists approver_signature text,
  add column if not exists approver_name text;
