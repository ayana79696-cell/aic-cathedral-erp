with ay as (select id from public.academic_years where year=2026 order by is_current desc, year desc limit 1)
insert into public.terms (academic_year_id,name,start_date,end_date,status,is_current)
select ay.id,v.name,null,null,'active',v.is_current
from ay cross join (values ('Term One',false),('Term Two',true),('Term Three',false)) as v(name,is_current)
where not exists (select 1 from public.terms t where t.academic_year_id=ay.id and t.name=v.name);
