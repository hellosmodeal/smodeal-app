import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { AppwriteException, ID } from 'node-appwrite'
import { z } from 'zod'

import { isAdmin } from './rules'
import {
  adminClient,
  clearSession,
  loadCurrentUser,
  persistSession,
  sessionClient,
} from './session.server'

export type CurrentUser = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  isAdmin: boolean
}

export type AuthResult = { ok: true } | { ok: false; message: string }

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(256),
})

const signUpSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(40),
})

function toAuthError(error: unknown, fallback: string): AuthResult {
  if (error instanceof AppwriteException) {
    if (error.code === 401)
      return { ok: false, message: 'Identifiants invalides.' }
    if (error.code === 409)
      return { ok: false, message: 'Un compte existe déjà avec cet email.' }
    if (error.code === 429)
      return { ok: false, message: 'Trop de tentatives, réessayez plus tard.' }
  }
  return { ok: false, message: fallback }
}

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CurrentUser | null> => {
    const user = await loadCurrentUser()
    if (!user) return null
    return {
      id: user.$id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerification,
      isAdmin: isAdmin(user),
    }
  },
)

export const signIn = createServerFn({ method: 'POST' })
  .inputValidator(credentialsSchema)
  .handler(async ({ data }): Promise<AuthResult> => {
    try {
      const session =
        await adminClient().account.createEmailPasswordSession(data)
      persistSession(session)
      return { ok: true }
    } catch (error) {
      return toAuthError(error, 'Connexion impossible pour le moment.')
    }
  })

export const signUp = createServerFn({ method: 'POST' })
  .inputValidator(signUpSchema)
  .handler(async ({ data }): Promise<AuthResult> => {
    try {
      const { account } = adminClient()
      await account.create({ userId: ID.unique(), ...data })
      const session = await account.createEmailPasswordSession({
        email: data.email,
        password: data.password,
      })
      persistSession(session)
      return { ok: true }
    } catch (error) {
      return toAuthError(error, 'Inscription impossible pour le moment.')
    }
  })

export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  const client = sessionClient()
  if (client) {
    await client.account
      .deleteSession({ sessionId: 'current' })
      .catch(() => undefined)
  }
  clearSession()
  throw redirect({ to: '/' })
})
