import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight, Check, CheckCircle2, Clock, Loader2, Lock, Scale, ShieldAlert } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../../store/store'
import { useDerived } from '../../store/derive'
import { materials, options, order, PRIMARY, wip, type OptionId } from '../../data/scenario'
import { daysBetween, revenueAtRisk } from '../../lib/calc'
import { day, num, pct, usd, usdExact } from '../../lib/format'
import { navigate } from '../../lib/router'
import { FactValue, SourceChip } from '../../components/FactValue'
import { AnimatedNumber, Badge, Button, Card, cx, PageHeader, SectionTitle } from '../../components/ui'

const steps = ['Reading PO-48213 revision', 'Exploding DA-300 bill of materials', 'Netting usable stock & open POs', 'Checking PO cancellation windows']

function Analyzer({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (i >= steps.length) {
      const t = setTimeout(onDone, 250)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setI(i + 1), 480)
    return () => clearTimeout(t)
  }, [i, onDone])
  return (
    <Card className="p-6" aria-live="polite">
      <p className="mb-4 text-sm font-semibold text-slate-900">Analyzing impact of {order.id}…</p>
      <ul className="space-y-2.5">
        {steps.map((s, k) => (
          <li key={s} className={cx('flex items-center gap-2 text-sm transition-opacity', k > i ? 'opacity-40' : 'opacity-100')}>
            {k < i ? <CheckCircle2 className="size-4 text-emerald-600" /> : k === i ? <Loader2 className="size-4 animate-spin text-accent-600" /> : <span className="size-4 rounded-full border border-slate-300" />}
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-accent-600 transition-all duration-500" style={{ width: `${(i / steps.length) * 100}%` }} />
      </div>
    </Card>
  )
}

function Kpi({ label, children, sub, tone = 'slate' }: { label: string; children: React.ReactNode; sub?: React.ReactNode; tone?: 'slate' | 'red' }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={cx('mt-1 text-2xl font-semibold tracking-tight', tone === 'red' ? 'text-red-700' : 'text-slate-900')}>{children}</p>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </Card>
  )
}

function ImpactResults() {
  const d = useDerived()
  const totalExcess = materials.reduce((s, m) => s + d.rows[m.id].excess, 0)
  const totalExposure = materials.reduce((s, m) => s + d.rows[m.id].exposure, 0)
  const chart = materials.map((m) => ({ id: m.id, excess: d.rows[m.id].excess, exposure: d.rows[m.id].exposure }))
  return (
    <section aria-label="Impact analysis" className="fade-up space-y-6" data-tour="impact-results">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Revenue reduction" tone="red" sub={<SourceChip factKey="order.revenue" />}>
          {usd(revenueAtRisk())}
        </Kpi>
        <Kpi label="Excess units (all materials)" sub={`${materials.filter((m) => d.rows[m.id].excess > 0).length} of ${materials.length} materials affected`}>
          <AnimatedNumber value={totalExcess} format={num} />
        </Kpi>
        <Kpi label="Financial exposure" tone="red" sub="excess × standard cost">
          <AnimatedNumber value={totalExposure} format={usd} />
        </Kpi>
        <Kpi label="POs still adjustable" sub={<span className="flex items-center gap-1"><Clock className="size-3" /> PO-9921 window closes {day('2026-11-28')}</span>}>
          2 of 3
        </Kpi>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="px-4 py-2.5 font-medium">Material</th>
                <th className="px-4 py-2.5 text-right font-medium">Demand</th>
                <th className="px-4 py-2.5 text-right font-medium">Supply</th>
                <th className="px-4 py-2.5 text-right font-medium">Excess</th>
                <th className="px-4 py-2.5 text-right font-medium">Exposure</th>
                <th className="px-4 py-2.5 font-medium">Open PO adjustable?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.map((m) => {
                const r = d.rows[m.id]
                const ib = m.inbound
                const daysLeft = ib?.cancelBy ? daysBetween(d.now, ib.cancelBy) : undefined
                return (
                  <tr key={m.id} className={cx(m.id === PRIMARY && 'bg-red-50/40')}>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-slate-900">{m.id}</p>
                      <p className="text-xs text-slate-500">{m.name}</p>
                    </td>
                    <td className="tnum px-4 py-2.5 text-right">
                      <span className="text-xs text-slate-400 line-through">{num(r.oldDemand)}</span> <AnimatedNumber value={r.demand} format={num} />
                    </td>
                    <td className="tnum px-4 py-2.5 text-right">{num(r.supply)}</td>
                    <td className="px-4 py-2.5 text-right">
                      {r.excess > 0 ? <FactValue factKey={`${m.id}.excess`} compact valueClass="text-red-700" className="justify-end" /> : r.shortage > 0 ? <Badge tone="amber">Short {num(r.shortage)}</Badge> : <Badge tone="green">None</Badge>}
                    </td>
                    <td className="px-4 py-2.5 text-right">{r.exposure > 0 ? <FactValue factKey={`${m.id}.exposure`} compact className="justify-end" /> : <span className="text-slate-400">$0</span>}</td>
                    <td className="px-4 py-2.5 text-xs">
                      {!ib ? (
                        <span className="text-slate-400">No open PO</span>
                      ) : ib.cancelBy && daysLeft !== undefined && daysLeft >= 0 ? (
                        <span className="text-slate-700">
                          <Badge tone="green">{ib.po}: yes</Badge> until {day(ib.cancelBy)} ({daysLeft}d) · {(ib.cancelFeePct! * 100).toFixed(0)}% fee
                        </span>
                      ) : (
                        <span><Badge tone="red"><Lock className="size-3" /> {ib.po}: no</Badge> <span className="text-slate-500">{ib.windowNote}</span></span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
        <Card className="p-4">
          <SectionTitle>Excess units by material</SectionTitle>
          <div className="h-52" role="img" aria-label={`Bar chart of excess units: ${chart.map((c) => `${c.id} ${c.excess}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 18, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="id" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(v, n) => (n === 'excess' ? [`${num(Number(v))} units`, 'Excess'] : [v, n])} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="excess" radius={[4, 4, 0, 0]} isAnimationActive>
                  {chart.map((c) => (
                    <Cell key={c.id} fill={c.excess === 0 ? '#cbd5e1' : c.id === PRIMARY ? '#dc2626' : '#f87171'} />
                  ))}
                  <LabelList dataKey="excess" position="top" style={{ fontSize: 11, fill: '#334155' }} formatter={(v) => num(Number(v))} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <SectionTitle>Affected work in progress</SectionTitle>
        <ul className="grid gap-3 md:grid-cols-3">
          {wip.map((w) => (
            <li key={w.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-medium text-slate-900">{w.id} <span className="font-normal text-slate-500">· {w.product} · {num(w.qty)} units</span></p>
              <p className="text-xs text-slate-500">{w.status}</p>
              <p className={cx('mt-1.5 text-xs', w.impact.startsWith('No longer') ? 'text-red-700' : 'text-slate-600')}>{w.impact}</p>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}

function Options() {
  const d = useDerived()
  const s = useStore()
  const r = d.primary
  const optFact: Record<OptionId, string> = { reduce: 'opt.reduce', reallocate: 'opt.reallocate', return: 'opt.return', hold: 'opt.hold' }
  const chartData = options.map((o) => ({ id: o.title, cost: d.standalone[o.id].cost }))
  const riskTone = { Low: 'green', Medium: 'amber', High: 'red' } as const

  return (
    <section aria-label="Leftover stock options" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Options for MCB-220 excess</h2>
          <p className="text-sm text-slate-500">Compare cost, risk and timing side by side. Company Brain shows trade-offs; you decide.</p>
        </div>
      </div>

      <Card className="p-4" data-tour="demand-slider">
        <div className="flex flex-wrap items-center gap-6">
          <div className="min-w-[260px] flex-1">
            <label htmlFor="demand" className="flex items-center justify-between text-sm font-medium text-slate-800">
              <span>Your remaining-demand scenario</span>
              <span className="tnum rounded-md bg-accent-50 px-2 py-0.5 text-accent-800">{pct(s.demandAdjPct)}</span>
            </label>
            <input
              id="demand"
              type="range"
              min={-40}
              max={20}
              step={5}
              value={s.demandAdjPct}
              onChange={(e) => s.setDemandAdj(Number(e.target.value))}
              className="mt-2 w-full"
              aria-valuetext={`${pct(s.demandAdjPct)}, demand ${r.demand} units`}
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>−40%</span>
              <span>−20%</span>
              <span>0</span>
              <span>+20%</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-xs text-slate-500">Demand</p>
              <p className="text-lg font-semibold"><AnimatedNumber value={r.demand} format={num} /></p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Supply</p>
              <p className="text-lg font-semibold"><AnimatedNumber value={r.supply} format={num} /></p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Excess</p>
              <p className="text-lg font-semibold text-red-700"><AnimatedNumber value={r.excess} format={num} /></p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">You enter the scenario; Company Brain never forecasts demand. <SourceChip factKey="MCB-220.demand" /></p>
        {r.shortage > 0 && (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
            <AlertTriangle className="size-4" /> At this demand, supply is <b>short by {num(r.shortage)}</b>. Options that reduce supply would make it worse.
          </p>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-tour="option-cards">
        {options.map((o) => {
          const st = d.standalone[o.id]
          const checked = s.selected.includes(o.id)
          const line = d.plan.lines.find((l) => l.id === o.id)
          const fact = d.facts[optFact[o.id]]
          return (
            <Card key={o.id} className={cx('flex flex-col p-4 transition-shadow', checked && 'ring-2 ring-accent-500')}>
              <label className="flex cursor-pointer items-start gap-2.5">
                <input type="checkbox" aria-label={`Include ${o.title} in your combination`} checked={checked} onChange={() => s.toggleOption(o.id)} className="mt-1 size-4 accent-[var(--color-accent-600)]" />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{o.title}</span>
                  <span className="block text-xs text-slate-500">{o.short}</span>
                </span>
              </label>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-slate-500">Cost</dt>
                  <dd className="mt-0.5 text-base font-semibold text-slate-900"><AnimatedNumber value={st.cost} format={usd} /></dd>
                </div>
                <div>
                  <dt className="text-slate-500">Risk</dt>
                  <dd className="mt-1"><Badge tone={riskTone[o.risk]}>{o.risk}</Badge></dd>
                </div>
                <div>
                  <dt className="text-slate-500">Units</dt>
                  <dd className="tnum mt-0.5 text-base font-semibold text-slate-900">{num(st.applied)}</dd>
                </div>
              </dl>
              <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-600"><Clock className="mt-0.5 size-3 shrink-0" /> {o.timing}</p>
              <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-600"><ShieldAlert className="mt-0.5 size-3 shrink-0" /> {o.riskNote}</p>
              {o.id === 'reduce' && r.shortage > 0 && <p className="mt-2 text-xs font-medium text-amber-700">Would deepen the shortage.</p>}
              <div className="mt-auto pt-3">
                <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
                  <SourceChip factKey={optFact[o.id]} />
                  {!fact.confirmed && <span className="text-[11px] text-amber-700">Unverified: add the chat message in Activity</span>}
                </div>
                {checked && line && st.applied !== line.applied && (
                  <p className="mt-2 text-[11px] text-accent-700">In your combination: {num(line.applied)} units · {usd(line.cost)}</p>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-4" data-tour="combined">
          <SectionTitle right={<Badge tone="slate"><Scale className="size-3" /> No option is pre-picked</Badge>}>Your combination</SectionTitle>
          {s.selected.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Tick one or more options to see the combined result. They apply in the order you tick them.</p>
          ) : (
            <>
              <ol className="space-y-1.5 text-sm">
                {d.plan.lines.map((l, i) => (
                  <li key={l.id} className="flex items-center justify-between gap-3">
                    <span className="text-slate-700">
                      <span className="mr-2 text-xs text-slate-400">{i + 1}.</span>
                      {options.find((o) => o.id === l.id)!.title}
                      <span className="ml-2 text-xs text-slate-500">{l.id === 'hold' ? `holds ${num(l.applied)}` : `−${num(l.applied)} units`}</span>
                    </span>
                    <span className="tnum font-medium">{usdExact(l.cost)}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-200 pt-4">
                <div>
                  <p className="text-xs text-slate-500">Excess before</p>
                  <p className="text-lg font-semibold"><AnimatedNumber value={r.excess} format={num} /></p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Residual excess</p>
                  <p className={cx('text-lg font-semibold', d.plan.residual > 0 ? 'text-red-700' : 'text-emerald-700')}>
                    <AnimatedNumber value={d.plan.residual} format={num} />
                    {d.plan.residual === 0 && <Check className="ml-1 inline size-4" />}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total cost</p>
                  <p className="text-lg font-semibold"><AnimatedNumber value={d.plan.totalCost} format={usd} /></p>
                </div>
              </div>
              {d.plan.held > 0 && <p className="mt-2 text-xs text-slate-500">{num(d.plan.held)} units held in stock at 2%/month carrying cost.</p>}
              <Button variant="primary" className="mt-4 w-full" onClick={() => navigate('decisions')} data-tour="to-decision">
                Build decision package <ArrowRight className="size-4" />
              </Button>
            </>
          )}
        </Card>
        <Card className="p-4">
          <SectionTitle>Cost if used on its own</SectionTitle>
          <div className="h-48" role="img" aria-label={`Option cost comparison: ${chartData.map((c) => `${c.id} ${usd(c.cost)}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 48, left: 8, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="id" width={130} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(v) => [usd(Number(v)), 'Cost']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="cost" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={18}>
                  <LabelList dataKey="cost" position="right" style={{ fontSize: 11, fill: '#334155' }} formatter={(v) => usd(Number(v))} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Low cost isn't the whole story: reallocation is free but medium-risk.</p>
        </Card>
      </div>
    </section>
  )
}

export function ImpactPage() {
  const impactRun = useStore((s) => s.impactRun)
  const requested = useStore((s) => s.analyzeRequested)
  const request = useStore((s) => s.requestAnalyze)
  const setRun = useStore((s) => s.setImpactRun)
  const running = requested && !impactRun

  return (
    <div>
      <PageHeader title="Impact & Options" subtitle={`What ${order.customer}'s order cut means for stock, money and open POs, and what you could do about it.`} />
      {!impactRun && !running && (
        <Card className="mb-6 flex flex-wrap items-center gap-4 border-red-200 p-5">
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900">Customer order changed: {order.id} cut from {num(order.oldQty)} → {num(order.newQty)}</p>
            <p className="mt-1 text-sm text-slate-600">Normally this means calls to purchasing, production and finance. Run the impact analysis to see it in one place.</p>
          </div>
          <Button variant="danger" onClick={() => request(true)} data-tour="analyze-btn">
            Analyze impact <ArrowRight className="size-4" />
          </Button>
        </Card>
      )}
      {running && (
        <Analyzer
          onDone={() => {
            setRun()
            request(false)
          }}
        />
      )}
      {impactRun && (
        <div className="space-y-10">
          <ImpactResults />
          <Options />
        </div>
      )}
    </div>
  )
}
