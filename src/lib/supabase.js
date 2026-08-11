import { createClient } from '@supabase/supabase-js'

// Publishable keys are designed for browser use; every data operation is protected by RLS.
export const supabase = createClient(
  'https://bxbzzfxsxxuccailnkxf.supabase.co',
  'sb_publishable_lWQU_awvFFN6gIzoLn5TAw_lUjyLnnr',
  { auth: { persistSession: true, autoRefreshToken: true } },
)

export async function ensureVisitorSession() {
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session
  const { data: anonymous, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return anonymous.session
}
