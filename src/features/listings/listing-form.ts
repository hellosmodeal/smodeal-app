import { z } from 'zod'
import { phoneSchema } from '@/features/contact/rules'
import { priceInputToCents } from './price-input'
import {
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  MAX_LISTING_PHOTOS,
} from './rules'

/** Shared by the browser form and the server function: no server import. */

export type UploadedPhoto = {
  name: string
  size: number
  type: string
  arrayBuffer: () => Promise<ArrayBuffer>
}

const stringField = (message: string, max: number) =>
  z
    .string({ error: message })
    .trim()
    .min(1, message)
    .max(max, `Maximum ${max} caractères.`)

export const publicListingFieldsSchema = z.object({
  title: stringField('Indiquez un titre.', 120),
  description: stringField('Décrivez votre annonce.', 10_000),
  categorySlug: z.enum(LISTING_CATEGORIES, {
    error: 'Choisissez une catégorie.',
  }),
  condition: z.enum(LISTING_CONDITIONS, {
    error: 'Choisissez l’état de l’objet.',
  }),
  priceCents: z.coerce
    .number({ error: 'Indiquez un prix valide.' })
    .int('Indiquez un prix valide.')
    .min(0, 'Indiquez un prix valide.')
    .max(2_000_000_000, 'Le prix dépasse le montant maximum autorisé.'),
  city: stringField('Indiquez une ville.', 120),
  postalCode: z
    .string({ error: 'Indiquez un code postal à 5 chiffres.' })
    .regex(/^\d{5}$/, 'Indiquez un code postal à 5 chiffres.'),
  department: z
    .string({ error: 'Indiquez un département valide.' })
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

export const publishListingFieldsSchema = z.object({
  ...publicListingFieldsSchema.shape,
  phone: phoneSchema,
  displayConsent: z
    .union([z.literal('on'), z.null()])
    .transform((value) => value === 'on'),
  photos: z
    .array(uploadSchema)
    .max(
      MAX_LISTING_PHOTOS,
      `${MAX_LISTING_PHOTOS} photos maximum par annonce.`,
    ),
})

export function publicFieldsFrom(form: FormData) {
  return {
    title: form.get('title'),
    description: form.get('description'),
    categorySlug: form.get('categorySlug'),
    condition: form.get('condition'),
    priceCents: form.get('priceCents'),
    city: form.get('city'),
    postalCode: form.get('postalCode'),
    department: form.get('department'),
  }
}

/**
 * Every field error of the publish form at once, keyed by input name, with the
 * same schema as the server. The price is typed in euros (`priceEuros`).
 */
export function publishListingFieldErrors(
  form: FormData,
): Record<string, string> {
  const errors: Record<string, string> = {}
  let priceCents: number | null = null
  try {
    priceCents = priceInputToCents(String(form.get('priceEuros') ?? ''))
  } catch (reason) {
    errors.priceEuros =
      reason instanceof Error ? reason.message : 'Indiquez un prix valide.'
  }
  const result = publishListingFieldsSchema.safeParse({
    ...publicFieldsFrom(form),
    priceCents: priceCents ?? 0,
    phone: form.get('phone'),
    displayConsent: form.get('displayConsent'),
    photos: [],
  })
  if (result.success) return errors
  for (const issue of result.error.issues) {
    const path = String(issue.path[0] ?? '')
    const field = path === 'priceCents' ? 'priceEuros' : path
    if (field && !errors[field]) errors[field] = issue.message
  }
  return errors
}

/** Steps of the publish form, with their inputs in page order. */
export const PUBLISH_STEPS = [
  {
    title: 'Votre objet',
    fields: ['title', 'categorySlug', 'condition', 'description'],
  },
  { title: 'Photos', fields: [] },
  {
    title: 'Prix et lieu',
    fields: ['priceEuros', 'postalCode', 'city', 'department'],
  },
  { title: 'Coordonnées', fields: ['phone', 'displayConsent'] },
] as const satisfies readonly { title: string; fields: readonly string[] }[]

export function stepFieldErrors(
  step: number,
  errors: Record<string, string>,
): Record<string, string> {
  const fields: readonly string[] = PUBLISH_STEPS[step]?.fields ?? []
  return Object.fromEntries(
    Object.entries(errors).filter(([field]) => fields.includes(field)),
  )
}

export function firstStepWithErrors(
  errors: Record<string, string>,
): number | null {
  const step = PUBLISH_STEPS.findIndex(
    (_, index) => Object.keys(stepFieldErrors(index, errors)).length > 0,
  )
  return step === -1 ? null : step
}
