import { Link } from "react-router-dom"
import logo from "../assets/logo.png"

export default function Welcome() {
  return (
    <div className="min-h-screen bg-green-50 flex flex-col">

      {/* Nav */}
      <nav className="bg-white shadow px-8 py-4 flex justify-between items-center border-b-2 border-green-600">
        <div className="flex items-center gap-2">
          <img src={logo} alt="logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold text-green-700">Cogflow</span>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl">

          {/* Logo */}
          <img src={logo} alt="Cogflow" className="mx-auto mb-8 w-24 h-24 object-contain" />

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Manage Your Workflow <span className="text-green-600">Effortlessly</span>
          </h1>
          <p className="text-lg text-gray-500 mb-10">
            The all-in-one tool for users and admins to stay synced — submit requests, track progress, and automate approvals.
          </p>

          <Link
            to="/login"
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-green-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </main>

      {/* Feature strip */}
      <div className="bg-white border-t py-10 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-green-600 font-semibold mb-1">Role-Based Access</p>
            <p className="text-sm text-gray-500">Admins, reviewers, and users each see exactly what they need.</p>
          </div>
          <div>
            <p className="text-green-600 font-semibold mb-1">State Tracking</p>
            <p className="text-sm text-gray-500">Every request moves through defined stages — no more chasing emails.</p>
          </div>
          <div>
            <p className="text-green-600 font-semibold mb-1">Full Audit Log</p>
            <p className="text-sm text-gray-500">Every transition is recorded so nothing gets lost.</p>
          </div>
        </div>
      </div>

    </div>
  )
}
