import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Scripts,
  useLocation,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { BrandMark } from '@/components/brand-mark'
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
      { name: 'application-name', content: 'Smodeal' },
      { name: 'theme-color', content: '#f5f8ff' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico?v=20260928', sizes: 'any' },
      {
        rel: 'icon',
        href: '/favicon-32x32.png?v=20260928',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        rel: 'icon',
        href: '/favicon-16x16.png?v=20260928',
        type: 'image/png',
        sizes: '16x16',
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png?v=20260928',
        sizes: '180x180',
      },
      { rel: 'manifest', href: '/site.webmanifest?v=20260928' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { user } = Route.useRouteContext()
  const pathname = useLocation({ select: (location) => location.pathname })
  const isHome = pathname === '/'
  const isFullWidth = isHome || pathname === '/recherche'

  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased bg-background text-foreground">
        <header className="relative z-10 border-b border-border/70 bg-card">
          <div className="flex gap-2 items-center justify-between h-16 max-w-7xl mx-auto px-4 sm:gap-6 sm:px-8">
            <Link
              to="/"
              className="shrink-0 rounded-sm outline-offset-4"
              aria-label="Smodeal, accueil"
            >
              <BrandMark />
            </Link>
            {isHome && (
              <a
                href="#annonces"
                className="hidden mr-auto text-sm font-medium sm:block hover:text-brand-dark"
              >
                Explorer
              </a>
            )}
            <nav
              className="flex gap-2 shrink-0 items-center text-xs font-medium sm:gap-6 sm:text-sm"
              aria-label="Navigation principale"
            >
              {user ? (
                <>
                  <Link
                    to="/compte"
                    className="rounded-sm text-foreground/75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand hover:text-foreground"
                  >
                    Mon compte
                  </Link>
                  <SignOutButton />
                </>
              ) : (
                <>
                  <Link
                    to="/connexion"
                    className="rounded-sm text-foreground/75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand hover:text-foreground"
                  >
                    <span className="sm:hidden">Connexion</span>
                    <span className="hidden sm:inline">Se connecter</span>
                  </Link>
                  <Link
                    to="/inscription"
                    className="rounded-lg py-2.5 px-3 bg-brand-dark text-white transition-colors sm:px-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand hover:brightness-90"
                  >
                    <span className="sm:hidden">S’inscrire</span>
                    <span className="hidden sm:inline">Créer un compte</span>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main
          className={
            isFullWidth
              ? 'min-h-[60vh]'
              : 'mx-auto min-h-[60vh] max-w-5xl px-4 py-8'
          }
        >
          {children}
        </main>
        <footer className="border-t border-border bg-card">
          <div className="flex gap-4 flex-col justify-between max-w-7xl mx-auto py-8 px-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-8">
            <span>© 2026 Smodeal · Les belles choses circulent.</span>
            <span>Petites annonces entre particuliers en France.</span>
          </div>
        </footer>
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
