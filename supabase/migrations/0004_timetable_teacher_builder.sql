alter table public.timetables
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists entry_type text not null default 'lesson',
  add column if not exists break_name text,
  add column if not exists confirmation_status text not null default 'draft',
  add column if not exists confirmed_by uuid,
  add column if not exists confirmed_at timestamptz;

create index if not exists timetables_class_day_time_idx
  on public.timetables(class_id, stream_id, day, start_time);
create index if not exists timetables_teacher_day_time_idx
  on public.timetables(teacher_id, day, start_time);
