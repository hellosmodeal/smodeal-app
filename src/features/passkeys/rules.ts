export const MAX_PASSKEYS_PER_MEMBER = 10
export const MAX_CREDENTIAL_ID_LENGTH = 256
export const PASSKEY_CHALLENGE_TTL_SECONDS = 300

export type RelyingParty = { id: string; name: string; origin: string }

export function relyingParty(
  siteUrl: string | undefined,
  requestUrl: string,
): RelyingParty {
  const url = new URL(siteUrl ?? requestUrl)
  return { id: url.hostname, name: 'Smodeal', origin: url.origin }
}

export type PasskeySummary = {
  id: string
  createdAt: string
  lastUsedAt: string | null
}

export type PasskeyChallengePurpose = 'register' | 'signin'

export type PasskeyChallenge = {
  purpose: PasskeyChallengePurpose
  challenge: string
  userId: string
  expiresAt: number
}

export function canAddPasskey(existing: number): boolean {
  return existing < MAX_PASSKEYS_PER_MEMBER
}

export function isAcceptedCredentialId(id: string): boolean {
  return (
    id.length > 0 &&
    id.length <= MAX_CREDENTIAL_ID_LENGTH &&
    /^[A-Za-z0-9_-]+$/.test(id)
  )
}

export function isOwnPasskey(
  passkey: { userId: string } | null,
  memberId: string,
): boolean {
  return passkey?.userId === memberId
}
