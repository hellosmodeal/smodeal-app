import { describe, expect, it } from 'vitest'
import { filterPreviewListings } from './home-preview'

describe('filterPreviewListings', () => {
  it('retrouve un exemple sans tenir compte des accents ni de la casse', () => {
    const result = filterPreviewListings({
      keyword: 'VELO',
      city: '',
      category: '',
    })

    expect(result.map((listing) => listing.title)).toEqual([
      'Vélo de ville vert sauge',
    ])
  })

  it('combine la catégorie et la ville', () => {
    const result = filterPreviewListings({
      keyword: '',
      city: 'LYON',
      category: 'maison',
    })

    expect(result.map((listing) => listing.title)).toEqual(['Canapé 3 places'])
  })

  it('renvoie une liste vide si aucun exemple ne correspond', () => {
    expect(
      filterPreviewListings({ keyword: 'introuvable', city: '', category: '' }),
    ).toEqual([])
  })

  it('filtre les prix et trie les résultats du moins cher au plus cher', () => {
    const result = filterPreviewListings({
      keyword: '',
      city: '',
      category: 'maison',
      minPrice: 80,
      maxPrice: 160,
      sort: 'price-asc',
    })
    expect(result.map((listing) => listing.price)).toEqual([85, 150])
  })
})
