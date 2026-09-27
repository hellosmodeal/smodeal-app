export type SeoConfig = {
  origin: string
  indexable: boolean
}

export type SeoPage = {
  title: string
  description: string
  path: string
  imageAlt: string
  noindex?: boolean
}

type MetaTag =
  | { title: string; name?: never; property?: never; content?: never }
  | { name: string; content: string; property?: never; title?: never }
  | { property: string; content: string; name?: never; title?: never }

export type PageHead = {
  meta: MetaTag[]
  links: { rel: string; href: string }[]
}

const shareImagePath = '/og-image.png'

export function resolveSeoConfig(
  publicSiteUrl: string | undefined,
  requestUrl: string,
): SeoConfig {
  const request = new URL(requestUrl)
  const publicSite = publicSiteUrl ? new URL(publicSiteUrl) : undefined
  const isPublicHost = publicSite?.hostname === request.hostname

  return {
    origin: isPublicHost ? publicSite.origin : request.origin,
    indexable: isPublicHost,
  }
}

export function buildPageHead(
  page: SeoPage,
  config: SeoConfig | undefined,
): PageHead {
  const indexable = Boolean(config?.indexable) && !page.noindex
  const canonical = config && indexable ? `${config.origin}${page.path}` : null
  const image = config ? `${config.origin}${shareImagePath}` : null

  const meta: MetaTag[] = [
    { title: page.title },
    { name: 'description', content: page.description },
    {
      name: 'robots',
      content: indexable ? 'index, follow' : 'noindex, nofollow',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Smodeal' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:title', content: page.title },
    { property: 'og:description', content: page.description },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: page.title },
    { name: 'twitter:description', content: page.description },
  ]

  if (canonical) meta.push({ property: 'og:url', content: canonical })
  if (image) {
    meta.push(
      { property: 'og:image', content: image },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: page.imageAlt },
      { name: 'twitter:image', content: image },
      { name: 'twitter:image:alt', content: page.imageAlt },
    )
  }

  return {
    meta,
    links: canonical ? [{ rel: 'canonical', href: canonical }] : [],
  }
}
