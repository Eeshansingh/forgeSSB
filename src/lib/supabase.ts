import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  id: string
  email: string
  name: string
  avatar_url: string
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getTestAttempts(userId?: string, anonymousId?: string) {
  if (userId) {
    const { data } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('user_id', userId)
    return data?.length ?? 0
  }
  if (anonymousId) {
    const { data } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('anonymous_id', anonymousId)
    return data?.length ?? 0
  }
  return 0
}

export async function recordTestAttempt(userId?: string, anonymousId?: string, testType: string = 'full') {
  await supabase.from('test_attempts').insert({
    user_id: userId || null,
    anonymous_id: anonymousId || null,
    test_type: testType
  })
}
