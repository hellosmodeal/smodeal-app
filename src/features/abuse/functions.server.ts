import { adminClient, loadCurrentUser } from '@/features/auth/session.server'
import { getServerEnv } from '@/server/env.server'
import {
  anonymousBucket,
  consumeRateLimit,
  RateLimitError,
  RateLimitUnavailableError,
} from './abuse.server'
import type { RateLimitAction } from './rules'
import { rateLimitPolicy } from './rules'

function secret(): string {
  return getServerEnv().APPWRITE_API_KEY
}

function applyError(error: unknown): never {
  let status: number
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  })
  if (error instanceof RateLimitError) {
    status = 429
    headers.set('Retry-After', String(error.retryAfterSeconds))
  } else if (error instanceof RateLimitUnavailableError) {
    status = 503
  } else {
    throw error
  }
  throw new Response(JSON.stringify({ ok: false, message: error.message }), {
    status,
    headers,
  })
}

async function consume(
  action: RateLimitAction,
  subject: string,
  limit?: number,
): Promise<void> {
  try {
    await consumeRateLimit({
      db: adminClient().tablesDB,
      databaseId: getServerEnv().APPWRITE_DATABASE_ID,
      action,
      subject,
      secret: secret(),
      now: new Date(),
      limit,
    })
  } catch (error) {
    applyError(error)
  }
}

export async function limitMemberAction(
  action: RateLimitAction,
  userId: string,
): Promise<void> {
  await consume(action, `member:${userId}`)
}

export async function limitCurrentMemberAction(
  action: RateLimitAction,
): Promise<void> {
  const user = await loadCurrentUser()
  if (!user) return
  await limitMemberAction(action, user.$id)
}

export async function limitAnonymousAction(
  action: RateLimitAction,
  input: string,
): Promise<void> {
  await consumeAnonymousSubjects(action, input, secret(), (subject, limit) =>
    consume(action, subject, limit),
  )
}

export async function consumeAnonymousSubjects(
  action: RateLimitAction,
  input: string,
  hmacSecret: string,
  consumeSubject: (subject: string, limit?: number) => Promise<void>,
): Promise<void> {
  await consumeSubject(anonymousBucket(hmacSecret, input.trim().toLowerCase()))
  await consumeSubject(
    'anonymous:global',
    rateLimitPolicy(action).anonymousGlobalLimit,
  )
}

export function requestTokenSubject(userId: string): string {
  return userId
}
