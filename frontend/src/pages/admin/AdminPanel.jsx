import { useState } from "react"
import { useAdmin } from "../../hooks/useAdmin"
import { clearAuth } from "../../services/authStorage"
import { useNavigate } from "react-router-dom"
import logo from "../../assets/logo.png"

const TABS = ["Workflow Builder", "Users", "Tasks", "Audit Logs"]
const PRESET_STATES = ["Under Review", "In Progress", "Approved", "Rejected", "Changes Requested", "Completed", "Cancelled"]

export default function AdminPanel() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("Workflow Builder")
  const [confirmDeactivate, setConfirmDeactivate] = useState(null)
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [showAllLogs, setShowAllLogs] = useState(false)
  const LIMIT = 5
  const {
    workflows, selectedWorkflow, states, transitions,
    tasks, users, auditLogs, error,
    newWorkflowName, setNewWorkflowName,
    newState, setNewState,
    newTransition, setNewTransition,
    newUser, setNewUser,
    handleSelectWorkflow,
    handleCreateWorkflow,
    handleCreateState,
    handleCreateTransition,
    handleCreateUser,
    handleDeactivateUser,
    handleTriggerTransition,
    getStateName,
    getStateNameFromMap,
    getStateNameForAuditLog,
    getWorkflowName,
    getAvailableAdminTransitions,
  } = useAdmin()

  function handleLogout() {
    clearAuth()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-green-100">
      {/* Top bar */}
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center border-b-2 border-green-600">
        <div className="flex items-center gap-2">
          <img src={logo} alt="logo" className="w-8 h-8 object-contain" />
          <h1 className="text-xl font-bold text-green-700">Cogflow</h1>
          <span className="text-gray-400 font-light">|</span>
          <span className="text-sm font-medium text-gray-500">Admin</span>
        </div>
        <button onClick={handleLogout} className="text-sm font-bold text-green-900 hover:underline">
          Logout
        </button>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b px-6">
        <div className="max-w-4xl mx-auto flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-green-600 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4">
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Workflow Builder */}
        {activeTab === "Workflow Builder" && (
          <div className="space-y-8">
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Workflow Builder</h2>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  className="flex-1 border rounded px-3 py-2 text-sm"
                  placeholder="Workflow name"
                  value={newWorkflowName}
                  onChange={e => setNewWorkflowName(e.target.value)}
                />
                <button
                  onClick={handleCreateWorkflow}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-green-700 hover:shadow-md transition-all"
                >
                  Create Workflow
                </button>
              </div>

              {workflows.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Select a workflow to configure:</p>
                  <div className="flex flex-wrap gap-2">
                    {workflows.map(wf => (
                      <button
                        key={wf.id}
                        onClick={() => handleSelectWorkflow(wf)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${selectedWorkflow?.id === wf.id ? "bg-green-600 text-white border-green-600 shadow-sm" : "bg-white text-gray-600 hover:bg-green-50 hover:border-green-400"}`}
                      >
                        {wf.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedWorkflow && (
                <div className="border-t pt-4 space-y-6">
                  <p className="text-sm font-semibold text-gray-700">Configuring: {selectedWorkflow.name}</p>

                  <div>
                    <p className="text-sm font-medium mb-2">Add State</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <select
                        className="border rounded px-3 py-2 text-sm"
                        value=""
                        onChange={e => { if (e.target.value) setNewState(prev => ({ ...prev, name: e.target.value })) }}
                      >
                        <option value="">Quick select...</option>
                        {PRESET_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input
                        type="text"
                        className="border rounded px-3 py-2 text-sm"
                        placeholder="Or type custom name"
                        value={newState.name}
                        onChange={e => setNewState(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={newState.is_initial}
                          onChange={e => setNewState(prev => ({ ...prev, is_initial: e.target.checked }))}
                        />
                        Initial
                      </label>
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={newState.is_final}
                          onChange={e => setNewState(prev => ({ ...prev, is_final: e.target.checked }))}
                        />
                        Final
                      </label>
                      <button
                        onClick={handleCreateState}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-green-700 hover:shadow-md transition-all"
                      >
                        Add State
                      </button>
                    </div>

                    {states.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {states.map(s => (
                          <span key={s.id} className="text-xs bg-green-50 border border-green-200 text-green-800 rounded-full px-3 py-1">
                            {s.name}
                            {s.is_initial && " (initial)"}
                            {s.is_final && " (final)"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {states.length >= 2 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Add Transition</p>
                      <div className="flex flex-wrap gap-2 items-center">
                        <select
                          className="border rounded px-3 py-2 text-sm"
                          value={newTransition.from_state_id}
                          onChange={e => setNewTransition(prev => ({ ...prev, from_state_id: e.target.value }))}
                        >
                          <option value="">From state</option>
                          {states.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <span className="text-sm text-gray-500">→</span>
                        <select
                          className="border rounded px-3 py-2 text-sm"
                          value={newTransition.to_state_id}
                          onChange={e => {
                            const toId = e.target.value
                            const toState = states.find(s => s.id === toId)
                            setNewTransition(prev => ({
                              ...prev,
                              to_state_id: toId,
                              required_role: toState && /approved|rejected|completed|changes requested/i.test(toState.name) ? "reviewer" : prev.required_role
                            }))
                          }}
                        >
                          <option value="">To state</option>
                          {states.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <select
                          className="border rounded px-3 py-2 text-sm"
                          value={newTransition.required_role}
                          onChange={e => setNewTransition(prev => ({ ...prev, required_role: e.target.value }))}
                        >
                          <option value="user">user</option>
                          <option value="reviewer">reviewer</option>
                          <option value="admin">admin</option>
                        </select>
                        <button
                          onClick={handleCreateTransition}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-green-700 hover:shadow-md transition-all"
                        >
                          Add Transition
                        </button>
                      </div>

                      {transitions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {transitions.map(t => (
                            <span key={t.id} className="text-xs bg-green-50 border border-green-200 text-green-800 rounded-full px-3 py-1">
                              {getStateName(t.from_state_id)} → {getStateName(t.to_state_id)} · {t.required_role}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === "Users" && (
          <div className="bg-white rounded shadow p-6">
            <h2 className="text-lg font-semibold mb-4">User Management</h2>

            <p className="text-sm font-medium mb-2">Create New User</p>
            <div className="flex flex-wrap gap-2 mb-6 items-end">
              <input
                type="text"
                autoComplete="off"
                className="border rounded px-3 py-2 text-sm"
                placeholder="Username"
                value={newUser.username}
                onChange={e => setNewUser(prev => ({ ...prev, username: e.target.value }))}
              />
              <input
                type="text"
                autoComplete="off"
                className="border rounded px-3 py-2 text-sm"
                placeholder="Email"
                value={newUser.email}
                onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              />
              <input
                type="password"
                autoComplete="new-password"
                className="border rounded px-3 py-2 text-sm"
                placeholder="Password"
                value={newUser.password}
                onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              />
              <select
                className="border rounded px-3 py-2 text-sm"
                value={newUser.role}
                onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
              >
                <option value="user">user</option>
                <option value="reviewer">reviewer</option>
                <option value="admin">admin</option>
              </select>
              <button
                onClick={handleCreateUser}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-green-700 hover:shadow-md transition-all"
              >
                Create
              </button>
            </div>

            {users.length > 0 && (
              <>
                <p className="text-sm font-medium mb-2">Existing Users</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2">Username</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Role</th>
                      <th className="pb-2">Active</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-2">{u.username}</td>
                        <td className="py-2">{u.email}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === "admin" ? "bg-red-100 text-red-700" : u.role === "reviewer" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2">{u.is_active ? "Yes" : "No"}</td>
                        <td className="py-2">
                          {u.is_active && u.role !== "admin" && (
                            <button
                              onClick={() => setConfirmDeactivate(u)}
                              className="text-xs font-bold text-green-700 hover:underline"
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* Tasks */}
        {activeTab === "Tasks" && (
          <div className="bg-white rounded shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">All Tasks</h2>
              {tasks.length > LIMIT && (
                <button onClick={() => setShowAllTasks(prev => !prev)} className="text-sm text-green-600 hover:underline">
                  {showAllTasks ? "Show less" : `View all ${tasks.length}`}
                </button>
              )}
            </div>
            {tasks.length === 0 ? (
              <p className="text-gray-500 text-sm">No tasks in the system.</p>
            ) : (
              <div className="space-y-3">
                {(showAllTasks ? tasks : tasks.slice(0, LIMIT)).map(task => {
                  const available = getAvailableAdminTransitions(task.workflow_id, task.current_state_id)
                  const adminTransitions = available.filter(t => t.required_role === "admin")
                  const waitingFor = [...new Set(available.filter(t => t.required_role !== "admin").map(t => t.required_role))]
                  const stateName = getStateNameFromMap(task.workflow_id, task.current_state_id)
                  const stateKey = stateName.toLowerCase()
                  const stateBadge = /approved|completed|done/.test(stateKey)
                    ? "bg-green-100 text-green-700"
                    : /rejected|cancelled|denied/.test(stateKey)
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                  return (
                    <div key={task.id} className="border rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{task.title}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stateBadge}`}>
                          {stateName}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Workflow: {getWorkflowName(task.workflow_id)}</p>
                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        {adminTransitions.map(t => (
                          <button
                            key={t.id}
                            onClick={() => handleTriggerTransition(task.id, t.to_state_id)}
                            className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            Move to {getStateNameFromMap(task.workflow_id, t.to_state_id)}
                          </button>
                        ))}
                        {waitingFor.map(role => (
                          <span key={role} className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                            Waiting for {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Audit Logs */}
        {activeTab === "Audit Logs" && (
          <div className="bg-white rounded shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Audit Logs</h2>
              {auditLogs.length > LIMIT && (
                <button onClick={() => setShowAllLogs(prev => !prev)} className="text-sm text-green-600 hover:underline">
                  {showAllLogs ? "Show less" : `View all ${auditLogs.length}`}
                </button>
              )}
            </div>
            {auditLogs.length === 0 ? (
              <p className="text-gray-500 text-sm">No audit logs yet.</p>
            ) : (
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
                  {(showAllLogs ? auditLogs : auditLogs.slice(0, LIMIT)).map(log => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="py-2">{tasks.find(t => t.id === log.task_id)?.title || log.task_id.slice(0, 8) + "…"}</td>
                      <td className="py-2">{getStateNameForAuditLog(log.task_id, log.from_state_id)}</td>
                      <td className="py-2">{getStateNameForAuditLog(log.task_id, log.to_state_id)}</td>
                      <td className="py-2 text-xs text-gray-400">{new Date(log.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>

      {confirmDeactivate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Warning</h3>
            <p className="text-sm text-gray-600 mb-1">
              You are about to deactivate <span className="font-medium">{confirmDeactivate.username}</span>.
            </p>
            <p className="text-sm text-red-600 mb-6">This will block them from logging in. Are you sure?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeactivate(null)}
                className="px-4 py-2 text-sm rounded border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { handleDeactivateUser(confirmDeactivate.id); setConfirmDeactivate(null) }}
                className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
