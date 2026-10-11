import { Client, ID, type Models, Query, TablesDB, Users } from 'node-appwrite'

const PAGE_SIZE = 100

function requireEnvironment() {
  const endpoint = process.env.APPWRITE_ENDPOINT
  const projectId = process.env.APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY
  const databaseId = process.env.APPWRITE_DATABASE_ID
  if (!endpoint || !projectId || !apiKey || !databaseId)
    throw new Error('Variables APPWRITE_* manquantes.')
  return { endpoint, projectId, apiKey, databaseId }
}

async function* allRows<Row extends Models.Row>(
  tables: TablesDB,
  databaseId: string,
  tableId: string,
  columns: string[],
): AsyncGenerator<Row> {
  let cursor: string | undefined
  for (;;) {
    const page = await tables.listRows<Row>({
      databaseId,
      tableId,
      queries: [
        Query.select(['$id', ...columns]),
        Query.orderAsc('$id'),
        Query.limit(PAGE_SIZE),
        ...(cursor ? [Query.cursorAfter(cursor)] : []),
      ],
      ttl: 0,
    })
    yield* page.rows
    if (page.rows.length < PAGE_SIZE) return
    cursor = page.rows.at(-1)?.$id
  }
}

const write = process.argv[2] === '--write'
const env = requireEnvironment()
const client = new Client()
  .setEndpoint(env.endpoint)
  .setProject(env.projectId)
  .setKey(env.apiKey)
const tables = new TablesDB(client)
const users = new Users(client)

const withProfile = new Set<string>()
for await (const row of allRows<Models.Row & { userId: string }>(
  tables,
  env.databaseId,
  'profiles',
  ['userId'],
))
  withProfile.add(row.userId)

const sellers = new Set<string>()
for await (const row of allRows<Models.Row & { ownerId: string }>(
  tables,
  env.databaseId,
  'listings',
  ['ownerId'],
))
  if (!withProfile.has(row.ownerId)) sellers.add(row.ownerId)

let created = 0
let skipped = 0
for (const userId of sellers) {
  const user = await users.get({ userId }).catch(() => null)
  const pseudonym = user?.name.trim() ?? ''
  if (pseudonym.length < 2 || pseudonym.length > 40) {
    skipped++
    continue
  }
  created++
  if (write)
    await tables.createRow({
      databaseId: env.databaseId,
      tableId: 'profiles',
      rowId: ID.unique(),
      data: { userId, pseudonym },
    })
}

console.log(
  `${write ? 'Profils créés' : 'Profils à créer (simulation)'} : ${created} · ignorés (compte absent ou nom invalide) : ${skipped}`,
)
