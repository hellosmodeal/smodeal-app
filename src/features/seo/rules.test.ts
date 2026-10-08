import { describe, expect, it } from 'vitest'
import {
  buildPageHead,
  buildRobotsTxt,
  buildSitemapXml,
  resolveSeoConfig,
} from './rules'

const page = {
  title: 'Smodeal — Les belles choses circulent',
  description: 'Annonces fictives entre particuliers.',
  path: '/',
  imageAlt: 'Smodeal — Les belles choses circulent',
}

function metaContent(
  head: ReturnType<typeof buildPageHead>,
  key: string,
): string | undefined {
  return head.meta.find((m) => m.name === key || m.property === key)?.content
}

describe('resolveSeoConfig', () => {
  it('interdit l’indexation de la recette malgré son origine HTTPS configurée', () => {
    const config = resolveSeoConfig(
      'https://smodeal-recette.appwrite.network',
      'https://smodeal-recette.appwrite.network/',
      false,
    )
    expect(config.indexable).toBe(false)
    const head = buildPageHead(page, config)
    expect(metaContent(head, 'robots')).toBe('noindex, nofollow')
    expect(head.links).toEqual([])
  })
  it('reste en noindex avec une origine de callback locale configurée', () => {
    expect(
      resolveSeoConfig('http://localhost:18671', 'http://localhost:18671/'),
    ).toEqual({ origin: 'http://localhost:18671', indexable: false })
  })
  it("reste en noindex et utilise l'origine de la requête sans URL publique", () => {
    expect(
      resolveSeoConfig(undefined, 'http://localhost:8670/?q=velo'),
    ).toEqual({ origin: 'http://localhost:8670', indexable: false })
  })

  it("devient indexable quand la requête vise l'hôte de l'URL publique", () => {
    expect(
      resolveSeoConfig(
        'https://smodeal.com/chemin',
        'https://smodeal.com/?q=1',
      ),
    ).toEqual({ origin: 'https://smodeal.com', indexable: true })
  })

  it('ignore la casse et le port HTTP interne de l’hôte public', () => {
    expect(
      resolveSeoConfig('https://smodeal.com', 'http://SMODEAL.com:3000/'),
    ).toEqual({ origin: 'https://smodeal.com', indexable: true })
  })

  it('reste en noindex sur un domaine de prévisualisation', () => {
    expect(
      resolveSeoConfig(
        'https://smodeal.com',
        'https://branche-123.fra.appwrite.run/recherche',
      ),
    ).toEqual({
      origin: 'https://branche-123.fra.appwrite.run',
      indexable: false,
    })
  })

  it('reste en noindex sur un sous-domaine du domaine public', () => {
    expect(
      resolveSeoConfig('https://smodeal.com', 'https://www.smodeal.com/'),
    ).toEqual({ origin: 'https://www.smodeal.com', indexable: false })
  })
})

describe('buildPageHead', () => {
  it('interdit l’indexation et omet le lien canonique par défaut', () => {
    const head = buildPageHead(page, {
      origin: 'http://localhost:8670',
      indexable: false,
    })

    expect(metaContent(head, 'robots')).toBe('noindex, nofollow')
    expect(head.links).toEqual([])
    expect(metaContent(head, 'og:url')).toBeUndefined()
  })

  it("garde l'image de partage absolue pour les aperçus hors production", () => {
    const head = buildPageHead(page, {
      origin: 'http://localhost:8670',
      indexable: false,
    })

    expect(metaContent(head, 'og:image')).toBe(
      'http://localhost:8670/og-image.png?v=20260928',
    )
    expect(metaContent(head, 'twitter:image')).toBe(
      'http://localhost:8670/og-image.png?v=20260928',
    )
  })

  it("publie l'URL canonique et autorise l'indexation avec une URL publique", () => {
    const head = buildPageHead(
      { ...page, path: '/recherche' },
      { origin: 'https://exemple.fr', indexable: true },
    )

    expect(metaContent(head, 'robots')).toBe('index, follow')
    expect(metaContent(head, 'og:url')).toBe('https://exemple.fr/recherche')
    expect(head.links).toEqual([
      { rel: 'canonical', href: 'https://exemple.fr/recherche' },
    ])
  })

  it('force le noindex d’une page même avec une URL publique', () => {
    const head = buildPageHead(
      { ...page, noindex: true },
      { origin: 'https://exemple.fr', indexable: true },
    )

    expect(metaContent(head, 'robots')).toBe('noindex, nofollow')
    expect(head.links).toEqual([])
  })

  it('reste valide sans configuration SEO chargée', () => {
    const head = buildPageHead(page, undefined)

    expect(head.meta).toContainEqual({ title: page.title })
    expect(metaContent(head, 'robots')).toBe('noindex, nofollow')
    expect(metaContent(head, 'og:image')).toBeUndefined()
  })
})

describe('buildRobotsTxt', () => {
  it('bloque tout le site hors de l’hôte canonique indexable', () => {
    const robots = buildRobotsTxt({
      origin: 'https://smodeal-recette.appwrite.network',
      indexable: false,
    })
    expect(robots).toBe('User-agent: *\nDisallow: /\n')
  })

  it('ferme les espaces privés et les pages d’authentification sur l’hôte canonique', () => {
    const robots = buildRobotsTxt({
      origin: 'https://smodeal.com',
      indexable: true,
    })
    const lines = robots.split('\n')
    for (const path of [
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
    ]) {
      expect(lines).toContain(`Disallow: ${path}`)
    }
    expect(lines).not.toContain('Disallow: /')
    expect(lines).toContain('Sitemap: https://smodeal.com/sitemap.xml')
  })
})

describe('buildSitemapXml', () => {
  it('liste l’accueil et chaque annonce publique avec sa date de mise à jour', () => {
    const xml = buildSitemapXml('https://smodeal.com', [
      { id: 'annonce-1', lastmod: '2026-10-01T10:00:00.000Z' },
      { id: 'annonce-2', lastmod: '2026-10-02T08:30:00.000Z' },
    ])
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    )
    expect(xml).toContain('<url><loc>https://smodeal.com/</loc></url>')
    expect(xml).toContain(
      '<url><loc>https://smodeal.com/annonces/annonce-1</loc><lastmod>2026-10-01T10:00:00.000Z</lastmod></url>',
    )
    expect(xml).toContain('https://smodeal.com/annonces/annonce-2')
  })

  it('n’inclut pas la recherche, marquée noindex', () => {
    const xml = buildSitemapXml('https://smodeal.com', [])
    expect(xml).not.toContain('/recherche')
  })

  it('échappe les caractères XML et encode les identifiants', () => {
    const xml = buildSitemapXml('https://smodeal.com', [
      { id: 'a&b<c>"d\'', lastmod: '2026-10-01T10:00:00.000Z&' },
    ])
    expect(xml).toContain(
      '<loc>https://smodeal.com/annonces/a%26b%3Cc%3E%22d&apos;</loc>',
    )
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/)
    expect(xml).toContain('<lastmod>2026-10-01T10:00:00.000Z&amp;</lastmod>')
  })
})
