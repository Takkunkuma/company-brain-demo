// Pure derivations. No React, no store: everything here is unit-tested.
import { holdMonths, order, workingDaysPerMonth, type Material, type OptionDef, type OptionId } from '../data/scenario'

export interface Definition {
  excludeQcHold: boolean
  excludeReserved: boolean
  includeInbound: boolean
  inboundDays: number
}

export const defaultDefinition: Definition = {
  excludeQcHold: true,
  excludeReserved: true,
  includeInbound: false,
  inboundDays: 14,
}

export interface CalcContext {
  definition: Definition
  demandAdjPct: number
  /** Effective QC hold per material (after confirmations), falls back to ERP value. */
  qcHold: Record<string, number>
  /** Effective arrival date per PO (ISO date). */
  arrival: Record<string, string>
  today: string // ISO
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso.slice(0, 10) + 'T00:00:00Z').getTime()
  const b = new Date(toIso.slice(0, 10) + 'T00:00:00Z').getTime()
  return Math.round((b - a) / 86_400_000)
}

/** On hand minus whatever the definition excludes. Never includes inbound. */
export function usableOnHand(onHand: number, qcHold: number, reserved: number, def: Definition): number {
  return Math.max(0, onHand - (def.excludeQcHold ? qcHold : 0) - (def.excludeReserved ? reserved : 0))
}

/** Demand for a material after the order cut and the user's demand scenario. */
export function demandFor(perProduct: number, adjPct: number, baseQty = order.newQty): number {
  return Math.round(baseQty * perProduct * (1 + adjPct / 100))
}

export interface MaterialCalc {
  id: string
  onHand: number
  qcHold: number
  reserved: number
  usableOnHand: number
  inboundQty: number
  inboundInUsable: number
  /** Displayed usable: usable on hand (+ inbound within N days if the definition says so). */
  usable: number
  /** Supply used for excess: usable on hand + all open inbound (inbound counted exactly once). */
  supply: number
  oldDemand: number
  demand: number
  excess: number
  shortage: number
  exposure: number
  daysOfSupply: number
  arrival?: string
  daysToArrival?: number
}

export function computeMaterial(m: Material, ctx: CalcContext): MaterialCalc {
  const qcHold = ctx.qcHold[m.id] ?? m.qcHold
  const uoh = usableOnHand(m.onHand, qcHold, m.reserved, ctx.definition)
  const inboundQty = m.inbound?.qty ?? 0
  const arrival = m.inbound ? ctx.arrival[m.inbound.po] ?? m.inbound.erpDate : undefined
  const daysToArrival = arrival ? daysBetween(ctx.today, arrival) : undefined
  const inboundInUsable =
    ctx.definition.includeInbound && daysToArrival !== undefined && daysToArrival <= ctx.definition.inboundDays
      ? inboundQty
      : 0
  const supply = uoh + inboundQty
  const demand = demandFor(m.perProduct, ctx.demandAdjPct)
  const excess = Math.max(0, supply - demand)
  const dailyUsage = demand / workingDaysPerMonth
  return {
    id: m.id,
    onHand: m.onHand,
    qcHold,
    reserved: m.reserved,
    usableOnHand: uoh,
    inboundQty,
    inboundInUsable,
    usable: uoh + inboundInUsable,
    supply,
    oldDemand: order.oldQty * m.perProduct,
    demand,
    excess,
    shortage: Math.max(0, demand - supply),
    exposure: round2(excess * m.unitCost),
    daysOfSupply: dailyUsage > 0 ? round1(uoh / dailyUsage) : Infinity,
    arrival,
    daysToArrival,
  }
}

export interface OptionLine {
  id: OptionId
  applied: number
  cost: number
}

export interface OptionPlan {
  lines: OptionLine[]
  /** Units still excess after units-removing options (hold does not remove units). */
  residual: number
  held: number
  totalCost: number
}

/** Cost of one option on its own against the current excess. */
export function optionStandalone(opt: OptionDef, excess: number, unitCost: number): OptionLine {
  const applied = Math.min(opt.capacity, excess)
  return { id: opt.id, applied, cost: optionCost(opt, applied, unitCost) }
}

export function optionCost(opt: OptionDef, units: number, unitCost: number): number {
  const months = opt.id === 'hold' ? holdMonths : 1
  return round2(units * unitCost * opt.costRate * months)
}

/**
 * Apply selected options in the order chosen. Each takes min(capacity, remaining).
 * "Hold" never removes units; it prices whatever is left after the other options.
 */
export function planOptions(selected: OptionId[], all: OptionDef[], excess: number, unitCost: number): OptionPlan {
  let remaining = excess
  const lines: OptionLine[] = []
  const ordered = [...selected.filter((s) => s !== 'hold'), ...selected.filter((s) => s === 'hold')]
  let held = 0
  for (const id of ordered) {
    const opt = all.find((o) => o.id === id)
    if (!opt) continue
    if (id === 'hold') {
      held = remaining
      lines.push({ id, applied: remaining, cost: optionCost(opt, remaining, unitCost) })
      continue
    }
    const applied = Math.min(opt.capacity, remaining)
    remaining -= applied
    lines.push({ id, applied, cost: optionCost(opt, applied, unitCost) })
  }
  const totalCost = round2(lines.reduce((s, l) => s + l.cost, 0))
  return { lines, residual: remaining, held, totalCost }
}

export function revenueAtRisk(): number {
  return (order.oldQty - order.newQty) * order.pricePerUnit
}

export const round2 = (n: number) => Math.round(n * 100) / 100
export const round1 = (n: number) => Math.round(n * 10) / 10
