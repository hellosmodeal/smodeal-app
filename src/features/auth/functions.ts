import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  RateLimitError,
  RateLimitUnavailableError,
} from '@/features/abuse/abuse.server'
import {
  limitAnonymousAction,
  limitMemberAction,
  requestTokenSubject,
} from '@/features/abuse/functions.server'
import { createPublicProfile } from '@/features/account/account.server'
import { getServerEnv } from '@/server/env.server'
import {
  appwriteErrorCode,
  completeEmailVerification,
  completePasswordRecovery,
  createEmailPasswordSession,
  registerAndSendVerification,
  requestPasswordRecovery,
  sendEmailVerification,
} from './auth.server'
import {
  isAdmin,
  recoveryRequestSchema,
  signInSchema,
  signUpSchema,
} from './rules'
import {
  adminClient,
  clearSession,
  guestAccount,
  loadCurrentUser,
  persistSession,
  sessionAccountFor,
  sessionClient,
} from './session.server'

export type CurrentUser = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  isAdmin: boolean
}

export type AuthResult =
  | { ok: true }
  | { ok: false; message: string; invalidLink?: boolean }

export type SignUpResult =
  | { ok: true; verificationSent: boolean }
  | { ok: false; message: string }

export type RecoveryRequestResult =
  | { ok: true; message: string }
  | { ok: false; message: string }

const tokenSchema = z.object({
  userId: z.string().min(1).max(36),
  secret: z.string().min(1).max(256),
})

const resetPasswordSchema = tokenSchema.extend({
  password: z.string().min(8).max(256),
})

type AuthFailure = { ok: false; message: string }

function toAuthError(error: unknown, fallback: string): AuthFailure {
  if (
    error instanceof RateLimitError ||
    error instanceof RateLimitUnavailableError
  )
    return { ok: false, message: error.message }
  const code = appwriteErrorCode(error)
  if (code) {
    if (code === 401) return { ok: false, message: 'Identifiants invalides.' }
    if (code === 409)
      return { ok: false, message: 'Un compte existe déjà avec cet email.' }
    if (code === 429)
      return { ok: false, message: 'Trop de tentatives, réessayez plus tard.' }
  }
  return { ok: false, message: fallback }
}

function toTokenError(error: unknown): AuthResult {
  if (
    error instanceof RateLimitError ||
    error instanceof RateLimitUnavailableError
  )
    return { ok: false, message: error.message }
  if (appwriteErrorCode(error) === 429) {
    return { ok: false, message: 'Trop de tentatives, réessayez plus tard.' }
  }
  return {
    ok: false,
    message: 'Ce lien est invalide ou expiré. Demandez-en un nouveau.',
    invalidLink: true,
  }
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
  .inputValidator(signInSchema)
  .handler(async ({ data }): Promise<AuthResult> => {
    try {
      await limitAnonymousAction('auth_signin', data.email)
      const session = await createEmailPasswordSession(
        adminClient().account,
        data,
      )
      persistSession(session)
      return { ok: true }
    } catch (error) {
      if (error instanceof Response) throw error
      return toAuthError(error, 'Connexion impossible pour le moment.')
    }
  })

export const signUp = createServerFn({ method: 'POST' })
  .inputValidator(signUpSchema)
  .handler(async ({ data }): Promise<SignUpResult> => {
    try {
      await limitAnonymousAction('auth_signup', data.email)
      const { session, verificationSent } = await registerAndSendVerification(
        adminClient().account,
        sessionAccountFor,
        // Terms acceptance is checked by the schema, never stored in Appwrite.
        { name: data.name, email: data.email, password: data.password },
        getServerEnv().PUBLIC_SITE_URL,
        createPublicProfile,
      )
      persistSession(session)
      return { ok: true, verificationSent }
    } catch (error) {
      if (error instanceof Response) throw error
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

export const requestEmailVerification = createServerFn({
  method: 'POST',
}).handler(async (): Promise<AuthResult> => {
  const client = sessionClient()
  if (!client) {
    return { ok: false, message: 'Connectez-vous pour vérifier votre email.' }
  }

  try {
    const user = await loadCurrentUser()
    if (!user)
      return { ok: false, message: 'Connectez-vous pour vérifier votre email.' }
    await limitMemberAction('auth_email_verification_resend', user.$id)
    await sendEmailVerification(client.account, getServerEnv().PUBLIC_SITE_URL)
    return { ok: true }
  } catch (error) {
    if (error instanceof Response) throw error
    return toAuthError(error, 'Envoi impossible pour le moment.')
  }
})

export const verifyEmail = createServerFn({ method: 'POST' })
  .inputValidator(tokenSchema)
  .handler(async ({ data }): Promise<AuthResult> => {
    try {
      await limitAnonymousAction(
        'auth_email_verification',
        requestTokenSubject(data.userId),
      )
      await completeEmailVerification(guestAccount(), data.userId, data.secret)
      return { ok: true }
    } catch (error) {
      if (error instanceof Response) throw error
      return toTokenError(error)
    }
  })

export const requestPasswordReset = createServerFn({ method: 'POST' })
  .inputValidator(recoveryRequestSchema)
  .handler(async ({ data }): Promise<RecoveryRequestResult> => {
    try {
      await limitAnonymousAction('auth_password_recovery', data.email)
    } catch (error) {
      if (error instanceof Response) throw error
      if (
        error instanceof RateLimitError ||
        error instanceof RateLimitUnavailableError
      ) {
        return { ok: false, message: error.message }
      }
      throw error
    }
    try {
      await requestPasswordRecovery(
        adminClient().account,
        data.email,
        getServerEnv().PUBLIC_SITE_URL,
      )
      return {
        ok: true,
        message:
          'Si un compte correspond à cette adresse, un lien de réinitialisation vient d’être envoyé.',
      }
    } catch {
      return {
        ok: false,
        message: 'Demande impossible pour le moment. Réessayez plus tard.',
      }
    }
  })

export const resetPassword = createServerFn({ method: 'POST' })
  .inputValidator(resetPasswordSchema)
  .handler(async ({ data }): Promise<AuthResult> => {
    try {
      await limitAnonymousAction(
        'auth_password_reset',
        requestTokenSubject(data.userId),
      )
      await completePasswordRecovery(
        adminClient().account,
        data.userId,
        data.secret,
        data.password,
      )
      return { ok: true }
    } catch (error) {
      if (error instanceof Response) throw error
      return toTokenError(error)
    }
  })
