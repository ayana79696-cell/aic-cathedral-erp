alter table public.payroll_records add column if not exists payroll_year integer;
update public.payroll_records set payroll_year=extract(year from payroll_month)::integer where payroll_year is null and payroll_month is not null;
alter table public.payroll_records alter column payroll_year set default extract(year from current_date)::integer;
