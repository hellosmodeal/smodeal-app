import {
  createRouter as createTanStackRouter,
  parseSearchWith,
  stringifySearchWith,
} from '@tanstack/react-router'
import { NotFound } from '@/components/not-found'
import { RouteError } from '@/components/route-error'
import { RoutePending } from '@/components/route-pending'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: RouteError,
    defaultPendingComponent: RoutePending,
    defaultPendingMs: 400,
    parseSearch: parseSearchWith((value) => value),
    stringifySearch: stringifySearchWith(JSON.stringify),
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
