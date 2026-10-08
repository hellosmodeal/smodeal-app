import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, MailWarning } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { EmailVerificationButton } from '@/features/auth/components/email-verification-button'
import { PublishListingForm } from '@/features/listings/components/publish-listing-form'

export const Route = createFileRoute('/_authed/deposer')({
  head: () => ({ meta: [{ title: 'Déposer une annonce — Smodeal' }] }),
  component: PublishPage,
})

function PublishPage() {
  const { user } = Route.useRouteContext()
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
        Déposer une annonce
      </h1>
      {user.emailVerified ? (
        <>
          <p className="mt-2 text-muted-foreground">
            Quatre étapes, quelques minutes. Votre annonce reste en ligne 60
            jours.
          </p>
          <PublishListingForm />
        </>
      ) : (
        <div className="grid gap-4 mt-6">
          <Alert>
            <MailWarning aria-hidden />
            <AlertTitle>Vérifiez votre adresse email pour publier</AlertTitle>
            <AlertDescription>
              Pour protéger les acheteurs, seules les adresses email vérifiées
              peuvent déposer une annonce. Ouvrez le lien reçu à{' '}
              <strong className="text-foreground">{user.email}</strong>, puis
              revenez sur cette page. Vous ne trouvez pas l’email ? Demandez-en
              un nouveau.
            </AlertDescription>
          </Alert>
          <EmailVerificationButton />
        </div>
      )}
    </section>
  )
}
