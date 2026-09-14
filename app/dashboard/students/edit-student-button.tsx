'use client'
import{useState}from'react'
import{updateStudent}from'./actions'
type Route={id:string;route_name:string;vehicle_no?:string|null;pickup_points?:string|null}
export default function EditStudentButton({student,classes,streams,routes}:{student:any;classes:any[];streams:any[];routes:Route[]}){
 const[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const initialRoute=routes.find(r=>r.id===student.bus_route||r.route_name===student.bus_route)
 const[f,setF]=useState<any>({...student,uses_bus:Boolean(student.uses_bus),bus_route:initialRoute?.route_name||student.bus_route||'',bus_route_id:initialRoute?.id||''})
 const set=(k:string,v:any)=>setF((x:any)=>({...x,[k]:v}))
 const cls=streams.filter(x=>x.class_id===f.class_id)
 const selectedRoute=routes.find(r=>r.id===f.bus_route_id||r.route_name===f.bus_route)
 const save=async(e:any)=>{e.preventDefault();setBusy(true);setError('');try{const fd=new FormData();Object.entries(f).forEach(([k,v])=>{if(k!=='id'&&k!=='stream_id'&&k!=='bus_route_id'&&v!==undefined&&v!==null)fd.set(k,String(v))});const selected=streams.find(x=>x.id===f.stream_id);fd.set('stream_name',selected?.name||'');fd.set('student_id',student.id);fd.set('uses_bus',String(Boolean(f.uses_bus)));if(f.uses_bus&&selectedRoute){fd.set('bus_route_id',selectedRoute.id);fd.set('bus_route',selectedRoute.route_name);fd.set('bus_pickup_point',String(f.bus_pickup_point||''))}else{fd.set('bus_route_id','');fd.set('bus_route','');fd.set('bus_pickup_point','')}await updateStudent(fd);setOpen(false);window.location.reload()}catch(x:any){setError(x?.message||'Could not update learner.')}finally{setBusy(false)}}
 return <>
  <button type="button" className="btn" onClick={()=>{setError('');setOpen(true)}}>Edit</button>
  {open&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:50,overflow:'auto',padding:24}}>
   <form onSubmit={save} className="prototype-panel" style={{maxWidth:900,margin:'30px auto',padding:20}}>
    <div className="prototype-panel-head"><h2>Edit learner information</h2><button type="button" onClick={()=>setOpen(false)}>Close</button></div>
    {error&&<div className="prototype-note">{error}</div>}
    <div className="prototype-form-grid">
     {[['admission_number','Admission No.'],['first_name','First name'],['middle_name','Middle name'],['last_name','Last name'],['previous_school','Previous school'],['birth_certificate_no','Birth certificate No.'],['nationality','Nationality'],['religion','Religion'],['county','County'],['address','Home address'],['medical_conditions','Medical information / special needs'],['disability_special_needs','Disability / special needs'],['medication_notes','Medication notes'],['allergies','Allergies'],['emergency_contact_name','Emergency contact name'],['emergency_contact_phone','Emergency contact phone'],['emergency_contact_relationship','Emergency relationship']].map(([k,l])=><div key={k}><label>{l}</label><input value={f[k]??''} onChange={e=>set(k,e.target.value)}/></div>)}
     <div><label>Gender</label><select value={f.gender??''} onChange={e=>set('gender',e.target.value)}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
     <div><label>Date of birth</label><input type="date" value={f.date_of_birth??''} onChange={e=>set('date_of_birth',e.target.value)}/></div>
     <div><label>Grade / Class</label><select value={f.class_id??''} onChange={e=>{set('class_id',e.target.value);set('stream_id','')}}><option value="">Select</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
     <div><label>Stream</label><select value={f.stream_id??''} onChange={e=>set('stream_id',e.target.value)}><option value="">Select</option>{cls.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
     <div><label>Blood group</label><select value={f.blood_group??''} onChange={e=>set('blood_group',e.target.value)}><option value="">Select</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(x=><option key={x} value={x}>{x}</option>)}</select></div>
     <div><label>Status</label><select value={f.status??'active'} onChange={e=>set('status',e.target.value)}><option value="active">active</option><option value="inactive">inactive</option><option value="archived">archived</option></select></div>
     <div style={{gridColumn:'1/-1'}}><label><input type="checkbox" checked={Boolean(f.uses_bus)} onChange={e=>set('uses_bus',e.target.checked)}/> Learner uses school bus</label></div>
     {f.uses_bus&&<>
      <div><label>Bus route</label><select value={f.bus_route_id||selectedRoute?.id||''} onChange={e=>{const r=routes.find(x=>x.id===e.target.value);set('bus_route_id',e.target.value);set('bus_route',r?.route_name||'');set('bus_pickup_point',r?.pickup_points||'')}}><option value="">Select saved route</option>{routes.map(r=><option key={r.id} value={r.id}>{r.route_name}{r.vehicle_no?` — ${r.vehicle_no}`:''}</option>)}</select>{selectedRoute?.pickup_points&&<small className="muted">Pickup points: {selectedRoute.pickup_points}</small>}</div>
      <div><label>Pickup / drop-off point</label><input value={f.bus_pickup_point??''} onChange={e=>set('bus_pickup_point',e.target.value)} placeholder="Select a route first, then adjust if needed"/></div>
     </>}
    </div>
    <div style={{display:'flex',gap:10,marginTop:18}}><button type="submit" className="btn" disabled={busy}>{busy?'Saving…':'Save changes'}</button><button type="button" onClick={()=>setOpen(false)}>Cancel</button></div>
   </form>
  </div>}
 </>
}
