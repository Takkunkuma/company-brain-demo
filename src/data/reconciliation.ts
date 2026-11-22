// Reconciliation scenario: three competing plans for the extra MCB-220 boards,
// each built from different versions of the same files. All fictional.

export type Tool = 'Excel' | 'SAP' | 'Email' | 'Chat' | 'PDF'
export type DocStatus = 'latest' | 'old' | 'unchecked'
export type DocId = 'contract' | 'v1' | 'v2' | 'erp' | 'sup' | 'c220' | 'cust' | 'cda' | 'ret' | 'lc'
export type PlanId = 'A' | 'B' | 'C'

export interface ReconDoc {
  id: DocId
  label: string // short label on the graph node
  tool: Tool
  title: string
  fact: string
  meta: string // who · when
  when: string // short time for the table
  status: DocStatus
  note?: string
  lane: number // graph lane
  col: number // graph time column
}

export const lanes = ['Planner sheet (Excel)', 'Luis’s copy (Excel)', 'SAP', 'Email', 'Group chat', 'Contract (PDF)', 'Plans'] as const
export const ticks = ['Earlier', 'Tue', 'Wed', 'Thu 6:00', '7:15', '7:54', '8:30', '8:40', '8:46', '8:50', '9:00', '9:05', '9:10'] as const
export const PLAN_LANE = 6

export const docs: Record<DocId, ReconDoc> = {
  contract: { id: 'contract', lane: 5, col: 0, label: 'Cancel terms', tool: 'PDF', title: 'Supplier contract', fact: '8% fee to cancel incoming boards', meta: 'Signed 2025', when: '2025', status: 'latest' },
  v1: { id: 'v1', lane: 0, col: 1, label: 'Sheet v1', tool: 'Excel', title: 'Planner sheet, version 1', fact: '950 usable boards', meta: 'Wei Chen · Tue 2:10 PM', when: 'Tue', status: 'old', note: 'Saved before 180 boards went on quality hold.' },
  v2: { id: 'v2', lane: 0, col: 2, label: 'Sheet v2', tool: 'Excel', title: 'Planner sheet, version 2', fact: '900 usable boards', meta: 'Wei Chen · Wed 4:40 PM', when: 'Wed 4:40 PM', status: 'latest', note: 'Subtracts boards on quality hold and boards promised to another order.' },
  erp: { id: 'erp', lane: 2, col: 3, label: 'Stock count', tool: 'SAP', title: 'SAP stock count', fact: '1,200 on shelf · 180 on quality hold', meta: 'Automatic · Thu 6:00 AM', when: 'Thu 6:00 AM', status: 'latest' },
  sup: { id: 'sup', lane: 3, col: 4, label: 'Arrives Dec 9', tool: 'Email', title: 'Supplier: new delivery date', fact: '600 more boards arrive Dec 9', meta: 'Priya (supplier) · Thu 7:15 AM', when: 'Thu 7:15 AM', status: 'latest' },
  c220: { id: 'c220', lane: 4, col: 5, label: 'Luis: 220?', tool: 'Chat', title: 'Luis: “220 are on hold, not 180”', fact: '220 on quality hold', meta: 'Group chat · Thu 7:54 AM', when: 'Thu 7:54 AM', status: 'unchecked', note: 'Nobody has checked this with the quality team yet.' },
  cust: { id: 'cust', lane: 3, col: 6, label: 'Cut to 800', tool: 'Email', title: 'Customer: order cut', fact: 'Northwind now needs 800, not 2,000', meta: 'Northwind · Thu 8:30 AM', when: 'Thu 8:30 AM', status: 'latest' },
  cda: { id: 'cda', lane: 4, col: 7, label: 'Other line?', tool: 'Chat', title: 'Luis: “line DA-310 could use 250”', fact: 'Another product could use 250', meta: 'Group chat · Thu 8:40 AM', when: 'Thu 8:40 AM', status: 'unchecked', note: 'No production schedule backs this up yet.' },
  ret: { id: 'ret', lane: 3, col: 8, label: 'Return 100', tool: 'Email', title: 'Supplier: return offer', fact: 'Will take back 100 boards, 15% fee', meta: 'Priya (supplier) · Thu 8:46 AM', when: 'Thu 8:46 AM', status: 'latest' },
  lc: { id: 'lc', lane: 1, col: 9, label: 'Luis copy', tool: 'Excel', title: 'Luis’s copy of the planner sheet', fact: '1,020 usable boards', meta: 'Luis Romero · Thu 8:50 AM', when: 'Thu 8:50 AM', status: 'old', note: 'Copied from Sheet v1, so it still counts the 180 boards on quality hold as usable.' },
}

/** How file versions relate: a newer version of the same file, or a copy someone made. */
export const versionLinks: { from: DocId; to: DocId; kind: 'newer' | 'copy' }[] = [
  { from: 'v1', to: 'v2', kind: 'newer' },
  { from: 'v1', to: 'lc', kind: 'copy' },
]

