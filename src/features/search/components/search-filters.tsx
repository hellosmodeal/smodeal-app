import { Link } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { type SearchCriteria, searchCategories, sortOptions } from '../rules'
import { useSearchSubmit } from './use-search-submit'

const FILTERS_FORM_ID = 'filtres-recherche'

const fieldClass =
  'min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-brand'

function criteriaKey(criteria: SearchCriteria) {
  return JSON.stringify(criteria)
}

export function SearchFilters({
  criteria,
  departments,
}: {
  criteria: SearchCriteria
  departments: { code: string; name: string }[]
}) {
  const [open, setOpen] = useState(false)
  const handleSubmit = useSearchSubmit()

  return (
    <aside aria-labelledby="filtres-titre">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={FILTERS_FORM_ID}
        onClick={() => setOpen((current) => !current)}
        className="flex gap-2 items-center justify-center w-full min-h-11 rounded-lg border border-border text-sm font-semibold bg-card lg:hidden"
      >
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        {open ? 'Masquer les filtres' : 'Afficher les filtres'}
      </button>
      <form
        key={criteriaKey(criteria)}
        id={FILTERS_FORM_ID}
        action="/recherche"
        method="get"
        onSubmit={handleSubmit}
        className={cn(
          'mt-3 space-y-5 rounded-lg border border-border p-5 bg-card lg:mt-0 lg:block',
          open ? 'block' : 'hidden',
        )}
      >
        <h2 id="filtres-titre" className="sr-only">
          Filtres
        </h2>
        {criteria.q && <input type="hidden" name="q" value={criteria.q} />}
        {criteria.lieu && (
          <input type="hidden" name="lieu" value={criteria.lieu} />
        )}
        <div className="space-y-2">
          <label htmlFor="filtre-categorie" className="text-sm font-semibold">
            Catégorie
          </label>
          <select
            id="filtre-categorie"
            name="categorie"
            defaultValue={criteria.categorie ?? ''}
            className={fieldClass}
          >
            <option value="">Toutes les catégories</option>
            {searchCategories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="filtre-departement" className="text-sm font-semibold">
            Département
          </label>
          <select
            id="filtre-departement"
            name="departement"
            defaultValue={criteria.departement ?? ''}
            className={fieldClass}
          >
            <option value="">Tous les départements</option>
            {departments.map((department) => (
              <option key={department.code} value={department.code}>
                {department.name} ({department.code})
              </option>
            ))}
          </select>
        </div>
        <PriceField
          id="filtre-prix-min"
          name="prixMin"
          label="Prix minimum"
          placeholder="Prix min."
          value={criteria.prixMin}
        />
        <PriceField
          id="filtre-prix-max"
          name="prixMax"
          label="Prix maximum"
          placeholder="Prix max."
          value={criteria.prixMax}
        />
        <div className="grid gap-2">
          <button
            type="submit"
            className="min-h-11 rounded-lg font-semibold bg-brand-dark text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand hover:brightness-90"
          >
            Appliquer les filtres
          </button>
          <Link
            to="/recherche"
            search={{ q: criteria.q, lieu: criteria.lieu }}
            className="flex items-center justify-center min-h-11 rounded-lg border border-brand text-sm font-semibold text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand hover:bg-accent"
          >
            Réinitialiser
          </Link>
        </div>
      </form>
    </aside>
  )
}

function PriceField({
  id,
  name,
  label,
  placeholder,
  value,
}: {
  id: string
  name: string
  label: string
  placeholder: string
  value?: number
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          defaultValue={value}
          placeholder={placeholder}
          className={cn(fieldClass, 'pr-8')}
        />
        <span
          aria-hidden="true"
          className="absolute right-3 top-1/2 text-sm text-muted-foreground -translate-y-1/2"
        >
          €
        </span>
      </div>
    </div>
  )
}

export function SortSelect({ criteria }: { criteria: SearchCriteria }) {
  return (
    <div>
      <label htmlFor="tri-annonces" className="sr-only">
        Trier les annonces
      </label>
      <select
        key={criteria.tri ?? 'recent'}
        id="tri-annonces"
        name="tri"
        form={FILTERS_FORM_ID}
        defaultValue={criteria.tri ?? 'recent'}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="min-h-11 rounded-lg border border-border outline-brand px-3 text-sm bg-card"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
