import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, CheckCircle2, MessageSquare, Undo2 } from 'lucide-react'
import { useStore } from '../../store/store'
import { docs, factRows, lanes, PLAN_LANE, planIds, plans, ticks, versionLinks, type DocId, type DocStatus, type Tone, type Tool } from '../../data/reconciliation'
import { litNodes, sourceHealth, usedBy, versionFamily } from '../../lib/lineage'
import { usd, when } from '../../lib/format'
import { Badge, Button, Card, cx, PageHeader } from '../../components/ui'

const toolStyle: Record<Tool, string> = {
  Excel: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  SAP: 'bg-sky-50 text-sky-800 ring-sky-200',
  Email: 'bg-violet-50 text-violet-800 ring-violet-200',
  Chat: 'bg-teal-50 text-teal-800 ring-teal-200',
  PDF: 'bg-rose-50 text-rose-800 ring-rose-200',
}
const statusLabel: Record<DocStatus, string> = { latest: 'Latest version', old: 'Older version', unchecked: 'Not checked yet' }
const statusTone: Record<DocStatus, 'green' | 'red' | 'amber'> = { latest: 'green', old: 'red', unchecked: 'amber' }
const toneBadge: Record<Tone, 'green' | 'red' | 'amber'> = { good: 'green', bad: 'red', warn: 'amber' }
const toneText: Record<Tone, string> = { good: 'text-emerald-700', bad: 'text-red-700', warn: 'text-amber-700' }

function ToolTag({ tool }: { tool: Tool }) {
  return <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', toolStyle[tool])}>{tool}</span>
}

