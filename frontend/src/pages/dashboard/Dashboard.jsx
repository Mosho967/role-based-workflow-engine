import { useEffect, useState, Fragment } from "react"
import { useDashboard } from "../../hooks/useDashboard"
import logo from "../../assets/logo.png"

export default function Dashboard() {
  const {
    tasks,
    workflows,
    auditLogs,
    selectedWorkflowId,
    setSelectedWorkflowId,
    newTaskTitle,
    setNewTaskTitle,
    error,
    loading,
    handleSubmitTask,
    handleTriggerTransition,
    role,
    handleLogout,
    getStateName,
    getWorkflowName,
    getAvailableTransitions,
    isStateFinal,
    getOrderedStates,
    loadTransitions,
  } = useDashboard()

  const [showAllTasks, setShowAllTasks] = useState(false)
  const [showAllActivity, setShowAllActivity] = useState(false)

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
  const visibleTasks = showAllTasks ? sortedTasks : sortedTasks.slice(0, LIMIT)
  const allLogs = tasks.flatMap(task =>
    (auditLogs[task.id] || []).map(log => ({ ...log, task }))
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const visibleLogs = showAllActivity ? allLogs : allLogs.slice(0, LIMIT)

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => isStateFinal(t.workflow_id, t.current_state_id)).length
  const activeTasks = totalTasks - completedTasks
  const needsActionTasks = tasks.filter(t => getAvailableTransitions(t.workflow_id, t.current_state_id).length > 0).length

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
        <button
          onClick={handleLogout}
          className="text-sm font-bold text-green-900 hover:underline"
        >
          Logout
        </button>
      </div>

      <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Stats Row */}
        {totalTasks > 0 && (
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
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Completed</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-4 text-center">
              <p className="text-3xl font-bold text-amber-500">{needsActionTasks}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Needs Action</p>
            </div>
          </div>
        )}

        {/* Submit New Task */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">New Task</h2>
          <form onSubmit={handleSubmitTask} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Workflow</label>
              <select
                className="w-full border rounded px-3 py-2"
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
                className="w-full border rounded px-3 py-2"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Submit Task
            </button>
          </form>
        </div>

        {/* My Tasks */}
        <div className="bg-white rounded shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">My Tasks</h2>
            {tasks.length > LIMIT && (
              <button onClick={() => setShowAllTasks(prev => !prev)} className="text-sm text-green-600 hover:underline">
                {showAllTasks ? "Show less" : `View all ${tasks.length}`}
              </button>
            )}
          </div>
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-sm">No tasks yet.</p>
          ) : (
            <>
              <div className="space-y-4">
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
                  return (
                    <div key={task.id} className="border rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{task.title}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        Workflow: {getWorkflowName(task.workflow_id)}
                      </p>
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
                                    <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                                      isPast ? "bg-green-500 border-green-500" :
                                      isCurrent ? "bg-green-600 border-green-600 ring-2 ring-green-200" :
                                      "bg-white border-gray-300"
                                    }`} />
                                    <span className={`text-[10px] mt-1 text-center leading-tight max-w-[52px] truncate ${
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
                        )
                      })()}
                      {available.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {available.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => handleTriggerTransition(task.id, t.to_state_id)}
                              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Move to {getStateName(task.workflow_id, t.to_state_id)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
        {/* Activity */}
        {tasks.length > 0 && (
          <div className="bg-white rounded shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Activity</h2>
              {allLogs.length > LIMIT && (
                <button onClick={() => setShowAllActivity(prev => !prev)} className="text-sm text-green-600 hover:underline">
                  {showAllActivity ? "Show less" : `View all ${allLogs.length}`}
                </button>
              )}
            </div>
            {allLogs.length === 0 ? (
              <p className="text-gray-500 text-sm">No activity yet.</p>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2">Task</th>
                      <th className="pb-2">From</th>
                      <th className="pb-2">To</th>
                      <th className="pb-2">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleLogs.map(log => (
                      <tr key={log.id} className="border-b last:border-0">
                        <td className="py-2">{log.task.title}</td>
                        <td className="py-2">{log.from_state_id ? getStateName(log.task.workflow_id, log.from_state_id) : "—"}</td>
                        <td className="py-2">{getStateName(log.task.workflow_id, log.to_state_id)}</td>
                        <td className="py-2 text-xs text-gray-400">{new Date(log.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
