import { type FormEvent, useState } from 'react'
import type { z } from 'zod'
import { assertMutationSucceeded } from '@/features/abuse/result'
import { accountFieldErrors } from '../rules'

type MutationResult = { ok: true } | { ok: false; message: string }

/**
 * Shared submit cycle of the account forms: client validation with the same
 * Zod schema as the server, pending state, success and error feedback.
 */
export function useAccountForm<Schema extends z.ZodType>({
  schema,
  read,
  submit,
  successMessage,
}: {
  schema: Schema
  read: (form: HTMLFormElement) => unknown
  submit: (data: z.output<Schema>) => Promise<MutationResult>
  successMessage: string
}) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    const values = read(event.currentTarget)
    const errors = accountFieldErrors(schema, values)
    setFieldErrors(errors)
    if (Object.keys(errors).length) return
    setPending(true)
    try {
      const result = await submit(schema.parse(values))
      assertMutationSucceeded(result)
      setSuccess(successMessage)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Enregistrement impossible pour le moment. Réessayez plus tard.',
      )
    } finally {
      setPending(false)
    }
  }

  return { fieldErrors, error, success, pending, onSubmit }
}
