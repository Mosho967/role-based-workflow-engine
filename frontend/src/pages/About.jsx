import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import logo from "../assets/logo.png"

export default function About() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-green-50 flex flex-col transition-opacity duration-700" style={{ opacity: visible ? 1 : 0 }}>

      {/* Nav */}
      <nav className="bg-white shadow px-8 py-4 flex justify-between items-center border-b-2 border-green-600">
        <div className="flex items-center gap-2">
          <img src={logo} alt="logo" className="w-8 h-8 object-contain" />
          <Link to="/" className="text-xl font-bold text-green-700">Cogflow</Link>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-gray-600 hover:text-green-700">Home</Link>
          <Link to="/login" className="text-sm font-medium bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 space-y-14">

        {/* What is Cogflow */}
        <section>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">About Cogflow</h1>
          <p className="text-gray-600 leading-relaxed">
            Cogflow is a role-based workflow engine built to replace the chaos of email-based approval processes.
            Instead of chasing people over email to get something signed off, Cogflow gives your team a single place
            to submit requests, track their progress, and record every decision — automatically.
          </p>
        </section>

        {/* The problem */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">The Problem</h2>
          <p className="text-gray-600 leading-relaxed">
            Most teams handle approvals over email or chat. Requests get lost, nobody knows what stage something is at,
            and there's no record of who approved what and when. As teams grow, this breaks down fast.
          </p>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="space-y-4">
            {[
              { step: "1", title: "Admin builds a workflow", desc: "Define the stages a request moves through — Submitted, Under Review, Approved, Rejected — and set which role can action each transition." },
              { step: "2", title: "Users submit tasks", desc: "Any team member can submit a request. It's automatically placed in the first stage of the workflow and visible to the right people." },
              { step: "3", title: "Reviewers and admins action it", desc: "The right people move the task forward based on their role. Every action is enforced — only authorised roles can make each transition." },
              { step: "4", title: "Everything is logged", desc: "Every state change is recorded in an audit log — who did it, when, and what changed. Nothing gets lost." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center shrink-0">{step}</div>
                <div>
                  <p className="font-medium text-gray-900">{title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Roles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { role: "Admin", colour: "bg-red-100 text-red-700", desc: "Builds workflows, manages users, and has full visibility across all tasks." },
              { role: "Reviewer", colour: "bg-yellow-100 text-yellow-700", desc: "Reviews and actions tasks assigned to their stage of the workflow." },
              { role: "User", colour: "bg-green-100 text-green-700", desc: "Submits tasks and tracks their progress through the workflow." },
            ].map(({ role, colour, desc }) => (
              <div key={role} className="bg-white rounded-2xl border p-4">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colour}`}>{role}</span>
                <p className="text-sm text-gray-500 mt-2">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Link
            to="/login"
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-green-700 transition-colors"
          >
            Get Started
          </Link>
        </section>

      </main>

    </div>
  )
}
