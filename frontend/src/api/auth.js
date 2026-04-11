import client from "./client"

export async function loginUser(email, password) {
  const res = await client.post("/auth/login", { email, password })
  return res.data
}

export async function registerUser(username, email, password) {
  const res = await client.post("/auth/register", { username, email, password })
  return res.data
}
