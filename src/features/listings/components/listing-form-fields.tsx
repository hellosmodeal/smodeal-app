import { type ChangeEvent, type ReactNode, useEffect, useState } from 'react'

import { FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { departmentFromPostalCode } from '@/features/listings/postal-code'
import {
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
} from '@/features/listings/rules'
import { LocationAutocomplete } from '@/features/locations/components/location-autocomplete'
import { useCitySuggestions } from '@/features/locations/components/use-city-suggestions'
import {
  type CitySuggestion,
  postalCodeAfterCityChoice,
} from '@/features/locations/rules'

const categoryLabels = {
  maison: 'Maison',
  multimedia: 'Multimédia',
  mode: 'Mode',
  loisirs: 'Loisirs',
  enfants: 'Enfants',
  jardin: 'Jardin',
} as const satisfies Record<(typeof LISTING_CATEGORIES)[number], string>

const conditionLabels = {
  new: 'Neuf',
  like_new: 'Comme neuf',
  good: 'Bon état',
  fair: 'État correct',
} as const satisfies Record<(typeof LISTING_CONDITIONS)[number], string>

const TITLE_MAX_LENGTH = 120

export type ListingFieldDefaults = {
  title?: string
  description?: string
  categorySlug?: string
  condition?: string
  priceEuros?: string
  city?: string
  postalCode?: string
  department?: string
}

/** Inline field errors, keyed by input name. */
export type ListingFieldErrors = Record<string, string>

/** Accessibility attributes linking an input to its description and error. */
export function fieldAria(
  id: string,
  errors: ListingFieldErrors | undefined,
  { described = false }: { described?: boolean } = {},
) {
  const error = errors?.[id]
  const ids = [
    described ? `${id}-description` : null,
    error ? `${id}-error` : null,
  ].filter(Boolean)
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': ids.length ? ids.join(' ') : undefined,
  } as const
}

export function FormSection({
  step,
  title,
  description,
  hidden,
  children,
}: {
  step: number
  title: string
  description: string
  hidden?: boolean
  children: ReactNode
}) {
  const headingId = `section-${step}`
  return (
    <section
      aria-labelledby={headingId}
      hidden={hidden}
      className="grid gap-5 rounded-xl ring-1 ring-foreground/10 p-5 bg-card sm:p-6"
    >
      <header className="flex gap-3">
        <span className="grid shrink-0 place-items-center size-7 rounded-full text-sm font-semibold bg-brand-surface text-primary">
          {step}
        </span>
        <div className="grid gap-1">
          <h2
            id={headingId}
            tabIndex={-1}
            className="outline-none font-heading text-lg font-semibold"
          >
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </header>
      {children}
    </section>
  )
}

export function ListingField({
  label,
  htmlFor,
  hint,
  description,
  error,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  description?: ReactNode
  error?: string
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
      {description && (
        <p
          id={`${htmlFor}-description`}
          className="text-sm text-muted-foreground"
        >
          {description}
        </p>
      )}
      <FieldError id={`${htmlFor}-error`}>{error}</FieldError>
    </div>
  )
}

