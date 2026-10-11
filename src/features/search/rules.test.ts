import { describe, expect, it } from 'vitest'
import {
  buildPaginationWindow,
  categoryLabel,
  clearFilters,
  describeResults,
  formatDistance,
  formatPrice,
  formatPublishedAgo,
  hasFilters,
  listDepartments,
  parseSearchCriteria,
  requiresLongerKeyword,
  type SearchListing,
  searchArea,
  searchListings,
} from './rules'

const now = new Date('2026-09-27T12:00:00Z')

function listing(
  overrides: Partial<SearchListing> & Pick<SearchListing, 'id'>,
): SearchListing {
  return {
    title: 'Objet fictif',
    category: 'maison',
    priceCents: 10_000,
    city: 'Lyon',
    postalCode: '69003',
    departmentCode: '69',
    departmentName: 'Rhône',
    publishedAt: '2026-09-27T10:00:00Z',
    ...overrides,
  }
}

const listings: SearchListing[] = [
  listing({
    id: 'velo-nantes',
    title: 'Vélo de ville',
    category: 'loisirs',
    priceCents: 9_500,
    city: 'Nantes',
    postalCode: '44000',
    departmentCode: '44',
    departmentName: 'Loire-Atlantique',
    publishedAt: '2026-09-27T11:00:00Z',
  }),
  listing({
    id: 'velo-lyon',
    title: 'VÉLO pliant',
    category: 'loisirs',
    priceCents: 22_000,
    publishedAt: '2026-09-26T09:00:00Z',
  }),
  listing({
    id: 'canape-lyon',
    title: 'Canapé 3 places',
    priceCents: 18_000,
    publishedAt: '2026-09-27T08:00:00Z',
  }),
]

function ids(criteria: Parameters<typeof searchListings>[1]) {
  return searchListings(listings, criteria).items.map((item) => item.id)
}

describe('parseSearchCriteria', () => {
  it('ne garde aucun critère pour une recherche vide', () => {
    expect(parseSearchCriteria({})).toEqual({})
  })

  it('nettoie les textes et convertit les valeurs numériques issues de l’URL', () => {
    expect(
      parseSearchCriteria({
        q: '  vélo ',
        lieu: 44000,
        categorie: 'loisirs',
        departement: 44,
        prixMin: '50',
        prixMax: 300,
        tri: 'prix-croissant',
        page: '2',
      }),
    ).toEqual({
      q: 'vélo',
      lieu: '44000',
      categorie: 'loisirs',
      departement: '44',
      prixMin: 50,
      prixMax: 300,
      tri: 'prix-croissant',
      page: 2,
    })
  })

  it('ignore les valeurs invalides au lieu de faire échouer la page', () => {
    expect(
      parseSearchCriteria({
        q: '',
        categorie: 'voitures',
        departement: 'Paris',
        prixMin: '-5',
        prixMax: 'abc',
        tri: 'au-hasard',
        page: '0',
      }),
    ).toEqual({})
  })

  it('accepte les départements corses', () => {
    expect(parseSearchCriteria({ departement: '2a' })).toEqual({
      departement: '2A',
    })
  })

  it('conserve un mot-clé court afin d’afficher une aide plutôt que toutes les annonces', () => {
    const criteria = parseSearchCriteria({ q: 'TV' })
    expect(criteria).toEqual({ q: 'TV' })
    expect(requiresLongerKeyword(criteria)).toBe(true)
  })
})

