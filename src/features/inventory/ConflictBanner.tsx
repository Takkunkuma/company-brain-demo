import { AlertTriangle, CheckCircle2, HelpCircle, RotateCcw } from 'lucide-react'
import { useStore } from '../../store/store'
import type { ConflictView } from '../../store/derive'
import { when } from '../../lib/format'
import { SourceChip } from '../../components/FactValue'
import { Badge, Button, cx, SourceIcon } from '../../components/ui'

/** Reads like a spreadsheet compare: two cells side by side, who/when for each, and "Which is current?". */
export function ConflictBanner({ c, tourId }: { c: ConflictView; tourId?: string }) {
  const resolve = useStore((s) => s.resolveConflict)
  const needsCheck = useStore((s) => s.markNeedsCheck)

  if (c.status === 'resolved') {
    const chosen = c.kind === 'definition' ? `usable = ${c.confirmValue?.toLocaleString()}` : c.choice === 'a' ? `${c.a.label} (${c.a.value})` : `${c.b.label} (${c.b.value})`
    return (
      <div id={`conflict-${c.id}`} className="fade-up flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-2.5 text-sm">
        <CheckCircle2 className="size-4 text-emerald-600" />
        <span className="font-medium text-emerald-900">{c.title.split(':')[0]}: resolved</span>
        <span className="text-emerald-800">Confirmed {chosen}</span>
        <span className="text-xs text-emerald-700">· {c.resolvedBy} · {c.resolvedAt && when(c.resolvedAt)}</span>
      </div>
    )
  }

  const reopened = c.status === 'reopened'
  return (
    <div id={`conflict-${c.id}`} data-tour={tourId} className="fade-up overflow-hidden rounded-xl border border-amber-300 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5">
        <AlertTriangle className="size-4 text-amber-600" />
        <p className="text-sm font-semibold text-amber-900">{c.title}</p>
        {reopened && <Badge tone="amber"><RotateCcw className="size-3" /> Re-opened</Badge>}
        {c.status === 'needs_check' && <Badge tone="amber"><HelpCircle className="size-3" /> Needs check</Badge>}
        <span className="ml-auto text-xs text-amber-800">Which is current?</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2">
        {[c.a, c.b].map((side, i) => (
          <div key={i} className={cx('p-4', i === 0 && 'border-b border-slate-200 sm:border-b-0 sm:border-r')}>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span className="flex size-4 items-center justify-center rounded bg-slate-100 text-[10px] font-semibold text-slate-600">{i === 0 ? 'A' : 'B'}</span>
              <SourceIcon kind={side.source} />
              {side.label}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="tnum rounded-md bg-amber-100/70 px-2 py-0.5 font-mono text-xl font-semibold text-slate-900 ring-1 ring-amber-300">{side.value}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <SourceChip factKey={side.factKey} />
              <span>by {side.by}</span>
            </div>
          </div>
        ))}
      </div>

      {(c.explanation || reopened) && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {reopened && <p className="mb-1 font-medium text-amber-800">{c.reopenReason}</p>}
          {c.explanation}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-4 py-3">
        {c.kind === 'definition' ? (
          <Button variant="primary" size="sm" onClick={() => resolve(c.id, 'a', c.confirmValue)} data-tour="confirm-usable">
            <CheckCircle2 className="size-3.5" /> {c.confirmLabel}
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="sm" onClick={() => resolve(c.id, 'a')}>
              Confirm A · {c.a.source} ({c.a.value})
            </Button>
            <Button variant="primary" size="sm" onClick={() => resolve(c.id, 'b')}>
              Confirm B · {c.b.source} ({c.b.value})
            </Button>
          </>
        )}
        {c.status !== 'needs_check' && (
          <Button variant="ghost" size="sm" onClick={() => needsCheck(c.id)}>
            <HelpCircle className="size-3.5" /> Mark as needs check
          </Button>
        )}
        <span className="ml-auto text-[11px] text-slate-400">Confirming updates the shared number. Nothing is written back to {c.a.source}.</span>
      </div>
    </div>
  )
}
