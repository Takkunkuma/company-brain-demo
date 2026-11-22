import { useState } from 'react'
import { ArrowRight, Mail, MessageCircle, Plus, Sparkles } from 'lucide-react'
import { useStore } from '../../store/store'
import { useDerived } from '../../store/derive'
import { chatGroupName, pendingDecisions, people, type Message } from '../../data/scenario'
import { day, when } from '../../lib/format'
import { Avatar, Badge, Button, Card, cx, PageHeader, SectionTitle, SourceIcon, sourceMeta } from '../../components/ui'

function Extracted({ m, tour }: { m: Message; tour?: boolean }) {
  const captured = useStore((s) => s.captured.includes(m.id))
  const capture = useStore((s) => s.capture)
  if (!m.extracted) return null
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-accent-200 bg-accent-50/60 px-2.5 py-2">
      <Sparkles className="size-3.5 text-accent-600" aria-hidden />
      <span className="text-[11px] font-medium uppercase tracking-wide text-accent-700">{m.extracted.tag}</span>
      <span className="text-sm font-medium text-slate-800">{m.extracted.text}</span>
      <span className="ml-auto">
        {captured ? (
          <Badge tone="green">In shared view</Badge>
        ) : (
          <Button size="sm" variant="primary" onClick={() => capture(m.id)} data-tour={tour ? 'capture-btn' : undefined}>
            <Plus className="size-3.5" /> Add to shared view
          </Button>
        )}
      </span>
      {m.createsConflict === 'qchold-mcb220' && !captured && <p className="w-full text-[11px] text-amber-700">Heads-up: this disagrees with ERP (180) and will raise a conflict.</p>}
    </div>
  )
}

function ChatFeed({ msgs }: { msgs: Message[] }) {
  return (
    <div className="space-y-3 bg-[#f3f5f4] p-4">
      {msgs.map((m) => {
        const mine = m.from === 'maya'
        return (
          <div key={m.id} className={cx('flex gap-2', mine && 'flex-row-reverse')}>
            <Avatar who={m.from} />
            <div className="min-w-0 max-w-[85%]">
              <p className="mb-0.5 text-[11px] text-slate-500">
                {people[m.from].name} · {when(m.at).split(' ').slice(1).join(' ')}
              </p>
              <div className={cx('rounded-lg px-3 py-2 text-sm shadow-sm', mine ? 'bg-[#95ec69]' : 'bg-white')}>{m.body}</div>
              <Extracted m={m} tour={m.id === 'm3'} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ActivityPage() {
  const d = useDerived()
  const log = useStore((s) => s.log)
  const decision = useStore((s) => s.decision)
  const [tab, setTab] = useState<'chat' | 'email'>('chat')
  const chat = d.msgs.filter((m) => m.channel === 'chat')
  const email = d.msgs.filter((m) => m.channel === 'email')
  const uncaptured = (list: Message[]) => list.filter((m) => m.extracted && !useStore.getState().captured.includes(m.id)).length

  return (
    <div>
      <PageHeader title="Activity" subtitle="What changed since you last looked, what's waiting on a decision, and updates captured from chat and email." />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <Card className="p-4" data-tour="changelog">
            <SectionTitle right={<span className="text-xs text-slate-500">Since Wed 4:00 PM</span>}>Since you last looked</SectionTitle>
            <ol className="relative space-y-4 border-l border-slate-200 pl-5">
              {[...log].reverse().map((e) => (
                <li key={e.id} className="fade-up relative">
                  <span className={cx('absolute -left-[27px] top-0.5 flex size-4 items-center justify-center rounded-full ring-4 ring-white', sourceMeta[e.source].cls)}>
                    <SourceIcon kind={e.source} className="size-2.5" />
                  </span>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="text-sm font-medium text-slate-800">{e.title}</p>
                    <p className="text-[11px] text-slate-500">{when(e.at)} · {e.who}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{e.field}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-xs">
                    {e.from !== undefined && (
                      <>
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-700 line-through decoration-red-300">{e.from}</span>
                        <ArrowRight className="size-3 text-slate-400" />
                      </>
                    )}
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800">{e.to}</span>
                  </p>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-4">
            <SectionTitle>Pending decisions</SectionTitle>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="pb-2 font-medium">Decision</th>
                  <th className="pb-2 font-medium">Owner</th>
                  <th className="pb-2 font-medium">Due</th>
                  <th className="pb-2 font-medium">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingDecisions.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 text-slate-800">{p.title}</td>
                    <td className="py-2 text-slate-600">{p.owner}</td>
                    <td className="tnum py-2 text-slate-600">{day(p.due)}</td>
                    <td className="py-2">
                      {p.linked ? (
                        <Badge tone={decision.status === 'approved' ? 'green' : decision.status === 'none' ? 'slate' : 'violet'}>
                          {{ none: 'Open', draft: 'Draft', awaiting: 'Awaiting approval', approved: 'Approved', question: 'Question' }[decision.status]}
                        </Badge>
                      ) : (
                        <Badge>Open</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {d.conflicts.filter((c) => c.status === 'needs_check').map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 text-slate-800">Check: {c.title.split(':')[0]}</td>
                    <td className="py-2 text-slate-600">Maya Ortiz</td>
                    <td className="py-2 text-slate-600">Today</td>
                    <td className="py-2"><Badge tone="amber">Needs check</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <Card className="overflow-hidden" data-tour="feed">
          <div className="flex items-center gap-1 border-b border-slate-200 px-3 pt-3">
            {(['chat', 'email'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={cx('-mb-px flex items-center gap-1.5 border-b-2 px-3 pb-2 text-sm font-medium', tab === t ? 'border-accent-600 text-accent-800' : 'border-transparent text-slate-500 hover:text-slate-800')}
              >
                {t === 'chat' ? <MessageCircle className="size-4" /> : <Mail className="size-4" />}
                {t === 'chat' ? chatGroupName : 'Email'}
                {uncaptured(t === 'chat' ? chat : email) > 0 && <Badge tone="indigo">{uncaptured(t === 'chat' ? chat : email)}</Badge>}
              </button>
            ))}
          </div>
          <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
            Company Brain reads these messages and extracts the key update. Nothing becomes a shared number until a person adds it.
          </p>
          {tab === 'chat' ? (
            <ChatFeed msgs={chat} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {[...email].reverse().map((m) => (
                <li key={m.id} className="fade-up p-4">
                  <div className="flex items-center gap-2">
                    <Avatar who={m.from} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">{m.subject}</p>
                      <p className="text-[11px] text-slate-500">{people[m.from].name} · {when(m.at)}</p>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-slate-600">{m.body}</p>
                  <Extracted m={m} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
