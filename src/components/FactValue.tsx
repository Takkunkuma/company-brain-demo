import { useEffect, useState } from 'react'
import { useStore } from '../store/store'
import { useDerived } from '../store/derive'
import { when } from '../lib/format'
import { cx, sourceMeta, SourceIcon, ConflictIcon, CheckIcon } from './ui'

/** The product's visual signature: a small source chip (icon · source · time) that opens the provenance drawer. */
export function SourceChip({ factKey, compact = false, className }: { factKey: string; compact?: boolean; className?: string }) {
  const d = useDerived()
  const open = useStore((s) => s.openDrawer)
  const f = d.facts[factKey]
  if (!f) return null
  const meta = sourceMeta[f.source.kind]
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        open(factKey)
      }}
      aria-label={`Source for ${f.label}: ${f.source.label}, ${when(f.source.at)}${f.confirmed ? `, confirmed by ${f.confirmed.by}` : ', unconfirmed'}. Open details.`}
      className={cx(
        'inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset transition hover:brightness-95 hover:ring-2',
        f.conflictId ? 'bg-amber-50 text-amber-800 ring-amber-300' : meta.cls,
        className,
      )}
    >
      {f.conflictId ? <ConflictIcon /> : <SourceIcon kind={f.source.kind} />}
      <span className="truncate">{compact ? f.source.kind : f.source.label}</span>
      {!compact && <span className="opacity-60">· {when(f.source.at).replace(/^\w+ /, '')}</span>}
      {f.confirmed && !f.conflictId && <CheckIcon className="text-emerald-600" />}
    </button>
  )
}

/** A number with its provenance chip. Flashes when its value changes. */
export function FactValue({ factKey, chip = true, compact = false, className, valueClass }: { factKey: string; chip?: boolean; compact?: boolean; className?: string; valueClass?: string }) {
  const d = useDerived()
  const f = d.facts[factKey]
  const [prev, setPrev] = useState(f?.display)
  const [n, setN] = useState(0)
  useEffect(() => {
    if (f && f.display !== prev) {
      setPrev(f.display)
      setN((x) => x + 1)
    }
  }, [f, prev])
  if (!f) return <span>—</span>
  return (
    <span className={cx('inline-flex flex-wrap items-center gap-1.5', className)}>
      <span key={n} className={cx('tnum font-medium text-slate-900', n > 0 && 'flash px-0.5', valueClass)}>
        {f.display}
      </span>
      {chip && <SourceChip factKey={factKey} compact={compact} />}
    </span>
  )
}

export function ConfirmedBy({ factKey }: { factKey: string }) {
  const d = useDerived()
  const f = d.facts[factKey]
  if (!f) return null
  if (!f.confirmed)
    return <span className="inline-flex items-center gap-1 text-[11px] text-amber-700"><span className="size-1.5 rounded-full bg-amber-500" />Unconfirmed</span>
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
      <CheckIcon className="text-emerald-600" />
      <span className="truncate">Confirmed by {f.confirmed.by} · {when(f.confirmed.at)}</span>
    </span>
  )
}
