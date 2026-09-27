import { MapPin, Search } from 'lucide-react'
import type { SearchCriteria } from '../rules'
import { useSearchSubmit } from './use-search-submit'

export function SearchBar({ criteria }: { criteria: SearchCriteria }) {
  const handleSubmit = useSearchSubmit()

  return (
    <search>
      <form
        key={`${criteria.q ?? ''}|${criteria.lieu ?? ''}`}
        action="/recherche"
        method="get"
        aria-label="Rechercher des annonces"
        onSubmit={handleSubmit}
        className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]"
      >
        <div className="flex gap-3 items-center min-h-12 rounded-lg border border-border px-4 bg-card focus-within:outline-2 focus-within:outline-brand">
          <Search aria-hidden="true" className="shrink-0 size-5" />
          <label htmlFor="recherche-mot-cle" className="sr-only">
            Que recherchez-vous ?
          </label>
          <input
            id="recherche-mot-cle"
            name="q"
            type="search"
            defaultValue={criteria.q}
            placeholder="Que recherchez-vous ?"
            className="w-full min-w-0 outline-none text-sm bg-transparent placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-3 items-center min-h-12 rounded-lg border border-border px-4 bg-card focus-within:outline-2 focus-within:outline-brand">
          <MapPin aria-hidden="true" className="shrink-0 size-5" />
          <label htmlFor="recherche-lieu" className="sr-only">
            Ville, code postal ou département
          </label>
          <input
            id="recherche-lieu"
            name="lieu"
            type="search"
            defaultValue={criteria.lieu}
            placeholder="Ville, code postal ou département"
            className="w-full min-w-0 outline-none text-sm bg-transparent placeholder:text-muted-foreground"
          />
        </div>
        {criteria.categorie && (
          <input type="hidden" name="categorie" value={criteria.categorie} />
        )}
        <button
          type="submit"
          className="min-h-12 rounded-lg px-10 font-semibold bg-brand-dark text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand hover:brightness-90"
        >
          Rechercher
        </button>
      </form>
    </search>
  )
}
