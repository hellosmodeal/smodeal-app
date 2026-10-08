import { createFileRoute } from '@tanstack/react-router'
import { buildSitemapXml, resolveSeoConfig } from '@/features/seo/rules'
import { listPublicSitemapListings } from '@/features/seo/sitemap.server'
import { getServerEnv } from '@/server/env.server'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const env = getServerEnv()
        const config = resolveSeoConfig(
          env.PUBLIC_SITE_URL,
          request.url,
          env.PUBLIC_SITE_INDEXABLE,
        )
        if (!config.indexable) {
          return new Response('Not Found', {
            status: 404,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        }

        const listings = await listPublicSitemapListings(new Date())
        return new Response(buildSitemapXml(config.origin, listings), {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=900',
          },
        })
      },
    },
  },
})
