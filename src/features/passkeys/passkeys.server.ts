import {
  type AuthenticationResponseJSON,
  type AuthenticatorTransport,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import { AppwriteException, ID, type Models, Query } from 'node-appwrite'
import { isActiveUser } from '@/features/auth/rules'
import { adminClient, loadCurrentUser } from '@/features/auth/session.server'
import { getServerEnv } from '@/server/env.server'
import {
  canAddPasskey,
  isAcceptedCredentialId,
  isOwnPasskey,
  MAX_PASSKEYS_PER_MEMBER,
  type PasskeyChallenge,
  type PasskeySummary,
  type RelyingParty,
} from './rules'

const PASSKEYS_TABLE_ID = 'passkeys'

const KNOWN_TRANSPORTS: readonly AuthenticatorTransport[] = [
  'ble',
  'hybrid',
  'internal',
  'nfc',
  'usb',
]

type Member = { id: string; name: string; email: string; suspended: boolean }

export type StoredPasskey = {
  rowId: string
  userId: string
  credentialId: string
  publicKey: string
  counter: number
  transports: AuthenticatorTransport[]
  createdAt: string
  lastUsedAt: string | null
}

type NewPasskey = Pick<
  StoredPasskey,
  'userId' | 'credentialId' | 'publicKey' | 'counter' | 'transports'
>

export type PasskeyDependencies<Session = Models.Session> = {
  loadMember: () => Promise<Member | null>
  listPasskeys: (userId: string) => Promise<StoredPasskey[]>
  findPasskey: (credentialId: string) => Promise<StoredPasskey | null>
  findPasskeyByRowId: (rowId: string) => Promise<StoredPasskey | null>
  savePasskey: (passkey: NewPasskey) => Promise<void>
  recordUse: (rowId: string, counter: number, usedAt: Date) => Promise<void>
  deletePasskey: (rowId: string) => Promise<void>
  isActiveMember: (userId: string) => Promise<boolean>
  createSession: (userId: string) => Promise<Session>
  verifyRegistration: typeof verifyRegistrationResponse
  verifyAuthentication: typeof verifyAuthenticationResponse
  now: () => Date
}

type Failure = { ok: false; message: string }

const SIGNED_OUT: Failure = {
  ok: false,
  message: 'Connectez-vous pour gérer vos clés d’accès.',
}
const REFUSED: Failure = {
  ok: false,
  message: 'Votre compte ne permet pas cette modification.',
}
const EXPIRED: Failure = {
  ok: false,
  message: 'La demande a expiré. Réessayez.',
}
const NOT_VERIFIED: Failure = {
  ok: false,
  message: 'La clé d’accès n’a pas pu être vérifiée. Réessayez.',
}
const LIMIT_REACHED: Failure = {
  ok: false,
  message: `Vous avez atteint la limite de ${MAX_PASSKEYS_PER_MEMBER} clés d’accès.`,
}
const SIGN_IN_FAILED: Failure = {
  ok: false,
  message:
    'Connexion avec la clé d’accès impossible. Réessayez ou connectez-vous avec votre email.',
}

type PasskeyRow = Models.Row & {
  userId: string
  credentialId: string
  publicKey: string
  counter: number
  transports: string[] | null
  lastUsedAt: string | null
}

function knownTransports(
  transports: readonly string[] | null | undefined,
): AuthenticatorTransport[] {
  return KNOWN_TRANSPORTS.filter((transport) => transports?.includes(transport))
}

function toStoredPasskey(row: PasskeyRow): StoredPasskey {
  return {
    rowId: row.$id,
    userId: row.userId,
    credentialId: row.credentialId,
    publicKey: row.publicKey,
    counter: row.counter,
    transports: knownTransports(row.transports),
    createdAt: row.$createdAt,
    lastUsedAt: row.lastUsedAt,
  }
}

function tables() {
  return {
    tablesDB: adminClient().tablesDB,
    databaseId: getServerEnv().APPWRITE_DATABASE_ID,
    tableId: PASSKEYS_TABLE_ID,
  }
}

function isNotFound(error: unknown): boolean {
  return error instanceof AppwriteException && error.code === 404
}

const productionDependencies: PasskeyDependencies = {
  async loadMember() {
    const user = await loadCurrentUser()
    return user
      ? {
          id: user.$id,
          name: user.name,
          email: user.email,
          suspended: !user.status,
        }
      : null
  },
  async listPasskeys(userId) {
    const { tablesDB, ...table } = tables()
    const result = await tablesDB.listRows<PasskeyRow>({
      ...table,
      queries: [
        Query.equal('userId', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(MAX_PASSKEYS_PER_MEMBER),
      ],
      ttl: 0,
    })
    return result.rows.map(toStoredPasskey)
  },
  async findPasskey(credentialId) {
    const { tablesDB, ...table } = tables()
    const result = await tablesDB.listRows<PasskeyRow>({
      ...table,
      queries: [Query.equal('credentialId', credentialId), Query.limit(1)],
      ttl: 0,
    })
    const row = result.rows[0]
    return row ? toStoredPasskey(row) : null
  },
  async findPasskeyByRowId(rowId) {
    const { tablesDB, ...table } = tables()
    try {
      return toStoredPasskey(
        await tablesDB.getRow<PasskeyRow>({ ...table, rowId }),
      )
    } catch (error) {
      if (isNotFound(error)) return null
      throw error
    }
  },
  async savePasskey(passkey) {
    const { tablesDB, ...table } = tables()
    await tablesDB.createRow({
      ...table,
      rowId: ID.unique(),
      data: { ...passkey, lastUsedAt: null },
    })
  },
  async recordUse(rowId, counter, usedAt) {
    const { tablesDB, ...table } = tables()
    await tablesDB.updateRow({
      ...table,
      rowId,
      data: { counter, lastUsedAt: usedAt.toISOString() },
    })
  },
  async deletePasskey(rowId) {
    const { tablesDB, ...table } = tables()
    await tablesDB.deleteRow({ ...table, rowId })
  },
  async isActiveMember(userId) {
    try {
      return isActiveUser(await adminClient().users.get({ userId }))
    } catch (error) {
      if (isNotFound(error)) return false
      throw error
    }
  },
  createSession(userId) {
    return adminClient().users.createSession({ userId })
  },
  verifyRegistration: verifyRegistrationResponse,
  verifyAuthentication: verifyAuthenticationResponse,
  now: () => new Date(),
}

async function editableMember(
  dependencies: Pick<PasskeyDependencies<unknown>, 'loadMember'>,
): Promise<Member | Failure> {
  const member = await dependencies.loadMember()
  if (!member) return SIGNED_OUT
  if (member.suspended) return REFUSED
  return member
}

function userHandle(userId: string): string {
  return Buffer.from(userId).toString('base64url')
}

export async function listMemberPasskeys(
  dependencies: PasskeyDependencies<unknown> = productionDependencies,
): Promise<{ ok: true; passkeys: PasskeySummary[] } | Failure> {
  const member = await editableMember(dependencies)
  if ('ok' in member) return member
  const passkeys = await dependencies.listPasskeys(member.id)
  return {
    ok: true,
    passkeys: passkeys.map(({ rowId, createdAt, lastUsedAt }) => ({
      id: rowId,
      createdAt,
      lastUsedAt,
    })),
  }
}

export async function beginPasskeyRegistration(
  rp: RelyingParty,
  dependencies: PasskeyDependencies<unknown> = productionDependencies,
): Promise<
  | {
      ok: true
      options: PublicKeyCredentialCreationOptionsJSON
      challenge: Omit<PasskeyChallenge, 'expiresAt'>
    }
  | Failure
> {
  const member = await editableMember(dependencies)
  if ('ok' in member) return member
  const existing = await dependencies.listPasskeys(member.id)
  if (!canAddPasskey(existing.length)) return LIMIT_REACHED
  const options = await generateRegistrationOptions({
    rpName: rp.name,
    rpID: rp.id,
    userName: member.email,
    userDisplayName: member.name,
    userID: new TextEncoder().encode(member.id),
    attestationType: 'none',
    excludeCredentials: existing.map((passkey) => ({
      id: passkey.credentialId,
      transports: passkey.transports,
    })),
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required',
    },
  })
  return {
    ok: true,
    options,
    challenge: {
      purpose: 'register',
      challenge: options.challenge,
      userId: member.id,
    },
  }
}

export async function completePasskeyRegistration(
  rp: RelyingParty,
  response: RegistrationResponseJSON,
  expected: PasskeyChallenge | null,
  dependencies: PasskeyDependencies<unknown> = productionDependencies,
): Promise<{ ok: true } | Failure> {
  const member = await editableMember(dependencies)
  if ('ok' in member) return member
  if (!expected || expected.userId !== member.id) return EXPIRED
  const existing = await dependencies.listPasskeys(member.id)
  if (!canAddPasskey(existing.length)) return LIMIT_REACHED
  let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>>
  try {
    verification = await dependencies.verifyRegistration({
      response,
      expectedChallenge: expected.challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.id,
      requireUserVerification: true,
    })
  } catch {
    return NOT_VERIFIED
  }
  if (!verification.verified) return NOT_VERIFIED
  const { credential } = verification.registrationInfo
  if (!isAcceptedCredentialId(credential.id)) return NOT_VERIFIED
  if (await dependencies.findPasskey(credential.id))
    return { ok: false, message: 'Cette clé d’accès est déjà enregistrée.' }
  await dependencies.savePasskey({
    userId: member.id,
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString('base64url'),
    counter: credential.counter,
    transports: knownTransports(credential.transports),
  })
  return { ok: true }
}

export async function removeMemberPasskey(
  rowId: string,
  dependencies: PasskeyDependencies<unknown> = productionDependencies,
): Promise<{ ok: true } | Failure> {
  const member = await editableMember(dependencies)
  if ('ok' in member) return member
  const passkey = await dependencies.findPasskeyByRowId(rowId)
  if (!isOwnPasskey(passkey, member.id))
    return { ok: false, message: 'Clé d’accès introuvable.' }
  await dependencies.deletePasskey(rowId)
  return { ok: true }
}

export async function beginPasskeySignIn(rp: RelyingParty): Promise<{
  options: PublicKeyCredentialRequestOptionsJSON
  challenge: Omit<PasskeyChallenge, 'expiresAt'>
}> {
  const options = await generateAuthenticationOptions({
    rpID: rp.id,
    userVerification: 'required',
  })
  return {
    options,
    challenge: { purpose: 'signin', challenge: options.challenge, userId: '' },
  }
}

export async function completePasskeySignIn<Session = Models.Session>(
  rp: RelyingParty,
  response: AuthenticationResponseJSON,
  expected: PasskeyChallenge | null,
  dependencies: PasskeyDependencies<Session> = productionDependencies as PasskeyDependencies<Session>,
): Promise<{ ok: true; session: Session } | Failure> {
  if (!expected) return EXPIRED
  if (!isAcceptedCredentialId(response.id)) return SIGN_IN_FAILED
  const passkey = await dependencies.findPasskey(response.id)
  if (!passkey) return SIGN_IN_FAILED
  const handle = response.response.userHandle
  if (handle && handle !== userHandle(passkey.userId)) return SIGN_IN_FAILED
  let verification: Awaited<ReturnType<typeof verifyAuthenticationResponse>>
  try {
    verification = await dependencies.verifyAuthentication({
      response,
      expectedChallenge: expected.challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.id,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(Buffer.from(passkey.publicKey, 'base64url')),
        counter: passkey.counter,
        transports: passkey.transports,
      },
      requireUserVerification: true,
    })
  } catch {
    return SIGN_IN_FAILED
  }
  if (!verification.verified) return SIGN_IN_FAILED
  if (!(await dependencies.isActiveMember(passkey.userId)))
    return SIGN_IN_FAILED
  await dependencies.recordUse(
    passkey.rowId,
    verification.authenticationInfo.newCounter,
    dependencies.now(),
  )
  return { ok: true, session: await dependencies.createSession(passkey.userId) }
}
