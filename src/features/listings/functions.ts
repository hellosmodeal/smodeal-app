import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { limitCurrentMemberAction } from '@/features/abuse/functions.server'
import {
  changeListingStatus as changeListingStatusOnServer,
  getListingForEditing as getListingForEditingOnServer,
  getSellerListings as getSellerListingsOnServer,
  type PublishListingInput,
  publishListing as publishListingOnServer,
  renewListing as renewListingOnServer,
  type UploadedPhoto,
  updateListing as updateListingOnServer,
} from './listings.server'
import {
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  MAX_LISTING_PHOTOS,
} from './rules'

const stringField = (message: string, max: number) =>
  z.string().trim().min(1, message).max(max, `Maximum ${max} caractères.`)

const publicListingFieldsSchema = z.object({
  title: stringField('Indiquez un titre.', 120),
  description: stringField('Décrivez votre annonce.', 10_000),
  categorySlug: z.enum(LISTING_CATEGORIES),
  condition: z.enum(LISTING_CONDITIONS),
  priceCents: z.coerce.number().int().min(0).max(2_000_000_000),
  city: stringField('Indiquez une ville.', 120),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, 'Indiquez un code postal à 5 chiffres.'),
  department: z
    .string()
    .regex(/^(\d{2}|2A|2B|97\d|98\d)$/, 'Indiquez un département valide.'),
})

const uploadSchema = z.custom<UploadedPhoto>(
  (value) =>
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'size' in value &&
    'type' in value &&
    'arrayBuffer' in value,
  'Fichier invalide.',
)

export const listingFormSchema = z
  .custom<FormData>(
    (value) => value instanceof FormData,
    'Formulaire invalide.',
  )
  .transform((form): PublishListingInput => {
    const photos = form
      .getAll('photos')
      .filter(
        (value) =>
          value instanceof File && !(value.name === '' && value.size === 0),
      )
    return z
      .object({
        ...publicListingFieldsSchema.shape,
        phone: z
          .string()
          .trim()
          .transform((value) => value.replace(/[\s.()-]/g, ''))
          .refine(
            (value) =>
              /^0[1-9]\d{8}$/.test(value) || /^\+[1-9]\d{7,14}$/.test(value),
            'Indiquez un numéro de téléphone valide.',
          ),
        displayConsent: z
          .union([z.literal('on'), z.null()])
          .transform((value) => value === 'on'),
        photos: z.array(uploadSchema).max(MAX_LISTING_PHOTOS),
      })
      .parse({
        title: form.get('title'),
        description: form.get('description'),
        categorySlug: form.get('categorySlug'),
        condition: form.get('condition'),
        priceCents: form.get('priceCents'),
        city: form.get('city'),
        postalCode: form.get('postalCode'),
        department: form.get('department'),
        phone: form.get('phone'),
        displayConsent: form.get('displayConsent'),
        photos,
      })
  })

export const publishListing = createServerFn({ method: 'POST' })
  .inputValidator(listingFormSchema)
  .handler(async ({ data }): Promise<{ id: string }> => {
    await limitCurrentMemberAction('listing_publish')
    return publishListingOnServer(data)
  })

export const listingEditFormSchema = z
  .custom<FormData>(
    (value) => value instanceof FormData,
    'Formulaire invalide.',
  )
  .transform((form) =>
    publicListingFieldsSchema.parse({
      title: form.get('title'),
      description: form.get('description'),
      categorySlug: form.get('categorySlug'),
      condition: form.get('condition'),
      priceCents: form.get('priceCents'),
      city: form.get('city'),
      postalCode: form.get('postalCode'),
      department: form.get('department'),
    }),
  )

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
  .inputValidator(
    z
      .custom<FormData>(
        (value) => value instanceof FormData,
        'Formulaire invalide.',
      )
      .transform((form) => ({
        id: z.string().min(1).parse(form.get('id')),
        data: listingEditFormSchema.parse(form),
      })),
  )
  .handler(async ({ data }): Promise<void> => {
    await limitCurrentMemberAction('listing_update')
    return updateListingOnServer(data.id, data.data)
  })
