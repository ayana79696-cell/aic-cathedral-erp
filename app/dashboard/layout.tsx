import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'

const items=[['/dashboard','Dashboard'],['/dashboard/students','Students'],['/dashboard/academic','Academic Setup'],['/dashboard/exams','Exams & CBC'],['/dashboard/results','Results'],['/dashboard/attendance','Attendance'],['/dashboard/finance','Finance & Fees'],['/dashboard/staff','Staff & Teachers'],['/dashboard/inventory','Inventory'],['/dashboard/transport','Transport'],['/dashboard/reports','Reports'],['/dashboard/users','User Management']]
export default async function Layout({children}:{children:React.ReactNode}){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser()
 return <div className="dashboard"><aside className="sidebar"><div className="brand"><div className="logo">AIC</div><span className="label"><strong>AIC Cathedral</strong><br/><small>ERP</small></span></div>{items.map(([href,label])=><Link className="side-item" href={href} key={href}>• <span className="label">{label}</span></Link>)}<div style={{marginTop:'auto',padding:16}} className="muted">{user?.email}</div></aside><main style={{width:'100%'}}>{children}</main></div>
}