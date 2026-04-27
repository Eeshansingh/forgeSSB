import posthog from 'posthog-js'

export const track = (event: string, properties?: Record<string, unknown>) => {
  posthog.capture(event, properties)
}

export const identifyUser = (userId: string, properties?: Record<string, unknown>) => {
  posthog.identify(userId, properties)
}

export const EVENTS = {
  TEST_STARTED: 'test_started',
  TEST_COMPLETED: 'test_completed',
  SCORE_CARD_SHARED: 'score_card_shared',
  SIGNUP_COMPLETED: 'signup_completed',
  PAYMENT_COMPLETED: 'payment_completed',
  JOURNEY_ONBOARDING_STARTED: 'journey_onboarding_started',
  JOURNEY_ONBOARDING_COMPLETED: 'journey_onboarding_completed',
  SESSION_STARTED: 'session_started',
  SESSION_COMPLETED: 'session_completed',
  SESSION_ABANDONED: 'session_abandoned',
  AB_VARIANT_SEEN: 'ab_variant_seen',
} as const
