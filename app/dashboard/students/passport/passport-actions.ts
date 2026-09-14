'use server'
import {revalidatePath} from 'next/cache'
import {createClient} from '../../../../lib/supabase/server'

export async function updatePassportSchoolLogo(url:string){
 const s=await createClient()
 const logo=String(url||'').trim()
 if(!logo) throw new Error('Please select a school logo.')
 const {error}=await s.from('school_settings').update({logo_url:logo}).not('school_name','is',null)
 if(error) throw new Error(error.message)
 revalidatePath('/dashboard/students/passport')
 revalidatePath('/dashboard/settings')
}
