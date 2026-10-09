import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import type { z } from 'zod'
import { limitCurrentMemberAction } from '@/features/abuse/functions.server'
import {
  loadAccountSettings,
  savePrivateContact,
  savePublicProfile,
} from './account.server'
import {
  type PrivateContactInput,
  type PublicProfileInput,
  privateContactSchema,
  publicProfileSchema,
} from './rules'

/** Reports only the first French message instead of serialized Zod issues. */
function parseFirstIssue<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
): z.output<Schema> {
  const result = schema.safeParse(input)
  if (!result.success)
    throw new Error(result.error.issues[0]?.message ?? 'Formulaire invalide.')
  return result.data
}

function privateResponse() {
  setResponseHeader('Cache-Control', 'private, no-store')
}

export const getAccountSettings = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Awaited<ReturnType<typeof loadAccountSettings>>> => {
    privateResponse()
    return loadAccountSettings()
  },
)

export const updatePublicProfile = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: PublicProfileInput): PublicProfileInput =>
      parseFirstIssue(publicProfileSchema, input),
  )
  .handler(
    async ({
      data,
    }): Promise<Awaited<ReturnType<typeof savePublicProfile>>> => {
      privateResponse()
      // No dedicated account action exists yet in features/abuse.
      await limitCurrentMemberAction('account_update')
      return savePublicProfile(data)
    },
  )

export const updatePrivateContact = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: PrivateContactInput): PrivateContactInput =>
      parseFirstIssue(privateContactSchema, input),
  )
  .handler(
    async ({
      data,
    }): Promise<Awaited<ReturnType<typeof savePrivateContact>>> => {
      privateResponse()
      await limitCurrentMemberAction('account_update')
      return savePrivateContact(data)
    },
  )
