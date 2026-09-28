import { readFile } from 'node:fs/promises'

const [envPath, configPath] = process.argv.slice(2)
const env = Object.fromEntries(
  (await readFile(envPath, 'utf8'))
    .trim()
    .split('\n')
    .map((line) => line.split('=')),
)
const config = JSON.parse(await readFile(configPath, 'utf8'))
const endpoint = new URL(env.APPWRITE_ENDPOINT)
if (
  !['localhost', '127.0.0.1'].includes(endpoint.hostname) ||
  endpoint.protocol !== 'http:' ||
  endpoint.port !== '18670' ||
  endpoint.pathname !== '/v1' ||
  env.APPWRITE_PROJECT_ID !== 'smodeal-qa'
) {
  throw new Error(
    'Le schéma de recette exige Appwrite local sur 18670 et le projet smodeal-qa.',
  )
}

async function create(path, body) {
  const response = await fetch(`${env.APPWRITE_ENDPOINT}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-appwrite-project': env.APPWRITE_PROJECT_ID,
      'x-appwrite-key': env.APPWRITE_API_KEY,
    },
    body: JSON.stringify(body),
  })
  if (response.status === 409) return
  if (!response.ok) {
    const payload = await response.json()
    throw new Error(`${path}: ${payload.type ?? response.status}`)
  }
}

for (const database of config.tablesDB) {
  await create('/tablesdb', {
    databaseId: database.$id,
    name: database.name,
    enabled: database.enabled,
  })
}

for (const table of config.tables) {
  const indexes = table.indexes.map(({ columns, ...index }) => ({
    ...index,
    attributes: columns,
  }))
  await create(`/tablesdb/${table.databaseId}/tables`, {
    tableId: table.$id,
    name: table.name,
    enabled: table.enabled,
    rowSecurity: table.rowSecurity,
    permissions: table.$permissions,
    columns: table.columns,
    indexes,
  })
}

for (const bucket of config.buckets) {
  await create('/storage/buckets', {
    bucketId: bucket.$id,
    name: bucket.name,
    enabled: bucket.enabled,
    permissions: bucket.$permissions,
    fileSecurity: bucket.fileSecurity,
    maximumFileSize: bucket.maximumFileSize,
    allowedFileExtensions: bucket.allowedFileExtensions,
    compression: bucket.compression,
    encryption: bucket.encryption,
    antivirus: bucket.antivirus,
  })
}
