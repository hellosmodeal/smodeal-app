import { Link, useNavigate } from '@tanstack/react-router'

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  MailCheck,
  Pencil,
  ShieldCheck,
  X,
} from 'lucide-react'
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
  formatPhoneForDisplay,
  PHONE_CONSENT_HINT,
  PHONE_CONSENT_LABEL,
} from '@/features/contact/rules'
import {
  FormSection,
  fieldAria,
  ListingDetailsFields,
  ListingField,
  type ListingFieldErrors,
  PriceAndLocationFields,
} from '@/features/listings/components/listing-form-fields'
import { publishListing } from '@/features/listings/functions'
import {
  firstStepWithErrors,
  PUBLISH_STEPS,
  publishListingFieldErrors,
  stepFieldErrors,
} from '@/features/listings/listing-form'
import { priceInputToCents } from '@/features/listings/price-input'
import {
  MAX_LISTING_PHOTOS,
  photoValidationMessage,
} from '@/features/listings/rules'
import { cn } from '@/lib/utils'

type SelectedPhoto = { file: File; url: string }

/** Saved private contact of the member, used to prefill the last step. */
export type SavedContact = { phone: string; displayConsent: boolean }

const LAST_STEP = PUBLISH_STEPS.length - 1

type Recap = {
  title: string
  priceEuros: string
  place: string
}

