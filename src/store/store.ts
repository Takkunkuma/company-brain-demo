import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  connections,
  messages as seedMessages,
  options,
  seedLog,
  simulatedMessage,
  simulatedSupplierDate,
  type LogEntry,
  type Message,
  type OptionId,
  type PersonId,
  type SourceKind,
} from '../data/scenario'
import { defaultDefinition, type Definition } from '../lib/calc'
import { clockToIso } from '../lib/format'
import type { Route } from '../lib/router'
import { plans as reconPlans, type DocId, type PlanId } from '../data/reconciliation'

export type ConflictId = 'usable-mcb220' | 'date-po9921' | 'qchold-mcb220'

export interface ConflictState {
  status: 'open' | 'resolved' | 'needs_check'
  choice?: 'a' | 'b'
  confirmedValue?: number
  by?: string
  at?: string
}

export interface PinnedInput {
  key: string
  label: string
  value: string
  source: SourceKind
  at: string
}

export interface DecisionSnapshot {
  excess: number
  exposure: number
  residual: number
  totalCost: number
  revenueAtRisk: number
  daysOfSupply: number
  usable: number
  demand: number
  lines: { id: OptionId; applied: number; cost: number }[]
  standalone: { id: OptionId; applied: number; cost: number }[]
}

export type DecisionStatus = 'none' | 'draft' | 'awaiting' | 'approved' | 'question'

export interface DecisionState {
  status: DecisionStatus
  generatedAt?: string
  sentAt?: string
  chosen: OptionId[]
  pinned: PinnedInput[]
  snapshot?: DecisionSnapshot
  thread: { who: PersonId; at: string; text: string }[]
}

export interface Toast {
  id: number
  title: string
  body?: string
  tone: 'info' | 'success' | 'warning'
  action?: { label: string; route: Route }
}

export interface ChatTurn {
  role: 'user' | 'bot'
  parts: (string | { cite: string })[]
}

interface DemoState {
  clock: number
  persona: 'maya' | 'daniel'
  definition: Definition
  demandAdjPct: number
  conflicts: Partial<Record<ConflictId, ConflictState>>
  captured: string[]
  extraMessages: Message[]
  supplierDateOverride?: { date: string; messageId: string }
  selected: OptionId[]
  impactRun: boolean
  decision: DecisionState
  log: LogEntry[]
  syncs: Record<string, string>
  onboardingStep: number
  sourcesMapped: Record<string, boolean>
  recon: ReconState
}

export interface ReconState {
  view: 'table' | 'graph'
  plan: PlanId
  doc: DocId | null
  decision: { kind: 'approved' | 'asked'; plan: PlanId; at: string } | null
}

interface UiState {
  drawerKey: string | null
  toasts: Toast[]
  assistantOpen: boolean
  chat: ChatTurn[]
  tour: { active: boolean; step: number }
  flash: Record<string, number> // fact keys that just changed -> timestamp
  analyzeRequested: boolean
}

interface Actions {
  now: () => string
  setPersona: (p: 'maya' | 'daniel') => void
  setDefinition: (d: Partial<Definition>) => void
  setDemandAdj: (n: number) => void
  resolveConflict: (id: ConflictId, choice: 'a' | 'b', confirmedValue?: number) => void
  markNeedsCheck: (id: ConflictId) => void
  capture: (messageId: string) => void
  toggleOption: (id: OptionId) => void
  setImpactRun: () => void
  generateDecision: (pinned: PinnedInput[], snapshot: DecisionSnapshot) => void
  sendDecision: () => void
  simulateInputChange: () => void
  approve: () => void
  askQuestion: (text: string) => void
  reply: (text: string) => void
  syncSource: (id: string) => void
  setOnboardingStep: (n: number) => void
  toggleMapped: (id: string) => void
  openDrawer: (key: string) => void
  closeDrawer: () => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  setAssistant: (open: boolean) => void
  pushChat: (t: ChatTurn) => void
  startTour: () => void
  restartFresh: () => void
  setTourStep: (n: number) => void
  endTour: () => void
  flashKeys: (keys: string[]) => void
  requestAnalyze: (v: boolean) => void
  setRecon: (r: Partial<Omit<ReconState, 'decision'>>) => void
  decideRecon: (kind: 'approved' | 'asked') => void
  undoRecon: () => void
  reset: () => void
}

