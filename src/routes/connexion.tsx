import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { AuthForm } from '@/features/auth/components/auth-form'
import { signIn } from '@/features/auth/functions'
import { isSafeInternalPath } from '@/features/auth/rules'

export const Route = createFileRoute('/connexion')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({ meta: [{ title: 'Connexion — Smodeal' }] }),
  component: SignInPage,
})

function SignInPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const signInFn = useServerFn(signIn)

  return (
    <div className="space-y-4">
      <AuthForm
        title="Connexion"
        description="Accédez à votre espace vendeur."
        submitLabel="Se connecter"
        fields={[
          {
            name: 'email',
            label: 'Email',
            type: 'email',
            autoComplete: 'email',
          },
          {
            name: 'password',
            label: 'Mot de passe',
            type: 'password',
            autoComplete: 'current-password',
          },
        ]}
        onSubmit={async (values) => {
          const result = await signInFn({
            data: { email: values.email, password: values.password },
          })
          if (result.ok) {
            await router.invalidate()
            const target = isSafeInternalPath(search.redirect)
              ? search.redirect
              : '/compte'
            await router.navigate({ href: target })
          }
          return result
        }}
      />
      <p className="max-w-sm mx-auto text-sm text-muted-foreground">
        <Link to="/mot-de-passe-oublie" className="underline text-primary">
          Mot de passe oublié ?
        </Link>
      </p>
    </div>
  )
}
