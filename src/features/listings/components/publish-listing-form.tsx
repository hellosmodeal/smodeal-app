import { Link, useNavigate } from '@tanstack/react-router'

import { ImagePlus, Loader2, MailCheck, ShieldCheck, X } from 'lucide-react'
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { assertMutationSucceeded } from '@/features/abuse/result'
import {
  FormSection,
  ListingDetailsFields,
  ListingField,
  PriceAndLocationFields,
} from '@/features/listings/components/listing-form-fields'
import { publishListing } from '@/features/listings/functions'
import { priceInputToCents } from '@/features/listings/price-input'
import {
  MAX_LISTING_PHOTOS,
  photoValidationMessage,
} from '@/features/listings/rules'
import { cn } from '@/lib/utils'

type SelectedPhoto = { file: File; url: string }

export function PublishListingForm() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const photos = usePhotoSelection()

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
      data.delete('photos')
      for (const photo of photos.selected) data.append('photos', photo.file)
      const result = await publishListing({ data })
      assertMutationSucceeded(result)
      await navigate({ to: '/mes-annonces', search: { publiee: result.id } })
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
    <form
      className="grid gap-6 mt-8"
      encType="multipart/form-data"
      noValidate
      onSubmit={submit}
    >
      <FormSection
        step={1}
        title="Votre objet"
        description="Un titre précis et une description honnête attirent les bons acheteurs."
      >
        <ListingDetailsFields />
      </FormSection>

      <FormSection
        step={2}
        title="Photos"
        description={`Jusqu’à ${MAX_LISTING_PHOTOS} photos, JPG, PNG ou WebP, 5 Mo maximum chacune.`}
      >
        <PhotoPicker photos={photos} />
      </FormSection>

      <FormSection
        step={3}
        title="Prix et localisation"
        description="Seules la ville et le code postal apparaissent sur l’annonce."
      >
        <PriceAndLocationFields />
      </FormSection>

      <FormSection
        step={4}
        title="Coordonnées"
        description="Votre numéro n’est jamais affiché publiquement."
      >
        <ListingField
          label="Téléphone"
          htmlFor="phone"
          description="Numéro français (06 12 34 56 78) ou international (+33 6 12 34 56 78)."
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            pattern="\+?[0-9 .\(\)\-]{9,20}"
            title="Numéro français à 10 chiffres ou international commençant par +, espaces et points acceptés."
            aria-describedby="phone-description"
            placeholder="06 12 34 56 78"
            required
            className="h-10 sm:max-w-64"
          />
        </ListingField>
        <label
          htmlFor="display-consent"
          className="flex gap-3 items-start rounded-lg border border-border p-4 text-sm bg-brand-surface cursor-pointer has-checked:border-primary"
        >
          <input
            id="display-consent"
            name="displayConsent"
            type="checkbox"
            className="shrink-0 size-4 mt-0.5 accent-primary"
          />
          <span className="grid gap-1">
            <span className="flex gap-1.5 items-center font-medium">
              <ShieldCheck className="size-4 text-primary" aria-hidden />
              Partager mon numéro avec les acheteurs
            </span>
            <span className="text-muted-foreground">
              Seuls les membres connectés qui souhaitent vous contacter pourront
              le voir. Sans cet accord, votre annonce reste visible mais aucun
              acheteur ne pourra vous contacter.
            </span>
          </span>
        </label>
      </FormSection>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 flex-col-reverse border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex gap-2 items-center text-sm text-muted-foreground">
          <MailCheck className="shrink-0 size-4" aria-hidden />
          Adresse email vérifiée requise · en ligne 60 jours
        </p>
        <div className="flex gap-3">
          <Link
            to="/mes-annonces"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'h-11 flex-1 px-5 sm:flex-none',
            )}
          >
            Annuler
          </Link>
          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className="flex-1 h-11 px-6 font-semibold sm:flex-none"
          >
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {pending ? 'Publication…' : 'Publier l’annonce'}
          </Button>
        </div>
      </div>
    </form>
  )
}

