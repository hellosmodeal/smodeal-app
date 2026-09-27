export const previewCategories = [
  { slug: 'maison', label: 'Maison' },
  { slug: 'multimedia', label: 'Multimédia' },
  { slug: 'mode', label: 'Mode' },
  { slug: 'loisirs', label: 'Loisirs' },
  { slug: 'enfants', label: 'Enfants' },
  { slug: 'jardin', label: 'Jardin' },
] as const

export const previewListings = [
  {
    id: 'canape',
    title: 'Canapé 3 places',
    category: 'maison',
    price: 180,
    city: 'Lyon',
    time: 'Aujourd’hui',
    image: '/images/exemple-canape.png',
  },
  {
    id: 'velo',
    title: 'Vélo de ville vert sauge',
    category: 'loisirs',
    price: 95,
    city: 'Nantes',
    time: 'Il y a 1 h',
    image: '/images/exemple-velo.jpg',
  },
  {
    id: 'photo',
    title: 'Appareil photo compact',
    category: 'multimedia',
    price: 120,
    city: 'Lille',
    time: 'Aujourd’hui',
    image: '/images/exemple-appareil-photo.jpg',
  },
  {
    id: 'table',
    title: 'Table en chêne',
    category: 'maison',
    price: 150,
    city: 'Rennes',
    time: 'Il y a 2 h',
    image: '/images/exemple-table.png',
  },
  {
    id: 'fauteuil',
    title: 'Fauteuil en tissu',
    category: 'maison',
    price: 70,
    city: 'Bordeaux',
    time: 'Il y a 3 h',
    image: '/images/exemple-fauteuil.png',
  },
  {
    id: 'console',
    title: 'Console de jeux',
    category: 'multimedia',
    price: 280,
    city: 'Toulouse',
    time: 'Aujourd’hui',
    image: '/images/exemple-console.png',
  },
  {
    id: 'train',
    title: 'Train en bois',
    category: 'enfants',
    price: 25,
    city: 'Montpellier',
    time: 'Il y a 4 h',
    image: '/images/exemple-train.png',
  },
  {
    id: 'lampe',
    title: 'Lampe vintage orange',
    category: 'maison',
    price: 85,
    city: 'Paris',
    time: 'Hier',
    image: '/images/exemple-lampe.jpg',
  },
] as const

export type PreviewFilters = {
  keyword: string
  city: string
  category: string
  minPrice?: number
  maxPrice?: number
  sort?: 'recent' | 'price-asc' | 'price-desc'
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
    .trim()
}

export function filterPreviewListings(
  filters: PreviewFilters,
): Array<(typeof previewListings)[number]> {
  const keyword = normalize(filters.keyword)
  const city = normalize(filters.city)
  const listings = previewListings.filter(
    (listing) =>
      (!filters.category || listing.category === filters.category) &&
      (!keyword || normalize(listing.title).includes(keyword)) &&
      (!city || normalize(listing.city).includes(city)) &&
      (filters.minPrice === undefined || listing.price >= filters.minPrice) &&
      (filters.maxPrice === undefined || listing.price <= filters.maxPrice),
  )

  if (filters.sort === 'price-asc')
    return listings.sort((a, b) => a.price - b.price)
  if (filters.sort === 'price-desc')
    return listings.sort((a, b) => b.price - a.price)
  return listings
}
