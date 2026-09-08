import { createClient } from '../../lib/supabase/server'

export default async function Dashboard(){
 const supabase=await createClient()
 const [{count:students},{count:staff},{count:classes},{data:term}]=await Promise.all([
  supabase.from('students').select('*',{count:'exact',head:true}),
  supabase.from('staff').select('*',{count:'exact',head:true}),
  supabase.from('classes').select('*',{count:'exact',head:true}),
  supabase.from('terms').select('name').eq('status','active').maybeSingle()
 ])
 return <main className="main"><header className="top"><div><h1 style={{margin:0}}>Dashboard</h1><p className="muted">AIC Cathedral Primary School</p></div><div className="muted">Production system</div></header><section className="cards"><div className="card"><div className="muted">Students</div><div className="number">{students??0}</div></div><div className="card"><div className="muted">Staff</div><div className="number">{staff??0}</div></div><div className="card"><div className="muted">Classes</div><div className="number">{classes??0}</div></div><div className="card"><div className="muted">Current Term</div><div className="number" style={{fontSize:24}}>{term?.name??'Not set'}</div></div></section><section className="card" style={{marginTop:16}}><h2>School ERP</h2><p className="muted">Live figures are loaded from Supabase. Use the navigation to configure the school and manage records.</p></section></main>
}