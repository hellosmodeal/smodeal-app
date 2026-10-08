import { createFileRoute } from '@tanstack/react-router'
import { buildRobotsTxt, resolveSeoConfig } from '@/features/seo/rules'
import { getServerEnv } from '@/server/env.server'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const env = getServerEnv()
        const config = resolveSeoConfig(
          env.PUBLIC_SITE_URL,
          request.url,
          env.PUBLIC_SITE_INDEXABLE,
        )
        return new Response(buildRobotsTxt(config), {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      },
    },
  },
})
