import { MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocateMe } from '@/features/locations/components/use-locate-me'
import type { SearchCriteria } from '../rules'
import { PlaceSearchInput } from './place-search-input'
import { useSearchSubmit } from './use-search-submit'

export function SearchBar({ criteria = {} }: { criteria?: SearchCriteria }) {
  const handleSubmit = useSearchSubmit()
  const { locate, locating, error } = useLocateMe()

  return (
    <search>
      <form
        key={[
          criteria.q,
          criteria.lieu,
          criteria.lat,
          criteria.lng,
          criteria.rayon,
        ].join('|')}
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
          <PlaceSearchInput
            id="recherche-lieu"
            criteria={criteria}
            locate={locate}
            locating={locating}
          />
        </div>
        {criteria.categorie && (
          <input type="hidden" name="categorie" value={criteria.categorie} />
        )}
        <Button type="submit" size="lg" className="h-12 px-10 font-semibold">
          Rechercher
        </Button>
      </form>
      {error && (
        <p role="alert" className="pb-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </search>
  )
}
