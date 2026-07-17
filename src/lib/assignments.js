// Per-agent toolkit assignments (which connected apps a sub-agent may use).
//
// Defaults come from each agent's `toolkits` in agents.js, but the user can
// re-assign any connected app to any sub-agent from the Skills Matrix. The
// effective assignment is what feeds tool discovery for the chat loop, so a
// tool assigned here actually becomes callable by that agent.

import { AGENTS } from './agents'

const KEY = 'hermes-inbox:assignments'

export function defaultAssignments() {
  const m = {}
  for (const a of AGENTS) m[a.id] = [...(a.toolkits || [])]
  return m
}

export function loadAssignments() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY))
    if (raw && typeof raw === 'object') {
      // Merge over defaults so a newly added agent always has an entry.
      return { ...defaultAssignments(), ...raw }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return defaultAssignments()
}

export function saveAssignments(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    /* ignore quota errors */
  }
}
