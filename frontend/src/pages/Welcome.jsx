import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import logo from "../assets/logo.png"

const BUBBLES = [
  { size: 80,  left: "5%",  delay: "0s",   duration: "12s" },
  { size: 50,  left: "12%", delay: "2s",   duration: "16s" },
  { size: 35,  left: "20%", delay: "6s",   duration: "13s" },
  { size: 120, left: "28%", delay: "4s",   duration: "10s" },
  { size: 55,  left: "36%", delay: "1.5s", duration: "17s" },
  { size: 60,  left: "45%", delay: "1s",   duration: "14s" },
  { size: 40,  left: "53%", delay: "7s",   duration: "11s" },
  { size: 90,  left: "62%", delay: "3s",   duration: "18s" },
  { size: 65,  left: "70%", delay: "5s",   duration: "12s" },
  { size: 40,  left: "78%", delay: "0.5s", duration: "11s" },
  { size: 75,  left: "85%", delay: "2.5s", duration: "15s" },
  { size: 50,  left: "92%", delay: "4.5s", duration: "13s" },
]

export default function Welcome() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen flex flex-col relative transition-opacity duration-700" style={{ backgroundColor: "#f0fdf4", overflowX: "hidden", opacity: visible ? 1 : 0 }}>

      {/* Floating bubbles */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {BUBBLES.map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              bottom: 0,
              left: b.left,
              width: b.size,
              height: b.size,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #bbf7d0, #4ade80)",
              animation: `floatUp ${b.duration} ${b.delay} infinite linear`,
            }}
          />
        ))}
      </div>

      {/* Nav */}
      <nav className="bg-white shadow px-8 py-4 flex justify-between items-center border-b-2 border-green-600 relative z-10">
        <div className="flex items-center gap-2">
          <img src={logo} alt="logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold text-green-700">Cogflow</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/about" className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors">About</Link>
          <Link to="/login" className="text-sm font-medium bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10">
        <div className="max-w-2xl">
          <img src={logo} alt="Cogflow" className="mx-auto mb-8 w-24 h-24 object-contain" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Manage Your Workflow <span className="text-green-600">Effortlessly</span>
          </h1>
          <p className="text-lg text-gray-500 mb-10">
            Track tasks. Control progress. Approve with confidence.
          </p>
          <Link
            to="/login"
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-green-700 transition-all hover:shadow-lg hover:shadow-green-400/40"
          >
            Get Started
          </Link>
        </div>
      </main>

      {/* Feature strip */}
      <div className="bg-green-900 border-t border-green-800 py-10 px-6 relative z-10">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-green-300 font-semibold mb-1">Role-Based Access</p>
            <p className="text-sm text-green-100">Admins, reviewers, and users each see exactly what they need.</p>
          </div>
          <div>
            <p className="text-green-300 font-semibold mb-1">State Tracking</p>
            <p className="text-sm text-green-100">Every request moves through defined stages — no more chasing emails.</p>
          </div>
          <div>
            <p className="text-green-300 font-semibold mb-1">Full Audit Log</p>
            <p className="text-sm text-green-100">Every transition is recorded so nothing gets lost.</p>
          </div>
        </div>
      </div>

    </div>
  )
}
