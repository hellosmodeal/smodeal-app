import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { type ComponentProps, type FormEvent, useState } from 'react'

import { assertMutationSucceeded } from '@/features/abuse/result'
import { publishListing } from '@/features/listings/functions'
import { priceInputToCents } from '@/features/listings/price-input'
import { LISTING_CATEGORIES } from '@/features/listings/rules'

const labels = {
  maison: 'Maison',
  multimedia: 'Multimédia',
  mode: 'Mode',
  loisirs: 'Loisirs',
  enfants: 'Enfants',
  jardin: 'Jardin',
} as const

export const Route = createFileRoute('/_authed/deposer')({
  head: () => ({ meta: [{ title: 'Déposer une annonce — Smodeal' }] }),
  component: PublishPage,
})

function PublishPage() {
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
      assertMutationSucceeded(await publishListing({ data }))
      await navigate({ to: '/mes-annonces' })
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'La publication est impossible pour le moment.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="max-w-2xl mx-auto py-8 px-5 sm:px-8">
      <h1 className="font-heading text-3xl font-bold tracking-[-0.04em]">
        Déposer une annonce
      </h1>
      <p className="mt-2 text-muted-foreground">
        Votre adresse email doit être vérifiée avant publication.
      </p>
      <form
        className="grid gap-5 mt-7"
        encType="multipart/form-data"
        onSubmit={submit}
      >
        <Field label="Titre" name="title" maxLength={120} required />
        <label className="grid gap-2 text-sm font-medium" htmlFor="description">
          Description
          <textarea
            id="description"
            name="description"
            required
            rows={6}
            className="rounded-lg border border-input p-3 bg-background"
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <Select label="Catégorie" name="categorySlug">
            {LISTING_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {labels[category]}
              </option>
            ))}
          </Select>
          <Select label="État" name="condition">
            <option value="new">Neuf</option>
            <option value="like_new">Comme neuf</option>
            <option value="good">Bon état</option>
            <option value="fair">État correct</option>
          </Select>
          <Field
            label="Prix (€)"
            name="priceEuros"
            type="number"
            min="0"
            step="0.01"
            max="20000000"
            required
          />
          <Field label="Ville" name="city" required />
          <Field
            label="Code postal"
            name="postalCode"
            inputMode="numeric"
            pattern="[0-9]{5}"
            required
          />
          <Field
            label="Département"
            name="department"
            pattern="[0-9]{2}|2A|2B|97[0-9]|98[0-9]"
            required
          />
        </div>
        <label className="grid gap-2 text-sm font-medium" htmlFor="photos">
          Photos (JPG, PNG ou WebP, 5 Mo chacune, 5 maximum)
          <input
            id="photos"
            name="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="block text-sm"
          />
        </label>
        <Field label="Téléphone" name="phone" type="tel" required />
        <label
          className="flex gap-3 items-start text-sm"
          htmlFor="display-consent"
        >
          <input
            id="display-consent"
            name="displayConsent"
            type="checkbox"
            className="mt-1"
          />
          J’accepte que mon numéro soit communiqué aux membres connectés qui
          souhaitent me contacter. Sans cet accord, il ne sera pas accessible.
        </label>
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
            {pending ? 'Publication…' : 'Publier l’annonce'}
          </button>
          <Link to="/mes-annonces" className="text-sm underline">
            Mes annonces
          </Link>
        </div>
      </form>
    </section>
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
