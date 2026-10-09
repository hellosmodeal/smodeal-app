import { Link, useLocation } from '@tanstack/react-router'
import { LogIn, Plus } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { buttonVariants } from '@/components/ui/button'
import type { CurrentUser } from '@/features/auth/functions'
import { signInReturnPath } from '@/features/auth/rules'
import { cn } from '@/lib/utils'
import { CategoriesMegaMenu } from './categories-mega-menu'
import { HeaderSearch } from './header-search'
import { MobileMenu } from './mobile-menu'
import { UserMenu } from './user-menu'

export function SiteHeader({ user }: { user: CurrentUser | null | undefined }) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const searchStr = useLocation({ select: (location) => location.searchStr })
  const returnPath = signInReturnPath(pathname, searchStr)
  const showSearch = pathname !== '/' && pathname !== '/recherche'

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/85">
      <div className="flex gap-3 items-center h-16 max-w-7xl mx-auto px-4 lg:gap-6 sm:px-8">
        <Link
          to="/"
          className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          aria-label="Smodeal, accueil"
        >
          <BrandMark />
        </Link>

        <div className="hidden lg:block">
          <CategoriesMegaMenu canPublish={Boolean(user)} />
        </div>

        <div className="flex-1 min-w-0">
          {showSearch && <HeaderSearch className="hidden max-w-md md:block" />}
        </div>

        <div className="hidden gap-2 items-center lg:flex">
          {user ? (
            <>
              <Link
                to="/deposer"
                className={cn(buttonVariants(), 'h-10 px-4 font-semibold')}
              >
                <Plus aria-hidden="true" />
                Déposer une annonce
              </Link>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Link
                to="/connexion"
                search={{ redirect: returnPath }}
                className={cn(buttonVariants({ variant: 'ghost' }), 'h-10')}
              >
                <LogIn aria-hidden="true" />
                Se connecter
              </Link>
              <Link
                to="/inscription"
                search={{ redirect: returnPath }}
                className={cn(buttonVariants({ variant: 'outline' }), 'h-10')}
              >
                Créer un compte
              </Link>
              <Link
                to="/connexion"
                search={{ redirect: '/deposer' }}
                className={cn(buttonVariants(), 'h-10 px-4 font-semibold')}
              >
                <Plus aria-hidden="true" />
                Déposer une annonce
              </Link>
            </>
          )}
        </div>

        <div className="flex gap-1 items-center lg:hidden">
          <Link
            to={user ? '/deposer' : '/connexion'}
            search={user ? undefined : { redirect: '/deposer' }}
            className={cn(buttonVariants({ size: 'sm' }), 'h-9 font-semibold')}
          >
            <Plus aria-hidden="true" />
            Déposer
          </Link>
          <MobileMenu user={user} returnPath={returnPath} />
        </div>
      </div>
    </header>
  )
}
