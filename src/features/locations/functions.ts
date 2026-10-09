import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { searchCommunes } from './communes.server'
import type { CitySuggestion } from './rules'

export const suggestCities = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ q: z.string().max(80) }))
  .handler(({ data }): Promise<CitySuggestion[]> => searchCommunes(data.q))
