import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { PrivateContactForm } from '@/features/account/components/private-contact-form'
import { PublicProfileForm } from '@/features/account/components/public-profile-form'
import { getAccountSettings } from '@/features/account/functions'
import { EmailVerificationButton } from '@/features/auth/components/email-verification-button'
import { SignOutButton } from '@/features/auth/components/sign-out-button'

export const Route = createFileRoute('/_authed/compte')({
  loader: () => getAccountSettings(),
  head: () => ({ meta: [{ title: 'Mon compte — Smodeal' }] }),
  component: AccountPage,
})

function AccountPage() {
  const { user } = Route.useRouteContext()
  const settings = Route.useLoaderData()
  // Only the card edited last keeps its success message.
  const [activeCard, setActiveCard] = useState<'profile' | 'contact' | null>(
    null,
  )

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold tracking-[-0.04em]">
          Mon compte
        </h1>
        <p className="font-medium">{user.name}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </header>
      {!user.emailVerified && (
        <Alert role="status">
          <AlertTitle>Adresse email à vérifier</AlertTitle>
          <AlertDescription>
            Ouvrez le lien reçu par email avant de publier une annonce.
          </AlertDescription>
          <div className="mt-3">
            <EmailVerificationButton variant="outline" />
          </div>
        </Alert>
      )}
      <nav aria-label="Gestion du compte" className="flex gap-3 flex-wrap">
        <Link to="/deposer" className={buttonVariants()}>
          Déposer une annonce
        </Link>
        <Link
          to="/mes-annonces"
          className={buttonVariants({ variant: 'outline' })}
        >
          Mes annonces
        </Link>
        {user.isAdmin && (
          <Link
            to="/moderation"
            search={{ after: undefined }}
            className={buttonVariants({ variant: 'outline' })}
          >
            Modération
          </Link>
        )}
      </nav>
      {settings.ok ? (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <PublicProfileForm
            pseudonym={settings.pseudonym}
            showSuccess={activeCard !== 'contact'}
            onActivity={() => setActiveCard('profile')}
          />
          <PrivateContactForm
            contact={settings.contact}
            showSuccess={activeCard !== 'profile'}
            onActivity={() => setActiveCard('contact')}
          />
        </div>
      ) : (
        <Alert variant="destructive">
          <AlertDescription>{settings.message}</AlertDescription>
        </Alert>
      )}
      <SignOutButton variant="outline" size="default" />
    </section>
  )
}
