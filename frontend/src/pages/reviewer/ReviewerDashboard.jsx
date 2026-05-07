import { useState, Fragment } from "react"
import { useReviewer } from "../../hooks/useReviewer"
import logo from "../../assets/logo.png"

export default function ReviewerDashboard() {
  const {
    tasks,
    auditLogs,
    error,
    loading,
    role,
    handleTriggerTransition,
    handleLogout,
    getStateName,
    getWorkflowName,
    isStateFinal,
    getAvailableTransitions,
    getOrderedStates,
    getSubmitterName,
  } = useReviewer()

  const [pending, setPending] = useState(null) // { taskId, toStateId, stateName }
  const [comment, setComment] = useState("")

  const sortedTasks = [...tasks].sort((a, b) => {
    const aHas = getAvailableTransitions(a.workflow_id, a.current_state_id).length > 0
    const bHas = getAvailableTransitions(b.workflow_id, b.current_state_id).length > 0
    if (aHas !== bHas) return aHas ? -1 : 1
    return new Date(a.created_at) - new Date(b.created_at)
  })

  const inQueue = tasks.filter((t) => getAvailableTransitions(t.workflow_id, t.current_state_id).length > 0).length
  const completed = tasks.filter((t) => isStateFinal(t.workflow_id, t.current_state_id)).length

  function handleActionClick(taskId, toStateId, stateName) {
    setPending({ taskId, toStateId, stateName })
    setComment("")
  }

  async function handleConfirm() {
    if (!pending) return
    await handleTriggerTransition(pending.taskId, pending.toStateId, comment || null)
    setPending(null)
    setComment("")
  }

  if (loading) return <div className="p-8">Loading...</div>

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
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-gray-800">{tasks.length}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-amber-500">{inQueue}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">In Queue</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{completed}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Completed</p>
          </div>
        </div>

        {/* Task Queue */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="text-base font-semibold mb-4">
            Review Queue
            {inQueue > 0 && (
              <span className="ml-2 text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
                {inQueue} awaiting
              </span>
            )}
          </h2>

          {tasks.length === 0 ? (
            <p className="text-gray-500 text-sm">No tasks yet.</p>
          ) : (
            <div className="space-y-4">
              {sortedTasks.map((task) => {
                const available = getAvailableTransitions(task.workflow_id, task.current_state_id)
                const stateName = getStateName(task.workflow_id, task.current_state_id)
                const stateKey = stateName.toLowerCase()
                const isFinal = isStateFinal(task.workflow_id, task.current_state_id)
                const stateBadge = /approved|completed|done/.test(stateKey)
                  ? "bg-green-100 text-green-700"
                  : /rejected|cancelled|denied/.test(stateKey)
                  ? "bg-red-100 text-red-700"
                  : available.length > 0
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700"

                const submitter = getSubmitterName(task.created_by)
                const isPending = pending?.taskId === task.id
                const taskLogs = auditLogs[task.id] || []
                const lastComment = [...taskLogs].reverse().find((l) => l.comment)

                return (
                  <div
                    key={task.id}
                    className={`border rounded-2xl p-4 ${available.length > 0 ? "border-amber-200 bg-amber-50/30" : ""}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-1 gap-2">
                      <p className="font-medium text-sm">{task.title}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${stateBadge}`}>
                        {stateName}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                      <span>{getWorkflowName(task.workflow_id)}</span>
                      {submitter && <span>· Submitted by <span className="font-medium text-gray-600">{submitter}</span></span>}
                      <span>· {new Date(task.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                    </div>

                    {/* Description */}
                    {task.description && (
                      <p className="text-xs text-gray-600 mb-3 leading-relaxed">{task.description}</p>
                    )}

                    {/* Last comment from previous reviewer action */}
                    {lastComment && (
                      <div className="text-xs text-gray-500 bg-gray-50 border rounded-lg px-3 py-2 mb-3 italic">
                        "{lastComment.comment}"
                      </div>
                    )}

                    {/* Stepper */}
                    {(() => {
                      const ordered = getOrderedStates(task.workflow_id)
                      if (ordered.length < 2) return null
                      const currentIndex = ordered.findIndex((s) => s.id === task.current_state_id)
                      return (
                        <div className="flex items-start mb-3">
                          {ordered.map((state, i) => {
                            const isPast = i < currentIndex
                            const isCurrent = i === currentIndex
                            return (
                              <Fragment key={state.id}>
                                <div className="flex flex-col items-center" style={{ minWidth: 0 }}>
                                  <div className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${
                                    isPast ? "bg-green-500 border-green-500" :
                                    isCurrent ? "bg-green-600 border-green-600 ring-2 ring-green-200" :
                                    "bg-white border-gray-300"
                                  }`} />
                                  <span className={`text-[9px] mt-1 text-center leading-tight max-w-[48px] truncate ${
                                    isCurrent ? "text-green-700 font-semibold" : "text-gray-400"
                                  }`}>{state.name}</span>
                                </div>
                                {i < ordered.length - 1 && (
                                  <div className={`flex-1 h-0.5 mt-1 mx-0.5 ${isPast ? "bg-green-400" : "bg-gray-200"}`} />
                                )}
                              </Fragment>
                            )
                          })}
                        </div>
                      )
                    })()}

                    {/* Action buttons */}
                    {available.length > 0 && !isPending && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {available.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleActionClick(task.id, t.to_state_id, getStateName(task.workflow_id, t.to_state_id))}
                            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium"
                          >
                            Move to {getStateName(task.workflow_id, t.to_state_id)}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Inline comment + confirm */}
                    {isPending && (
                      <div className="mt-3 border border-green-200 rounded-xl p-3 bg-white space-y-2">
                        <p className="text-xs font-medium text-gray-600">
                          Moving to <span className="text-green-700">{pending.stateName}</span> — add a comment for the submitter (optional)
                        </p>
                        <textarea
                          className="w-full border rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-green-400"
                          rows={2}
                          placeholder="e.g. Please revise section 2 and resubmit"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          autoFocus
                        />
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleConfirm}
                            className="text-xs bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 font-medium"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => { setPending(null); setComment("") }}
                            className="text-xs text-gray-500 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
