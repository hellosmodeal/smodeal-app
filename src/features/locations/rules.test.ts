import { describe, expect, it } from 'vitest'
import {
  type CitySuggestion,
  citySuggestionsFromCommunes,
  departmentSuggestions,
  locationLookup,
  postalCodeAfterCityChoice,
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
