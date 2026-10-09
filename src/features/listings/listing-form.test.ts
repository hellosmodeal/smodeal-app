import { describe, expect, it } from 'vitest'
import { publishListingFieldErrors } from './listing-form'

describe('publishListingFieldErrors', () => {
  it('ne signale rien pour un formulaire complet', () => {
    expect(publishListingFieldErrors(validForm())).toEqual({})
  })

  it('signale toutes les erreurs en même temps, champ par champ', () => {
    const form = validForm()
    form.delete('title')
    form.delete('city')
    form.set('phone', 'abcdef')
    expect(publishListingFieldErrors(form)).toEqual({
      title: 'Indiquez un titre.',
      city: 'Indiquez une ville.',
      phone: 'Indiquez un numéro de téléphone valide.',
    })
  })

  it('rattache une erreur de prix au champ saisi en euros', () => {
    const form = validForm()
    form.set('priceEuros', '12,345')
    expect(publishListingFieldErrors(form)).toEqual({
      priceEuros: 'Indiquez un prix en euros avec au maximum deux décimales.',
    })
  })

  it('demande un prix quand le champ est vide', () => {
    const form = validForm()
    form.set('priceEuros', '')
    expect(Object.keys(publishListingFieldErrors(form))).toEqual(['priceEuros'])
  })

  it('accepte une publication sans accord d’affichage du téléphone', () => {
    const form = validForm()
    form.delete('displayConsent')
    expect(publishListingFieldErrors(form)).toEqual({})
  })
})

function validForm(): FormData {
  const form = new FormData()
  form.set('title', 'Lampe de bureau')
  form.set('description', 'Une lampe en très bon état.')
  form.set('categorySlug', 'maison')
  form.set('condition', 'good')
  form.set('priceEuros', '25')
  form.set('city', 'Lyon')
  form.set('postalCode', '69001')
  form.set('department', '69')
  form.set('phone', '06 00 00 00 00')
  form.set('displayConsent', 'on')
  return form
}
