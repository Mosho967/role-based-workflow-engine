import client from "./client"

export async function generateWorkflow(workflowId, description) {
  const res = await client.post("/ai/generate-workflow", { workflow_id: workflowId, description })
  return res.data
}

export async function chatWithAI(workflowId, message, states, transitions, history = []) {
  const res = await client.post("/ai/chat", { workflow_id: workflowId, message, states, transitions, history })
  return res.data
}

export async function applyWorkflow(workflowId, states, transitions) {
  const res = await client.post("/ai/apply-workflow", { workflow_id: workflowId, states, transitions })
  return res.data
}