export type Tone = 'good' | 'bad' | 'warn'

export interface ReconPlan {
  id: PlanId
  author: 'Maya' | 'Luis' | 'Wei'
  authorFull: string
  title: string
  cost: number
  after: string
  afterTone: Tone
  verdict: string
  tone: Tone
  uses: DocId[]
  col: number
  summary: string
  question: string
}

export const plans: Record<PlanId, ReconPlan> = {
  A: {
    id: 'A', author: 'Maya', authorFull: 'Maya Ortiz', title: 'Cancel 600 incoming boards and send 100 back', cost: 2646,
    after: '0 extra', afterTone: 'good', verdict: 'Built on the latest versions', tone: 'good',
    uses: ['v2', 'erp', 'sup', 'cust', 'contract', 'ret'], col: 10,
    summary: 'Clears all 700 extra boards. Uses the newest planner sheet and the SAP count. Costs $2,646 in cancel and return fees.',
    question: 'Can you double-check the return fee with Priya before we commit?',
  },
  B: {
    id: 'B', author: 'Luis', authorFull: 'Luis Romero', title: 'Give 250 to another line, cancel 570 incoming', cost: 1915,
    after: '120 short', afterTone: 'bad', verdict: 'Built on an older copy of the sheet', tone: 'bad',
    uses: ['lc', 'cust', 'contract', 'cda'], col: 11,
    summary: 'Cheapest, but it was sized from Luis’s copy of Sheet v1 (1,020 usable instead of 900). With the real numbers it cancels too much and leaves the line 120 boards short.',
    question: 'Your copy of the sheet is from Tuesday. Can you redo this with Sheet v2?',
  },
  C: {
    id: 'C', author: 'Wei', authorFull: 'Wei Chen', title: 'Check the quality hold first, then cancel 600 and send 60 back', cost: 2394,
    after: '0 extra, if 220 is right', afterTone: 'warn', verdict: 'Depends on one unchecked chat message', tone: 'warn',
    uses: ['v2', 'erp', 'sup', 'cust', 'c220', 'contract', 'ret'], col: 12,
    summary: 'Right only if Luis’s “220 on hold” is true. Everything else uses the latest versions.',
    question: 'Can quality confirm the 220 before we act on it?',
  },
}

export const planIds: PlanId[] = ['A', 'B', 'C']

/** Rows of the comparison table. A cell either points at the file it came from, or explains itself. */
export type Cell = { value: string; doc?: DocId; note?: string; status?: DocStatus }
export const factRows: { label: string; summary?: boolean; cells: Record<PlanId, Cell> }[] = [
  { label: 'Boards on the shelf', cells: { A: { value: '1,200', doc: 'erp' }, B: { value: '1,200', doc: 'lc' }, C: { value: '1,200', doc: 'erp' } } },
  { label: 'Waiting on quality check', cells: { A: { value: '180', doc: 'erp' }, B: { value: 'Not counted', doc: 'lc' }, C: { value: '220', doc: 'c220' } } },
  { label: 'Promised to another order', cells: { A: { value: '120', doc: 'erp' }, B: { value: '120', doc: 'lc' }, C: { value: '120', doc: 'erp' } } },
  { label: 'Usable boards', cells: { A: { value: '900', doc: 'v2' }, B: { value: '1,020', doc: 'lc' }, C: { value: '860', doc: 'c220' } } },
  { label: 'Arriving on the incoming order', cells: { A: { value: '600, Dec 9', doc: 'sup' }, B: { value: '600', doc: 'lc' }, C: { value: '600, Dec 9', doc: 'sup' } } },
  { label: 'Customer still needs', cells: { A: { value: '800', doc: 'cust' }, B: { value: '800', doc: 'cust' }, C: { value: '800', doc: 'cust' } } },
  { label: 'Extra boards', summary: true, cells: { A: { value: '700', note: 'Worked out from the rows above' }, B: { value: '820', note: 'Too high: based on the old copy', status: 'old' }, C: { value: '660', note: 'Worked out from the rows above', status: 'unchecked' } } },
  { label: 'What the plan does', summary: true, cells: { A: { value: 'Cancel 600, send back 100', doc: 'contract' }, B: { value: 'Give 250 to line DA-310, cancel 570', doc: 'cda' }, C: { value: 'Cancel 600, send back 60', doc: 'contract' } } },
  { label: 'Cost', summary: true, cells: { A: { value: '$2,646', doc: 'contract' }, B: { value: '$1,915', doc: 'contract' }, C: { value: '$2,394', doc: 'contract' } } },
  { label: 'After the plan, using the latest numbers', summary: true, cells: { A: { value: '0 extra', note: 'All 700 cleared' }, B: { value: '120 short', note: 'Cancels more than is extra', status: 'old' }, C: { value: '0 extra', note: 'Only if 220 is confirmed', status: 'unchecked' } } },
]
