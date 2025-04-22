import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const redirectTo = typeof window !== 'undefined' && window.location.origin 
  ? window.location.origin
  : process.env.NEXT_PUBLIC_SITE_URL || 'https://smart-notes-two.vercel.app'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Update your OAuth sign-in function to include the correct redirectTo
export const signInWithGoogle = async () => {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo
    }
  })
}