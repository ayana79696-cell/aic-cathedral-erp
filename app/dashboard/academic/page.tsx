import SimpleCrud from '../_components/simple-crud'
import {createClient} from '../../../lib/supabase/server'
export default async function Academic(){
 const s=await createClient();const{data:classes}=await s.from('classes').select('id,name,level').eq('status','active').order('name');const classOptions=(classes||[]).map(c=>({value:c.id,label:`${c.name}${c.level?` — ${c.level}`:''}`}))
 return <main className="main"><header className="top"><div><h1>Academic Setup</h1><p className="muted">Set academic years, terms, grades/classes, East/West streams and CBC learning areas.</p></div></header>
 <SimpleCrud table="academic_years" title="Academic years" fields={[{name:'year',label:'Year',type:'number',required:true},{name:'status',label:'Status',options:['active','inactive','archived']}]} order="year"/>
 <SimpleCrud table="terms" title="Terms" fields={[{name:'academic_year_id',label:'Academic year ID',required:true},{name:'name',label:'Term name',required:true},{name:'start_date',label:'Start date',type:'date'},{name:'end_date',label:'End date',type:'date'},{name:'status',label:'Status',options:['active','inactive','archived']}]} />
 <SimpleCrud table="classes" title="Grades / classes" fields={[{name:'name',label:'Grade / Class name',required:true},{name:'level',label:'Level / stage'},{name:'status',label:'Status',options:['active','inactive','archived']}]} />
 <SimpleCrud table="streams" title="Streams — East / West" fields={[{name:'class_id',label:'Grade / class',required:true,options:classOptions},{name:'name',label:'Stream name',required:true,options:['East','West','A','B','C']}]} />
 <SimpleCrud table="learning_areas" title="CBC learning areas" fields={[{name:'name',label:'Learning area',required:true},{name:'code',label:'Code'},{name:'category',label:'Category'}]} />
 </main>
}