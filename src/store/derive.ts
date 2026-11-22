import { useMemo } from 'react'
import {
  ERP_SYNC,
  EXCEL_EDIT,
  PRIMARY,
  holdMonths,
  materials,
  messages as seedMessages,
  options,
  order,
  people,
  supplierDate,
  type Confirmation,
  type Material,
  type Message,
  type SourceKind,
  type SourceRef,
} from '../data/scenario'
import { computeMaterial, optionStandalone, planOptions, revenueAtRisk, type CalcContext, type MaterialCalc } from '../lib/calc'
import { day, num, pct, usd, when } from '../lib/format'
import { useStore, type ConflictId, type DecisionSnapshot, type PinnedInput, type Store } from './store'

export interface Fact {
  key: string
  label: string
  display: string
  source: SourceRef
  confirmed?: Confirmation
  conflictId?: ConflictId
  note?: string
}

export interface ConflictView {
  id: ConflictId
  title: string
  material: string
  kind: 'definition' | 'value'
  status: 'open' | 'resolved' | 'needs_check' | 'reopened'
  reopenReason?: string
  a: { label: string; value: string; factKey: string; source: SourceKind; at: string; by: string }
  b: { label: string; value: string; factKey: string; source: SourceKind; at: string; by: string }
  explanation?: string
  confirmLabel?: string
  confirmValue?: number
  resolvedBy?: string
  resolvedAt?: string
  choice?: 'a' | 'b'
}

const plant = '1100 Halden – Pittsburgh'

function erp(m: Material, label: string): SourceRef {
  return {
    kind: 'ERP',
    label: `ERP · ${label}`,
    at: ERP_SYNC,
    by: 'ERP nightly sync',
    detail: {
      type: 'erp',
      system: 'SAP S/4HANA (mock) · MMBE stock overview',
      transaction: `MMBE / ${m.id}`,
      fields: [
        ['Material', m.id],
        ['Description', m.name],
        ['Plant', plant],
        ['Total stock', num(m.onHand)],
        ['In quality inspection', num(m.qcHold)],
        ['Reserved', m.reserved ? `${num(m.reserved)} (${m.reservedFor})` : '0'],
        ['Standard price', `$${m.unitCost.toFixed(2)}`],
        ['Last sync', when(ERP_SYNC)],
      ],
    },
  }
}

function excelGrid(highlightId: string) {
  const header = ['Material', 'Description', 'On hand', 'Hold + Res.', 'Usable', 'Notes']
  const rows = materials.map((m) => [
    m.id,
    m.name,
    num(m.onHand),
    num(m.qcHold + m.reserved),
    num(m.excelUsable),
    m.id === 'MCB-220' ? 'netted hold+WO-7731 (WC)' : '',
  ])
  const idx = materials.findIndex((m) => m.id === highlightId)
  return { grid: [header, ...rows], highlight: [idx + 1, 4] as [number, number] }
}

function msgSource(msg: Message): SourceRef {
  const p = people[msg.from]
  return {
    kind: msg.channel === 'chat' ? 'Chat' : 'Email',
    label: msg.channel === 'chat' ? `Chat · ${p.name.split(' ')[0]}` : `Email · ${p.name.split(' ')[0]}`,
    at: msg.at,
    by: p.name,
    detail: { type: 'message', messageId: msg.id },
  }
}

function derived(formula: string, inputs: string[], at: string, kind: SourceKind = 'Derived'): SourceRef {
  return { kind, label: kind === 'Analysis' ? 'Impact analysis' : 'Derived', at, by: 'Company Brain', detail: { type: 'derived', formula, inputs } }
}

export function allMessages(s: Pick<Store, 'extraMessages'>): Message[] {
  return [...seedMessages, ...s.extraMessages].sort((a, b) => a.at.localeCompare(b.at))
}

