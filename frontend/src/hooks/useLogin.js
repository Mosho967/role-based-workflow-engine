import { loginUser } from '../api/auth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken, setRole } from '../services/authStorage'

export function useLogin() {
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
      const data = await loginUser(email, password)
      const payload = JSON.parse(atob(data.access_token.split('.')[1]))
      setToken(data.access_token)
      setRole(payload.role)
      navigate(payload.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        const msg = detail.map((e) => e.msg.replace(/^Value error, /i, '')).join(', ')
        setError(msg.toLowerCase().includes('email') ? 'Please enter a valid email address' : msg)
      } else {
        setError(detail || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return { email, setEmail, password, setPassword, error, loading, handleSubmit }
}
