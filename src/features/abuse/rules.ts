export const ANONYMOUS_BUCKET_COUNT = 4096

const RATE_LIMIT_ACTIONS = [
  'auth_signin',
  'auth_signup',
  'auth_password_recovery',
  'auth_email_verification',
  'auth_email_verification_resend',
  'auth_password_reset',
  'listing_publish',
  'listing_renew',
  'listing_update',
  'listing_status_change',
  'contact_reveal',
  'report_submit',
] as const

export type RateLimitAction = (typeof RATE_LIMIT_ACTIONS)[number]

export type RateLimitPolicy = {
  limit: number
  windowMs: number
  anonymousGlobalLimit: number
}

const minute = 60_000
const hour = 60 * minute

const policies: Record<RateLimitAction, RateLimitPolicy> = {
  auth_signin: {
    limit: 10,
    windowMs: 15 * minute,
    anonymousGlobalLimit: 2_000,
  },
  auth_signup: { limit: 5, windowMs: hour, anonymousGlobalLimit: 500 },
  auth_password_recovery: {
    limit: 3,
    windowMs: 15 * minute,
    anonymousGlobalLimit: 500,
  },
  auth_email_verification: {
    limit: 10,
    windowMs: 15 * minute,
    anonymousGlobalLimit: 1_000,
  },
  auth_email_verification_resend: {
    limit: 3,
    windowMs: 15 * minute,
    anonymousGlobalLimit: 1_000,
  },
  auth_password_reset: {
    limit: 10,
    windowMs: 15 * minute,
    anonymousGlobalLimit: 1_000,
  },
  listing_publish: { limit: 10, windowMs: hour, anonymousGlobalLimit: 1_000 },
  listing_renew: { limit: 10, windowMs: hour, anonymousGlobalLimit: 1_000 },
  listing_update: { limit: 30, windowMs: hour, anonymousGlobalLimit: 1_000 },
  listing_status_change: {
    limit: 30,
    windowMs: hour,
    anonymousGlobalLimit: 1_000,
  },
  contact_reveal: {
    limit: 30,
    windowMs: 10 * minute,
    anonymousGlobalLimit: 1_000,
  },
  report_submit: { limit: 10, windowMs: hour, anonymousGlobalLimit: 1_000 },
}

export function rateLimitPolicy(action: RateLimitAction): RateLimitPolicy {
  return policies[action]
}

export function rateLimitWindowStart(now: Date, windowMs: number): string {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs).toISOString()
}
