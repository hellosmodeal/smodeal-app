const LISTING_STATUSES = [
  'active',
  'sold',
  'expired',
  'withdrawn',
  'removed_by_moderation',
] as const

type ListingStatus = (typeof LISTING_STATUSES)[number]

const LISTING_LIFETIME_DAYS = 60

const DAY_MS = 24 * 60 * 60 * 1000

export type ListingLifecycle = {
  ownerId: string
  status: ListingStatus
  expiresAt: string
}

export function computeExpiresAt(publishedAt: Date): string {
  return new Date(
    publishedAt.getTime() + LISTING_LIFETIME_DAYS * DAY_MS,
  ).toISOString()
}

function isPastExpiry(listing: ListingLifecycle, now: Date): boolean {
  return new Date(listing.expiresAt).getTime() <= now.getTime()
}

export function isPubliclyVisible(
  listing: ListingLifecycle,
  now: Date,
): boolean {
  return listing.status === 'active' && !isPastExpiry(listing, now)
}

export function canManageListing(
  listing: ListingLifecycle,
  actorId: string,
): boolean {
  return (
    listing.ownerId === actorId && listing.status !== 'removed_by_moderation'
  )
}

export function canRenewListing(
  listing: ListingLifecycle,
  actorId: string,
  now: Date,
): boolean {
  if (listing.ownerId !== actorId) return false
  if (listing.status === 'expired') return true
  return listing.status === 'active' && isPastExpiry(listing, now)
}
