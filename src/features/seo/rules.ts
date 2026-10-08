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
  /** Absolute URL of a page-specific share image; defaults to the site image. */
  image?: string
  type?: 'website' | 'product'
}

type MetaTag =
  | { title: string; name?: never; property?: never; content?: never }
  | { name: string; content: string; property?: never; title?: never }
  | { property: string; content: string; name?: never; title?: never }

export type PageHead = {
  meta: MetaTag[]
  links: { rel: string; href: string }[]
}

const shareImagePath = '/og-image.png?v=20260928'

export function resolveSeoConfig(
  publicSiteUrl: string | undefined,
  requestUrl: string,
  indexingEnabled = true,
): SeoConfig {
  const request = new URL(requestUrl)
  const publicSite = publicSiteUrl ? new URL(publicSiteUrl) : undefined
  const isPublicHost = publicSite?.hostname === request.hostname

  return {
    origin: isPublicHost ? publicSite.origin : request.origin,
    indexable:
      indexingEnabled &&
      isPublicHost &&
      publicSite.protocol === 'https:' &&
      !['localhost', '127.0.0.1', '[::1]'].includes(publicSite.hostname),
  }
}

export function buildPageHead(
  page: SeoPage,
  config: SeoConfig | undefined,
): PageHead {
  const indexable = Boolean(config?.indexable) && !page.noindex
  const canonical = config && indexable ? `${config.origin}${page.path}` : null
  const defaultImage = config ? `${config.origin}${shareImagePath}` : null
  const image = page.image ?? defaultImage

  const meta: MetaTag[] = [
    { title: page.title },
    { name: 'description', content: page.description },
    {
      name: 'robots',
      content: indexable ? 'index, follow' : 'noindex, nofollow',
    },
    { property: 'og:type', content: page.type ?? 'website' },
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
    meta.push({ property: 'og:image', content: image })
    if (image === defaultImage)
      meta.push(
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
      )
    meta.push(
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

export function truncateDescription(text: string, maxLength = 155): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  const slice = normalized.slice(0, maxLength - 1)
  const lastSpace = slice.lastIndexOf(' ')
  const cut = lastSpace > 0 ? slice.slice(0, lastSpace) : slice
  return `${cut.replace(/[\s,;:.!?-]+$/, '')}…`
}

const privatePaths = [
  '/compte',
  '/deposer',
  '/mes-annonces',
  '/moderation',
  '/annonces/*/modifier',
  '/connexion',
  '/inscription',
  '/mot-de-passe-oublie',
  '/reinitialiser-mot-de-passe',
  '/verification-email',
] as const

export function buildRobotsTxt(config: SeoConfig): string {
  if (!config.indexable) return 'User-agent: *\nDisallow: /\n'

  return [
    'User-agent: *',
    'Allow: /',
    ...privatePaths.map((path) => `Disallow: ${path}`),
    '',
    `Sitemap: ${config.origin}/sitemap.xml`,
    '',
  ].join('\n')
}

export type SitemapListing = {
  id: string
  lastmod: string
}

const xmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => xmlEntities[char] ?? char)
}

function sitemapUrl(loc: string, lastmod?: string): string {
  const lastmodTag = lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''
  return `<url><loc>${escapeXml(loc)}</loc>${lastmodTag}</url>`
}

// /recherche est volontairement absente : la page est servie en noindex.
export function buildSitemapXml(
  origin: string,
  listings: SitemapListing[],
): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    sitemapUrl(`${origin}/`),
    ...listings.map((listing) =>
      sitemapUrl(
        `${origin}/annonces/${encodeURIComponent(listing.id)}`,
        listing.lastmod,
      ),
    ),
    '</urlset>',
    '',
  ].join('\n')
}
