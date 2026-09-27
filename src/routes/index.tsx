import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Armchair,
  ArrowRight,
  Baby,
  Bike,
  Grid2X2,
  House,
  Laptop,
  Leaf,
  MapPin,
  Search,
  Shirt,
} from 'lucide-react'
import { type FormEvent, useState } from 'react'
import {
  filterPreviewListings,
  type PreviewFilters,
  previewCategories,
} from '@/features/listings/home-preview'
import { parseSearchCriteria } from '@/features/search/rules'
import { getSeoConfig } from '@/features/seo/functions'
import { buildPageHead } from '@/features/seo/rules'
import { cn } from '@/lib/utils'

const homePage = {
  title: 'Smodeal — Les belles choses circulent',
  description:
    'Smodeal réunit les petites annonces entre particuliers près de chez vous. Découvrez des objets à transmettre et donnez une nouvelle vie aux vôtres.',
  path: '/',
  imageAlt: 'Smodeal — Les belles choses circulent',
}

export const Route = createFileRoute('/')({
  loader: () => getSeoConfig(),
  head: ({ loaderData }) => buildPageHead(homePage, loaderData),
  component: Home,
})

const categoryIcons = {
  maison: House,
  multimedia: Laptop,
  mode: Shirt,
  loisirs: Bike,
  enfants: Baby,
  jardin: Leaf,
}

