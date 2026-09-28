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

export const LISTING_CATEGORIES = [
  'maison',
  'multimedia',
  'mode',
  'loisirs',
  'enfants',
  'jardin',
] as const

export const LISTING_CONDITIONS = ['new', 'like_new', 'good', 'fair'] as const

export const MAX_LISTING_PHOTOS = 5
const MAX_LISTING_PHOTO_BYTES = 5 * 1024 * 1024
const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export type PhotoMetadata = { name: string; size: number; type: string }

export function photoValidationMessage(photo: PhotoMetadata): string | null {
  if (
    !ACCEPTED_PHOTO_TYPES.includes(
      photo.type as (typeof ACCEPTED_PHOTO_TYPES)[number],
    )
  )
    return 'Les photos doivent être au format JPG, PNG ou WebP.'
  if (photo.size <= 0 || photo.size > MAX_LISTING_PHOTO_BYTES)
    return 'Chaque photo doit peser au maximum 5 Mo.'
  return null
}

export function hasExpectedPhotoSignature(
  bytes: Uint8Array,
  type: string,
): boolean {
  if (
    type === 'image/jpeg' &&
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
    return true
  if (
    type === 'image/png' &&
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return true
  return (
    type === 'image/webp' &&
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  )
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

export function canChangeListingStatus(
  listing: ListingLifecycle,
  actorId: string,
): boolean {
  return canManageListing(listing, actorId) && listing.status === 'active'
}
