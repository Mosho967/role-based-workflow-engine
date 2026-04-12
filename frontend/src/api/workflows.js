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

export async function triggerTransition(taskId, toStateId) {
  const res = await client.post("/transitions", { task_id: taskId, to_state_id: toStateId })
  return res.data
}
