import { randomUUID } from 'node:crypto'
import { chmod, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Account, Client, ID, Storage, TablesDB, Users } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'

const expectedEndpoint = 'http://127.0.0.1:18670/v1'
const expectedProject = 'smodeal-qa'
const expectedDatabase = 'smodeal'
const credentialsPath = resolve('.qa-browser.local')

function requireLocalRecipe(): {
  endpoint: string
  projectId: string
  apiKey: string
  databaseId: string
  browserPassword: string
} {
  if (process.env.SMODEAL_QA !== '1')
    throw new Error('La création de données QA exige SMODEAL_QA=1.')
  if (process.argv[2] !== '--write')
    throw new Error('Ajoutez --write pour créer les données QA locales.')

  const endpoint = process.env.APPWRITE_ENDPOINT
  const projectId = process.env.APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY
  const databaseId = process.env.APPWRITE_DATABASE_ID
  const browserPassword = process.env.QA_BROWSER_PASSWORD
  if (
    endpoint !== expectedEndpoint ||
    projectId !== expectedProject ||
    databaseId !== expectedDatabase ||
    !apiKey
  ) {
    throw new Error(
      'La création de données QA exige Appwrite local smodeal-qa.',
    )
  }
  if (!browserPassword || browserPassword.length < 8)
    throw new Error('La création de données QA exige QA_BROWSER_PASSWORD.')
  return { endpoint, projectId, apiKey, databaseId, browserPassword }
}

function listingData(
  ownerId: string,
  title: string,
  photoId: string,
  status: string,
) {
  const now = new Date()
  return {
    ownerId,
    title,
    description: 'Annonce fictive réservée à la recette locale Smodeal.',
    categorySlug: 'maison',
    condition: 'good',
    priceCents: 2500,
    city: 'Lyon',
    postalCode: '69001',
    department: '69',
    photoIds: [photoId],
    status,
    publishedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    ...(status === 'sold' ? { soldAt: now.toISOString() } : {}),
  }
}

async function createVerifiedUser(
  account: Account,
  users: Users,
  name: string,
  password: string,
): Promise<{ id: string; email: string }> {
  const id = ID.unique()
  const email = `${name.toLowerCase().replaceAll(' ', '-')}-${randomUUID().slice(0, 8)}@smodeal.test`
  await account.create({ userId: id, email, password, name })
  await users.updateEmailVerification({ userId: id, emailVerification: true })
  return { id, email }
}

const env = requireLocalRecipe()
const client = new Client()
  .setEndpoint(env.endpoint)
  .setProject(env.projectId)
  .setKey(env.apiKey)
const account = new Account(client)
const users = new Users(client)
const tables = new TablesDB(client)
const storage = new Storage(client)

const [sellerAllowed, sellerRefused, member, suspendedMember] =
  await Promise.all([
    createVerifiedUser(
      account,
      users,
      'Vendeur accord QA',
      env.browserPassword,
    ),
    createVerifiedUser(account, users, 'Vendeur refus QA', env.browserPassword),
    createVerifiedUser(account, users, 'Membre QA', env.browserPassword),
    createVerifiedUser(
      account,
      users,
      'Membre suspendu QA',
      env.browserPassword,
    ),
  ])
const suspendedSession = await account.createEmailPasswordSession({
  email: suspendedMember.email,
  password: env.browserPassword,
})
await users.updateStatus({ userId: suspendedMember.id, status: false })

const photoId = ID.unique()
const image = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aOuoAAAAASUVORK5CYII=',
  'base64',
)
await storage.createFile({
  bucketId: 'listing-photos',
  fileId: photoId,
  file: InputFile.fromBuffer(image, 'recette-contact.png'),
})

await Promise.all([
  tables.createRow({
    databaseId: env.databaseId,
    tableId: 'contacts',
    rowId: ID.unique(),
    data: {
      userId: sellerAllowed.id,
      phone: '0600000001',
      displayConsent: true,
    },
  }),
  tables.createRow({
    databaseId: env.databaseId,
    tableId: 'contacts',
    rowId: ID.unique(),
    data: {
      userId: sellerRefused.id,
      phone: '0600000002',
      displayConsent: false,
    },
  }),
])

const activeListingId = ID.unique()
const refusedListingId = ID.unique()
const soldListingId = ID.unique()
const withdrawnListingId = ID.unique()
await Promise.all([
  tables.createRow({
    databaseId: env.databaseId,
    tableId: 'listings',
    rowId: activeListingId,
    data: listingData(
      sellerAllowed.id,
      'Lampe accord contact QA',
      photoId,
      'active',
    ),
  }),
  tables.createRow({
    databaseId: env.databaseId,
    tableId: 'listings',
    rowId: refusedListingId,
    data: listingData(
      sellerRefused.id,
      'Lampe sans accord contact QA',
      photoId,
      'active',
    ),
  }),
  tables.createRow({
    databaseId: env.databaseId,
    tableId: 'listings',
    rowId: soldListingId,
    data: listingData(sellerAllowed.id, 'Lampe vendue QA', photoId, 'sold'),
  }),
  tables.createRow({
    databaseId: env.databaseId,
    tableId: 'listings',
    rowId: withdrawnListingId,
    data: listingData(
      sellerAllowed.id,
      'Lampe retirée QA',
      photoId,
      'withdrawn',
    ),
  }),
])

await writeFile(
  credentialsPath,
  [
    `memberEmail=${member.email}`,
    `memberPassword=${env.browserPassword}`,
    `suspendedMemberEmail=${suspendedMember.email}`,
    `suspendedMemberPassword=${env.browserPassword}`,
    `suspendedMemberSession=${suspendedSession.secret}`,
    `activeListingId=${activeListingId}`,
    `refusedListingId=${refusedListingId}`,
    `soldListingId=${soldListingId}`,
    `withdrawnListingId=${withdrawnListingId}`,
    '',
  ].join('\n'),
  { mode: 0o600 },
)
await chmod(credentialsPath, 0o600)
console.log('Fixture QA locale créée dans .qa-browser.local.')
