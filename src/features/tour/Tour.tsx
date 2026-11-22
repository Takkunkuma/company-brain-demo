import { useEffect, useLayoutEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../../store/store'
import { navigate, type Route } from '../../lib/router'
import { Button } from '../../components/ui'

interface Step {
  route: Route
  target: string | (() => string)
  title: string
  body: string
  onEnter?: () => void
}

const S = () => useStore.getState()

const steps: Step[] = [
  {
    route: 'inventory',
    target: 'conflicts',
    title: '1 · Three versions of the truth',
    body: 'ERP, the planner sheet and a supplier email disagree. Company Brain flags each conflict with both values, who said it, and when.',
  },
  {
    route: 'inventory',
    target: () => (S().conflicts['usable-mcb220']?.status === 'resolved' ? 'inventory-table' : 'conflict-usable'),
    title: '2 · Resolve the first conflict',
    body: 'ERP 1,200 vs Excel 900 is a definition difference: hold and reserved stock. Click "Confirm usable = 900" and watch the number and its "confirmed by" chip update. Click any chip to see the source record.',
  },
  {
    route: 'activity',
    target: () => (S().captured.includes('m3') ? 'feed' : 'capture-btn'),
    title: '3 · Capture what lives in chat',
    body: 'Updates happen in chat and email. Priya confirmed the new date in the group chat: add it to the shared view so it becomes a sourced fact.',
  },
  {
    route: 'impact',
    target: () => (S().impactRun ? 'impact-results' : 'analyze-btn'),
    title: '4 · Customer order changed',
    body: 'Northwind cut PO-48213 from 2,000 to 800. Click "Analyze impact" to see excess per material, dollar exposure, and which POs can still be adjusted.',
  },
  {
    route: 'impact',
    target: 'demand-slider',
    title: '5 · Your scenario, live',
    body: 'Drag the demand slider: excess and every option cost update. Then tick options below (try Reduce PO + Return) to combine them. Nothing is auto-picked.',
    onEnter: () => {
      if (!S().impactRun) S().setImpactRun()
    },
  },
  {
    route: 'decisions',
    target: () => (S().decision.status === 'none' ? 'generate' : 'decision-actions'),
    title: '6 · Decision package',
    body: 'Generate a one-page package with every input pinned. Send it to Daniel, then click "Simulate: an input changes" and watch the alert.',
    onEnter: () => {
      const s = S()
      if (s.selected.length === 0) {
        s.toggleOption('reduce')
        s.toggleOption('return')
      }
    },
  },
  {
    route: 'decisions',
    target: 'assistant-btn',
    title: '7 · Ask, with citations',
    body: 'Open the assistant and ask "Why do the ERP and Excel numbers differ?" It only answers with sources and never decides for you.',
  },
  {
    route: 'onboarding',
    target: 'definition',
    title: '8 · Agree what "usable" means',
    body: 'Toggle the definition and watch the numbers recalculate across the app. Agreeing on definitions up front is why people trust the numbers.',
    onEnter: () => S().setOnboardingStep(1),
  },
  {
    route: 'reconciliation',
    target: 'recon-graph',
    title: '9 · Three plans, three versions of the truth',
    body: 'Maya, Luis and Wei each proposed a plan from different versions of the same files. Pick Plan B: the graph lights up the old copy of the planner sheet it was built on. Switch to Table to compare the numbers side by side.',
    onEnter: () => S().setRecon({ view: 'graph', plan: 'B', doc: null }),
  },
]

export function Tour() {
  const tour = useStore((s) => s.tour)
  const setStep = useStore((s) => s.setTourStep)
  const end = useStore((s) => s.endTour)
  const state = useStore()
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = steps[tour.step]
  const targetId = step ? (typeof step.target === 'function' ? step.target() : step.target) : ''

  useEffect(() => {
    if (!tour.active || !step) return
    navigate(step.route)
    step.onEnter?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour.active, tour.step])

  useLayoutEffect(() => {
    if (!tour.active) return
    let raf = 0
    let tries = 0
    let scrolled = false
    const find = () => {
      const el = document.querySelector(`[data-tour="${targetId}"]`)
      if (el) {
        if (!scrolled) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' })
          scrolled = true
        }
        setRect(el.getBoundingClientRect())
      } else if (tries++ > 30) setRect(null)
      raf = requestAnimationFrame(find)
    }
    raf = requestAnimationFrame(find)
    return () => cancelAnimationFrame(raf)
    // re-run when the target can change because of what the user did
  }, [tour.active, tour.step, targetId, state.impactRun, state.decision.status])

  useEffect(() => {
    if (!tour.active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) end()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tour.active, end])

  if (!tour.active || !step) return null
  // While a drawer or the assistant is open, step out of the way: no dimming, no spotlight.
  const overlayOpen = !!state.drawerKey || state.assistantOpen
  const pad = 6
  const vw = window.innerWidth
  const vh = window.innerHeight
  const popW = Math.min(360, vw - 24)
  let top = vh / 2 - 90
  let left = vw / 2 - popW / 2
  if (overlayOpen) {
    top = vh - 220
    left = 24
  } else if (rect) {
    const below = rect.bottom + 12
    top = below + 190 < vh ? below : Math.max(12, rect.top - 202)
    left = Math.min(Math.max(12, rect.left), vw - popW - 12)
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]" aria-live="polite">
      {overlayOpen ? null : rect ? (
        <div
          className="absolute rounded-xl ring-2 ring-accent-500 transition-all duration-300"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: '0 0 0 9999px rgb(15 23 42 / 0.35)' }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/35" />
      )}
      <div role="dialog" aria-label={step.title} className="fade-up pointer-events-auto absolute rounded-xl border border-slate-200 bg-white p-4 shadow-2xl" style={{ top, left, width: popW }}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{step.title}</p>
          <button onClick={end} aria-label="End tour" className="text-slate-400 hover:text-slate-600"><X className="size-4" /></button>
        </div>
        <p className="mt-1.5 text-sm text-slate-600">{step.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">{tour.step + 1} / {steps.length}</span>
          <div className="flex gap-2">
            {tour.step > 0 && <Button size="sm" variant="ghost" onClick={() => setStep(tour.step - 1)}>Back</Button>}
            {tour.step < steps.length - 1 ? (
              <Button size="sm" variant="primary" onClick={() => setStep(tour.step + 1)}>Next</Button>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={() => useStore.getState().restartFresh()} title="Reset the demo and start the tour again">Start over</Button>
                <Button size="sm" variant="primary" onClick={end}>Finish</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
