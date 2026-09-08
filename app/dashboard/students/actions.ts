'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '../../../lib/supabase/server'

export async function addStudent(formData:FormData){
 const s=await createClient()
 const text=(n:string)=>String(formData.get(n)||'').trim()
 const first=text('first_name'),last=text('last_name'),admission=text('admission_number'),classId=text('class_id'),streamId=text('stream_id')
 if(!first||!last||!admission||!classId)return
 const {data:student,error}=await s.from('students').insert({
  admission_number:admission,first_name:first,middle_name:text('middle_name')||null,last_name:last,gender:text('gender')||null,date_of_birth:text('date_of_birth')||null,
  class_id:classId,stream_id:streamId||null,previous_school:text('previous_school')||null,birth_certificate_no:text('birth_certificate_no')||null,
  nationality:text('nationality')||null,county:text('county')||null,address:text('address')||null,blood_group:text('blood_group')||null,allergies:text('allergies')||null,
  medical_conditions:text('medical_conditions')||null,disability_special_needs:text('disability_special_needs')||null,medication_notes:text('medication_notes')||null,
  emergency_contact_name:text('emergency_contact_name')||null,emergency_contact_phone:text('emergency_contact_phone')||null,emergency_contact_relationship:text('emergency_contact_relationship')||null
 }).select('id').single()
 if(error||!student)throw new Error(error?.message||'Could not create student')
 const parent1={name:text('parent_name'),phone:text('parent_phone'),email:text('parent_email')||null,occupation:text('parent_occupation')||null,national_id:text('parent_id_number')||null,status:'active'}
 if(parent1.name&&parent1.phone){const {data:p1,error:e1}=await s.from('parents').insert(parent1).select('id').single();if(e1)throw new Error(e1.message);await s.from('student_parents').insert({student_id:student.id,parent_id:p1.id,relationship:text('parent_relationship')||'Parent',primary_guardian:true})}
 const p2name=text('parent2_name'),p2phone=text('parent2_phone')
 if(p2name&&p2phone){const {data:p2,error:e2}=await s.from('parents').insert({name:p2name,phone:p2phone,email:text('parent2_email')||null,occupation:text('parent2_occupation')||null,status:'active'}).select('id').single();if(e2)throw new Error(e2.message);await s.from('student_parents').insert({student_id:student.id,parent_id:p2.id,relationship:text('parent2_relationship')||'Parent',primary_guardian:false})}
 revalidatePath('/dashboard/students')
}
