import client from "./client"

export async function fetchWorkflows() {
  const res = await client.get("/workflows")
  return res.data
}

export async function createWorkflow(name, description) {
  const res = await client.post("/workflows", { name, description })
  return res.data
}

export async function fetchStates(workflowId) {
  const res = await client.get(`/workflows/${workflowId}/states`)
  return res.data
}

export async function fetchTransitions(workflowId) {
  const res = await client.get(`/workflows/${workflowId}/transitions`)
  return res.data
}

export async function createState(workflowId, name, isInitial, isFinal) {
  const res = await client.post(`/workflows/${workflowId}/states`, {
    name,
    is_initial: isInitial,
    is_final: isFinal,
  })
  return res.data
}

export async function createTransition(workflowId, fromStateId, toStateId, requiredRole) {
  const res = await client.post(`/workflows/${workflowId}/transitions`, {
    from_state_id: fromStateId,
    to_state_id: toStateId,
    required_role: requiredRole,
  })
  return res.data
}

export async function triggerTransition(taskId, toStateId) {
  const res = await client.post("/transitions", { task_id: taskId, to_state_id: toStateId })
  return res.data
}

export async function deleteTransition(workflowId, transitionId) {
  await client.delete(`/workflows/${workflowId}/transitions/${transitionId}`)
}
