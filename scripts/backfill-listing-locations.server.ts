import { Client, type Models, Query, TablesDB } from 'node-appwrite'

const COMMUNES_URL = 'https://geo.api.gouv.fr/communes'
const PAGE_SIZE = 100

type ListingPlace = { $id: string; city: string; postalCode: string }

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

function requireEnvironment() {
  const endpoint = process.env.APPWRITE_ENDPOINT
  const projectId = process.env.APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY
  const databaseId = process.env.APPWRITE_DATABASE_ID
  if (!endpoint || !projectId || !apiKey || !databaseId)
    throw new Error('Variables APPWRITE_* manquantes.')
  return { endpoint, projectId, apiKey, databaseId }
}

async function communeCenter(
  place: ListingPlace,
): Promise<[number, number] | null> {
  const url = new URL(COMMUNES_URL)
  url.searchParams.set('nom', place.city)
  url.searchParams.set('codePostal', place.postalCode)
  url.searchParams.set('fields', 'nom,codesPostaux,centre')
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
  if (!response.ok) return null
  const communes = (await response.json()) as Array<{
    nom: string
    codesPostaux: string[]
    centre?: { coordinates: [number, number] }
  }>
  const commune = communes.find(
    ({ nom, codesPostaux }) =>
      normalize(nom) === normalize(place.city) &&
      codesPostaux.includes(place.postalCode),
  )
  return commune?.centre?.coordinates ?? null
}

const write = process.argv[2] === '--write'
const env = requireEnvironment()
const tables = new TablesDB(
  new Client()
    .setEndpoint(env.endpoint)
    .setProject(env.projectId)
    .setKey(env.apiKey),
)

let cursor: string | undefined
let located = 0
let missing = 0
for (;;) {
  const page = await tables.listRows<ListingPlace & Models.Row>({
    databaseId: env.databaseId,
    tableId: 'listings',
    queries: [
      Query.isNull('location'),
      Query.select(['$id', 'city', 'postalCode']),
      Query.orderAsc('$id'),
      Query.limit(PAGE_SIZE),
      ...(cursor ? [Query.cursorAfter(cursor)] : []),
    ],
    ttl: 0,
  })
  for (const row of page.rows) {
    const location = await communeCenter(row)
    if (!location) {
      missing++
      continue
    }
    located++
    if (write)
      await tables.updateRow({
        databaseId: env.databaseId,
        tableId: 'listings',
        rowId: row.$id,
        data: { location },
      })
  }
  if (page.rows.length < PAGE_SIZE) break
  cursor = page.rows.at(-1)?.$id
}

console.log(
  `${write ? 'Positions enregistrées' : 'Positions trouvées (simulation)'} : ${located} · sans commune reconnue : ${missing}`,
)
