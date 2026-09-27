import type { SearchListing } from './rules'

type DemoListing = Omit<SearchListing, 'publishedAt'> & { hoursAgo: number }

const places = {
  lyon: {
    city: 'Lyon',
    postalCode: '69003',
    departmentCode: '69',
    departmentName: 'Rhône',
  },
  nantes: {
    city: 'Nantes',
    postalCode: '44000',
    departmentCode: '44',
    departmentName: 'Loire-Atlantique',
  },
  saintHerblain: {
    city: 'Saint-Herblain',
    postalCode: '44800',
    departmentCode: '44',
    departmentName: 'Loire-Atlantique',
  },
  lille: {
    city: 'Lille',
    postalCode: '59000',
    departmentCode: '59',
    departmentName: 'Nord',
  },
  rennes: {
    city: 'Rennes',
    postalCode: '35000',
    departmentCode: '35',
    departmentName: 'Ille-et-Vilaine',
  },
  bordeaux: {
    city: 'Bordeaux',
    postalCode: '33000',
    departmentCode: '33',
    departmentName: 'Gironde',
  },
  toulouse: {
    city: 'Toulouse',
    postalCode: '31000',
    departmentCode: '31',
    departmentName: 'Haute-Garonne',
  },
  montpellier: {
    city: 'Montpellier',
    postalCode: '34000',
    departmentCode: '34',
    departmentName: 'Hérault',
  },
  paris: {
    city: 'Paris',
    postalCode: '75011',
    departmentCode: '75',
    departmentName: 'Paris',
  },
  angers: {
    city: 'Angers',
    postalCode: '49000',
    departmentCode: '49',
    departmentName: 'Maine-et-Loire',
  },
} as const

const demoListings: DemoListing[] = [
  {
    id: 'exemple-canape',
    title: 'Canapé 3 places',
    category: 'maison',
    priceCents: 18_000,
    ...places.lyon,
    hoursAgo: 2,
    image: '/images/exemple-canape.png',
  },
  {
    id: 'exemple-velo',
    title: 'Vélo de ville vert sauge',
    category: 'loisirs',
    priceCents: 9_500,
    ...places.nantes,
    hoursAgo: 1,
    image: '/images/exemple-velo.jpg',
  },
  {
    id: 'exemple-appareil-photo',
    title: 'Appareil photo compact',
    category: 'multimedia',
    priceCents: 12_000,
    ...places.lille,
    hoursAgo: 5,
    image: '/images/exemple-appareil-photo.jpg',
  },
  {
    id: 'exemple-table',
    title: 'Table en chêne',
    category: 'maison',
    priceCents: 15_000,
    ...places.rennes,
    hoursAgo: 3,
    image: '/images/exemple-table.png',
  },
  {
    id: 'exemple-fauteuil',
    title: 'Fauteuil en tissu',
    category: 'maison',
    priceCents: 7_000,
    ...places.bordeaux,
    hoursAgo: 4,
    image: '/images/exemple-fauteuil.png',
  },
  {
    id: 'exemple-console',
    title: 'Console de jeux',
    category: 'multimedia',
    priceCents: 28_000,
    ...places.toulouse,
    hoursAgo: 7,
    image: '/images/exemple-console.png',
  },
  {
    id: 'exemple-train',
    title: 'Train en bois',
    category: 'enfants',
    priceCents: 2_500,
    ...places.montpellier,
    hoursAgo: 9,
    image: '/images/exemple-train.png',
  },
  {
    id: 'exemple-lampe',
    title: 'Lampe vintage orange',
    category: 'maison',
    priceCents: 8_500,
    ...places.paris,
    hoursAgo: 26,
    image: '/images/exemple-lampe.jpg',
  },
  {
    id: 'exemple-velo-enfant',
    title: 'Vélo enfant 16 pouces',
    category: 'enfants',
    priceCents: 7_000,
    ...places.nantes,
    hoursAgo: 28,
  },
  {
    id: 'exemple-vtt',
    title: 'VTT adulte taille M',
    category: 'loisirs',
    priceCents: 25_000,
    ...places.saintHerblain,
    hoursAgo: 50,
  },
  {
    id: 'exemple-poussette',
    title: 'Poussette compacte',
    category: 'enfants',
    priceCents: 9_000,
    ...places.rennes,
    hoursAgo: 75,
  },
  {
    id: 'exemple-veste',
    title: 'Veste en jean',
    category: 'mode',
    priceCents: 3_500,
    ...places.paris,
    hoursAgo: 98,
  },
  {
    id: 'exemple-tondeuse',
    title: 'Tondeuse électrique',
    category: 'jardin',
    priceCents: 11_000,
    ...places.angers,
    hoursAgo: 120,
  },
  {
    id: 'exemple-chaises-jardin',
    title: 'Chaises de jardin pliantes',
    category: 'jardin',
    priceCents: 6_000,
    ...places.angers,
    hoursAgo: 150,
  },
]

const HOUR_MS = 60 * 60 * 1000

export function buildDemoListings(now: Date): SearchListing[] {
  return demoListings.map(({ hoursAgo, ...listing }) => ({
    ...listing,
    publishedAt: new Date(now.getTime() - hoursAgo * HOUR_MS).toISOString(),
  }))
}