export type Store = DemoState & UiState & Actions

const initialDemo = (): DemoState => ({
  clock: 0,
  persona: 'maya',
  definition: { ...defaultDefinition },
  demandAdjPct: 0,
  conflicts: {
    'usable-mcb220': { status: 'open' },
    'date-po9921': { status: 'open' },
  },
  captured: seedMessages.filter((m) => m.capturedAtStart).map((m) => m.id),
  extraMessages: [],
  supplierDateOverride: undefined,
  selected: [],
  impactRun: false,
  decision: { status: 'none', chosen: [], pinned: [], thread: [] },
  log: [...seedLog],
  syncs: Object.fromEntries(connections.map((c) => [c.id, c.lastSync])),
  onboardingStep: 0,
  sourcesMapped: Object.fromEntries(connections.map((c) => [c.id, c.id !== 'pdf'])),
  recon: { view: 'table', plan: 'A', doc: null, decision: null },
})

const initialUi = (): UiState => ({
  drawerKey: null,
  toasts: [],
  assistantOpen: false,
  chat: [],
  tour: { active: false, step: 0 },
  flash: {},
  analyzeRequested: false,
})

let toastId = 1
let logId = 100

export const STORE_VERSION = 4

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const tick = (min = 2) => {
        const clock = get().clock + min
        set({ clock })
        return clockToIso(clock)
      }
      const log = (e: Omit<LogEntry, 'id' | 'at'>, at: string) =>
        set((s) => ({ log: [...s.log, { ...e, id: `l${logId++}`, at }] }))

      return {
        ...initialDemo(),
        ...initialUi(),

        now: () => clockToIso(get().clock),

        setPersona: (persona) => set({ persona }),

        setDefinition: (d) => {
          const prev = get().definition
          const next = { ...prev, ...d }
          set({ definition: next })
          const toggled = (Object.keys(d) as (keyof Definition)[]).find((k) => k !== 'inboundDays' && prev[k] !== next[k])
          if (toggled) {
            const labels: Record<string, string> = {
              excludeQcHold: 'Exclude quality hold',
              excludeReserved: 'Exclude reserved',
              includeInbound: 'Include inbound',
            }
            const at = tick(1)
            log({ title: 'Metric definition changed', field: `"Usable stock": ${labels[toggled]}`, from: prev[toggled] ? 'on' : 'off', to: next[toggled] ? 'on' : 'off', source: 'Derived', who: 'Maya Ortiz' }, at)
          }
        },

        setDemandAdj: (demandAdjPct) => set({ demandAdjPct }),

        resolveConflict: (id, choice, confirmedValue) => {
          const at = tick()
          set((s) => ({ conflicts: { ...s.conflicts, [id]: { status: 'resolved', choice, confirmedValue, by: 'Maya Ortiz', at } } }))
          const fields: Record<ConflictId, string> = {
            'usable-mcb220': 'MCB-220 usable',
            'date-po9921': 'PO-9921 arrival',
            'qchold-mcb220': 'MCB-220 quality hold',
          }
          log({ title: 'Conflict resolved', field: fields[id], to: confirmedValue !== undefined ? `Confirmed ${confirmedValue.toLocaleString()}` : choice === 'a' ? 'Confirmed ERP value' : 'Confirmed newer source', source: 'Derived', who: 'Maya Ortiz' }, at)
          get().flashKeys(id === 'date-po9921' ? ['MCB-220.arrival'] : ['MCB-220.usable', 'MCB-220.qcHold', 'MCB-220.excess'])
        },

        markNeedsCheck: (id) => {
          const at = tick()
          set((s) => ({ conflicts: { ...s.conflicts, [id]: { status: 'needs_check', by: 'Maya Ortiz', at } } }))
          get().toast({ title: 'Marked as needs check', body: 'Added to pending decisions. The number stays flagged until someone confirms it.', tone: 'info' })
        },

        capture: (messageId) => {
          if (get().captured.includes(messageId)) return
          const at = tick()
          const msg = [...seedMessages, ...get().extraMessages].find((m) => m.id === messageId)
          set((s) => ({ captured: [...s.captured, messageId] }))
          if (msg?.createsConflict === 'qchold-mcb220') {
            set((s) => ({ conflicts: { ...s.conflicts, 'qchold-mcb220': { status: 'open' } } }))
            get().toast({ title: 'New conflict flagged', body: 'Chat says QC hold is 220; ERP says 180. Review it on Inventory.', tone: 'warning', action: { label: 'Review', route: 'inventory' } })
          } else {
            get().toast({ title: 'Added to shared view', body: msg?.extracted?.text, tone: 'success' })
          }
          if (msg?.extracted) {
            log({ title: 'Message captured', field: msg.extracted.tag, to: msg.extracted.text, source: msg.channel === 'chat' ? 'Chat' : 'Email', who: 'Maya Ortiz' }, at)
            get().flashKeys([msg.extracted.factKey])
          }
        },

        toggleOption: (id) =>
          set((s) => ({ selected: s.selected.includes(id) ? s.selected.filter((x) => x !== id) : [...s.selected, id] })),

        setImpactRun: () => {
          const at = tick(1)
          set({ impactRun: true })
          log({ title: 'Impact analysis run', field: 'PO-48213 order change', to: '4 materials, 2 POs checked', source: 'Analysis', who: 'Maya Ortiz' }, at)
        },

        generateDecision: (pinned, snapshot) => {
          const at = tick(3)
          set((s) => ({ decision: { ...s.decision, status: 'draft', generatedAt: at, chosen: [...s.selected], pinned, snapshot } }))
        },

        sendDecision: () => {
          const at = tick()
          set((s) => ({ decision: { ...s.decision, status: 'awaiting', sentAt: at } }))
          log({ title: 'Decision package sent', field: 'MCB-220 excess plan', to: 'Awaiting approval (Daniel Reyes)', source: 'Derived', who: 'Maya Ortiz' }, at)
          get().toast({ title: 'Sent to Daniel Reyes', body: 'State: Awaiting approval. Switch persona to Daniel to see his view.', tone: 'success' })
        },

        simulateInputChange: () => {
          const at = tick(5)
          const msg: Message = { ...simulatedMessage, at }
          set((s) => ({
            extraMessages: [...s.extraMessages.filter((m) => m.id !== msg.id), msg],
            captured: s.captured.includes(msg.id) ? s.captured : [...s.captured, msg.id],
            supplierDateOverride: { ...simulatedSupplierDate },
            conflicts: { ...s.conflicts, 'date-po9921': { status: 'open' } },
          }))
          log({ title: 'Supplier email captured', field: 'PO-9921 arrival', from: 'Dec 9', to: 'Dec 14', source: 'Email', who: 'Priya Nair' }, at)
          get().flashKeys(['PO-9921.supplierDate', 'MCB-220.arrival'])
        },

        approve: () => {
          const at = tick()
          set((s) => ({ decision: { ...s.decision, status: 'approved', thread: [...s.decision.thread, { who: 'daniel', at, text: 'Approved.' }] } }))
          log({ title: 'Decision approved', field: 'MCB-220 excess plan', to: 'Approved', source: 'Derived', who: 'Daniel Reyes' }, at)
          get().toast({ title: 'Decision approved', body: 'The pinned inputs are kept with the approval.', tone: 'success' })
        },

        askQuestion: (text) => {
          const at = tick()
          set((s) => ({ decision: { ...s.decision, status: 'question', thread: [...s.decision.thread, { who: 'daniel', at, text }] } }))
          log({ title: 'Question on decision', field: 'MCB-220 excess plan', to: text, source: 'Derived', who: 'Daniel Reyes' }, at)
          get().toast({ title: 'Question sent to Maya', tone: 'info' })
        },

        reply: (text) => {
          const at = tick()
          set((s) => ({ decision: { ...s.decision, status: 'awaiting', sentAt: at, thread: [...s.decision.thread, { who: 'maya', at, text }] } }))
          get().toast({ title: 'Reply sent; back to Awaiting approval', tone: 'success' })
        },

        syncSource: (id) => {
          const at = tick(1)
          set((s) => ({ syncs: { ...s.syncs, [id]: at } }))
          get().toast({ title: 'Sync complete (read-only)', body: 'Nothing was written back to the source.', tone: 'success' })
        },

        setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
        toggleMapped: (id) => set((s) => ({ sourcesMapped: { ...s.sourcesMapped, [id]: !s.sourcesMapped[id] } })),

        openDrawer: (drawerKey) => set({ drawerKey }),
        closeDrawer: () => set({ drawerKey: null }),

        toast: (t) => {
          const id = toastId++
          set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }))
          setTimeout(() => get().dismissToast(id), t.action ? 9000 : 5000)
        },
        dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

        setAssistant: (assistantOpen) => set({ assistantOpen }),
        pushChat: (t) => set((s) => ({ chat: [...s.chat, t] })),

        startTour: () => set({ tour: { active: true, step: 0 }, drawerKey: null, assistantOpen: false }),
        restartFresh: () => {
          set({ ...initialDemo(), ...initialUi(), tour: { active: true, step: 0 } })
          get().toast({ title: 'Starting over', body: 'The demo is back to Thursday 9:00 AM and the tour is starting from step 1.', tone: 'info' })
        },
        setTourStep: (step) => set({ tour: { active: true, step } }),
        endTour: () => set({ tour: { active: false, step: 0 } }),

        flashKeys: (keys) => {
          const t = Date.now()
          set((s) => ({ flash: { ...s.flash, ...Object.fromEntries(keys.map((k) => [k, t])) } }))
        },

        requestAnalyze: (analyzeRequested) => set({ analyzeRequested }),

        setRecon: (r) => set((s) => ({ recon: { ...s.recon, ...r } })),

        decideRecon: (kind) => {
          const at = tick()
          const plan = get().recon.plan
          const p = reconPlans[plan]
          set((s) => ({ recon: { ...s.recon, doc: null, decision: { kind, plan, at } } }))
          log(
            kind === 'approved'
              ? { title: 'Reconciliation plan approved', field: `Plan ${plan}: ${p.title}`, to: 'Approved, file versions pinned', source: 'Derived', who: 'Daniel Reyes' }
              : { title: 'Plan sent back', field: `Plan ${plan} to ${p.authorFull}`, to: p.question, source: 'Derived', who: 'Daniel Reyes' },
            at,
          )
          get().toast(
            kind === 'approved'
              ? { title: `Plan ${plan} approved`, body: 'Company Brain saved the exact version of every file it used.', tone: 'success' }
              : { title: `Sent back to ${p.author}`, body: p.question, tone: 'info' },
          )
        },

        undoRecon: () => set((s) => ({ recon: { ...s.recon, decision: null } })),

        reset: () => {
          set({ ...initialDemo(), ...initialUi() })
          get().toast({ title: 'Demo reset', body: 'Everything is back to Thursday 9:00 AM.', tone: 'info' })
        },
      }
    },
    {
      name: 'company-brain-demo',
      version: STORE_VERSION,
      // Any schema change: bump STORE_VERSION and old saved state is discarded.
      migrate: () => initialDemo() as unknown as Store,
      partialize: (s) => {
        const { drawerKey: _d, toasts: _t, assistantOpen: _a, chat: _c, tour: _tour, flash: _f, analyzeRequested: _ar, ...rest } = s
        const demo: Partial<Store> = {}
        for (const [k, v] of Object.entries(rest)) if (typeof v !== 'function') (demo as Record<string, unknown>)[k] = v
        return demo
      },
    },
  ),
)

export const optionById = (id: OptionId) => options.find((o) => o.id === id)!
