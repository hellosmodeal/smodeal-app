import { createFileRoute } from '@tanstack/react-router'
import { CategoryTabs } from '@/features/search/components/category-tabs'
import { SearchBar } from '@/features/search/components/search-bar'
import {
  SearchFilters,
  SortSelect,
} from '@/features/search/components/search-filters'
import {
  EmptyResults,
  Pagination,
  ResultsGrid,
} from '@/features/search/components/search-results'
import { findListings } from '@/features/search/functions'
import { describeResults, parseSearchCriteria } from '@/features/search/rules'
import { getSeoConfig } from '@/features/seo/functions'
import { buildPageHead } from '@/features/seo/rules'

export const Route = createFileRoute('/recherche')({
  validateSearch: parseSearchCriteria,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [results, seo] = await Promise.all([
      findListings({ data: deps }),
      getSeoConfig(),
    ])
    return { results, seo }
  },
  head: ({ loaderData, match }) => {
    const { title } = describeResults(
      match.search,
      loaderData?.results.total ?? 0,
    )
    return buildPageHead(
      {
        title: `${title} — Smodeal`,
        description:
          'Recherchez parmi les petites annonces entre particuliers sur Smodeal.',
        path: '/recherche',
        imageAlt: 'Smodeal — Les belles choses circulent',
        noindex: true,
      },
      loaderData?.seo,
    )
  },
  component: SearchPage,
})

function SearchPage() {
  const criteria = Route.useSearch()
  const { results } = Route.useLoaderData()
  const { title, count } = describeResults(criteria, results.total)

  return (
    <>
      <section className="bg-brand-surface">
        <div className="flex items-center justify-between max-w-7xl mx-auto p-5 sm:px-8">
          <div>
            <p className="font-heading text-3xl font-bold tracking-[-0.055em] sm:text-4xl lg:text-[2.75rem]">
              Votre prochaine trouvaille est ici.
            </p>
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
        <SearchBar criteria={criteria} />
        <CategoryTabs criteria={criteria} />
      </div>

      <div className="grid gap-6 max-w-7xl mx-auto px-5 pt-6 pb-10 lg:grid-cols-[16rem_minmax(0,1fr)] sm:px-8">
        <SearchFilters criteria={criteria} departments={results.departments} />

        <section aria-labelledby="resultats-titre">
          <div className="flex gap-4 flex-wrap items-start justify-between">
            <div>
              <h1
                id="resultats-titre"
                className="font-heading text-2xl font-bold tracking-[-0.04em] sm:text-3xl"
              >
                {title}
              </h1>
              <p aria-live="polite" className="text-sm text-muted-foreground">
                {count}
              </p>
            </div>
            <SortSelect criteria={criteria} />
          </div>

          <div className="mt-5">
            {results.keywordTooShort ? (
              <p className="rounded-lg border border-dashed border-border py-8 px-6 text-center text-sm text-muted-foreground">
                Saisissez au moins 3 caractères pour rechercher par mot-clé.
              </p>
            ) : results.items.length > 0 ? (
              <ResultsGrid
                items={results.items}
                now={new Date(results.generatedAt)}
              />
            ) : (
              <EmptyResults criteria={criteria} />
            )}
          </div>

          <Pagination
            criteria={criteria}
            page={results.page}
            pageCount={results.pageCount}
          />
        </section>
      </div>
    </>
  )
}
