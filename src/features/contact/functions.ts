import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { z } from 'zod'
import { revealListingPhone } from './contact.server'

const listingIdSchema = z.object({
  listingId: z.string().regex(/^[A-Za-z0-9._-]{1,36}$/, 'Annonce invalide.'),
})

export type PhoneRevealResult =
  | { ok: true; phone: string }
  | { ok: false; message: string }

export const revealPhone = createServerFn({ method: 'POST' })
  .inputValidator(listingIdSchema)
  .handler(async ({ data }): Promise<PhoneRevealResult> => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return revealListingPhone(data.listingId)
  })
