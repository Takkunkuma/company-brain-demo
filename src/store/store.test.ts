import { describe, expect, it, vi } from 'vitest'

// The store persists to localStorage; give node a tiny in-memory one.
const mem = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
})

const { useStore } = await import('./store')
const { derive, pinInputs, snapshot, staleInputs } = await import('./derive')

const s = () => useStore.getState()
const d = () => derive(s())

describe('demo flow', () => {
  it('runs the whole scenario and resets cleanly', () => {
    expect(d().primary.excess).toBe(700)
    expect(d().openConflicts).toHaveLength(2)

    s().resolveConflict('usable-mcb220', 'a', 900)
    expect(d().facts['MCB-220.usable'].confirmed?.by).toBe('Maya Ortiz')

    // chat message raises a new conflict; confirming it cascades and re-opens usable
    s().capture('m2')
    expect(d().conflicts.find((c) => c.id === 'qchold-mcb220')?.status).toBe('open')
    s().resolveConflict('qchold-mcb220', 'b')
    expect(d().primary.excess).toBe(660)
    expect(d().conflicts.find((c) => c.id === 'usable-mcb220')?.status).toBe('reopened')

    // decision package pins inputs and goes stale on a simulated change
    s().setImpactRun()
    s().toggleOption('reduce')
    s().toggleOption('return')
    s().generateDecision(pinInputs(d(), s().selected), snapshot(d()))
    s().sendDecision()
    expect(staleInputs(s().decision.pinned, d())).toHaveLength(0)
    s().simulateInputChange()
    const stale = staleInputs(s().decision.pinned, d())
    expect(stale.map((x) => x.key)).toContain('PO-9921.supplierDate')

    // reconciliation review: Daniel approves a plan, then reset clears it
    s().setRecon({ plan: 'B', view: 'graph' })
    s().decideRecon('asked')
    expect(s().recon.decision).toMatchObject({ kind: 'asked', plan: 'B' })

    s().reset()
    expect(s().recon).toEqual({ view: 'table', plan: 'A', doc: null, decision: null })
    expect(s().supplierDateOverride).toBeUndefined()
    expect(s().decision.status).toBe('none')
    expect(d().primary.excess).toBe(700)
    expect(d().openConflicts).toHaveLength(2)
  })
})
