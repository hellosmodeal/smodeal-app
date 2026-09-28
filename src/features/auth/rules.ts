export function sessionCookieName(projectId: string): string {
  return `a_session_${projectId}`
}

export function callbackUrl(
  siteUrl: string | undefined,
  path: '/verification-email' | '/reinitialiser-mot-de-passe',
): string {
  if (!siteUrl) {
    throw new Error(
      'PUBLIC_SITE_URL doit être configurée pour envoyer cet email.',
    )
  }

  return new URL(path, siteUrl).toString()
}

export function isSafeInternalPath(path: string | undefined): boolean {
  if (!path) return false

  let decoded: string
  try {
    decoded = decodeURIComponent(path)
  } catch {
    return false
  }

  if (hasUnsafePathCharacter(decoded)) return false

  const origin = 'https://smodeal.invalid'
  try {
    return new URL(path, origin).origin === origin
  } catch {
    return false
  }
}

function hasUnsafePathCharacter(path: string): boolean {
  return [...path].some((character) => {
    const codePoint = character.codePointAt(0)
    return (
      character === '\\' ||
      codePoint === 127 ||
      (codePoint !== undefined && codePoint < 32)
    )
  })
}

export function sessionCookieOptions(
  session: { expire: string },
  { secure }: { secure: boolean },
) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    expires: new Date(session.expire),
  }
}

const ADMIN_LABEL = 'admin'

export function isAdmin(user: { labels: Array<string> }): boolean {
  return user.labels.includes(ADMIN_LABEL)
}

export function isActiveUser(user: { status: boolean }): boolean {
  return user.status
}
