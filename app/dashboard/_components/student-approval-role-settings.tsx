'use client'

import {useEffect,useState} from 'react'
import {createClient} from '../../lib/supabase/client'

const roles=[
 ['super_admin','Super Admin'],['admin','Admin'],['headteacher','Head Teacher'],['deputy_headteacher','Deputy Head Teacher'],
 ['academic','Academic'],['class_teacher','Class Teacher'],['subject_teacher','Subject Teacher'],
 ['hr_admin','HR Admin'],['hr','HR / Staff'],['operations','Operations'],['finance','Finance'],['bursar','Bursar'],['accountant','Accountant']
]
export default function StudentApprovalRoleSettings(){
 const db=createClient();const[rows,setRows]=useState<any[]>([]);const[msg,setMsg]=useState('');const[saving,setSaving]=useState(false)
 const load=async()=>{const{data,error}=await db.from('student_approval_roles').select('id,request_type,role,enabled').order('request_type').order('role');if(error)setMsg(error.message);else setRows(data||[])}
 useEffect(()=>{load()},[])
 const has=(kind:string,role:string)=>rows.some(x=>x.request_type===kind&&x.role===role&&x.enabled)
 const toggle=async(kind:string,role:string)=>{
  setSaving(true);setMsg('');const row=rows.find(x=>x.request_type===kind&&x.role===role);const enabled=!has(kind,role)
  const res=row?await db.from('student_approval_roles').update({enabled}).eq('id',row.id):await db.from('student_approval_roles').insert({request_type:kind,role,enabled:true})
  setSaving(false);if(res.error)setMsg(res.error.message);else await load()
 }
 return <section className="card" style={{marginTop:16}}><h2>Student Leave & Suspension Approval Roles</h2><p className="muted">Super Admin chooses which ERP roles may approve each student request. If several roles are enabled, any enabled role can approve.</p><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={{textAlign:'left',padding:10}}>Role</th><th style={{padding:10}}>Student Leave</th><th style={{padding:10}}>Student Suspension</th></tr></thead><tbody>{roles.map(([r,label])=><tr key={r}><td style={{padding:10}}><strong>{label}</strong></td><td style={{textAlign:'center',padding:10}}><button className={has('leave',r)?'btn':'btn secondary'} disabled={saving||r==='super_admin'} onClick={()=>toggle('leave',r)}>{has('leave',r)?'✓ Approver':'Set as approver'}</button></td><td style={{textAlign:'center',padding:10}}><button className={has('suspension',r)?'btn':'btn secondary'} disabled={saving||r==='super_admin'} onClick={()=>toggle('suspension',r)}>{has('suspension',r)?'✓ Approver':'Set as approver'}</button></td></tr>)}</tbody></table></div>{msg&&<p className="muted">{msg}</p>}</section>
}
