import { Account, Client, Storage, TablesDB, Users } from 'node-appwrite'

import { getServerEnv } from './env.server'

function createBaseClient(userAgent?: string) {
  const env = getServerEnv()
  const client = new Client()
    .setEndpoint(env.APPWRITE_ENDPOINT)
    .setProject(env.APPWRITE_PROJECT_ID)
  if (userAgent) client.setForwardedUserAgent(userAgent)
  return client
}

export function createAdminClient(userAgent?: string) {
  const client = createBaseClient(userAgent).setKey(
    getServerEnv().APPWRITE_API_KEY,
  )
  return {
    account: new Account(client),
    tablesDB: new TablesDB(client),
    storage: new Storage(client),
    users: new Users(client),
  }
}

export function createSessionClient(secret: string, userAgent?: string) {
  const client = createBaseClient(userAgent).setSession(secret)
  return {
    account: new Account(client),
    tablesDB: new TablesDB(client),
  }
}
