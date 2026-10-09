import { Link } from '@tanstack/react-router'
import {
  ChevronRight,
  LayoutList,
  LogIn,
  LogOut,
  Menu,
  Plus,
  ShieldAlert,
  UserPlus,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { CurrentUser } from '@/features/auth/functions'
import {
  AllCategoriesIcon,
  navigationCategories,
} from '@/features/search/category-icons'
import { cn } from '@/lib/utils'
import { HeaderSearch } from './header-search'
import { MemberAvatar, useSignOut } from './user-menu'

const rowClass =
  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50'

export function MobileMenu({
  user,
  returnPath,
}: {
  user: CurrentUser | null | undefined
  returnPath: string | undefined
}) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Ouvrir le menu"
          />
        }
      >
        {user ? <MemberAvatar name={user.name} /> : <Menu aria-hidden="true" />}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="overflow-y-auto gap-0 w-[min(22rem,90vw)]"
      >
        <SheetHeader className="border-b border-border/70 pr-12">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Recherche, catégories et compte
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 p-4">
          <HeaderSearch onSearch={close} />

          {user ? (
            <section aria-label="Mon compte" className="grid gap-1">
              <div className="flex gap-3 items-center px-3 pb-2">
                <MemberAvatar name={user.name} />
                <div className="grid min-w-0">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
              <SheetClose
                render={<Link to="/mes-annonces" />}
                className={rowClass}
              >
                <LayoutList className="size-4" aria-hidden="true" />
                Mes annonces
              </SheetClose>
              <SheetClose render={<Link to="/compte" />} className={rowClass}>
                <UserRound className="size-4" aria-hidden="true" />
                Mon compte
              </SheetClose>
              {user.isAdmin && (
                <SheetClose
                  render={
                    <Link to="/moderation" search={{ after: undefined }} />
                  }
                  className={rowClass}
                >
                  <ShieldAlert className="size-4" aria-hidden="true" />
                  Modération
                </SheetClose>
              )}
            </section>
          ) : (
            <section
              aria-label="Connexion"
              className="grid gap-2 rounded-xl p-4 bg-brand-surface"
            >
              <p className="text-sm text-muted-foreground">
                Connectez-vous pour publier et contacter les vendeurs.
              </p>
              <SheetClose
                render={
                  <Link to="/connexion" search={{ redirect: returnPath }} />
                }
                className={cn(buttonVariants(), 'h-10 w-full')}
              >
                <LogIn aria-hidden="true" />
                Se connecter
              </SheetClose>
              <SheetClose
                render={
                  <Link to="/inscription" search={{ redirect: returnPath }} />
                }
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'h-10 w-full',
                )}
              >
                <UserPlus aria-hidden="true" />
                Créer un compte
              </SheetClose>
            </section>
          )}

          <SheetClose
            render={
              <Link
                to={user ? '/deposer' : '/connexion'}
                search={user ? undefined : { redirect: '/deposer' }}
              />
            }
            className={cn(
              buttonVariants({ variant: user ? 'default' : 'outline' }),
              'h-10 w-full',
            )}
          >
            <Plus aria-hidden="true" />
            Déposer une annonce
          </SheetClose>

          <nav aria-label="Catégories" className="grid gap-1">
            <p className="px-3 pb-1 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Catégories
            </p>
            {navigationCategories.map(({ slug, label, Icon }) => (
              <SheetClose
                key={slug}
                render={<Link to="/recherche" search={{ categorie: slug }} />}
                className={rowClass}
              >
                <Icon className="size-4 text-primary" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                <ChevronRight
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </SheetClose>
            ))}
            <SheetClose
              render={<Link to="/recherche" search={{}} />}
              className={cn(rowClass, 'text-primary')}
            >
              <AllCategoriesIcon className="size-4" aria-hidden="true" />
              Toutes les annonces
            </SheetClose>
          </nav>

          {user && <MobileSignOut onSignOut={close} />}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MobileSignOut({ onSignOut }: { onSignOut: () => void }) {
  const { signingOut, handleSignOut } = useSignOut()
  return (
    <button
      type="button"
      onClick={async () => {
        await handleSignOut()
        onSignOut()
      }}
      disabled={signingOut}
      className={cn(
        rowClass,
        'border-t border-border/70 rounded-none pt-4 text-destructive',
      )}
    >
      <LogOut className="size-4" aria-hidden="true" />
      {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
    </button>
  )
}
