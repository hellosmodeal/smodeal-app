import { describe, expect, it } from 'vitest'
import { parseListingEditForm, parseListingForm } from './functions'

describe('parseListingForm', () => {
  it('autorise une annonce quand le champ photo est laissé vide', () => {
    const form = validForm()
    form.set('photos', new File([], '', { type: 'application/octet-stream' }))
    expect(parseListingForm(form).photos).toEqual([])
  })

  it('autorise la publication sans accord de communication du téléphone', () => {
    expect(parseListingForm(validForm()).displayConsent).toBe(false)
  })

  it('normalise un numéro français avec séparateurs', () => {
    const form = validForm()
    form.set('phone', '06 12.34-56(78)')
    expect(parseListingForm(form).phone).toBe('0612345678')
  })

  it('refuse une chaîne qui ne représente pas un téléphone avec un message lisible', () => {
    const form = validForm()
    form.set('phone', 'abcdef')
    expect(() => parseListingForm(form)).toThrow(
      new Error('Indiquez un numéro de téléphone valide.'),
    )
  })

  it('signale seulement le premier champ manquant, en français', () => {
    const form = validForm()
    form.delete('title')
    form.delete('city')
    expect(() => parseListingForm(form)).toThrow(
      new Error('Indiquez un titre.'),
    )
  })

  it('refuse une catégorie inconnue avec un message en français', () => {
    const form = validForm()
    form.set('categorySlug', 'voitures')
    expect(() => parseListingForm(form)).toThrow(
      new Error('Choisissez une catégorie.'),
    )
  })

  it('refuse un état inconnu avec un message en français', () => {
    const form = validForm()
    form.set('condition', 'broken')
    expect(() => parseListingForm(form)).toThrow(
      new Error('Choisissez l’état de l’objet.'),
    )
  })

  it('refuse un prix négatif avec un message en français', () => {
    const form = validForm()
    form.set('priceCents', '-1')
    expect(() => parseListingForm(form)).toThrow(
      new Error('Indiquez un prix valide.'),
    )
  })

  it('refuse une entrée qui n’est pas un formulaire', () => {
    expect(() => parseListingForm({ title: 'Lampe' })).toThrow(
      new Error('Formulaire invalide.'),
    )
  })
})

describe('parseListingEditForm', () => {
  it('valide les seuls champs publics modifiables et l’identifiant', () => {
    const form = validForm()
    form.set('id', 'listing-1')
    expect(parseListingEditForm(form)).toEqual({
      id: 'listing-1',
      data: {
        title: 'Lampe de bureau',
        description: 'Une lampe en très bon état.',
        categorySlug: 'maison',
        condition: 'good',
        priceCents: 2500,
        city: 'Lyon',
        postalCode: '69001',
        department: '69',
      },
    })
  })

  it('refuse un code postal invalide avec un message lisible', () => {
    const form = validForm()
    form.set('id', 'listing-1')
    form.set('postalCode', '6900')
    expect(() => parseListingEditForm(form)).toThrow(
      new Error('Indiquez un code postal à 5 chiffres.'),
    )
  })

  it('refuse un formulaire sans identifiant d’annonce', () => {
    expect(() => parseListingEditForm(validForm())).toThrow(
      new Error('Annonce introuvable.'),
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
