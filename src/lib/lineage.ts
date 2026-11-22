// What lights up in the reconciliation graph. Pure functions, unit-tested.
import { docs, plans, planIds, versionLinks, type DocId, type DocStatus, type PlanId } from '../data/reconciliation'

export type NodeKey = DocId | `plan:${PlanId}`

/**
 * Selecting a plan lights the plan, every file it used, and the earlier versions those files came from.
 * Selecting a file lights the file, its related versions, and every plan that used it.
 */
export function litNodes(sel: { plan: PlanId; doc: DocId | null }): Set<NodeKey> {
  const lit = new Set<NodeKey>()
  if (sel.doc) {
    lit.add(sel.doc)
    for (const l of versionLinks) {
      if (l.from === sel.doc || l.to === sel.doc) {
        lit.add(l.from)
        lit.add(l.to)
      }
    }
    for (const id of planIds) if (plans[id].uses.includes(sel.doc)) lit.add(`plan:${id}`)
    return lit
  }
  lit.add(`plan:${sel.plan}`)
  for (const d of plans[sel.plan].uses) lit.add(d)
  // pull in the earlier versions of anything used (e.g. Luis’s copy ← Sheet v1)
  let grew = true
  while (grew) {
    grew = false
    for (const l of versionLinks) {
      if (lit.has(l.to) && !lit.has(l.from)) {
        lit.add(l.from)
        grew = true
      }
    }
  }
  return lit
}

/** Plans that used a file. */
export function usedBy(doc: DocId): PlanId[] {
  return planIds.filter((id) => plans[id].uses.includes(doc))
}

/** All saved versions of the same file (the planner sheet has three), oldest first. */
export function versionFamily(doc: DocId): DocId[] {
  const fam = new Set<DocId>([doc])
  let grew = true
  while (grew) {
    grew = false
    for (const l of versionLinks) {
      if (fam.has(l.from) && !fam.has(l.to)) { fam.add(l.to); grew = true }
      if (fam.has(l.to) && !fam.has(l.from)) { fam.add(l.from); grew = true }
    }
  }
  return [...fam].sort((a, b) => docs[a].col - docs[b].col)
}

/** Count of a plan's sources by status. */
export function sourceHealth(plan: PlanId): Record<DocStatus, number> {
  const out: Record<DocStatus, number> = { latest: 0, old: 0, unchecked: 0 }
  for (const d of plans[plan].uses) out[docs[d].status]++
  return out
}
