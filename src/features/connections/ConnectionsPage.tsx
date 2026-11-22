import { useState } from 'react'
import { AlertTriangle, Brain, CheckCircle2, Lock, RefreshCw } from 'lucide-react'
import { useStore } from '../../store/store'
import { useDerived } from '../../store/derive'
import { connections, materials } from '../../data/scenario'
import { num, when } from '../../lib/format'
import { ConfirmedBy, FactValue, SourceChip } from '../../components/FactValue'
import { Badge, Button, Card, cx, PageHeader, SectionTitle, SourceIcon, sourceMeta } from '../../components/ui'

function ExcelAddin() {
  const d = useDerived()
  const [sel, setSel] = useState(0)
  const [edits, setEdits] = useState<Record<number, string>>({})
  const m = materials[sel]
  const r = d.rows[m.id]
  const cellVal = edits[sel] ?? String(m.excelUsable)
  const mine = Number(cellVal.replace(/,/g, ''))
  const matches = mine === r.usable
  const cols = ['A', 'B', 'C', 'D', 'E', 'F']

  return (
    <Card className="overflow-hidden" data-tour="excel-addin">
      <div className="flex items-center gap-2 bg-emerald-700 px-3 py-1.5 text-xs text-white">
        <span className="font-semibold">Excel</span>
        <span className="opacity-80">Planner_Inventory_v7.xlsx: your copy (mock)</span>
        <span className="ml-auto rounded bg-white/15 px-1.5 py-0.5">Company Brain add-in</span>
      </div>
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs">
        <span className="w-10 rounded border border-slate-300 bg-white px-1 text-center">E{sel + 2}</span>
        <span className="text-slate-400">fx</span>
        <span>{cellVal}</span>
      </div>
      <div className="grid md:grid-cols-[1fr_280px]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr>
                <th className="w-8 border border-slate-200 bg-slate-100" />
                {cols.map((c) => (
                  <th key={c} className={cx('border border-slate-200 bg-slate-100 px-2 py-0.5 font-normal text-slate-500', c === 'E' && 'bg-emerald-100 text-emerald-800')}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-200 bg-slate-100 text-center text-slate-500">1</td>
                {['Material', 'Description', 'On hand', 'Hold+Res', 'Usable', 'Notes'].map((h) => (
                  <td key={h} className="border border-slate-200 px-2 py-1 font-semibold text-slate-600">{h}</td>
                ))}
              </tr>
              {materials.map((mm, i) => (
                <tr key={mm.id} onClick={() => setSel(i)} className="cursor-cell">
                  <td className={cx('border border-slate-200 bg-slate-100 text-center text-slate-500', sel === i && 'bg-emerald-100 text-emerald-800')}>{i + 2}</td>
                  <td className="border border-slate-200 px-2 py-1">{mm.id}</td>
                  <td className="whitespace-nowrap border border-slate-200 px-2 py-1">{mm.name}</td>
                  <td className="border border-slate-200 px-2 py-1 text-right">{num(mm.onHand)}</td>
                  <td className="border border-slate-200 px-2 py-1 text-right">{num(mm.qcHold + mm.reserved)}</td>
                  <td className={cx('border border-slate-200 p-0', sel === i && 'outline-2 -outline-offset-2 outline-emerald-600')}>
                    <input
                      aria-label={`Usable for ${mm.id} (cell E${i + 2})`}
                      value={edits[i] ?? String(mm.excelUsable)}
                      onFocus={() => setSel(i)}
                      onChange={(e) => setEdits((x) => ({ ...x, [i]: e.target.value }))}
                      className="w-20 bg-transparent px-2 py-1 text-right outline-none"
                    />
                  </td>
                  <td className="whitespace-nowrap border border-slate-200 px-2 py-1 text-slate-400">{mm.id === 'MCB-220' ? 'netted hold+WO' : ''}</td>
                </tr>
              ))}
              {[6, 7, 8].map((n) => (
                <tr key={n}>
                  <td className="border border-slate-200 bg-slate-100 text-center text-slate-500">{n}</td>
                  {cols.map((c) => <td key={c} className="h-6 border border-slate-200" />)}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-3 py-2 text-[11px] text-slate-500">Click a row or edit a value in column E. The panel shows the confirmed number next to the cell you're working in.</p>
        </div>
        <aside className="border-t border-slate-200 bg-white p-4 md:border-l md:border-t-0" aria-label="Company Brain add-in panel">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-accent-800"><Brain className="size-3.5" /> Company Brain</p>
          <p className="mt-3 text-xs text-slate-500">{m.id} · usable</p>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-[11px] text-slate-500">Your cell</p>
              <p className="tnum text-lg font-semibold">{cellVal || '—'}</p>
            </div>
            <div className="rounded-lg bg-accent-50 p-2">
              <p className="text-[11px] text-accent-700">Shared view</p>
              <p className="text-lg"><FactValue factKey={`${m.id}.usable`} chip={false} /></p>
            </div>
          </div>
          <div className="mt-2"><SourceChip factKey={`${m.id}.usable`} /></div>
          <div className="mt-1"><ConfirmedBy factKey={`${m.id}.usable`} /></div>
          {matches ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700"><CheckCircle2 className="size-3.5" /> Your cell matches the shared view.</p>
          ) : (
            <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-800"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> Differs by {num(Math.abs(mine - r.usable) || 0)}. {d.facts[`${m.id}.usable`].conflictId ? 'There is an open conflict on this number.' : 'Check before you share this sheet.'}</p>
          )}
          <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500"><Lock className="mr-1 inline size-3" />The add-in only reads. It never changes your sheet.</p>
        </aside>
      </div>
    </Card>
  )
}

export function ConnectionsPage() {
  const syncs = useStore((s) => s.syncs)
  const sync = useStore((s) => s.syncSource)
  const [syncing, setSyncing] = useState<string | null>(null)
  return (
    <div>
      <PageHeader title="Connections" subtitle="You keep your tools; we reconcile them. Every connection is read-only: the ERP stays the system of record." />
      <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-tour="connections">
        {connections.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-start gap-3">
              <span className={cx('flex size-9 items-center justify-center rounded-lg ring-1 ring-inset', sourceMeta[c.kind].cls)}>
                <SourceIcon kind={c.kind} className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500">{c.detail}</p>
              </div>
              <Badge tone="slate" className="gap-1"><Lock className="size-3" /> Read-only</Badge>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                <span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald-500" />
                Synced {when(syncs[c.id])} · {num(c.items)} records
              </span>
              <Button
                size="sm"
                variant="ghost"
                disabled={syncing === c.id}
                onClick={() => {
                  setSyncing(c.id)
                  setTimeout(() => {
                    sync(c.id)
                    setSyncing(null)
                  }, 700)
                }}
              >
                <RefreshCw className={cx('size-3.5', syncing === c.id && 'animate-spin')} /> {syncing === c.id ? 'Syncing' : 'Sync now'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      <SectionTitle>Excel add-in: the confirmed number next to the cell you're editing</SectionTitle>
      <ExcelAddin />
    </div>
  )
}
