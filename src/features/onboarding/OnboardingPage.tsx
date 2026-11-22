import { ArrowLeft, ArrowRight, Check, Users } from 'lucide-react'
import { useStore } from '../../store/store'
import { useDerived } from '../../store/derive'
import { connections, materials } from '../../data/scenario'
import { num } from '../../lib/format'
import { ConflictBanner } from '../inventory/ConflictBanner'
import { AnimatedNumber, Badge, Button, Card, cx, PageHeader, SourceIcon, sourceMeta, Toggle } from '../../components/ui'

const stepNames = ['Map data sources', 'Agree metric definitions', 'Review first conflicts together']

export function OnboardingPage() {
  const s = useStore()
  const d = useDerived()
  const step = s.onboardingStep
  const def = s.definition

  return (
    <div>
      <PageHeader
        title="Onboarding & data trust"
        subtitle="Dashboards fail when nobody trusts the numbers. Your Company Brain team sits with you for the first two weeks: people + software, not a self-serve setup."
      />
      <ol className="mb-6 grid gap-2 sm:grid-cols-3" aria-label="Onboarding steps">
        {stepNames.map((n, i) => (
          <li key={n}>
            <button
              onClick={() => s.setOnboardingStep(i)}
              aria-current={step === i ? 'step' : undefined}
              className={cx(
                'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                step === i ? 'border-accent-500 bg-accent-50 text-accent-900' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
              )}
            >
              <span className={cx('flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold', i < step ? 'bg-emerald-500 text-white' : step === i ? 'bg-accent-700 text-white' : 'bg-slate-100 text-slate-500')}>
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className="font-medium">{n}</span>
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Card className="p-6">
          <p className="text-sm font-semibold text-slate-900">Which systems hold the truth today?</p>
          <p className="mt-1 text-sm text-slate-500">Pick the sources to read from. We map their fields together in a 60-minute session; nothing is migrated or replaced.</p>
          <ul className="mt-5 divide-y divide-slate-100">
            {connections.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <span className={cx('flex size-8 items-center justify-center rounded-lg ring-1 ring-inset', sourceMeta[c.kind].cls)}>
                  <SourceIcon kind={c.kind} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.detail}</p>
                </div>
                <Toggle checked={!!s.sourcesMapped[c.id]} onChange={() => s.toggleMapped(c.id)} label={`Read from ${c.name}`} />
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-600">
            ERP <span className="text-slate-400">MMBE.TotalStock</span> → <b>On hand</b> · ERP <span className="text-slate-400">MMBE.QualityInsp</span> → <b>Quality hold</b> · Excel <span className="text-slate-400">Stock!E:E</span> → <b>Planner usable</b>
          </div>
        </Card>
      )}

      {step === 1 && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Card className="p-6" data-tour="definition">
            <p className="text-sm font-semibold text-slate-900">What counts as "usable stock"?</p>
            <p className="mt-1 text-sm text-slate-500">Most "wrong numbers" are really different definitions. Agree on one and every screen uses it. Try it: the numbers on the right (and across the app) recalculate.</p>
            <div className="mt-5 space-y-4">
              <Toggle checked={def.excludeQcHold} onChange={(v) => s.setDefinition({ excludeQcHold: v })} label="Exclude quality hold" description="Stock waiting on QC can't be issued." />
              <Toggle checked={def.excludeReserved} onChange={(v) => s.setDefinition({ excludeReserved: v })} label="Exclude reserved" description="Already promised to another work order." />
              <Toggle checked={def.includeInbound} onChange={(v) => s.setDefinition({ includeInbound: v })} label="Include inbound arriving soon" description="Count open POs arriving within N days (uses the confirmed arrival date)." />
              <div className={cx('pl-12 transition-opacity', !def.includeInbound && 'pointer-events-none opacity-40')}>
                <label htmlFor="ndays" className="flex justify-between text-xs text-slate-600">
                  <span>Within N days</span>
                  <span className="tnum font-medium">{def.inboundDays} days</span>
                </label>
                <input id="ndays" type="range" min={0} max={30} value={def.inboundDays} disabled={!def.includeInbound} onChange={(e) => s.setDefinition({ inboundDays: Number(e.target.value) })} className="w-full" />
              </div>
            </div>
            <p className="mt-5 rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700">Usable = {d.facts['definition.usable'].display}</p>
            <p className="mt-2 text-[11px] text-slate-500">Inbound is always counted once in excess, whatever this definition says.</p>
          </Card>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
                  <th className="px-4 py-2.5 font-medium">Material</th>
                  <th className="px-4 py-2.5 text-right font-medium">On screen</th>
                  <th className="px-4 py-2.5 text-right font-medium">Usable</th>
                  <th className="px-4 py-2.5 text-right font-medium">Planner sheet</th>
                  <th className="px-4 py-2.5 text-right font-medium">Excess</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.map((m) => {
                  const r = d.rows[m.id]
                  return (
                    <tr key={m.id}>
                      <td className="px-4 py-2.5 font-medium text-slate-900">{m.id}</td>
                      <td className="tnum px-4 py-2.5 text-right text-slate-500">{num(r.onHand)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-accent-800"><AnimatedNumber value={r.usable} format={num} /></td>
                      <td className={cx('tnum px-4 py-2.5 text-right', m.excelUsable === r.usableOnHand ? 'text-slate-600' : 'text-amber-700')}>{num(m.excelUsable)}</td>
                      <td className="px-4 py-2.5 text-right"><AnimatedNumber value={r.excess} format={num} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              Amber planner values no longer match the agreed definition. If you change it after confirming MCB-220, that conflict re-opens on Inventory.
            </p>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Card className="flex items-center gap-3 p-4">
            <Users className="size-5 text-accent-600" />
            <p className="text-sm text-slate-700">
              In the kickoff session we walk through the first conflicts with your team, so everyone sees why the numbers differ and who confirms what.{' '}
              <Badge tone={d.openConflicts.length ? 'amber' : 'green'}>{d.openConflicts.length} open</Badge>
            </p>
          </Card>
          {d.conflicts.map((c) => <ConflictBanner key={c.id} c={c} />)}
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <Button onClick={() => s.setOnboardingStep(Math.max(0, step - 1))} disabled={step === 0}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        {step < 2 ? (
          <Button variant="primary" onClick={() => s.setOnboardingStep(step + 1)}>
            Next: {stepNames[step + 1]} <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button variant="primary" onClick={() => { s.setOnboardingStep(0); window.location.hash = '/inventory' }}>
            Finish: go to Inventory <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
