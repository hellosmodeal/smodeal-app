import {
  deleteCookie,
  getCookie,
  getRequestHeader,
  setCookie,
} from '@tanstack/react-start/server'
import type { Models } from 'node-appwrite'
import { AppwriteException } from 'node-appwrite'
import {
  createAdminClient,
  createSessionClient,
} from '@/server/appwrite.server'
import { getServerEnv } from '@/server/env.server'
import { sessionCookieName, sessionCookieOptions } from './rules'

function cookieName() {
  return sessionCookieName(getServerEnv().APPWRITE_PROJECT_ID)
}

function userAgent() {
  return getRequestHeader('user-agent')
}

export function adminClient() {
  return createAdminClient(userAgent())
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

export async function loadCurrentUser() {
  const client = sessionClient()
  if (!client) return null
  try {
    return await client.account.get()
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 401) return null
    throw error
  }
}
