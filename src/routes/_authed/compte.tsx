import { createFileRoute, Link } from '@tanstack/react-router'
import { EmailVerificationButton } from '@/features/auth/components/email-verification-button'

export const Route = createFileRoute('/_authed/compte')({
  head: () => ({ meta: [{ title: 'Mon compte — Smodeal' }] }),
  component: AccountPage,
})

function AccountPage() {
  const { user } = Route.useRouteContext()

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-bold">Mon compte</h1>
      <p>{user.name}</p>
      <p className="text-sm text-muted-foreground">{user.email}</p>
      <nav aria-label="Gestion du compte" className="flex gap-4 flex-wrap py-4">
        <Link
          to="/deposer"
          className="rounded-lg py-2 px-4 font-medium bg-primary text-primary-foreground"
        >
          Déposer une annonce
        </Link>
        <Link
          to="/mes-annonces"
          className="rounded-lg border border-border py-2 px-4 font-medium"
        >
          Mes annonces
        </Link>
        {user.isAdmin && (
          <Link
            to="/moderation"
            search={{ after: undefined }}
            className="rounded-lg border border-border py-2 px-4 font-medium"
          >
            Modération
          </Link>
        )}
      </nav>
      {!user.emailVerified && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Votre adresse email doit être vérifiée avant de publier une annonce.
          </p>
          <EmailVerificationButton />
        </div>
      )}
    </section>
  )
}
