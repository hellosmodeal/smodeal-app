import { z } from 'zod'
import { signUpSchema } from '@/features/auth/rules'
import { phoneSchema } from '@/features/contact/rules'

export type AccountMember = {
  id: string
  suspended: boolean
}

export function canEditAccount(member: AccountMember | null): boolean {
  return member !== null && !member.suspended
}

export const publicProfileSchema = z.object({
  pseudonym: signUpSchema.shape.name,
})

export type PublicProfileInput = z.infer<typeof publicProfileSchema>

export const privateContactSchema = z.object({
  phone: phoneSchema,
  displayConsent: z.boolean({
    error: 'Indiquez si votre numéro peut être affiché.',
  }),
})

export type PrivateContactInput = z.infer<typeof privateContactSchema>

/** First French message per field, for inline form errors. */
export function accountFieldErrors(
  schema: z.ZodType,
  values: unknown,
): Record<string, string> {
  const result = schema.safeParse(values)
  if (result.success) return {}
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? '')
    if (field && !errors[field]) errors[field] = issue.message
  }
  return errors
}
