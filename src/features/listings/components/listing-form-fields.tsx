import { type ChangeEvent, type ReactNode, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { departmentFromPostalCode } from '@/features/listings/postal-code'
import {
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
} from '@/features/listings/rules'

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

export function FormSection({
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

export function ListingField({
  label,
  htmlFor,
  hint,
  description,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  description?: ReactNode
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
    </div>
  )
}

/** Title, category, condition and description, shared by publish and edit. */
export function ListingDetailsFields({
  defaults = {},
}: {
  defaults?: ListingFieldDefaults
}) {
  const [title, setTitle] = useState(defaults.title ?? '')
  return (
    <>
      <ListingField
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
      </ListingField>
      <div className="grid gap-5 sm:grid-cols-2">
        <ListingField label="Catégorie" htmlFor="categorySlug">
          <NativeSelect
            id="categorySlug"
            name="categorySlug"
            defaultValue={defaults.categorySlug}
            className="w-full [&>select]:h-10"
          >
            {LISTING_CATEGORIES.map((category) => (
              <NativeSelectOption key={category} value={category}>
                {categoryLabels[category]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </ListingField>
        <ListingField label="État" htmlFor="condition">
          <NativeSelect
            id="condition"
            name="condition"
            defaultValue={defaults.condition ?? 'good'}
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
      <ListingField label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          defaultValue={defaults.description}
          required
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
}: {
  defaults?: ListingFieldDefaults
}) {
  const [department, setDepartment] = useState(defaults.department ?? '')
  const [suggestedDepartment, setSuggestedDepartment] = useState<string | null>(
    defaults.postalCode ? departmentFromPostalCode(defaults.postalCode) : null,
  )

  function updatePostalCode(event: ChangeEvent<HTMLInputElement>) {
    const suggestion = departmentFromPostalCode(event.target.value)
    if (department === '' || department === suggestedDepartment)
      setDepartment(suggestion ?? '')
    setSuggestedDepartment(suggestion)
  }

  return (
    <>
      <ListingField label="Prix" htmlFor="priceEuros">
        <div className="relative sm:max-w-56">
          <Input
            id="priceEuros"
            name="priceEuros"
            inputMode="decimal"
            title="Un montant en euros, avec au maximum deux décimales (ex. : 25 ou 12,50)."
            placeholder="0"
            defaultValue={defaults.priceEuros}
            required
            className="h-10 pr-9"
          />
          <span className="absolute right-3 inset-y-0 flex items-center text-sm text-muted-foreground pointer-events-none">
            €
          </span>
        </div>
      </ListingField>
      <div className="grid gap-5 sm:grid-cols-[10rem_1fr_8rem]">
        <ListingField label="Code postal" htmlFor="postalCode">
          <Input
            id="postalCode"
            name="postalCode"
            inputMode="numeric"
            autoComplete="postal-code"
            pattern="[0-9]{5}"
            maxLength={5}
            placeholder="75011"
            defaultValue={defaults.postalCode}
            onChange={updatePostalCode}
            required
            className="h-10"
          />
        </ListingField>
        <ListingField label="Ville" htmlFor="city">
          <Input
            id="city"
            name="city"
            autoComplete="address-level2"
            placeholder="Paris"
            defaultValue={defaults.city}
            required
            className="h-10"
          />
        </ListingField>
        <ListingField label="Département" htmlFor="department">
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
        </ListingField>
      </div>
    </>
  )
}
