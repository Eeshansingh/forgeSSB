import { createClient } from '@supabase/supabase-js'
import { identifyUser } from './analytics'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    identifyUser(session.user.id, { email: session.user.email })
  }
})

// "Arjun Mehta" → "Arjun M."
export function formatDisplayName(fullName: string): string {
  const parts = fullName.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

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

export async function recordTestAttempt(
  userId?: string,
  anonymousId?: string,
  testType: string = 'full',
  responses?: { word: string; response: string }[],
  analysis?: object,
  wordCount?: number,
  email?: string
) {
  const { data, error } = await supabase
    .from('test_attempts')
    .insert({
      user_id: userId || null,
      anonymous_id: anonymousId || null,
      test_type: testType,
      responses: responses || null,
      analysis: analysis || null,
      word_count: wordCount || null,
      email: email || null
    })
    .select('id')
    .single()

  if (error) throw error
  return data?.id as string | undefined
}

export async function updateTestAttempt(
  id: string,
  responses?: { word: string; response: string }[],
  analysis?: object,
  wordCount?: number,
  score?: number,
  displayName?: string
) {
  if (!id) {
    console.log('[updateTestAttempt] Missing attempt id')
    throw new Error('Missing attempt id')
  }

  const payload: Record<string, unknown> = {
    responses: responses || null,
    analysis: analysis || null,
    word_count: wordCount || null,
  }
  if (score !== undefined) payload.score = score
  if (displayName !== undefined) payload.display_name = displayName

  console.log('[updateTestAttempt] Updating attempt', { id, wordCount })

  const { data, error } = await supabase
    .from('test_attempts')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.log('[updateTestAttempt] Update failed', { id, error })
    throw error
  }

  console.log('[updateTestAttempt] Update success', { id })
  return data
}

// JOURNEY PROFILES

export async function createJourneyProfile(data: {
  user_id: string
  exam_type: 'nda' | 'cds' | 'afcat' | 'ta'
  attempt_number: number
  failure_reason?: 'psych' | 'gto' | 'interview' | 'dont_know' | 'everywhere' | null
  board_date?: string | null
}) {
  const { data: profile, error } = await supabase
    .from('journey_profiles')
    .upsert(data, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) throw error
  return profile
}

export async function getJourneyProfile(user_id: string) {
  const { data, error } = await supabase
    .from('journey_profiles')
    .select('*')
    .eq('user_id', user_id)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

// SESSIONS

export async function createSession(data: {
  user_id: string
  session_number: number
  cluster: string
  olq_focus: string
}) {
  const { data: session, error } = await supabase
    .from('sessions')
    .upsert(data, { onConflict: 'user_id,session_number' })
    .select()
    .single()
  if (error) throw error
  return session
}

export async function updateSessionStatus(
  user_id: string,
  session_number: number,
  status: 'not_started' | 'insight_complete' | 'practice_complete' | 'reflection_complete' | 'complete',
  extras?: {
    practice_scores?: Record<string, unknown>
    ai_observation?: string
    completed_at?: string
  }
) {
  const { data, error } = await supabase
    .from('sessions')
    .update({ status, ...extras })
    .eq('user_id', user_id)
    .eq('session_number', session_number)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getSession(user_id: string, session_number: number) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user_id)
    .eq('session_number', session_number)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function getAllSessions(user_id: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user_id)
    .order('session_number', { ascending: true })
  if (error) throw error
  return data ?? []
}

// WEAK FLAGGED ITEMS

export async function getWeakFlaggedItems(user_id: string, test_type: string) {
  const { data, error } = await supabase
    .from('test_attempts')
    .select('responses, cluster, difficulty_tier')
    .eq('user_id', user_id)
    .eq('test_type', test_type)
    .eq('weak_flag', true)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data ?? []
}

// REFLECTIONS

export async function saveReflection(data: {
  user_id: string
  session_number: number
  prompt: string
  response: string
  word_count: number
}) {
  const { data: reflection, error } = await supabase
    .from('reflections')
    .upsert(data, { onConflict: 'user_id,session_number' })
    .select()
    .single()
  if (error) throw error
  return reflection
}

export async function getReflections(user_id: string) {
  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .eq('user_id', user_id)
    .order('session_number', { ascending: true })
  if (error) throw error
  return data ?? []
}

// TRANSFER CHECKINS

export async function saveTransferCheckin(data: {
  user_id: string
  session_number: 14 | 21
  answers: Record<string, unknown>
  ai_feedback?: string
}) {
  const { data: checkin, error } = await supabase
    .from('transfer_checkins')
    .upsert(data, { onConflict: 'user_id,session_number' })
    .select()
    .single()
  if (error) throw error
  return checkin
}

// SSB OUTCOMES

export async function saveSSBOutcome(data: {
  user_id: string
  board_date?: string
  outcome: 'recommended' | 'not_recommended' | 'pending'
  failure_reason?: 'psych' | 'gto' | 'interview' | 'dont_know' | 'everywhere' | null
}) {
  const { data: outcome, error } = await supabase
    .from('ssb_outcomes')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return outcome
}
