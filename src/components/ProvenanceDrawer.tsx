import { useEffect, useRef } from 'react'
import { Lock, X } from 'lucide-react'
import { useStore } from '../store/store'
import { allMessages, useDerived } from '../store/derive'
import { people } from '../data/scenario'
import { when } from '../lib/format'
import { navigate } from '../lib/router'
import { Avatar, Badge, Button, cx, SourceIcon, sourceMeta } from './ui'
import { ConfirmedBy, SourceChip } from './FactValue'

export function ProvenanceDrawer() {
  const key = useStore((s) => s.drawerKey)
  const close = useStore((s) => s.closeDrawer)
  const extra = useStore((s) => s.extraMessages)
  const captured = useStore((s) => s.captured)
  const d = useDerived()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!key) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      close()
    }
    window.addEventListener('keydown', onKey, true)
    ref.current?.focus()
    return () => window.removeEventListener('keydown', onKey, true)
  }, [key, close])

  if (!key) return null
  const f = d.facts[key]
  if (!f) return null
  const src = f.source
  const det = src.detail
  const conflict = f.conflictId ? d.conflicts.find((c) => c.id === f.conflictId) : undefined

  return (
    <div className="fixed inset-0 z-[66]">
      <div className="absolute inset-0 bg-slate-900/20" onClick={close} aria-hidden />
      <aside
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Source details: ${f.label}`}
        className="slide-in absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl outline-none"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Where this number comes from</p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">{f.label}</h2>
            <p className="tnum mt-1 text-2xl font-semibold text-slate-900">{f.display}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={close} aria-label="Close source details">
            <X className="size-4" />
          </Button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-[88px_1fr] gap-y-2 text-sm">
            <span className="text-slate-500">Source</span>
            <span className="flex items-center gap-1.5">
              <span className={cx('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset', sourceMeta[src.kind].cls)}>
                <SourceIcon kind={src.kind} /> {src.kind}
              </span>
              <span className="text-slate-700">{src.label.replace(/^\w+ · /, '')}</span>
            </span>
            <span className="text-slate-500">As of</span>
            <span className="text-slate-700">{when(src.at)}</span>
            {src.by && (
              <>
                <span className="text-slate-500">Author</span>
                <span className="text-slate-700">{src.by}</span>
              </>
            )}
            <span className="text-slate-500">Status</span>
            <span>
              <ConfirmedBy factKey={key} />
            </span>
          </div>

          {f.note && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">{f.note}</p>}

          {conflict && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-900">Conflicting sources</p>
              <p className="mt-1 text-xs text-amber-800">
                {conflict.a.label}: <b>{conflict.a.value}</b> vs {conflict.b.label}: <b>{conflict.b.value}</b>
              </p>
              <Button
                size="sm"
                variant="amber"
                className="mt-2"
                onClick={() => {
                  close()
                  navigate('inventory')
                  setTimeout(() => document.getElementById(`conflict-${conflict.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
                }}
              >
                Resolve: which is current?
              </Button>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Source record</p>
            {det.type === 'erp' && (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
                  <span className="font-mono">{det.transaction}</span>
                  <span className="flex items-center gap-1"><Lock className="size-3" /> read-only</span>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {det.fields.map(([k, v]) => (
                      <tr key={k} className="border-t border-slate-100">
                        <td className="w-40 px-3 py-1.5 text-slate-500">{k}</td>
                        <td className="tnum px-3 py-1.5 font-mono text-[13px] text-slate-800">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-slate-100 px-3 py-1.5 text-[11px] text-slate-400">{det.system}</p>
              </div>
            )}

            {det.type === 'excel' && (
              <div className="overflow-hidden rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between bg-emerald-700 px-3 py-1.5 text-xs text-white">
                  <span>{det.file}</span>
                  <span className="opacity-80">Sheet: {det.sheet} · {det.cell}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse font-mono text-[11px]">
                    <tbody>
                      {det.grid.map((row, r) => (
                        <tr key={r}>
                          <td className="w-6 border border-slate-200 bg-slate-50 text-center text-slate-400">{r + 1}</td>
                          {row.map((c, ci) => (
                            <td
                              key={ci}
                              className={cx(
                                'whitespace-nowrap border border-slate-200 px-1.5 py-1',
                                r === 0 && 'bg-slate-50 font-semibold text-slate-600',
                                r === det.highlight[0] && ci === det.highlight[1] && 'bg-emerald-100 outline-2 -outline-offset-2 outline-emerald-600',
                              )}
                            >
                              {c}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="border-t border-slate-100 px-3 py-1.5 text-[11px] text-slate-400">Last edited by Wei Chen · {when(src.at)}</p>
              </div>
            )}

            {det.type === 'message' && (() => {
              const m = allMessages({ extraMessages: extra }).find((x) => x.id === det.messageId)
              if (!m) return null
              const p = people[m.from]
              return (
                <div className={cx('rounded-lg border p-3', m.channel === 'chat' ? 'border-teal-200 bg-teal-50/40' : 'border-violet-200 bg-violet-50/40')}>
                  <div className="flex items-center gap-2">
                    <Avatar who={m.from} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">{p.name}</p>
                      <p className="text-[11px] text-slate-500">{m.channel === 'chat' ? 'Group chat · DA-300 supply' : 'Email'} · {when(m.at)}</p>
                    </div>
                  </div>
                  {m.subject && <p className="mt-2 text-sm font-medium text-slate-800">{m.subject}</p>}
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{m.body}</p>
                  {m.extracted && (
                    <p className="mt-2 text-xs text-slate-600">
                      Extracted: <Badge tone="indigo">{m.extracted.text}</Badge>{' '}
                      {captured.includes(m.id) ? <Badge tone="green">In shared view</Badge> : <Badge tone="amber">Not yet in shared view</Badge>}
                    </p>
                  )}
                </div>
              )
            })()}

            {det.type === 'derived' && (
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="font-mono text-[13px] text-slate-800">{det.formula}</p>
                <p className="mb-1.5 mt-3 text-xs text-slate-500">Inputs (click to trace):</p>
                <ul className="space-y-1.5">
                  {det.inputs.map((k) => (
                    <li key={k} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-slate-600">{d.facts[k]?.label}</span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="tnum font-medium">{d.facts[k]?.display}</span>
                        <SourceChip factKey={k} compact />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {det.type === 'doc' && (
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-800">{det.title}</p>
                <p className="text-[11px] text-slate-500">{det.page}</p>
                <blockquote className="mt-2 border-l-2 border-slate-300 pl-3 text-sm italic text-slate-600">{det.excerpt}</blockquote>
              </div>
            )}
          </div>
        </div>
        <footer className="flex items-center gap-1.5 border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
          <Lock className="size-3" /> Company Brain reads sources; it never writes back.
        </footer>
      </aside>
    </div>
  )
}
