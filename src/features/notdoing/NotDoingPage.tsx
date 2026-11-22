import { Ban, Bot, GitBranch, LineChart } from 'lucide-react'
import { tagline, valueProp } from '../../data/scenario'
import { Card, PageHeader } from '../../components/ui'

const items = [
  { icon: Ban, title: 'No ERP replacement or write-back', body: 'Company Brain is read-only. The ERP stays the system of record, which also keeps the IT and security bar low for a pilot.' },
  { icon: Bot, title: 'No autonomous AI decisions or auto-ordering', body: 'The assistant explains and drafts. People make every decision.' },
  { icon: GitBranch, title: 'No approval routing', body: 'Approvals are already clear and fast (H2 invalidated). The slow part is preparing the decision, so that is what we help with.' },
  { icon: LineChart, title: 'No demand forecasting engine', body: 'You enter your own demand scenarios with the slider; the product never predicts demand (H3 invalidated).' },
]

export function NotDoingPage() {
  return (
    <div>
      <PageHeader title="What we don't do" subtitle="Saying no is part of the design. These were deliberately left out of the product." />
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((i) => (
          <Card key={i.title} className="p-5">
            <i.icon className="size-5 text-slate-500" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-slate-900">{i.title}</p>
            <p className="mt-1 text-sm text-slate-600">{i.body}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-8 bg-gradient-to-br from-accent-700 to-accent-800 p-6 text-white">
        <p className="text-lg font-semibold">{tagline}</p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-accent-100">{valueProp}</p>
      </Card>
    </div>
  )
}
