import { Building2, Map as MapIcon } from 'lucide-react'
import { useState } from 'react'
import { LocationAutocomplete } from '@/features/locations/components/location-autocomplete'
import { useCitySuggestions } from '@/features/locations/components/use-city-suggestions'
import { departmentSuggestions } from '@/features/locations/rules'

type PlaceSuggestion =
  | { kind: 'department'; code: string; name: string }
  | { kind: 'city'; city: string; postalCodes: string[]; department: string }

const placeValue = (place: PlaceSuggestion) =>
  place.kind === 'city' ? place.city : place.code

const placeKey = (place: PlaceSuggestion) =>
  place.kind === 'city'
    ? `city:${place.city}:${place.postalCodes[0]}`
    : `department:${place.code}`

export function PlaceSearchInput({
  id,
  defaultValue = '',
}: {
  id: string
  defaultValue?: string
}) {
  const [value, setValue] = useState(defaultValue)
  const { cities, loading } = useCitySuggestions(value)
  const places: PlaceSuggestion[] = [
    ...departmentSuggestions(value).map((department) => ({
      kind: 'department' as const,
      ...department,
    })),
    ...cities.map((city) => ({ kind: 'city' as const, ...city })),
  ]

  return (
    <LocationAutocomplete
      value={value}
      onValueChange={setValue}
      items={places}
      itemKey={placeKey}
      itemToString={placeValue}
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
          placeholder="Ville, code postal ou département"
          className="w-full min-w-0 outline-none text-sm bg-transparent placeholder:text-muted-foreground"
        />
      }
    />
  )
}