describe('searchListings', () => {
  it('cherche un mot-clé sans tenir compte des accents ni de la casse', () => {
    expect(ids({ q: 'velo' })).toEqual(['velo-nantes', 'velo-lyon'])
  })

  it('trouve un lieu par ville, code postal, numéro ou nom de département', () => {
    expect(ids({ lieu: 'nantes' })).toEqual(['velo-nantes'])
    expect(ids({ lieu: '44000' })).toEqual(['velo-nantes'])
    expect(ids({ lieu: '69' })).toEqual(['canape-lyon', 'velo-lyon'])
    expect(ids({ lieu: 'loire atlantique' })).toEqual(['velo-nantes'])
  })

  it('combine catégorie, département et fourchette de prix en euros', () => {
    expect(
      ids({ categorie: 'loisirs', departement: '69', prixMin: 100 }),
    ).toEqual(['velo-lyon'])
    expect(ids({ prixMax: 95 })).toEqual(['velo-nantes'])
  })

  it('trie par défaut les plus récentes en premier', () => {
    expect(ids({})).toEqual(['velo-nantes', 'canape-lyon', 'velo-lyon'])
  })

  it('trie par prix croissant ou décroissant', () => {
    expect(ids({ tri: 'prix-croissant' })).toEqual([
      'velo-nantes',
      'canape-lyon',
      'velo-lyon',
    ])
    expect(ids({ tri: 'prix-decroissant' })).toEqual([
      'velo-lyon',
      'canape-lyon',
      'velo-nantes',
    ])
  })

  it('pagine les résultats et ramène une page trop grande à la dernière', () => {
    const many = Array.from({ length: 13 }, (_, index) =>
      listing({
        id: `objet-${index}`,
        publishedAt: new Date(now.getTime() - index * 60_000).toISOString(),
      }),
    )

    const first = searchListings(many, {})
    expect(first).toMatchObject({ total: 13, page: 1, pageCount: 2 })
    expect(first.items).toHaveLength(12)

    const last = searchListings(many, { page: 9 })
    expect(last.page).toBe(2)
    expect(last.items.map((item) => item.id)).toEqual(['objet-12'])
  })

  it('renvoie une seule page vide sans résultat', () => {
    expect(searchListings(listings, { q: 'introuvable' })).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageCount: 1,
    })
  })
})

describe('describeResults', () => {
  it('reprend le mot-clé et le lieu recherchés', () => {
    expect(describeResults({ q: 'vélo', lieu: 'Nantes' }, 6)).toEqual({
      title: '« vélo » à Nantes',
      count: '6 annonces',
    })
  })

  it('utilise la catégorie puis un titre générique', () => {
    expect(describeResults({ categorie: 'loisirs' }, 1).title).toBe('Loisirs')
    expect(describeResults({}, 0)).toEqual({
      title: 'Toutes les annonces',
      count: 'Aucune annonce',
    })
    expect(describeResults({}, 1).count).toBe('1 annonce')
    expect(describeResults({ lieu: '44000' }, 2).title).toBe('Annonces à 44000')
  })

  it('décrit une recherche autour d’un point avec son rayon', () => {
    expect(
      describeResults({ q: 'vélo', lieu: 'Annecy', lat: 45.9, lng: 6.13 }, 3),
    ).toEqual({
      title: '« vélo » autour de Annecy',
      count: '3 annonces dans un rayon de 10 km',
    })
    expect(describeResults({ lat: 45.9, lng: 6.13, rayon: 50 }, 0)).toEqual({
      title: 'Annonces autour de vous',
      count: 'Aucune annonce dans un rayon de 50 km',
    })
  })
})

describe('listDepartments', () => {
  it('liste une fois chaque département, triés par numéro', () => {
    expect(listDepartments(listings)).toEqual([
      { code: '44', name: 'Loire-Atlantique' },
      { code: '69', name: 'Rhône' },
    ])
  })
})

describe('formatPrice', () => {
  it('affiche des euros sans centimes superflus', () => {
    const normalize = (value: string) => value.replace(/\s/g, ' ')
    expect(normalize(formatPrice(18_000))).toBe('180 €')
    expect(normalize(formatPrice(125_050))).toBe('1 250,50 €')
  })
})

describe('formatPublishedAgo', () => {
  it('indique une ancienneté lisible', () => {
    expect(formatPublishedAgo('2026-09-27T11:40:00Z', now)).toBe('À l’instant')
    expect(formatPublishedAgo('2026-09-27T09:00:00Z', now)).toBe('Il y a 3 h')
    expect(formatPublishedAgo('2026-09-26T09:00:00Z', now)).toBe('Hier')
    expect(formatPublishedAgo('2026-09-22T12:00:00Z', now)).toBe(
      'Il y a 5 jours',
    )
  })
})

describe('categoryLabel', () => {
  it('traduit un identifiant de catégorie en libellé français', () => {
    expect(categoryLabel('multimedia')).toBe('Multimédia')
    expect(categoryLabel('maison')).toBe('Maison')
  })

  it('ne renvoie rien pour une catégorie inconnue', () => {
    expect(categoryLabel('voitures')).toBeUndefined()
  })
})

