import client from "./client"

export async function fetchTasks() {
  const res = await client.get("/tasks")
  return res.data
}

export async function deleteTask(taskId) {
  await client.delete(`/tasks/${taskId}`)
}

export async function fetchTask(taskId) {
  const res = await client.get(`/tasks/${taskId}`)
  return res.data
}

export async function createTask(title, workflow_id, description) {
  const res = await client.post("/tasks", { title, workflow_id, description: description || null })
  return res.data
}

export async function sendComment(taskId, comment) {
  const res = await client.post(`/tasks/${taskId}/comment`, { comment })
  return res.data
}
