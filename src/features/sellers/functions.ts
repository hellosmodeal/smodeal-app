import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { z } from 'zod'
import { getPublicSellerProfile } from './sellers.server'

export const findSellerProfile = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({ profileId: z.string().regex(/^[A-Za-z0-9._-]{1,36}$/) }),
  )
  .handler(async ({ data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return getPublicSellerProfile(data.profileId, new Date())
  })
