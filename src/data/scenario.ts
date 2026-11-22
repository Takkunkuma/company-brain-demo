// All fake demo data lives here. Edit numbers in this file only;
// every screen derives its values from it via src/lib/calc.ts.

export type SourceKind = 'ERP' | 'Excel' | 'Email' | 'Chat' | 'PDF' | 'Derived' | 'Analysis'

export type SourceDetail =
  | { type: 'erp'; system: string; transaction: string; fields: [string, string][] }
  | { type: 'excel'; file: string; sheet: string; cell: string; grid: string[][]; highlight: [number, number] }
  | { type: 'message'; messageId: string }
  | { type: 'derived'; formula: string; inputs: string[] }
  | { type: 'doc'; title: string; page: string; excerpt: string }

export interface SourceRef {
  kind: SourceKind
  label: string
  at: string // ISO timestamp
  by?: string
  detail: SourceDetail
}

export interface Confirmation {
  by: string
  at: string
}

export type PersonId = 'maya' | 'wei' | 'daniel' | 'priya' | 'luis' | 'quality' | 'northwind'

export const people: Record<PersonId, { name: string; role: string; initials: string; color: string }> = {
  maya: { name: 'Maya Ortiz', role: 'Buyer / Planner', initials: 'MO', color: 'bg-indigo-500' },
  wei: { name: 'Wei Chen', role: 'Planner (owns the Excel)', initials: 'WC', color: 'bg-sky-500' },
  daniel: { name: 'Daniel Reyes', role: 'Production & Inventory Control Manager', initials: 'DR', color: 'bg-violet-500' },
  priya: { name: 'Priya Nair', role: 'Supplier rep, Kestrel Electronics', initials: 'PN', color: 'bg-rose-500' },
  luis: { name: 'Luis Romero', role: 'Production lead, DA line', initials: 'LR', color: 'bg-amber-500' },
  quality: { name: 'Halden Quality', role: 'QC team', initials: 'QC', color: 'bg-emerald-600' },
  northwind: { name: 'Northwind Controls', role: 'Customer', initials: 'NW', color: 'bg-slate-500' },
}

export const company = 'Halden Industrial'
export const customer = 'Northwind Controls'

/** The demo's "now": Thursday Nov 19, 2026, 9:00 AM. Each action advances the clock a few minutes. */
export const DEMO_START = '2026-11-19T09:00:00'

export const ERP_SYNC = '2026-11-19T06:00:00'
export const EXCEL_EDIT = '2026-11-18T16:40:00'

export const order = {
  id: 'PO-48213',
  customer,
  product: 'DA-300',
  productName: 'DA-300 drive assembly',
  oldQty: 2000,
  newQty: 800,
  pricePerUnit: 310,
  changedAt: '2026-11-19T08:30:00',
}

export const workingDaysPerMonth = 20
export const holdMonths = 3

export interface InboundPO {
  po: string
  qty: number
  erpDate: string // ISO date
  cancelBy?: string // last day the PO can still be reduced
  cancelFeePct?: number
  windowNote?: string
}

export interface Material {
  id: string
  name: string
  unitCost: number
  perProduct: number // units consumed per DA-300
  onHand: number
  qcHold: number
  reserved: number
  reservedFor?: string
  excelUsable: number
  excelCell: string
  inbound?: InboundPO
}

