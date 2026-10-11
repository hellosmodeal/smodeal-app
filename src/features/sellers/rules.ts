const monthYear = new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
})

export function formatMemberSince(createdAt: string): string {
  return `Membre depuis ${monthYear.format(new Date(createdAt))}`
}

export function describeSellerListings(total: number): string {
  if (total === 0) return 'Aucune annonce en ligne'
  return `${total} annonce${total > 1 ? 's' : ''} en ligne`
}