function PlanCards() {
  const recon = useStore((s) => s.recon)
  const setRecon = useStore((s) => s.setRecon)
  return (
    <div className="grid gap-3 md:grid-cols-3" data-tour="recon-plans">
      {planIds.map((id) => {
        const p = plans[id]
        const on = recon.plan === id
        const dec = recon.decision?.plan === id ? recon.decision.kind : null
        return (
          <button
            key={id}
            onClick={() => setRecon({ plan: id, doc: null })}
            aria-pressed={on}
            className={cx('rounded-xl border bg-white p-4 text-left transition-shadow', on ? 'border-accent-600 shadow-md ring-1 ring-accent-600' : 'border-slate-200 hover:border-slate-300')}
          >
            <span className="flex items-start gap-3">
              <span className={cx('flex size-9 shrink-0 items-center justify-center rounded-lg text-base font-bold', on ? 'bg-accent-700 text-white' : 'bg-accent-50 text-accent-800')}>{id}</span>
              <span className="min-w-0">
                <span className="block text-xs text-slate-500">Plan {id} · from {p.author}</span>
                <span className="mt-0.5 block text-[15px] font-semibold leading-snug text-slate-900">{p.title}</span>
              </span>
            </span>
            <span className="mt-3 flex gap-4 text-sm">
              <span><span className="text-slate-500">Cost </span><b>{usd(p.cost)}</b></span>
              <span><span className="text-slate-500">Afterwards </span><b className={toneText[p.afterTone]}>{p.after}</b></span>
            </span>
            <span className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone={toneBadge[p.tone]}>{p.verdict}</Badge>
              {dec && <Badge tone={dec === 'approved' ? 'indigo' : 'slate'}>{dec === 'approved' ? 'Approved by Daniel' : `Sent back to ${p.author}`}</Badge>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function TableView() {
  const recon = useStore((s) => s.recon)
  const setRecon = useStore((s) => s.setRecon)
  return (
    <Card className="overflow-hidden" data-tour="recon-table">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-slate-200 px-4 py-3">
        <h2 className="text-[15px] font-semibold text-slate-900">The numbers each plan used</h2>
        <span className="text-xs text-slate-500">Under each number: the file and version it came from. Click one to see it.</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr>
              <th className="w-52 px-4 py-2.5" />
              {planIds.map((id) => (
                <th key={id} className={cx('px-3 py-2.5 text-left font-bold text-slate-900', recon.plan === id && 'bg-accent-50')}>
                  Plan {id} <span className="font-medium text-slate-500">· {plans[id].author}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factRows.map((row) => (
              <tr key={row.label} className={cx('border-t border-slate-100', row.summary && 'bg-slate-50/70')}>
                <td className="px-4 py-2 font-medium text-slate-700">{row.label}</td>
                {planIds.map((id) => {
                  const c = row.cells[id]
                  const d = c.doc ? docs[c.doc] : null
                  const st: DocStatus = c.status ?? d?.status ?? 'latest'
                  const selected = recon.doc === c.doc && recon.plan === id && !!c.doc
                  const content = (
                    <>
                      <span className={cx('block font-semibold tabular-nums', st === 'old' ? 'text-red-800' : st === 'unchecked' ? 'text-amber-800' : 'text-slate-900')}>{c.value}</span>
                      <span className={cx('mt-0.5 block text-[11px]', st === 'old' ? 'text-red-700' : st === 'unchecked' ? 'text-amber-700' : 'text-slate-500')}>
                        {d ? `${d.title} · ${d.when}` : c.note}
                      </span>
                    </>
                  )
                  const box = cx(
                    'block w-full rounded-lg border px-2.5 py-1.5 text-left',
                    st === 'old' ? 'bg-red-50' : st === 'unchecked' ? 'bg-amber-50' : 'bg-transparent',
                    selected ? 'border-accent-600 ring-1 ring-accent-600' : 'border-transparent',
                  )
                  return (
                    <td key={id} className={cx('px-1.5 py-1 align-top', recon.plan === id && 'bg-accent-50/40')}>
                      {c.doc ? (
                        <button onClick={() => setRecon({ plan: id, doc: c.doc! })} className={cx(box, 'hover:border-slate-300')} aria-label={`${row.label} for Plan ${id}: ${c.value}, from ${d!.title}`}>
                          {content}
                        </button>
                      ) : (
                        <div className={box}>{content}</div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(1100)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

const statusNode: Record<DocStatus, string> = {
  latest: 'bg-emerald-50 text-emerald-800 border-emerald-500',
  old: 'bg-red-50 text-red-800 border-red-500',
  unchecked: 'bg-amber-50 text-amber-800 border-amber-500',
}
const statusStroke: Record<DocStatus, { color: string; dash?: string }> = {
  latest: { color: '#4f46e5' },
  old: { color: '#dc2626', dash: '6 5' },
  unchecked: { color: '#d97706', dash: '6 5' },
}

function GraphView() {
  const recon = useStore((s) => s.recon)
  const setRecon = useStore((s) => s.setRecon)
  const [ref, width] = useWidth<HTMLDivElement>()
  const LABEL = width < 900 ? 108 : 136
  const COL = Math.max(56, (width - LABEL) / ticks.length)
  const TOP = 30
  const LANE = 58
  const W = LABEL + COL * ticks.length
  const H = TOP + LANE * lanes.length
  const nodeW = Math.min(76, COL - 6)
  const X = (c: number) => LABEL + c * COL + COL / 2
  const Y = (l: number) => TOP + l * LANE + LANE / 2
  const curve = (x1: number, y1: number, x2: number, y2: number) =>
    y1 === y2 ? `M${x1} ${y1} L${x2} ${y2}` : `M${x1} ${y1} C${(x1 + x2) / 2} ${y1} ${(x1 + x2) / 2} ${y2} ${x2} ${y2}`
  const lit = litNodes({ plan: recon.plan, doc: recon.doc })

  return (
    <Card className="overflow-hidden" data-tour="recon-graph">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-200 px-4 py-3">
        <h2 className="text-[15px] font-semibold text-slate-900">
          {recon.doc ? `Which plans used “${docs[recon.doc].label}”` : `How Plan ${recon.plan} was built: the files it used light up`}
        </h2>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-600"><span className="w-5 border-t-[2.5px] border-accent-600" />latest version</span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600"><span className="w-5 border-t-[2.5px] border-dashed border-red-600" />older version</span>
        <span className="flex items-center gap-1.5 text-xs text-slate-600"><span className="w-5 border-t-[2.5px] border-dashed border-amber-600" />not checked yet</span>
      </div>
      <div ref={ref} className="w-full">
        <div className="relative" style={{ width: W, height: H }}>
          {lanes.map((name, i) => (
            <div key={name} className={cx('absolute left-0 border-t border-slate-100', i === PLAN_LANE ? 'bg-accent-50' : i % 2 ? 'bg-white' : 'bg-slate-50/60')} style={{ top: TOP + i * LANE, height: LANE, width: W }}>
              <span className={cx('absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold leading-tight', i === PLAN_LANE ? 'text-accent-800' : 'text-slate-600')} style={{ width: LABEL - 16 }}>
                {name}
              </span>
            </div>
          ))}
          {ticks.map((t, c) => (
            <span key={t} className="absolute top-2 text-center text-[11px] font-semibold text-slate-400" style={{ left: X(c) - COL / 2, width: COL }}>{t}</span>
          ))}
          <svg width={W} height={H} className="pointer-events-none absolute left-0 top-0" aria-hidden>
            {versionLinks.map((l) => {
              const on = lit.has(l.from) && lit.has(l.to)
              const a = docs[l.from], b = docs[l.to]
              return (
                <path key={l.from + l.to} d={curve(X(a.col), Y(a.lane), X(b.col), Y(b.lane))} fill="none"
                  stroke={l.kind === 'copy' ? '#dc2626' : '#94a3b8'} strokeWidth={on ? 2.5 : 1.5} strokeDasharray={l.kind === 'copy' ? '6 5' : undefined}
                  opacity={on ? 1 : 0.2} className="transition-opacity duration-300" />
              )
            })}
            {planIds.flatMap((pid) =>
              plans[pid].uses.map((d) => {
                const on = lit.has(d) && lit.has(`plan:${pid}`)
                const st = statusStroke[docs[d].status]
                return (
                  <path key={pid + d} d={curve(X(docs[d].col), Y(docs[d].lane), X(plans[pid].col), Y(PLAN_LANE))} fill="none"
                    stroke={on ? st.color : '#cbd5e1'} strokeWidth={on ? 2.5 : 1.25} strokeDasharray={st.dash}
                    opacity={on ? 1 : 0.35} strokeLinecap="round" className="transition-opacity duration-300" />
                )
              }),
            )}
          </svg>
          {(Object.keys(docs) as DocId[]).map((id) => {
            const d = docs[id]
            return (
              <button
                key={id}
                onClick={() => setRecon({ doc: id })}
                aria-pressed={recon.doc === id}
                aria-label={`${d.title}, ${statusLabel[d.status]}. Show which plans used it.`}
                title={`${d.title} · ${d.meta}`}
                className={cx('absolute z-10 overflow-hidden rounded-lg border-[1.5px] px-1 text-[11px] font-bold leading-[1.15] transition-opacity duration-300', statusNode[d.status], recon.doc === id && 'ring-2 ring-slate-900 ring-offset-1', !lit.has(id) && 'opacity-30')}
                style={{ left: X(d.col) - nodeW / 2, top: Y(d.lane) - 19, width: nodeW, height: 38 }}
              >
                {d.label}
              </button>
            )
          })}
          {planIds.map((pid) => {
            const on = lit.has(`plan:${pid}`)
            return (
              <button
                key={pid}
                onClick={() => setRecon({ plan: pid, doc: null })}
                aria-pressed={recon.plan === pid && !recon.doc}
                aria-label={`Plan ${pid}: ${plans[pid].title}. Show the files it used.`}
                className={cx('absolute z-10 rounded-lg border-[1.5px] border-accent-600 text-[13px] font-bold transition-all duration-300', on ? 'bg-accent-700 text-white' : 'bg-white text-accent-800 opacity-50', recon.plan === pid && !recon.doc && 'ring-2 ring-slate-900 ring-offset-1')}
                style={{ left: X(plans[pid].col) - nodeW / 2, top: Y(PLAN_LANE) - 18, width: nodeW, height: 36 }}
              >
                Plan {pid}
              </button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

function SourceCard({ id }: { id: DocId }) {
  const d = docs[id]
  const recon = useStore((s) => s.recon)
  const setRecon = useStore((s) => s.setRecon)
  const used = usedBy(id)
  return (
    <button
      onClick={() => setRecon({ doc: id })}
      className={cx(
        'block h-full w-full rounded-lg border p-3 text-left transition-colors',
        d.status === 'old' ? 'border-red-200 bg-red-50' : d.status === 'unchecked' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50 hover:bg-white',
        recon.doc === id && 'border-accent-600 ring-1 ring-accent-600',
      )}
    >
      <span className="flex flex-wrap items-center gap-1.5">
        <ToolTag tool={d.tool} />
        <Badge tone={statusTone[d.status]}>{statusLabel[d.status]}</Badge>
      </span>
      <span className={cx('mt-2 block text-xs', d.status === 'old' ? 'text-red-800' : 'text-slate-600')}>{d.title}</span>
      <span className="mt-0.5 block text-sm font-semibold text-slate-900">{d.fact}</span>
      <span className="mt-1 block text-xs text-slate-500">{d.meta} · used by {used.length ? used.map((p) => `Plan ${p}`).join(', ') : 'no plan'}</span>
      {d.note && <span className="mt-1.5 block text-xs leading-relaxed text-slate-600">{d.note}</span>}
    </button>
  )
}

function SourcesPanel() {
  const recon = useStore((s) => s.recon)
  const setRecon = useStore((s) => s.setRecon)
  const p = plans[recon.plan]
  let kicker: string, title: string, sub: string, items: DocId[]
  if (recon.doc) {
    const fam = versionFamily(recon.doc)
    kicker = 'One source, every version'
    title = docs[recon.doc].title
    sub = fam.length > 1 ? `Company Brain saved ${fam.length} versions of this sheet. The plans used different ones.` : `Only one version exists. Used by ${usedBy(recon.doc).map((x) => `Plan ${x}`).join(', ') || 'no plan'}.`
    items = fam
  } else {
    const h = sourceHealth(recon.plan)
    kicker = `What Plan ${recon.plan} was built from`
    title = `${p.uses.length} files and messages, gathered by ${p.author}`
    sub = [`${h.latest} latest`, h.old && `${h.old} older version`, h.unchecked && `${h.unchecked} not checked yet`].filter(Boolean).join(' · ')
    const order: Record<DocStatus, number> = { old: 0, unchecked: 1, latest: 2 }
    items = [...p.uses].sort((a, b) => order[docs[a].status] - order[docs[b].status])
  }
  return (
    <section aria-label="Sources" className="min-w-0 flex-[1.4_1_520px] overflow-hidden rounded-xl border-2 border-accent-600 bg-white" data-tour="recon-sources">
      <div className="border-b border-accent-200 bg-accent-50 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-accent-800">{kicker}</p>
        <p className="mt-0.5 text-base font-semibold text-indigo-950">{title}</p>
        <p className="mt-0.5 text-[13px] text-accent-700">{sub}</p>
      </div>
      {recon.doc && (
        <button onClick={() => setRecon({ doc: null })} className="mx-4 mt-3 flex items-center gap-1 text-xs font-semibold text-accent-700 hover:underline">
          <ArrowLeft className="size-3.5" /> Back to everything Plan {recon.plan} used
        </button>
      )}
      <ul className="grid gap-2.5 p-4 sm:grid-cols-2">
        {items.map((id) => (
          <li key={id}><SourceCard id={id} /></li>
        ))}
      </ul>
    </section>
  )
}

function DecisionPanel() {
  const recon = useStore((s) => s.recon)
  const persona = useStore((s) => s.persona)
  const setPersona = useStore((s) => s.setPersona)
  const decide = useStore((s) => s.decideRecon)
  const undo = useStore((s) => s.undoRecon)
  const p = plans[recon.plan]
  const dec = recon.decision
  return (
    <section aria-label="Daniel's decision" className="min-w-0 flex-[1_1_320px] rounded-xl border border-slate-200 bg-white p-4" data-tour="recon-decision">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{persona === 'daniel' ? 'Your decision' : 'Daniel decides'}</p>
      <p className="mt-1.5 text-base font-semibold text-slate-900">Plan {p.id}: {p.title}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{p.summary}</p>
      {dec ? (
        <>
          <div className={cx('mt-4 rounded-lg p-3 text-[13px] leading-relaxed', dec.kind === 'approved' ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-100 text-slate-800')}>
            {dec.kind === 'approved'
              ? `Daniel approved Plan ${dec.plan} at ${when(dec.at)}. The exact version of every file it used is saved with the approval, so if any of them change, Daniel and ${plans[dec.plan].author} get flagged.`
              : `Daniel sent Plan ${dec.plan} back to ${plans[dec.plan].author} at ${when(dec.at)}: “${plans[dec.plan].question}”`}
          </div>
          {persona === 'daniel' && (
            <Button size="sm" variant="ghost" className="mt-2" onClick={undo}><Undo2 className="size-3.5" /> Undo</Button>
          )}
        </>
      ) : persona === 'daniel' ? (
        <div className="mt-4 flex flex-col gap-2">
          <Button variant="primary" onClick={() => decide('approved')}><CheckCircle2 className="size-4" /> Approve Plan {p.id}</Button>
          <Button onClick={() => decide('asked')}><MessageSquare className="size-4" /> Send back to {p.author} with a question</Button>
        </div>
      ) : (
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-[13px] text-slate-600">
          You're viewing as Maya. Daniel reviews and approves plans here.
          <Button size="sm" className="mt-2" onClick={() => setPersona('daniel')}>View as Daniel</Button>
        </div>
      )}
    </section>
  )
}

export function ReconciliationPage() {
  const recon = useStore((s) => s.recon)
  const setRecon = useStore((s) => s.setRecon)
  const persona = useStore((s) => s.persona)
  return (
    <div>
      <PageHeader
        title={persona === 'daniel' ? 'Daniel, 3 plans for the extra boards need your review' : '3 plans for the extra boards are waiting for Daniel'}
        subtitle="Northwind cut their order from 2,000 to 800, so we'll have motor controller boards (MCB-220) we don't need. Maya, Luis and Wei each proposed a fix, but they worked from different versions of the same files."
        actions={
          <div role="group" aria-label="View" className="flex rounded-lg border border-slate-300 bg-white p-0.5" data-tour="recon-toggle">
            {(['table', 'graph'] as const).map((v) => (
              <button key={v} onClick={() => setRecon({ view: v })} aria-pressed={recon.view === v}
                className={cx('h-8 rounded-md px-4 text-sm font-medium capitalize', recon.view === v ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}>
                {v}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg border border-accent-200 bg-accent-50 px-3.5 py-2.5 text-[13px] text-indigo-950">
        <b>Company Brain sits on top of the tools you already use.</b>
        <span>It saved every version from</span>
        {(['Excel', 'SAP', 'Email', 'Chat', 'PDF'] as Tool[]).map((t) => <ToolTag key={t} tool={t} />)}
        <span>so each plan shows exactly what it was built from.</span>
      </div>

      <PlanCards />
      <div className="mt-4">{recon.view === 'table' ? <TableView /> : <GraphView />}</div>
      <div className="mt-4 flex flex-wrap items-start gap-4">
        <SourcesPanel />
        <DecisionPanel />
      </div>
    </div>
  )
}
