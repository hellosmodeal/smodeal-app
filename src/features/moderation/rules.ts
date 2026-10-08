import { z } from 'zod'
import { isListingStatus, listingStatusLabel } from '@/features/listings/rules'

const identifier = z
  .string()
  .min(1)
  .max(36)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/, 'Identifiant invalide.')
const reason = z
  .string()
  .trim()
  .min(10, 'Précisez le motif en au moins 10 caractères.')
  .max(500, 'Le motif est limité à 500 caractères.')

export const reportSchema = z.object({ listingId: identifier, reason })
export const removalSchema = z.object({
  reportId: identifier,
  reason,
  action: z.enum(['remove', 'dismiss']).optional(),
})
export const suspensionSchema = z.object({ reportId: identifier, reason })
export type ReportInput = z.infer<typeof reportSchema>
export type RemovalInput = z.infer<typeof removalSchema>
export type SuspensionInput = z.infer<typeof suspensionSchema>
export type ModerationActor = { id: string; labels: string[] }
export type ReportedListing = {
  title: string
  status: string
  publiclyVisible: boolean
}
export type OpenReport = {
  id: string
  listingId: string
  reason: string
  createdAt: string
  listing: ReportedListing | null
}
export type ModerationErrorCode =
  | 'forbidden'
  | 'already_handled'
  | 'self_suspension'
  | 'admin_suspension'
  | 'invalid'
  | 'unavailable'
export type ModerationActionResult =
  | { ok: true }
  | { ok: false; code: ModerationErrorCode; message: string }

export function reportedListingStatusLabel(
  listing: ReportedListing | null,
): string {
  if (!listing) return 'Annonce supprimée'
  if (listing.status === 'active' && !listing.publiclyVisible) return 'Expirée'
  if (listing.status === 'withdrawn') return 'Retirée par le vendeur'
  return isListingStatus(listing.status)
    ? listingStatusLabel(listing.status)
    : listing.status
}
