import { ID, type Models, Query } from 'node-appwrite'
import { adminClient, loadCurrentUser } from '@/features/auth/session.server'
import { getServerEnv } from '@/server/env.server'
import {
  type AccountMember,
  canEditAccount,
  type PrivateContactInput,
  type PublicProfileInput,
} from './rules'

const PROFILES_TABLE_ID = 'profiles'
const CONTACTS_TABLE_ID = 'contacts'

type Member = AccountMember & { name: string }
type PrivateContact = { phone: string; displayConsent: boolean }

export type AccountSettings =
  | { ok: true; pseudonym: string; contact: PrivateContact | null }
  | { ok: false; message: string }

export type AccountMutationResult =
  | { ok: true }
  | { ok: false; message: string }

export type AccountDependencies = {
  loadMember: () => Promise<Member | null>
  findProfile: (userId: string) => Promise<{ pseudonym: string } | null>
  saveProfile: (userId: string, pseudonym: string) => Promise<void>
  renameAccount: (userId: string, name: string) => Promise<void>
  findContact: (userId: string) => Promise<PrivateContact | null>
  saveContact: (userId: string, contact: PrivateContact) => Promise<void>
}

type ProfileRow = Models.Row & { userId: string; pseudonym: string }
type ContactRow = Models.Row & {
  userId: string
  phone: string
  displayConsent: boolean
}

async function findRowByUser<Row extends Models.Row>(
  tableId: string,
  userId: string,
  columns: string[],
): Promise<Row | null> {
  const { tablesDB } = adminClient()
  const result = await tablesDB.listRows<Row>({
    databaseId: getServerEnv().APPWRITE_DATABASE_ID,
    tableId,
    queries: [
      Query.equal('userId', userId),
      Query.select(['$id', ...columns]),
      Query.limit(1),
    ],
    ttl: 0,
  })
  return result.rows[0] ?? null
}

async function upsertRowByUser(
  tableId: string,
  userId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const { tablesDB } = adminClient()
  const databaseId = getServerEnv().APPWRITE_DATABASE_ID
  const existing = await findRowByUser(tableId, userId, ['userId'])
  const row = { userId, ...data }
  if (existing) {
    await tablesDB.updateRow({
      databaseId,
      tableId,
      rowId: existing.$id,
      data: row,
    })
    return
  }
  await tablesDB.createRow({
    databaseId,
    tableId,
    rowId: ID.unique(),
    data: row,
  })
}

const productionDependencies: AccountDependencies = {
  async loadMember() {
    const user = await loadCurrentUser()
    return user
      ? { id: user.$id, name: user.name, suspended: !user.status }
      : null
  },
  async findProfile(userId) {
    const row = await findRowByUser<ProfileRow>(PROFILES_TABLE_ID, userId, [
      'pseudonym',
    ])
    return row ? { pseudonym: row.pseudonym } : null
  },
  async saveProfile(userId, pseudonym) {
    await upsertRowByUser(PROFILES_TABLE_ID, userId, { pseudonym })
  },
  async renameAccount(userId, name) {
    await adminClient().users.updateName({ userId, name })
  },
  async findContact(userId) {
    const row = await findRowByUser<ContactRow>(CONTACTS_TABLE_ID, userId, [
      'phone',
      'displayConsent',
    ])
    return row ? { phone: row.phone, displayConsent: row.displayConsent } : null
  },
  async saveContact(userId, contact) {
    await upsertRowByUser(CONTACTS_TABLE_ID, userId, contact)
  },
}

export async function createPublicProfile(
  userId: string,
  pseudonym: string,
): Promise<void> {
  await productionDependencies.saveProfile(userId, pseudonym)
}

const SIGNED_OUT = {
  ok: false,
  message: 'Connectez-vous pour gérer votre compte.',
} as const
const REFUSED = {
  ok: false,
  message: 'Votre compte ne permet pas cette modification.',
} as const

async function editableMember(
  dependencies: AccountDependencies,
): Promise<Member | typeof SIGNED_OUT | typeof REFUSED> {
  const member = await dependencies.loadMember()
  if (!member) return SIGNED_OUT
  if (!canEditAccount(member)) return REFUSED
  return member
}

/** Own settings of the session member; includes the private phone number. */
export async function loadAccountSettings(
  dependencies: AccountDependencies = productionDependencies,
): Promise<AccountSettings> {
  const member = await editableMember(dependencies)
  if ('ok' in member) return member
  const [profile, contact] = await Promise.all([
    dependencies.findProfile(member.id),
    dependencies.findContact(member.id),
  ])
  return {
    ok: true,
    pseudonym: profile?.pseudonym ?? member.name,
    contact,
  }
}

export async function savePublicProfile(
  input: PublicProfileInput,
  dependencies: AccountDependencies = productionDependencies,
): Promise<{ ok: true; pseudonym: string } | { ok: false; message: string }> {
  const member = await editableMember(dependencies)
  if ('ok' in member) return member
  await dependencies.saveProfile(member.id, input.pseudonym)
  await dependencies.renameAccount(member.id, input.pseudonym)
  return { ok: true, pseudonym: input.pseudonym }
}

export async function savePrivateContact(
  input: PrivateContactInput,
  dependencies: AccountDependencies = productionDependencies,
): Promise<AccountMutationResult> {
  const member = await editableMember(dependencies)
  if ('ok' in member) return member
  await dependencies.saveContact(member.id, {
    phone: input.phone,
    displayConsent: input.displayConsent,
  })
  return { ok: true }
}
