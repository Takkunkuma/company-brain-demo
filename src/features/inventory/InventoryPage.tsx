import { Fragment, useState } from 'react'
import { ArrowRight, ChevronDown, ChevronRight, Megaphone } from 'lucide-react'
import { useStore } from '../../store/store'
import { useDerived } from '../../store/derive'
import { materials, order, pendingDecisions, PRIMARY } from '../../data/scenario'
import { day, num } from '../../lib/format'
import { navigate } from '../../lib/router'
import { ConfirmedBy, FactValue, SourceChip } from '../../components/FactValue'
import { Badge, Button, Card, cx, PageHeader, SectionTitle } from '../../components/ui'
import { ConflictBanner } from './ConflictBanner'

export function OrderChangeBanner() {
  const impactRun = useStore((s) => s.impactRun)
  const request = useStore((s) => s.requestAnalyze)
  if (impactRun) return null
  return (
    <div data-tour="order-banner" className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-white px-4 py-3">
      <span className="flex size-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
        <Megaphone className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-red-900">Customer order changed</p>
        <p className="text-sm text-red-800">
          {order.customer} cut <b>{order.id}</b> for {order.productName} from <span className="tnum">{num(order.oldQty)}</span> → <span className="tnum">{num(order.newQty)}</span> units. <SourceChip factKey="order.qty" />
        </p>
      </div>
      <Button
        variant="danger"
        onClick={() => {
          request(true)
          navigate('impact')
        }}
      >
        Analyze impact <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}

function Breakdown({ id }: { id: string }) {
  const d = useDerived()
  const r = d.rows[id]
  const def = d.ctx.definition
  const total = r.onHand + r.inboundQty
  const seg = (n: number) => `${(n / total) * 100}%`
  const hold = def.excludeQcHold ? r.qcHold : 0
  const res = def.excludeReserved ? r.reserved : 0
  return (
    <div className="grid gap-6 px-4 pb-5 pt-1 lg:grid-cols-[1fr_320px]">
      <div>
        <p className="mb-2 text-xs font-medium text-slate-500">Usable vs. on screen</p>
        <div className="flex h-7 w-full overflow-hidden rounded-md text-[11px] font-medium text-white" role="img" aria-label={`On screen ${r.onHand}, usable ${r.usableOnHand}, hold ${hold}, reserved ${res}, inbound ${r.inboundQty}`}>
          <div style={{ width: seg(r.usableOnHand) }} className="flex items-center justify-center bg-accent-600 transition-all duration-500">{r.usableOnHand > 0 && `Usable ${num(r.usableOnHand)}`}</div>
          {hold > 0 && <div style={{ width: seg(hold) }} className="flex items-center justify-center bg-amber-400 transition-all duration-500">{hold}</div>}
          {res > 0 && <div style={{ width: seg(res) }} className="flex items-center justify-center bg-slate-400 transition-all duration-500">{res}</div>}
          {r.inboundQty > 0 && (
            <div style={{ width: seg(r.inboundQty) }} className={cx('flex items-center justify-center border-2 border-dashed transition-all duration-500', r.inboundInUsable ? 'border-accent-400 bg-accent-200 text-accent-800' : 'border-slate-300 bg-slate-50 text-slate-500')}>
              Inbound {num(r.inboundQty)}
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">On screen (ERP) <FactValue factKey={`${id}.onHand`} compact /></span>
          <span className="text-slate-400">−</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-amber-400" /> Quality hold <FactValue factKey={`${id}.qcHold`} compact /></span>
          <span className="text-slate-400">−</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-slate-400" /> Reserved <FactValue factKey={`${id}.reserved`} compact /></span>
          <span className="text-slate-400">=</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-accent-600" /> Usable <FactValue factKey={`${id}.usable`} compact /></span>
        </div>
        {(!def.excludeQcHold || !def.excludeReserved || def.includeInbound) && (
          <p className="mt-2 text-xs text-accent-700">Using your custom "usable" definition from Onboarding.</p>
        )}
      </div>
      <div className="rounded-lg bg-slate-50 p-3 text-xs">
        <p className="mb-2 font-medium text-slate-700">Planner sheet says</p>
        <FactValue factKey={`${id}.excelUsable`} />
        <div className="mt-2"><ConfirmedBy factKey={`${id}.usable`} /></div>
        {d.rows[id].excess > 0 && (
          <p className="mt-3 text-slate-600">
            After the order cut: <b className="text-red-700">{num(r.excess)} excess</b> <SourceChip factKey={`${id}.excess`} compact />
          </p>
        )}
      </div>
    </div>
  )
}

export function InventoryPage() {
  const d = useDerived()
  const [open, setOpen] = useState<Record<string, boolean>>({ [PRIMARY]: true })
  const decisionStatus = useStore((s) => s.decision.status)
  const pending = (id: string) => {
    if (id === 'MCB-220') return decisionStatus === 'awaiting' ? 'Awaiting approval' : decisionStatus === 'approved' ? 'Approved' : 'Excess plan due Nov 27'
    if (id === 'PM-55') return 'Hold or sell down · Dec 4'
    return null
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="One source-backed view across ERP, the planner sheet, email and chat. Click any chip to see where a number came from."
      />
      <OrderChangeBanner />

      {d.conflicts.length > 0 && (
        <section aria-label="Conflicts" className="mb-8 space-y-3" data-tour="conflicts">
          <SectionTitle right={<span className="text-xs text-slate-500">{d.openConflicts.length} open</span>}>Conflict flags</SectionTitle>
          {d.conflicts.map((c) => (
            <ConflictBanner key={c.id} c={c} tourId={c.id === 'usable-mcb220' ? 'conflict-usable' : undefined} />
          ))}
        </section>
      )}

      <SectionTitle right={<span className="text-xs text-slate-500">Plant 1100 · DA-300 bill of materials</span>}>Materials</SectionTitle>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm" data-tour="inventory-table">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
              <th className="w-8 px-3 py-2.5" />
              <th className="px-3 py-2.5">Material</th>
              <th className="px-3 py-2.5">On screen</th>
              <th className="px-3 py-2.5">Usable</th>
              <th className="px-3 py-2.5">Open PO</th>
              <th className="px-3 py-2.5">Supplier date</th>
              <th className="px-3 py-2.5">Demand</th>
              <th className="px-3 py-2.5">Pending decision</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => {
              const r = d.rows[m.id]
              const isOpen = !!open[m.id]
              return (
                <Fragment key={m.id}>
                  <tr
                    className={cx('cursor-pointer border-b border-slate-100 align-top hover:bg-slate-50/80', isOpen && 'bg-slate-50/60')}
                    onClick={() => setOpen((o) => ({ ...o, [m.id]: !o[m.id] }))}
                  >
                    <td className="px-3 py-3">
                      <button aria-expanded={isOpen} aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${m.id} breakdown`} className="text-slate-400">
                        {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{m.id}</p>
                      <p className="text-xs text-slate-500">{m.name} · ${m.unitCost.toFixed(2)}</p>
                    </td>
                    <td className="px-3 py-3"><FactValue factKey={`${m.id}.onHand`} compact /></td>
                    <td className="px-3 py-3">
                      <FactValue factKey={`${m.id}.usable`} compact valueClass="text-accent-800" />
                      <div className="mt-1"><ConfirmedBy factKey={`${m.id}.usable`} /></div>
                    </td>
                    <td className="px-3 py-3">
                      {m.inbound ? (
                        <>
                          <FactValue factKey={`${m.id}.inbound`} compact />
                          <p className="mt-0.5 text-xs text-slate-500">{m.inbound.po}</p>
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {m.inbound ? <FactValue factKey={`${m.id}.arrival`} compact /> : <span className="text-slate-400">—</span>}
                      {m.inbound && r.daysToArrival !== undefined && <p className="mt-0.5 text-xs text-slate-500">in {r.daysToArrival} days</p>}
                    </td>
                    <td className="px-3 py-3">
                      <FactValue factKey={`${m.id}.demand`} compact />
                      <p className="mt-0.5 text-xs text-slate-500">was {num(r.oldDemand)}</p>
                    </td>
                    <td className="px-3 py-3">
                      {pending(m.id) ? <Badge tone={m.id === PRIMARY ? 'violet' : 'slate'}>{pending(m.id)}</Badge> : <span className="text-xs text-slate-400">None</span>}
                      {r.excess > 0 ? <p className="mt-1 text-xs text-red-700">{num(r.excess)} excess</p> : <p className="mt-1 text-xs text-emerald-700">No excess</p>}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-slate-200 bg-slate-50/60">
                      <td colSpan={8}>
                        <Breakdown id={m.id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <SectionTitle right={<a href="#/activity" className="text-xs font-medium text-accent-700 hover:underline">All activity →</a>}>Pending decisions</SectionTitle>
          <ul className="divide-y divide-slate-100">
            {pendingDecisions.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-slate-700">{p.title}</span>
                <span className="shrink-0 text-xs text-slate-500">{p.owner.split(' ')[0]} · due {day(p.due)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <SectionTitle>How to read this</SectionTitle>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2"><SourceChip factKey="MCB-220.onHand" /> source, time, and a check once someone confirmed it</li>
            <li className="flex items-center gap-2"><SourceChip factKey="MCB-220.arrival" /> amber: sources disagree; resolve above</li>
            <li className="flex items-center gap-2"><SourceChip factKey="MCB-220.usable" /> derived: click to trace every input</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
