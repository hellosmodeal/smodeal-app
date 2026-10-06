import { Link, useNavigate } from '@tanstack/react-router'

import {
  ChevronDown,
  ImagePlus,
  Loader2,
  MailCheck,
  ShieldCheck,
  X,
} from 'lucide-react'
import {
  type ChangeEvent,
  type ComponentProps,
  type DragEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { assertMutationSucceeded } from '@/features/abuse/result'
import { publishListing } from '@/features/listings/functions'
import { departmentFromPostalCode } from '@/features/listings/postal-code'
import { priceInputToCents } from '@/features/listings/price-input'
import {
  LISTING_CATEGORIES,
  MAX_LISTING_PHOTOS,
  photoValidationMessage,
} from '@/features/listings/rules'
import { cn } from '@/lib/utils'

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

const TITLE_MAX_LENGTH = 120

type SelectedPhoto = { file: File; url: string }

export function PublishListingForm() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('')
  const [suggestedDepartment, setSuggestedDepartment] = useState<string | null>(
    null,
  )

  function updatePostalCode(event: ChangeEvent<HTMLInputElement>) {
    const suggestion = departmentFromPostalCode(event.target.value)
    if (department === '' || department === suggestedDepartment)
      setDepartment(suggestion ?? '')
    setSuggestedDepartment(suggestion)
  }

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
    <form
      className="grid gap-6 mt-8"
      encType="multipart/form-data"
      onSubmit={submit}
    >
      <FormSection
        step={1}
        title="Votre objet"
        description="Un titre précis et une description honnête attirent les bons acheteurs."
      >
        <FieldGroup
          label="Titre"
          htmlFor="title"
          hint={`${title.length}/${TITLE_MAX_LENGTH}`}
        >
          <Input
            id="title"
            name="title"
            maxLength={TITLE_MAX_LENGTH}
            placeholder="Ex. : Vélo de ville Peugeot, taille M"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="h-10"
          />
        </FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <FieldGroup label="Catégorie" htmlFor="categorySlug">
            <NativeSelect id="categorySlug" name="categorySlug">
              {LISTING_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {categoryLabels[category]}
                </option>
              ))}
            </NativeSelect>
          </FieldGroup>
          <FieldGroup label="État" htmlFor="condition">
            <NativeSelect id="condition" name="condition" defaultValue="good">
              {Object.entries(conditionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </FieldGroup>
        </div>
        <FieldGroup label="Description" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            required
            placeholder="État réel, dimensions, ancienneté, raison de la vente, remise en main propre…"
            className="min-h-36"
          />
        </FieldGroup>
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
        <FieldGroup label="Prix" htmlFor="priceEuros">
          <div className="relative sm:max-w-56">
            <Input
              id="priceEuros"
              name="priceEuros"
              inputMode="decimal"
              pattern="\d{1,8}([.,]\d{1,2})?"
              placeholder="0"
              required
              className="h-10 pr-9"
            />
            <span className="absolute right-3 inset-y-0 flex items-center text-sm text-muted-foreground pointer-events-none">
              €
            </span>
          </div>
        </FieldGroup>
        <div className="grid gap-5 sm:grid-cols-[10rem_1fr_8rem]">
          <FieldGroup label="Code postal" htmlFor="postalCode">
            <Input
              id="postalCode"
              name="postalCode"
              inputMode="numeric"
              autoComplete="postal-code"
              pattern="[0-9]{5}"
              maxLength={5}
              placeholder="75011"
              onChange={updatePostalCode}
              required
              className="h-10"
            />
          </FieldGroup>
          <FieldGroup label="Ville" htmlFor="city">
            <Input
              id="city"
              name="city"
              autoComplete="address-level2"
              placeholder="Paris"
              required
              className="h-10"
            />
          </FieldGroup>
          <FieldGroup label="Département" htmlFor="department">
            <Input
              id="department"
              name="department"
              pattern="[0-9]{2}|2A|2B|97[0-9]|98[0-9]"
              placeholder="75"
              value={department}
              onChange={(event) =>
                setDepartment(event.target.value.toUpperCase())
              }
              required
              className="h-10"
            />
          </FieldGroup>
        </div>
      </FormSection>

      <FormSection
        step={4}
        title="Coordonnées"
        description="Votre numéro n’est jamais affiché publiquement."
      >
        <FieldGroup label="Téléphone" htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="06 12 34 56 78"
            required
            className="h-10 sm:max-w-64"
          />
        </FieldGroup>
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
              le voir. Sans cet accord, il ne sera pas accessible.
            </span>
          </span>
        </label>
      </FormSection>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 p-3 text-sm bg-destructive/10 text-destructive"
        >
          {error}
        </p>
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

function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: number
  title: string
  description: string
  children: ReactNode
}) {
  const headingId = `section-${step}`
  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-5 rounded-xl ring-1 ring-foreground/10 p-5 bg-card sm:p-6"
    >
      <header className="flex gap-3">
        <span className="grid shrink-0 place-items-center size-7 rounded-full text-sm font-semibold bg-brand-surface text-primary">
          {step}
        </span>
        <div className="grid gap-1">
          <h2 id={headingId} className="font-heading text-lg font-semibold">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </header>
      {children}
    </section>
  )
}

function FieldGroup({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-2">
      <div className="flex gap-2 items-center justify-between">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          'h-10 w-full appearance-none rounded-lg border border-input bg-transparent pr-9 pl-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30',
          className,
        )}
      />
      <ChevronDown
        className="absolute right-3 top-1/2 size-4 text-muted-foreground pointer-events-none -translate-y-1/2"
        aria-hidden
      />
    </div>
  )
}
