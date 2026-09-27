import { z } from 'zod'

const serverEnvSchema = z.object({
  APPWRITE_ENDPOINT: z.url(),
  APPWRITE_PROJECT_ID: z.string().min(1),
  APPWRITE_API_KEY: z.string().min(1),
  APPWRITE_DATABASE_ID: z.string().min(1),
  PUBLIC_SITE_URL: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z
      .url()
      .refine(
        (value) => new URL(value).protocol === 'https:',
        'URL HTTPS requise',
      )
      .optional(),
  ),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
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
