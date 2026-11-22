import { describe, expect, it } from 'vitest'
import { litNodes, sourceHealth, usedBy, versionFamily } from './lineage'

describe('reconciliation lineage', () => {
  it('lights Plan B back to the old sheet it was copied from', () => {
    const lit = litNodes({ plan: 'B', doc: null })
    expect(lit.has('plan:B')).toBe(true)
    expect(lit.has('lc')).toBe(true)
    expect(lit.has('v1')).toBe(true) // Luis’s copy came from Sheet v1
    expect(lit.has('v2')).toBe(false)
    expect(lit.has('plan:A')).toBe(false)
  })

  it('lights Plan A on the latest sheet and its history', () => {
    const lit = litNodes({ plan: 'A', doc: null })
    expect(lit.has('v2')).toBe(true)
    expect(lit.has('v1')).toBe(true)
    expect(lit.has('lc')).toBe(false)
    expect(lit.has('c220')).toBe(false)
  })

  it('selecting a file lights the plans that used it', () => {
    const lit = litNodes({ plan: 'A', doc: 'c220' })
    expect([...lit].filter((k) => k.startsWith('plan:'))).toEqual(['plan:C'])
    expect(usedBy('contract')).toEqual(['A', 'B', 'C'])
  })

  it('groups every version of the planner sheet', () => {
    expect(versionFamily('lc')).toEqual(['v1', 'v2', 'lc'])
    expect(versionFamily('erp')).toEqual(['erp'])
  })

  it('summarises how current each plan’s sources are', () => {
    expect(sourceHealth('A')).toEqual({ latest: 6, old: 0, unchecked: 0 })
    expect(sourceHealth('B')).toEqual({ latest: 2, old: 1, unchecked: 1 })
    expect(sourceHealth('C')).toEqual({ latest: 6, old: 0, unchecked: 1 })
  })
})
