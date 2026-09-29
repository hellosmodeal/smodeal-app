import { randomBytes } from 'node:crypto'
import { Client, TablesDB } from 'node-appwrite'
import { describe, expect, it } from 'vitest'
import { getServerEnv } from '@/server/env.server'
import {
  consumeRateLimit,
  RateLimitError,
  RateLimitUnavailableError,
} from './abuse.server'

function createLocalQaDatabase(): {
  env: ReturnType<typeof getServerEnv>
  db: TablesDB
} {
  const env = getServerEnv()
  const endpoint = new URL(env.APPWRITE_ENDPOINT)
  if (
    endpoint.protocol !== 'http:' ||
    endpoint.hostname !== '127.0.0.1' ||
    endpoint.port !== '18670' ||
    endpoint.pathname !== '/v1' ||
    env.APPWRITE_PROJECT_ID !== 'smodeal-qa' ||
    env.APPWRITE_DATABASE_ID !== 'smodeal'
  )
    throw new Error(
      'La recette exige Appwrite local http://127.0.0.1:18670/v1, le projet smodeal-qa et la base smodeal.',
    )

  const client = new Client()
    .setEndpoint(env.APPWRITE_ENDPOINT)
    .setProject(env.APPWRITE_PROJECT_ID)
    .setKey(env.APPWRITE_API_KEY)
  return { env, db: new TablesDB(client) }
}

describe.skipIf(process.env.SMODEAL_QA !== '1')(
  'concurrence du limiteur Appwrite local',
  () => {
    it('ne laisse pas dépasser 10 connexions concurrentes pour un même acteur', async () => {
      const { env, db } = createLocalQaDatabase()
      const now = new Date('2026-09-29T10:00:00.000Z')
      const subject = `qa-concurrent-${randomBytes(8).toString('hex')}`
      const results = await Promise.allSettled(
        Array.from({ length: 11 }, () =>
          consumeRateLimit({
            db,
            databaseId: env.APPWRITE_DATABASE_ID,
            action: 'auth_signin',
            subject,
            secret: env.APPWRITE_API_KEY,
            now,
          }),
        ),
      )

      const accepted = results.filter((result) => result.status === 'fulfilled')
      const rejected = results.filter(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected',
      )
      expect(accepted.length).toBeGreaterThanOrEqual(8)
      expect(accepted.length).toBeLessThanOrEqual(10)
      expect(rejected.length).toBeGreaterThanOrEqual(1)
      for (const result of rejected) {
        expect(result.reason).toSatisfy(
          (error: unknown) =>
            error instanceof RateLimitError ||
            error instanceof RateLimitUnavailableError,
        )
      }
    }, 15_000)

    it('accepte dix demandes séquentielles puis répond avec une limite', async () => {
      const { env, db } = createLocalQaDatabase()
      const now = new Date('2026-09-29T10:30:00.000Z')
      const subject = `qa-sequential-${randomBytes(8).toString('hex')}`

      for (let count = 0; count < 10; count += 1) {
        await consumeRateLimit({
          db,
          databaseId: env.APPWRITE_DATABASE_ID,
          action: 'auth_signin',
          subject,
          secret: env.APPWRITE_API_KEY,
          now,
        })
      }

      await expect(
        consumeRateLimit({
          db,
          databaseId: env.APPWRITE_DATABASE_ID,
          action: 'auth_signin',
          subject,
          secret: env.APPWRITE_API_KEY,
          now,
        }),
      ).rejects.toBeInstanceOf(RateLimitError)
    }, 15_000)
  },
)
