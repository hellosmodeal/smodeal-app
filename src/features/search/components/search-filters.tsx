import { Link } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { cn } from '@/lib/utils'
import {
  clearFilters,
  type SearchCriteria,
  searchCategories,
  sortOptions,
} from '../rules'
import { useSearchSubmit } from './use-search-submit'

const FILTERS_FORM_ID = 'filtres-recherche'

const fieldClass =
  'min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

// NativeSelect styles its <select> at h-8; filters use 44px touch targets.
const selectClass = 'w-full rounded-lg bg-card [&>select]:h-11'

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
      <Button
        type="button"
        variant="outline"
        size="lg"
        aria-expanded={open}
        aria-controls={FILTERS_FORM_ID}
        onClick={() => setOpen((current) => !current)}
        className="w-full text-sm font-semibold lg:hidden"
      >
        <SlidersHorizontal aria-hidden="true" />
        {open ? 'Masquer les filtres' : 'Afficher les filtres'}
      </Button>
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
          <Label htmlFor="filtre-categorie" className="font-semibold">
            Catégorie
          </Label>
          <NativeSelect
            id="filtre-categorie"
            name="categorie"
            defaultValue={criteria.categorie ?? ''}
            className={selectClass}
          >
            <NativeSelectOption value="">
              Toutes les catégories
            </NativeSelectOption>
            {searchCategories.map((category) => (
              <NativeSelectOption key={category.slug} value={category.slug}>
                {category.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filtre-departement" className="font-semibold">
            Département
          </Label>
          <NativeSelect
            id="filtre-departement"
            name="departement"
            defaultValue={criteria.departement ?? ''}
            className={selectClass}
          >
            <NativeSelectOption value="">
              Tous les départements
            </NativeSelectOption>
            {departments.map((department) => (
              <NativeSelectOption key={department.code} value={department.code}>
                {department.name} ({department.code})
              </NativeSelectOption>
            ))}
          </NativeSelect>
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
          <Button type="submit" size="lg" className="text-sm font-semibold">
            Appliquer les filtres
          </Button>
          <Link
            activeOptions={{ exact: true }}
            to="/recherche"
            search={clearFilters(criteria)}
            className={buttonVariants({
              variant: 'outline',
              size: 'lg',
              className: 'text-sm font-semibold',
            })}
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
      <Label htmlFor={id} className="font-semibold">
        {label}
      </Label>
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
      <Label htmlFor="tri-annonces" className="sr-only">
        Trier les annonces
      </Label>
      <NativeSelect
        key={criteria.tri ?? 'recent'}
        id="tri-annonces"
        name="tri"
        form={FILTERS_FORM_ID}
        defaultValue={criteria.tri ?? 'recent'}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="rounded-lg bg-card [&>select]:h-11"
      >
        {sortOptions.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
