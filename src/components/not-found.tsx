import { Link } from '@tanstack/react-router'
import { buttonVariants } from '@/components/ui/button'

export function NotFound() {
  return (
    <section className="flex flex-col items-center max-w-xl mx-auto py-12 text-center">
      <meta name="robots" content="noindex, nofollow" />
      <p className="text-sm font-semibold text-primary">Erreur 404</p>
      <h1 className="mt-2 page-title">Page introuvable</h1>
      <p className="mt-3 text-muted-foreground">
        Cette page ou cette annonce n’existe plus : elle a peut-être été vendue,
        retirée ou a expiré.
      </p>
      <div className="flex gap-3 flex-wrap justify-center mt-8">
        <Link to="/recherche" className={buttonVariants({ size: 'lg' })}>
          Rechercher une annonce
        </Link>
        <Link
          to="/"
          className={buttonVariants({ variant: 'outline', size: 'lg' })}
        >
          Retour à l’accueil
        </Link>
      </div>
    </section>
  )
}
