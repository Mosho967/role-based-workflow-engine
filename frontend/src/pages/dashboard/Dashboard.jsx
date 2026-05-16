import { useEffect, useState, Fragment, useRef } from "react"
import { useDashboard } from "../../hooks/useDashboard"
import { useNavigate } from "react-router-dom"
import logo from "../../assets/logo.png"
import NotificationBell from "../../components/NotificationBell"
import { useNotifications } from "../../hooks/useNotifications"
import { getUserId } from "../../services/authStorage"

function DonutChart({ completed, needsAction, waiting, total }) {
  const r = 35
  const C = 2 * Math.PI * r
  const segments = [
    { label: "Closed", value: completed, color: "#22c55e" },
    { label: "Needs Action", value: needsAction, color: "#f59e0b" },
    { label: "Waiting", value: waiting, color: "#3b82f6" },
  ].filter((s) => s.value > 0)
  let cum = 0
  return (
    <div className="flex items-center gap-8">
      <div className="relative flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="14" />
          {segments.map((seg, i) => {
            const len = (seg.value / total) * C
            const offset = C - cum
            cum += len
            return (
              <circle key={i} cx="50" cy="50" r={r} fill="none"
                stroke={seg.color} strokeWidth="14"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={offset}
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="text-2xl font-bold text-gray-800">{total}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Tasks</span>
        </div>
      </div>
      <div className="space-y-2.5 text-sm flex-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /><span className="text-gray-600">Closed</span></div>
          <span className="font-bold text-gray-800">{completed}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="text-gray-600">Needs Action</span></div>
          <span className="font-bold text-gray-800">{needsAction}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span className="text-gray-600">Waiting</span></div>
          <span className="font-bold text-gray-800">{waiting}</span>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const {
    tasks,
    workflows,
    auditLogs,
    selectedWorkflowId,
    setSelectedWorkflowId,
    newTaskTitle,
    setNewTaskTitle,
    newTaskDescription,
    setNewTaskDescription,
    error,
    loading,
    handleSubmitTask,
    handleTriggerTransition,
    role,
    username,
    handleLogout,
    getStateName,
    getWorkflowName,
    getAvailableTransitions,
    isStateFinal,
    getOrderedStates,
    handleDeleteTask,
    loadTransitions,
    loadData,
  } = useDashboard()

  const reloadRef = useRef(null)
  const { notifications, unread, markTaskRead, clearAll } = useNotifications(getUserId(), () => {
    clearTimeout(reloadRef.current)
    reloadRef.current = setTimeout(() => loadData(), 300)
  })
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [taskFilter, setTaskFilter] = useState("all")
  const [activityPage, setActivityPage] = useState(1)
  const [pending, setPending] = useState(null) // { taskId, toStateId, stateName }
  const [pendingComment, setPendingComment] = useState("")
  const navigate = useNavigate()

  const LIMIT = 5

  useEffect(() => {
    tasks.forEach((task) => loadTransitions(task.workflow_id))
  }, [tasks])

  const sortedTasks = [...tasks].sort((a, b) => {
    const aHas = getAvailableTransitions(a.workflow_id, a.current_state_id).length > 0
    const bHas = getAvailableTransitions(b.workflow_id, b.current_state_id).length > 0
    if (aHas !== bHas) return aHas ? -1 : 1
    return new Date(b.created_at) - new Date(a.created_at)
  })
  const filteredTasks = sortedTasks.filter(t => {
    const closed = isStateFinal(t.workflow_id, t.current_state_id)
    const hasAction = getAvailableTransitions(t.workflow_id, t.current_state_id).length > 0
    if (taskFilter === "closed") return closed
    if (taskFilter === "needsAction") return !closed && hasAction
    if (taskFilter === "waiting") return !closed && !hasAction
    return true
  })
  const visibleTasks = showAllTasks ? filteredTasks : filteredTasks.slice(0, LIMIT)
  const allLogs = tasks.flatMap(task =>
    (auditLogs[task.id] || []).map(log => ({ ...log, task }))
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const ACT_PAGE_SIZE = 10
  const totalActivityPages = Math.ceil(allLogs.length / ACT_PAGE_SIZE)
  const visibleLogs = allLogs.slice((activityPage - 1) * ACT_PAGE_SIZE, activityPage * ACT_PAGE_SIZE)

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => isStateFinal(t.workflow_id, t.current_state_id)).length
  const activeTasks = totalTasks - completedTasks
  const needsActionTasks = tasks.filter(t => getAvailableTransitions(t.workflow_id, t.current_state_id).length > 0).length
  const waitingTasks = activeTasks - needsActionTasks

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

      <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Stats Row — full width */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-gray-800">{totalTasks}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total Tasks</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{activeTasks}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Active</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{completedTasks}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Closed</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-amber-500">{needsActionTasks}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Needs Action</p>
          </div>
        </div>

        {/* Main grid: left col (donut + new task) | right col (tasks) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Donut chart */}
            {totalTasks > 0 && (
              <div className="bg-white rounded-2xl shadow p-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Task Overview</h2>
                <DonutChart
                  completed={completedTasks}
                  needsAction={needsActionTasks}
                  waiting={waitingTasks}
                  total={totalTasks}
                />
              </div>
            )}

            {/* New Task form */}
            <div className="bg-white rounded-2xl shadow p-5">
              <h2 className="text-base font-semibold mb-4">New Task</h2>
              <form onSubmit={handleSubmitTask} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Workflow</label>
                  <select
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={selectedWorkflowId}
                    onChange={(e) => setSelectedWorkflowId(e.target.value)}
                  >
                    <option value="">Select a workflow</option>
                    {workflows.map((wf) => (
                      <option key={wf.id} value={wf.id}>{wf.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Task Title</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Enter task title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full border rounded px-3 py-2 text-sm resize-none"
                    rows={3}
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="What needs to be done?"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Submit Task
                </button>
              </form>
            </div>
          </div>

          {/* Right column — tasks */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-semibold">My Tasks</h2>
                {filteredTasks.length > LIMIT && (
                  <button onClick={() => setShowAllTasks(prev => !prev)} className="text-sm text-green-600 hover:underline">
                    {showAllTasks ? "Show less" : `View all ${filteredTasks.length}`}
                  </button>
                )}
              </div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {[
                  { key: "all", label: "All", count: tasks.length },
                  { key: "needsAction", label: "Needs Action", count: needsActionTasks },
                  { key: "waiting", label: "Waiting", count: waitingTasks },
                  { key: "closed", label: "Closed", count: completedTasks },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => { setTaskFilter(f.key); setShowAllTasks(false) }}
                    className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${taskFilter === f.key ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500 border-gray-200 hover:border-green-400"}`}
                  >
                    {f.label} <span className="ml-1 opacity-70">{f.count}</span>
                  </button>
                ))}
              </div>
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-sm">No tasks yet.</p>
              ) : (
                <div className="space-y-4 overflow-y-auto max-h-[560px] pr-1">
                  {visibleTasks.map((task) => {
                    const available = getAvailableTransitions(task.workflow_id, task.current_state_id)
                    const stateName = getStateName(task.workflow_id, task.current_state_id)
                    const stateKey = stateName.toLowerCase()
                    const stateBadge = /approved|completed|done/.test(stateKey)
                      ? "bg-green-100 text-green-700"
                      : /rejected|cancelled|denied/.test(stateKey)
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                    const hasTransitions = (auditLogs[task.id] || []).length > 0
                    const badgeLabel = hasTransitions ? stateName : "Submitted"
                    const badgeClass = hasTransitions ? stateBadge : "bg-blue-100 text-blue-700"
                    const lastReviewer = [...(auditLogs[task.id] || [])]
                      .reverse()
                      .find((l) => l.performed_by_username && l.from_state_id)
                      ?.performed_by_username
                    return (
                      <div key={task.id} className="border rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{task.title}</p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize flex-shrink-0 ml-2 ${badgeClass}`}>
                            {badgeLabel}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">
                          {getWorkflowName(task.workflow_id)}
                          {lastReviewer && <span className="ml-2">· Reviewed by <span className="font-medium text-gray-500">{lastReviewer}</span></span>}
                        </p>
                        {task.description && (
                          <p className="text-xs text-gray-600 mb-3 leading-relaxed">{task.description}</p>
                        )}
                        {/* Progress stepper */}
                        {(() => {
                          const ordered = getOrderedStates(task.workflow_id)
                          if (ordered.length < 2) return null
                          const currentIndex = ordered.findIndex(s => s.id === task.current_state_id)
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
                        <button
                          onClick={() => { markTaskRead(task.id); navigate(`/tasks/${task.id}`) }}
                          className="text-xs text-green-700 hover:underline mb-2 inline-block"
                        >
                          View full detail →
                        </button>

                        {available.length > 0 && pending?.taskId !== task.id && (
                          <div className="flex flex-wrap gap-2">
                            {available.map((t) => (
                              <button
                                key={t.id}
                                onClick={() => setPending({ taskId: task.id, toStateId: t.to_state_id, stateName: getStateName(task.workflow_id, t.to_state_id) })}
                                className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                              >
                                Move to {getStateName(task.workflow_id, t.to_state_id)}
                              </button>
                            ))}
                          </div>
                        )}

                        {pending?.taskId === task.id && (
                          <div className="mt-2 border border-green-200 rounded-xl p-3 bg-white space-y-2">
                            <p className="text-xs font-medium text-gray-600">
                              Move to <span className="text-green-700">{pending.stateName}</span> — add a note for the reviewer (optional).
                            </p>
                            <textarea
                              className="w-full border rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-green-400"
                              rows={2}
                              placeholder="e.g. I've updated the details as requested"
                              value={pendingComment}
                              onChange={(e) => setPendingComment(e.target.value)}
                              autoFocus
                            />
                            <div className="flex items-center gap-3">
                              <button
                                onClick={async () => { await handleTriggerTransition(task.id, pending.toStateId, pendingComment || null); setPending(null); setPendingComment("") }}
                                className="text-xs bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 font-medium"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => { setPending(null); setPendingComment("") }}
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

        {/* Activity — full width */}
        {tasks.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold">Activity</h2>
              <span className="text-xs text-gray-400">{allLogs.length} entries</span>
            </div>
            {allLogs.length === 0 ? (
              <p className="text-gray-500 text-sm">No activity yet.</p>
            ) : (
              <>
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
                    {visibleLogs.map(log => (
                      <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2 pr-3">{log.task.title}</td>
                        <td className="py-2 pr-3">{log.from_state_id ? getStateName(log.task.workflow_id, log.from_state_id) : "—"}</td>
                        <td className="py-2 pr-3">{getStateName(log.task.workflow_id, log.to_state_id)}</td>
                        <td className="py-2 text-xs text-gray-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalActivityPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-4">
                    <button
                      onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                      disabled={activityPage === 1}
                      className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-500 hover:border-green-400 disabled:opacity-30 disabled:cursor-not-allowed"
                    >←</button>
                    {Array.from({ length: totalActivityPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setActivityPage(p)}
                        className={`px-2.5 py-1 text-xs rounded border transition-colors ${activityPage === p ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-500 hover:border-green-400"}`}
                      >{p}</button>
                    ))}
                    <button
                      onClick={() => setActivityPage(p => Math.min(totalActivityPages, p + 1))}
                      disabled={activityPage === totalActivityPages}
                      className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-500 hover:border-green-400 disabled:opacity-30 disabled:cursor-not-allowed"
                    >→</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
