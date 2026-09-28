import { describe, expect, it } from 'vitest'

import { listingFormSchema } from './functions'

describe('listingFormSchema', () => {
  it('autorise la publication sans accord de communication du téléphone', () => {
    const form = new FormData()
    form.set('title', 'Lampe de bureau')
    form.set('description', 'Une lampe en très bon état.')
    form.set('categorySlug', 'maison')
    form.set('condition', 'good')
    form.set('priceCents', '2500')
    form.set('city', 'Lyon')
    form.set('postalCode', '69001')
    form.set('department', '69')
    form.set('phone', '0600000000')

    expect(listingFormSchema.parse(form).displayConsent).toBe(false)
  })

  it('normalise un numéro français avec séparateurs', () => {
    const form = validForm()
    form.set('phone', '06 12.34-56(78)')

    expect(listingFormSchema.parse(form).phone).toBe('0612345678')
  })

  it('refuse une chaîne qui ne représente pas un téléphone', () => {
    const form = validForm()
    form.set('phone', 'abcdef')

    expect(() => listingFormSchema.parse(form)).toThrow(
      'Indiquez un numéro de téléphone valide.',
    )
  })
})

function validForm(): FormData {
  const form = new FormData()
  form.set('title', 'Lampe de bureau')
  form.set('description', 'Une lampe en très bon état.')
  form.set('categorySlug', 'maison')
  form.set('condition', 'good')
  form.set('priceCents', '2500')
  form.set('city', 'Lyon')
  form.set('postalCode', '69001')
  form.set('department', '69')
  form.set('phone', '0600000000')
  return form
}
