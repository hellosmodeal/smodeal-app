import { Link, useNavigate } from '@tanstack/react-router'
import { type ComponentProps, type FormEvent, useState } from 'react'

import { assertMutationSucceeded } from '@/features/abuse/result'
import { updateListing } from '@/features/listings/functions'
import type { ListingForEditing } from '@/features/listings/listings.server'
import { priceInputToCents } from '@/features/listings/price-input'
import { LISTING_CATEGORIES } from '@/features/listings/rules'

const categoryLabels = {
  maison: 'Maison',
  multimedia: 'Multimédia',
  mode: 'Mode',
  loisirs: 'Loisirs',
  enfants: 'Enfants',
  jardin: 'Jardin',
} as const

const conditionLabels = {
  new: 'Neuf',
  like_new: 'Comme neuf',
  good: 'Bon état',
  fair: 'État correct',
} as const

export function EditListingForm({ listing }: { listing: ListingForEditing }) {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      const data = new FormData(event.currentTarget)
      data.set(
        'priceCents',
        String(priceInputToCents(String(data.get('priceEuros') ?? ''))),
      )
      assertMutationSucceeded(await updateListing({ data }))
      await navigate({ to: '/mes-annonces' })
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'La modification est impossible pour le moment.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="grid gap-5 mt-7" onSubmit={submit}>
      <input name="id" type="hidden" value={listing.id} />
      <Field
        label="Titre"
        name="title"
        defaultValue={listing.title}
        maxLength={120}
        required
      />
      <label className="grid gap-2 text-sm font-medium" htmlFor="description">
        Description
        <textarea
          id="description"
          name="description"
          defaultValue={listing.description}
          required
          rows={6}
          className="rounded-lg border border-input p-3 bg-background"
        />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="Catégorie"
          name="categorySlug"
          defaultValue={listing.categorySlug}
        >
          {LISTING_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {categoryLabels[category]}
            </option>
          ))}
        </Select>
        <Select label="État" name="condition" defaultValue={listing.condition}>
          {Object.entries(conditionLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Field
          label="Prix (€)"
          name="priceEuros"
          type="number"
          min="0"
          step="0.01"
          max="20000000"
          defaultValue={listing.priceCents / 100}
          required
        />
        <Field label="Ville" name="city" defaultValue={listing.city} required />
        <Field
          label="Code postal"
          name="postalCode"
          inputMode="numeric"
          pattern="[0-9]{5}"
          defaultValue={listing.postalCode}
          required
        />
        <Field
          label="Département"
          name="department"
          pattern="[0-9]{2}|2A|2B|97[0-9]|98[0-9]"
          defaultValue={listing.department}
          required
        />
      </div>
      <p className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
        Les photos ne sont pas modifiables depuis cet écran.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-4 items-center">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg py-3 px-5 font-semibold bg-brand-dark text-white disabled:opacity-60"
        >
          {pending ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
        <Link to="/mes-annonces" className="text-sm underline">
          Annuler
        </Link>
      </div>
    </form>
  )
}

function Field(props: ComponentProps<'input'> & { label: string }) {
  const { label, name, ...input } = props
  return (
    <label className="grid gap-2 text-sm font-medium" htmlFor={name}>
      {label}
      <input
        id={name}
        name={name}
        {...input}
        className="rounded-lg border border-input py-2 px-3 bg-background"
      />
    </label>
  )
}

function Select(props: ComponentProps<'select'> & { label: string }) {
  const { label, name, children, ...select } = props
  return (
    <label className="grid gap-2 text-sm font-medium" htmlFor={name}>
      {label}
      <select
        id={name}
        name={name}
        {...select}
        className="rounded-lg border border-input py-2 px-3 bg-background"
      >
        {children}
      </select>
    </label>
  )
}
