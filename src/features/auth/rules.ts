export function sessionCookieName(projectId: string): string {
  return `a_session_${projectId}`
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