export const materials: Material[] = [
  {
    id: 'MCB-220',
    name: 'Motor controller board',
    unitCost: 42,
    perProduct: 1,
    onHand: 1200,
    qcHold: 180,
    reserved: 120,
    reservedFor: 'WO-7731 (DA-310 service order)',
    excelUsable: 900,
    excelCell: 'E4',
    inbound: { po: 'PO-9921', qty: 600, erpDate: '2026-12-02', cancelBy: '2026-11-28', cancelFeePct: 0.08 },
  },
  {
    id: 'AH-114',
    name: 'Aluminum housing',
    unitCost: 18,
    perProduct: 1,
    onHand: 950,
    qcHold: 0,
    reserved: 100,
    reservedFor: 'WO-7731 (DA-310 service order)',
    excelUsable: 850,
    excelCell: 'E5',
  },
  {
    id: 'WH-07',
    name: 'Wiring harness',
    unitCost: 6.5,
    perProduct: 2,
    onHand: 1400,
    qcHold: 40,
    reserved: 0,
    excelUsable: 1360,
    excelCell: 'E6',
    inbound: { po: 'PO-9940', qty: 240, erpDate: '2026-11-30', cancelBy: '2026-11-24', cancelFeePct: 0.05 },
  },
  {
    id: 'PM-55',
    name: 'Power module',
    unitCost: 64,
    perProduct: 1,
    onHand: 700,
    qcHold: 0,
    reserved: 50,
    reservedFor: 'WO-7735 (spares)',
    excelUsable: 650,
    excelCell: 'E7',
    inbound: { po: 'PO-9935', qty: 400, erpDate: '2026-12-04', windowNote: 'Cancellation window closed Nov 16 (non-cancellable)' },
  },
]

export const PRIMARY = 'MCB-220'

/** Supplier-reported arrival for PO-9921 (from email). Can be changed by "Simulate: an input changes". */
export const supplierDate = { po: 'PO-9921', date: '2026-12-09', messageId: 'e1' }
export const simulatedSupplierDate = { date: '2026-12-14', messageId: 'e4' }

export const wip = [
  { id: 'WO-7740', product: 'DA-300', qty: 300, status: 'In progress', impact: 'Keep — within new 800-unit order' },
  { id: 'WO-7752', product: 'DA-300', qty: 600, status: 'Scheduled Dec 7', impact: 'No longer needed — release or cancel' },
  { id: 'WO-7731', product: 'DA-310', qty: 120, status: 'Released', impact: 'Unaffected (holds 120 MCB-220 reserved)' },
]

// ---------- Options for the MCB-220 excess ----------
export type OptionId = 'reduce' | 'reallocate' | 'return' | 'hold'

export interface OptionDef {
  id: OptionId
  title: string
  short: string
  capacity: number // max units this option can absorb (Infinity for hold)
  costRate: number // fraction of unit cost per unit absorbed (hold: per month)
  risk: 'Low' | 'Medium' | 'High'
  riskNote: string
  timing: string
  sourceMessageId?: string // chat message that backs this option
}

export const options: OptionDef[] = [
  {
    id: 'reduce',
    title: 'Reduce PO-9921',
    short: 'Cut inbound PO by up to 600',
    capacity: 600,
    costRate: 0.08,
    risk: 'Low',
    riskNote: 'Contractual 8% fee; supplier already notified of slip',
    timing: 'Must act before Nov 28',
  },
  {
    id: 'reallocate',
    title: 'Reallocate to DA-310',
    short: 'Move up to 250 to line DA-310',
    capacity: 250,
    costRate: 0,
    risk: 'Medium',
    riskNote: 'Depends on DA-310 demand holding up',
    timing: 'Consumed over ~6 weeks',
    sourceMessageId: 'm5',
  },
  {
    id: 'return',
    title: 'Return to supplier',
    short: 'Return up to 100 unopened',
    capacity: 100,
    costRate: 0.15,
    risk: 'Low',
    riskNote: '15% restocking fee; unopened reels only',
    timing: '~2 weeks',
    sourceMessageId: 'm6',
  },
  {
    id: 'hold',
    title: 'Hold / sell down',
    short: 'Keep the remainder in stock',
    capacity: Infinity,
    costRate: 0.02,
    risk: 'Medium',
    riskNote: 'Obsolescence risk if DA-300 is revised',
    timing: `Carrying cost over ${holdMonths} months`,
  },
]

// ---------- Captured messages ----------
export interface Message {
  id: string
  channel: 'chat' | 'email'
  from: PersonId
  at: string
  subject?: string
  body: string
  extracted?: { text: string; factKey: string; tag: string }
  createsConflict?: string
  capturedAtStart?: boolean
}

