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
import { findListings } from '@/features/search/functions'
import {
  formatPrice,
  formatPublishedAgo,
  parseSearchCriteria,
  searchCategories,
} from '@/features/search/rules'
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
  loader: async () => {
    const [seo, results] = await Promise.all([
      getSeoConfig(),
      findListings({ data: {} }),
    ])
    return { seo, results }
  },
  head: ({ loaderData }) => buildPageHead(homePage, loaderData?.seo),
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
  const { results } = Route.useLoaderData()
  const [keyword, setKeyword] = useState('')
  const [city, setCity] = useState('')
  const listings = results.items
  const navigate = useNavigate()

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void navigate({
      to: '/recherche',
      search: parseSearchCriteria({
        q: keyword,
        lieu: city,
      }),
    })
  }

  return (
    <>
      <section className="bg-brand-surface">
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
              src="/brand/smodeal-symbol.svg"
              alt=""
              className="object-contain size-14"
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
            onClick={() => void navigate({ to: '/recherche', search: {} })}
            className={cn(
              'flex shrink-0 items-center gap-3 border-b-2 px-2 py-3 text-sm focus-visible:outline-2 focus-visible:outline-brand',
              'border-brand text-brand-dark',
            )}
          >
            <Grid2X2 aria-hidden="true" className="size-5" />
            Tout
          </button>
          {searchCategories.map((category) => {
            const Icon = categoryIcons[category.slug]
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() =>
                  void navigate({
                    to: '/recherche',
                    search: { categorie: category.slug },
                  })
                }
                className={cn(
                  'flex shrink-0 items-center gap-3 border-b-2 px-2 py-3 text-sm focus-visible:outline-2 focus-visible:outline-brand',
                  'border-transparent hover:text-brand-dark',
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
              {results.total} annonce{results.total > 1 ? 's' : ''}
            </span>
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
                <Link
                  to="/annonces/$listingId"
                  params={{ listingId: listing.id }}
                >
                  {listing.image ? (
                    <img
                      src={listing.image}
                      alt={listing.title}
                      loading="lazy"
                      className="object-cover aspect-[1.65] w-full rounded-lg"
                    />
                  ) : (
                    <div className="flex items-center justify-center aspect-[1.65] w-full rounded-lg text-sm bg-muted text-muted-foreground">
                      Pas de photo
                    </div>
                  )}
                  <h3 className="mt-2 text-sm font-semibold">
                    {listing.title}
                  </h3>
                  <p className="text-lg font-bold">
                    {formatPrice(listing.priceCents)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {listing.city} ·{' '}
                    {formatPublishedAgo(
                      listing.publishedAt,
                      new Date(results.generatedAt),
                    )}
                  </p>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border py-12 px-6 text-center">
            <Armchair
              aria-hidden="true"
              className="size-8 mx-auto text-brand"
            />
            <p className="mt-3 font-semibold">
              Aucune annonce disponible pour le moment
            </p>
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
