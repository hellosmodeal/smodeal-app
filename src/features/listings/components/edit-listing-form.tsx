import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { assertMutationSucceeded } from '@/features/abuse/result'
import {
  FormSection,
  ListingDetailsFields,
  PriceAndLocationFields,
} from '@/features/listings/components/listing-form-fields'
import { updateListing } from '@/features/listings/functions'
import type { ListingForEditing } from '@/features/listings/listings.server'
import {
  centsToPriceInput,
  priceInputToCents,
} from '@/features/listings/price-input'
import { cn } from '@/lib/utils'

export function EditListingForm({ listing }: { listing: ListingForEditing }) {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const defaults = {
    ...listing,
    priceEuros: centsToPriceInput(listing.priceCents),
  }

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
      await navigate({ to: '/mes-annonces', search: { modifiee: listing.id } })
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
    <form className="grid gap-6 mt-8" noValidate onSubmit={submit}>
      <input name="id" type="hidden" value={listing.id} />
      <FormSection
        step={1}
        title="Votre objet"
        description="Un titre précis et une description honnête attirent les bons acheteurs."
      >
        <ListingDetailsFields defaults={defaults} />
      </FormSection>

      <FormSection
        step={2}
        title="Prix et localisation"
        description="Seules la ville et le code postal apparaissent sur l’annonce."
      >
        <PriceAndLocationFields defaults={defaults} />
      </FormSection>

      <p className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
        Les photos et le téléphone ne sont pas modifiables depuis cet écran.
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 flex-col-reverse border-t pt-6 sm:flex-row sm:justify-end">
        <Link
          to="/mes-annonces"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'lg' }),
            'flex-1 sm:flex-none',
          )}
        >
          Annuler
        </Link>
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="flex-1 font-semibold sm:flex-none"
        >
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {pending ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </form>
  )
}