export const chatGroupName = 'DA-300 supply 🔧'

export const messages: Message[] = [
  {
    id: 'e3',
    channel: 'email',
    from: 'quality',
    at: '2026-11-19T06:20:00',
    subject: 'Hold notice: lot 2291 (MCB-220)',
    body: 'Lot 2291 MCB-220 placed on quality hold pending ICT retest. Qty 180. Do not issue to production until released.',
    extracted: { text: 'QC hold MCB-220: 180 units (lot 2291)', factKey: 'MCB-220.qcHold', tag: 'QC hold' },
    capturedAtStart: true,
  },
  {
    id: 'e1',
    channel: 'email',
    from: 'priya',
    at: '2026-11-19T07:15:00',
    subject: 'RE: PO-9921 revised ship date',
    body: "Hi Maya,\n\nApologies — due to a component allocation issue on our side, PO-9921 (600 pcs MCB-220) will now arrive Dec 9 instead of Dec 2.\n\nWe'll confirm tracking once it ships.\n\nBest,\nPriya\nKestrel Electronics",
    extracted: { text: 'Supplier date moved to Dec 9', factKey: 'PO-9921.supplierDate', tag: 'Supplier date' },
    createsConflict: 'date-po9921',
    capturedAtStart: true,
  },
  {
    id: 'm1',
    channel: 'chat',
    from: 'luis',
    at: '2026-11-19T07:52:00',
    body: 'morning. QC flagged boards from lot 2291, they are on hold',
  },
  {
    id: 'm2',
    channel: 'chat',
    from: 'luis',
    at: '2026-11-19T07:54:00',
    body: "actually its 220 on hold not 180 — the extra 40 were sitting on the retest cart, not in the system yet",
    extracted: { text: 'QC hold MCB-220: 220 units', factKey: 'MCB-220.qcHold', tag: 'QC hold' },
    createsConflict: 'qchold-mcb220',
  },
  {
    id: 'm3',
    channel: 'chat',
    from: 'priya',
    at: '2026-11-19T08:05:00',
    body: 'hi Maya, confirming PO-9921 ships for Dec 9 arrival, not Dec 2. sorry!! 🙏',
    extracted: { text: 'Supplier date: Dec 9 (confirmed in chat)', factKey: 'PO-9921.supplierDate', tag: 'Supplier date' },
  },
  {
    id: 'm4',
    channel: 'chat',
    from: 'wei',
    at: '2026-11-19T08:12:00',
    body: 'fyi my sheet has 900 usable for MCB-220, already netted out the hold + WO-7731',
    extracted: { text: 'Excel usable 900 = on hand − hold − reserved', factKey: 'MCB-220.excelUsable', tag: 'Definition' },
  },
  {
    id: 'e2',
    channel: 'email',
    from: 'northwind',
    at: '2026-11-19T08:30:00',
    subject: 'Revised quantity — PO-48213',
    body: 'Please revise PO-48213 (DA-300 drive assemblies) from 2,000 to 800 units due to a program delay on our side. Delivery schedule for the remaining 800 is unchanged.\n\n— Purchasing, Northwind Controls',
    extracted: { text: 'PO-48213 cut 2,000 → 800 units', factKey: 'order.qty', tag: 'Order change' },
    capturedAtStart: true,
  },
  {
    id: 'm5',
    channel: 'chat',
    from: 'luis',
    at: '2026-11-19T08:40:00',
    body: 'if we end up long on boards, DA-310 could take ~250 over the next 6 wks',
    extracted: { text: 'DA-310 can absorb ~250 MCB-220 over 6 weeks', factKey: 'opt.reallocate', tag: 'Option' },
  },
  {
    id: 'm6',
    channel: 'chat',
    from: 'priya',
    at: '2026-11-19T08:46:00',
    body: 'we can take back up to 100 unopened, 15% restock fee. need RMA by next fri',
    extracted: { text: 'Return up to 100 at 15% restocking', factKey: 'opt.return', tag: 'Option' },
  },
]

