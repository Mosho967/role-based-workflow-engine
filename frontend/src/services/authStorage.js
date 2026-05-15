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

export function getUsername() {
  return sessionStorage.getItem("username")
}

export function setUsername(username) {
  sessionStorage.setItem("username", username)
}

export function getUserId() {
  return sessionStorage.getItem("userId")
}

export function setUserId(id) {
  sessionStorage.setItem("userId", id)
}

export function clearAuth() {
  sessionStorage.removeItem("token")
  sessionStorage.removeItem("role")
  sessionStorage.removeItem("username")
  sessionStorage.removeItem("userId")
}
