import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server'
import { createServerFn } from '@tanstack/react-start'
import {
  deleteCookie,
  getCookie,
  getRequestUrl,
  setCookie,
  setResponseHeader,
} from '@tanstack/react-start/server'
import { z } from 'zod'
import {
  limitAnonymousAction,
  limitCurrentMemberAction,
} from '@/features/abuse/functions.server'
import { persistSession } from '@/features/auth/session.server'
import { getServerEnv } from '@/server/env.server'
import { openPasskeyChallenge, sealPasskeyChallenge } from './challenge.server'
import {
  beginPasskeyRegistration,
  beginPasskeySignIn,
  completePasskeyRegistration,
  completePasskeySignIn,
  listMemberPasskeys,
  removeMemberPasskey,
} from './passkeys.server'
import {
  MAX_CREDENTIAL_ID_LENGTH,
  PASSKEY_CHALLENGE_TTL_SECONDS,
  type PasskeyChallenge,
  type PasskeyChallengePurpose,
  type PasskeySummary,
  relyingParty,
} from './rules'

type Failure = { ok: false; message: string }

const COOKIES: Record<PasskeyChallengePurpose, string> = {
  register: 'smodeal_passkey_register',
  signin: 'smodeal_passkey_signin',
}

const base64url = (max: number) =>
  z
    .string()
    .max(max)
    .regex(/^[A-Za-z0-9_-]*$/)

const credentialFields = {
  id: base64url(MAX_CREDENTIAL_ID_LENGTH).min(1),
  rawId: base64url(MAX_CREDENTIAL_ID_LENGTH).min(1),
  type: z.literal('public-key'),
  clientExtensionResults: z.object({}),
  authenticatorAttachment: z.enum(['platform', 'cross-platform']).optional(),
}

const registrationSchema = z.object({
  ...credentialFields,
  response: z.object({
    clientDataJSON: base64url(4096),
    attestationObject: base64url(16_384),
    transports: z.array(z.string().max(16)).max(8).optional(),
    authenticatorData: base64url(16_384).optional(),
    publicKey: base64url(4096).optional(),
    publicKeyAlgorithm: z.number().int().optional(),
  }),
})

const authenticationSchema = z.object({
  ...credentialFields,
  response: z.object({
    clientDataJSON: base64url(4096),
    authenticatorData: base64url(16_384),
    signature: base64url(4096),
    userHandle: base64url(512).optional(),
  }),
})

type CreationOptions = Omit<
  PublicKeyCredentialCreationOptionsJSON,
  'extensions'
>
type RequestOptions = Omit<PublicKeyCredentialRequestOptionsJSON, 'extensions'>

const removeSchema = z.object({ id: z.string().min(1).max(36) })

function privateResponse() {
  setResponseHeader('Cache-Control', 'private, no-store')
}

function currentRelyingParty() {
  return relyingParty(getServerEnv().PUBLIC_SITE_URL, getRequestUrl().href)
}

function storeChallenge(challenge: Omit<PasskeyChallenge, 'expiresAt'>) {
  setCookie(
    COOKIES[challenge.purpose],
    sealPasskeyChallenge(
      getServerEnv().APPWRITE_API_KEY,
      challenge,
      new Date(),
    ),
    {
      httpOnly: true,
      sameSite: 'strict',
      secure: getServerEnv().NODE_ENV === 'production',
      path: '/',
      maxAge: PASSKEY_CHALLENGE_TTL_SECONDS,
    },
  )
}

function takeChallenge(
  purpose: PasskeyChallengePurpose,
): PasskeyChallenge | null {
  const sealed = getCookie(COOKIES[purpose])
  deleteCookie(COOKIES[purpose], { path: '/' })
  return openPasskeyChallenge(
    getServerEnv().APPWRITE_API_KEY,
    sealed,
    purpose,
    new Date(),
  )
}

export const getMemberPasskeys = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ ok: true; passkeys: PasskeySummary[] } | Failure> => {
    privateResponse()
    return listMemberPasskeys()
  },
)

export const startPasskeyRegistration = createServerFn({
  method: 'POST',
}).handler(
  async (): Promise<{ ok: true; options: CreationOptions } | Failure> => {
    privateResponse()
    await limitCurrentMemberAction('account_update')
    const result = await beginPasskeyRegistration(currentRelyingParty())
    if (!result.ok) return result
    storeChallenge(result.challenge)
    return { ok: true, options: result.options }
  },
)

export const finishPasskeyRegistration = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: z.input<typeof registrationSchema>): RegistrationResponseJSON =>
      registrationSchema.parse(input) as RegistrationResponseJSON,
  )
  .handler(async ({ data }): Promise<{ ok: true } | Failure> => {
    privateResponse()
    await limitCurrentMemberAction('account_update')
    return completePasskeyRegistration(
      currentRelyingParty(),
      data,
      takeChallenge('register'),
    )
  })

export const deletePasskey = createServerFn({ method: 'POST' })
  .inputValidator(removeSchema)
  .handler(async ({ data }): Promise<{ ok: true } | Failure> => {
    privateResponse()
    await limitCurrentMemberAction('account_update')
    return removeMemberPasskey(data.id)
  })

export const startPasskeySignIn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<{ options: RequestOptions }> => {
    privateResponse()
    const result = await beginPasskeySignIn(currentRelyingParty())
    storeChallenge(result.challenge)
    return { options: result.options }
  },
)

export const finishPasskeySignIn = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: z.input<typeof authenticationSchema>): AuthenticationResponseJSON =>
      authenticationSchema.parse(input) as AuthenticationResponseJSON,
  )
  .handler(async ({ data }): Promise<{ ok: true } | Failure> => {
    privateResponse()
    await limitAnonymousAction('auth_signin', `passkey:${data.id}`)
    const result = await completePasskeySignIn(
      currentRelyingParty(),
      data,
      takeChallenge('signin'),
    )
    if (!result.ok) return result
    persistSession(result.session)
    return { ok: true }
  })