/** Added to the feed by "Simulate: an input changes" (F7). */
export const simulatedMessage: Message = {
  id: 'e4',
  channel: 'email',
  from: 'priya',
  at: '', // filled at simulation time
  subject: 'PO-9921 — further delay',
  body: 'Hi Maya,\n\nUnfortunately our component supplier slipped again. PO-9921 is now expected Dec 14. Very sorry for the back-and-forth.\n\nPriya',
  extracted: { text: 'Supplier date moved to Dec 14', factKey: 'PO-9921.supplierDate', tag: 'Supplier date' },
  createsConflict: 'date-po9921',
  capturedAtStart: true,
}

// ---------- Change log seed ("since you last looked") ----------
export interface LogEntry {
  id: string
  at: string
  title: string
  field: string
  from?: string
  to: string
  source: SourceKind
  who: string
}

export const seedLog: LogEntry[] = [
  { id: 'l1', at: EXCEL_EDIT, title: 'Planner sheet edited', field: 'MCB-220 usable (Excel E4)', from: '950', to: '900', source: 'Excel', who: 'Wei Chen' },
  { id: 'l2', at: ERP_SYNC, title: 'ERP nightly sync', field: 'MCB-220 quality hold', from: '0', to: '180', source: 'ERP', who: 'ERP sync' },
  { id: 'l3', at: '2026-11-19T07:15:00', title: 'Supplier email captured', field: 'PO-9921 arrival', from: 'Dec 2', to: 'Dec 9', source: 'Email', who: 'Priya Nair' },
  { id: 'l4', at: order.changedAt, title: 'Customer order cut', field: 'PO-48213 quantity', from: '2,000', to: '800', source: 'Email', who: 'Northwind Controls' },
]

export const pendingDecisions = [
  { id: 'd-mcb', title: 'MCB-220 excess plan (700 units)', owner: 'Maya Ortiz', due: '2026-11-27', linked: true },
  { id: 'd-date', title: 'Confirm PO-9921 arrival with supplier', owner: 'Maya Ortiz', due: '2026-11-20' },
  { id: 'd-pm55', title: 'PM-55: hold or sell down excess', owner: 'Maya Ortiz', due: '2026-12-04' },
  { id: 'd-wo', title: 'Release WO-7752 capacity', owner: 'Luis Romero', due: '2026-11-25' },
]

// ---------- Connections (F2) ----------
export const connections = [
  { id: 'erp', name: 'ERP (SAP S/4HANA, mock)', kind: 'ERP' as SourceKind, detail: 'Stock, POs, work orders', lastSync: ERP_SYNC, items: 4812 },
  { id: 'excel', name: 'Planner_Inventory_v7.xlsx', kind: 'Excel' as SourceKind, detail: 'SharePoint · Planning/2026', lastSync: EXCEL_EDIT, items: 214 },
  { id: 'email', name: 'Shared inbox: purchasing@', kind: 'Email' as SourceKind, detail: 'Supplier & customer email', lastSync: '2026-11-19T08:31:00', items: 1290 },
  { id: 'chat', name: `Group chat: ${chatGroupName}`, kind: 'Chat' as SourceKind, detail: 'WeChat-style group, 6 members', lastSync: '2026-11-19T08:47:00', items: 386 },
  { id: 'pdf', name: 'Supplier contracts (PDF)', kind: 'PDF' as SourceKind, detail: 'Kestrel MSA, cancellation terms', lastSync: '2026-11-12T10:00:00', items: 12 },
]

export const valueProp =
  'For manufacturing supply chain and inventory teams that spend hours reconciling inconsistent information across systems, Company Brain turns unexpected order changes into informed inventory decisions. Unlike ERPs and shared spreadsheets that show records but not which version is current, it keeps one source-backed view across ERP, spreadsheets, and chat, showing who confirmed each number and when, and flagging conflicting numbers. Teams stop rechecking the same facts and clear leftover stock with confidence.'

export const tagline = 'One source-backed view. Confident inventory decisions.'
