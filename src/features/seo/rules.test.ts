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
  it("reste en noindex et utilise l'origine de la requête sans URL publique", () => {
    expect(
      resolveSeoConfig(undefined, 'http://localhost:8670/?q=velo'),
    ).toEqual({ origin: 'http://localhost:8670', indexable: false })
  })

  it("devient indexable avec l'origine de l'URL publique", () => {
    expect(
      resolveSeoConfig('https://exemple.fr/chemin', 'http://interne:3000/'),
    ).toEqual({ origin: 'https://exemple.fr', indexable: true })
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
      'http://localhost:8670/og-image.png',
    )
    expect(metaContent(head, 'twitter:image')).toBe(
      'http://localhost:8670/og-image.png',
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
