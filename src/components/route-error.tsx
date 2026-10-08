import {
  type ErrorComponentProps,
  Link,
  useRouter,
} from '@tanstack/react-router'
import { Button, buttonVariants } from '@/components/ui/button'

export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  async function retry() {
    reset()
    await router.invalidate()
  }

  return (
    <section
      role="alert"
      className="flex flex-col items-center max-w-xl mx-auto py-12 text-center"
    >
      <meta name="robots" content="noindex, nofollow" />
      <h1 className="page-title">Un problème est survenu</h1>
      <p className="mt-3 text-muted-foreground">
        La page n’a pas pu être chargée. Réessayez dans un instant ; si le
        problème persiste, revenez plus tard.
      </p>
      <div className="flex gap-3 flex-wrap justify-center mt-8">
        <Button size="lg" onClick={retry}>
          Réessayer
        </Button>
        <Link
          to="/"
          className={buttonVariants({ variant: 'outline', size: 'lg' })}
        >
          Retour à l’accueil
        </Link>
      </div>
      {import.meta.env.DEV && error instanceof Error && (
        <pre className="overflow-auto max-w-full rounded-lg mt-8 p-4 text-left text-xs bg-muted">
          {error.stack ?? error.message}
        </pre>
      )}
    </section>
  )
}
