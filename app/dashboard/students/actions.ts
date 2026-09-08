'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '../../../lib/supabase/server'
export async function addStudent(formData:FormData){const s=await createClient();const first=String(formData.get('first_name')||'').trim();const last=String(formData.get('last_name')||'').trim();const admission=String(formData.get('admission_number')||'').trim();if(!first||!last||!admission)return;await s.from('students').insert({first_name:first,last_name:last,admission_number:admission});revalidatePath('/dashboard/students')}
