import client from "./client"

export async function generateWorkflow(workflowId, description) {
  const res = await client.post("/ai/generate-workflow", { workflow_id: workflowId, description })
  return res.data
}
