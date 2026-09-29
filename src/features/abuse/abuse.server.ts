import { createHmac } from 'node:crypto'
import { AppwriteException } from 'node-appwrite'
import type { RateLimitAction } from './rules'
import {
  ANONYMOUS_BUCKET_COUNT,
  rateLimitPolicy,
  rateLimitWindowStart,
} from './rules'

const TABLE_ID = 'rate_limits'
const MAX_TRANSACTION_ATTEMPTS = 8
const MAX_CONFLICT_BACKOFF_MS = 200

type RateLimitDatabase = {
  createTransaction: (params: { ttl: number }) => Promise<{ $id: string }>
  getRow: (params: {
    databaseId: string
    tableId: string
    rowId: string
    transactionId: string
  }) => Promise<{ $id: string; count: number; windowStart: string }>
  createRow: (params: {
    databaseId: string
    tableId: string
    rowId: string
    data: {
      action: string
      subjectHash: string
      windowStart: string
      windowEnd: string
      count: number
    }
    transactionId: string
  }) => Promise<unknown>
  updateRow: (params: {
    databaseId: string
    tableId: string
    rowId: string
    data: {
      count: number
      windowStart?: string
      windowEnd?: string
    }
    transactionId: string
  }) => Promise<unknown>
  incrementRowColumn: (params: {
    databaseId: string
    tableId: string
    rowId: string
    column: string
    value: number
    max: number
    transactionId: string
  }) => Promise<unknown>
  updateTransaction: (params: {
    transactionId: string
    commit?: boolean
    rollback?: boolean
  }) => Promise<unknown>
}

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number

  constructor(retryAfterSeconds: number) {
    super('Trop de tentatives. Réessayez dans quelques instants.')
    this.name = 'RateLimitError'
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export class RateLimitUnavailableError extends Error {
  constructor() {
    super(
      'La protection anti-abus est indisponible. Réessayez dans quelques instants.',
    )
    this.name = 'RateLimitUnavailableError'
  }
}

export type ConsumeRateLimitInput = {
  db: RateLimitDatabase
  databaseId: string
  action: RateLimitAction
  subject: string
  secret: string
  now: Date
  limit?: number
}

function hash(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('hex')
}

function isMissingRow(error: unknown): boolean {
  return error instanceof AppwriteException && error.code === 404
}

function isConflict(error: unknown): boolean {
  return error instanceof AppwriteException && error.code === 409
}

async function rollback(
  db: RateLimitDatabase,
  transactionId: string,
): Promise<void> {
  await db
    .updateTransaction({ transactionId, rollback: true })
    .catch(() => undefined)
}

async function waitForConflict(attempt: number): Promise<void> {
  const ceiling = Math.min(
    MAX_CONFLICT_BACKOFF_MS,
    20 * 2 ** Math.max(0, attempt - 1),
  )
  const delay = Math.floor(Math.random() * (ceiling + 1))
  await new Promise<void>((resolve) => setTimeout(resolve, delay))
}

export async function consumeRateLimit(
  input: ConsumeRateLimitInput,
): Promise<void> {
  const policy = rateLimitPolicy(input.action)
  const windowStart = rateLimitWindowStart(input.now, policy.windowMs)
  const windowEnd = new Date(
    new Date(windowStart).getTime() + policy.windowMs,
  ).toISOString()
  const subjectHash = hash(input.secret, `${input.action}:${input.subject}`)
  const rowId = hash(input.secret, subjectHash).slice(0, 36)

  for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    let transactionId: string | undefined
    try {
      const transaction = await input.db.createTransaction({ ttl: 60 })
      transactionId = transaction.$id
      let count = 0
      let isCurrentWindow = false
      try {
        const row = await input.db.getRow({
          databaseId: input.databaseId,
          tableId: TABLE_ID,
          rowId,
          transactionId,
        })
        count = row.count
        isCurrentWindow =
          new Date(row.windowStart).getTime() ===
          new Date(windowStart).getTime()
      } catch (error) {
        if (!isMissingRow(error)) throw error
      }

      if (isCurrentWindow && count >= (input.limit ?? policy.limit)) {
        await rollback(input.db, transactionId)
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil(
            (new Date(windowEnd).getTime() - input.now.getTime()) / 1000,
          ),
        )
        throw new RateLimitError(retryAfterSeconds)
      }

      if (isCurrentWindow) {
        await input.db.incrementRowColumn({
          databaseId: input.databaseId,
          tableId: TABLE_ID,
          rowId,
          column: 'count',
          value: 1,
          max: input.limit ?? policy.limit,
          transactionId,
        })
      } else if (count === 0) {
        await input.db.createRow({
          databaseId: input.databaseId,
          tableId: TABLE_ID,
          rowId,
          data: {
            action: input.action,
            subjectHash,
            windowStart,
            windowEnd,
            count: 1,
          },
          transactionId,
        })
      } else {
        await input.db.updateRow({
          databaseId: input.databaseId,
          tableId: TABLE_ID,
          rowId,
          data: { count: 1, windowStart, windowEnd },
          transactionId,
        })
      }
      await input.db.updateTransaction({ transactionId, commit: true })
      return
    } catch (error) {
      if (error instanceof RateLimitError) throw error
      if (transactionId) await rollback(input.db, transactionId)
      if (isConflict(error) && attempt + 1 < MAX_TRANSACTION_ATTEMPTS) {
        await waitForConflict(attempt)
        continue
      }
      throw new RateLimitUnavailableError()
    }
  }

  throw new RateLimitUnavailableError()
}

export function anonymousBucket(secret: string, input: string): string {
  const value = Number.parseInt(hash(secret, input).slice(0, 8), 16)
  return `anonymous:${value % ANONYMOUS_BUCKET_COUNT}`
}
