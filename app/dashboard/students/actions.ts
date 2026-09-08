'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '../../../lib/supabase/server'

export async function addStudent(formData:FormData){
 const s=await createClient()
 const text=(n:string)=>String(formData.get(n)||'').trim()
 const normalizePhone=(value:string)=>value.replace(/\D/g,'')
 const first=text('first_name'),last=text('last_name'),admission=text('admission_number'),classId=text('class_id'),streamName=text('stream_name')
 if(!first||!last||!admission||!classId)throw new Error('Please complete the required student fields.')
 let streamId:string|null=null
 if(streamName){
  const {data:stream,error:streamError}=await s.from('streams').select('id').eq('class_id',classId).eq('name',streamName).eq('status','active').maybeSingle()
  if(streamError)throw new Error(streamError.message)
  if(!stream)throw new Error(`Stream ${streamName} is not configured for this Grade / Class.`)
  streamId=stream.id
 }
 const {data:student,error}=await s.from('students').insert({
  admission_number:admission,first_name:first,middle_name:text('middle_name')||null,last_name:last,gender:text('gender')||null,date_of_birth:text('date_of_birth')||null,
  class_id:classId,stream_id:streamId,previous_school:text('previous_school')||null,birth_certificate_no:text('birth_certificate_no')||null,
  nationality:text('nationality')||null,county:text('county')||null,address:text('address')||null,blood_group:text('blood_group')||null,
  medical_conditions:text('medical_conditions')||null,
  emergency_contact_name:text('emergency_contact_name')||null,emergency_contact_phone:text('emergency_contact_phone')||null,emergency_contact_relationship:text('emergency_contact_relationship')||null
 }).select('id,portal_code').single()
 if(error||!student)throw new Error(error?.message||'Could not create student')

 async function getOrCreateParent(data:{name:string;phone:string;email:string|null;occupation:string|null;national_id?:string|null}){
  const normalized=normalizePhone(data.phone)
  const {data:existingParents,error:lookupError}=await s.from('parents').select('id,phone').eq('status','active').limit(5000)
  if(lookupError)throw new Error(lookupError.message)
  const existing=existingParents?.find(p=>normalizePhone(p.phone||'')===normalized)
  if(existing)return existing.id
  const {data:created,error:createError}=await s.from('parents').insert({...data,phone:data.phone,status:'active'}).select('id').single()
  if(createError||!created)throw new Error(createError?.message||'Could not create parent record')
  return created.id
 }

 const parent1={name:text('parent_name'),phone:text('parent_phone'),email:text('parent_email')||null,occupation:text('parent_occupation')||null,national_id:text('parent_id_number')||null}
 if(parent1.name&&parent1.phone){const p1=await getOrCreateParent(parent1);const {error:e1}=await s.from('student_parents').insert({student_id:student.id,parent_id:p1,relationship:text('parent_relationship')||'Parent',primary_guardian:true});if(e1)throw new Error(e1.message)}
 const p2name=text('parent2_name'),p2phone=text('parent2_phone')
 if(p2name&&p2phone){const p2=await getOrCreateParent({name:p2name,phone:p2phone,email:text('parent2_email')||null,occupation:text('parent2_occupation')||null});const {error:e2}=await s.from('student_parents').insert({student_id:student.id,parent_id:p2,relationship:text('parent2_relationship')||'Parent',primary_guardian:false});if(e2)throw new Error(e2.message)}
 revalidatePath('/dashboard/students')
}

export async function deleteStudent(formData:FormData){
 const s=await createClient()
 const studentId=String(formData.get('student_id')||'').trim()
 if(!studentId)throw new Error('Student ID is required.')
 const {error}=await s.rpc('delete_student',{p_student_id:studentId})
 if(error)throw new Error(error.message)
 revalidatePath('/dashboard/students')
}
