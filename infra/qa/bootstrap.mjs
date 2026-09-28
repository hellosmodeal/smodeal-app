import { randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const [credentialsPath, envPath] = process.argv.slice(2)
const endpoint = 'http://127.0.0.1:18670/v1'
const credentials = Object.fromEntries(
  (await readFile(credentialsPath, 'utf8'))
    .trim()
    .split('\n')
    .map((line) => line.split('=')),
)

async function request(path, body, cookie) {
  const response = await fetch(`${endpoint}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-appwrite-project': 'console',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  })

  const payload = await response.json()
  if (!response.ok) {
    if (
      response.status === 409 ||
      payload.type === 'user_console_count_exceeded' ||
      (path === '/teams' && payload.type === 'organization_creation_prohibited')
    ) {
      return { duplicate: true, payload }
    }
    throw new Error(`${path}: ${payload.type ?? response.status}`)
  }
  return { payload, cookie: response.headers.get('set-cookie')?.split(';')[0] }
}

await request('/account', {
  userId: 'smodeal-qa-admin',
  email: credentials.QA_ADMIN_EMAIL,
  password: credentials.QA_ADMIN_PASSWORD,
  name: 'Smodeal QA',
})

const session = await request('/account/sessions/email', {
  email: credentials.QA_ADMIN_EMAIL,
  password: credentials.QA_ADMIN_PASSWORD,
})
const cookie = session.cookie
if (!cookie)
  throw new Error('La session console locale ne renvoie pas de cookie.')

await request(
  '/teams',
  { teamId: 'smodeal-qa-team', name: 'Smodeal QA' },
  cookie,
)
await request(
  '/projects',
  { projectId: 'smodeal-qa', name: 'Smodeal QA', teamId: 'smodeal-qa-team' },
  cookie,
)
await request(
  '/projects/smodeal-qa/platforms',
  {
    platformId: 'smodeal-qa-web',
    name: 'Smodeal QA local',
    type: 'web',
    hostname: 'localhost',
  },
  cookie,
)

async function createRecipeKey(keyId) {
  return request(
    '/projects/smodeal-qa/keys',
    {
      keyId,
      name: 'Recette locale Smodeal',
      scopes: [
        'users.read',
        'users.write',
        'sessions.read',
        'sessions.write',
        'databases.read',
        'databases.write',
        'tables.read',
        'tables.write',
        'columns.read',
        'columns.write',
        'indexes.read',
        'indexes.write',
        'rows.read',
        'rows.write',
        'buckets.read',
        'buckets.write',
        'files.read',
        'files.write',
      ],
    },
    cookie,
  )
}

let key = await createRecipeKey('smodeal-qa-key')
if (!key.payload.secret) {
  key = await createRecipeKey(
    `smodeal-qa-key-${randomUUID().replaceAll('-', '').slice(0, 18)}`,
  )
}

if (!key.payload.secret)
  throw new Error('La clé de recette locale n’a pas été créée.')
await writeFile(
  envPath,
  [
    'APPWRITE_ENDPOINT=http://127.0.0.1:18670/v1',
    'APPWRITE_PROJECT_ID=smodeal-qa',
    `APPWRITE_API_KEY=${key.payload.secret}`,
    'APPWRITE_DATABASE_ID=smodeal',
    'PUBLIC_SITE_URL=http://localhost:18671',
    '',
  ].join('\n'),
  { mode: 0o600 },
)
