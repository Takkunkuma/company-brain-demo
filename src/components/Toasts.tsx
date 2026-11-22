import { useEffect, useRef } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useStore } from '../store/store'
import { staleInputs, useDerived } from '../store/derive'
import { navigate } from '../lib/router'
import { cx } from './ui'

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((t) => {
        const Icon = t.tone === 'success' ? CheckCircle2 : t.tone === 'warning' ? AlertTriangle : Info
        return (
          <div
            key={t.id}
            role={t.tone === 'warning' ? 'alert' : 'status'}
            className={cx(
              'fade-up pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg',
              t.tone === 'warning' ? 'border-amber-300' : 'border-slate-200',
            )}
          >
            <Icon className={cx('mt-0.5 size-4 shrink-0', t.tone === 'success' ? 'text-emerald-600' : t.tone === 'warning' ? 'text-amber-500' : 'text-accent-600')} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{t.title}</p>
              {t.body && <p className="mt-0.5 text-xs text-slate-600">{t.body}</p>}
              {t.action && (
                <button
                  className="mt-1.5 text-xs font-semibold text-accent-700 hover:underline"
                  onClick={() => {
                    navigate(t.action!.route)
                    dismiss(t.id)
                  }}
                >
                  {t.action.label} →
                </button>
              )}
            </div>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="text-slate-400 hover:text-slate-600">
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

/** Raises "An input to this decision changed" whenever a pinned input drifts from its current value. */
export function StaleWatcher() {
  const d = useDerived()
  const decision = useStore((s) => s.decision)
  const toast = useStore((s) => s.toast)
  const prev = useRef<Set<string> | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const stale = decision.status === 'none' ? [] : staleInputs(decision.pinned, d)
  const signature = stale.map((s) => `${s.key}:${s.current}`).join('|')
  useEffect(() => {
    // Debounced so dragging a slider raises one alert, not one per step.
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const before = prev.current
      const now = new Set(stale.map((s) => `${s.key}:${s.current}`))
      prev.current = now
      if (before === null) return
      const fresh = stale.filter((s) => !before.has(`${s.key}:${s.current}`))
      if (fresh.length === 0) return
      const x = fresh[0]
      toast({
        title: 'An input to this decision changed',
        body: `${x.label}: ${x.value} → ${x.current}${stale.length > 1 ? ` (${stale.length} inputs changed in total)` : ''}`,
        tone: 'warning',
        action: { label: 'Review decision', route: 'decisions' },
      })
    }, 700)
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])
  return null
}
