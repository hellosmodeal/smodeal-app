import { z } from 'zod'

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
export type ReportInput = z.infer<typeof reportSchema>
export type RemovalInput = z.infer<typeof removalSchema>
export type ModerationActor = { id: string; labels: string[] }
export type OpenReport = {
  id: string
  listingId: string
  reason: string
  createdAt: string
}
