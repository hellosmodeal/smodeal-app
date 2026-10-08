import { type Models, Query, type TablesDB } from 'node-appwrite'
import { adminClient } from '@/features/auth/session.server'
import { listingStorage } from '@/features/search/listings.server'
import { getServerEnv } from '@/server/env.server'
import type { SitemapListing } from './rules'

const PAGE_SIZE = 500
const MAX_LISTINGS = 5000

type SitemapRow = Models.Row & { publishedAt: string }

export async function listSitemapListings(
  db: TablesDB,
  databaseId: string,
  now: Date,
): Promise<SitemapListing[]> {
  const entries: SitemapListing[] = []
  let cursor: string | undefined

  while (entries.length < MAX_LISTINGS) {
    const limit = Math.min(PAGE_SIZE, MAX_LISTINGS - entries.length)
    const response = await db.listRows<SitemapRow>({
      databaseId,
      tableId: listingStorage.listingsTableId,
      queries: [
        Query.equal('status', 'active'),
        Query.greaterThan('expiresAt', now.toISOString()),
        Query.select(['$id', '$updatedAt', 'publishedAt']),
        Query.orderDesc('publishedAt'),
        Query.limit(limit),
        ...(cursor ? [Query.cursorAfter(cursor)] : []),
      ],
      ttl: 0,
    })

    for (const row of response.rows) {
      entries.push({ id: row.$id, lastmod: row.$updatedAt ?? row.publishedAt })
    }

    const last = response.rows.at(-1)
    if (!last || response.rows.length < limit) break
    cursor = last.$id
  }

  return entries
}

export function listPublicSitemapListings(
  now: Date,
): Promise<SitemapListing[]> {
  return listSitemapListings(
    adminClient().tablesDB,
    getServerEnv().APPWRITE_DATABASE_ID,
    now,
  )
}
