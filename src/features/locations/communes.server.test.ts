import { describe, expect, it, vi } from 'vitest'
import { createGeoApi } from './communes.server'

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
    const search = createGeoApi({ fetcher }).searchCommunes

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
    await createGeoApi({ fetcher }).searchCommunes('69002')

    const url = new URL(String(fetcher.mock.calls[0]?.[0]))
    expect(url.searchParams.get('codePostal')).toBe('69002')
    expect(url.searchParams.has('nom')).toBe(false)
  })

  it('n’appelle pas le service pour une saisie trop vague', async () => {
    const fetcher = respondWith([lyon])
    await expect(
      createGeoApi({ fetcher }).searchCommunes('L'),
    ).resolves.toEqual([])
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('réutilise une réponse récente sans rappeler le service', async () => {
    const fetcher = respondWith([lyon])
    const search = createGeoApi({ fetcher }).searchCommunes

    await search('Lyon')
    await search(' lyon ')

    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('rappelle le service une fois le cache expiré', async () => {
    const fetcher = respondWith([lyon])
    let now = 0
    const search = createGeoApi({ fetcher, now: () => now }).searchCommunes

    await search('Lyon')
    now = 25 * 60 * 60 * 1000
    await search('Lyon')

    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('ne propose rien quand le service échoue, sans mettre l’échec en cache', async () => {
    const fetcher = respondWith({ message: 'indisponible' }, false)
    const search = createGeoApi({ fetcher }).searchCommunes

    await expect(search('Lyon')).resolves.toEqual([])
    fetcher.mockRejectedValueOnce(new Error('timeout'))
    await expect(search('Lyon')).resolves.toEqual([])

    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})

const annecy = {
  nom: 'Annecy',
  codesPostaux: ['74000', '74370'],
  codeDepartement: '74',
  centre: { type: 'Point', coordinates: [6.1264, 45.9024] },
}

describe('position des communes', () => {
  it('demande le centre des communes suggérées', async () => {
    const fetcher = respondWith([annecy])
    const [suggestion] = await createGeoApi({ fetcher }).searchCommunes('Ann')

    const url = new URL(String(fetcher.mock.calls[0]?.[0]))
    expect(url.searchParams.get('fields')).toContain('centre')
    expect(suggestion?.center).toEqual({ lat: 45.9024, lng: 6.1264 })
  })

  it('situe la commune d’une annonce par son nom et son code postal', async () => {
    const fetcher = respondWith([annecy])
    const { locateCity } = createGeoApi({ fetcher })

    await expect(
      locateCity({ city: 'Annecy', postalCode: '74370' }),
    ).resolves.toEqual({ lat: 45.9024, lng: 6.1264 })
    await locateCity({ city: 'ANNECY', postalCode: '74370' })

    const url = new URL(String(fetcher.mock.calls[0]?.[0]))
    expect(url.searchParams.get('nom')).toBe('Annecy')
    expect(url.searchParams.get('codePostal')).toBe('74370')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('ne situe pas une annonce quand le service échoue', async () => {
    const fetcher = respondWith({}, false)
    await expect(
      createGeoApi({ fetcher }).locateCity({
        city: 'Annecy',
        postalCode: '74000',
      }),
    ).resolves.toBeNull()
  })

  it('trouve la commune d’une position arrondie au kilomètre', async () => {
    const fetcher = respondWith([annecy])

    await expect(
      createGeoApi({ fetcher }).communeAt({ lat: 45.90678, lng: 6.12893 }),
    ).resolves.toMatchObject({ city: 'Annecy', department: '74' })
    const url = new URL(String(fetcher.mock.calls[0]?.[0]))
    expect(url.searchParams.get('lat')).toBe('45.91')
    expect(url.searchParams.get('lon')).toBe('6.13')
  })

  it('ne trouve aucune commune en pleine mer', async () => {
    const fetcher = respondWith([])
    await expect(
      createGeoApi({ fetcher }).communeAt({ lat: 47, lng: -30 }),
    ).resolves.toBeNull()
  })
})
