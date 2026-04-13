import { useEffect } from "react"
import { useDashboard } from "../../hooks/useDashboard"

export default function Dashboard() {
  const {
    tasks,
    workflows,
    selectedWorkflowId,
    setSelectedWorkflowId,
    newTaskTitle,
    setNewTaskTitle,
    error,
    loading,
    handleSubmitTask,
    handleTriggerTransition,
    handleLogout,
    getStateName,
    getWorkflowName,
    getAvailableTransitions,
    loadTransitions,
  } = useDashboard()

  useEffect(() => {
    tasks.forEach((task) => loadTransitions(task.workflow_id))
  }, [tasks])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Workflow Engine</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:underline"
        >
          Logout
        </button>
      </div>

      <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Submit New Task */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Submit New Task</h2>
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
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Submit Task
            </button>
          </form>
        </div>

        {/* My Tasks */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">My Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-sm">No tasks yet.</p>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => {
                const available = getAvailableTransitions(task.workflow_id, task.current_state_id)
                return (
                  <div key={task.id} className="border rounded p-4">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-gray-500">
                      Workflow: {getWorkflowName(task.workflow_id)}
                    </p>
                    <p className="text-sm text-gray-500">
                      State: {getStateName(task.workflow_id, task.current_state_id)}
                    </p>
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
          )}
        </div>
      </div>
    </div>
  )
}
