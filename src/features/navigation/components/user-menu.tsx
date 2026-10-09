import { Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  ChevronDown,
  LayoutList,
  LogOut,
  ShieldAlert,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CurrentUser } from '@/features/auth/functions'
import { signOut } from '@/features/auth/functions'
import { memberInitials } from '../rules'

export function MemberAvatar({ name }: { name: string }) {
  return (
    <Avatar>
      <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
        {memberInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}

export function useSignOut() {
  const signOutFn = useServerFn(signOut)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOutFn()
    } finally {
      setSigningOut(false)
    }
  }

  return { signingOut, handleSignOut }
}

export function UserMenu({ user }: { user: CurrentUser }) {
  const { signingOut, handleSignOut } = useSignOut()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Menu du compte de ${user.name}`}
        className="flex gap-2 items-center rounded-full outline-none py-1 pl-1 pr-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-muted data-popup-open:bg-muted"
      >
        <MemberAvatar name={user.name} />
        <span className="max-w-32 truncate">{user.name}</span>
        <ChevronDown
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="grid gap-0.5 py-2">
            <span className="truncate text-sm font-medium text-foreground">
              {user.name}
            </span>
            <span className="truncate text-xs font-normal">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link to="/mes-annonces" />}>
            <LayoutList aria-hidden="true" />
            Mes annonces
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link to="/compte" />}>
            <UserRound aria-hidden="true" />
            Mon compte
          </DropdownMenuItem>
          {user.isAdmin && (
            <DropdownMenuItem
              render={<Link to="/moderation" search={{ after: undefined }} />}
            >
              <ShieldAlert aria-hidden="true" />
              Modération
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={signingOut}
          onClick={handleSignOut}
        >
          <LogOut aria-hidden="true" />
          {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
