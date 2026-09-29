import { z } from 'zod'

const serverEnvSchema = z
  .object({
    APPWRITE_ENDPOINT: z.url(),
    APPWRITE_PROJECT_ID: z.string().min(1),
    APPWRITE_API_KEY: z.string().min(1),
    APPWRITE_DATABASE_ID: z.string().min(1),
    PUBLIC_SITE_URL: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.url().optional(),
    ),
    PUBLIC_SITE_INDEXABLE: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z
        .enum(['true', 'false'])
        .default('true')
        .transform((value) => value === 'true'),
    ),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
  })
  .superRefine((env, ctx) => {
    if (!env.PUBLIC_SITE_URL) return
    const url = new URL(env.PUBLIC_SITE_URL)
    const endpoint = new URL(env.APPWRITE_ENDPOINT)
    const localDevelopment =
      env.NODE_ENV !== 'production' &&
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
      ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname)
    if (url.protocol !== 'https:' && !localDevelopment) {
      ctx.addIssue({
        code: 'custom',
        path: ['PUBLIC_SITE_URL'],
        message: 'URL HTTPS requise hors recette locale.',
      })
    }
  })

export type ServerEnv = z.infer<typeof serverEnvSchema>

export function parseServerEnv(
  source: Record<string, string | undefined>,
): ServerEnv {
  const result = serverEnvSchema.safeParse(source)
  if (!result.success) {
    const keys = result.error.issues.map((issue) => issue.path.join('.'))
    throw new Error(`Variables d'environnement invalides : ${keys.join(', ')}`)
  }
  return result.data
}

export function getServerEnv(): ServerEnv {
  return parseServerEnv(process.env)
}
