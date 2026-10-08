import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
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
    <section className="max-w-3xl mx-auto">
      <Link
        to="/mes-annonces"
        className="inline-flex gap-1.5 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mes annonces
      </Link>
      <h1 className="mt-4 font-heading text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
        Modifier l’annonce
      </h1>
      <EditListingForm listing={listing} />
    </section>
  )
}
