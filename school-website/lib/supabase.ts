import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rmarersocrwzqhnbuygi.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_mVPoh33HbSN0Vyo5qHyWQQ_zgX38BUo'

export const supabase = createClient(supabaseUrl, supabaseKey)
