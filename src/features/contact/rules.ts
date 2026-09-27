export type Viewer = {
  id: string
  suspended: boolean
}

export type SellerContact = {
  ownerId: string
  displayConsent: boolean
}

export function canRevealPhone(
  viewer: Viewer | null,
  contact: SellerContact,
): boolean {
  if (!viewer || viewer.suspended) return false
  if (viewer.id === contact.ownerId) return true
  return contact.displayConsent
}