/** Title, category, condition and description, shared by publish and edit. */
export function ListingDetailsFields({
  defaults = {},
  errors,
}: {
  defaults?: ListingFieldDefaults
  errors?: ListingFieldErrors
}) {
  const [title, setTitle] = useState(defaults.title ?? '')
  return (
    <>
      <ListingField
        label="Titre"
        htmlFor="title"
        hint={`${title.length}/${TITLE_MAX_LENGTH}`}
        error={errors?.title}
      >
        <Input
          id="title"
          name="title"
          maxLength={TITLE_MAX_LENGTH}
          placeholder="Ex. : Vélo de ville Peugeot, taille M"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          {...fieldAria('title', errors)}
          className="h-10"
        />
      </ListingField>
      <div className="grid gap-5 sm:grid-cols-2">
        <ListingField
          label="Catégorie"
          htmlFor="categorySlug"
          error={errors?.categorySlug}
        >
          <NativeSelect
            id="categorySlug"
            name="categorySlug"
            defaultValue={defaults.categorySlug}
            {...fieldAria('categorySlug', errors)}
            className="w-full [&>select]:h-10"
          >
            {LISTING_CATEGORIES.map((category) => (
              <NativeSelectOption key={category} value={category}>
                {categoryLabels[category]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </ListingField>
        <ListingField
          label="État"
          htmlFor="condition"
          error={errors?.condition}
        >
          <NativeSelect
            id="condition"
            name="condition"
            defaultValue={defaults.condition ?? 'good'}
            {...fieldAria('condition', errors)}
            className="w-full [&>select]:h-10"
          >
            {LISTING_CONDITIONS.map((condition) => (
              <NativeSelectOption key={condition} value={condition}>
                {conditionLabels[condition]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </ListingField>
      </div>
      <ListingField
        label="Description"
        htmlFor="description"
        error={errors?.description}
      >
        <Textarea
          id="description"
          name="description"
          defaultValue={defaults.description}
          required
          {...fieldAria('description', errors)}
          placeholder="État réel, dimensions, ancienneté, raison de la vente, remise en main propre…"
          className="min-h-36"
        />
      </ListingField>
    </>
  )
}

/** Price in euros plus postal code, city and suggested department. */
export function PriceAndLocationFields({
  defaults = {},
  errors,
}: {
  defaults?: ListingFieldDefaults
  errors?: ListingFieldErrors
}) {
  const [postalCode, setPostalCode] = useState(defaults.postalCode ?? '')
  const [city, setCity] = useState(defaults.city ?? '')
  const [department, setDepartment] = useState(defaults.department ?? '')
  const [suggestedDepartment, setSuggestedDepartment] = useState<string | null>(
    defaults.postalCode ? departmentFromPostalCode(defaults.postalCode) : null,
  )
  const cityQuery = city.trim() === '' ? postalCode : city
  const { cities, loading } = useCitySuggestions(cityQuery)
  const postalCodeMatches = cityQuery === postalCode

  useEffect(() => {
    const [only] = cities
    if (postalCodeMatches && city === '' && cities.length === 1 && only)
      setCity(only.city)
  }, [cities, postalCodeMatches, city])

  function updatePostalCode(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value
    setPostalCode(next)
    const suggestion = departmentFromPostalCode(next)
    if (department === '' || department === suggestedDepartment)
      setDepartment(suggestion ?? '')
    setSuggestedDepartment(suggestion)
  }

  function chooseCity(choice: CitySuggestion) {
    const nextPostalCode = postalCodeAfterCityChoice(postalCode, choice)
    setCity(choice.city)
    setPostalCode(nextPostalCode)
    setDepartment(choice.department)
    setSuggestedDepartment(choice.department)
  }

  return (
    <>
      <ListingField
        label="Prix"
        htmlFor="priceEuros"
        error={errors?.priceEuros}
      >
        <div className="relative sm:max-w-56">
          <Input
            id="priceEuros"
            name="priceEuros"
            inputMode="decimal"
            title="Un montant en euros, avec au maximum deux décimales (ex. : 25 ou 12,50)."
            placeholder="0"
            defaultValue={defaults.priceEuros}
            required
            {...fieldAria('priceEuros', errors)}
            className="h-10 pr-9"
          />
          <span className="absolute right-3 inset-y-0 flex items-center text-sm text-muted-foreground pointer-events-none">
            €
          </span>
        </div>
      </ListingField>
      <div className="grid gap-5 sm:grid-cols-[10rem_1fr_8rem]">
        <ListingField
          label="Code postal"
          htmlFor="postalCode"
          error={errors?.postalCode}
        >
          <Input
            id="postalCode"
            name="postalCode"
            inputMode="numeric"
            autoComplete="postal-code"
            pattern="[0-9]{5}"
            maxLength={5}
            placeholder="75011"
            value={postalCode}
            onChange={updatePostalCode}
            required
            {...fieldAria('postalCode', errors)}
            className="h-10"
          />
        </ListingField>
        <ListingField label="Ville" htmlFor="city" error={errors?.city}>
          <LocationAutocomplete
            value={city}
            onValueChange={setCity}
            items={cities}
            itemKey={(choice) => `${choice.city}:${choice.postalCodes[0]}`}
            itemToString={(choice) => choice.city}
            onSelect={chooseCity}
            loading={loading}
            openOnInputClick
            renderItem={(choice) => (
              <>
                <span className="flex-1 truncate">{choice.city}</span>
                <span className="text-xs text-muted-foreground">
                  {postalCodesLabel(choice)}
                </span>
              </>
            )}
            input={
              <Input
                id="city"
                name="city"
                autoComplete="off"
                placeholder="Paris"
                required
                {...fieldAria('city', errors)}
                className="h-10"
              />
            }
          />
        </ListingField>
        <ListingField
          label="Département"
          htmlFor="department"
          error={errors?.department}
        >
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
            {...fieldAria('department', errors)}
            className="h-10"
          />
        </ListingField>
      </div>
    </>
  )
}

function postalCodesLabel({ postalCodes, department }: CitySuggestion) {
  if (postalCodes.length === 1) return postalCodes[0]
  return `${postalCodes.length} codes postaux · ${department}`
}
