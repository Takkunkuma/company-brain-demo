import { useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, FileCheck2, Lock, MessageSquare, Pin, RefreshCw, Send, Zap } from 'lucide-react'
import { useStore } from '../../store/store'
import { pinInputs, snapshot, staleInputs, useDerived } from '../../store/derive'
import { options, order, people } from '../../data/scenario'
import { day, num, usd, usdExact, when } from '../../lib/format'
import { navigate } from '../../lib/router'
import { Avatar, Badge, Button, Card, cx, PageHeader, SectionTitle, SourceIcon, sourceMeta } from '../../components/ui'

const statusBadge = {
  none: <Badge>Not started</Badge>,
  draft: <Badge tone="slate">Draft</Badge>,
  awaiting: <Badge tone="violet">Awaiting approval</Badge>,
  approved: <Badge tone="green"><CheckCircle2 className="size-3" /> Approved</Badge>,
  question: <Badge tone="amber"><MessageSquare className="size-3" /> Question from Daniel</Badge>,
}

function Package() {
  const decision = useStore((s) => s.decision)
  const snap = decision.snapshot!
  const chosen = new Set(decision.chosen)
  return (
    <Card className="overflow-hidden" data-tour="package">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <FileCheck2 className="size-4 text-accent-700" />
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Decision package</p>
          <span className="ml-auto">{statusBadge[decision.status]}</span>
        </div>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">MCB-220 excess after {order.customer} cut {order.id}</h2>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
          <Avatar who="maya" size="xs" /> Prepared by Maya Ortiz for Daniel Reyes · generated {when(decision.generatedAt!)}
          {decision.sentAt && <> · sent {when(decision.sentAt)}</>}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-5">
        {[
          ['Orders at risk', `1 (${order.id})`, `${num(order.oldQty - order.newQty)} units cut`],
          ['Revenue at risk', usd(snap.revenueAtRisk), 'cut × $310'],
          ['MCB-220 excess', num(snap.excess), `exposure ${usd(snap.exposure)}`],
          ['Days of supply', `${snap.daysOfSupply}`, `usable ${num(snap.usable)} vs ${num(snap.demand)} demand`],
          ['Plan cost', usd(snap.totalCost), `residual ${num(snap.residual)} units`],
        ].map(([l, v, sub]) => (
          <div key={l} className="bg-white p-4">
            <p className="text-xs text-slate-500">{l}</p>
            <p className="tnum mt-1 text-lg font-semibold text-slate-900">{v}</p>
            <p className="text-[11px] text-slate-500">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <div>
          <SectionTitle>Options considered</SectionTitle>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-2 font-medium">Option</th>
                <th className="pb-2 text-right font-medium">Alone</th>
                <th className="pb-2 text-right font-medium">In plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {options.map((o) => {
                const alone = snap.standalone.find((x) => x.id === o.id)!
                const inPlan = snap.lines.find((x) => x.id === o.id)
                return (
                  <tr key={o.id} className={cx(chosen.has(o.id) && 'bg-accent-50/50')}>
                    <td className="py-2">
                      <span className={cx('font-medium', chosen.has(o.id) ? 'text-accent-800' : 'text-slate-700')}>{o.title}</span>
                      {chosen.has(o.id) && <Badge tone="indigo" className="ml-2">Chosen</Badge>}
                      <p className="text-[11px] text-slate-500">Risk {o.risk.toLowerCase()} · {o.timing}</p>
                    </td>
                    <td className="tnum py-2 text-right text-slate-600">{usd(alone.cost)}</td>
                    <td className="tnum py-2 text-right font-medium">{inPlan ? `${usdExact(inPlan.cost)} · ${num(inPlan.applied)}u` : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {decision.thread.length > 0 && (
            <div className="mt-6">
              <SectionTitle>Discussion</SectionTitle>
              <ul className="space-y-2">
                {decision.thread.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <Avatar who={t.who} size="sm" />
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-500">{people[t.who].name} · {when(t.at)}</p>
                      <p className="text-slate-700">{t.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div data-tour="pinned">
          <SectionTitle right={<Badge tone="slate"><Pin className="size-3" /> Pinned versions</Badge>}>Inputs this decision relied on</SectionTitle>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {decision.pinned.map((p) => (
              <li key={p.key} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 truncate text-slate-600">{p.label}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="tnum font-medium text-slate-900">{p.value}</span>
                  <span className={cx('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset', sourceMeta[p.source].cls)}>
                    <SourceIcon kind={p.source} /> {p.source} · {when(p.at).replace(/^\w+ /, '')}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500"><Lock className="size-3" /> If any of these change after the package is created, everyone involved is alerted.</p>
        </div>
      </div>
    </Card>
  )
}

function StaleBanner({ forDaniel }: { forDaniel?: boolean }) {
  const d = useDerived()
  const s = useStore()
  const stale = staleInputs(s.decision.pinned, d)
  if (stale.length === 0) return null
  return (
    <div role="alert" className="fade-up mb-5 overflow-hidden rounded-xl border border-amber-300 bg-amber-50" data-tour="stale">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <AlertTriangle className="size-4 text-amber-600" />
        <p className="text-sm font-semibold text-amber-900">
          {forDaniel ? 'Inputs changed since Maya sent this package' : 'An input to this decision changed'}
        </p>
        <span className="text-xs text-amber-800">{stale.length} of {s.decision.pinned.length} pinned inputs differ</span>
      </div>
      <ul className="border-t border-amber-200 bg-white/70 px-4 py-2 text-sm">
        {stale.map((x) => (
          <li key={x.key} className="flex flex-wrap items-center gap-2 py-1">
            <span className="text-slate-600">{x.label}</span>
            <span className="rounded bg-red-50 px-1.5 font-mono text-xs text-red-700 line-through">{x.value}</span>
            <ArrowRight className="size-3 text-slate-400" />
            <span className="rounded bg-emerald-50 px-1.5 font-mono text-xs text-emerald-800">{x.current}</span>
          </li>
        ))}
      </ul>
      {!forDaniel && (
        <div className="flex flex-wrap gap-2 border-t border-amber-200 px-4 py-3">
          <Button size="sm" variant="amber" onClick={() => navigate('impact')}>Review options</Button>
          <Button
            size="sm"
            onClick={() => {
              s.generateDecision(pinInputs(d, s.selected), snapshot(d))
              s.toast({ title: 'Package regenerated with current inputs', body: 'Status reset to Draft. Send it again when ready.', tone: 'info' })
            }}
          >
            <RefreshCw className="size-3.5" /> Regenerate with current inputs
          </Button>
        </div>
      )}
    </div>
  )
}

function MayaView() {
  const d = useDerived()
  const s = useStore()
  const [reply, setReply] = useState('')
  const dec = s.decision
  const canGenerate = s.impactRun && s.selected.length > 0
  const generate = () => s.generateDecision(pinInputs(d, s.selected), snapshot(d))

  if (dec.status === 'none') {
    return (
      <Card className="flex flex-col items-center p-10 text-center">
        <FileCheck2 className="size-8 text-accent-600" />
        <p className="mt-3 text-base font-semibold text-slate-900">Build a one-page package for Daniel</p>
        <p className="mt-1 max-w-md text-sm text-slate-500">
          It includes orders and revenue at risk, days of supply, the cost of every option, your chosen plan, and pins the exact version of every input it used.
        </p>
        {canGenerate ? (
          <Button variant="primary" className="mt-5" onClick={generate} data-tour="generate">
            Generate decision package
          </Button>
        ) : (
          <>
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {!s.impactRun ? 'First run the impact analysis, then pick one or more options.' : 'Pick at least one option first.'}
            </p>
            <Button variant="primary" className="mt-3" onClick={() => navigate('impact')}>
              Go to Impact & Options <ArrowRight className="size-4" />
            </Button>
          </>
        )}
      </Card>
    )
  }

  return (
    <div>
      <StaleBanner />
      {dec.status === 'question' && (
        <Card className="mb-5 border-amber-300 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><MessageSquare className="size-4 text-amber-600" /> Daniel asked a question</p>
          <p className="mt-1 text-sm text-slate-700">"{dec.thread.filter((t) => t.who === 'daniel').at(-1)?.text}"</p>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (reply.trim()) {
                s.reply(reply.trim())
                setReply('')
              }
            }}
          >
            <input value={reply} onChange={(e) => setReply(e.target.value)} aria-label="Reply to Daniel" placeholder="Reply and resend…" className="h-9 flex-1 rounded-lg border border-slate-300 px-3 text-sm" />
            <Button variant="primary" type="submit" disabled={!reply.trim()}>Reply & resend</Button>
          </form>
        </Card>
      )}
      <div className="mb-5 flex flex-wrap items-center gap-2" data-tour="decision-actions">
        {dec.status === 'draft' && (
          <Button variant="primary" onClick={s.sendDecision} data-tour="send-btn">
            <Send className="size-4" /> Send to Daniel
          </Button>
        )}
        {dec.status === 'draft' && (
          <Button onClick={generate}>
            <RefreshCw className="size-4" /> Regenerate
          </Button>
        )}
        <Button variant={dec.status === 'draft' ? 'secondary' : 'amber'} onClick={s.simulateInputChange} disabled={!!s.supplierDateOverride} data-tour="simulate-btn">
          <Zap className="size-4" /> Simulate: an input changes
        </Button>
        {s.supplierDateOverride && <span className="text-xs text-slate-500">Simulated: supplier moved PO-9921 to {day(s.supplierDateOverride.date)}. Reset demo to run it again.</span>}
        {dec.status === 'awaiting' && <span className="text-xs text-slate-500">Tip: switch the persona (top right) to Daniel to approve.</span>}
      </div>
      <Package />
    </div>
  )
}

function DanielView() {
  const s = useStore()
  const [q, setQ] = useState('')
  const [asking, setAsking] = useState(false)
  const dec = s.decision
  if (dec.status === 'none' || dec.status === 'draft') {
    return (
      <Card className="p-10 text-center">
        <p className="text-base font-semibold text-slate-900">Nothing is waiting for your approval</p>
        <p className="mt-1 text-sm text-slate-500">When Maya sends a decision package, it shows up here with every input it relied on.</p>
        <Button className="mt-4" onClick={() => s.setPersona('maya')}>Switch back to Maya</Button>
      </Card>
    )
  }
  return (
    <div>
      <StaleBanner forDaniel />
      {dec.status === 'awaiting' && (
        <Card className="mb-5 p-4" data-tour="daniel-actions">
          <p className="text-sm font-semibold text-slate-900">Maya is asking you to approve this plan</p>
          {!asking ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="primary" onClick={s.approve}>
                <CheckCircle2 className="size-4" /> Approve
              </Button>
              <Button onClick={() => setAsking(true)}>
                <MessageSquare className="size-4" /> Ask a question
              </Button>
            </div>
          ) : (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (q.trim()) {
                  s.askQuestion(q.trim())
                  setQ('')
                  setAsking(false)
                }
              }}
            >
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} aria-label="Your question" placeholder="e.g. Can DA-310 really absorb 250?" className="h-9 flex-1 rounded-lg border border-slate-300 px-3 text-sm" />
              <Button variant="primary" type="submit" disabled={!q.trim()}>Send</Button>
              <Button type="button" variant="ghost" onClick={() => setAsking(false)}>Cancel</Button>
            </form>
          )}
        </Card>
      )}
      {dec.status === 'question' && <p className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">You asked Maya a question. Waiting for her reply.</p>}
      {dec.status === 'approved' && <p className="mb-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">You approved this plan. The pinned inputs are stored with your approval.</p>}
      <Package />
    </div>
  )
}

export function DecisionsPage() {
  const persona = useStore((s) => s.persona)
  return (
    <div>
      <PageHeader
        title="Decisions"
        subtitle={persona === 'maya' ? 'Prepare the decision for your manager. Every input is pinned, so you will know if anything changes after approval.' : 'Viewing as Daniel Reyes, Production & Inventory Control Manager.'}
      />
      {persona === 'maya' ? <MayaView /> : <DanielView />}
    </div>
  )
}
