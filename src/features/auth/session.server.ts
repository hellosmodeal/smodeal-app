import {
  deleteCookie,
  getCookie,
  getRequestHeader,
  setCookie,
} from '@tanstack/react-start/server'
import type { Account, Models } from 'node-appwrite'
import { AppwriteException } from 'node-appwrite'
import {
  createAdminClient,
  createGuestAccount,
  createSessionClient,
} from '@/server/appwrite.server'
import { getServerEnv } from '@/server/env.server'
import { isActiveUser, sessionCookieName, sessionCookieOptions } from './rules'

function cookieName() {
  return sessionCookieName(getServerEnv().APPWRITE_PROJECT_ID)
}

function userAgent() {
  return getRequestHeader('user-agent')
}

export function adminClient() {
  return createAdminClient(userAgent())
}

export function guestAccount() {
  return createGuestAccount(userAgent())
}

export function persistSession(session: Models.Session) {
  setCookie(
    cookieName(),
    session.secret,
    sessionCookieOptions(session, {
      secure: getServerEnv().NODE_ENV === 'production',
    }),
  )
}

export function clearSession() {
  deleteCookie(cookieName(), { path: '/' })
}

export function sessionClient() {
  const secret = getCookie(cookieName())
  return secret ? createSessionClient(secret, userAgent()) : null
}

export function sessionAccountFor(secret: string) {
  return createSessionClient(secret, userAgent()).account
}

export async function loadCurrentUser(
  account: Pick<Account, 'get'> | null = sessionClient()?.account ?? null,
) {
  if (!account) return null
  try {
    const user = await account.get()
    return isActiveUser(user) ? user : null
  } catch (error) {
    if (
      error instanceof AppwriteException &&
      (error.code === 401 ||
        (error.code === 403 && error.type === 'user_blocked'))
    )
      return null
    throw error
  }
}
