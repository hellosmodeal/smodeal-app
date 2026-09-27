import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Scripts,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { SignOutButton } from '@/features/auth/components/sign-out-button'
import type { CurrentUser } from '@/features/auth/functions'
import { getCurrentUser } from '@/features/auth/functions'
import appCss from '../styles.css?url'

export const Route = createRootRouteWithContext<{
  user?: CurrentUser | null
}>()({
  beforeLoad: async () => ({ user: await getCurrentUser() }),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Smodeal — petites annonces entre particuliers' },
      {
        name: 'description',
        content:
          'Publiez un bien, recherchez une annonce et contactez son vendeur.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { user } = Route.useRouteContext()

  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased bg-background text-foreground">
        <header className="border-b">
          <div className="flex items-center justify-between h-14 max-w-5xl mx-auto px-4">
            <Link to="/" className="text-lg font-bold tracking-tight">
              <span className="text-orange-500">S</span>modeal
            </Link>
            <nav className="flex gap-4 items-center text-sm">
              {user ? (
                <>
                  <Link to="/compte">Mon compte</Link>
                  <SignOutButton />
                </>
              ) : (
                <>
                  <Link to="/connexion">Connexion</Link>
                  <Link to="/inscription">Inscription</Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto py-8 px-4">{children}</main>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