describe('clearFilters', () => {
  it('garde le mot-clé et le lieu saisis mais retire filtres, tri et page', () => {
    expect(
      clearFilters({
        q: 'vélo',
        lieu: 'Lyon',
        categorie: 'loisirs',
        departement: '69',
        prixMin: 10,
        prixMax: 200,
        tri: 'prix-croissant',
        page: 3,
      }),
    ).toEqual({ q: 'vélo', lieu: 'Lyon' })
  })

  it('garde aussi la zone de recherche autour d’un point', () => {
    expect(
      clearFilters({ lieu: 'Annecy', lat: 45.9, lng: 6.13, rayon: 20 }),
    ).toEqual({ lieu: 'Annecy', lat: 45.9, lng: 6.13, rayon: 20 })
  })

  it('renvoie une recherche vide sans mot-clé ni lieu', () => {
    expect(clearFilters({ categorie: 'mode', page: 2 })).toEqual({})
  })
})

describe('hasFilters', () => {
  it('ignore le mot-clé, le lieu, le tri et la page', () => {
    expect(
      hasFilters({ q: 'vélo', lieu: 'Lyon', tri: 'prix-croissant', page: 2 }),
    ).toBe(false)
  })

  it('détecte une catégorie, un département ou un prix', () => {
    expect(hasFilters({ categorie: 'mode' })).toBe(true)
    expect(hasFilters({ departement: '69' })).toBe(true)
    expect(hasFilters({ prixMin: 0 })).toBe(true)
    expect(hasFilters({ prixMax: 50 })).toBe(true)
  })
})

describe('buildPaginationWindow', () => {
  it('affiche toutes les pages quand il y en a peu', () => {
    expect(buildPaginationWindow(1, 1)).toEqual([1])
    expect(buildPaginationWindow(3, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('encadre la page courante entre la première et la dernière', () => {
    expect(buildPaginationWindow(10, 20)).toEqual([
      1,
      'ellipsis',
      9,
      10,
      11,
      'ellipsis',
      20,
    ])
  })

  it('n’affiche des points de suspension que du côté des pages masquées', () => {
    expect(buildPaginationWindow(1, 20)).toEqual([1, 2, 'ellipsis', 20])
    expect(buildPaginationWindow(20, 20)).toEqual([1, 'ellipsis', 19, 20])
    expect(buildPaginationWindow(4, 20)).toEqual([
      1,
      2,
      3,
      4,
      5,
      'ellipsis',
      20,
    ])
  })

  it('montre la page isolée plutôt que des points de suspension pour un seul trou', () => {
    expect(buildPaginationWindow(3, 20)).toEqual([1, 2, 3, 4, 'ellipsis', 20])
    expect(buildPaginationWindow(17, 20)).toEqual([
      1,
      'ellipsis',
      16,
      17,
      18,
      19,
      20,
    ])
  })
})

describe('recherche autour d’un point', () => {
  it('lit une position arrondie au kilomètre et un rayon proposé', () => {
    expect(
      parseSearchCriteria({ lat: '45.90678', lng: '6.12893', rayon: '20' }),
    ).toEqual({ lat: 45.91, lng: 6.13, rayon: 20 })
  })

  it('ignore une position incomplète ou hors des bornes', () => {
    expect(parseSearchCriteria({ lat: '45.9', rayon: '20' })).toEqual({})
    expect(parseSearchCriteria({ lat: '95', lng: '6.1' })).toEqual({})
    expect(parseSearchCriteria({ lat: 'nord', lng: '6.1' })).toEqual({})
  })

  it('ignore un rayon qui n’est pas proposé', () => {
    expect(
      parseSearchCriteria({ lat: '45.9', lng: '6.1', rayon: '7' }),
    ).toEqual({ lat: 45.9, lng: 6.1 })
  })

  it('cherche à 10 km par défaut autour du point', () => {
    expect(searchArea({ lat: 45.9, lng: 6.13 })).toEqual({
      center: { lat: 45.9, lng: 6.13 },
      radiusKm: 10,
    })
    expect(searchArea({ lat: 45.9, lng: 6.13, rayon: 50 })?.radiusKm).toBe(50)
    expect(searchArea({ lieu: 'Annecy' })).toBeNull()
  })

  it('affiche une distance arrondie au kilomètre', () => {
    expect(formatDistance(0.4)).toBe('à moins de 1 km')
    expect(formatDistance(4.6)).toBe('à 5 km')
  })
})
