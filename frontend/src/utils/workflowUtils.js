export function getStateName(states, stateId) {
  return states.find((s) => s.id === stateId)?.name ?? "Unknown"
}

export function isStateFinal(states, stateId) {
  return states.find((s) => s.id === stateId)?.is_final ?? false
}

export function getAvailableTransitions(transitions, states, currentStateId, role) {
  if (isStateFinal(states, currentStateId)) return []
  return transitions.filter(
    (t) => t.from_state_id === currentStateId && t.required_role === role
  )
}

// Graph traversal from initial state following transition edges.
export function getOrderedStates(states, transitions) {
  const initial = states.find((s) => s.is_initial)
  if (!initial) return states
  const ordered = [initial]
  const visited = new Set([initial.id])
  let current = initial
  while (true) {
    const next = transitions.find((t) => t.from_state_id === current.id && !visited.has(t.to_state_id))
    if (!next) break
    const nextState = states.find((s) => s.id === next.to_state_id)
    if (!nextState) break
    ordered.push(nextState)
    visited.add(nextState.id)
    current = nextState
  }
  return ordered
}
