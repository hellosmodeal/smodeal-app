import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Scripts,
  useLocation,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { Plus } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { buttonVariants } from '@/components/ui/button'
import { SignOutButton } from '@/features/auth/components/sign-out-button'
import type { CurrentUser } from '@/features/auth/functions'
import { getCurrentUser } from '@/features/auth/functions'
import { contactEmail } from '@/features/legal/content'
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

const navLinkClass =
  'rounded-sm text-foreground/75 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring data-[status=active]:text-foreground'

const footerLinkClass =
  'rounded-sm hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring'

const legalLinks = [
  { to: '/mentions-legales', label: 'Mentions légales' },
  { to: '/cgu', label: 'Conditions d’utilisation' },
  { to: '/confidentialite', label: 'Confidentialité' },
  { to: '/cookies', label: 'Cookies' },
] as const

// TODO : adresse provisoire tant que l'éditeur n'a pas validé le contact (voir features/legal/content.ts).
const contactAddress = contactEmail.placeholder

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
          <div className="flex gap-y-2 gap-x-4 flex-wrap items-center justify-between max-w-7xl mx-auto py-3 px-4 sm:flex-nowrap sm:gap-6 sm:h-16 sm:py-0 sm:px-8">
            <Link
              to="/"
              className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              aria-label="Smodeal, accueil"
            >
              <BrandMark />
            </Link>
            {isHome && (
              <a
                href="#annonces"
                className="hidden rounded-sm mr-auto text-sm font-medium sm:block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring hover:text-primary"
              >
                Explorer
              </a>
            )}
            {user ? (
              <Link
                to="/deposer"
                className={buttonVariants({
                  size: 'sm',
                  className: 'sm:order-last',
                })}
              >
                <Plus aria-hidden="true" />
                <span className="sm:hidden">Déposer</span>
                <span className="hidden sm:inline">Déposer une annonce</span>
              </Link>
            ) : (
              <Link
                to="/connexion"
                search={{ redirect: '/deposer' }}
                className={buttonVariants({
                  size: 'sm',
                  className: 'sm:order-last',
                })}
              >
                <Plus aria-hidden="true" />
                <span className="sm:hidden">Déposer</span>
                <span className="hidden sm:inline">Déposer une annonce</span>
              </Link>
            )}
            <nav
              className="flex gap-y-1 gap-x-4 flex-wrap items-center w-full text-sm font-medium sm:flex-nowrap sm:gap-6 sm:w-auto sm:ml-auto"
              aria-label="Navigation principale"
            >
              {user ? (
                <>
                  <Link to="/mes-annonces" className={navLinkClass}>
                    Mes annonces
                  </Link>
                  {user.isAdmin && (
                    <Link
                      to="/moderation"
                      search={{ after: undefined }}
                      className={navLinkClass}
                    >
                      Modération
                    </Link>
                  )}
                  <Link to="/compte" className={navLinkClass}>
                    Mon compte
                  </Link>
                  <SignOutButton />
                </>
              ) : (
                <>
                  <Link to="/connexion" className={navLinkClass}>
                    Se connecter
                  </Link>
                  <Link to="/inscription" className={navLinkClass}>
                    Créer un compte
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
          <div className="flex gap-6 flex-col max-w-7xl mx-auto py-8 px-5 text-sm text-muted-foreground sm:px-8">
            <nav aria-label="Informations légales">
              <ul className="flex gap-y-2 gap-x-6 flex-wrap">
                {legalLinks.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className={footerLinkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a
                    href={`mailto:${contactAddress}`}
                    className={footerLinkClass}
                  >
                    Contact : {contactAddress}
                  </a>
                </li>
              </ul>
            </nav>
            <div className="flex gap-2 flex-col justify-between sm:flex-row sm:items-center">
              <span>© 2026 Smodeal · Les belles choses circulent.</span>
              <span>Petites annonces entre particuliers en France.</span>
            </div>
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
