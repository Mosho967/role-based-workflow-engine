import client from "./client"

export async function fetchTasks() {
  const res = await client.get("/tasks")
  return res.data
}

export async function createTask(title, workflow_id, description) {
  const res = await client.post("/tasks", { title, workflow_id, description: description || null })
  return res.data
}
