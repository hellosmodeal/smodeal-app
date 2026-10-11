import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { geoApi } from './communes.server'
import type { CitySuggestion } from './rules'

export const suggestCities = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ q: z.string().max(80) }))
  .handler(
    ({ data }): Promise<CitySuggestion[]> => geoApi.searchCommunes(data.q),
  )

export const findCommuneAt = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
  )
  .handler(({ data }): Promise<CitySuggestion | null> => geoApi.communeAt(data))
