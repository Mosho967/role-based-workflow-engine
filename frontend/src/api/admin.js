import client from "./client"

export async function fetchUsers() {
  const res = await client.get("/users")
  return res.data
}

export async function createUser(username, email, password, role) {
  const res = await client.post("/users", { username, email, password, role })
  return res.data
}

export async function fetchAllAuditLogs() {
  const res = await client.get("/audit")
  return res.data
}

export async function fetchAuditLogsForTask(taskId) {
  const res = await client.get(`/audit/${taskId}`)
  return res.data
}
