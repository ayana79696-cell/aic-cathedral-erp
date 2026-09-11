-- Student transport fields, automatic finance account creation, and payment synchronization.
alter table public.students add column if not exists uses_bus boolean not null default false;
alter table public.students add column if not exists bus_route text;
alter table public.students add column if not exists bus_pickup_point text;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.ensure_student_fee_account() returns trigger
language plpgsql security definer set search_path=public,private as $$
declare ay uuid; term uuid;
begin
  select id into ay from public.academic_years where status='active' order by year desc limit 1;
  select id into term from public.terms where status='active' and (ay is null or academic_year_id=ay) order by start_date desc nulls last limit 1;
  insert into public.fee_accounts(student_id,academic_year_id,term_id,amount_due,amount_paid,status)
  values(new.id,ay,term,0,0,'unpaid') on conflict do nothing;
  return new;
end; $$;
revoke all on function private.ensure_student_fee_account() from public,anon,authenticated;
drop trigger if exists trg_students_finance_account on public.students;
create trigger trg_students_finance_account after insert on public.students for each row execute function private.ensure_student_fee_account();

create or replace function private.sync_fee_account_paid() returns trigger
language plpgsql security definer set search_path=public,private as $$
declare sid uuid; old_sid uuid;
begin
  sid:=new.student_id; old_sid:=old.student_id;
  if tg_op='DELETE' then sid:=old.student_id; end if;
  if tg_op='UPDATE' and old_sid is distinct from sid then
    update public.fee_accounts fa set amount_paid=(select coalesce(sum(fp.amount),0) from public.fee_payments fp where fp.fee_account_id=fa.id) where fa.student_id=old_sid;
  end if;
  update public.fee_accounts fa set
    amount_paid=(select coalesce(sum(fp.amount),0) from public.fee_payments fp where fp.fee_account_id=fa.id),
    status=case when fa.amount_due<=0 and (select coalesce(sum(fp.amount),0) from public.fee_payments fp where fp.fee_account_id=fa.id)=0 then 'unpaid'
      when fa.amount_due>0 and (select coalesce(sum(fp.amount),0) from public.fee_payments fp where fp.fee_account_id=fa.id)>=fa.amount_due then 'paid' else 'partial' end
    where fa.student_id=sid;
  return coalesce(new,old);
end; $$;
revoke all on function private.sync_fee_account_paid() from public,anon,authenticated;
drop trigger if exists trg_sync_fee_account_paid on public.fee_payments;
create trigger trg_sync_fee_account_paid after insert or update or delete on public.fee_payments for each row execute function private.sync_fee_account_paid();

update public.fee_payments fp set fee_account_id=(select fa.id from public.fee_accounts fa where fa.student_id=fp.student_id order by fa.created_at desc limit 1) where fp.fee_account_id is null;
update public.fee_accounts fa set amount_paid=(select coalesce(sum(fp.amount),0) from public.fee_payments fp where fp.fee_account_id=fa.id), status=case when fa.amount_due<=0 and (select coalesce(sum(fp.amount),0) from public.fee_payments fp where fp.fee_account_id=fa.id)=0 then 'unpaid' when fa.amount_due>0 and (select coalesce(sum(fp.amount),0) from public.fee_payments fp where fp.fee_account_id=fa.id)>=fa.amount_due then 'paid' else 'partial' end;
