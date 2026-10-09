import { describe, expect, it, vi } from 'vitest'
import { createCommuneSearch } from './communes.server'

const lyon = {
  nom: 'Lyon',
  codesPostaux: ['69001', '69002'],
  codeDepartement: '69',
}

function respondWith(body: unknown, ok = true) {
  return vi.fn(async (_url: string, _init?: RequestInit) =>
    Response.json(body, { status: ok ? 200 : 500 }),
  )
}

describe('recherche de communes sur geo.api.gouv.fr', () => {
  it('cherche par nom, triée par population', async () => {
    const fetcher = respondWith([lyon])
    const search = createCommuneSearch({ fetcher })

    await expect(search('Lyo')).resolves.toEqual([
      { city: 'Lyon', postalCodes: ['69001', '69002'], department: '69' },
    ])
    const url = new URL(String(fetcher.mock.calls[0]?.[0]))
    expect(url.origin + url.pathname).toBe('https://geo.api.gouv.fr/communes')
    expect(url.searchParams.get('nom')).toBe('Lyo')
    expect(url.searchParams.get('boost')).toBe('population')
  })

  it('cherche par code postal', async () => {
    const fetcher = respondWith([lyon])
    await createCommuneSearch({ fetcher })('69002')

    const url = new URL(String(fetcher.mock.calls[0]?.[0]))
    expect(url.searchParams.get('codePostal')).toBe('69002')
    expect(url.searchParams.has('nom')).toBe(false)
  })

  it('n’appelle pas le service pour une saisie trop vague', async () => {
    const fetcher = respondWith([lyon])
    await expect(createCommuneSearch({ fetcher })('L')).resolves.toEqual([])
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('réutilise une réponse récente sans rappeler le service', async () => {
    const fetcher = respondWith([lyon])
    const search = createCommuneSearch({ fetcher })

    await search('Lyon')
    await search(' lyon ')

    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('rappelle le service une fois le cache expiré', async () => {
    const fetcher = respondWith([lyon])
    let now = 0
    const search = createCommuneSearch({ fetcher, now: () => now })

    await search('Lyon')
    now = 25 * 60 * 60 * 1000
    await search('Lyon')

    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('ne propose rien quand le service échoue, sans mettre l’échec en cache', async () => {
    const fetcher = respondWith({ message: 'indisponible' }, false)
    const search = createCommuneSearch({ fetcher })

    await expect(search('Lyon')).resolves.toEqual([])
    fetcher.mockRejectedValueOnce(new Error('timeout'))
    await expect(search('Lyon')).resolves.toEqual([])

    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
