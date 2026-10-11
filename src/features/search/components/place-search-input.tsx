import { useNavigate } from '@tanstack/react-router'
import { Building2, Loader2, LocateFixed, Map as MapIcon } from 'lucide-react'
import { useState } from 'react'
import { LocationAutocomplete } from '@/features/locations/components/location-autocomplete'
import { useCitySuggestions } from '@/features/locations/components/use-city-suggestions'
import type { LocatedPlace } from '@/features/locations/components/use-locate-me'
import {
  departmentSuggestions,
  type GeoPoint,
} from '@/features/locations/rules'
import {
  parseSearchCriteria,
  radiusOptions,
  type SearchCriteria,
} from '../rules'

type PlaceSuggestion =
  | { kind: 'department'; code: string; name: string }
  | {
      kind: 'city'
      city: string
      postalCodes: string[]
      department: string
      center?: GeoPoint
    }

const placeValue = (place: PlaceSuggestion) =>
  place.kind === 'city' ? place.city : place.code

const placeKey = (place: PlaceSuggestion) =>
  place.kind === 'city'
    ? `city:${place.city}:${place.postalCodes[0]}`
    : `department:${place.code}`

export function PlaceSearchInput({
  id,
  criteria,
  locate,
  locating,
}: {
  id: string
  criteria: SearchCriteria
  locate: () => Promise<LocatedPlace | null>
  locating: boolean
}) {
  const navigate = useNavigate()
  const [value, setValue] = useState(criteria.lieu ?? '')
  const [anchor, setAnchor] = useState<{
    label: string
    point: GeoPoint
  } | null>(
    criteria.lat !== undefined && criteria.lng !== undefined
      ? {
          label: criteria.lieu ?? '',
          point: { lat: criteria.lat, lng: criteria.lng },
        }
      : null,
  )
  const point = anchor && anchor.label === value ? anchor.point : null
  const { cities, loading } = useCitySuggestions(value)
  const places: PlaceSuggestion[] = [
    ...departmentSuggestions(value).map((department) => ({
      kind: 'department' as const,
      ...department,
    })),
    ...cities.map((city) => ({ kind: 'city' as const, ...city })),
  ]

  function choosePlace(place: PlaceSuggestion) {
    setAnchor(
      place.kind === 'city' && place.center
        ? { label: place.city, point: place.center }
        : null,
    )
  }

  async function searchAroundMe(form: HTMLFormElement | null) {
    const located = await locate()
    if (!located || !form) return
    const label = located.city ?? ''
    setValue(label)
    setAnchor({ label, point: located.point })
    const values = Object.fromEntries(new FormData(form))
    await navigate({
      to: '/recherche',
      search: parseSearchCriteria({
        ...values,
        lieu: label,
        lat: located.point.lat,
        lng: located.point.lng,
      }),
    })
  }

  return (
    <>
      <LocationAutocomplete
        value={value}
        onValueChange={setValue}
        items={places}
        itemKey={placeKey}
        itemToString={placeValue}
        onSelect={choosePlace}
        loading={loading && places.length === 0}
        renderItem={(place) =>
          place.kind === 'city' ? (
            <>
              <Building2 className="size-4 text-muted-foreground" aria-hidden />
              <span className="flex-1 truncate">{place.city}</span>
              <span className="text-xs text-muted-foreground">
                {place.postalCodes.length === 1
                  ? place.postalCodes[0]
                  : place.department}
              </span>
            </>
          ) : (
            <>
              <MapIcon className="size-4 text-muted-foreground" aria-hidden />
              <span className="flex-1 truncate">{place.name}</span>
              <span className="text-xs text-muted-foreground">
                Département {place.code}
              </span>
            </>
          )
        }
        input={
          <input
            id={id}
            name="lieu"
            type="search"
            autoComplete="off"
            placeholder={
              point ? 'Autour de vous' : 'Ville, code postal ou département'
            }
            className="w-full min-w-0 outline-none text-sm bg-transparent placeholder:text-muted-foreground"
          />
        }
      />
      {point && (
        <>
          <input type="hidden" name="lat" value={point.lat} />
          <input type="hidden" name="lng" value={point.lng} />
          <label htmlFor={`${id}-rayon`} className="sr-only">
            Rayon de recherche
          </label>
          <select
            id={`${id}-rayon`}
            name="rayon"
            defaultValue={criteria.rayon ?? 10}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className="shrink-0 rounded-md outline-none py-1 text-sm font-medium bg-transparent cursor-pointer focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {radiusOptions.map((radius) => (
              <option key={radius} value={radius}>
                {radius} km
              </option>
            ))}
          </select>
        </>
      )}
      <button
        type="button"
        onClick={(event) => searchAroundMe(event.currentTarget.form)}
        disabled={locating}
        aria-label="Rechercher autour de ma position"
        title="Autour de moi"
        className="grid place-items-center shrink-0 size-8 rounded-md outline-none text-muted-foreground transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-muted hover:text-foreground disabled:opacity-60"
      >
        {locating ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <LocateFixed className="size-4" aria-hidden />
        )}
      </button>
    </>
  )
}
