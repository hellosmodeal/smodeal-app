import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { getServerEnv } from '@/server/env.server'
import { resolveSeoConfig, type SeoConfig } from './rules'

export const getSeoConfig = createServerFn({ method: 'GET' }).handler(
  (): SeoConfig => {
    const env = getServerEnv()
    return resolveSeoConfig(
      env.PUBLIC_SITE_URL,
      getRequest().url,
      env.PUBLIC_SITE_INDEXABLE,
    )
  },
)
