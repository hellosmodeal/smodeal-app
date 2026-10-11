import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { findCommuneAt } from '../functions'
import { type GeoPoint, roundCoordinate } from '../rules'

export type LocatedPlace = { point: GeoPoint; city: string | null }

const GEOLOCATION_TIMEOUT_MS = 10_000
const POSITION_MAX_AGE_MS = 10 * 60 * 1000

const errorMessages: Record<number, string> = {
  1: 'Autorisez la localisation dans votre navigateur ou saisissez une ville.',
  2: 'Votre position est introuvable pour le moment. Saisissez une ville.',
  3: 'La localisation a pris trop de temps. Réessayez ou saisissez une ville.',
}

function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: GEOLOCATION_TIMEOUT_MS,
      maximumAge: POSITION_MAX_AGE_MS,
    }),
  )
}

/** Browser position rounded to about one kilometre, with its commune when known. */
export function useLocateMe(): {
  locate: () => Promise<LocatedPlace | null>
  locating: boolean
  error: string | null
} {
  const communeAt = useServerFn(findCommuneAt)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function locate(): Promise<LocatedPlace | null> {
    setError(null)
    if (!('geolocation' in navigator)) {
      setError('Votre navigateur ne permet pas la localisation.')
      return null
    }
    setLocating(true)
    try {
      const { coords } = await currentPosition()
      const point = {
        lat: roundCoordinate(coords.latitude),
        lng: roundCoordinate(coords.longitude),
      }
      const commune = await communeAt({ data: point }).catch(() => null)
      return { point, city: commune?.city ?? null }
    } catch (failure) {
      const code = (failure as GeolocationPositionError | undefined)?.code
      setError(
        errorMessages[code ?? 0] ??
          'Impossible de vous localiser. Saisissez une ville.',
      )
      return null
    } finally {
      setLocating(false)
    }
  }

  return { locate, locating, error }
}
