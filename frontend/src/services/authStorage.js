export function getToken() {
  return localStorage.getItem("token")
}

export function setToken(token) {
  localStorage.setItem("token", token)
}

export function getRole() {
  return localStorage.getItem("role")
}

export function setRole(role) {
  localStorage.setItem("role", role)
}

export function clearAuth() {
  localStorage.removeItem("token")
  localStorage.removeItem("role")
}
