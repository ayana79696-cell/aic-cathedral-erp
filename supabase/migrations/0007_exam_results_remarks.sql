create table if not exists public.result_remarks (
 id uuid primary key default gen_random_uuid(),
 student_id uuid not null references public.students(id) on delete cascade,
 exam_id uuid not null references public.exams(id) on delete cascade,
 class_id uuid not null references public.classes(id) on delete cascade,
 stream_id uuid references public.streams(id) on delete set null,
 class_teacher_remark text,
 headteacher_remark text,
 class_teacher_id uuid references public.profiles(id),
 headteacher_id uuid references public.profiles(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(student_id, exam_id)
);
create index if not exists result_remarks_exam_class_idx on public.result_remarks(exam_id,class_id,stream_id);
