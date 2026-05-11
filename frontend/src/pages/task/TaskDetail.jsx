import { useState, Fragment } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTaskDetail } from "../../hooks/useTaskDetail"
import logo from "../../assets/logo.png"
import { clearAuth } from "../../services/authStorage"

export default function TaskDetail() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const {
    task,
    auditLogs,
    error,
    loading,
    role,
    handleTriggerTransition,
    handleSendComment,
    getStateName,
    isStateFinal,
    getAvailableTransitions,
    getOrderedStates,
    getUserName,
  } = useTaskDetail(taskId)

  const [pending, setPending] = useState(null) // { toStateId, stateName }
  const [comment, setComment] = useState("")
  const [reply, setReply] = useState("")

  function handleLogout() {
    clearAuth()
    navigate("/login")
  }

  function goBack() {
    if (role === "admin") navigate("/admin")
    else if (role === "reviewer") navigate("/reviewer")
    else navigate("/dashboard")
  }

  async function handleConfirm() {
    if (!pending) return
    await handleTriggerTransition(pending.toStateId, comment || null)
    setPending(null)
    setComment("")
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (!task) return <div className="p-8 text-red-500">{error || "Task not found"}</div>

  const available = getAvailableTransitions()
  const ordered = getOrderedStates()
  const currentIndex = ordered.findIndex((s) => s.id === task.current_state_id)
  const stateName = getStateName(task.current_state_id)
  const stateKey = stateName.toLowerCase()
  const stateBadge = /approved|completed|done/.test(stateKey)
    ? "bg-green-100 text-green-700"
    : /rejected|cancelled|denied|terminated/.test(stateKey)
    ? "bg-red-100 text-red-700"
    : available.length > 0
    ? "bg-amber-100 text-amber-700"
    : "bg-blue-100 text-blue-700"

  return (
    <div className="min-h-screen bg-green-100">
      {/* Top bar */}
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center border-b-2 border-green-600">
        <div className="flex items-center gap-2">
          <img src={logo} alt="logo" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-bold text-green-700">Cogflow</h1>
          <span className="text-gray-400 font-light">|</span>
          <span className="text-sm font-medium text-gray-500 capitalize">{role}</span>
        </div>
        <button onClick={handleLogout} className="text-sm font-bold text-green-900 hover:underline">
          Logout
        </button>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        {/* Back */}
        <button onClick={goBack} className="text-sm text-green-700 hover:underline flex items-center gap-1">
          ← Back
        </button>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left — task detail */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-xl font-bold text-gray-800">{task.title}</h2>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${stateBadge}`}>
                  {stateName}
                </span>
              </div>

              <p className="text-xs text-gray-400 mb-4">
                Submitted {new Date(task.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                {getUserName(task.created_by) && (
                  <> · by <span className="font-medium text-gray-600">{getUserName(task.created_by)}</span></>
                )}
              </p>

              {task.description && (
                <p className="text-sm text-gray-700 leading-relaxed mb-4 border-l-2 border-green-300 pl-3">
                  {task.description}
                </p>
              )}

              {/* Stepper */}
              {ordered.length >= 2 && (
                <div className="flex items-start mt-4">
                  {ordered.map((state, i) => {
                    const isPast = i < currentIndex
                    const isCurrent = i === currentIndex
                    return (
                      <Fragment key={state.id}>
                        <div className="flex flex-col items-center" style={{ minWidth: 0 }}>
                          <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                            isPast ? "bg-green-500 border-green-500" :
                            isCurrent ? "bg-green-600 border-green-600 ring-2 ring-green-200" :
                            "bg-white border-gray-300"
                          }`} />
                          <span className={`text-[10px] mt-1 text-center leading-tight max-w-[56px] truncate ${
                            isCurrent ? "text-green-700 font-semibold" : "text-gray-400"
                          }`}>{state.name}</span>
                        </div>
                        {i < ordered.length - 1 && (
                          <div className={`flex-1 h-0.5 mt-1.5 mx-0.5 ${isPast ? "bg-green-400" : "bg-gray-200"}`} />
                        )}
                      </Fragment>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Action buttons */}
            {available.length > 0 && !pending && (
              <div className="bg-white rounded-2xl shadow p-5">
                <p className="text-sm font-medium text-gray-600 mb-3">Actions</p>
                <div className="flex flex-wrap gap-2">
                  {available.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setPending({ toStateId: t.to_state_id, stateName: getStateName(t.to_state_id) }); setComment("") }}
                      className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                    >
                      Move to {getStateName(t.to_state_id)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Inline confirm + comment */}
            {pending && (
              <div className="bg-white rounded-2xl shadow p-5 border border-green-200 space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Moving to <span className="text-green-700 font-semibold">{pending.stateName}</span>
                </p>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-green-400"
                  rows={3}
                  placeholder="Add a comment for the submitter (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button onClick={handleConfirm} className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                    Confirm
                  </button>
                  <button onClick={() => { setPending(null); setComment("") }} className="text-sm text-gray-500 hover:underline">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right — messages + history */}
          <div className="lg:col-span-1 space-y-4">

            {/* Messages */}
            <div className="bg-white rounded-2xl shadow p-5">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">Message History</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {/* Task description as opening message */}
                {task.description && (
                  <div className="flex flex-col items-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 text-xs bg-green-50 text-green-900">
                      <p className="font-semibold mb-0.5 opacity-70">{task.created_by_username || "Submitter"}</p>
                      <p className="leading-relaxed">{task.description}</p>
                    </div>
                    <p className="text-[10px] text-gray-300 mt-0.5 px-1">
                      {new Date(task.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                )}
                {/* Transition comments */}
                {auditLogs.filter((l) => l.comment).length === 0 && !task.description && (
                  <p className="text-xs text-gray-400">No messages yet.</p>
                )}
                {auditLogs.filter((l) => l.comment).map((log) => {
                  const isReviewer = log.performed_by_username !== task.created_by_username
                  return (
                    <div key={log.id} className={`flex flex-col ${isReviewer ? "items-start" : "items-end"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                        isReviewer
                          ? "bg-blue-50 text-blue-900 rounded-tl-sm"
                          : "bg-green-50 text-green-900 rounded-tr-sm"
                      }`}>
                        <p className="font-semibold mb-0.5 opacity-70">
                          {log.performed_by_username || "Unknown"}
                        </p>
                        <p className="leading-relaxed">{log.comment}</p>
                      </div>
                      <p className="text-[10px] text-gray-300 mt-0.5 px-1">
                        {new Date(log.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Reply box */}
            <div className="mt-3 flex gap-2">
              <textarea
                className="flex-1 border rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-green-400"
                rows={2}
                placeholder="Write a message..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <button
                onClick={async () => { if (!reply.trim()) return; await handleSendComment(reply.trim()); setReply("") }}
                className="self-end bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700"
              >
                Send
              </button>
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl shadow p-5">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">History</h3>
              {auditLogs.length === 0 ? (
                <p className="text-xs text-gray-400">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {[...auditLogs].reverse().filter((log) => log.from_state_id !== null || !log.comment).map((log) => {
                    const fromName = log.from_state_id ? getStateName(log.from_state_id) : null
                    const toName = getStateName(log.to_state_id)
                    return (
                      <div key={log.id} className="text-xs border-l-2 border-green-200 pl-3">
                        <p className="font-medium text-gray-700">
                          {fromName ? `${fromName} → ${toName}` : `Submitted as ${toName}`}
                        </p>
                        {log.performed_by_username && (
                          <p className="text-gray-400">by <span className="font-medium">{log.performed_by_username}</span></p>
                        )}
                        <p className="text-gray-300 mt-0.5">
                          {new Date(log.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
