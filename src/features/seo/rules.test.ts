import { describe, expect, it } from 'vitest'
import { buildPageHead, resolveSeoConfig } from './rules'

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
