import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const fixtureSchema = z.object({
  memberEmail: z.email(),
  memberPassword: z.string().min(8),
  suspendedMemberSession: z.string().min(1),
  activeListingId: z.string().min(1),
  refusedListingId: z.string().min(1),
  soldListingId: z.string().min(1),
  withdrawnListingId: z.string().min(1),
})

type Fixture = z.infer<typeof fixtureSchema>

const siteUrl = 'http://localhost:18671'

async function fixture(): Promise<Fixture> {
  const values = Object.fromEntries(
    (await readFile('.qa-browser.local', 'utf8'))
      .trim()
      .split('\n')
      .map((line) => {
        const separator = line.indexOf('=')
        return [line.slice(0, separator), line.slice(separator + 1)]
      }),
  )
  return fixtureSchema.parse(values)
}

function serialize(value: unknown): string {
  let index = 0
  const node = (item: unknown): object => {
    if (typeof item === 'string') return { t: 1, s: item }
    if (typeof item === 'boolean') return { t: 2, s: item ? 2 : 3 }
    if (typeof item === 'number') return { t: 0, s: item }
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const entries = Object.entries(item)
      return {
        t: 10,
        i: index++,
        p: {
          k: entries.map(([key]) => key),
          v: entries.map(([, item]) => node(item)),
        },
      }
    }
    throw new Error('La recette ne sérialise que des objets simples.')
  }
  return JSON.stringify({ t: node(value), f: 127, m: [] })
}

async function serverFunctionId(
  sourcePath: string,
  exportName: string,
): Promise<string> {
  const source = await (await fetch(`${siteUrl}${sourcePath}`)).text()
  const id = source.match(
    new RegExp(
      `export const ${exportName} = [\\s\\S]*?createClientRpc\\("([^"]+)"\\)`,
    ),
  )?.[1]
  if (!id) throw new Error(`Fonction serveur introuvable : ${exportName}.`)
  return id
}

async function call(
  id: string,
  data: Record<string, string>,
  cookie?: string,
): Promise<{ response: Response; body: string }> {
  const response = await fetch(`${siteUrl}/_serverFn/${id}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      origin: siteUrl,
      'x-tsr-serverFn': 'true',
      ...(cookie ? { cookie } : {}),
    },
    body: serialize({ data }),
  })
  return { response, body: await response.text() }
}

describe.skipIf(process.env.SMODEAL_QA !== '1')(
  'recette HTTP contact locale',
  () => {
    it('applique le cache privé, les sessions et les droits de contact via les fonctions serveur', async () => {
      const data = await fixture()
      const [revealId, signInId] = await Promise.all([
        serverFunctionId('/src/features/contact/functions.ts', 'revealPhone'),
        serverFunctionId('/src/features/auth/functions.ts', 'signIn'),
      ])

      const anonymous = await call(revealId, {
        listingId: data.activeListingId,
      })
      expect(anonymous.response.status).toBe(200)
      expect(anonymous.response.headers.get('cache-control')).toBe(
        'private, no-store',
      )
      expect(anonymous.body).toContain('Connectez-vous pour voir le numéro.')

      const signedIn = await call(signInId, {
        email: data.memberEmail,
        password: data.memberPassword,
      })
      expect(signedIn.body).toContain('"ok"')
      const session = signedIn.response.headers
        .getSetCookie()[0]
        ?.split(';', 1)[0]
      expect(session).toBeTruthy()

      const allowed = await call(
        revealId,
        { listingId: data.activeListingId },
        session,
      )
      expect(allowed.body).toContain('0600000001')
      const refused = await call(
        revealId,
        { listingId: data.refusedListingId },
        session,
      )
      expect(refused.body).toContain(
        'Le vendeur ne souhaite pas afficher son numéro.',
      )
      await expect(
        call(
          revealId,
          { listingId: data.activeListingId },
          `a_session_smodeal-qa=${data.suspendedMemberSession}`,
        ),
      ).resolves.toMatchObject({
        body: expect.stringContaining('Connectez-vous pour voir le numéro.'),
      })

      await expect(
        fetch(`${siteUrl}/annonces/${data.soldListingId}`),
      ).resolves.toMatchObject({ status: 404 })
      await expect(
        fetch(`${siteUrl}/annonces/${data.withdrawnListingId}`),
      ).resolves.toMatchObject({ status: 404 })
    }, 30_000)

    it('renvoie 429 avec les en-têtes anti-abus après dix connexions invalides', async () => {
      const signInId = await serverFunctionId(
        '/src/features/auth/functions.ts',
        'signIn',
      )
      const throttledEmail = `limite-${randomUUID()}@smodeal.test`
      for (let attempt = 0; attempt < 10; attempt++) {
        const attemptResponse = await call(signInId, {
          email: throttledEmail,
          password: 'Mot-de-passe-invalide-QA',
        })
        expect(attemptResponse.response.status).toBe(200)
      }
      const limited = await call(signInId, {
        email: throttledEmail,
        password: 'Mot-de-passe-invalide-QA',
      })
      expect(limited.response.status).toBe(429)
      expect(limited.response.headers.get('cache-control')).toBe('no-store')
      expect(limited.response.headers.get('retry-after')).toMatch(/^\d+$/)
      expect(
        z
          .object({ ok: z.literal(false), message: z.string() })
          .parse(JSON.parse(limited.body)),
      ).toMatchObject({
        message: expect.stringMatching(/^Trop de tentatives\./),
      })
    }, 30_000)
  },
)
