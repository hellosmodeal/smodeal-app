import { type Models, Query } from 'node-appwrite'
import { adminClient, loadCurrentUser } from '@/features/auth/session.server'
import { distanceKm, type GeoPoint } from '@/features/locations/rules'
import { getServerEnv } from '@/server/env.server'
import { departmentName } from './departments'
import type { SearchCriteria, SearchListing } from './rules'
import { searchArea, searchCategories } from './rules'

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
  'location',
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
  location?: [number, number] | null
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

export function toPublicListing(
  row: PublicListingRow,
  origin?: GeoPoint,
): PublicListing | null {
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
    ...(origin &&
      row.location && {
        distanceKm: distanceKm(origin, {
          lng: row.location[0],
          lat: row.location[1],
        }),
      }),
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

  const area = searchArea(criteria)
  if (criteria.q) queries.push(Query.search('title', criteria.q))
  if (area)
    queries.push(
      Query.distanceLessThan(
        'location',
        [area.center.lng, area.center.lat],
        area.radiusKm * 1000,
        true,
      ),
    )
  else if (criteria.lieu) queries.push(locationQuery(criteria.lieu))
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

  const origin = searchArea(criteria)?.center
  return {
    items: response.rows
      .map((row) => toPublicListing(row, origin))
      .filter((listing): listing is PublicListing => listing !== null),
    total: response.total,
    page,
    pageCount,
  }
}

export type PublicListingDetail = PublicListing & {
  /** Computed from the session: the viewer owns this listing. */
  isOwner: boolean
  /** The seller consented to display a contact; never carries the contact itself. */
  contactAvailable: boolean
  sellerPseudonym: string | null
}

type PrivateListingRow = PublicListingRow & { ownerId: string }

export type PublicListingDependencies = {
  findActiveListing: (
    listingId: string,
    now: Date,
  ) => Promise<PrivateListingRow | null>
  loadViewerId: () => Promise<string | null>
  hasContactConsent: (ownerId: string) => Promise<boolean>
  findSellerPseudonym: (ownerId: string) => Promise<string | null>
}

const productionListingDependencies: PublicListingDependencies = {
  async findActiveListing(listingId, now) {
    const response = await adminClient().tablesDB.listRows<
      Models.Row & PrivateListingRow
    >({
      databaseId: getServerEnv().APPWRITE_DATABASE_ID,
      tableId: LISTINGS_TABLE_ID,
      queries: [
        Query.equal('$id', listingId),
        Query.equal('status', 'active'),
        Query.greaterThan('expiresAt', now.toISOString()),
        Query.select([...publicListingFields, 'ownerId']),
        Query.limit(1),
      ],
      ttl: 0,
    })
    return response.rows[0] ?? null
  },
  async loadViewerId() {
    const viewer = await loadCurrentUser()
    return viewer?.$id ?? null
  },
  async hasContactConsent(ownerId) {
    const response = await adminClient().tablesDB.listRows<
      Models.Row & { userId: string; displayConsent: boolean }
    >({
      databaseId: getServerEnv().APPWRITE_DATABASE_ID,
      tableId: 'contacts',
      queries: [
        Query.equal('userId', ownerId),
        Query.select(['userId', 'displayConsent']),
        Query.limit(1),
      ],
      ttl: 0,
    })
    return response.rows[0]?.displayConsent === true
  },
  async findSellerPseudonym(ownerId) {
    const { tablesDB, users } = adminClient()
    const response = await tablesDB.listRows<
      Models.Row & { userId: string; pseudonym: string }
    >({
      databaseId: getServerEnv().APPWRITE_DATABASE_ID,
      tableId: 'profiles',
      queries: [
        Query.equal('userId', ownerId),
        Query.select(['userId', 'pseudonym']),
        Query.limit(1),
      ],
      ttl: 0,
    })
    const pseudonym = response.rows[0]?.pseudonym
    if (pseudonym) return pseudonym
    try {
      const owner = await users.get({ userId: ownerId })
      return owner.name.trim() || null
    } catch {
      return null
    }
  },
}

export async function getPublicListing(
  listingId: string,
  now: Date,
  dependencies: PublicListingDependencies = productionListingDependencies,
): Promise<PublicListingDetail | null> {
  const row = await dependencies.findActiveListing(listingId, now)
  if (!row) return null
  const listing = toPublicListing(row)
  if (!listing) return null
  const [viewerId, contactAvailable, sellerPseudonym] = await Promise.all([
    dependencies.loadViewerId(),
    dependencies.hasContactConsent(row.ownerId),
    dependencies.findSellerPseudonym(row.ownerId),
  ])
  return {
    ...listing,
    isOwner: viewerId !== null && viewerId === row.ownerId,
    contactAvailable,
    sellerPseudonym,
  }
}

export const listingStorage = {
  get databaseId(): string {
    return getServerEnv().APPWRITE_DATABASE_ID
  },
  listingsTableId: LISTINGS_TABLE_ID,
  contactsTableId: 'contacts',
}
