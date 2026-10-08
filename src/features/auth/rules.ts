import { z } from 'zod'

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

export function safeRedirect(path: string | undefined): string | undefined {
  return isSafeInternalPath(path) ? path : undefined
}

export const authRedirectSearchSchema = z.object({
  redirect: z
    .string()
    .max(2048)
    .optional()
    .catch(undefined)
    .transform(safeRedirect),
})

const email = z.email('Saisissez une adresse email valide.')
const password = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
  .max(256, 'Le mot de passe est limité à 256 caractères.')

export const signInSchema = z.object({ email, password })

export const recoveryRequestSchema = z.object({ email })

export const signUpSchema = signInSchema.extend({
  name: z
    .string()
    .trim()
    .min(2, 'Le pseudonyme doit contenir au moins 2 caractères.')
    .max(40, 'Le pseudonyme est limité à 40 caractères.'),
})

export function authFieldErrors(
  schema: z.ZodType,
  values: Record<string, string>,
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
