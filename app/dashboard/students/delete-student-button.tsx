'use client'
import { deleteStudent } from './actions'

export default function DeleteStudentButton({id,name}:{id:string;name:string}){
 return <form action={deleteStudent} onSubmit={e=>{if(!window.confirm(`Delete ${name}? This permanently removes the student's ERP records, including results, attendance, fees, transport links and parent link. This cannot be undone.`))e.preventDefault()}}>
  <input type="hidden" name="student_id" value={id}/>
  <button type="submit" style={{border:0,borderRadius:8,padding:'7px 10px',background:'#8b1e2d',color:'#fff',fontWeight:800,cursor:'pointer'}}>Delete</button>
 </form>
}
