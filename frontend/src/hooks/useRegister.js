import { registerUser } from "../api/auth"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

export function useRegister() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerUser(username, email, password)
      navigate('/login')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map((e) => e.msg.replace(/^Value error, /i, '')).join(', '))
      } else {
        setError(detail || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return { username, setUsername, email, setEmail, password, setPassword, error, loading, handleSubmit }
}
