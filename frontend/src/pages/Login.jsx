import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLogin } from '../hooks/useLogin'
import logo from '../assets/logo.png'
import previewDashboard from '../assets/dashboard-preview.png'
import previewWorkflow from '../assets/preview-workflow.png'
import previewAudit from '../assets/preview-audit.png'
import previewActivity from '../assets/preview-activity.png'

const SLIDES = [
  { img: previewDashboard, label: "Task Dashboard", desc: "Track every task and its current state in real time." },
  { img: previewWorkflow,  label: "Workflow Builder", desc: "Build custom approval flows with states and roles." },
  { img: previewAudit,     label: "Audit Logs", desc: "Every transition recorded — full accountability." },
  { img: previewActivity,  label: "Activity Feed", desc: "See exactly what moved, when, and by whom." },
]

export default function Login() {
  const { email, setEmail, password, setPassword, error, loading, handleSubmit } = useLogin()
  const [visible, setVisible] = useState(false)
  const [slide, setSlide] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setSlide(prev => (prev + 1) % SLIDES.length)
        setFading(false)
      }, 400)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  const current = SLIDES[slide]

  return (
    <div
      className="min-h-screen flex transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Left — login form */}
      <div className="flex-1 flex items-center justify-center bg-white px-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <img src={logo} alt="logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold text-green-700">Cogflow</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-green-400/40"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className="mt-4 text-sm text-center text-gray-600">
            No account?{' '}
            <Link to="/register" className="text-green-600 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>

      {/* Right — slideshow panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-green-800 to-green-950 items-center justify-center px-12 relative overflow-hidden">
        <div className="absolute w-96 h-96 bg-green-700 rounded-full opacity-20 -top-20 -right-20" />
        <div className="absolute w-64 h-64 bg-green-600 rounded-full opacity-10 bottom-10 -left-10" />

        <div className="relative z-10 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-1">Track tasks. Control progress.</h2>
          <p className="text-green-300 text-sm mb-6">One platform for your entire approval workflow.</p>

          {/* Slide */}
          <div
            className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl transition-opacity duration-400"
            style={{
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
              opacity: fading ? 0 : 1,
              transition: "opacity 0.4s ease"
            }}
          >
            <img
              src={current.img}
              alt={current.label}
              className="w-full object-cover"
            />
            <div className="px-4 py-3 text-left">
              <p className="text-white text-sm font-semibold">{current.label}</p>
              <p className="text-green-300 text-xs mt-0.5">{current.desc}</p>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => { setFading(true); setTimeout(() => { setSlide(i); setFading(false) }, 400) }}
                className={`w-2 h-2 rounded-full transition-all ${i === slide ? "bg-white w-4" : "bg-white/40"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
