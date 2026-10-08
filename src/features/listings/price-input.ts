export function priceInputToCents(input: string): number {
  const grouped = input.trim()
  const value = /^\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:[.,]\d{1,2})?$/.test(
    grouped,
  )
    ? grouped.replace(/[ \u00a0\u202f]/g, '')
    : grouped
  if (!/^\d{1,8}(?:[.,]\d{1,2})?$/.test(value))
    throw new Error('Indiquez un prix en euros avec au maximum deux décimales.')
  const [euros, decimals = ''] = value.replace(',', '.').split('.')
  const cents = Number(euros) * 100 + Number(decimals.padEnd(2, '0'))
  if (cents > 2_000_000_000)
    throw new Error('Le prix dépasse le montant maximum autorisé.')
  return cents
}

export function centsToPriceInput(priceCents: number): string {
  const euros = Math.trunc(priceCents / 100)
  const cents = priceCents % 100
  return cents === 0
    ? String(euros)
    : `${euros},${String(cents).padStart(2, '0')}`
}
