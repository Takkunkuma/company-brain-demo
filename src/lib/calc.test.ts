import { describe, expect, it } from 'vitest'
import { materials, options } from '../data/scenario'
import { computeMaterial, daysBetween, defaultDefinition, demandFor, planOptions, revenueAtRisk, usableOnHand, type CalcContext } from './calc'

const mcb = materials.find((m) => m.id === 'MCB-220')!
const ctx = (over: Partial<CalcContext> = {}): CalcContext => ({
  definition: defaultDefinition,
  demandAdjPct: 0,
  qcHold: {},
  arrival: {},
  today: '2026-11-19T09:00:00',
  ...over,
})

describe('usable stock', () => {
  it('nets out hold and reserved by default', () => {
    expect(usableOnHand(1200, 180, 120, defaultDefinition)).toBe(900)
  })
  it('respects definition toggles', () => {
    expect(usableOnHand(1200, 180, 120, { ...defaultDefinition, excludeQcHold: false })).toBe(1080)
    expect(usableOnHand(1200, 180, 120, { ...defaultDefinition, excludeReserved: false })).toBe(1020)
  })
  it('only shows inbound in usable when it arrives within N days', () => {
    const def = { ...defaultDefinition, includeInbound: true, inboundDays: 14 }
    expect(computeMaterial(mcb, ctx({ definition: def })).usable).toBe(1500) // ERP Dec 2 = 13 days
    expect(computeMaterial(mcb, ctx({ definition: def, arrival: { 'PO-9921': '2026-12-09' } })).usable).toBe(900)
  })
  it('never double-counts inbound in excess', () => {
    const def = { ...defaultDefinition, includeInbound: true, inboundDays: 30 }
    expect(computeMaterial(mcb, ctx({ definition: def })).excess).toBe(700)
  })
})

describe('excess and exposure', () => {
  it('matches the spec scenario', () => {
    const r = computeMaterial(mcb, ctx())
    expect(r.supply).toBe(1500)
    expect(r.demand).toBe(800)
    expect(r.excess).toBe(700)
    expect(r.exposure).toBe(29_400)
    expect(revenueAtRisk()).toBe(372_000)
  })
  it('moves with the demand slider and reports shortage', () => {
    expect(demandFor(1, 20)).toBe(960)
    expect(computeMaterial(mcb, ctx({ demandAdjPct: 20 })).excess).toBe(540)
    expect(computeMaterial(mcb, ctx({ demandAdjPct: -40 })).excess).toBe(1020)
    const short = computeMaterial(mcb, ctx({ demandAdjPct: 100 }))
    expect(short.excess).toBe(0)
    expect(short.shortage).toBe(100)
  })
  it('cascades a confirmed QC hold override', () => {
    expect(computeMaterial(mcb, ctx({ qcHold: { 'MCB-220': 220 } })).excess).toBe(660)
  })
})

describe('options', () => {
  it('prices the spec combination to zero residual', () => {
    const plan = planOptions(['reduce', 'return'], options, 700, 42)
    expect(plan.lines.map((l) => [l.id, l.applied, l.cost])).toEqual([
      ['reduce', 600, 2016],
      ['return', 100, 630],
    ])
    expect(plan.residual).toBe(0)
    expect(plan.totalCost).toBe(2646)
  })
  it('caps options by remaining excess and never goes negative', () => {
    const plan = planOptions(['reallocate', 'reduce', 'return'], options, 700, 42)
    expect(plan.lines.map((l) => l.applied)).toEqual([250, 450, 0])
    expect(plan.residual).toBe(0)
  })
  it('scales option cost with the demand scenario', () => {
    const plan = planOptions(['reduce'], options, 540, 42)
    expect(plan.lines[0].cost).toBe(1814.4)
  })
  it('hold prices the residual after other options', () => {
    const plan = planOptions(['hold', 'reallocate'], options, 700, 42)
    expect(plan.residual).toBe(450)
    expect(plan.held).toBe(450)
    expect(plan.lines.find((l) => l.id === 'hold')!.cost).toBe(1134) // 450*42*0.02*3
  })
})

describe('dates', () => {
  it('counts calendar days', () => {
    expect(daysBetween('2026-11-19T09:00:00', '2026-11-28')).toBe(9)
  })
})
