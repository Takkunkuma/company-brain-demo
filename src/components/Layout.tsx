import type { ReactNode } from 'react'
import { Activity, Ban, GitFork, Boxes, Brain, Compass, FileCheck2, GraduationCap, Lock, Plug, RotateCcw, Sparkles, TrendingDown } from 'lucide-react'
import { useStore } from '../store/store'
import { useDerived } from '../store/derive'
import { navigate, useRoute, type Route } from '../lib/router'
import { longDay, when } from '../lib/format'
import { tagline } from '../data/scenario'
import { Avatar, Badge, Button, cx } from './ui'

const nav: { id: Route; label: string; icon: typeof Boxes }[] = [
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'reconciliation', label: 'Reconciliation', icon: GitFork },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'impact', label: 'Impact & Options', icon: TrendingDown },
  { id: 'decisions', label: 'Decisions', icon: FileCheck2 },
  { id: 'connections', label: 'Connections', icon: Plug },
  { id: 'onboarding', label: 'Onboarding', icon: GraduationCap },
  { id: 'not-doing', label: "What we don't do", icon: Ban },
]

export function Layout({ children }: { children: ReactNode }) {
  const route = useRoute()
  const d = useDerived()
  const s = useStore()
  const newMsgs = d.msgs.filter((m) => m.extracted && !s.captured.includes(m.id)).length

  const badge = (id: Route) => {
    if (id === 'inventory' && d.openConflicts.length) return <Badge tone="amber">{d.openConflicts.length}</Badge>
    if (id === 'reconciliation' && !s.recon.decision) return <Badge tone="indigo">3</Badge>
    if (id === 'activity' && newMsgs) return <Badge tone="indigo">{newMsgs}</Badge>
    if (id === 'impact' && !s.impactRun) return <span className="size-2 rounded-full bg-red-500" aria-label="New order change" />
    if (id === 'decisions' && s.decision.status === 'awaiting') return <Badge tone="violet">1</Badge>
    if (id === 'decisions' && s.decision.status === 'question') return <Badge tone="amber">?</Badge>
    return null
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent-700 text-white">
            <Brain className="size-4.5" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight text-slate-900">Company Brain</p>
            <p className="text-[11px] leading-tight text-slate-500">Halden Industrial</p>
          </div>
        </div>
        <nav aria-label="Main" className="flex-1 space-y-0.5 px-3">
          {nav.map((n) => (
            <a
              key={n.id}
              href={`#/${n.id}`}
              data-tour={`nav-${n.id}`}
              aria-current={route === n.id ? 'page' : undefined}
              className={cx(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                route === n.id ? 'bg-accent-50 text-accent-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <n.icon className="size-4" aria-hidden />
              <span className="flex-1">{n.label}</span>
              {badge(n.id)}
            </a>
          ))}
        </nav>
        <div className="m-3 rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
          <p className="font-medium text-slate-700">{tagline}</p>
          <p className="mt-1">Demo by Team The Invent-tories (CMU). All data is fictional.</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-6">
          <select
            aria-label="Navigate"
            className="rounded-md border border-slate-300 px-2 py-1 text-sm lg:hidden"
            value={route}
            onChange={(e) => navigate(e.target.value as Route)}
          >
            {nav.map((n) => (
              <option key={n.id} value={n.id}>{n.label}</option>
            ))}
          </select>
          <Badge tone="slate" className="gap-1.5 py-1">
            <Lock className="size-3" /> Read-only
          </Badge>
          <span className="hidden text-xs text-slate-500 xl:inline">
            {longDay(d.now)} · {when(d.now).split(' ').slice(1).join(' ')} · data synced from 5 sources
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={s.startTour} data-tour="tour-btn" aria-label="Guided tour" title="Guided tour">
              <Compass className="size-3.5" /> <span className="hidden xl:inline">Guided tour</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={s.reset} data-tour="reset-btn" aria-label="Reset demo" title="Reset demo">
              <RotateCcw className="size-3.5" /> <span className="hidden xl:inline">Reset demo</span>
            </Button>
            <div role="group" aria-label="Persona" className="flex items-center rounded-lg border border-slate-200 p-0.5" data-tour="persona">
              {(['maya', 'daniel'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    s.setPersona(p)
                    if (p === 'daniel') navigate('decisions')
                  }}
                  aria-pressed={s.persona === p}
                  className={cx('flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium', s.persona === p ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}
                >
                  <Avatar who={p} size="xs" />
                  <span className="hidden md:inline">{p === 'maya' ? 'Maya (Buyer)' : 'Daniel (Manager)'}</span>
                </button>
              ))}
            </div>
            <Button size="sm" variant="primary" onClick={() => s.setAssistant(true)} data-tour="assistant-btn">
              <Sparkles className="size-3.5" /> Ask
            </Button>
          </div>
        </header>
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-[11px] text-amber-800 md:hidden">Best viewed on a laptop or tablet.</div>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}
