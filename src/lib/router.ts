import { useSyncExternalStore } from 'react'

// Hash routing: works on any static host and survives refresh/deep links with no rewrites.
export type Route = 'inventory' | 'activity' | 'impact' | 'decisions' | 'connections' | 'onboarding' | 'not-doing'
export const routes: Route[] = ['inventory', 'activity', 'impact', 'decisions', 'connections', 'onboarding', 'not-doing']

function current(): Route {
  const r = window.location.hash.replace(/^#\/?/, '') as Route
  return routes.includes(r) ? r : 'inventory'
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, current, () => 'inventory')
}

export function navigate(r: Route) {
  if (current() !== r) window.location.hash = `/${r}`
  window.scrollTo({ top: 0 })
}
