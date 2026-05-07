export function getToken() {
  return sessionStorage.getItem("token")
}

export function setToken(token) {
  sessionStorage.setItem("token", token)
}

export function getRole() {
  return sessionStorage.getItem("role")
}

export function setRole(role) {
  sessionStorage.setItem("role", role)
}

export function clearAuth() {
  sessionStorage.removeItem("token")
  sessionStorage.removeItem("role")
}
