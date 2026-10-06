import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { PublishListingForm } from '@/features/listings/components/publish-listing-form'

export const Route = createFileRoute('/_authed/deposer')({
  head: () => ({ meta: [{ title: 'Déposer une annonce — Smodeal' }] }),
  component: PublishPage,
})

function PublishPage() {
  return (
    <section className="max-w-3xl mx-auto py-8 px-5 sm:px-8 sm:py-10">
      <Link
        to="/mes-annonces"
        className="inline-flex gap-1.5 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mes annonces
      </Link>
      <h1 className="mt-4 font-heading text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
        Déposer une annonce
      </h1>
      <p className="mt-2 text-muted-foreground">
        Quatre étapes, quelques minutes. Votre annonce reste en ligne 60 jours.
      </p>
      <PublishListingForm />
    </section>
  )
}