function usePhotoSelection() {
  const [selected, setSelected] = useState<SelectedPhoto[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const selectedRef = useRef(selected)
  selectedRef.current = selected

  useEffect(
    () => () => {
      for (const photo of selectedRef.current) URL.revokeObjectURL(photo.url)
    },
    [],
  )

  function add(files: Iterable<File>) {
    const room = MAX_LISTING_PHOTOS - selected.length
    const accepted: SelectedPhoto[] = []
    let rejection: string | null = null
    for (const file of files) {
      const invalid = photoValidationMessage(file)
      if (invalid) rejection = invalid
      else if (accepted.length >= room)
        rejection = `${MAX_LISTING_PHOTOS} photos maximum par annonce.`
      else accepted.push({ file, url: URL.createObjectURL(file) })
    }
    setMessage(rejection)
    setSelected([...selected, ...accepted])
  }

  function remove(index: number) {
    const photo = selected[index]
    if (photo) URL.revokeObjectURL(photo.url)
    setMessage(null)
    setSelected(selected.filter((_, position) => position !== index))
  }

  return { selected, message, add, remove }
}

function PhotoPicker({
  photos,
}: {
  photos: ReturnType<typeof usePhotoSelection>
}) {
  const [dragging, setDragging] = useState(false)
  const full = photos.selected.length >= MAX_LISTING_PHOTOS

  function pick(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) photos.add(event.target.files)
    event.target.value = ''
  }

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    photos.add(event.dataTransfer.files)
  }

  return (
    <div className="grid gap-3">
      <ul className="grid gap-3 grid-cols-3 sm:grid-cols-5">
        {photos.selected.map((photo, index) => (
          <li
            key={photo.url}
            className="overflow-hidden relative aspect-square rounded-lg border bg-muted group"
          >
            <img
              src={photo.url}
              alt={`Aperçu ${index + 1} : ${photo.file.name}`}
              className="object-cover size-full"
            />
            {index === 0 && (
              <span className="absolute left-1.5 bottom-1.5 rounded-md py-0.5 px-1.5 text-xs font-medium bg-background/90">
                Principale
              </span>
            )}
            <button
              type="button"
              onClick={() => photos.remove(index)}
              aria-label={`Retirer la photo ${index + 1}`}
              className="absolute right-1.5 top-1.5 grid place-items-center size-7 rounded-full outline-none bg-background/90 text-foreground shadow-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-background"
            >
              <X className="size-4" aria-hidden />
            </button>
          </li>
        ))}
        {!full && (
          <li
            className={cn(
              photos.selected.length === 0
                ? 'col-span-3 sm:col-span-5'
                : 'aspect-square',
            )}
          >
            <label
              htmlFor="photos"
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={drop}
              className={cn(
                'flex size-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input p-4 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-brand-surface has-focus-visible:border-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                dragging && 'border-primary bg-brand-surface',
                photos.selected.length === 0 && 'py-10',
              )}
            >
              <ImagePlus className="size-6 text-primary" aria-hidden />
              {photos.selected.length === 0 ? (
                <span>
                  <span className="font-medium text-foreground">
                    Ajoutez des photos
                  </span>{' '}
                  ou glissez-les ici
                </span>
              ) : (
                <span className="font-medium text-foreground">Ajouter</span>
              )}
              <input
                id="photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={pick}
                className="sr-only"
              />
            </label>
          </li>
        )}
      </ul>
      <p
        className={cn(
          'text-sm',
          photos.message ? 'text-destructive' : 'text-muted-foreground',
        )}
        aria-live="polite"
      >
        {photos.message ??
          `${photos.selected.length}/${MAX_LISTING_PHOTOS} photos · les annonces avec photos sont plus consultées.`}
      </p>
    </div>
  )
}
