import { type Models, Query } from 'node-appwrite'
import { adminClient } from '@/features/auth/session.server'
import { getServerEnv } from '@/server/env.server'
import type { SearchCriteria, SearchListing } from './rules'
import { searchCategories } from './rules'

const LISTINGS_TABLE_ID = 'listings'
const PHOTOS_BUCKET_ID = 'listing-photos'
const RESULTS_PER_PAGE = 12

const publicListingFields = [
  '$id',
  'title',
  'description',
  'categorySlug',
  'condition',
  'priceCents',
  'city',
  'postalCode',
  'department',
  'photoIds',
  'publishedAt',
] as const

export type PublicListingRow = {
  $id: string
  title: string
  description: string
  categorySlug: string
  condition: 'new' | 'like_new' | 'good' | 'fair'
  priceCents: number
  city: string
  postalCode: string
  department: string
  photoIds?: string[]
  publishedAt: string
}

type ListingRow = Models.Row & PublicListingRow

export type PublicListing = SearchListing & {
  description: string
  condition: ListingRow['condition']
  photoUrls: string[]
}

function isCategory(value: string): value is SearchListing['category'] {
  return searchCategories.some((category) => category.slug === value)
}

export function publicPhotoUrl(fileId: string, env = getServerEnv()): string {
  const url = new URL(
    `${env.APPWRITE_ENDPOINT.replace(/\/$/, '')}/storage/buckets/${PHOTOS_BUCKET_ID}/files/${encodeURIComponent(fileId)}/view`,
  )
  url.searchParams.set('project', env.APPWRITE_PROJECT_ID)
  return url.toString()
}

function departmentName(code: string): string {
  return `Département ${code}`
}

export function toPublicListing(row: PublicListingRow): PublicListing | null {
  if (!isCategory(row.categorySlug)) return null
  const photoUrls = (row.photoIds ?? [])
    .slice(0, 5)
    .map((fileId) => publicPhotoUrl(fileId))

  return {
    id: row.$id,
    title: row.title,
    description: row.description,
    category: row.categorySlug,
    condition: row.condition,
    priceCents: row.priceCents,
    city: row.city,
    postalCode: row.postalCode,
    departmentCode: row.department,
    departmentName: departmentName(row.department),
    publishedAt: row.publishedAt,
    image: photoUrls[0],
    photoUrls,
  }
}

export function resolvePublicPage(
  total: number,
  requestedPage: number,
): {
  page: number
  pageCount: number
} {
  const pageCount = Math.max(1, Math.ceil(total / RESULTS_PER_PAGE))
  return { page: Math.min(requestedPage, pageCount), pageCount }
}

function locationQuery(location: string): string {
  if (/^\d{5}$/.test(location)) return Query.equal('postalCode', location)
  if (/^(\d{2,3}|2[AB])$/.test(location))
    return Query.equal('department', location)
  return Query.equal('city', location)
}

export function publicListingQueries(
  criteria: SearchCriteria,
  now: Date,
  page: number,
): string[] {
  const queries = [
    Query.equal('status', 'active'),
    Query.greaterThan('expiresAt', now.toISOString()),
    Query.select([...publicListingFields]),
  ]

  if (criteria.q) queries.push(Query.search('title', criteria.q))
  if (criteria.lieu) queries.push(locationQuery(criteria.lieu))
  if (criteria.categorie)
    queries.push(Query.equal('categorySlug', criteria.categorie))
  if (criteria.departement)
    queries.push(Query.equal('department', criteria.departement))
  if (criteria.prixMin !== undefined)
    queries.push(Query.greaterThanEqual('priceCents', criteria.prixMin * 100))
  if (criteria.prixMax !== undefined)
    queries.push(Query.lessThanEqual('priceCents', criteria.prixMax * 100))

  if (criteria.tri === 'prix-croissant')
    queries.push(Query.orderAsc('priceCents'))
  else if (criteria.tri === 'prix-decroissant')
    queries.push(Query.orderDesc('priceCents'))
  else queries.push(Query.orderDesc('publishedAt'))

  queries.push(
    Query.limit(RESULTS_PER_PAGE),
    Query.offset((page - 1) * RESULTS_PER_PAGE),
  )
  return queries
}

export async function listPublicListings(
  criteria: SearchCriteria,
  now: Date,
): Promise<{
  items: SearchListing[]
  total: number
  page: number
  pageCount: number
}> {
  const requestedPage = criteria.page ?? 1
  const response = await adminClient().tablesDB.listRows<ListingRow>({
    databaseId: getServerEnv().APPWRITE_DATABASE_ID,
    tableId: LISTINGS_TABLE_ID,
    queries: publicListingQueries(criteria, now, requestedPage),
    ttl: 0,
  })
  const { page, pageCount } = resolvePublicPage(response.total, requestedPage)

  if (page !== requestedPage)
    return listPublicListings({ ...criteria, page }, now)

  return {
    items: response.rows
      .map(toPublicListing)
      .filter((listing): listing is PublicListing => listing !== null),
    total: response.total,
    page,
    pageCount,
  }
}

export async function getPublicListing(
  listingId: string,
  now: Date,
): Promise<PublicListing | null> {
  const response = await adminClient().tablesDB.listRows<ListingRow>({
    databaseId: getServerEnv().APPWRITE_DATABASE_ID,
    tableId: LISTINGS_TABLE_ID,
    queries: [
      Query.equal('$id', listingId),
      Query.equal('status', 'active'),
      Query.greaterThan('expiresAt', now.toISOString()),
      Query.select([...publicListingFields]),
      Query.limit(1),
    ],
    ttl: 0,
  })
  const row = response.rows[0]
  return row ? toPublicListing(row) : null
}

export const listingStorage = {
  get databaseId(): string {
    return getServerEnv().APPWRITE_DATABASE_ID
  },
  listingsTableId: LISTINGS_TABLE_ID,
  contactsTableId: 'contacts',
}
