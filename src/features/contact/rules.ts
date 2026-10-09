import { z } from 'zod'

export type Viewer = {
  id: string
  suspended: boolean
}

export type SellerContact = {
  ownerId: string
  displayConsent: boolean
}

export function canRevealPhone(
  viewer: Viewer | null,
  contact: SellerContact,
): boolean {
  if (!viewer || viewer.suspended) return false
  if (viewer.id === contact.ownerId) return true
  return contact.displayConsent
}

export function formatPhoneForDisplay(phone: string): string {
  const compact = phone.replace(/[\s.\-()]/g, '')
  if (/^0\d{9}$/.test(compact)) return compact.replace(/(\d{2})(?=\d)/g, '$1 ')
  const international = /^\+33([1-9])(\d{8})$/.exec(compact)
  if (international)
    return `+33 ${international[1]} ${international[2].replace(/(\d{2})(?=\d)/g, '$1 ')}`
  return phone.trim()
}

const INVALID_PHONE_MESSAGE = 'Indiquez un numéro de téléphone valide.'

/**
 * Private phone number accepted from a member: French 10-digit number or
 * international `+` number, stored without separators.
 */
export const phoneSchema = z
  .string({ error: INVALID_PHONE_MESSAGE })
  .trim()
  .transform((value) => value.replace(/[\s.()-]/g, ''))
  .refine(
    (value) => /^0[1-9]\d{8}$/.test(value) || /^\+[1-9]\d{7,14}$/.test(value),
    INVALID_PHONE_MESSAGE,
  )

export const PHONE_CONSENT_LABEL = 'Partager mon numéro avec les acheteurs'
export const PHONE_CONSENT_HINT =
  'Seuls les membres connectés qui souhaitent vous contacter pourront le voir. Sans cet accord, vos annonces restent visibles mais aucun acheteur ne pourra vous contacter. Ce choix s’applique à toutes vos annonces.'