export function derive(s: Store) {
  const now = s.now()
  const msgs = allMessages(s)
  const msg = (id: string) => msgs.find((m) => m.id === id)!

  // ---- effective inputs after confirmations ----
  const qcConflict = s.conflicts['qchold-mcb220']
  const qcHold: Record<string, number> = {}
  if (qcConflict?.status === 'resolved' && qcConflict.choice === 'b') qcHold[PRIMARY] = 220

  const override = s.supplierDateOverride
  const supplier = override && msgs.some((m) => m.id === override.messageId) ? override : supplierDate
  const dateConflict = s.conflicts['date-po9921']!
  const arrival: Record<string, string> = {}
  if (dateConflict.status === 'resolved' && dateConflict.choice === 'b') arrival['PO-9921'] = supplier.date

  const ctx: CalcContext = { definition: s.definition, demandAdjPct: s.demandAdjPct, qcHold, arrival, today: now }
  const rows: Record<string, MaterialCalc> = Object.fromEntries(materials.map((m) => [m.id, computeMaterial(m, ctx)]))
  const primary = rows[PRIMARY]
  const primaryMat = materials.find((m) => m.id === PRIMARY)!

  // ---- conflicts ----
  const conflicts: ConflictView[] = []
  const uc = s.conflicts['usable-mcb220']!
  let ucStatus: ConflictView['status'] = uc.status
  let reopenReason: string | undefined
  if (uc.status === 'resolved' && uc.confirmedValue !== primary.usableOnHand) {
    ucStatus = 'reopened'
    reopenReason = `Usable is now ${num(primary.usableOnHand)} under the current inputs, but ${num(uc.confirmedValue ?? 0)} was confirmed. Re-confirm or revisit the definition.`
  }
  const defParts = [s.definition.excludeQcHold && 'quality hold', s.definition.excludeReserved && 'reserved'].filter(Boolean)
  conflicts.push({
    id: 'usable-mcb220',
    title: 'MCB-220 stock: ERP and planner sheet disagree',
    material: PRIMARY,
    kind: 'definition',
    status: ucStatus,
    reopenReason,
    a: { label: 'ERP · on hand', value: num(primary.onHand), factKey: 'MCB-220.onHand', source: 'ERP', at: ERP_SYNC, by: 'ERP sync' },
    b: { label: 'Excel · usable', value: num(primaryMat.excelUsable), factKey: 'MCB-220.excelUsable', source: 'Excel', at: EXCEL_EDIT, by: 'Wei Chen' },
    explanation:
      defParts.length === 0
        ? `Under the current definition nothing is netted out, so usable = on hand = ${num(primary.usableOnHand)}, but Excel still shows ${num(primaryMat.excelUsable)}.`
        : primaryMat.excelUsable === primary.usableOnHand
          ? `Not a real disagreement: ERP shows everything on the shelf; the planner sheet nets out ${defParts.join(' and ')}: ${num(primary.onHand)} − ${num(s.definition.excludeQcHold ? primary.qcHold : 0)} hold − ${num(s.definition.excludeReserved ? primary.reserved : 0)} reserved = ${num(primary.usableOnHand)} usable.`
          : `ERP shows everything on the shelf. Under the agreed definition: ${num(primary.onHand)} − ${num(s.definition.excludeQcHold ? primary.qcHold : 0)} hold − ${num(s.definition.excludeReserved ? primary.reserved : 0)} reserved = ${num(primary.usableOnHand)} usable. The planner sheet (${num(primaryMat.excelUsable)}) is now out of date.`,
    confirmLabel: `Confirm usable = ${num(primary.usableOnHand)}`,
    confirmValue: primary.usableOnHand,
    resolvedBy: uc.by,
    resolvedAt: uc.at,
  })

  conflicts.push({
    id: 'date-po9921',
    title: 'PO-9921 arrival date: ERP and supplier disagree',
    material: PRIMARY,
    kind: 'value',
    status: dateConflict.status,
    a: { label: 'ERP · PO-9921 delivery date', value: day(primaryMat.inbound!.erpDate), factKey: 'PO-9921.erpDate', source: 'ERP', at: ERP_SYNC, by: 'ERP sync' },
    b: { label: 'Supplier email', value: day(supplier.date), factKey: 'PO-9921.supplierDate', source: 'Email', at: msg(supplier.messageId).at, by: 'Priya Nair' },
    choice: dateConflict.choice,
    resolvedBy: dateConflict.by,
    resolvedAt: dateConflict.at,
  })

  if (qcConflict) {
    conflicts.push({
      id: 'qchold-mcb220',
      title: 'MCB-220 quality hold: ERP and chat disagree',
      material: PRIMARY,
      kind: 'value',
      status: qcConflict.status,
      a: { label: 'ERP · in quality inspection', value: '180', factKey: 'MCB-220.qcHoldErp', source: 'ERP', at: ERP_SYNC, by: 'ERP sync' },
      b: { label: 'Group chat', value: '220', factKey: 'MCB-220.qcHoldChat', source: 'Chat', at: msg('m2').at, by: 'Luis Romero' },
      choice: qcConflict.choice,
      resolvedBy: qcConflict.by,
      resolvedAt: qcConflict.at,
    })
  }
  const openConflicts = conflicts.filter((c) => c.status !== 'resolved')

  // ---- facts (every number shown in the app) ----
  const facts: Record<string, Fact> = {}
  const add = (f: Fact) => (facts[f.key] = f)

  for (const m of materials) {
    const r = rows[m.id]
    const isP = m.id === PRIMARY
    add({ key: `${m.id}.onHand`, label: `${m.id} on hand (on screen)`, display: num(r.onHand), source: erp(m, 'Total stock'), confirmed: { by: 'Wei Chen (cycle count)', at: '2026-11-17T15:00:00' } })
    const qcFromChat = isP && qcHold[PRIMARY] !== undefined
    add({
      key: `${m.id}.qcHold`,
      label: `${m.id} quality hold`,
      display: num(r.qcHold),
      source: qcFromChat ? msgSource(msg('m2')) : erp(m, 'In quality inspection'),
      confirmed: qcFromChat ? { by: qcConflict!.by!, at: qcConflict!.at! } : m.qcHold ? { by: 'Halden Quality', at: '2026-11-19T06:20:00' } : undefined,
      conflictId: isP && qcConflict && qcConflict.status !== 'resolved' ? 'qchold-mcb220' : undefined,
    })
    add({ key: `${m.id}.reserved`, label: `${m.id} reserved`, display: num(r.reserved), source: erp(m, 'Reserved'), confirmed: m.reserved ? { by: 'ERP (work order release)', at: ERP_SYNC } : undefined, note: m.reservedFor })
    add({
      key: `${m.id}.excelUsable`,
      label: `${m.id} usable (planner sheet)`,
      display: num(m.excelUsable),
      source: { kind: 'Excel', label: `Excel · ${m.excelCell}`, at: EXCEL_EDIT, by: 'Wei Chen', detail: { type: 'excel', file: 'Planner_Inventory_v7.xlsx', sheet: 'Stock', cell: m.excelCell, ...excelGrid(m.id) } },
      confirmed: { by: 'Wei Chen', at: EXCEL_EDIT },
    })

    const ucView = conflicts[0]
    let usableConfirmed: Confirmation | undefined
    if (isP) {
      if (ucView.status === 'resolved') usableConfirmed = { by: uc.by!, at: uc.at! }
    } else if (m.excelUsable === r.usableOnHand) {
      usableConfirmed = { by: 'Wei Chen (planner sheet)', at: EXCEL_EDIT }
    }
    const formula = `on hand ${num(r.onHand)}${s.definition.excludeQcHold ? ` − QC hold ${num(r.qcHold)}` : ''}${s.definition.excludeReserved ? ` − reserved ${num(r.reserved)}` : ''}${r.inboundInUsable ? ` + inbound ≤${s.definition.inboundDays}d ${num(r.inboundInUsable)}` : ''} = ${num(r.usable)}`
    add({
      key: `${m.id}.usable`,
      label: `${m.id} usable stock`,
      display: num(r.usable),
      source: derived(formula, [`${m.id}.onHand`, `${m.id}.qcHold`, `${m.id}.reserved`, ...(r.inboundInUsable ? [`${m.id}.inbound`] : []), 'definition.usable'], now),
      confirmed: usableConfirmed,
      conflictId: isP && ucView.status !== 'resolved' ? 'usable-mcb220' : undefined,
    })
    add({ key: `${m.id}.unitCost`, label: `${m.id} standard cost`, display: `$${m.unitCost.toFixed(2)}`, source: erp(m, 'Standard price'), confirmed: { by: 'Finance (Q4 std. cost)', at: '2026-10-01T09:00:00' } })

    if (m.inbound) {
      const ib = m.inbound
      add({ key: `${m.id}.inbound`, label: `${ib.po} open quantity`, display: num(ib.qty), source: { ...erp(m, ib.po), detail: { type: 'erp', system: 'SAP S/4HANA (mock) · ME23N purchase order', transaction: `ME23N / ${ib.po}`, fields: [['PO', ib.po], ['Material', m.id], ['Open qty', num(ib.qty)], ['Delivery date', day(ib.erpDate)], ['Vendor', m.id === 'MCB-220' ? 'Kestrel Electronics' : 'Brightline Components'], ['Cancellation', ib.cancelBy ? `until ${day(ib.cancelBy)}, ${(ib.cancelFeePct! * 100).toFixed(0)}% fee` : ib.windowNote ?? '—']] } }, confirmed: { by: 'ERP (PO release)', at: ERP_SYNC } })
      if (isP) {
        const dc = conflicts[1]
        const arr = r.arrival!
        const fromSupplier = dc.status === 'resolved' && dc.choice === 'b'
        add({
          key: `${m.id}.arrival`,
          label: `${ib.po} arrival date`,
          display: dc.status === 'resolved' ? day(arr) : `${day(arr)}?`,
          source: fromSupplier ? msgSource(msg(supplier.messageId)) : facts[`${m.id}.inbound`].source,
          confirmed: dc.status === 'resolved' ? { by: dc.resolvedBy!, at: dc.resolvedAt! } : undefined,
          conflictId: dc.status !== 'resolved' ? 'date-po9921' : undefined,
          note: dc.status !== 'resolved' ? `Unconfirmed: ERP says ${day(ib.erpDate)}, supplier says ${day(supplier.date)}` : undefined,
        })
      } else {
        add({ key: `${m.id}.arrival`, label: `${ib.po} arrival date`, display: day(ib.erpDate), source: facts[`${m.id}.inbound`].source, confirmed: { by: 'Supplier ASN', at: '2026-11-18T11:00:00' } })
      }
    }
    add({ key: `${m.id}.demand`, label: `${m.id} remaining demand`, display: num(r.demand), source: derived(`${num(order.newQty)} DA-300 × ${m.perProduct} per unit${s.demandAdjPct ? ` × (1 ${pct(s.demandAdjPct)})` : ''} = ${num(r.demand)}`, ['order.qty', 'scenario.demandAdj'], now) })
    add({ key: `${m.id}.excess`, label: `${m.id} excess`, display: num(r.excess), source: derived(`usable on hand ${num(r.usableOnHand)} + inbound ${num(r.inboundQty)} − demand ${num(r.demand)} = ${num(r.supply - r.demand)}${r.excess === 0 ? ' → no excess' : ''}`, [`${m.id}.usable`, ...(m.inbound ? [`${m.id}.inbound`] : []), `${m.id}.demand`], now, 'Analysis') })
    add({ key: `${m.id}.exposure`, label: `${m.id} financial exposure`, display: usd(r.exposure), source: derived(`excess ${num(r.excess)} × $${m.unitCost.toFixed(2)} = ${usd(r.exposure)}`, [`${m.id}.excess`, `${m.id}.unitCost`], now, 'Analysis') })
    add({ key: `${m.id}.daysOfSupply`, label: `${m.id} days of supply`, display: `${r.daysOfSupply}`, source: derived(`usable on hand ${num(r.usableOnHand)} ÷ (${num(r.demand)} demand ÷ 20 working days)`, [`${m.id}.usable`, `${m.id}.demand`], now, 'Analysis') })
  }

  // conflict-side facts
  add({ key: 'PO-9921.erpDate', label: 'PO-9921 delivery date (ERP)', display: day(primaryMat.inbound!.erpDate), source: facts['MCB-220.inbound'].source })
  add({ key: 'PO-9921.supplierDate', label: 'PO-9921 date reported by supplier', display: day(supplier.date), source: msgSource(msg(supplier.messageId)), confirmed: s.captured.includes('m3') && supplier.messageId === 'e1' ? { by: 'Priya Nair (also in chat)', at: msg('m3').at } : undefined })
  add({ key: 'MCB-220.qcHoldErp', label: 'MCB-220 quality hold (ERP)', display: '180', source: erp(primaryMat, 'In quality inspection') })
  add({ key: 'MCB-220.qcHoldChat', label: 'MCB-220 quality hold (chat)', display: '220', source: msgSource(msg('m2')) })

  add({ key: 'order.qty', label: 'PO-48213 quantity (DA-300)', display: `${num(order.oldQty)} → ${num(order.newQty)}`, source: msgSource(msg('e2')), confirmed: { by: 'Order desk (ERP updated)', at: '2026-11-19T08:42:00' } })
  add({ key: 'order.revenue', label: 'Revenue reduction from cut', display: usd(revenueAtRisk()), source: derived(`${num(order.oldQty - order.newQty)} units × $${order.pricePerUnit} = ${usd(revenueAtRisk())}`, ['order.qty'], order.changedAt, 'Analysis') })
  add({ key: 'scenario.demandAdj', label: 'Demand scenario (user-entered)', display: pct(s.demandAdjPct), source: { kind: 'Derived', label: 'Your scenario', at: now, by: 'Maya Ortiz', detail: { type: 'doc', title: 'Demand scenario', page: 'Impact & Options', excerpt: 'Entered by the planner on the demand slider. Company Brain never forecasts demand.' } } })
  const defText = ['on hand', s.definition.excludeQcHold && '− quality hold', s.definition.excludeReserved && '− reserved', s.definition.includeInbound && `+ inbound ≤ ${s.definition.inboundDays} days`].filter(Boolean).join(' ')
  add({ key: 'definition.usable', label: '"Usable stock" definition', display: defText, source: { kind: 'Derived', label: 'Agreed definition', at: '2026-11-02T10:00:00', by: 'Onboarding workshop', detail: { type: 'doc', title: 'Metric definitions v2', page: 'Onboarding · step 2', excerpt: `Usable stock = ${defText}. Agreed by Maya Ortiz, Wei Chen and Daniel Reyes.` } }, confirmed: { by: 'Daniel Reyes', at: '2026-11-02T10:30:00' } })

  // options
  const capturedSet = new Set(s.captured)
  add({ key: 'opt.reduce', label: 'PO-9921 cancellation terms', display: '8% fee before Nov 28', source: { kind: 'PDF', label: 'PDF · Kestrel MSA §7.2', at: '2026-11-12T10:00:00', by: 'Supplier contracts', detail: { type: 'doc', title: 'Kestrel Electronics MSA (2025)', page: '§7.2, p. 14', excerpt: 'Buyer may reduce or cancel open purchase order quantities up to ten (10) days before the scheduled ship date, subject to a fee of eight percent (8%) of the reduced value.' } }, confirmed: { by: 'Procurement legal', at: '2026-11-12T10:00:00' } })
  add({ key: 'opt.reallocate', label: 'DA-310 can absorb boards', display: '~250 over 6 weeks', source: msgSource(msg('m5')), confirmed: capturedSet.has('m5') ? { by: 'Luis Romero', at: msg('m5').at } : undefined, note: capturedSet.has('m5') ? undefined : 'Only mentioned in chat. Add it to the shared view to back this option.' })
  add({ key: 'opt.return', label: 'Supplier return terms', display: 'Up to 100, 15% restock', source: msgSource(msg('m6')), confirmed: capturedSet.has('m6') ? { by: 'Priya Nair', at: msg('m6').at } : undefined, note: capturedSet.has('m6') ? undefined : 'Only mentioned in chat. Add it to the shared view to back this option.' })
  add({ key: 'opt.hold', label: 'Carrying cost policy', display: `2%/month × ${holdMonths} months`, source: { kind: 'PDF', label: 'PDF · Finance policy FP-12', at: '2026-01-15T09:00:00', by: 'Finance', detail: { type: 'doc', title: 'Finance policy FP-12: Inventory carrying cost', page: 'p. 2', excerpt: 'For planning purposes, apply a carrying cost of 2% of standard value per month to inventory held beyond 30 days.' } }, confirmed: { by: 'Finance', at: '2026-01-15T09:00:00' } })

  // ---- option plan ----
  const standalone = Object.fromEntries(options.map((o) => [o.id, optionStandalone(o, primary.excess, primaryMat.unitCost)]))
  const plan = planOptions(s.selected, options, primary.excess, primaryMat.unitCost)
  for (const o of options) {
    const st = standalone[o.id]
    const rate = o.id === 'hold' ? `${o.costRate * 100}%/mo × ${holdMonths} mo` : `${o.costRate * 100}%`
    add({
      key: `optcost.${o.id}`,
      label: `${o.title}: cost on its own`,
      display: usd(st.cost),
      source: derived(`${num(st.applied)} units × $${primaryMat.unitCost} × ${rate} = ${usd(st.cost)}`, [`opt.${o.id}`, 'MCB-220.excess', 'MCB-220.unitCost'], now, 'Analysis'),
    })
  }

  return { now, ctx, rows, primary, primaryMat, conflicts, openConflicts, facts, msgs, standalone, plan }
}

