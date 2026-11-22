import { useState } from 'react'
import { Brain, Compass } from 'lucide-react'
import { useRoute } from './lib/router'
import { useStore } from './store/store'
import { tagline, valueProp } from './data/scenario'
import { Layout } from './components/Layout'
import { ProvenanceDrawer } from './components/ProvenanceDrawer'
import { StaleWatcher, Toasts } from './components/Toasts'
import { Button } from './components/ui'
import { InventoryPage } from './features/inventory/InventoryPage'
import { ReconciliationPage } from './features/reconciliation/ReconciliationPage'
import { ActivityPage } from './features/activity/ActivityPage'
import { ImpactPage } from './features/impact/ImpactPage'
import { DecisionsPage } from './features/decision/DecisionsPage'
import { ConnectionsPage } from './features/connections/ConnectionsPage'
import { OnboardingPage } from './features/onboarding/OnboardingPage'
import { NotDoingPage } from './features/notdoing/NotDoingPage'
import { Assistant } from './features/assistant/Assistant'
import { Tour } from './features/tour/Tour'

const WELCOME_KEY = 'company-brain-welcomed'

function Welcome() {
  const [open, setOpen] = useState(() => !localStorage.getItem(WELCOME_KEY))
  const startTour = useStore((s) => s.startTour)
  if (!open) return null
  const close = (tour: boolean) => {
    localStorage.setItem(WELCOME_KEY, '1')
    setOpen(false)
    if (tour) startTour()
  }
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="welcome-title" className="fade-up w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <span className="flex size-10 items-center justify-center rounded-xl bg-accent-700 text-white"><Brain className="size-5" /></span>
        <h1 id="welcome-title" className="mt-4 text-xl font-semibold tracking-tight text-slate-900">Company Brain</h1>
        <p className="text-sm font-medium text-accent-700">{tagline}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{valueProp}</p>
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          <b>The scenario:</b> it's Thursday morning. Northwind Controls just cut order PO-48213 from 2,000 to 800 drive assemblies. You're Maya, the buyer/planner. Work out what's excess, which numbers to trust, and hand a decision to your manager, Daniel.
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button onClick={() => close(false)}>Explore on my own</Button>
          <Button variant="primary" onClick={() => close(true)} autoFocus>
            <Compass className="size-4" /> Take the 3-minute tour
          </Button>
        </div>
        <p className="mt-4 text-[11px] text-slate-400">Fictional data. A class prototype by Team The Invent-tories (CMU). Your progress is saved in this browser; use Reset demo to start over.</p>
      </div>
    </div>
  )
}

export default function App() {
  const route = useRoute()
  const page = {
    inventory: <InventoryPage />,
    reconciliation: <ReconciliationPage />,
    activity: <ActivityPage />,
    impact: <ImpactPage />,
    decisions: <DecisionsPage />,
    connections: <ConnectionsPage />,
    onboarding: <OnboardingPage />,
    'not-doing': <NotDoingPage />,
  }[route]
  return (
    <>
      <Layout>{page}</Layout>
      <ProvenanceDrawer />
      <Assistant />
      <Toasts />
      <StaleWatcher />
      <Tour />
      <Welcome />
    </>
  )
}
