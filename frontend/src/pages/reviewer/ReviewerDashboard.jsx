import { useState, Fragment, useRef } from "react"
import { useReviewer } from "../../hooks/useReviewer"
import { useNavigate } from "react-router-dom"
import logo from "../../assets/logo.png"
import NotificationBell from "../../components/NotificationBell"
import { useNotifications } from "../../hooks/useNotifications"
import { getUserId } from "../../services/authStorage"

export default function ReviewerDashboard() {
  const {
    tasks,
    auditLogs,
    error,
    loading,
    role,
    username,
    handleTriggerTransition,
    handleLogout,
    getStateName,
    getWorkflowName,
    isStateFinal,
    getAvailableTransitions,
    getOrderedStates,
    loadData,
  } = useReviewer()

  const [pending, setPending] = useState(null)
  const [taskFilter, setTaskFilter] = useState("all")
  const [activityPage, setActivityPage] = useState(1)
  const ACT_PAGE_SIZE = 10
  const reloadRef = useRef(null)
  const { notifications, unread, markTaskRead, clearAll } = useNotifications(getUserId(), () => {
    clearTimeout(reloadRef.current)
    reloadRef.current = setTimeout(() => loadData(), 300)
  })
  const [comment, setComment] = useState("")
  const navigate = useNavigate()

  const sortedTasks = [...tasks].sort((a, b) => {
    const aHas = getAvailableTransitions(a.workflow_id, a.current_state_id).length > 0
    const bHas = getAvailableTransitions(b.workflow_id, b.current_state_id).length > 0
    if (aHas !== bHas) return aHas ? -1 : 1
    return new Date(b.updated_at) - new Date(a.updated_at)
  })

  const inQueue = tasks.filter((t) => getAvailableTransitions(t.workflow_id, t.current_state_id).length > 0).length
  const completed = tasks.filter((t) => isStateFinal(t.workflow_id, t.current_state_id)).length
  const waiting = tasks.length - inQueue - completed

  const filteredTasks = sortedTasks.filter(t => {
    const closed = isStateFinal(t.workflow_id, t.current_state_id)
    const hasAction = getAvailableTransitions(t.workflow_id, t.current_state_id).length > 0
    if (taskFilter === "closed") return closed
    if (taskFilter === "inQueue") return !closed && hasAction
    if (taskFilter === "waiting") return !closed && !hasAction
    return true
  })

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
          {username && <>
            <span className="text-gray-400 font-light">|</span>
            <span className="text-sm font-medium text-gray-500">Hi, {username}</span>
          </>}
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell notifications={notifications} unread={unread} onMarkTaskRead={markTaskRead} onClearAll={clearAll} />
          <button onClick={handleLogout} className="text-sm font-bold text-green-900 hover:underline">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-gray-800">{tasks.length}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-amber-500">{inQueue}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">In Queue</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-blue-500">{waiting}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Waiting</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{completed}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Completed</p>
          </div>
        </div>

        {/* Task Queue */}
        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">
              Review Queue
              {inQueue > 0 && (
                <span className="ml-2 text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
                  {inQueue} awaiting
                </span>
              )}
            </h2>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { key: "all", label: "All", count: tasks.length },
              { key: "inQueue", label: "In Queue", count: inQueue },
              { key: "waiting", label: "Waiting", count: waiting },
              { key: "closed", label: "Closed", count: completed },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setTaskFilter(f.key)}
                className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${taskFilter === f.key ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500 border-gray-200 hover:border-green-400"}`}
              >
                {f.label} <span className="ml-1 opacity-70">{f.count}</span>
              </button>
            ))}
          </div>

          {tasks.length === 0 ? (
            <p className="text-gray-500 text-sm">No tasks yet.</p>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => {
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

                const submitter = task.created_by_username
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

                    {/* View detail */}
                    <button
                      onClick={() => { markTaskRead(task.id); navigate(`/tasks/${task.id}`) }}
                      className="text-xs text-green-700 hover:underline mb-2 inline-block"
                    >
                      View full detail →
                    </button>

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
                          Move to <span className="text-green-700">{pending.stateName}</span>? This cannot be undone. Add a comment for the submitter (optional).
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

        {/* My Activity */}
        {(() => {
          const myLogs = Object.values(auditLogs)
            .flat()
            .filter(l => l.performed_by_username === username && l.from_state_id)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          const totalPages = Math.ceil(myLogs.length / ACT_PAGE_SIZE)
          const visible = myLogs.slice((activityPage - 1) * ACT_PAGE_SIZE, activityPage * ACT_PAGE_SIZE)
          if (myLogs.length === 0) return null
          return (
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold">My Activity</h2>
                <span className="text-xs text-gray-400">{myLogs.length} actions</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 font-medium">Task</th>
                    <th className="pb-2 font-medium">From</th>
                    <th className="pb-2 font-medium">To</th>
                    <th className="pb-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(log => {
                    const task = tasks.find(t => t.id === log.task_id)
                    return (
                      <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2 pr-3">{task?.title || "—"}</td>
                        <td className="py-2 pr-3">{log.from_state_id ? getStateName(task?.workflow_id, log.from_state_id) : "—"}</td>
                        <td className="py-2 pr-3">{getStateName(task?.workflow_id, log.to_state_id)}</td>
                        <td className="py-2 text-xs text-gray-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-4">
                  <button onClick={() => setActivityPage(p => Math.max(1, p - 1))} disabled={activityPage === 1}
                    className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-500 hover:border-green-400 disabled:opacity-30 disabled:cursor-not-allowed">←</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setActivityPage(p)}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors ${activityPage === p ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-500 hover:border-green-400"}`}
                    >{p}</button>
                  ))}
                  <button onClick={() => setActivityPage(p => Math.min(totalPages, p + 1))} disabled={activityPage === totalPages}
                    className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-500 hover:border-green-400 disabled:opacity-30 disabled:cursor-not-allowed">→</button>
                </div>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
