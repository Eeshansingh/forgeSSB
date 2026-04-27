export const ADMIN_EMAILS = [
  's.eeshan3333@gmail.com',
  'ridhimanegiflip@gmail.com',
  'adsingh080498@gmail.com',
]

export const isAdmin = (email?: string | null): boolean => {
  return ADMIN_EMAILS.includes(email ?? '')
}

export type PlanType = 'one_time' | 'individual' | 'institute' | 'admin' | null

export const hasJourneyAccess = (
  email?: string | null,
  planType?: PlanType
): boolean => {
  if (isAdmin(email)) return true
  return planType !== null && planType !== undefined
}

export const canTakeTest = (
  email?: string | null,
  attemptCount: number = 0,
  planType?: PlanType
): boolean => {
  if (isAdmin(email)) return true
  if (planType !== null && planType !== undefined) return true
  return attemptCount < 3
}

export const ACCESS_MESSAGES = {
  NOT_LOGGED_IN: 'Sign in to access your journey.',
  UPGRADE_REQUIRED: 'Start your 30-day journey — upgrade to continue.',
  ATTEMPTS_EXHAUSTED: 'You have used your 3 free assessments. Upgrade to continue.',
} as const