function Home() {
  const [keyword, setKeyword] = useState('')
  const [city, setCity] = useState('')
  const [filters, setFilters] = useState<PreviewFilters>({
    keyword: '',
    city: '',
    category: '',
    sort: 'recent',
  })
  const listings = filterPreviewListings(filters)
  const navigate = useNavigate()

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void navigate({
      to: '/recherche',
      search: parseSearchCriteria({
        q: keyword,
        lieu: city,
        categorie: filters.category,
      }),
    })
  }

  function clearFilters() {
    setKeyword('')
    setCity('')
    setFilters({ keyword: '', city: '', category: '', sort: 'recent' })
  }

  return (
    <>
      <section className="bg-[#faf7f2]">
        <div className="flex items-center justify-between max-w-7xl mx-auto p-5 sm:px-8">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-[-0.055em] sm:text-4xl lg:text-[2.75rem]">
              Votre prochaine trouvaille est ici.
            </h1>
            <p className="mt-1 text-lg text-muted-foreground sm:text-xl">
              Achetez et vendez entre particuliers.
            </p>
          </div>
          <span
            aria-hidden="true"
            className="overflow-hidden relative hidden h-[70px] w-[58px] lg:block"
          >
            <img
              src="/brand/smodeal-logo.png"
              alt=""
              className="absolute h-35 max-w-none -top-[31px] -left-[40px]"
            />
          </span>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <search>
          <form
            action="/recherche"
            method="get"
            aria-label="Rechercher des annonces"
            onSubmit={handleSearch}
            className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]"
          >
            <div className="flex gap-3 items-center min-h-12 rounded-lg border border-border px-4 bg-card">
              <Search aria-hidden="true" className="shrink-0 size-5" />
              <label htmlFor="search-keyword" className="sr-only">
                Que recherchez-vous ?
              </label>
              <input
                id="search-keyword"
                name="q"
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Que recherchez-vous ?"
                className="w-full min-w-0 outline-none text-sm bg-transparent placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-3 items-center min-h-12 rounded-lg border border-border px-4 bg-card">
              <MapPin aria-hidden="true" className="shrink-0 size-5" />
              <label htmlFor="search-city" className="sr-only">
                Ville, code postal ou département
              </label>
              <input
                id="search-city"
                name="lieu"
                type="search"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Ville, code postal ou département"
                className="w-full min-w-0 outline-none text-sm bg-transparent placeholder:text-muted-foreground"
              />
            </div>
            <button
              type="submit"
              className="min-h-12 rounded-lg px-10 font-semibold bg-brand-dark text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand hover:brightness-90"
            >
              Rechercher
            </button>
          </form>
        </search>

        <nav
          aria-label="Catégories"
          className="overflow-x-auto flex gap-3 border-b border-border sm:justify-between"
        >
          <button
            type="button"
            aria-pressed={filters.category === ''}
            onClick={() =>
              setFilters((current) => ({ ...current, category: '' }))
            }
            className={cn(
              'flex shrink-0 items-center gap-3 border-b-2 px-2 py-3 text-sm focus-visible:outline-2 focus-visible:outline-brand',
              filters.category === ''
                ? 'border-brand text-brand-dark'
                : 'border-transparent hover:text-brand-dark',
            )}
          >
            <Grid2X2 aria-hidden="true" className="size-5" />
            Tout
          </button>
          {previewCategories.map((category) => {
            const Icon = categoryIcons[category.slug]
            return (
              <button
                key={category.slug}
                type="button"
                aria-pressed={filters.category === category.slug}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    category: category.slug,
                  }))
                }
                className={cn(
                  'flex shrink-0 items-center gap-3 border-b-2 px-2 py-3 text-sm focus-visible:outline-2 focus-visible:outline-brand',
                  filters.category === category.slug
                    ? 'border-brand text-brand-dark'
                    : 'border-transparent hover:text-brand-dark',
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
                {category.label}
              </button>
            )
          })}
        </nav>
      </div>

      <section
        id="annonces"
        aria-labelledby="listings-title"
        className="max-w-7xl mx-auto px-5 pt-5 pb-2 sm:px-8"
      >
        <div className="flex gap-4 flex-col justify-between sm:flex-row sm:items-center">
          <div className="flex gap-3 items-center">
            <h2
              id="listings-title"
              className="font-heading text-2xl font-bold tracking-[-0.04em] sm:text-3xl"
            >
              Les dernières annonces
            </h2>
            <span className="text-xs text-muted-foreground">
              Exemples fictifs
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <label className="sr-only" htmlFor="min-price">
              Prix minimum
            </label>
            <input
              id="min-price"
              type="number"
              min="0"
              placeholder="Prix min. €"
              value={filters.minPrice ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  minPrice: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                }))
              }
              className="w-32 rounded-lg border border-border outline-brand py-2 px-3 text-sm bg-card"
            />
            <label className="sr-only" htmlFor="max-price">
              Prix maximum
            </label>
            <input
              id="max-price"
              type="number"
              min="0"
              placeholder="Prix max. €"
              value={filters.maxPrice ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  maxPrice: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                }))
              }
              className="w-32 rounded-lg border border-border outline-brand py-2 px-3 text-sm bg-card"
            />
            <label className="sr-only" htmlFor="sort-listings">
              Trier les annonces
            </label>
            <select
              id="sort-listings"
              value={filters.sort}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  sort: event.target.value as PreviewFilters['sort'],
                }))
              }
              className="rounded-lg border border-border outline-brand py-2 px-3 text-sm bg-card"
            >
              <option value="recent">Plus récentes</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
          </div>
        </div>
        <p aria-live="polite" className="sr-only">
          {listings.length} résultat
          {listings.length > 1 ? 's' : ''}
        </p>
        {listings.length > 0 ? (
          <div className="grid gap-y-3 gap-x-4 grid-cols-1 mt-4 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((listing) => (
              <article key={listing.id}>
                <img
                  src={listing.image}
                  alt={listing.title}
                  loading="lazy"
                  className="object-cover aspect-[1.65] w-full rounded-lg"
                />
                <h3 className="mt-2 text-sm font-semibold">{listing.title}</h3>
                <p className="text-lg font-bold">{listing.price} €</p>
                <p className="text-sm text-muted-foreground">
                  {listing.city} · {listing.time}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border py-12 px-6 text-center">
            <Armchair
              aria-hidden="true"
              className="size-8 mx-auto text-brand"
            />
            <p className="mt-3 font-semibold">Aucune annonce ne correspond</p>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-brand mt-3 py-2 px-4 text-sm font-semibold text-brand-dark hover:bg-accent"
            >
              Effacer les filtres
            </button>
          </div>
        )}
        <div className="mt-2 text-center">
          <Link
            to="/recherche"
            className="inline-flex gap-2 items-center rounded-lg border border-brand py-2 px-5 text-sm font-semibold text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand hover:bg-accent"
          >
            Voir toutes les annonces{' '}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 pb-5 sm:px-8">
        <div className="flex gap-4 flex-col rounded-lg py-4 px-6 bg-foreground text-background sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-2xl font-bold tracking-[-0.04em]">
            Un objet en moins, une bonne affaire en plus.
          </h2>
          <Link
            to="/inscription"
            className="shrink-0 rounded-lg py-2.5 px-5 text-center text-sm font-semibold bg-brand-dark text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand hover:brightness-90"
          >
            Créer un compte pour vendre
          </Link>
        </div>
      </section>
    </>
  )
}
