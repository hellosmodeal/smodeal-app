import { describe, expect, it } from 'vitest'
import { buildPageHead, truncateDescription } from './rules'

describe('truncateDescription', () => {
  it('conserve une description courte telle quelle, espaces normalisés', () => {
    expect(truncateDescription('  Vélo   fictif\nen bon état. ')).toBe(
      'Vélo fictif en bon état.',
    )
  })

  it('coupe une description longue sur une frontière de mot avec une ellipse', () => {
    const text = `${'mot '.repeat(60)}fin`
    const result = truncateDescription(text, 155)
    expect(result.length).toBeLessThanOrEqual(155)
    expect(result.endsWith('…')).toBe(true)
    expect(result.slice(0, -1).endsWith('mot')).toBe(true)
  })

  it('coupe un mot unique trop long à la limite', () => {
    const result = truncateDescription('a'.repeat(200), 155)
    expect(result).toHaveLength(155)
    expect(result.endsWith('…')).toBe(true)
  })
})

describe('buildPageHead avec image', () => {
  const config = { origin: 'https://smodeal.example', indexable: true }
  const page = {
    title: 'Vélo — Smodeal',
    description: 'Vélo fictif.',
    path: '/annonces/listing-1',
    imageAlt: 'Vélo',
  }

  function meta(head: ReturnType<typeof buildPageHead>, key: string) {
    return head.meta.filter((m) => m.name === key || m.property === key)
  }

  it('utilise la photo de l’annonce comme image de partage', () => {
    const head = buildPageHead(
      { ...page, image: 'https://cdn.example/photo-1/view', type: 'product' },
      config,
    )
    expect(meta(head, 'og:image')[0]?.content).toBe(
      'https://cdn.example/photo-1/view',
    )
    expect(meta(head, 'twitter:image')[0]?.content).toBe(
      'https://cdn.example/photo-1/view',
    )
    expect(meta(head, 'og:image:width')).toEqual([])
    expect(meta(head, 'og:type')[0]?.content).toBe('product')
  })

  it('revient à l’image par défaut sans photo', () => {
    const head = buildPageHead(page, config)
    expect(meta(head, 'og:image')[0]?.content).toBe(
      'https://smodeal.example/og-image.png?v=20260928',
    )
    expect(meta(head, 'og:type')[0]?.content).toBe('website')
  })
})
