import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { AuthForm } from '@/features/auth/components/auth-form'
import { signIn } from '@/features/auth/functions'

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
    <AuthForm
      title="Connexion"
      description="Accédez à votre espace vendeur."
      submitLabel="Se connecter"
      fields={[
        { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
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
          const target = search.redirect?.startsWith('/')
            ? search.redirect
            : '/compte'
          await router.navigate({ href: target })
        }
        return result
      }}
    />
  )
}