export function PublishListingForm({
  contact,
}: {
  contact: SavedContact | null
}) {
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const [step, setStep] = useState(0)
  const [reached, setReached] = useState(0)
  const [focusTarget, setFocusTarget] = useState<string | null>(null)
  const [recap, setRecap] = useState<Recap | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ListingFieldErrors>({})
  const [pending, setPending] = useState(false)
  const photos = usePhotoSelection()

  useEffect(() => {
    if (!focusTarget) return
    const form = formRef.current
    const target =
      form?.querySelector<HTMLElement>(`[name="${focusTarget}"]`) ??
      document.getElementById(focusTarget)
    target?.focus()
    if (!focusTarget.startsWith('section-'))
      target?.scrollIntoView({ block: 'center' })
    else form?.scrollIntoView({ block: 'start' })
    setFocusTarget(null)
  }, [focusTarget])

  function clearFieldError(event: FormEvent<HTMLFormElement>) {
    const name = (event.target as { name?: unknown }).name
    if (typeof name !== 'string' || !fieldErrors[name]) return
    setFieldErrors(({ [name]: _cleared, ...rest }) => rest)
  }

  function goTo(next: number) {
    const form = formRef.current
    if (next === LAST_STEP && form) setRecap(recapFrom(new FormData(form)))
    setStep(next)
    setReached((current) => Math.max(current, next))
    setFocusTarget(`section-${next + 1}`)
  }

  function showErrors(target: number, errors: ListingFieldErrors) {
    setFieldErrors(errors)
    const firstInvalid = PUBLISH_STEPS[target]?.fields.find(
      (field) => errors[field],
    )
    setStep(target)
    setFocusTarget(firstInvalid ?? `section-${target + 1}`)
  }

  function continueFrom(form: HTMLFormElement) {
    const errors = stepFieldErrors(
      step,
      publishListingFieldErrors(new FormData(form)),
    )
    if (Object.keys(errors).length > 0) return showErrors(step, errors)
    setFieldErrors({})
    goTo(step + 1)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = event.currentTarget
    if (step < LAST_STEP) return continueFrom(form)
    const errors = publishListingFieldErrors(new FormData(form))
    const invalidStep = firstStepWithErrors(errors)
    if (invalidStep !== null) return showErrors(invalidStep, errors)
    setFieldErrors({})
    setPending(true)
    try {
      const data = new FormData(form)
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
      ref={formRef}
      className="grid gap-6 mt-8 scroll-mt-24"
      encType="multipart/form-data"
      noValidate
      onSubmit={submit}
      onChange={clearFieldError}
    >
      <StepProgress current={step} reached={reached} onSelect={goTo} />

      <FormSection
        step={1}
        title="Votre objet"
        description="Un titre précis et une description honnête attirent les bons acheteurs."
        hidden={step !== 0}
      >
        <ListingDetailsFields errors={fieldErrors} />
      </FormSection>

      <FormSection
        step={2}
        title="Photos"
        description={`Jusqu’à ${MAX_LISTING_PHOTOS} photos, JPG, PNG ou WebP, 5 Mo maximum chacune.`}
        hidden={step !== 1}
      >
        <PhotoPicker photos={photos} />
      </FormSection>

      <FormSection
        step={3}
        title="Prix et localisation"
        description="Seules la ville et le code postal apparaissent sur l’annonce."
        hidden={step !== 2}
      >
        <PriceAndLocationFields errors={fieldErrors} />
      </FormSection>

      <FormSection
        step={4}
        title="Coordonnées et récapitulatif"
        description="Votre numéro n’est jamais affiché publiquement."
        hidden={step !== 3}
      >
        {recap && (
          <ListingRecap
            recap={recap}
            photo={photos.selected[0]?.url}
            photoCount={photos.selected.length}
            onEdit={goTo}
          />
        )}
        <ListingField
          label="Téléphone"
          htmlFor="phone"
          description="Numéro français (06 12 34 56 78) ou international (+33 6 12 34 56 78)."
          error={fieldErrors.phone}
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            pattern="\+?[0-9 .\(\)\-]{9,20}"
            title="Numéro français à 10 chiffres ou international commençant par +, espaces et points acceptés."
            defaultValue={
              contact ? formatPhoneForDisplay(contact.phone) : undefined
            }
            placeholder="Ex. 06 12 34 56 78"
            required
            {...fieldAria('phone', fieldErrors, { described: true })}
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
            defaultChecked={contact?.displayConsent ?? false}
            className="shrink-0 size-4 mt-0.5 accent-primary"
          />
          <span className="grid gap-1">
            <span className="flex gap-1.5 items-center font-medium">
              <ShieldCheck className="size-4 text-primary" aria-hidden />
              {PHONE_CONSENT_LABEL}
            </span>
            <span className="text-muted-foreground">{PHONE_CONSENT_HINT}</span>
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
          {step === 0 ? (
            <Link
              to="/mes-annonces"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'h-11 flex-1 px-5 sm:flex-none',
              )}
            >
              Annuler
            </Link>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => goTo(step - 1)}
              className="flex-1 h-11 px-5 sm:flex-none"
            >
              <ArrowLeft aria-hidden />
              Retour
            </Button>
          )}
          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className="flex-1 h-11 px-6 font-semibold sm:flex-none"
          >
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {step < LAST_STEP ? (
              <>
                Continuer
                <ArrowRight aria-hidden />
              </>
            ) : pending ? (
              'Publication…'
            ) : (
              'Publier l’annonce'
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

function recapFrom(form: FormData): Recap {
  const text = (name: string) => String(form.get(name) ?? '').trim()
  return {
    title: text('title'),
    priceEuros: text('priceEuros'),
    place: [text('city'), text('postalCode')].filter(Boolean).join(' · '),
  }
}

function StepProgress({
  current,
  reached,
  onSelect,
}: {
  current: number
  reached: number
  onSelect: (step: number) => void
}) {
  return (
    <nav aria-label="Étapes du dépôt">
      <p className="text-sm font-medium text-muted-foreground sm:hidden">
        Étape {current + 1} sur {PUBLISH_STEPS.length} ·{' '}
        <span className="text-foreground">{PUBLISH_STEPS[current]?.title}</span>
      </p>
      <ol className="flex gap-2 mt-2 sm:mt-0">
        {PUBLISH_STEPS.map(({ title }, index) => {
          const done = index < current
          const active = index === current
          return (
            <li key={title} className="flex-1">
              <button
                type="button"
                onClick={() => onSelect(index)}
                disabled={index > reached || active}
                aria-current={active ? 'step' : undefined}
                className="grid gap-2 w-full rounded-md outline-none text-left group focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default"
              >
                <span
                  className={cn(
                    'h-1.5 rounded-full bg-muted transition-colors',
                    (done || active) && 'bg-primary',
                  )}
                />
                <span
                  className={cn(
                    'hidden items-center gap-1.5 text-sm sm:flex',
                    active
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground',
                    index <= reached &&
                      !active &&
                      'group-hover:text-foreground',
                  )}
                >
                  {done && (
                    <Check className="size-4 text-primary" aria-hidden />
                  )}
                  {index + 1}. {title}
                </span>
                <span className="sr-only sm:hidden">
                  {index + 1}. {title}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function ListingRecap({
  recap,
  photo,
  photoCount,
  onEdit,
}: {
  recap: Recap
  photo: string | undefined
  photoCount: number
  onEdit: (step: number) => void
}) {
  return (
    <div className="flex gap-4 items-start rounded-lg border border-border p-3">
      <div className="overflow-hidden grid shrink-0 place-items-center size-20 rounded-md bg-muted">
        {photo ? (
          <img src={photo} alt="" className="object-cover size-full" />
        ) : (
          <ImagePlus className="size-6 text-muted-foreground" aria-hidden />
        )}
      </div>
      <dl className="grid gap-1 flex-1 min-w-0 text-sm">
        <dt className="sr-only">Titre</dt>
        <dd className="truncate font-medium">{recap.title}</dd>
        <dt className="sr-only">Prix</dt>
        <dd className="font-heading text-base font-semibold">
          {recap.priceEuros} €
        </dd>
        <dt className="sr-only">Lieu et photos</dt>
        <dd className="text-muted-foreground">
          {recap.place} ·{' '}
          {photoCount === 0
            ? 'aucune photo'
            : `${photoCount} photo${photoCount > 1 ? 's' : ''}`}
        </dd>
      </dl>
      <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(0)}>
        <Pencil aria-hidden />
        Modifier
      </Button>
    </div>
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
