import { useState, useEffect } from "react"
import { useRegister } from "../hooks/useRegister"
import { Link } from "react-router-dom"

export default function Register() {
  const { username, setUsername, email, setEmail, password, setPassword, error, loading, handleSubmit } = useRegister()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const parts = error ? error.split(", ") : []
  const usernameError = parts.filter(p => /username/i.test(p)).join(", ") || null
  const emailError = parts.filter(p => /email/i.test(p)).join(", ") || null
  const passwordError = parts.filter(p => /password/i.test(p)).join(", ") || null
  const generalError = parts.filter(p => !/username|email|password/i.test(p)).join(", ") || null

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-green-50 transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="bg-white p-8 rounded shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-green-700">Cogflow</h1>
        <p className="text-gray-500 text-sm mb-6">Create your account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${usernameError ? "border-red-400" : ""}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            {usernameError && <p className="text-red-500 text-xs mt-1">{usernameError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${emailError ? "border-red-400" : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${passwordError ? "border-red-400" : ""}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
          </div>
          {generalError && <p className="text-red-500 text-sm">{generalError}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-green-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
