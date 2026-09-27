import { createFileRoute } from '@tanstack/react-router'

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
      {!user.emailVerified && (
        <p className="text-sm text-orange-600">Adresse email non vérifiée.</p>
      )}
    </section>
  )
}
