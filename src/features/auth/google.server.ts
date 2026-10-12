import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server'
import { ensurePublicProfile } from '@/features/account/account.server'
import { getServerEnv } from '@/server/env.server'
import { completeGoogleSignIn, startGoogleSignIn } from './auth.server'
import { googleSignInUrls, isExpectedOAuthState, safeRedirect } from './rules'
import { adminClient, persistSession } from './session.server'

const STATE_COOKIE = 'smodeal_oauth_state'
const STATE_COOKIE_PATH = '/connexion/google'

function siteOrigin(request: Request): string {
  return getServerEnv().PUBLIC_SITE_URL ?? new URL(request.url).origin
}

function redirectTo(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location, 'Cache-Control': 'no-store' },
  })
}

export async function handleGoogleSignInStart(
  request: Request,
): Promise<Response> {
  const redirect = new URL(request.url).searchParams.get('redirect')
  const state = crypto.randomUUID()
  const urls = googleSignInUrls(
    siteOrigin(request),
    redirect ?? undefined,
    state,
  )
  setCookie(STATE_COOKIE, state, {
    httpOnly: true,
    secure: getServerEnv().NODE_ENV === 'production',
    sameSite: 'lax',
    path: STATE_COOKIE_PATH,
    maxAge: 600,
  })
  try {
    return redirectTo(await startGoogleSignIn(adminClient().account, urls))
  } catch {
    return redirectTo(urls.failure)
  }
}

export async function handleGoogleSignInReturn(
  request: Request,
): Promise<Response> {
  const params = new URL(request.url).searchParams
  const redirect = safeRedirect(params.get('redirect') ?? undefined)
  const userId = params.get('userId') ?? ''
  const secret = params.get('secret') ?? ''
  const { failure } = googleSignInUrls(siteOrigin(request), redirect)
  const expectedState = getCookie(STATE_COOKIE)
  deleteCookie(STATE_COOKIE, { path: STATE_COOKIE_PATH })
  if (!isExpectedOAuthState(params.get('state'), expectedState))
    return redirectTo(failure)
  if (!userId || userId.length > 36 || !secret || secret.length > 512)
    return redirectTo(failure)
  try {
    const { account, users } = adminClient()
    const session = await completeGoogleSignIn(
      account,
      users,
      { userId, secret },
      ensurePublicProfile,
    )
    persistSession(session)
    return redirectTo(redirect ?? '/compte')
  } catch {
    return redirectTo(failure)
  }
}
