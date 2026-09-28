import { createFileRoute } from '@tanstack/react-router'

import { EditListingForm } from '@/features/listings/components/edit-listing-form'
import { getListingForEditing } from '@/features/listings/functions'

export const Route = createFileRoute('/_authed/annonces/$listingId/modifier')({
  loader: ({ params }) =>
    getListingForEditing({ data: { id: params.listingId } }),
  head: () => ({ meta: [{ title: 'Modifier une annonce — Smodeal' }] }),
  component: EditListingPage,
})

function EditListingPage() {
  const listing = Route.useLoaderData()

  return (
    <section className="max-w-2xl mx-auto py-8 px-5 sm:px-8">
      <h1 className="font-heading text-3xl font-bold tracking-[-0.04em]">
        Modifier l’annonce
      </h1>
      <EditListingForm listing={listing} />
    </section>
  )
}
