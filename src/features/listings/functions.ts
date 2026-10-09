import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { limitCurrentMemberAction } from '@/features/abuse/functions.server'
import {
  publicFieldsFrom,
  publicListingFieldsSchema,
  publishListingFieldsSchema,
} from './listing-form'
import {
  changeListingStatus as changeListingStatusOnServer,
  getListingForEditing as getListingForEditingOnServer,
  getSellerListings as getSellerListingsOnServer,
  type PublishListingInput,
  publishListing as publishListingOnServer,
  renewListing as renewListingOnServer,
  updateListing as updateListingOnServer,
} from './listings.server'

/**
 * Validates server function input and reports only the first issue, so the
 * interface shows a single French sentence instead of serialized Zod issues.
 */
function parseOrThrowFirstIssue<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
): z.output<Schema> {
  const result = schema.safeParse(input)
  if (!result.success)
    throw new Error(result.error.issues[0]?.message ?? 'Formulaire invalide.')
  return result.data
}

function requireFormData(input: unknown): FormData {
  if (!(input instanceof FormData)) throw new Error('Formulaire invalide.')
  return input
}

export function parseListingForm(input: unknown): PublishListingInput {
  const form = requireFormData(input)
  const photos = form
    .getAll('photos')
    .filter(
      (value) =>
        value instanceof File && !(value.name === '' && value.size === 0),
    )
  return parseOrThrowFirstIssue(publishListingFieldsSchema, {
    ...publicFieldsFrom(form),
    phone: form.get('phone'),
    displayConsent: form.get('displayConsent'),
    photos,
  })
}

export const publishListing = createServerFn({ method: 'POST' })
  .inputValidator((input: FormData) => parseListingForm(input))
  .handler(async ({ data }): Promise<{ id: string }> => {
    await limitCurrentMemberAction('listing_publish')
    return publishListingOnServer(data)
  })

export function parseListingEditForm(input: unknown) {
  const form = requireFormData(input)
  return {
    id: parseOrThrowFirstIssue(
      z
        .string({ error: 'Annonce introuvable.' })
        .min(1, 'Annonce introuvable.'),
      form.get('id'),
    ),
    data: parseOrThrowFirstIssue(
      publicListingFieldsSchema,
      publicFieldsFrom(form),
    ),
  }
}

const sellerListingsQuerySchema = z.object({
  after: z.string().min(1).optional(),
})

export const getSellerListings = createServerFn({ method: 'GET' })
  .inputValidator(sellerListingsQuerySchema)
  .handler(
    async ({
      data,
    }): Promise<Awaited<ReturnType<typeof getSellerListingsOnServer>>> =>
      getSellerListingsOnServer(data.after),
  )

const listingActionSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['sold', 'withdrawn']),
})

export const changeListingStatus = createServerFn({ method: 'POST' })
  .inputValidator(listingActionSchema)
  .handler(async ({ data }): Promise<void> => {
    await limitCurrentMemberAction('listing_status_change')
    return changeListingStatusOnServer(data.id, data.status)
  })

const renewListingSchema = z.object({ id: z.string().min(1) })

export const renewListing = createServerFn({ method: 'POST' })
  .inputValidator(renewListingSchema)
  .handler(async ({ data }): Promise<void> => {
    await limitCurrentMemberAction('listing_renew')
    return renewListingOnServer(data.id)
  })

const listingIdSchema = z.object({ id: z.string().min(1) })

export const getListingForEditing = createServerFn({ method: 'GET' })
  .inputValidator(listingIdSchema)
  .handler(
    async ({
      data,
    }): Promise<Awaited<ReturnType<typeof getListingForEditingOnServer>>> =>
      getListingForEditingOnServer(data.id),
  )

export const updateListing = createServerFn({ method: 'POST' })
  .inputValidator((input: FormData) => parseListingEditForm(input))
  .handler(async ({ data }): Promise<void> => {
    await limitCurrentMemberAction('listing_update')
    return updateListingOnServer(data.id, data.data)
  })
