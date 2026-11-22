// Deterministic intent matcher. No LLM. Every number in an answer is a citation chip.
import type { Derived } from '../../store/derive'
import type { LogEntry } from '../../data/scenario'
import { when } from '../../lib/format'

export type Part = string | { cite: string }

export const suggestions = [
  'Why do the ERP and Excel numbers differ?',
  'What changed since yesterday?',
  'How much of MCB-220 is excess?',
  'Who confirmed the supplier date?',
  'What does reducing PO-9921 cost?',
]

const has = (t: string, ...words: string[]) => words.some((w) => t.includes(w))

export function answer(input: string, d: Derived, log: LogEntry[]): Part[] {
  const t = input.toLowerCase()
  const p = d.primary

  if (has(t, 'differ', 'different', 'mismatch', 'disagree', 'why') && has(t, 'erp', 'excel', 'sheet', 'number', '900', '1200', '1,200')) {
    return [
      'ERP shows everything physically on the shelf: ',
      { cite: 'MCB-220.onHand' },
      '. The planner sheet shows usable stock: ',
      { cite: 'MCB-220.excelUsable' },
      '. The gap is the quality hold ',
      { cite: 'MCB-220.qcHold' },
      ' plus units reserved for WO-7731 ',
      { cite: 'MCB-220.reserved' },
      `. Under the agreed definition, usable = `,
      { cite: 'MCB-220.usable' },
      '. So it is a definition difference, not an error.',
    ]
  }

  if (has(t, 'changed', 'change', 'new', 'since', 'yesterday', 'update')) {
    const recent = [...log].slice(-5).reverse()
    const parts: Part[] = ['Here is what changed, newest first:\n']
    for (const e of recent) parts.push(`• ${when(e.at)}: ${e.title}, ${e.field}${e.from ? ` ${e.from} →` : ''} ${e.to} (${e.source}, ${e.who})\n`)
    parts.push('The biggest one is the order cut ', { cite: 'order.qty' }, ', which creates the excess.')
    return parts
  }

  if (has(t, 'excess', 'leftover', 'too much', 'extra', 'exposure')) {
    if (p.excess === 0) return ['Under the current inputs MCB-220 has no excess ', { cite: 'MCB-220.excess' }, '.']
    return [
      'MCB-220 excess is ',
      { cite: 'MCB-220.excess' },
      ': usable ',
      { cite: 'MCB-220.usable' },
      ' plus inbound PO-9921 ',
      { cite: 'MCB-220.inbound' },
      ' against remaining demand ',
      { cite: 'MCB-220.demand' },
      '. Financial exposure is ',
      { cite: 'MCB-220.exposure' },
      '.',
    ]
  }

  if (has(t, 'who', 'confirm') && has(t, 'supplier', 'date', 'po-9921', '9921', 'arrival')) {
    const dc = d.conflicts.find((c) => c.id === 'date-po9921')!
    const parts: Part[] = ['The supplier date came from Priya Nair (Kestrel Electronics) by email ', { cite: 'PO-9921.supplierDate' }, '. ']
    if (dc.status === 'resolved') parts.push(`${dc.resolvedBy} confirmed which date is current at ${when(dc.resolvedAt!)}: `, { cite: 'MCB-220.arrival' }, '.')
    else parts.push('Nobody has confirmed it yet: ERP still says ', { cite: 'PO-9921.erpDate' }, '. Resolve the conflict on Inventory.')
    return parts
  }

  if (has(t, 'reduce', 'cancel', 'po cut', 'cost', 'fee', 'option')) {
    return [
      'Reducing PO-9921 against the current excess costs ',
      { cite: 'optcost.reduce' },
      ', based on the cancellation terms ',
      { cite: 'opt.reduce' },
      ' and standard cost ',
      { cite: 'MCB-220.unitCost' },
      '. Returning to the supplier would cost ',
      { cite: 'optcost.return' },
      '. I can lay out the trade-offs, but the choice is yours.',
    ]
  }

  if (has(t, 'usable', 'hold', 'qc', 'quality')) {
    return ['Usable MCB-220 is ', { cite: 'MCB-220.usable' }, ', after the quality hold ', { cite: 'MCB-220.qcHold' }, ' and reserved ', { cite: 'MCB-220.reserved' }, '.']
  }

  if (has(t, 'should', 'recommend', 'decide', 'best', 'pick')) {
    return ["I don't make the decision. I can show each option's cost, risk and timing side by side on Impact & Options, and the package Daniel sees pins every input. For example, the order cut is ", { cite: 'order.revenue' }, ' in revenue.']
  }

  return ['I can only answer with a source. Try one of the suggested questions below.']
}
