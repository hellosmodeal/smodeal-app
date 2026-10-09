import { Link } from '@tanstack/react-router'
import { ArrowRight, Plus } from 'lucide-react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import {
  AllCategoriesIcon,
  navigationCategories,
} from '@/features/search/category-icons'

export function CategoriesMegaMenu({ canPublish }: { canPublish: boolean }) {
  return (
    <NavigationMenu aria-label="Catégories d’annonces">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Catégories</NavigationMenuTrigger>
          <NavigationMenuContent className="p-0">
            <div className="grid grid-cols-[1fr_15rem] w-[min(44rem,calc(100vw-2rem))]">
              <div className="p-3">
                <ul className="grid gap-1 grid-cols-2">
                  {navigationCategories.map(({ slug, label, hint, Icon }) => (
                    <li key={slug}>
                      <NavigationMenuLink
                        render={
                          <Link to="/recherche" search={{ categorie: slug }} />
                        }
                        className="gap-3 items-start p-3"
                      >
                        <span className="grid place-items-center shrink-0 size-9 rounded-lg bg-brand-surface text-primary">
                          <Icon className="size-4.5" aria-hidden="true" />
                        </span>
                        <span className="grid gap-0.5">
                          <span className="font-medium">{label}</span>
                          <span className="text-xs text-muted-foreground">
                            {hint}
                          </span>
                        </span>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
                <NavigationMenuLink
                  render={<Link to="/recherche" search={{}} />}
                  className="justify-between mt-1 p-3 font-medium text-primary"
                >
                  <span className="flex gap-3 items-center">
                    <AllCategoriesIcon aria-hidden="true" />
                    Toutes les annonces
                  </span>
                  <ArrowRight aria-hidden="true" />
                </NavigationMenuLink>
              </div>
              <div className="flex gap-4 flex-col justify-between rounded-r-lg border-l border-border/70 p-5 bg-brand-surface">
                <div className="grid gap-2">
                  <p className="font-heading text-base font-semibold">
                    Une chose ne vous sert plus ?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Publiez une annonce gratuite en quelques minutes. Elle reste
                    en ligne 60 jours.
                  </p>
                </div>
                <NavigationMenuLink
                  render={
                    <Link
                      to={canPublish ? '/deposer' : '/connexion'}
                      search={canPublish ? undefined : { redirect: '/deposer' }}
                    />
                  }
                  className="justify-center font-medium bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90"
                >
                  <Plus aria-hidden="true" />
                  Déposer une annonce
                </NavigationMenuLink>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
