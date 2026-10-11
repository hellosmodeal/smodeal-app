import { describe, expect, it } from 'vitest'
import {
  type CitySuggestion,
  citySuggestionsFromCommunes,
  communeCenter,
  departmentSuggestions,
  distanceKm,
  locationLookup,
  postalCodeAfterCityChoice,
  roundCoordinate,
} from './rules'

const lyon: CitySuggestion = {
  city: 'Lyon',
  postalCodes: ['69001', '69002', '69003'],
  department: '69',
}

describe('recherche de localisation', () => {
  it('cherche par code postal quand la saisie compte 5 chiffres', () => {
    expect(locationLookup(' 69003 ')).toEqual({
      kind: 'postalCode',
      value: '69003',
    })
  })

  it('cherche par nom de commune à partir de 2 caractères', () => {
    expect(locationLookup('Ly')).toEqual({ kind: 'name', value: 'Ly' })
  })

  it.each(['', 'L', '690', '6900', '690031'])(
    'ne cherche rien pour « %s »',
    (query) => {
      expect(locationLookup(query)).toBeNull()
    },
  )
})

describe('suggestions de communes', () => {
  it('garde le nom, les codes postaux et le département de chaque commune', () => {
    expect(
      citySuggestionsFromCommunes([
        {
          nom: 'Lyon',
          codesPostaux: ['69001', '69002', '69003'],
          codeDepartement: '69',
          code: '69123',
        },
      ]),
    ).toEqual([lyon])
  })

  it('écarte les communes incomplètes et une réponse inattendue', () => {
    expect(
      citySuggestionsFromCommunes([
        { nom: 'Sans code', codesPostaux: [], codeDepartement: '01' },
        { nom: 'Sans département', codesPostaux: ['01000'] },
      ]),
    ).toEqual([])
    expect(citySuggestionsFromCommunes({ message: 'erreur' })).toEqual([])
  })

  it('limite le nombre de suggestions', () => {
    const communes = Array.from({ length: 12 }, (_, index) => ({
      nom: `Commune ${index}`,
      codesPostaux: ['01000'],
      codeDepartement: '01',
    }))
    expect(citySuggestionsFromCommunes(communes)).toHaveLength(8)
  })
})

describe('code postal après le choix d’une ville', () => {
  it('garde le code postal saisi s’il appartient à la commune', () => {
    expect(postalCodeAfterCityChoice('69002', lyon)).toBe('69002')
  })

  it('reprend le code postal unique de la commune', () => {
    expect(
      postalCodeAfterCityChoice('75011', {
        city: 'Annecy',
        postalCodes: ['74000'],
        department: '74',
      }),
    ).toBe('74000')
  })

  it('vide le code postal quand la commune en a plusieurs', () => {
    expect(postalCodeAfterCityChoice('75011', lyon)).toBe('')
  })
})

describe('suggestions de départements', () => {
  it('trouve un département par son nom, sans tenir compte des accents', () => {
    expect(departmentSuggestions('rhone')).toEqual([
      { code: '69', name: 'Rhône' },
      { code: '13', name: 'Bouches-du-Rhône' },
    ])
  })

  it('trouve un département par son code', () => {
    expect(departmentSuggestions('2a')).toEqual([
      { code: '2A', name: 'Corse-du-Sud' },
    ])
  })

  it('ne propose rien pour une saisie trop courte', () => {
    expect(departmentSuggestions('r')).toEqual([])
  })
})

const annecyCommune = {
  nom: 'Annecy',
  codesPostaux: ['74000', '74370'],
  codeDepartement: '74',
  centre: { type: 'Point', coordinates: [6.1264, 45.9024] },
}

describe('centre des communes', () => {
  it('ajoute le centre de la commune à la suggestion', () => {
    expect(citySuggestionsFromCommunes([annecyCommune])[0]?.center).toEqual({
      lat: 45.9024,
      lng: 6.1264,
    })
  })

  it('ignore un centre hors des bornes terrestres', () => {
    const broken = {
      ...annecyCommune,
      centre: { type: 'Point', coordinates: [6.1, 145] },
    }
    expect(citySuggestionsFromCommunes([broken])[0]?.center).toBeUndefined()
  })

  it('retient la commune dont le nom et le code postal correspondent', () => {
    const seynod = {
      nom: 'Seynod',
      codesPostaux: ['74600'],
      codeDepartement: '74',
      centre: { type: 'Point', coordinates: [6.09, 45.88] },
    }
    expect(
      communeCenter([seynod, annecyCommune], {
        city: 'annecy',
        postalCode: '74370',
      }),
    ).toEqual({ lat: 45.9024, lng: 6.1264 })
  })

  it('ne devine pas un centre quand aucune commune ne correspond', () => {
    expect(
      communeCenter([annecyCommune], { city: 'Annecy', postalCode: '69001' }),
    ).toBeNull()
    expect(
      communeCenter('erreur', { city: 'Annecy', postalCode: '74000' }),
    ).toBeNull()
  })
})

describe('coordonnées', () => {
  it('arrondit une position au centième de degré, environ un kilomètre', () => {
    expect(roundCoordinate(45.906_789)).toBe(45.91)
    expect(roundCoordinate(-1.554_9)).toBe(-1.55)
  })

  it('mesure la distance à vol d’oiseau en kilomètres', () => {
    const paris = { lat: 48.8566, lng: 2.3522 }
    const lyon = { lat: 45.764, lng: 4.8357 }
    expect(distanceKm(paris, lyon)).toBeCloseTo(391.5, 0)
    expect(distanceKm(paris, paris)).toBe(0)
  })
})
