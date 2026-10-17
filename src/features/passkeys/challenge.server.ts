import { createHmac, timingSafeEqual } from 'node:crypto'
import {
  PASSKEY_CHALLENGE_TTL_SECONDS,
  type PasskeyChallenge,
  type PasskeyChallengePurpose,
} from './rules'

function signature(secret: string, payload: string): string {
  const key = createHmac('sha256', secret).update('passkey-challenge').digest()
  return createHmac('sha256', key).update(payload).digest('base64url')
}

export function sealPasskeyChallenge(
  secret: string,
  value: Omit<PasskeyChallenge, 'expiresAt'>,
  now: Date,
): string {
  const expiresAt = now.getTime() + PASSKEY_CHALLENGE_TTL_SECONDS * 1000
  const payload = Buffer.from(JSON.stringify({ ...value, expiresAt })).toString(
    'base64url',
  )
  return `${payload}.${signature(secret, payload)}`
}

export function openPasskeyChallenge(
  secret: string,
  sealed: string | undefined,
  purpose: PasskeyChallengePurpose,
  now: Date,
): PasskeyChallenge | null {
  if (!sealed) return null
  const [payload, received, extra] = sealed.split('.')
  if (!payload || !received || extra !== undefined) return null
  const expected = Buffer.from(signature(secret, payload))
  const given = Buffer.from(received)
  if (expected.length !== given.length || !timingSafeEqual(expected, given))
    return null
  try {
    const value: unknown = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    )
    if (!isChallenge(value)) return null
    if (value.purpose !== purpose || value.expiresAt <= now.getTime())
      return null
    return value
  } catch {
    return null
  }
}

function isChallenge(value: unknown): value is PasskeyChallenge {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    (record.purpose === 'register' || record.purpose === 'signin') &&
    typeof record.challenge === 'string' &&
    typeof record.userId === 'string' &&
    typeof record.expiresAt === 'number'
  )
}
