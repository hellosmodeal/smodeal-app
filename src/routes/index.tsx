import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">
        Petites annonces entre particuliers
      </h1>
      <p className="text-muted-foreground">
        Publiez un bien, recherchez une annonce et contactez son vendeur.
      </p>
    </section>
  )
}