export type Derived = ReturnType<typeof derive>

// One derivation per state change, shared by every component.
let cache: { s: Store; d: Derived } | null = null
function derivedFor(s: Store): Derived {
  if (cache?.s !== s) cache = { s, d: derive(s) }
  return cache.d
}

export function useDerived(): Derived {
  const s = useStore()
  return useMemo(() => derivedFor(s), [s])
}

// ---- decision package pinning ----
export const PINNED_KEYS = [
  'order.qty',
  'scenario.demandAdj',
  'definition.usable',
  'MCB-220.onHand',
  'MCB-220.qcHold',
  'MCB-220.reserved',
  'MCB-220.usable',
  'MCB-220.inbound',
  'MCB-220.arrival',
  'PO-9921.supplierDate',
  'MCB-220.unitCost',
  'opt.reduce',
  'opt.reallocate',
  'opt.return',
  'opt.hold',
]

export function pinInputs(d: Derived, chosen: string[]): PinnedInput[] {
  const keys = PINNED_KEYS.filter((k) => !k.startsWith('opt.') || chosen.includes(k.slice(4)))
  return keys.map((k) => {
    const f = d.facts[k]
    return { key: k, label: f.label, value: f.display, source: f.source.kind, at: f.source.at }
  })
}

export function snapshot(d: Derived): DecisionSnapshot {
  return {
    excess: d.primary.excess,
    exposure: d.primary.exposure,
    residual: d.plan.residual,
    totalCost: d.plan.totalCost,
    revenueAtRisk: revenueAtRisk(),
    daysOfSupply: d.primary.daysOfSupply,
    usable: d.primary.usable,
    demand: d.primary.demand,
    lines: d.plan.lines,
    standalone: options.map((o) => d.standalone[o.id]),
  }
}

export function staleInputs(pinned: PinnedInput[], d: Derived) {
  return pinned
    .map((p) => ({ ...p, current: d.facts[p.key]?.display ?? '—' }))
    .filter((p) => p.current !== p.value)
}
