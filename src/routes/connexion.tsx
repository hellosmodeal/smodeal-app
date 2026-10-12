import {
  createFileRoute,
  Link,
  redirect as routeRedirect,
  useRouter,
} from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthForm } from '@/features/auth/components/auth-form'
import {
  AuthDivider,
  GoogleSignInButton,
} from '@/features/auth/components/google-sign-in-button'
import { signIn } from '@/features/auth/functions'
import {
  authRedirectSearchSchema,
  signedInAuthPageRedirect,
  signInSchema,
} from '@/features/auth/rules'

export const Route = createFileRoute('/connexion')({
  validateSearch: authRedirectSearchSchema,
  beforeLoad: ({ context, cause, search }) => {
    const target = signedInAuthPageRedirect({
      signedIn: Boolean(context.user),
      cause,
      redirect: search.redirect,
    })
    if (target) throw routeRedirect({ href: target })
  },
  head: () => ({ meta: [{ title: 'Connexion — Smodeal' }] }),
  component: SignInPage,
})

function SignInPage() {
  const router = useRouter()
  const { redirect, erreur } = Route.useSearch()
  const signInFn = useServerFn(signIn)

  return (
    <AuthForm
      title="Connexion"
      description="Accédez à votre espace vendeur."
      submitLabel="Se connecter"
      pendingLabel="Connexion…"
      schema={signInSchema}
      leading={
        <>
          {erreur === 'google' && (
            <Alert variant="destructive">
              <AlertDescription>
                La connexion avec Google n’a pas abouti. Réessayez ou
                connectez-vous avec votre email.
              </AlertDescription>
            </Alert>
          )}
          <GoogleSignInButton redirect={redirect} />
          <AuthDivider />
        </>
      }
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
          minLength: 8,
          maxLength: 256,
        },
      ]}
      onSubmit={async (values) => {
        const result = await signInFn({
          data: { email: values.email, password: values.password },
        })
        if (result.ok) {
          await router.invalidate()
          await router.navigate({ href: redirect ?? '/compte' })
        }
        return result
      }}
    >
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          <Link to="/mot-de-passe-oublie" className="underline text-primary">
            Mot de passe oublié ?
          </Link>
        </p>
        <p>
          Pas encore de compte ?{' '}
          <Link
            to="/inscription"
            search={{ redirect }}
            className="font-medium underline text-primary"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </AuthForm>
  )
}
