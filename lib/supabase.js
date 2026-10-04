import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mqiytljofzdiqmndbjcm.supabase.co'
const supabaseKey = 'sb_publishable_rwJWOEQ4j_hX-7ctcZEqtg_As4KCCj_'

export const supabase = createClient(supabaseUrl, supabaseKey)
